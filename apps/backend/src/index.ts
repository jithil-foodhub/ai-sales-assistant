import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';

import { twilioWebhook } from './routes/twilio';
import { twilioCallWebhook, manualTriggerCallAnalysis, checkInProgressCalls } from './routes/twilioWebhook';
import { twilioTranscriptionWebhook } from './routes/twilioTranscription';
import { twilioMediaStreamWebhook } from './routes/twilioMediaStream';
import { getAnalytics, getCallSummary } from './routes/analytics';
import { getEnhancedAnalytics, getObjectionAnalysis } from './routes/enhancedAnalytics';
import { generateSuggestion } from './routes/api';
import { testExternalWebhooks, getExternalWebhooks, addExternalWebhook, removeExternalWebhook, sendCallToExternalWebhooks } from './routes/externalWebhooks';
import { customerSimulation } from './routes/customer';
import { clientTranscriptWebhook } from './routes/webhook';
import { getClients, getClient, createClient, updateClient, deleteClient, getClientStats, getClientCalls, clearClientData } from './routes/clients';
import { analyzeClientPreferences, generatePersonalizedWebsite, deployWebsite, getClientSites, deleteClientSite, modifyWebsite, generateWebsitePreview, deleteWebsite, cleanupWebsites } from './routes/clientPreferences';
import { mongoDBService } from './services/mongodb';
import { WebSocketManager } from './services/websocket';
import { LatencyProfiler } from './services/latencyProfiler';

// Load environment variables from project root
const envPath = path.resolve(process.cwd(), '.env');
console.log('🔍 Loading .env from:', envPath);
dotenv.config({ path: envPath });

const app = express();
const server = createServer(app);
const port = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Initialize services
const latencyProfiler = new LatencyProfiler();
const wsManager = new WebSocketManager();

// Connect to MongoDB
async function startServer() {
  try {
    await mongoDBService.connect();
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

// WebSocket server
const wss = new WebSocketServer({ 
  server,
  path: '/ws'
});

wss.on('connection', (ws, req) => {
  const connectionId = uuidv4();
  console.log(`New WebSocket connection: ${connectionId}`);
  
  wsManager.addConnection(connectionId, ws);
  
  ws.on('close', () => {
    console.log(`WebSocket connection closed: ${connectionId}`);
    wsManager.removeConnection(connectionId);
  });
  
  ws.on('error', (error) => {
    console.error(`WebSocket error for ${connectionId}:`, error);
  });
});

// Routes
app.post('/webhook/twilio', twilioWebhook(wsManager, latencyProfiler));
app.post('/webhook/twilio/call', twilioCallWebhook(wsManager, latencyProfiler));
app.post('/webhook/twilio/transcription', twilioTranscriptionWebhook(wsManager, latencyProfiler));
app.post('/webhook/twilio/media-stream', twilioMediaStreamWebhook(wsManager, latencyProfiler));
app.post('/api/generate-suggestion', generateSuggestion(wsManager, latencyProfiler));

// Manual call analysis trigger
app.post('/api/calls/:callId/analyze', manualTriggerCallAnalysis(wsManager));

// Check and complete stale in-progress calls
app.post('/api/calls/check-stale', checkInProgressCalls(wsManager));
app.post('/api/customer-simulation', customerSimulation(wsManager, latencyProfiler));
app.post('/webhook/client-transcript', clientTranscriptWebhook(wsManager, latencyProfiler));

// Client management routes
app.get('/api/clients/stats', getClientStats);
app.get('/api/clients', getClients);
app.get('/api/clients/:id', getClient);
app.get('/api/clients/:agentId/calls', getClientCalls);

// Client preferences and website generation endpoints
app.get('/api/clients/:agentId/preferences', analyzeClientPreferences);
app.post('/api/clients/:agentId/generate-website', generatePersonalizedWebsite);
app.post('/api/clients/:agentId/deploy-website', deployWebsite);
app.post('/api/clients/:agentId/generate-preview', generateWebsitePreview);
app.post('/api/clients/:agentId/modify-website', modifyWebsite);
app.post('/api/clients/:agentId/delete-website', deleteWebsite);
app.post('/api/clients/:agentId/cleanup-websites', cleanupWebsites);
app.get('/api/clients/:agentId/sites', getClientSites);
app.delete('/api/clients/:agentId/sites/:fileName', deleteClientSite);

// Analytics endpoints
app.get('/api/analytics', getAnalytics);
app.get('/api/analytics/call/:callId', getCallSummary);

// Enhanced Analytics endpoints
app.get('/api/analytics/enhanced', getEnhancedAnalytics);
app.get('/api/analytics/objections', getObjectionAnalysis);

// External Webhook endpoints
app.get('/api/webhooks/external/test', testExternalWebhooks);
app.get('/api/webhooks/external', getExternalWebhooks);
app.post('/api/webhooks/external', addExternalWebhook);
app.delete('/api/webhooks/external', removeExternalWebhook);
app.post('/api/webhooks/external/send/:callId', sendCallToExternalWebhooks);

// Preview generated websites
// Serve deployed websites (local fallback)
app.get('/sites/:clientId/:fileName', (req, res) => {
  try {
    const { clientId, fileName } = req.params;
    const filePath = path.join(__dirname, '../public/sites', clientId, fileName);
    
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).send('File not found');
    }
  } catch (error) {
    console.error('Error serving deployed file:', error);
    res.status(500).send('Error serving file');
  }
});

app.post('/api/clients', createClient);
app.put('/api/clients/:id', updateClient);
app.delete('/api/clients/:id', deleteClient);
app.delete('/api/clients/:clientId/clear-data', clearClientData);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    connections: wsManager.getConnectionCount()
  });
});

// Test WebSocket endpoint
app.post('/api/test-websocket', (req, res) => {
  console.log('🧪 Test WebSocket endpoint called');
  
  // Send a test live_analysis message
  const testMessage = {
    type: 'live_analysis',
    callSid: 'TEST_CALL_123',
    transcript: 'This is a test transcript from the test endpoint',
    moodAnalysis: {
      mood: 'positive',
      sentiment: 0.8
    },
    suggestions: [{
      text: 'This is a test AI suggestion from the backend to verify WebSocket connectivity!',
      offer_id: 'test_suggestion',
      type: 'solution_consultation',
      confidence: 0.9,
      deliver_as: 'say',
      reasoning: 'Test suggestion generated from API endpoint'
    }],
    timestamp: new Date().toISOString()
  };
  
  console.log('🚀 Broadcasting test message to', wsManager.getConnectionCount(), 'connections');
  wsManager.broadcastToAll(testMessage);
  
  res.json({
    success: true,
    message: 'Test WebSocket message sent',
    connections: wsManager.getConnectionCount()
  });
});

// RAG test endpoints
import { testRagQuery, getVectorStoreStats, resetVectorStore, testContextExtraction } from './routes/ragTest';
app.post('/api/rag/test-query', testRagQuery);
app.get('/api/rag/stats', getVectorStoreStats);
app.post('/api/rag/reset', resetVectorStore);
app.post('/api/rag/test-context', testContextExtraction);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
startServer().then(() => {
  server.listen(port, () => {
    console.log(`🚀 AI Sales Assistant Backend running on port ${port}`);
    console.log(`📡 WebSocket server available at ws://localhost:${port}/ws`);
    console.log(`🔗 Health check: http://localhost:${port}/health`);
    console.log(`📊 MongoDB status:`, mongoDBService.getConnectionInfo());
  });
});

export { app, server };
