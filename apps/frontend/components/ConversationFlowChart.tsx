'use client';

import React from 'react';
import { MessageSquare, User, Bot } from 'lucide-react';

interface ConversationSegment {
  timestamp: number;
  speaker: 'customer' | 'agent';
  content: string;
  sentiment: number;
  topic?: string;
}

interface ConversationFlowChartProps {
  segments: ConversationSegment[];
  className?: string;
}

export function ConversationFlowChart({ segments, className = '' }: ConversationFlowChartProps) {
  if (!segments || segments.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 text-slate-500 ${className}`}>
        <div className="text-center">
          <MessageSquare className="w-12 h-12 mx-auto mb-2 text-slate-400" />
          <p>No conversation data available</p>
        </div>
      </div>
    );
  }

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.3) return 'bg-green-100 border-green-300';
    if (sentiment < -0.3) return 'bg-red-100 border-red-300';
    return 'bg-yellow-100 border-yellow-300';
  };

  const getSentimentIcon = (sentiment: number) => {
    if (sentiment > 0.3) return '😊';
    if (sentiment < -0.3) return '😞';
    return '😐';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Conversation Flow</h3>
        <div className="flex items-center space-x-4 text-sm text-slate-500">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
            <span>Positive</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></div>
            <span>Neutral</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
            <span>Negative</span>
          </div>
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {segments.map((segment, index) => {
          const isCustomer = segment.speaker === 'customer';
          const sentimentColor = getSentimentColor(segment.sentiment);
          const sentimentIcon = getSentimentIcon(segment.sentiment);
          
          return (
            <div key={index} className={`flex ${isCustomer ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[80%] p-4 rounded-xl border-2 ${sentimentColor} ${
                isCustomer ? 'rounded-bl-sm' : 'rounded-br-sm'
              }`}>
                <div className="flex items-center space-x-2 mb-2">
                  {isCustomer ? (
                    <User className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Bot className="w-4 h-4 text-green-600" />
                  )}
                  <span className="text-sm font-semibold text-slate-700 capitalize">
                    {segment.speaker}
                  </span>
                  <span className="text-lg">{sentimentIcon}</span>
                  {segment.topic && (
                    <span className="px-2 py-1 bg-slate-200 text-slate-600 rounded-full text-xs">
                      {segment.topic}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-800 leading-relaxed">
                  {segment.content}
                </p>
                <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                  <span>{Math.round(segment.timestamp / 60)}:{(segment.timestamp % 60).toString().padStart(2, '0')}</span>
                  <span>Sentiment: {segment.sentiment.toFixed(2)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Conversation Summary */}
      <div className="mt-6 p-4 bg-slate-50 rounded-lg">
        <h4 className="text-sm font-semibold text-slate-700 mb-2">Conversation Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-slate-500">Total Exchanges:</span>
            <span className="ml-2 font-semibold text-slate-700">{segments.length}</span>
          </div>
          <div>
            <span className="text-slate-500">Customer Messages:</span>
            <span className="ml-2 font-semibold text-slate-700">
              {segments.filter(s => s.speaker === 'customer').length}
            </span>
          </div>
          <div>
            <span className="text-slate-500">Agent Messages:</span>
            <span className="ml-2 font-semibold text-slate-700">
              {segments.filter(s => s.speaker === 'agent').length}
            </span>
          </div>
          <div>
            <span className="text-slate-500">Avg Sentiment:</span>
            <span className="ml-2 font-semibold text-slate-700">
              {(segments.reduce((sum, s) => sum + s.sentiment, 0) / segments.length).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
