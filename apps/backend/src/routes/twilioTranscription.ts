import { Request, Response } from 'express';
import { WebSocketManager } from '../services/websocket';
import { LatencyProfiler } from '../services/latencyProfiler';
import { CallRecord } from '../models/CallRecord';
import { CallAnalysisService } from '../services/callAnalysisService';
import { rateLimiter } from '../services/rateLimiter';
import { ExternalWebhookService } from '../services/externalWebhookService';

// Global type declaration for processing states and caching
declare global {
  var processingStates: Map<string, {
    lastProcessed: number;
    lastSpeaker: string;
    transcriptBuffer: string;
    processingCount: number;
    lastMeaningfulChunk: string;
    cooldownUntil: number;
  }> | undefined;
  var emotionCache: Map<string, any> | undefined;
  var autoCompleteTimeouts: Map<string, NodeJS.Timeout> | undefined;
}

interface TwilioTranscriptionData {
  CallSid: string;
  TranscriptionSid: string;
  TranscriptionText: string;
  TranscriptionStatus: string;
  TranscriptionUrl: string;
  RecordingSid: string;
  RecordingUrl: string;
}

export function twilioTranscriptionWebhook(
  wsManager: WebSocketManager,
  latencyProfiler: LatencyProfiler
) {
  return async (req: Request, res: Response) => {
    const endTiming = latencyProfiler.startTiming("twilio_transcription_webhook");

    try {
      const form = req.body;
      const transcriptionData = form.TranscriptionData;
      const track = form.Track; // inbound_track or outbound_track
      const callSid = form.CallSid;
      const fromNumber = form.From; // Phone number from Twilio
      let speaker = "Customer";
      if (track && track.includes("outbound")) speaker = "Agent";

      console.log(`📝 Twilio Transcription: ${callSid}`);
      console.log(`📱 From: ${fromNumber}`);
      console.log(`📊 Track: ${track}`);
      console.log(`👤 Speaker: ${speaker}`);
      console.log(`📄 Raw Data: ${transcriptionData}`);

      if (transcriptionData) {
        try {
          const data = JSON.parse(transcriptionData);
          const transcript = data.transcript;
          const confidence = data.confidence;

          console.log(`${speaker}: ${transcript} (Confidence: ${confidence})`);

          // Find the call record by phone number (more reliable than CallSid)
          let callRecord = null;
          
          if (fromNumber) {
            // First try to find by phone number and status
            callRecord = await CallRecord.findOne({
              phoneNumber: fromNumber,
              status: 'in_progress'
            }).sort({ timestamp: -1 });
            console.log(`🔍 Looking for call record by phone: ${fromNumber}`);
            
            // Debug: Check what call records exist for this phone number
            const allCallsForPhone = await CallRecord.find({ phoneNumber: fromNumber }).sort({ timestamp: -1 });
            console.log(`📊 Found ${allCallsForPhone.length} call records for phone ${fromNumber}:`);
            allCallsForPhone.forEach((call, index) => {
              console.log(`   ${index + 1}. ${call._id} - Status: ${call.status} - Transcript: "${call.transcript.substring(0, 50)}..."`);
            });
          }
          
          // If not found by phone number, try by CallSid as fallback
          if (!callRecord) {
            callRecord = await CallRecord.findOne({
              'metadata.callSid': callSid
            });
            console.log(`🔍 Looking for call record by CallSid: ${callSid}`);
          }
          
          // If still not found, try to find any recent in-progress call
          if (!callRecord) {
            console.log(`⚠️ Call record not found for ${fromNumber || callSid}, trying to find recent call`);
            callRecord = await CallRecord.findOne({
              status: 'in_progress'
            }).sort({ timestamp: -1 });
          }

          if (callRecord) {
            console.log(`✅ Found call record: ${callRecord._id} for phone: ${callRecord.phoneNumber}`);
            
            // Update the call record with the transcription
            const currentTranscript = callRecord.transcript || '';
            const updatedTranscript = currentTranscript + (currentTranscript ? ' ' : '') + `[${speaker}]: ${transcript}`;
            
            await CallRecord.findByIdAndUpdate(callRecord._id, {
              transcript: updatedTranscript,
              metadata: {
                ...callRecord.metadata,
                lastTranscription: {
                  speaker,
                  text: transcript,
                  confidence,
                  track,
                  timestamp: new Date()
                }
              }
            });

            console.log(`✅ Call record updated with transcription: ${callRecord._id}`);
            console.log(`📄 Updated transcript: "${updatedTranscript}"`);
            
            // Broadcast live transcript to connected agents
            const wsMessage = {
              type: 'live_transcript_chunk',
              callSid: callSid,
              speaker: speaker,
              transcript: transcript,
              fullTranscript: updatedTranscript,
              confidence: confidence,
              timestamp: new Date().toISOString()
            };

            wsManager.broadcastToAll(wsMessage);

            // Smart AI processing with conversation state awareness
            await handleSmartAIProcessing(callRecord, updatedTranscript, wsManager, speaker);
          } else {
            console.log(`⚠️ Call record not found for CallSid: ${callSid}`);
          }

        } catch (e) {
          console.log("❌ Failed to parse TranscriptionData:", e);
          console.log("Raw transcription data:", transcriptionData);
        }
      } else {
        console.log("⚠️ No transcription data received");
      }

      res.status(200).send('OK');
      endTiming();

    } catch (error) {
      console.error('❌ Twilio transcription webhook error:', error);
      endTiming();
      res.status(500).send('Internal Server Error');
    }
  };
}

// Enhanced emotion analysis function
async function analyzeCustomerEmotions(transcript: string, callRecord: any): Promise<any> {
  try {
    // Get past customer transcripts for context
    const pastCalls = await CallRecord.find({ 
      clientId: callRecord.clientId,
      _id: { $ne: callRecord._id }
    })
    .sort({ timestamp: -1 })
    .limit(3)
    .lean();

    // Extract customer-only parts from past calls
    const pastCustomerTranscripts = pastCalls.map(call => {
      if (!call.transcript) return '';
      const customerParts = call.transcript
        .split(/\[Customer\]:|\[Agent\]:/)
        .filter((part, index) => index % 2 === 1) // Customer parts
        .join(' ')
        .trim();
      return customerParts;
    }).filter(t => t.length > 0);

    // Combine current and past customer transcripts
    const currentCustomerParts = transcript
      .split(/\[Customer\]:|\[Agent\]:/)
      .filter((part, index) => index % 2 === 1)
      .join(' ')
      .trim();

    const allCustomerTranscripts = [currentCustomerParts, ...pastCustomerTranscripts]
      .filter(t => t.length > 0)
      .join(' ');

    // Enhanced emotion analysis using keywords and patterns
    const emotions = analyzeEmotionKeywords(allCustomerTranscripts);
    
    return {
      mood: emotions.primaryMood,
      sentiment: emotions.sentimentScore,
      confidence: emotions.confidence,
      emotions: emotions.detectedEmotions,
      emotionScores: emotions.emotionScores,
      context: {
        currentTranscript: currentCustomerParts,
        pastTranscripts: pastCustomerTranscripts,
        conversationHistory: pastCalls.length
      }
    };
  } catch (error) {
    console.error('Error in emotion analysis:', error);
    return {
      mood: 'neutral',
      sentiment: 0.5,
      confidence: 0.3,
      emotions: ['neutral'],
      emotionScores: { neutral: 1.0 },
      context: { currentTranscript: transcript, pastTranscripts: [], conversationHistory: 0 }
    };
  }
}

function analyzeEmotionKeywords(text: string): any {
  const lowerText = text.toLowerCase();
  
  // Emotion keywords and their weights
  const emotionKeywords = {
    // Positive emotions
    happy: ['happy', 'excited', 'great', 'wonderful', 'fantastic', 'amazing', 'love', 'perfect', 'excellent', 'thrilled'],
    satisfied: ['satisfied', 'pleased', 'good', 'nice', 'okay', 'fine', 'acceptable', 'decent'],
    confident: ['confident', 'sure', 'certain', 'definitely', 'absolutely', 'convinced', 'positive'],
    
    // Negative emotions
    frustrated: ['frustrated', 'annoyed', 'irritated', 'upset', 'angry', 'mad', 'furious', 'disappointed'],
    confused: ['confused', 'unclear', 'don\'t understand', 'not sure', 'puzzled', 'lost', 'bewildered'],
    worried: ['worried', 'concerned', 'anxious', 'nervous', 'stressed', 'troubled', 'uneasy'],
    disappointed: ['disappointed', 'let down', 'disheartened', 'discouraged', 'disillusioned'],
    
    // Neutral emotions
    neutral: ['okay', 'fine', 'alright', 'sure', 'yes', 'no', 'maybe', 'perhaps'],
    curious: ['curious', 'interested', 'wondering', 'asking', 'questioning', 'inquisitive']
  };

  const emotionScores: Record<string, number> = {};
  let totalMatches = 0;

  // Calculate emotion scores
  Object.keys(emotionKeywords).forEach(emotion => {
    const keywords = emotionKeywords[emotion as keyof typeof emotionKeywords];
    const matches = keywords.filter((keyword: string) => lowerText.includes(keyword)).length;
    emotionScores[emotion] = matches;
    totalMatches += matches;
  });

  // Normalize scores
  Object.keys(emotionScores).forEach(emotion => {
    emotionScores[emotion] = totalMatches > 0 ? emotionScores[emotion] / totalMatches : 0;
  });

  // Determine primary mood and sentiment
  const primaryEmotion = Object.keys(emotionScores).reduce((a: string, b: string) => 
    emotionScores[a] > emotionScores[b] ? a : b
  );

  const sentimentScore = calculateSentimentScore(emotionScores);
  const primaryMood = mapEmotionToMood(primaryEmotion);
  const confidence = Math.min(1.0, totalMatches * 0.1 + 0.3);

  // Get top 3 emotions
  const detectedEmotions = Object.entries(emotionScores)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 3)
    .map(([emotion, score]) => ({ emotion, score }));

  return {
    primaryMood,
    sentimentScore,
    confidence,
    detectedEmotions: detectedEmotions.map(e => e.emotion),
    emotionScores,
    totalMatches
  };
}

function calculateSentimentScore(emotionScores: any): number {
  const positiveEmotions = ['happy', 'satisfied', 'confident'];
  const negativeEmotions = ['frustrated', 'confused', 'worried', 'disappointed'];
  
  let positiveScore = 0;
  let negativeScore = 0;
  
  positiveEmotions.forEach(emotion => {
    positiveScore += emotionScores[emotion] || 0;
  });
  
  negativeEmotions.forEach(emotion => {
    negativeScore += emotionScores[emotion] || 0;
  });
  
  if (positiveScore + negativeScore === 0) return 0.5;
  
  return positiveScore / (positiveScore + negativeScore);
}

function mapEmotionToMood(emotion: string): string {
  const moodMap: Record<string, string> = {
    'happy': 'positive',
    'satisfied': 'positive',
    'confident': 'positive',
    'frustrated': 'negative',
    'confused': 'negative',
    'worried': 'negative',
    'disappointed': 'negative',
    'neutral': 'neutral',
    'curious': 'neutral'
  };
  
  return moodMap[emotion] || 'neutral';
}

// Smart AI processing with conversation state awareness and caching
async function handleSmartAIProcessing(
  callRecord: any,
  updatedTranscript: string,
  wsManager: WebSocketManager,
  speaker: string
) {
  try {
    const callId = callRecord._id.toString();
    const now = Date.now();
    
    // Get or create processing state for this call
    if (!global.processingStates) {
      global.processingStates = new Map();
    }
    
    let processingState = global.processingStates.get(callId);
    if (!processingState) {
      processingState = {
        lastProcessed: 0,
        lastSpeaker: '',
        transcriptBuffer: '',
        processingCount: 0,
        lastMeaningfulChunk: '',
        cooldownUntil: 0
      };
      global.processingStates.set(callId, processingState);
    }
    
    // Update buffer with new transcript
    processingState.transcriptBuffer = updatedTranscript;
    processingState.lastSpeaker = speaker;
    
    // Check if we should process based on smart conditions
    const shouldProcess = shouldTriggerAIProcessing(processingState, updatedTranscript, speaker, now);
    
    if (shouldProcess) {
      console.log(`🤖 Smart AI processing triggered for call ${callId}`);
      console.log(`📊 Processing stats: count=${processingState.processingCount}, buffer=${updatedTranscript.length} chars`);
      
      // Update processing state
      processingState.lastProcessed = now;
      processingState.processingCount++;
      processingState.lastMeaningfulChunk = updatedTranscript;
      processingState.cooldownUntil = now + 2000; // 2-second cooldown
      
      // Process with enhanced context
      await processTranscriptionForAI(callRecord, updatedTranscript, wsManager);
      
      console.log(`✅ Smart AI processing completed for call ${callId}`);
    } else {
      const skipReason = getSkipReason(processingState, updatedTranscript, speaker, now);
      if (speaker !== 'Customer') {
        console.log(`⏳ Smart AI processing skipped for call ${callId} - agent speaking (AI suggestions only for customers)`);
      } else {
        console.log(`⏳ Smart AI processing skipped for call ${callId} - ${skipReason}`);
      }
    }
    
  } catch (error) {
    console.error(`❌ Error in smart AI processing:`, error);
  }
}

// Determine if AI processing should be triggered based on smart conditions
function shouldTriggerAIProcessing(
  state: any,
  transcript: string,
  speaker: string,
  now: number
): boolean {
  // 1. Only generate AI suggestions for customer speech - never for agent
  if (speaker !== 'Customer') {
    return false;
  }
  
  // 2. Cooldown check - 2 seconds between suggestions
  if (now < state.cooldownUntil) {
    return false;
  }
  
  // 3. Minimum transcript length - REDUCED to 50 for faster triggering
  if (transcript.length < 50) {
    return false;
  }
  
  // 4. Meaningful conversation chunks - REDUCED to 100 characters for faster processing
  const newContent = transcript.substring(state.lastMeaningfulChunk.length);
  if (newContent.length >= 100) {
    return true;
  }
  
  // 5. Question detection - process when customer asks questions
  const questionIndicators = ['?', 'how', 'what', 'when', 'where', 'why', 'can you', 'do you', 'is it'];
  const hasQuestion = questionIndicators.some(indicator => 
    newContent.toLowerCase().includes(indicator)
  );
  if (hasQuestion) {
    return true;
  }
  
  // 6. Sentiment change detection - process when mood shifts
  const sentimentKeywords = {
    positive: ['great', 'excellent', 'love', 'amazing', 'perfect', 'yes', 'sure'],
    negative: ['no', 'not', 'problem', 'issue', 'concern', 'worried', 'expensive'],
    urgent: ['urgent', 'asap', 'quickly', 'immediately', 'now', 'today']
  };
  
  const hasSentimentChange = Object.values(sentimentKeywords).some(keywords =>
    keywords.some(keyword => newContent.toLowerCase().includes(keyword))
  );
  
  if (hasSentimentChange) {
    return true;
  }
  
  // 7. Rate limiting - max 1 processing per 8 seconds, max 20 per call
  if (state.processingCount >= 20) {
    return false;
  }
  
  return false;
}

// Get human-readable skip reason for debugging
function getSkipReason(
  state: any,
  transcript: string,
  speaker: string,
  now: number
): string {
  if (now < state.cooldownUntil) {
    const remaining = Math.ceil((state.cooldownUntil - now) / 1000);
    return `cooldown (${remaining}s remaining)`;
  }
  if (transcript.length < 150) {
    return `transcript too short (${transcript.length} chars)`;
  }
  if (state.processingCount >= 20) {
    return `rate limit reached (${state.processingCount}/20)`;
  }
  return 'no meaningful triggers detected';
}

// Enhanced processTranscriptionForAI function
async function processTranscriptionForAI(
  callRecord: any, 
  transcript: string, 
  wsManager: WebSocketManager
) {
  try {
    console.log(`\n🤖 ===== STARTING ENHANCED AI PROCESSING =====`);
    console.log(`🤖 Processing transcription for AI suggestions: ${JSON.stringify(callRecord)}`);
    console.log(`📄 Current transcript: "${transcript}"`);
    console.log(`📊 Transcript length: ${transcript.length} characters`);
    
    // Import the AI processing functions
    const { determineCallOutcome } = await import('./twilioWebhook');
    
    // Enhanced emotion analysis with past context
    const moodAnalysis = await analyzeCustomerEmotions(transcript, callRecord);
    console.log(`😊 Enhanced Mood Analysis:`, moodAnalysis);
    
    // 🚀 FAST MODE: Generate immediate suggestions
    const fastSuggestions = await generateFastSuggestions(transcript, moodAnalysis);
    console.log('⚡ Fast suggestions generated');
    
    // Parse fast suggestions
    let fastSuggestionsArray = [];
    if (fastSuggestions && fastSuggestions.suggestions) {
      fastSuggestionsArray = Array.isArray(fastSuggestions.suggestions) 
        ? fastSuggestions.suggestions 
        : [];
    }

    // 🚀 IMMEDIATE: Send fast suggestions right away via WebSocket
    const immediateFastSuggestionsMessage = {
      type: 'instant_suggestions',
      callSid: callRecord.metadata?.callSid,
      suggestions: fastSuggestionsArray,
      moodAnalysis: moodAnalysis,
      metadata: {
        reason: 'fast_mode_suggestions',
        used_context_ids: [],
        timestamp: new Date().toISOString(),
        processingTime: Date.now()
      }
    };
    wsManager.broadcastToAll(immediateFastSuggestionsMessage);
    console.log('⚡ IMMEDIATE fast suggestions sent via WebSocket');
    
    // 🚀 PARALLEL PROCESSING: Get comprehensive client history with customer-only transcripts
    const clientHistoryPromise = CallRecord.find({ clientId: callRecord.clientId })
      .sort({ timestamp: -1 })
      .limit(5)
      .lean();
    
    // Start parallel processing (resolve when needed)
    const clientHistory = await clientHistoryPromise;
    console.log('🚀 Client history loaded in parallel');

    // Extract customer conversation patterns
    const customerConversationHistory = clientHistory.map(call => {
      if (!call.transcript) return null;
      const customerParts = call.transcript
        .split(/\[Customer\]:|\[Agent\]:/)
        .filter((part, index) => index % 2 === 1)
        .join(' ')
        .trim();
      return {
        timestamp: call.timestamp,
        transcript: customerParts,
        mood: call.mood,
        sentiment: call.sentiment,
        duration: call.duration
      };
    }).filter(call => call && call.transcript.length > 0);

    // Generate enhanced AI sales suggestions
    const salesSuggestions = await generateEnhancedSalesSuggestions(
      transcript,
      moodAnalysis,
      customerConversationHistory,
      callRecord.phoneNumber
    );

    console.log(`\n🤖 ===== ENHANCED AI RESPONSE ANALYSIS =====`);
    console.log(`📞 Call ID: ${callRecord._id}`);
    console.log(`📱 Phone: ${callRecord.phoneNumber}`);
    console.log(`📄 Transcript: "${transcript}"`);
    console.log(`😊 Mood: ${moodAnalysis.mood} (${moodAnalysis.sentiment})`);
    console.log(`🎭 Emotions: ${moodAnalysis.emotions.join(', ')}`);
    console.log(`🔍 Raw AI Response:`, JSON.stringify(salesSuggestions, null, 2));
    
    // Parse suggestions
    let suggestionsArray = [];
    if (salesSuggestions && salesSuggestions.suggestions) {
      if (Array.isArray(salesSuggestions.suggestions)) {
        suggestionsArray = salesSuggestions.suggestions;
      } else if (typeof salesSuggestions.suggestions === 'string') {
        try {
          suggestionsArray = JSON.parse(salesSuggestions.suggestions);
        } catch (e) {
          console.error('❌ Failed to parse suggestions string:', e);
          suggestionsArray = [];
        }
      }
    }
    
    console.log(`💡 Generated ${suggestionsArray.length} enhanced AI suggestions:`);
    console.log(`\n📋 ENHANCED SUGGESTIONS DETAILS:`);
    suggestionsArray.forEach((suggestion: any, index: number) => {
      console.log(`\n   ${index + 1}. [${suggestion.type.toUpperCase()}]`);
      console.log(`      💬 Text: "${suggestion.text}"`);
      console.log(`      🎯 Confidence: ${(suggestion.confidence * 100).toFixed(1)}%`);
      console.log(`      📤 Deliver as: ${suggestion.deliver_as}`);
      console.log(`      🆔 Offer ID: ${suggestion.offer_id}`);
      console.log(`      😊 Customer Mood: ${suggestion.customer_mood || 'N/A'}`);
      if (suggestion.reasoning) {
        console.log(`      🧠 Reasoning: ${suggestion.reasoning}`);
      }
    });
    console.log(`\n🚀 Broadcasting IMMEDIATE suggestions to ${wsManager.getConnectionCount()} connected clients...`);
    console.log(`==========================================\n`);

    // 🚀 IMMEDIATE: Send suggestions right away via WebSocket
    const immediateSuggestionsMessage = {
      type: 'instant_suggestions',
      callSid: callRecord.metadata?.callSid,
      suggestions: suggestionsArray,
      moodAnalysis: moodAnalysis,
      metadata: {
        reason: 'immediate_suggestions',
        used_context_ids: [],
        timestamp: new Date().toISOString(),
        processingTime: Date.now()
      }
    };
    wsManager.broadcastToAll(immediateSuggestionsMessage);
    console.log('⚡ IMMEDIATE suggestions sent via WebSocket');

    // 🎯 ENHANCED SUGGESTIONS: Send enhanced suggestions with full context
    setImmediate(async () => {
      try {
        console.log('🎯 Starting enhanced suggestions processing...');
        
        // Send enhanced suggestions if available
        if (salesSuggestions && salesSuggestions.suggestions) {
          let enhancedSuggestionsArray = [];
          if (Array.isArray(salesSuggestions.suggestions)) {
            enhancedSuggestionsArray = salesSuggestions.suggestions;
          } else if (typeof salesSuggestions.suggestions === 'string') {
            try {
              enhancedSuggestionsArray = JSON.parse(salesSuggestions.suggestions);
            } catch (e) {
              console.error('❌ Failed to parse enhanced suggestions:', e);
              enhancedSuggestionsArray = [];
            }
          }

          if (enhancedSuggestionsArray.length > 0) {
            const enhancedSuggestionsMessage = {
              type: 'enhanced_suggestions',
              callSid: callRecord.metadata?.callSid,
              suggestions: enhancedSuggestionsArray,
              metadata: {
                reason: 'enhanced_mode_suggestions',
                timestamp: new Date().toISOString(),
                processingTime: Date.now()
              }
            };
            wsManager.broadcastToAll(enhancedSuggestionsMessage);
            console.log('🎯 Enhanced suggestions sent via WebSocket');
          }
        }
      } catch (enhancedError) {
        console.error('❌ Error in enhanced suggestions processing:', enhancedError);
      }
    });

    // ⚡ LIVE PROCESSING COMPLETE - Heavy analysis moved to call end
    console.log('⚡ Live suggestion processing complete - heavy analysis deferred to call end');
    // Note: Call summary, agent feedback, and full analysis will be triggered at call end only
    
    // 🕒 AUTO-COMPLETE DETECTOR: Check if call should be auto-completed after inactivity
    scheduleAutoCallCompletion(callRecord, wsManager);

    // 🚀 IMMEDIATE: Update call record with only essential data
    const callEndTime = callRecord.callEndTime || new Date();
    
    // Calculate duration from callStartTime and callEndTime if available
    let calculatedDuration = callRecord.duration;
    if (callRecord.callStartTime && callEndTime) {
      const startTime = new Date(callRecord.callStartTime).getTime();
      const endTime = new Date(callEndTime).getTime();
      calculatedDuration = Math.round((endTime - startTime) / 1000); // Convert to seconds
    }

    // Update call record with immediate data only (using fast suggestions)
    const immediateUpdateData: any = {
      mood: moodAnalysis.mood,
      sentiment: moodAnalysis.sentiment,
      aiSuggestions: fastSuggestionsArray, // Use fast suggestions for immediate DB update
      outcome: determineCallOutcome(fastSuggestionsArray, moodAnalysis),
      callEndTime: callEndTime,
      duration: calculatedDuration,
      emotionAnalysis: {
        emotions: moodAnalysis.emotions,
        emotionScores: moodAnalysis.emotionScores,
        confidence: moodAnalysis.confidence
      }
    };

    await CallRecord.findByIdAndUpdate(callRecord._id, immediateUpdateData);
    console.log('✅ Call record updated with immediate data');

    // Send final conversation message with immediate data
    const finalMessage = {
      type: 'transcription_processed',
      conversationId: callRecord.clientId.toString(),
      suggestions: suggestionsArray,
      metadata: {
        reason: 'transcript_processed',
        used_context_ids: [],
        processingTime: Date.now(),
        transcriptLength: transcript.length,
        suggestionCount: suggestionsArray.length,
        timestamp: new Date().toISOString()
      },
      moodAnalysis: moodAnalysis,
      emotionGraph: {
        emotions: moodAnalysis.emotions,
        scores: moodAnalysis.emotionScores,
        primaryMood: moodAnalysis.mood,
        sentiment: moodAnalysis.sentiment
      },
      timestamp: new Date().toISOString()
    };

    wsManager.broadcastToConversation(callRecord.clientId.toString(), finalMessage);
    console.log(`✅ Final conversation message sent with immediate data: ${suggestionsArray.length} suggestions`);

  } catch (error) {
    console.error('❌ Error processing transcription for AI:', error);
  }
}

// Fast suggestion function for immediate responses
async function generateFastSuggestions(
  transcript: string,
  moodAnalysis: any
): Promise<any> {
  try {
    const { OpenAIClient } = await import('../services/openaiClient');
    const openaiClient = new OpenAIClient();

    if (!openaiClient.client) {
      return generateMockSalesSuggestions(transcript, moodAnalysis);
    }

    // FAST MODE: Minimal prompt, no heavy context for immediate response
    const fastPrompt = `Expert FoodHub Sales Agent analyzing customer tone and knowledge level.

CUSTOMER TRANSCRIPT: "${transcript.slice(-200)}"
MOOD: ${moodAnalysis.mood}, SENTIMENT: ${moodAnalysis.sentiment}

INSTRUCTIONS:
1. READ the customer's EXACT WORDS and identify their specific question or statement
2. Analyze their TONE (confident, hesitant, frustrated, curious, skeptical, etc.)
3. Assess their KNOWLEDGE LEVEL (expert, informed, beginner, confused)
4. Generate a CUE that DIRECTLY ANSWERS their specific question or addresses their exact response
5. The CUE must be a DIRECT RESPONSE to what they said - not generic advice
6. CHECK FOR COMPLETENESS: If agent gave partial information, suggest what they missed
7. Provide a detailed message that specifically addresses their question with FoodHub solutions

COMPLETENESS CHECK EXAMPLES:
CUSTOMER: "Where do you operate?"
AGENT: "We operate in UK and India"
CUE: "also mention Egypt, Australia, New Zealand, America, South Africa, Canada, Mexico"

CUSTOMER: "What POS systems do you have?"
AGENT: "We have Android POS"
CUE: "also mention Fusion EPOS system with 15-inch touchscreens"

CUSTOMER: "What brands do you work with?"
AGENT: "We work with Papa Johns"
CUE: "also mention Subway, TGI Friday, Little Dessert Shop, Pepe's Piri Piri"

CRITICAL: The CUE must DIRECTLY respond to the customer's actual question or statement.

Examples of QUESTION-SPECIFIC CUES:
CUSTOMER SAYS: "How much does this cost per month?"
CUE: "state monthly pricing: $89 with no hidden fees"

CUSTOMER SAYS: "What if your system crashes during dinner rush?"
CUE: "explain offline mode and 99.9% uptime guarantee"

CUSTOMER SAYS: "Do you integrate with Square POS?"
CUE: "confirm Square integration and show setup process"

CUSTOMER SAYS: "We tried another system and it was too complicated"
CUE: "show 30-minute training process and user testimonials"

CUSTOMER SAYS: "How long does setup take?"
CUE: "explain 2-3 hour same-day implementation"

CUSTOMER SAYS: "Can it handle 200 orders per hour?"
CUE: "confirm capacity: handles 500+ orders/hour"

The CUE should be SPECIFIC and ACTION-ORIENTED based on customer's actual words and questions:

Examples based on REAL customer questions:
CUSTOMER: "I'm not sure if this will work for my small restaurant..."
CUE: "show small restaurant success stories" (reasoning: size concern needs proof)
MESSAGE: "I understand your concern about restaurant size. Let me share how Tony's Pizza (15 tables) increased their order accuracy by 40% and reduced staff training time by 60% with FoodHub. Here are the exact numbers for restaurants your size."

CUSTOMER: "Your competitor offers similar features at a lower price..."
CUE: "compare total cost of ownership" (reasoning: price objection needs ROI analysis)
MESSAGE: "You're right to compare total costs. While our upfront cost may be $200 more, FoodHub saves restaurants an average of $850/month through reduced errors, faster service, and lower staff turnover. Let me show you the 12-month cost comparison."

CUSTOMER: "How long does implementation take? We can't afford downtime..."
CUE: "explain zero-downtime setup process" (reasoning: implementation concern needs timeline)
MESSAGE: "Great question - we implement during your slowest hours with zero downtime. The process takes 2-3 hours, we provide on-site training, and you'll be fully operational the same day. Here's our step-by-step implementation timeline."

CUSTOMER: "Do you integrate with our existing POS system?"
CUE: "confirm integration capabilities" (reasoning: technical question needs specific answer)
MESSAGE: "Yes, we integrate with over 200 POS systems. What system are you currently using? I can show you exactly how the integration works and what data syncs automatically."

CUSTOMER: "What happens if the system goes down during dinner rush?"
CUE: "address uptime and backup systems" (reasoning: reliability concern needs reassurance)
MESSAGE: "Excellent question - we have 99.9% uptime with automatic failover. If there's ever an issue, you have offline mode that syncs when reconnected, plus 24/7 phone support with 2-minute response time during peak hours."

Provide in JSON:
{
  "suggestions": [
    {
      "text": "reasoning-based cue here",
      "type": "cue",
      "confidence": 0.8,
      "deliver_as": "immediate_response",
      "offer_id": "fast_cue",
      "customer_mood": "${moodAnalysis.mood}",
      "tone_analysis": "customer's detected tone",
      "knowledge_level": "assessed knowledge level",
      "reasoning": "why this cue addresses their tone and knowledge"
    },
    {
      "text": "Solution-focused detailed message that directly addresses their tone and knowledge level",
      "type": "detailed_message", 
      "confidence": 0.8,
      "deliver_as": "immediate_response",
      "offer_id": "fast_message",
      "customer_mood": "${moodAnalysis.mood}"
    }
  ]
}`;

    // Check rate limit for fast suggestions
    const canMakeCall = await rateLimiter.canMakeCall('fast_suggestions', 200);
    if (!canMakeCall) {
      console.log('🚫 Rate limit exceeded for fast suggestions, using fallback');
      return generateMockSalesSuggestions(transcript, moodAnalysis);
    }

    const response = await openaiClient.client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: "system", content: "Fast FoodHub Sales Assistant. You must respond with ONLY valid JSON. No explanations, no markdown, no additional text. Just pure JSON." },
        { role: "user", content: fastPrompt + "\n\nRESPOND WITH ONLY THIS JSON FORMAT (complete the entire structure):\n{\"suggestions\": [{\"text\": \"[your cue here]\", \"type\": \"cue\", \"confidence\": 0.8, \"deliver_as\": \"immediate_response\", \"offer_id\": \"fast_cue\", \"customer_mood\": \"neutral\", \"tone_analysis\": \"[tone]\", \"knowledge_level\": \"[level]\", \"reasoning\": \"[reason]\"}, {\"text\": \"[your detailed message here]\", \"type\": \"detailed_message\", \"confidence\": 0.8, \"deliver_as\": \"immediate_response\", \"offer_id\": \"fast_message\", \"customer_mood\": \"neutral\", \"solution_focus\": \"[focus]\"}], \"customer_insights\": {\"emotional_state\": \"[state]\", \"conversation_pattern\": \"[pattern]\", \"recommended_approach\": \"[approach]\"}}" }
      ],
      temperature: 0.3,
      max_tokens: 400 // Increased to prevent truncation
    });

    const content = response.choices?.[0]?.message?.content;
    if (content) {
      console.log('Raw fast suggestion response:', content);
      
      // Comprehensive JSON cleaning for fast mode
      let cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      
      console.log('Content after markdown removal:', cleanContent);
      
      // Try to complete incomplete JSON first
      if (cleanContent.includes('"suggestions"') && !cleanContent.endsWith('}')) {
        // Count open and close braces to detect incomplete JSON
        const openBraces = (cleanContent.match(/\{/g) || []).length;
        const closeBraces = (cleanContent.match(/\}/g) || []).length;
        const openBrackets = (cleanContent.match(/\[/g) || []).length;
        const closeBrackets = (cleanContent.match(/\]/g) || []).length;
        
        console.log(`Brace count: open=${openBraces}, close=${closeBraces}, brackets: open=${openBrackets}, close=${closeBrackets}`);
        
        // Try to complete the JSON structure
        if (openBraces > closeBraces || openBrackets > closeBrackets) {
          // Find the last complete suggestion object
          const lastCompleteMatch = cleanContent.match(/\{[^}]*"text"\s*:\s*"[^"]*"[^}]*\}/g);
          if (lastCompleteMatch && lastCompleteMatch.length > 0) {
            const completeSuggestions = lastCompleteMatch.slice(0, 2); // Take first 2 suggestions
            const completedJson = `{"suggestions": [${completeSuggestions.join(', ')}]}`;
            console.log('Attempting to complete JSON:', completedJson);
            
            try {
              return JSON.parse(completedJson);
            } catch (completionError) {
              console.log('JSON completion failed, continuing with original logic');
            }
          }
        }
      }
      
      // Extract JSON object
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        let jsonStr = jsonMatch[0];
        
        // Fix common JSON issues
        jsonStr = jsonStr
          .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
          .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // Add quotes to unquoted keys
          .replace(/:\s*'([^']*)'/g, ': "$1"') // Replace single quotes with double quotes
          .replace(/\n/g, ' ') // Remove newlines
          .replace(/\s+/g, ' ') // Normalize whitespace
          .replace(/,\s*}/g, '}') // Remove trailing comma before closing brace
          .replace(/,\s*]/g, ']'); // Remove trailing comma before closing bracket
        
        console.log('Cleaned fast suggestion JSON:', jsonStr);
        
        try {
          return JSON.parse(jsonStr);
        } catch (parseError) {
          console.error('JSON parse error after cleaning:', parseError);
          console.error('Failed JSON string:', jsonStr);
          
          // Try to reconstruct from individual suggestion objects
          const suggestionObjects = jsonStr.match(/\{[^{}]*"text"\s*:\s*"[^"]*"[^{}]*\}/g);
          if (suggestionObjects && suggestionObjects.length > 0) {
            try {
              const reconstructedSuggestions = suggestionObjects.map(obj => {
                // Clean each object individually
                let cleanObj = obj
                  .replace(/,(\s*})/g, '$1')
                  .replace(/([{,]\s*)(\w+):/g, '$1"$2":')
                  .replace(/:\s*'([^']*)'/g, ': "$1"');
                
                try {
                  return JSON.parse(cleanObj);
                } catch (objError) {
                  // Extract key fields manually if JSON parse fails
                  const textMatch = cleanObj.match(/"text"\s*:\s*"([^"]*)"/);
                  const typeMatch = cleanObj.match(/"type"\s*:\s*"([^"]*)"/);
                  
                  if (textMatch) {
                    return {
                      text: textMatch[1],
                      type: typeMatch ? typeMatch[1] : "cue",
                      confidence: 0.7,
                      deliver_as: "immediate_response",
                      offer_id: "reconstructed_suggestion"
                    };
                  }
                  return null;
                }
              }).filter(Boolean);
              
              if (reconstructedSuggestions.length > 0) {
                console.log('Successfully reconstructed suggestions:', reconstructedSuggestions);
                return { suggestions: reconstructedSuggestions };
              }
            } catch (reconstructionError) {
              console.error('Failed to reconstruct suggestions:', reconstructionError);
            }
          }
          
          // Final text extraction fallback
          const textMatches = content.match(/"text"\s*:\s*"([^"]*)"/g);
          if (textMatches && textMatches.length > 0) {
            const fallbackSuggestions = textMatches.slice(0, 2).map((match, index) => {
              const textMatch = match.match(/"text"\s*:\s*"([^"]*)"/);
              const text = textMatch ? textMatch[1] : "fallback text";
              return {
                text: text,
                type: index === 0 ? "cue" : "detailed_message",
                confidence: 0.6,
                deliver_as: "immediate_response",
                offer_id: `fallback_${index}`
              };
            });
            
            console.log('Using text extraction fallback:', fallbackSuggestions);
            return { suggestions: fallbackSuggestions };
          }
        }
      }
    }
  } catch (error) {
    console.error('Fast suggestion error:', error);
  }
  
  return generateMockSalesSuggestions(transcript, moodAnalysis);
}

// Enhanced sales suggestions function
async function generateEnhancedSalesSuggestions(
  transcript: string,
  moodAnalysis: any,
  customerHistory: any[],
  phoneNumber: string
): Promise<any> {
  try {
    const { OpenAIClient } = await import('../services/openaiClient');
    const { FoodHubService } = await import('../services/foodhubService');
    
    const openaiClient = new OpenAIClient();
    const foodhubService = new FoodHubService();

    if (!openaiClient.client) {
      return generateMockSalesSuggestions(transcript, moodAnalysis);
    }

    // Get relevant FoodHub context
    const relevantContext = await foodhubService.extractRelevantContext(transcript);
    const productInfo = foodhubService.getProductInfo(transcript);

    // Create enhanced prompt with customer conversation history
    const prompt = `You are an expert FoodHub Sales Agent. Analyze the customer's current state and conversation history to provide SHORT CUES for the agent.

CURRENT CUSTOMER TRANSCRIPT: "${transcript}"

CUSTOMER EMOTION ANALYSIS:
- Primary Mood: ${moodAnalysis.mood}
- Sentiment Score: ${moodAnalysis.sentiment}
- Detected Emotions: ${moodAnalysis.emotions.join(', ')}
- Emotion Confidence: ${moodAnalysis.confidence}

CUSTOMER CONVERSATION HISTORY:
${customerHistory.map((call, i) => 
  `Call ${i + 1} (${call.timestamp}): "${call.transcript}" - Mood: ${call.mood}, Sentiment: ${call.sentiment}`
).join('\n')}

FOODHUB CONTEXT: ${relevantContext}

INSTRUCTIONS:
1. READ the customer's EXACT WORDS from current transcript and conversation history
2. IDENTIFY their specific question, concern, or statement
3. ANALYZE their TONE (confident, hesitant, frustrated, curious, skeptical, rushed, etc.)
4. ASSESS their KNOWLEDGE LEVEL (expert, informed, beginner, confused)
5. Generate a CUE that DIRECTLY RESPONDS to their specific question or statement
6. The CUE must be a DIRECT ANSWER to what they asked - not generic sales advice
7. CHECK FOR COMPLETENESS: If agent gave partial information, suggest what they missed from FoodHub database
8. Provide a detailed message that specifically addresses their question with FoodHub data

COMPLETENESS CHECK EXAMPLES:
CUSTOMER: "Where do you operate?"
AGENT: "We operate in UK and India"
CUE: "also mention Egypt, Australia, New Zealand, America, South Africa, Canada, Mexico"

CUSTOMER: "What are your key features?"
AGENT: "We have online ordering"
CUE: "also mention POS systems, custom apps, kiosks, delivery management, analytics"

CUSTOMER: "Who are your clients?"
AGENT: "We work with Papa Johns and Subway"
CUE: "also mention TGI Friday, Little Dessert Shop, Pepe's Piri Piri, Craving Kebabs"

CRITICAL: The CUE must be a DIRECT RESPONSE to the customer's actual question or statement.

Examples of QUESTION-RESPONSIVE CUES:
CUSTOMER ASKS: "What's your monthly cost and are there setup fees?"
CUE: "quote pricing: $89/month, zero setup fees"

CUSTOMER SAYS: "We need something that works with our current iPad POS"
CUE: "confirm iPad POS integration capabilities"

CUSTOMER ASKS: "How do I know this won't slow down during busy times?"
CUE: "share peak performance data and client examples"

CUSTOMER SAYS: "Our staff is not tech-savvy, will they struggle?"
CUE: "demonstrate simple 3-tap order process"

CUSTOMER ASKS: "What happens if we're not satisfied after a month?"
CUE: "explain 30-day money-back guarantee policy"

CUSTOMER SAYS: "Your competitor quoted us $50 less per month"
CUE: "show ROI comparison: why $50 more saves $300/month"

REASONING-BASED CUE FRAMEWORK:
- Hesitant + Low Knowledge → "simplify key benefits"
- Skeptical + High Knowledge → "prove ROI with data"
- Curious + Medium Knowledge → "demonstrate specific features"
- Frustrated + Any Knowledge → "acknowledge and resolve"
- Rushed + Any Knowledge → "prioritize quick wins"
- Confused + Low Knowledge → "clarify step-by-step"

Examples with SPECIFIC ACTION-ORIENTED CUES:

CUSTOMER HISTORY: Multiple calls, keeps asking about costs, sounds uncertain
CURRENT QUOTE: "I'm still worried about the monthly fees adding up..."
CUE: "break down monthly ROI calculation" (reasoning: recurring cost anxiety needs specific numbers)
MESSAGE: "I understand your concern about monthly costs. Let me break this down: FoodHub costs $89/month but saves you $340/month on average through reduced food waste, faster table turns, and fewer order mistakes. That's a net gain of $251/month. Here's how we calculated this for restaurants like yours."

CUSTOMER HISTORY: First call, asking technical questions, sounds knowledgeable
CURRENT QUOTE: "What's your API rate limit and how do you handle peak traffic?"
CUE: "provide technical specifications" (reasoning: technical question needs detailed specs)
MESSAGE: "Great technical question - our API handles 10,000 requests/minute with auto-scaling, 99.9% uptime SLA, and sub-100ms response times. We use AWS infrastructure with automatic failover. Would you like to see our technical documentation and integration examples?"

CUSTOMER HISTORY: Owns 3 restaurants, concerned about staff training
CURRENT QUOTE: "My staff struggles with new technology, how easy is this to learn?"
CUE: "demonstrate simple staff training" (reasoning: training concern needs ease-of-use proof)
MESSAGE: "Perfect question for a multi-location owner. Our interface is so intuitive that 90% of staff are fully trained in under 30 minutes. Let me show you the 3-tap order process and how we've helped other multi-location restaurants like yours reduce training time by 75%."

OUTPUT FORMAT (JSON only):
{
  "suggestions": [
    {
      "text": "reasoning-based cue here",
      "type": "cue",
      "confidence": 0.85,
      "deliver_as": "immediate_response",
      "offer_id": "enhanced_cue",
      "customer_mood": "${moodAnalysis.mood}",
      "tone_analysis": "detected customer tone (hesitant/skeptical/curious/frustrated/etc.)",
      "knowledge_level": "assessed knowledge level (expert/informed/beginner/confused)",
      "reasoning": "Why this cue addresses their specific tone and knowledge gap"
    },
    {
      "text": "Solution-focused detailed message with specific FoodHub solutions that address their tone and knowledge level",
      "type": "detailed_message",
      "confidence": 0.85,
      "deliver_as": "immediate_response",
      "offer_id": "enhanced_message",
      "customer_mood": "${moodAnalysis.mood}",
      "solution_focus": "specific FoodHub solution or approach being recommended"
    }
  ],
  "customer_insights": {
    "emotional_state": "Brief description of their current emotional state",
    "conversation_pattern": "Pattern observed in their conversation history",
    "recommended_approach": "Overall recommended approach for this customer"
  }
}`;

    // Check cache first to avoid duplicate processing
    const cacheKey = `emotion_${Buffer.from(transcript.slice(-200)).toString('base64')}`;
    if (global.emotionCache && global.emotionCache.has(cacheKey)) {
      console.log('🎯 Using cached emotion analysis');
      return global.emotionCache.get(cacheKey);
    }

    // Check rate limit before making API call
    const estimatedTokens = 400; // Based on our max_tokens setting
    const canMakeCall = await rateLimiter.canMakeCall('emotion_analysis', estimatedTokens);
    
    if (!canMakeCall) {
      console.log('🚫 Rate limit exceeded for emotion analysis, using fallback');
      return generateMockSalesSuggestions(transcript, moodAnalysis);
    }

    const response = await openaiClient.client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini', // Force GPT-4o-mini for cost optimization
      messages: [
        {
          role: "system",
          content: "Expert FoodHub Sales Agent. Analyze customer emotions and provide actionable suggestions. Respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.5, // Reduced for more consistent responses
      max_tokens: 400 // Reduced token usage by 50%
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse JSON response with improved error handling
    let parsedResponse;
    let cleanContent = '';
    try {
      // Remove markdown code blocks if present
      cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      
      // Extract JSON object from response
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanContent = jsonMatch[0];
      }
      
      // Additional cleaning for common JSON issues
      cleanContent = cleanContent
        .replace(/,\s*}/g, '}')  // Remove trailing commas before closing braces
        .replace(/,\s*]/g, ']')  // Remove trailing commas before closing brackets
        .replace(/([{,]\s*)(\w+):/g, '$1"$2":')  // Quote unquoted keys
        .replace(/:(\s*)([^",{\[\s][^",}\]\s]*?)(\s*[,}\]])/g, ': "$2"$3');  // Quote unquoted string values
      
      parsedResponse = JSON.parse(cleanContent);
      
      // Cache the result for future use
      if (!global.emotionCache) {
        global.emotionCache = new Map();
      }
      global.emotionCache.set(cacheKey, parsedResponse);
      
      // Limit cache size to prevent memory issues
      if (global.emotionCache.size > 100) {
        const firstKey = global.emotionCache.keys().next().value;
        if (firstKey) {
          global.emotionCache.delete(firstKey);
        }
      }
      
    } catch (parseError) {
      console.error('❌ Failed to parse OpenAI response:', parseError);
      console.error('Raw response:', content);
      console.error('Cleaned content:', cleanContent);
      console.log('🔄 Falling back to mock suggestions due to JSON parsing error');
      
      // Try one more aggressive cleaning attempt
      try {
        let aggressiveClean = content.replace(/```json\n?|\n?```/g, '').trim();
        const jsonMatch = aggressiveClean.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aggressiveClean = jsonMatch[0];
        }
        
        // More aggressive cleaning
        aggressiveClean = aggressiveClean
          .replace(/,\s*}/g, '}')
          .replace(/,\s*]/g, ']')
          .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
          .replace(/:(\s*)([^",{\[\s][^",}\]\s]*?)(\s*[,}\]])/g, ': "$2"$3')
          .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*([^",{\[\s][^",}\]\s]*?)(\s*[,}\]])/g, '$1"$2": "$3"$4')
          .replace(/:(\s*)(true|false|null)\s*([,}])/g, ': $1$2$3')
          .replace(/:(\s*)(\d+\.?\d*)\s*([,}])/g, ': $1$2$3')
          .replace(/:(\s*)([^",{\[\s][^",}\]\s]*?)(\s*[,}\]])/g, ': "$2"$3')
          .replace(/,\s*}/g, '}')
          .replace(/,\s*]/g, ']');
        
        if (aggressiveClean.trim().startsWith('{') && aggressiveClean.trim().endsWith('}')) {
          parsedResponse = JSON.parse(aggressiveClean);
          console.log('✅ Successfully parsed with aggressive cleaning');
          
          // Cache the result
          if (!global.emotionCache) {
            global.emotionCache = new Map();
          }
          global.emotionCache.set(cacheKey, parsedResponse);
          
          return parsedResponse;
        }
      } catch (finalError) {
        console.error('❌ Even aggressive cleaning failed:', finalError);
      }
      
      return generateMockSalesSuggestions(transcript, moodAnalysis);
    }

    return parsedResponse;

  } catch (error) {
    console.error('Error generating enhanced sales suggestions:', error);
    return generateMockSalesSuggestions(transcript, moodAnalysis);
  }
}

function generateMockSalesSuggestions(transcript: string, moodAnalysis: any): any {
  // Analyze transcript for common questions/statements and generate responsive cues
  const transcriptLower = transcript.toLowerCase();
  
  // Check for completeness - if agent mentioned partial information
  if (transcriptLower.includes('operate') && (transcriptLower.includes('uk') || transcriptLower.includes('india'))) {
    return {
      suggestions: [
        {
          text: "also mention Egypt, Australia, New Zealand, America, South Africa, Canada, Mexico",
          type: "cue",
          confidence: 0.9,
          deliver_as: "immediate_response", 
          offer_id: "completeness_cue",
          customer_mood: moodAnalysis.mood,
          tone_analysis: "seeking comprehensive information",
          knowledge_level: "wants complete picture",
          reasoning: "Agent gave partial location info - suggest missing countries from database"
        },
        {
          text: "We actually operate globally across 9 countries: UK, India, Egypt, Australia, New Zealand, America, South Africa, Canada, and Mexico. This gives us 24/7 support coverage and deep local market understanding in each region.",
          type: "detailed_message",
          confidence: 0.9,
          deliver_as: "immediate_response",
          offer_id: "completeness_message", 
          customer_mood: moodAnalysis.mood,
          solution_focus: "comprehensive global presence demonstration"
        }
      ],
      customer_insights: {
        emotional_state: "information-seeking",
        conversation_pattern: "Completeness check - agent gave partial information",
        recommended_approach: "Provide complete information to build confidence"
      }
    };
  }
  
  // Check for specific questions/concerns in transcript
  if (transcriptLower.includes('cost') || transcriptLower.includes('price') || transcriptLower.includes('expensive')) {
  return {
    suggestions: [
      {
          text: "quote pricing: $89/month with ROI breakdown",
          type: "cue",
          confidence: 0.8,
          deliver_as: "immediate_response",
          offer_id: "pricing_cue",
          customer_mood: moodAnalysis.mood,
          tone_analysis: "price-focused inquiry",
          knowledge_level: "cost-conscious buyer",
          reasoning: "Customer asked about pricing - provide direct cost and value information"
        },
        {
          text: "FoodHub costs $89/month with no hidden fees, but saves restaurants an average of $340/month through reduced errors, faster service, and better inventory management. Let me show you the exact ROI calculation for your restaurant size.",
          type: "detailed_message",
          confidence: 0.8,
          deliver_as: "immediate_response",
          offer_id: "pricing_message",
          customer_mood: moodAnalysis.mood,
          solution_focus: "transparent pricing with ROI justification"
        }
      ],
      customer_insights: {
        emotional_state: "price-focused",
        conversation_pattern: "Cost-conscious inquiry detected",
        recommended_approach: "Lead with value and ROI, not just price"
      }
    };
  }
  
  if (transcriptLower.includes('integration') || transcriptLower.includes('integrate') || transcriptLower.includes('pos')) {
    return {
      suggestions: [
        {
          text: "confirm POS integration and show setup process",
          type: "cue", 
          confidence: 0.8,
          deliver_as: "immediate_response",
          offer_id: "integration_cue",
          customer_mood: moodAnalysis.mood,
          tone_analysis: "technical integration inquiry",
          knowledge_level: "has existing systems",
          reasoning: "Customer asking about integration - confirm compatibility and show process"
        },
        {
          text: "Yes, FoodHub integrates with over 200 POS systems including Square, Toast, Clover, and most major brands. What system are you currently using? I can show you exactly how the integration works and what data syncs automatically.",
          type: "detailed_message",
          confidence: 0.8,
          deliver_as: "immediate_response", 
          offer_id: "integration_message",
          customer_mood: moodAnalysis.mood,
          solution_focus: "comprehensive integration capabilities"
        }
      ],
      customer_insights: {
        emotional_state: "technically concerned",
        conversation_pattern: "Integration compatibility inquiry",
        recommended_approach: "Provide technical details and compatibility confirmation"
      }
    };
  }

  // Default mood-based suggestions for general conversations
  const mockSuggestions = {
    positive: {
      cue: "offer immediate demo scheduling",
      message: "Customer shows strong interest. Say: 'I can see you're interested! Would you like me to schedule a 15-minute personalized demo for tomorrow to show exactly how FoodHub will work in your restaurant?'",
      tone: "engaged and ready to move forward",
      knowledge: "interested prospect",
      solution: "immediate demo scheduling"
    },
    neutral: {
      cue: "ask about their biggest restaurant challenge", 
      message: "Ask directly: 'What's your biggest challenge right now - is it order accuracy, staff efficiency, inventory management, or customer wait times?' Then show exactly how FoodHub solves that specific problem.",
      tone: "neutral and exploratory", 
      knowledge: "information gathering mode",
      solution: "needs assessment and targeted solution"
    },
    negative: {
      cue: "ask what specifically concerns them",
      message: "Ask directly: 'What specifically concerns you about restaurant technology?' Then address their exact worry with proof, testimonials, and guarantees.",
      tone: "skeptical or concerned",
      knowledge: "may have past bad experiences",
      solution: "concern identification and targeted reassurance"
    }
  };
  
  const suggestion = mockSuggestions[moodAnalysis.mood as keyof typeof mockSuggestions] || mockSuggestions.neutral;
  
  return {
    suggestions: [
      {
        text: suggestion.cue,
        type: "cue",
        confidence: 0.7,
        deliver_as: "immediate_response",
        offer_id: "mock_cue",
        customer_mood: moodAnalysis.mood,
        tone_analysis: suggestion.tone,
        knowledge_level: suggestion.knowledge,
        reasoning: `Reasoning-based mock cue for ${moodAnalysis.mood} customer tone and knowledge level`
      },
      {
        text: suggestion.message,
        type: "detailed_message",
        confidence: 0.7,
        deliver_as: "immediate_response",
        offer_id: "mock_message",
        customer_mood: moodAnalysis.mood,
        solution_focus: suggestion.solution,
        reasoning: `Solution-focused approach for ${moodAnalysis.mood} mood`
      }
    ],
    customer_insights: {
      emotional_state: moodAnalysis.mood,
      conversation_pattern: "No history available - using mood-based reasoning",
      recommended_approach: `Tone-aware approach for ${suggestion.tone} customer`
    }
  };
}

// 🏁 END-OF-CALL ANALYSIS: Heavy processing for call completion
export async function performEndOfCallAnalysis(
  callRecord: any,
  finalTranscript: string,
  wsManager: WebSocketManager
): Promise<void> {
  try {
    console.log('🏁 ===== STARTING END-OF-CALL ANALYSIS =====');
    console.log(`📄 Call ID: ${callRecord._id}`);
    console.log(`📄 Phone: ${callRecord.phoneNumber}`);
    console.log(`📄 Final transcript length: ${finalTranscript.length} characters`);
    console.log(`📄 First 200 chars: "${finalTranscript.substring(0, 200)}..."`);
    
    const startTime = Date.now();
    
    // Perform comprehensive call analysis
    let callAnalysis = null;
    if (finalTranscript.length > 100) {
      try {
        console.log('🔍 Performing comprehensive call analysis...');
        callAnalysis = await CallAnalysisService.analyzeCall(finalTranscript, callRecord.duration || 0);
        console.log('✅ Call analysis completed:', callAnalysis.summary);
      } catch (error) {
        console.error('❌ Error in call analysis:', error);
      }
    }

    // Generate AI agent feedback
    let agentFeedback = null;
    if (finalTranscript.length > 100 && callAnalysis) {
      try {
        console.log('🤖 Generating AI agent feedback...');
        agentFeedback = await CallAnalysisService.generateAgentFeedback(finalTranscript, callAnalysis);
        console.log('✅ Agent feedback generated:', agentFeedback.overallFeedback);
      } catch (error) {
        console.error('❌ Error generating agent feedback:', error);
      }
    }

    // Generate AI call summary
    let callSummary = null;
    if (finalTranscript.length > 100 && callAnalysis && agentFeedback) {
      try {
        console.log('📝 Generating AI call summary...');
        callSummary = await CallAnalysisService.generateCallSummary(finalTranscript, callAnalysis, agentFeedback);
        console.log('✅ Call summary generated:', callSummary.overallAssessment);
      } catch (error) {
        console.error('❌ Error generating call summary:', error);
      }
    }

    // Generate enhanced analysis
    let enhancedAnalysis = null;
    if (finalTranscript.length > 50) {
      try {
        console.log('🔍 Generating enhanced analysis...');
        enhancedAnalysis = await CallAnalysisService.generateEnhancedAnalysis(finalTranscript);
        console.log('✅ Enhanced analysis generated:', enhancedAnalysis.moodAnalysis?.mood);
      } catch (error) {
        console.error('❌ Error generating enhanced analysis:', error);
      }
    }

    // Update database with all analysis results
    if (callAnalysis || agentFeedback || callSummary || enhancedAnalysis) {
      const endOfCallUpdateData: any = {};
      if (callAnalysis) endOfCallUpdateData.callAnalysis = callAnalysis;
      if (agentFeedback) endOfCallUpdateData.agentFeedback = agentFeedback;
      if (callSummary) endOfCallUpdateData.callSummary = callSummary;
      if (enhancedAnalysis) endOfCallUpdateData.enhancedAnalysis = enhancedAnalysis;
      
      // Mark call as completed
      endOfCallUpdateData.status = 'completed';
      endOfCallUpdateData.analysisCompletedAt = new Date();

      await CallRecord.findByIdAndUpdate(callRecord._id, endOfCallUpdateData);
      console.log('✅ Call record updated with end-of-call analysis data');

      // Send end-of-call analysis via WebSocket
      const endOfCallAnalysisMessage = {
        type: 'end_of_call_analysis_complete',
        callSid: callRecord.metadata?.callSid,
        callAnalysis: callAnalysis,
        agentFeedback: agentFeedback,
        callSummary: callSummary,
        enhancedAnalysis: enhancedAnalysis,
        metadata: {
          reason: 'end_of_call_analysis',
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime
        }
      };
      wsManager.broadcastToAll(endOfCallAnalysisMessage);
      console.log(`🏁 End-of-call analysis completed and sent in ${Date.now() - startTime}ms`);
    }

    // 🌐 SEND TRANSCRIPT TO EXTERNAL WEBHOOKS
    if (finalTranscript && finalTranscript.length > 50) {
      try {
        console.log('🌐 Sending transcript to external webhooks...');
        // Send to external webhooks in background (don't await to avoid blocking)
        ExternalWebhookService.sendTranscriptToExternalWebhooks(finalTranscript, callRecord)
          .catch(error => {
            console.error('❌ Error sending to external webhooks:', error);
          });
        console.log('✅ External webhook calls initiated');
      } catch (error) {
        console.error('❌ Error initiating external webhook calls:', error);
      }
    }
    
    console.log('🏁 ===== END-OF-CALL ANALYSIS COMPLETE =====');
  } catch (error) {
    console.error('❌ Error in end-of-call analysis:', error);
  }
}

// 🕒 AUTO-COMPLETE DETECTOR: Automatically trigger call analysis after inactivity
function scheduleAutoCallCompletion(callRecord: any, wsManager: WebSocketManager): void {
  // Cancel any existing timeout for this call
  const callId = callRecord._id.toString();
  
  if (global.autoCompleteTimeouts) {
    const existingTimeout = global.autoCompleteTimeouts.get(callId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }
  } else {
    global.autoCompleteTimeouts = new Map();
  }
  
  // Schedule auto-completion after 30 seconds of inactivity
  const timeout = setTimeout(async () => {
    try {
      console.log(`🕒 Auto-completing call after inactivity: ${callId}`);
      
      // Check if call is still in progress
      const currentCall = await CallRecord.findById(callId);
      if (currentCall && currentCall.status === 'in_progress') {
        console.log(`🕒 Auto-completing call ${callId} - transcript length: ${currentCall.transcript?.length || 0}`);
        
        // Update call status to completed
        await CallRecord.findByIdAndUpdate(callId, {
          status: 'completed',
          callEndTime: new Date(),
          outcome: 'auto_completed'
        });
        
        // Trigger analysis if we have a meaningful transcript
        if (currentCall.transcript && currentCall.transcript.length > 50) {
          console.log(`🕒 Triggering auto-completion analysis for call ${callId}`);
          await performEndOfCallAnalysis(currentCall, currentCall.transcript, wsManager);
        } else {
          console.log(`🕒 Skipping analysis for call ${callId} - transcript too short or missing`);
        }
      }
      
      // Remove from timeout map
      if (global.autoCompleteTimeouts) {
        global.autoCompleteTimeouts.delete(callId);
      }
      
    } catch (error) {
      console.error(`❌ Error in auto-completion for call ${callId}:`, error);
    }
  }, 30000); // 30 seconds
  
  // Store the timeout
  global.autoCompleteTimeouts.set(callId, timeout);
  console.log(`🕒 Scheduled auto-completion for call ${callId} in 30 seconds`);
}