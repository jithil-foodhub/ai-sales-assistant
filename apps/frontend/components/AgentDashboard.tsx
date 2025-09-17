'use client';

import { useState, useEffect, useRef } from 'react';
import { WebSocketClient } from '@/hooks/useWebSocket';
import { SuggestionCard } from './SuggestionCard';
import { TranscriptPane } from './TranscriptPane';
import { ConnectionStatus } from './ConnectionStatus';

interface Suggestion {
  text: string;
  offer_id: string;
  type: 'upsell' | 'cross-sell' | 'retention' | 'new-offer' | 'product_recommendation' | 'solution_consultation' | 'business_growth' | 'technical_support' | 'pricing_inquiry' | 'follow_up' | 'empathy_response';
  confidence: number;
  deliver_as: 'say' | 'show' | 'email';
  reasoning?: string;
}

interface WebSocketMessage {
  conversationId: string;
  suggestions: Suggestion[];
  metadata: {
    reason: string;
    used_context_ids: string[];
    latency?: number;
    timestamp: string;
  };
}

interface CallRecord {
  id: string;
  clientId: string;
  phoneNumber: string;
  timestamp: string;
  duration: number;
  transcript: string;
  mood: 'positive' | 'neutral' | 'negative' | 'unknown';
  sentiment: number;
  direction: 'inbound' | 'outbound';
  aiSuggestions: Suggestion[];
  outcome: string;
  metadata: any;
}

interface CallStatusUpdate {
  type: 'call_status_update';
  callSid: string;
  from: string;
  to: string;
  status: string;
  direction: string;
  timestamp: string;
}

interface TranscriptProcessed {
  type: 'call_transcript_processed';
  conversationId: string;
  callRecord: CallRecord;
  moodAnalysis: {
    mood: 'positive' | 'neutral' | 'negative';
    sentiment: number;
    confidence: number;
    keywords: string[];
    emotions: string[];
  };
  clientHistory: any[];
  timestamp: string;
}

interface LiveTranscriptChunk {
  type: 'live_transcript_chunk';
  callSid: string;
  streamSid?: string;
  speaker: string;
  transcript: string;
  fullTranscript: string;
  confidence: number;
  timestamp: string;
}

interface LiveAnalysis {
  type: 'live_analysis';
  callSid: string;
  transcript: string;
  moodAnalysis: {
    mood: 'positive' | 'neutral' | 'negative';
    sentiment: number;
    confidence: number;
    keywords: string[];
    emotions: string[];
  };
  suggestions: Suggestion[];
  timestamp: string;
}

interface MediaStreamStarted {
  type: 'media_stream_started';
  callSid: string;
  streamSid: string;
  clientId: string;
  phoneNumber: string;
  timestamp: string;
}

interface AgentDashboardProps {
  agentId: string;
}

export function AgentDashboard({ agentId }: AgentDashboardProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [transcript, setTranscript] = useState<string>('');
  const [customerMessage, setCustomerMessage] = useState<string>('');
  const [foodhubContext, setFoodhubContext] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [conversationId, setConversationId] = useState<string>('');
  const [currentCall, setCurrentCall] = useState<CallRecord | null>(null);
  const [callStatus, setCallStatus] = useState<string>('');
  const [moodAnalysis, setMoodAnalysis] = useState<any>(null);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(false);
  const [liveSuggestions, setLiveSuggestions] = useState<Suggestion[]>([]);
  const wsRef = useRef<WebSocketClient | null>(null);

  useEffect(() => {
    // Initialize WebSocket connection
    const wsClient = new WebSocketClient();
    wsRef.current = wsClient;

    wsClient.onConnect = () => {
      setIsConnected(true);
      console.log('Connected to WebSocket');
    };

    wsClient.onDisconnect = () => {
      setIsConnected(false);
      console.log('Disconnected from WebSocket');
    };

    wsClient.onMessage = (message: any) => {
      console.log('Received message:', message);
      
      // Handle different message types
      if (message.type === 'call_status_update') {
        const callUpdate = message as CallStatusUpdate;
        console.log(`📞 Call Status: ${callUpdate.status} from ${callUpdate.from}`);
        setCallStatus(`${callUpdate.status} - ${callUpdate.from}`);
      } else if (message.type === 'media_stream_started') {
        const streamStart = message as MediaStreamStarted;
        console.log(`🎵 Live streaming started for call: ${streamStart.callSid}`);
        setIsLiveStreaming(true);
        setLiveTranscript('');
        setLiveSuggestions([]);
      } else if (message.type === 'live_transcript_chunk') {
        const transcriptChunk = message as LiveTranscriptChunk;
        console.log(`📝 Live transcript [${transcriptChunk.speaker}]: "${transcriptChunk.transcript}" (Confidence: ${transcriptChunk.confidence})`);
        setLiveTranscript(transcriptChunk.fullTranscript);
        setTranscript(transcriptChunk.fullTranscript);
      } else if (message.type === 'live_analysis') {
        const liveAnalysis = message as LiveAnalysis;
        console.log(`🤖 Live analysis: ${liveAnalysis.moodAnalysis.mood} mood`);
        setMoodAnalysis(liveAnalysis.moodAnalysis);
        setLiveSuggestions(liveAnalysis.suggestions);
        setSuggestions(liveAnalysis.suggestions);
        setLastUpdate(liveAnalysis.timestamp);
      } else if (message.type === 'call_transcript_processed') {
        const transcriptMsg = message as TranscriptProcessed;
        console.log(`📄 Final transcript processed:`, transcriptMsg);
        
        // Update call record
        setCurrentCall(transcriptMsg.callRecord);
        setTranscript(transcriptMsg.callRecord.transcript);
        setSuggestions(transcriptMsg.callRecord.aiSuggestions);
        setMoodAnalysis(transcriptMsg.moodAnalysis);
        setLastUpdate(transcriptMsg.timestamp);
        setConversationId(transcriptMsg.conversationId);
        setIsLiveStreaming(false);
        
        console.log(`💡 Final AI Suggestions:`, transcriptMsg.callRecord.aiSuggestions);
        console.log(`😊 Final Mood: ${transcriptMsg.moodAnalysis.mood} (${transcriptMsg.moodAnalysis.sentiment})`);
      } else if (message.suggestions) {
        // Handle regular suggestion messages
        const suggestionMsg = message as WebSocketMessage;
        setSuggestions(suggestionMsg.suggestions);
        setLastUpdate(suggestionMsg.metadata.timestamp);
        setConversationId(suggestionMsg.conversationId);
        
        // Show customer message if available
        if (suggestionMsg.metadata.customerMessage) {
          setCustomerMessage(suggestionMsg.metadata.customerMessage);
        }
        
        // Show FoodHub context if available
        if (suggestionMsg.metadata.foodhubContext) {
          setFoodhubContext(suggestionMsg.metadata.foodhubContext);
        }
      }
    };

    wsClient.connect();

    return () => {
      wsClient.disconnect();
    };
  }, []);

  const handleSuggestionAction = (suggestion: Suggestion, action: 'accept' | 'reject') => {
    console.log(`Suggestion ${action}:`, suggestion);
    
    // Remove the suggestion from the list
    setSuggestions(prev => prev.filter(s => s !== suggestion));
    
    // In a real implementation, you would send this action back to the server
    // and potentially update the agent's performance metrics
  };

  const handleSendTestTranscript = async () => {
    const testTranscript = "Hi, I'm interested in your premium package but I'm concerned about the cost. Can you tell me more about the features?";
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/generate-suggestion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: testTranscript,
          conversationId: `test-${Date.now()}`
        }),
      });

      if (response.ok) {
        setTranscript(testTranscript);
        console.log('Test transcript sent successfully');
      } else {
        console.error('Failed to send test transcript');
      }
    } catch (error) {
      console.error('Error sending test transcript:', error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Agent Dashboard - {agentId}
          </h1>
          <ConnectionStatus isConnected={isConnected} />
        </div>
        
        {conversationId && (
          <p className="text-sm text-gray-600">
            Conversation ID: {conversationId}
          </p>
        )}
      </div>

      {/* Live Transcript Streaming */}
      {isLiveStreaming && (
        <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-2"></div>
              Live Transcript Streaming
            </h3>
            <span className="text-sm text-green-600 font-medium">REAL-TIME</span>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="h-32 overflow-y-auto">
              <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                {liveTranscript ? (
                  liveTranscript.split('\n').map((line, index) => {
                    if (line.includes('[Customer]:')) {
                      return (
                        <div key={index} className="mb-2">
                          <span className="font-semibold text-blue-600">Customer:</span> {line.replace('[Customer]:', '')}
                        </div>
                      );
                    } else if (line.includes('[Agent]:')) {
                      return (
                        <div key={index} className="mb-2">
                          <span className="font-semibold text-green-600">Agent:</span> {line.replace('[Agent]:', '')}
                        </div>
                      );
                    } else {
                      return <div key={index} className="mb-2">{line}</div>;
                    }
                  })
                ) : (
                  <p className="text-gray-500 italic">Waiting for conversation to begin...</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Call Status and Mood Analysis */}
      {(callStatus || currentCall || moodAnalysis) && (
        <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Live Call Information</h3>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            {/* Call Status */}
            {callStatus && (
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-1">Call Status</h4>
                <p className="text-lg font-semibold text-blue-600">{callStatus}</p>
              </div>
            )}
            
            {/* Mood Analysis */}
            {moodAnalysis && (
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-1">Customer Mood</h4>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    moodAnalysis.mood === 'positive' ? 'bg-green-100 text-green-800' :
                    moodAnalysis.mood === 'negative' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {moodAnalysis.mood}
                  </span>
                  <span className="text-sm text-gray-600">
                    {moodAnalysis.sentiment > 0 ? '+' : ''}{moodAnalysis.sentiment.toFixed(2)}
                  </span>
                </div>
                {moodAnalysis.emotions && (
                  <p className="text-xs text-gray-500 mt-1">
                    {moodAnalysis.emotions.join(', ')}
                  </p>
                )}
              </div>
            )}
            
            {/* Call Duration */}
            {currentCall && (
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-1">Call Duration</h4>
                <p className="text-lg font-semibold text-gray-900">
                  {Math.floor(currentCall.duration / 60)}:{(currentCall.duration % 60).toString().padStart(2, '0')}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(currentCall.timestamp).toLocaleTimeString()}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Suggestions Panel */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              AI Suggestions
            </h2>
            <button
              onClick={handleSendTestTranscript}
              className="btn btn-secondary text-sm"
            >
              Send Test Transcript
            </button>
          </div>

          {suggestions.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-gray-500 mb-4">No suggestions yet</p>
              <p className="text-sm text-gray-400">
                Send a test transcript or wait for real call data
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {suggestions.map((suggestion, index) => (
                <SuggestionCard
                  key={`${suggestion.offer_id}-${index}`}
                  suggestion={suggestion}
                  onAction={handleSuggestionAction}
                />
              ))}
            </div>
          )}

          {lastUpdate && (
            <p className="text-xs text-gray-500">
              Last update: {new Date(lastUpdate).toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Customer Message & Transcript Panel */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Customer Message & Transcript
          </h2>
          
          {customerMessage && (
            <div className="mb-4 space-y-3">
              <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm font-medium text-blue-800">Customer Message:</span>
                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                    Live
                  </span>
                </div>
                <p className="text-blue-900">{customerMessage}</p>
              </div>
              
              {foodhubContext && (
                <div className="p-4 bg-orange-50 border-l-4 border-orange-400 rounded-r-lg">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-sm font-medium text-orange-800">🍕 FoodHub Analysis:</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium text-orange-700">Restaurants Found:</span>
                      <span className="ml-2 px-2 py-1 rounded text-xs bg-orange-100 text-orange-800">
                        {foodhubContext.restaurants_found}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-orange-700">Promotions Found:</span>
                      <span className="ml-2 px-2 py-1 rounded text-xs bg-orange-100 text-orange-800">
                        {foodhubContext.promotions_found}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-orange-700">Cuisine Preferences:</span>
                      <span className="ml-2 px-2 py-1 rounded text-xs bg-orange-100 text-orange-800">
                        {foodhubContext.cuisine_preferences?.join(', ') || 'None detected'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-orange-700">Price Sensitivity:</span>
                      <span className={`ml-2 px-2 py-1 rounded text-xs ${
                        foodhubContext.price_sensitivity === 'low' ? 'bg-green-100 text-green-800' :
                        foodhubContext.price_sensitivity === 'high' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {foodhubContext.price_sensitivity}
                      </span>
                    </div>
                  </div>
                  {foodhubContext.delivery_preferences && foodhubContext.delivery_preferences.length > 0 && (
                    <div className="mt-3">
                      <span className="font-medium text-orange-700">Delivery Preferences:</span>
                      <p className="text-orange-700 text-sm mt-1">{foodhubContext.delivery_preferences.join(', ')}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          <TranscriptPane transcript={transcript} />
        </div>
      </div>
    </div>
  );
}
