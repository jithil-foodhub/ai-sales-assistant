'use client';

import React from 'react';
import { BarChart3, TrendingUp, Smile, Frown, Meh } from 'lucide-react';

interface EmotionGraphProps {
  emotions: string[];
  scores: { [key: string]: number };
  primaryMood: string;
  sentiment: number;
  className?: string;
}

export function EmotionGraph({ emotions, scores, primaryMood, sentiment, className = '' }: EmotionGraphProps) {
  const getEmotionIcon = (emotion: string) => {
    switch (emotion) {
      case 'happy':
      case 'satisfied':
      case 'confident':
        return <Smile className="w-4 h-4 text-green-500" />;
      case 'frustrated':
      case 'confused':
      case 'worried':
      case 'disappointed':
        return <Frown className="w-4 h-4 text-red-500" />;
      default:
        return <Meh className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getEmotionColor = (emotion: string) => {
    switch (emotion) {
      case 'happy':
      case 'satisfied':
      case 'confident':
        return 'bg-green-500';
      case 'frustrated':
      case 'confused':
      case 'worried':
      case 'disappointed':
        return 'bg-red-500';
      default:
        return 'bg-yellow-500';
    }
  };

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'positive':
        return 'text-green-600 bg-green-100';
      case 'negative':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-yellow-600 bg-yellow-100';
    }
  };

  const sortedEmotions = emotions
    .map(emotion => ({
      emotion,
      score: scores[emotion] || 0
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5); // Show top 5 emotions

  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-slate-600" />
          <h4 className="text-sm font-semibold text-slate-900">Customer Emotions</h4>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getMoodColor(primaryMood)}`}>
          {primaryMood.toUpperCase()}
        </div>
      </div>

      {/* Sentiment Score */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-600">Sentiment Score</span>
          <span className="text-xs font-medium text-slate-900">
            {Math.round(sentiment * 100)}%
          </span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              sentiment > 0.6 ? 'bg-green-500' : sentiment < 0.4 ? 'bg-red-500' : 'bg-yellow-500'
            }`}
            style={{ width: `${sentiment * 100}%` }}
          />
        </div>
      </div>

      {/* Emotion Bars */}
      <div className="space-y-2">
        {sortedEmotions.map(({ emotion, score }) => (
          <div key={emotion} className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 min-w-0 flex-1">
              {getEmotionIcon(emotion)}
              <span className="text-xs text-slate-600 capitalize truncate">
                {emotion}
              </span>
            </div>
            <div className="flex items-center space-x-2 flex-1">
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${getEmotionColor(emotion)}`}
                  style={{ width: `${score * 100}%` }}
                />
              </div>
              <span className="text-xs text-slate-500 w-8 text-right">
                {Math.round(score * 100)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Real-time indicator */}
      <div className="mt-3 pt-3 border-t border-slate-100">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-xs text-slate-500">Live Analysis</span>
        </div>
      </div>
    </div>
  );
}
