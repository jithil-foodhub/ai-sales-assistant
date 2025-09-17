'use client';

import React from 'react';
import LiveAISuggestions from './LiveAISuggestions';

/**
 * Example usage of the LiveAISuggestions component
 * This demonstrates how to integrate the component into your pages
 */
export const LiveAISuggestionsExample: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">
        Live AI Suggestions Component Examples
      </h1>

      {/* Basic Usage */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-800">Basic Usage</h2>
        <LiveAISuggestions 
          className="w-full"
          showHeader={true}
          maxSuggestions={5}
        />
      </div>

      {/* Without Header */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-800">Without Header</h2>
        <LiveAISuggestions 
          className="w-full"
          showHeader={false}
          maxSuggestions={3}
        />
      </div>

      {/* With Agent ID and Call SID */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-800">With Agent ID and Call SID</h2>
        <LiveAISuggestions 
          agentId="agent123"
          callSid="call456"
          className="w-full"
          showHeader={true}
          maxSuggestions={8}
        />
      </div>

      {/* Compact Version */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-800">Compact Version</h2>
        <div className="max-w-md">
          <LiveAISuggestions 
            className="w-full"
            showHeader={true}
            maxSuggestions={3}
          />
        </div>
      </div>
    </div>
  );
};

export default LiveAISuggestionsExample;
