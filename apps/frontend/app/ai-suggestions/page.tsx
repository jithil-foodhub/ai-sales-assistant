"use client";

import React, { useState, useEffect } from "react";
import {
  Brain,
  Lightbulb,
  TrendingUp,
  Target,
  Zap,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import LiveAISuggestions from "../../components/LiveAISuggestions";

interface AISuggestion {
  text: string;
  offer_id: string;
  type: string;
  confidence: number;
  deliver_as: "say" | "show" | "email";
  reasoning?: string;
}

export default function AISuggestionsPage() {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [currentCall, setCurrentCall] = useState<any>(null);
  const [currentCallSid, setCurrentCallSid] = useState<string | null>(null);

  useEffect(() => {
    // WebSocket connection for real-time updates
    console.log("🚀 Starting WebSocket connection for AI Suggestions...");
    const ws = new WebSocket("ws://localhost:3000/ws");

    ws.onopen = () => {
      setIsConnected(true);
      console.log("🔌 Connected to WebSocket for AI Suggestions");
      console.log("🔌 WebSocket ready state:", ws.readyState);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log("📨 AI Suggestions message received:", message);
        console.log("📨 Message type:", message.type);
        console.log("📨 Message data:", JSON.stringify(message, null, 2));

        // Handle live transcript chunks
        if (message.type === "live_transcript_chunk") {
          console.log(
            `📝 Live transcript [${message.speaker || 'Unknown'}]: "${message.transcript}"`
          );
          
          // Set current call SID if not set, or if this is a new call
          if (!currentCallSid || currentCallSid !== message.callSid) {
            setCurrentCallSid(message.callSid);
            console.log(`🆔 Setting current call SID: ${message.callSid}`);
          }
          
          // Only process if this is the current call
          if (currentCallSid === null || message.callSid === currentCallSid) {
            setCurrentCall((prev) => ({
              ...prev,
              callSid: message.callSid || 'unknown',
              speaker: message.speaker || 'Unknown',
              transcript: message.transcript,
              fullTranscript: message.fullTranscript || message.transcript,
              confidence: message.confidence || 0.5,
            }));
          }
        }

        // Handle live analysis with AI suggestions
        if (message.type === "live_analysis") {
          console.log(`🤖 Live analysis: ${message.moodAnalysis?.mood || 'unknown'} mood`);
          console.log(`🤖 Call SID: ${message.callSid}, Current: ${currentCallSid}`);
          
          // Only process if this is the current call or if no current call is set
          if (currentCallSid === null || message.callSid === currentCallSid) {
            console.log(`✅ Processing suggestions for current call`);
            setSuggestions(message.suggestions || []);
            setLastUpdate(message.timestamp || new Date().toISOString());
          } else {
            console.log(`⏭️ Skipping suggestions for different call`);
          }
        }

        // Handle final analysis
        if (message.type === "final_analysis") {
          console.log(`✅ Final analysis complete`);
          setSuggestions(message.callRecord.aiSuggestions || []);
          setLastUpdate(message.timestamp);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log("🔌 WebSocket disconnected");
    };

    ws.onerror = (error) => {
      console.error("❌ WebSocket error:", error);
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, []);

  const handleSuggestionAction = (
    suggestion: AISuggestion,
    action: "accept" | "reject"
  ) => {
    console.log(`Suggestion ${action}:`, suggestion);

    // Remove the suggestion from the list
    setSuggestions((prev) => prev.filter((s) => s !== suggestion));

    // In a real implementation, you would send this action back to the server
    // and potentially update the agent's performance metrics
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case "product_recommendation":
        return <Target className="w-5 h-5" />;
      case "solution_consultation":
        return <Brain className="w-5 h-5" />;
      case "business_growth":
        return <TrendingUp className="w-5 h-5" />;
      case "pricing_inquiry":
        return <Zap className="w-5 h-5" />;
      default:
        return <Lightbulb className="w-5 h-5" />;
    }
  };

  const getSuggestionColor = (type: string) => {
    switch (type) {
      case "product_recommendation":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "solution_consultation":
        return "bg-green-100 text-green-800 border-green-200";
      case "business_growth":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "pricing_inquiry":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <AppLayout currentScreen="ai-suggestions">
      <div className="p-8 bg-gradient-to-br from-slate-50 to-blue-50 h-full">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-slate-900 mb-2">
                  AI Sales Suggestions
                </h1>
                <p className="text-xl text-slate-600">
                  Real-time AI-powered sales recommendations
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div
                  className={`flex items-center px-3 py-2 rounded-lg ${
                    isConnected
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full mr-2 ${
                      isConnected ? "bg-green-500" : "bg-red-500"
                    }`}
                  ></div>
                  {isConnected ? "Live" : "Disconnected"}
                </div>
                {lastUpdate && (
                  <div className="text-sm text-slate-500">
                    Last update: {new Date(lastUpdate).toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Current Call Info */}
          {currentCall && (
            <div className="mb-8 bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Current Call
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-slate-600">Call ID</p>
                  <p className="font-medium text-slate-900">
                    {currentCall.callSid}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Current Speaker</p>
                  <p className="font-medium text-slate-900">
                    {currentCall.speaker}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Confidence</p>
                  <p className="font-medium text-slate-900">
                    {(currentCall.confidence * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
              {currentCall.fullTranscript && (
                <div className="mt-4">
                  <p className="text-sm text-slate-600 mb-2">Live Transcript</p>
                  <div className="bg-slate-50 rounded-lg p-4 max-h-32 overflow-y-auto">
                    <p className="text-sm text-slate-800">
                      {currentCall.fullTranscript}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AI Suggestions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Suggestions List */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-slate-900">
                  Live Suggestions
                </h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      // Add test suggestion to verify display works
                      const testSuggestion = {
                        text: "I'd be happy to help you explore our restaurant technology solutions. Let me understand your specific needs better - what type of restaurant are you running?",
                        offer_id: "solution_consultation",
                        type: "solution_consultation",
                        confidence: 0.7,
                        deliver_as: "say" as const,
                        reasoning: "Test suggestion to verify display"
                      };
                      setSuggestions([testSuggestion]);
                      setLastUpdate(new Date().toISOString());
                    }}
                    className="flex items-center px-3 py-2 text-green-600 hover:text-green-800"
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Test Suggestion
                  </button>
                  <button
                    onClick={() => setSuggestions([])}
                    className="flex items-center px-3 py-2 text-slate-600 hover:text-slate-800"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Clear All
                  </button>
                </div>
              </div>

              {suggestions.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200 text-center">
                  <Brain className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    No Suggestions Yet
                  </h3>
                  <p className="text-slate-600 mb-4">
                    AI suggestions will appear here as the conversation
                    progresses
                  </p>
                  <div className="text-sm text-slate-500">
                    Make sure a call is active and transcription is working
                  </div>
                  <div className="text-xs text-slate-400 mt-2">
                    Debug: Suggestions count: {suggestions.length}, Connected: {isConnected ? 'Yes' : 'No'}
                    <br />
                    Current Call SID: {currentCallSid || 'None'}
                  </div>
                  <div className="flex space-x-2 mt-2">
                    <button
                      onClick={() => {
                        // Trigger a test transcription to verify WebSocket
                        fetch('/api/test-websocket', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ test: true })
                        }).then(() => {
                          console.log('Test WebSocket request sent');
                        }).catch(console.error);
                      }}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                    >
                      Test WebSocket
                    </button>
                    <button
                      onClick={() => {
                        // Clear current call SID to accept any call
                        setCurrentCallSid(null);
                        setSuggestions([]);
                        setCurrentCall(null);
                        console.log('Cleared current call SID - will accept any call');
                      }}
                      className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                    >
                      Clear Call Filter
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={`${suggestion.offer_id}-${index}`}
                      className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`p-2 rounded-lg ${getSuggestionColor(
                              suggestion.type
                            )}`}
                          >
                            {getSuggestionIcon(suggestion.type)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900 capitalize">
                              {suggestion.type.replace("_", " ")}
                            </h3>
                            <p className="text-sm text-slate-600">
                              Confidence:{" "}
                              {(suggestion.confidence * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() =>
                              handleSuggestionAction(suggestion, "accept")
                            }
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Accept suggestion"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() =>
                              handleSuggestionAction(suggestion, "reject")
                            }
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Reject suggestion"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-slate-800 leading-relaxed">
                          {suggestion.text}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-4">
                          <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded">
                            {suggestion.deliver_as}
                          </span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                            {suggestion.offer_id}
                          </span>
                        </div>
                        {suggestion.reasoning && (
                          <button className="text-blue-600 hover:text-blue-800">
                            View Reasoning
                          </button>
                        )}
                      </div>

                      {suggestion.reasoning && (
                        <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                          <p className="text-sm text-slate-700">
                            <strong>Reasoning:</strong> {suggestion.reasoning}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Performance Metrics */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-slate-900">
                Performance Metrics
              </h2>

              <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  Suggestion Statistics
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Total Suggestions</span>
                    <span className="font-semibold text-slate-900">
                      {suggestions.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">High Confidence</span>
                    <span className="font-semibold text-green-600">
                      {suggestions.filter((s) => s.confidence > 0.8).length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Average Confidence</span>
                    <span className="font-semibold text-slate-900">
                      {suggestions.length > 0
                        ? (
                            (suggestions.reduce(
                              (acc, s) => acc + s.confidence,
                              0
                            ) /
                              suggestions.length) *
                            100
                          ).toFixed(1)
                        : 0}
                      %
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  Suggestion Types
                </h3>
                <div className="space-y-3">
                  {[
                    "product_recommendation",
                    "solution_consultation",
                    "business_growth",
                    "pricing_inquiry",
                  ].map((type) => {
                    const count = suggestions.filter(
                      (s) => s.type === type
                    ).length;
                    return (
                      <div
                        key={type}
                        className="flex justify-between items-center"
                      >
                        <span className="text-slate-600 capitalize">
                          {type.replace("_", " ")}
                        </span>
                        <span className="font-semibold text-slate-900">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
