'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Brain, Target, RefreshCw, Zap, MessageSquare, Clock, CheckCircle } from 'lucide-react';
import { WebSocketClient, WebSocketMessage } from '../hooks/useWebSocket';

interface AISuggestion {
  text: string;
  offer_id: string;
  type: string;
  confidence: number;
  deliver_as: 'say' | 'internal_note' | 'immediate_response';
  reasoning?: string;
}

interface LiveAISuggestionsProps {
  agentId?: string;
  callSid?: string;
  className?: string;
  showHeader?: boolean;
  maxSuggestions?: number;
}

export const LiveAISuggestions: React.FC<LiveAISuggestionsProps> = ({
  agentId,
  callSid,
  className = '',
  showHeader = true,
  maxSuggestions = 21
}) => {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [currentCall, setCurrentCall] = useState<any>(null);
  const [isLiveStreaming, setIsLiveStreaming] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const wsRef = useRef<WebSocketClient | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever suggestions change
  useEffect(() => {
    if (scrollRef.current && suggestions.length > 0) {
      const scrollElement = scrollRef.current;
      scrollElement.scrollTo({
        top: scrollElement.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [suggestions]);

  useEffect(() => {
    // Initialize WebSocket connection
    console.log('🚀 Initializing Live AI Suggestions WebSocket...');
    const wsClient = new WebSocketClient();
    wsRef.current = wsClient;

    wsClient.onConnect = () => {
      console.log('🔌 Live AI Suggestions WebSocket connected');
      setIsConnected(true);
      setConnectionStatus('connected');
    };

    wsClient.onDisconnect = () => {
      console.log('🔌 Live AI Suggestions WebSocket disconnected');
      setIsConnected(false);
      setConnectionStatus('disconnected');
    };

    wsClient.onError = (error) => {
      console.error('❌ Live AI Suggestions WebSocket error:', error);
      setConnectionStatus('error');
    };

    wsClient.onMessage = (message: WebSocketMessage) => {
      console.log('📨 Live AI Suggestions received message:', message);
      
      // Handle different message types
      if (message.type === 'suggestions' || message.suggestions) {
        const newSuggestions = message.suggestions || [];
        setSuggestions(prev => {
          // Append new suggestions like chat messages
          const combined = [...prev, ...newSuggestions];
          return combined.slice(-maxSuggestions); // Keep only the last maxSuggestions
        });
        setLastUpdate(new Date().toISOString());
        // Auto-scroll to bottom with smooth behavior
        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTo({
              top: scrollRef.current.scrollHeight,
              behavior: 'smooth'
            });
          }
        }, 150);
      } else if (message.type === 'instant_suggestions') {
        // Handle instant suggestions
        const instantSuggestions = message.suggestions || [];
        setSuggestions(prev => {
          // Append instant suggestions like chat messages
          const combined = [...prev, ...instantSuggestions];
          return combined.slice(-maxSuggestions); // Keep only the last maxSuggestions
        });
        setLastUpdate(new Date().toISOString());
        console.log('⚡ Instant suggestions received:', instantSuggestions.length);
        // Auto-scroll to bottom with smooth behavior
        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTo({
              top: scrollRef.current.scrollHeight,
              behavior: 'smooth'
            });
          }
        }, 150);
      } else if (message.type === 'call_started') {
        setCurrentCall(message.callData);
        setIsLiveStreaming(true);
        console.log('📞 Call started:', message.callData);
      } else if (message.type === 'call_ended') {
        setCurrentCall(null);
        setIsLiveStreaming(false);
        console.log('📞 Call ended');
      } else if (message.type === 'transcript_chunk') {
        // Handle live transcript updates
        console.log('📝 Transcript chunk received:', message.transcript);
      }
    };

    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up Live AI Suggestions WebSocket');
      wsRef.current?.disconnect();
    };
  }, [agentId, callSid, maxSuggestions]);

  const handleSuggestionAction = (suggestion: AISuggestion, action: 'use' | 'dismiss') => {
    console.log(`🎯 Suggestion ${action}:`, suggestion);
    
    if (action === 'use') {
      // Handle suggestion usage
      console.log('✅ Using suggestion:', suggestion.text);
      // You can add logic here to send the suggestion to the agent or call system
    } else {
      // Remove dismissed suggestion
      setSuggestions(prev => prev.filter(s => s.offer_id !== suggestion.offer_id));
    }
  };

  const clearAllSuggestions = () => {
    setSuggestions([]);
    setLastUpdate('');
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-600';
      case 'connecting': return 'text-yellow-600';
      case 'disconnected': return 'text-red-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'disconnected': return 'Disconnected';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  const getSuggestionTypeLabel = (type: string) => {
    switch (type) {
      case 'agent_response': return 'RESPOND';
      case 'customer_question': return 'ANSWER';
      case 'competitor_mention': return 'COMPETE';
      case 'solution_consultation': return 'SOLVE';
      case 'product_recommendation': return 'OFFER';
      case 'pricing_inquiry': return 'PRICE';
      default: return 'SUGGEST';
    }
  };

  return (
    <div className={`bg-white rounded-2xl shadow-lg border border-slate-200 flex flex-col ${className}`}>
      {showHeader && (
        <div className="p-4 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Brain className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Live AI Suggestions
                </h3>
                <p className="text-xs text-slate-500">
                  Real-time chat assistance
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* Live Status */}
              {isLiveStreaming && (
                <div className="flex items-center space-x-1 py-1 px-2 bg-green-50 rounded-full border border-green-200">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-green-700">
                    LIVE
                  </span>
                </div>
              )}
              
              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-400 animate-pulse' :
                  connectionStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' :
                  'bg-red-400'
                }`}></div>
                <span className={`text-xs font-medium ${getConnectionStatusColor()}`}>
                  {getConnectionStatusText()}
                </span>
              </div>

              {/* Action Buttons */}
              {suggestions.length > 0 && (
                <button
                  onClick={clearAllSuggestions}
                  className="flex items-center px-2 py-1 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Clear all suggestions"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Chat Window Container */}
      <div className="flex-1 flex flex-col min-h-0">
        {suggestions.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Brain className="w-6 h-6 text-slate-400" />
              </div>
              <h4 className="text-sm font-medium text-slate-900 mb-1">
                No suggestions yet
              </h4>
              <p className="text-xs text-slate-500">
                {isConnected 
                  ? 'AI suggestions will appear here during calls'
                  : 'Connecting...'
                }
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Messages Area with Scrolling */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-4 min-h-[20rem] max-h-[36rem] scroll-smooth"
            >
              {suggestions.map((suggestion, index) => (
                <div
                  key={`${suggestion.offer_id}-${index}-${lastUpdate}`}
                  className="flex items-start space-x-3 animate-in slide-in-from-bottom-2 duration-300 w-full"
                >
                  {/* AI Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                      <Brain className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  
                  {/* Message Bubble */}
                  <div className="flex-1">
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl rounded-tl-sm p-4 border border-blue-200 shadow-sm">
                      {/* Message Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
                            {getSuggestionTypeLabel(suggestion.type)}
                          </span>
                          <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
                          <span className="text-xs text-slate-500">
                            {Math.round(suggestion.confidence * 100)}%
                          </span>
                        </div>
                      </div>

                      {/* Message Content */}
                      <p className="text-base text-slate-800 leading-relaxed mb-3">
                        {suggestion.text}
                      </p>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          now
                        </span>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleSuggestionAction(suggestion, 'use')}
                            className="flex items-center px-2 py-1 text-xs text-green-700 bg-green-50 hover:bg-green-100 rounded-full transition-colors border border-green-200"
                            title="Use this suggestion"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Use
                          </button>
                          <button
                            onClick={() => handleSuggestionAction(suggestion, 'dismiss')}
                            className="flex items-center px-2 py-1 text-xs text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            title="Dismiss suggestion"
                          >
                            <RefreshCw className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Chat Footer */}
            <div className="flex-shrink-0 p-3 border-t border-slate-100 bg-slate-50">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center">
                  <MessageSquare className="w-3 h-3 mr-1" />
                  {suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''}
                </span>
                <span className="flex items-center">
                  <Zap className="w-3 h-3 mr-1" />
                  Real-time AI
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LiveAISuggestions;
