import { Request, Response } from 'express';
import { WebSocketManager } from '../services/websocket';
import { LatencyProfiler } from '../services/latencyProfiler';
import { VectorStore } from '../services/vectorStore';
import { OpenAIClient } from '../services/openaiClient';

const vectorStore = new VectorStore();
const openaiClient = new OpenAIClient();

export function twilioWebhook(wsManager: WebSocketManager, latencyProfiler: LatencyProfiler) {
  return async (req: Request, res: Response) => {
    const endTiming = latencyProfiler.startTiming('twilio_webhook');
    
    try {
      const { CallSid, TranscriptionText, CallStatus } = req.body;
      
      if (!CallSid) {
        return res.status(400).json({ error: 'Missing CallSid' });
      }

      const conversationId = CallSid;
      
      // Only process completed transcriptions
      if (CallStatus !== 'completed' || !TranscriptionText) {
        console.log(`Call ${CallSid} status: ${CallStatus}, transcript: ${TranscriptionText ? 'available' : 'not available'}`);
        return res.status(200).json({ status: 'received' });
      }

      console.log(`Processing transcript for call ${CallSid}: ${TranscriptionText.substring(0, 100)}...`);

      // Generate embedding for the transcript
      const transcriptEmbedding = await generateTranscriptEmbedding(TranscriptionText);
      
      // Search for relevant offers
      const relevantOffers = await vectorStore.searchSimilar(transcriptEmbedding, 3);
      
      // Generate suggestions using OpenAI
      const suggestionResponse = await openaiClient.generateSuggestions(
        TranscriptionText,
        relevantOffers.map(r => r.metadata),
        conversationId
      );

      // Send suggestions via WebSocket
      const wsMessage = {
        conversationId,
        suggestions: suggestionResponse.suggestions,
        metadata: {
          ...suggestionResponse.metadata,
          latency: endTiming(),
          timestamp: new Date().toISOString()
        }
      };

      wsManager.broadcastToConversation(conversationId, wsMessage);

      console.log(`✅ Processed call ${CallSid}, sent ${suggestionResponse.suggestions.length} suggestions`);

      res.status(200).json({ 
        status: 'processed',
        suggestions_count: suggestionResponse.suggestions.length,
        conversation_id: conversationId
      });

    } catch (error) {
      console.error('Error processing Twilio webhook:', error);
      endTiming();
      
      res.status(500).json({ 
        error: 'Failed to process transcript',
        conversation_id: req.body.CallSid
      });
    }
  };
}

async function generateTranscriptEmbedding(transcript: string): Promise<number[]> {
  if (process.env.MOCK_MODE === 'true') {
    // Generate a mock embedding based on transcript content
    return generateMockEmbedding(transcript);
  }
  
  // In a real implementation, this would call OpenAI's embedding API
  // For now, return mock embedding
  return generateMockEmbedding(transcript);
}

function generateMockEmbedding(text: string): number[] {
  // Generate a deterministic "embedding" based on text content
  const hash = simpleHash(text);
  
  // Generate 1536-dimensional vector with some structure
  const embedding = new Array(1536).fill(0);
  for (let i = 0; i < 1536; i++) {
    embedding[i] = Math.sin(hash + i) * 0.1;
  }
  
  return embedding;
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}
