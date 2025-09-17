import { Request, Response } from 'express';
import { WebSocketManager } from '../services/websocket';
import { LatencyProfiler } from '../services/latencyProfiler';
import { Client } from '../models/Client';
import { CallRecord } from '../models/CallRecord';
import { mongoDBService } from '../services/mongodb';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../../.env") });

interface MediaStreamEvent {
  event: 'start' | 'media' | 'stop';
  streamSid: string;
  callSid: string;
  accountSid: string;
  tracks: string[];
  media: {
    track: 'inbound' | 'outbound';
    chunk: string;
    timestamp: string;
    payload: string;
  };
  sequenceNumber: string;
}

export function twilioMediaStreamWebhook(
  wsManager: WebSocketManager,
  latencyProfiler: LatencyProfiler
) {
  return async (req: Request, res: Response) => {
    const endTiming = latencyProfiler.startTiming("twilio_media_stream");

    try {
      console.log(`🎵 Media Stream Webhook received:`, req.body);
      
      const event: MediaStreamEvent = req.body;
      
      console.log(`🎵 Media Stream Event: ${event.event} for call ${event.callSid}`);
      
      // Handle different media stream events
      switch (event.event) {
        case 'start':
          return handleStreamStart(event, res, wsManager);
        
        case 'media':
          return handleMediaChunk(event, res, wsManager);
        
        case 'stop':
          return handleStreamStop(event, res, wsManager);
        
        default:
          console.log(`ℹ️ Unhandled media stream event: ${event.event}`);
          return res.status(200).send('OK');
      }

    } catch (error) {
      console.error('❌ Twilio media stream webhook error:', error);
      endTiming();
      res.status(500).send('Internal Server Error');
    }
  };
}

async function handleStreamStart(event: MediaStreamEvent, res: Response, wsManager: WebSocketManager) {
  console.log(`🎵 Media stream started for call: ${event.callSid}`);
  
  try {
    // For now, just broadcast the stream start without database operations
    const wsMessage = {
      type: 'media_stream_started',
      callSid: event.callSid,
      streamSid: event.streamSid,
      clientId: 'demo-client',
      phoneNumber: '+15551234567',
      timestamp: new Date().toISOString()
    };

    wsManager.broadcastToAll(wsMessage);

    console.log(`✅ Stream start processed successfully`);
    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Error in handleStreamStart:', error);
    res.status(500).send('Internal Server Error');
  }
}

async function handleMediaChunk(event: MediaStreamEvent, res: Response, wsManager: WebSocketManager) {
  try {
    // Decode the base64 audio chunk
    const audioChunk = Buffer.from(event.media.payload, 'base64');
    
    // For now, we'll simulate transcript processing
    // In a real implementation, you'd send this to a speech-to-text service
    const simulatedTranscript = await simulateTranscriptProcessing(audioChunk, event);
    
    if (simulatedTranscript) {
      console.log(`📝 Live transcript chunk: "${simulatedTranscript}"`);
      
      // Update call record with live transcript
      const callRecord = await CallRecord.findOne({
        'metadata.callSid': event.callSid
      });

      if (callRecord) {
        // Append to live transcript
        const currentTranscript = callRecord.metadata?.liveTranscript || '';
        const updatedTranscript = currentTranscript + ' ' + simulatedTranscript;
        
        await CallRecord.findByIdAndUpdate(callRecord._id, {
          'metadata.liveTranscript': updatedTranscript.trim()
        });

        // Broadcast live transcript to connected clients
        const wsMessage = {
          type: 'live_transcript_chunk',
          callSid: event.callSid,
          streamSid: event.streamSid,
          transcript: simulatedTranscript,
          fullTranscript: updatedTranscript.trim(),
          timestamp: new Date().toISOString()
        };

        wsManager.broadcastToAll(wsMessage);

        // Process transcript for AI suggestions if it's substantial
        if (updatedTranscript.length > 50) {
          await processLiveTranscript(updatedTranscript, callRecord, wsManager);
        }
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Error processing media chunk:', error);
    res.status(500).send('Internal Server Error');
  }
}

async function handleStreamStop(event: MediaStreamEvent, res: Response, wsManager: WebSocketManager) {
  console.log(`🎵 Media stream stopped for call: ${event.callSid}`);
  
  // Find call record
  const callRecord = await CallRecord.findOne({
    'metadata.callSid': event.callSid
  });

  if (callRecord) {
    // Update call record with final transcript
    const finalTranscript = callRecord.metadata?.liveTranscript || '';
    
    await CallRecord.findByIdAndUpdate(callRecord._id, {
      transcript: finalTranscript,
      'metadata.isLive': false,
      'metadata.streamEnded': new Date()
    });

    // Process final transcript for AI suggestions
    if (finalTranscript.length > 10) {
      await processFinalTranscript(finalTranscript, callRecord, wsManager);
    }

    // Broadcast stream stop
    const wsMessage = {
      type: 'media_stream_stopped',
      callSid: event.callSid,
      streamSid: event.streamSid,
      finalTranscript: finalTranscript,
      timestamp: new Date().toISOString()
    };

    wsManager.broadcastToAll(wsMessage);
  }

  res.status(200).send('OK');
}

async function simulateTranscriptProcessing(audioChunk: Buffer, event: MediaStreamEvent): Promise<string | null> {
  // This is a simulation - in reality you'd use a speech-to-text service
  // For demo purposes, we'll generate some realistic transcript chunks
  
  const simulatedChunks = [
    "Hi, I'm interested in your",
    "POS system for my restaurant",
    "Can you tell me more about",
    "the pricing and features?",
    "I'm looking for something",
    "that can handle online orders",
    "and has good customer support",
    "What would you recommend?",
    "That sounds interesting",
    "Can you send me more details?",
    "I'd like to schedule a demo",
    "if that's possible",
    "Thank you for your time",
    "I'll think about it"
  ];

  // Return a random chunk occasionally to simulate real-time transcription
  if (Math.random() > 0.7) {
    const randomChunk = simulatedChunks[Math.floor(Math.random() * simulatedChunks.length)];
    return randomChunk;
  }

  return null;
}

async function processLiveTranscript(transcript: string, callRecord: CallRecord, wsManager: WebSocketManager) {
  try {
    // Import AI processing functions
    const { analyzeCallMood, generateSalesSuggestions } = await import('./twilioWebhook');
    
    // Analyze mood
    const moodAnalysis = await analyzeCallMood(transcript);
    
    // Generate quick suggestions
    const salesSuggestions = await generateSalesSuggestions(
      transcript,
      moodAnalysis,
      [],
      callRecord.phoneNumber
    );

    // Broadcast live analysis
    const wsMessage = {
      type: 'live_analysis',
      callSid: callRecord.metadata.callSid,
      transcript: transcript,
      moodAnalysis: moodAnalysis,
      suggestions: salesSuggestions.suggestions,
      timestamp: new Date().toISOString()
    };

    wsManager.broadcastToAll(wsMessage);

    console.log(`🤖 Live analysis: ${moodAnalysis.mood} mood, ${salesSuggestions.suggestions.length} suggestions`);

  } catch (error) {
    console.error('❌ Error processing live transcript:', error);
  }
}

async function processFinalTranscript(transcript: string, callRecord: CallRecord, wsManager: WebSocketManager) {
  try {
    // Import AI processing functions
    const { analyzeCallMood, generateSalesSuggestions, determineCallOutcome } = await import('./twilioWebhook');
    
    // Get client history
    const clientHistory = await CallRecord.find({ clientId: callRecord.clientId })
      .sort({ timestamp: -1 })
      .limit(5)
      .lean();

    // Analyze mood
    const moodAnalysis = await analyzeCallMood(transcript);
    
    // Generate final suggestions
    const salesSuggestions = await generateSalesSuggestions(
      transcript,
      moodAnalysis,
      clientHistory,
      callRecord.phoneNumber
    );

    // Update call record with final analysis
    await CallRecord.findByIdAndUpdate(callRecord._id, {
      transcript: transcript,
      mood: moodAnalysis.mood,
      sentiment: moodAnalysis.sentiment,
      aiSuggestions: salesSuggestions.suggestions,
      outcome: determineCallOutcome(salesSuggestions.suggestions, moodAnalysis)
    });

    // Broadcast final analysis
    const wsMessage = {
      type: 'final_analysis',
      callSid: callRecord.metadata.callSid,
      callRecord: {
        id: callRecord._id,
        clientId: callRecord.clientId,
        phoneNumber: callRecord.phoneNumber,
        timestamp: callRecord.timestamp,
        duration: callRecord.duration,
        transcript: transcript,
        mood: moodAnalysis.mood,
        sentiment: moodAnalysis.sentiment,
        direction: callRecord.direction,
        aiSuggestions: salesSuggestions.suggestions,
        outcome: determineCallOutcome(salesSuggestions.suggestions, moodAnalysis),
        metadata: callRecord.metadata
      },
      moodAnalysis,
      clientHistory: clientHistory.slice(-3),
      timestamp: new Date().toISOString()
    };

    wsManager.broadcastToAll(wsMessage);

    console.log(`✅ Final analysis complete: ${salesSuggestions.suggestions.length} suggestions`);

  } catch (error) {
    console.error('❌ Error processing final transcript:', error);
  }
}

async function findOrCreateClientFromCallSid(callSid: string) {
  // This is a simplified version - in reality you'd need to track call SID to phone number mapping
  // For now, we'll create a generic client
  let client = await Client.findOne({ phoneNumber: '+15551234567' });
  
  if (!client) {
    client = new Client({
      phoneNumber: '+15551234567',
      status: 'prospect',
      totalCalls: 0,
      notes: `Auto-created from live call ${callSid}`
    });
    await client.save();
  }
  
  return client;
}
