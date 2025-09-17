import { Request, Response } from "express";
import { WebSocketManager } from "../services/websocket";
import { LatencyProfiler } from "../services/latencyProfiler";
import { FoodHubService } from "../services/foodhubService";
import { OpenAIClient } from "../services/openaiClient";
import { Client } from "../models/Client";
import { CallRecord } from "../models/CallRecord";
import { mongoDBService } from "../services/mongodb";
import { PROMPTS, buildPrompt } from "../prompts";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../../.env") });

const foodhubService = new FoodHubService();
const openaiClient = new OpenAIClient();

interface ClientTranscript {
  clientId: string;
  phoneNumber: string;
  transcript: string;
  duration: number;
  direction: 'inbound' | 'outbound';
  timestamp: string;
  audioUrl?: string;
  metadata?: {
    callerId?: string;
    location?: string;
    device?: string;
  };
}

interface MoodAnalysis {
  mood: 'positive' | 'neutral' | 'negative';
  sentiment: number; // -1 to 1
  confidence: number;
  keywords: string[];
  emotions: string[];
}

export function clientTranscriptWebhook(
  wsManager: WebSocketManager,
  latencyProfiler: LatencyProfiler
) {
  return async (req: Request, res: Response) => {
    const endTiming = latencyProfiler.startTiming("client_transcript");

    try {
      const transcriptData: ClientTranscript = req.body;

      // Validate required fields
      if (!transcriptData.clientId || !transcriptData.phoneNumber || !transcriptData.transcript) {
        return res.status(400).json({ 
          error: "Missing required fields: clientId, phoneNumber, transcript" 
        });
      }

      console.log(`📞 Client Transcript: ${transcriptData.phoneNumber} - ${transcriptData.transcript.substring(0, 50)}...`);

      // Find or create client
      let client = await Client.findOne({ phoneNumber: transcriptData.phoneNumber });
      if (!client) {
        client = new Client({
          phoneNumber: transcriptData.phoneNumber,
          status: 'prospect',
          totalCalls: 0
        });
        await client.save();
        console.log(`👤 Created new client: ${transcriptData.phoneNumber}`);
      }

      // Analyze client mood and sentiment
      const moodAnalysis = await analyzeClientMood(transcriptData.transcript);
      console.log(`😊 Mood Analysis:`, moodAnalysis);

      // Get client history
      const clientHistory = await CallRecord.find({ clientId: client._id })
        .sort({ timestamp: -1 })
        .limit(5)
        .lean();
      console.log(`📚 Client History: ${clientHistory.length} previous interactions`);

      // Generate AI sales suggestions based on transcript and history
      const salesSuggestions = await generateSalesSuggestions(
        transcriptData.transcript,
        moodAnalysis,
        clientHistory,
        transcriptData.phoneNumber
      );

      console.log(`🤖 Generated ${salesSuggestions.suggestions.length} sales suggestions`);

      // Create call record in MongoDB
      const callStartTime = new Date(transcriptData.timestamp || new Date());
      const callEndTime = new Date(callStartTime.getTime() + (transcriptData.duration || 0) * 1000);
      
      const callRecord = new CallRecord({
        clientId: client._id,
        phoneNumber: transcriptData.phoneNumber,
        timestamp: callStartTime,
        callStartTime: callStartTime,
        callEndTime: callEndTime,
        duration: transcriptData.duration || 0,
        transcript: transcriptData.transcript,
        mood: moodAnalysis.mood,
        sentiment: moodAnalysis.sentiment,
        direction: transcriptData.direction,
        aiSuggestions: salesSuggestions.suggestions,
        outcome: determineCallOutcome(salesSuggestions.suggestions, moodAnalysis),
        metadata: transcriptData.metadata || {}
      });

      await callRecord.save();

      // Update client with latest call info
      await Client.findByIdAndUpdate(client._id, {
        lastCallDate: callRecord.timestamp,
        totalCalls: client.totalCalls + 1,
        lastInteraction: transcriptData.transcript.substring(0, 100) + '...',
        updatedAt: new Date()
      });

      // Broadcast to all connected agents
      const wsMessage = {
        type: 'client_transcript',
        conversationId: transcriptData.clientId,
        callRecord: {
          id: callRecord._id,
          clientId: callRecord.clientId,
          phoneNumber: callRecord.phoneNumber,
          timestamp: callRecord.timestamp,
          duration: callRecord.duration,
          transcript: callRecord.transcript,
          mood: callRecord.mood,
          sentiment: callRecord.sentiment,
          direction: callRecord.direction,
          aiSuggestions: callRecord.aiSuggestions,
          outcome: callRecord.outcome,
          metadata: callRecord.metadata
        },
        moodAnalysis,
        clientHistory: clientHistory.slice(-3), // Last 3 interactions
        latency: endTiming(),
        timestamp: new Date().toISOString()
      };

      wsManager.broadcastToConversation(transcriptData.clientId, wsMessage);

      console.log(`✅ Client transcript processed and broadcasted to agents`);

      res.status(200).json({
        status: "success",
        clientId: transcriptData.clientId,
        callId: callRecord._id,
        moodAnalysis,
        suggestions: salesSuggestions.suggestions,
        latency: endTiming(),
        agentsNotified: wsManager.getConnectionCount()
      });

    } catch (error) {
      console.error("Error processing client transcript:", error);
      endTiming();

      res.status(500).json({
        error: "Failed to process client transcript",
        clientId: req.body.clientId || "unknown"
      });
    }
  };
}

async function analyzeClientMood(transcript: string): Promise<MoodAnalysis> {
  try {
    if (!openaiClient.client) {
      // Fallback to simple keyword-based analysis
      return analyzeMoodWithKeywords(transcript);
    }

    const response = await openaiClient.client.chat.completions.create({
      model: process.env.OPENAI_MODEL, // Force GPT-4o-mini for cost optimization
      messages: [
        {
          role: "system",
          content: PROMPTS.SYSTEM.MOOD_ANALYSIS
        },
        {
          role: "user",
          content: buildPrompt.moodAnalysis(transcript)
        }
      ],
      temperature: 0.3,
      max_tokens: 300
    });

    const content = response.choices?.[0]?.message?.content;
    if (content) {
      return JSON.parse(content);
    }
  } catch (error) {
    console.error("Error in mood analysis:", error);
  }

  // Fallback to keyword analysis
  return analyzeMoodWithKeywords(transcript);
}

function analyzeMoodWithKeywords(transcript: string): MoodAnalysis {
  const text = transcript.toLowerCase();
  
  const positiveKeywords = ['great', 'excellent', 'good', 'perfect', 'love', 'amazing', 'wonderful', 'fantastic', 'yes', 'interested', 'excited'];
  const negativeKeywords = ['bad', 'terrible', 'awful', 'hate', 'disappointed', 'frustrated', 'angry', 'upset', 'no', 'not interested', 'problem'];
  
  const positiveCount = positiveKeywords.filter(keyword => text.includes(keyword)).length;
  const negativeCount = negativeKeywords.filter(keyword => text.includes(keyword)).length;
  
  let mood: 'positive' | 'neutral' | 'negative';
  let sentiment: number;
  
  if (positiveCount > negativeCount) {
    mood = 'positive';
    sentiment = Math.min(0.8, 0.3 + (positiveCount * 0.1));
  } else if (negativeCount > positiveCount) {
    mood = 'negative';
    sentiment = Math.max(-0.8, -0.3 - (negativeCount * 0.1));
  } else {
    mood = 'neutral';
    sentiment = 0;
  }
  
  return {
    mood,
    sentiment,
    confidence: 0.7,
    keywords: [...positiveKeywords, ...negativeKeywords].filter(keyword => text.includes(keyword)),
    emotions: mood === 'positive' ? ['satisfied', 'interested'] : 
             mood === 'negative' ? ['frustrated', 'concerned'] : 
             ['neutral', 'curious']
  };
}

async function getClientHistory(clientId: string): Promise<any[]> {
  const callHistory = await CallRecord.find({ clientId })
    .sort({ timestamp: -1 })
    .limit(5)
    .lean();
  
  return callHistory.map(call => ({
    id: call._id,
    timestamp: call.timestamp,
    transcript: call.transcript,
    mood: call.mood,
    sentiment: call.sentiment,
    outcome: call.outcome
  }));
}

async function generateSalesSuggestions(
  transcript: string,
  moodAnalysis: MoodAnalysis,
  clientHistory: any[],
  phoneNumber: string
): Promise<any> {
  try {
    if (!openaiClient.client) {
      return generateMockSalesSuggestions(transcript, moodAnalysis);
    }

    // Get relevant FoodHub context
    const foodHubContext = foodhubService.getFoodHubContext();
    const relevantContext = await foodhubService.extractRelevantContext(transcript);
    const productInfo = foodhubService.getProductInfo(transcript);

    // Build context-aware prompt
    const prompt = buildPrompt.salesSuggestions(transcript, moodAnalysis, clientHistory, relevantContext, productInfo);

    const response = await openaiClient.client.chat.completions.create({
      model: process.env.OPENAI_MODEL, // Force GPT-4o-mini for cost optimization
      messages: [
        {
          role: "system",
          content: PROMPTS.SYSTEM.SALES_AGENT_SIMPLE
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const content = response.choices?.[0]?.message?.content;
    if (content) {
      return JSON.parse(content);
    }
  } catch (error) {
    console.error("Error generating sales suggestions:", error);
  }

  return generateMockSalesSuggestions(transcript, moodAnalysis);
}

function generateMockSalesSuggestions(transcript: string, moodAnalysis: MoodAnalysis): any {
  // Generate mock short cues based on mood
  const mockCues = {
    positive: ["suggest demo", "ask about timeline", "mention features"],
    neutral: ["ask about needs", "check budget", "offer information"],
    negative: ["address concerns", "ask about issues", "offer support"]
  };
  
  const cues = mockCues[moodAnalysis.mood as keyof typeof mockCues] || mockCues.neutral;
  
  // Generate mock cue + detailed message based on mood
  const mockSuggestions = {
    positive: {
      cue: "suggest demo",
      message: "Customer seems engaged and interested. Offer to schedule a live demo to show FoodHub's key features that match their restaurant needs."
    },
    neutral: {
      cue: "ask about needs", 
      message: "Customer is in discovery mode. Ask specific questions about their current restaurant challenges to understand how FoodHub can help."
    },
    negative: {
      cue: "address concerns",
      message: "Customer has reservations or concerns. Listen actively to their issues and explain how FoodHub specifically addresses those pain points."
    }
  };
  
  const suggestion = mockSuggestions[moodAnalysis.mood as keyof typeof mockSuggestions] || mockSuggestions.neutral;
  
  const suggestions = [
    {
      text: suggestion.cue,
      offer_id: "mock_cue",
      type: "cue",
      confidence: 0.7,
      deliver_as: 'say',
      reasoning: `Mock cue for ${moodAnalysis.mood} mood`
    },
    {
      text: suggestion.message,
      offer_id: "mock_message", 
      type: "detailed_message",
      confidence: 0.7,
      deliver_as: 'say',
      reasoning: `Mock detailed message for ${moodAnalysis.mood} mood`
    }
  ];

  return {
    suggestions,
    metadata: {
      reason: `Generated suggestions based on ${moodAnalysis.mood} mood and customer needs`,
      used_context_ids: ['mood-analysis', 'transcript-analysis'],
      mood_considerations: `Customer mood (${moodAnalysis.mood}) influenced the approach`
    }
  };
}

function determineCallOutcome(suggestions: any[], moodAnalysis: MoodAnalysis): string {
  if (moodAnalysis.mood === 'positive' && suggestions.some(s => s.type === 'product_recommendation')) {
    return 'successful';
  } else if (moodAnalysis.mood === 'negative') {
    return 'follow_up';
  } else if (suggestions.some(s => s.type === 'empathy_response')) {
    return 'follow_up';
  } else {
    return 'follow_up';
  }
}
