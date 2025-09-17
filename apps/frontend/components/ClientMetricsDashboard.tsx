'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  MessageSquare, 
  Target, 
  Activity,
  PieChart,
  LineChart,
  Users,
  Star,
  AlertCircle,
  CheckCircle,
  Phone,
  Calendar
} from 'lucide-react';

interface CallRecord {
  _id: string;
  timestamp: string;
  callStartTime?: string;
  callEndTime?: string;
  duration: number;
  direction: 'inbound' | 'outbound';
  status: string;
  outcome: string;
  mood: 'positive' | 'neutral' | 'negative';
  sentiment: number;
  callAnalysis?: {
    summary: string;
    keyTopics: string[];
    customerEngagement: number;
    agentPerformance: number;
    conversationFlow: {
      segments: Array<{
        timestamp: number;
        speaker: 'customer' | 'agent';
        content: string;
        sentiment: number;
        topic?: string;
      }>;
    };
    metrics: {
      totalWords: number;
      customerWords: number;
      agentWords: number;
      speakingTimeRatio: number;
      averageResponseTime: number;
      interruptionCount: number;
      questionCount: number;
      objectionCount: number;
      agreementCount: number;
      solutionMentioned: boolean;
      nextStepsAgreed: boolean;
      customerSatisfaction: number;
    };
    insights: {
      strengths: string[];
      improvements: string[];
      recommendations: string[];
      riskFactors: string[];
    };
  };
}

interface ClientMetricsDashboardProps {
  clientId: string;
  callRecords: CallRecord[];
}

export function ClientMetricsDashboard({ clientId, callRecords }: ClientMetricsDashboardProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);

  // Calculate aggregated metrics
  const calculateMetrics = () => {
    const recordsWithAnalysis = callRecords.filter(call => call.callAnalysis);
    
    if (recordsWithAnalysis.length === 0) {
      return {
        totalCalls: callRecords.length,
        averageDuration: 0,
        averageSatisfaction: 0,
        averageEngagement: 0,
        averagePerformance: 0,
        totalQuestions: 0,
        totalObjections: 0,
        successRate: 0,
        topicDistribution: [],
        sentimentTrend: [],
        performanceTrend: [],
        engagementTrend: []
      };
    }

    const totalCalls = callRecords.length;
    const totalDurationSeconds = callRecords.reduce((sum, call) => sum + (call.duration || 0), 0);
    const averageDuration = totalCalls > 0 ? totalDurationSeconds / totalCalls : 0; // seconds
    
    const averageSatisfaction = recordsWithAnalysis.reduce((sum, call) => 
      sum + (call.callAnalysis?.metrics?.customerSatisfaction || 0), 0) / recordsWithAnalysis.length;
    
    const averageEngagement = recordsWithAnalysis.reduce((sum, call) => 
      sum + (call.callAnalysis?.customerEngagement || 0), 0) / recordsWithAnalysis.length;
    
    const averagePerformance = recordsWithAnalysis.reduce((sum, call) => 
      sum + (call.callAnalysis?.agentPerformance || 0), 0) / recordsWithAnalysis.length;

    const totalQuestions = recordsWithAnalysis.reduce((sum, call) => 
      sum + (call.callAnalysis?.metrics?.questionCount || 0), 0);
    
    const totalObjections = recordsWithAnalysis.reduce((sum, call) => 
      sum + (call.callAnalysis?.metrics?.objectionCount || 0), 0);

    const successRate = callRecords.filter(call => call.outcome === 'successful').length / totalCalls;

    // Topic distribution
    const topicCounts: { [key: string]: number } = {};
    recordsWithAnalysis.forEach(call => {
      call.callAnalysis?.keyTopics?.forEach(topic => {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      });
    });
    const topicDistribution = Object.entries(topicCounts)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count);

    // Sentiment trend over time
    const sentimentTrend = callRecords
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map(call => ({
        date: new Date(call.timestamp).toLocaleDateString(),
        sentiment: call.sentiment,
        mood: call.mood
      }));

    // Performance trend
    const performanceTrend = recordsWithAnalysis
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map(call => ({
        date: new Date(call.timestamp).toLocaleDateString(),
        performance: call.callAnalysis?.agentPerformance || 0,
        engagement: call.callAnalysis?.customerEngagement || 0
      }));

    // Format duration for display
    const formatDuration = (seconds: number) => {
      if (seconds < 60) {
        return `${Math.round(seconds)}s`;
      } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.round(seconds % 60);
        return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
      } else {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
      }
    };

    return {
      totalCalls,
      averageDuration: formatDuration(averageDuration),
      averageSatisfaction: Math.round(averageSatisfaction * 100) / 100,
      averageEngagement: Math.round(averageEngagement * 100) / 100,
      averagePerformance: Math.round(averagePerformance * 100) / 100,
      totalQuestions,
      totalObjections,
      successRate: Math.round(successRate * 100),
      topicDistribution,
      sentimentTrend,
      performanceTrend,
      engagementTrend: performanceTrend
    };
  };

  const metrics = calculateMetrics();

  // Chart components
  const SentimentTrendChart = () => (
    <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8 border border-slate-200 overflow-hidden">
      <h3 className="text-xl font-semibold text-slate-900 mb-6 flex items-center">
        <TrendingUp className="w-6 h-6 mr-3 text-blue-600" />
        Sentiment Trend Over Time
      </h3>
      
      {/* Sentiment Context Legend - Responsive Layout */}
      <div className="mb-6 p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200">
        <h4 className="text-sm font-semibold text-slate-700 mb-3">Sentiment Scale</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
          <div className="flex items-center space-x-2 p-2 lg:p-3 bg-white rounded-lg border border-green-200">
            <div className="w-3 h-3 lg:w-4 lg:h-4 rounded-full bg-green-500 flex-shrink-0"></div>
            <div className="min-w-0">
              <span className="text-green-700 font-semibold text-xs lg:text-sm">Positive (0.3+)</span>
              <p className="text-xs text-slate-600 truncate">Customer engaged, satisfied</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 p-2 lg:p-3 bg-white rounded-lg border border-yellow-200">
            <div className="w-3 h-3 lg:w-4 lg:h-4 rounded-full bg-yellow-500 flex-shrink-0"></div>
            <div className="min-w-0">
              <span className="text-yellow-700 font-semibold text-xs lg:text-sm">Neutral (-0.3 to 0.3)</span>
              <p className="text-xs text-slate-600 truncate">Standard interaction</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 p-2 lg:p-3 bg-white rounded-lg border border-red-200">
            <div className="w-3 h-3 lg:w-4 lg:h-4 rounded-full bg-red-500 flex-shrink-0"></div>
            <div className="min-w-0">
              <span className="text-red-700 font-semibold text-xs lg:text-sm">Negative (-0.3-)</span>
              <p className="text-xs text-slate-600 truncate">Customer frustrated, needs attention</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Area - Responsive Height */}
      <div className="h-64 lg:h-80 flex items-center justify-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 overflow-hidden">
        <div className="text-center w-full max-w-full px-4">
          {/* <LineChart className="w-12 h-12 lg:w-16 lg:h-16 mx-auto mb-4 text-slate-400" /> */}
          <h4 className="text-base lg:text-lg font-semibold text-slate-600 mb-2">Sentiment Trend Chart</h4>
          {/* <p className="text-sm text-slate-500 mb-4 lg:mb-6">Interactive chart will be displayed here</p> */}
          
          {/* Recent Sentiment Data - Responsive Layout */}
          {metrics.sentimentTrend.length > 0 && (
            <div className="bg-white rounded-lg p-3 lg:p-4 border border-slate-200 max-w-sm lg:max-w-md mx-auto">
              <h5 className="text-xs lg:text-sm font-semibold text-slate-700 mb-3">Recent Sentiment Data</h5>
              <div className="space-y-2 lg:space-y-3 max-h-32 overflow-y-auto">
                {metrics.sentimentTrend.slice(-5).map((point, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg min-w-0">
                    <span className="text-xs lg:text-sm font-medium text-slate-700 truncate flex-shrink-0 mr-2">
                      {point.date}
                    </span>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <div className={`w-3 h-3 lg:w-4 lg:h-4 rounded-full ${
                        point.sentiment > 0.3 ? 'bg-green-500' :
                        point.sentiment < -0.3 ? 'bg-red-500' : 'bg-yellow-500'
                      }`}></div>
                      <span className="text-xs lg:text-sm font-semibold text-slate-600">
                        {point.sentiment > 0 ? '+' : ''}{point.sentiment.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const TopicDistributionChart = () => (
    <div className="bg-white rounded-xl shadow-lg p-8 border border-slate-200 h-full">
      <h3 className="text-xl font-semibold text-slate-900 mb-6 flex items-center">
        <MessageSquare className="w-6 h-6 mr-3 text-green-600" />
        Discussion Topics
      </h3>
      <div className="space-y-4">
        {metrics.topicDistribution.slice(0, 8).map((topic, index) => {
          const maxCount = metrics.topicDistribution[0]?.count || 1;
          const percentage = (topic.count / maxCount) * 100;
          
          return (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700 capitalize truncate max-w-[60%]">
                  {topic.topic.replace(/_/g, ' ')}
                </span>
                <div className="flex items-center space-x-3">
                  <span className="text-lg font-bold text-green-600 min-w-[2rem] text-right">
                    {topic.count}
                  </span>
                </div>
              </div>
              <div className="w-full bg-gradient-to-r from-slate-100 to-slate-200 rounded-full h-3 shadow-inner">
                <div 
                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full shadow-sm transition-all duration-500" 
                  style={{ width: `${Math.max(percentage, 8)}%` }}
                ></div>
              </div>
            </div>
          );
        })}
        
        {metrics.topicDistribution.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-sm">No discussion topics available</p>
          </div>
        )}
      </div>
    </div>
  );

  const PerformanceMetricsChart = () => (
    <div className="bg-white rounded-xl shadow-lg p-8 border border-slate-200 h-full">
      <h3 className="text-xl font-semibold text-slate-900 mb-6 flex items-center">
        <Target className="w-6 h-6 mr-3 text-purple-600" />
        Performance Metrics
      </h3>
      <div className="space-y-8">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">Agent Performance</span>
            <span className="text-2xl font-bold text-purple-600">{metrics.averagePerformance.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gradient-to-r from-slate-100 to-slate-200 rounded-full h-4 shadow-inner">
            <div 
              className="bg-gradient-to-r from-purple-500 to-indigo-500 h-4 rounded-full shadow-sm transition-all duration-500" 
              style={{ width: `${Math.max(metrics.averagePerformance, 5)}%` }}
            ></div>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">Customer Engagement</span>
            <span className="text-2xl font-bold text-blue-600">{(metrics.averageEngagement * 100).toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gradient-to-r from-slate-100 to-slate-200 rounded-full h-4 shadow-inner">
            <div 
              className="bg-gradient-to-r from-blue-500 to-cyan-500 h-4 rounded-full shadow-sm transition-all duration-500" 
              style={{ width: `${Math.max(metrics.averageEngagement * 100, 5)}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );

  const CallDurationChart = () => (
    <div className="bg-white rounded-xl shadow-lg p-8 border border-slate-200 h-full">
      <h3 className="text-xl font-semibold text-slate-900 mb-6 flex items-center">
        <Clock className="w-6 h-6 mr-3 text-orange-600" />
        Call Duration Analysis
      </h3>
      <div className="space-y-4 max-h-80 overflow-y-auto">
        {callRecords.slice(0, 10).map((call, index) => {
          const durationMinutes = Math.round(call.duration / 60);
          const maxDuration = Math.max(...callRecords.slice(0, 10).map(c => c.duration));
          const percentage = maxDuration > 0 ? (call.duration / maxDuration) * 100 : 0;
          
          return (
            <div key={call._id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full shadow-sm ${
                    call.direction === 'inbound' ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-blue-400 to-cyan-500'
                  }`}></div>
                  <span className="text-sm font-medium text-slate-700">
                    {new Date(call.timestamp).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-lg font-bold text-orange-600 min-w-[3rem] text-right">
                    {durationMinutes}m
                  </span>
                </div>
              </div>
              <div className="w-full bg-gradient-to-r from-slate-100 to-slate-200 rounded-full h-3 shadow-inner">
                <div 
                  className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full shadow-sm transition-all duration-500" 
                  style={{ width: `${Math.max(percentage, 8)}%` }}
                ></div>
              </div>
            </div>
          );
        })}
        
        {callRecords.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <Clock className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-sm">No call duration data available</p>
          </div>
        )}
      </div>
    </div>
  );

  const ConversationFlowChart = ({ call }: { call: CallRecord }) => {
    if (!call.callAnalysis?.conversationFlow?.segments) return null;
    
    const segments = call.callAnalysis.conversationFlow.segments.slice(0, 10);
    
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
          <MessageSquare className="w-5 h-5 mr-2 text-indigo-600" />
          Conversation Flow - {new Date(call.timestamp).toLocaleDateString()}
        </h3>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {segments.map((segment, index) => {
            const isCustomer = segment.speaker === 'customer';
            const sentimentColor = segment.sentiment > 0.3 ? 'bg-green-100 border-green-300' :
                                 segment.sentiment < -0.3 ? 'bg-red-100 border-red-300' : 'bg-yellow-100 border-yellow-300';
            
            return (
              <div key={index} className={`flex ${isCustomer ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[80%] p-3 rounded-lg border ${sentimentColor}`}>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs font-semibold text-slate-700 capitalize">
                      {segment.speaker}
                    </span>
                    <span className="text-xs text-slate-500">
                      {Math.round(segment.timestamp / 60)}:{(segment.timestamp % 60).toString().padStart(2, '0')}
                    </span>
                    {segment.topic && (
                      <span className="px-1 py-0.5 bg-slate-200 text-slate-600 rounded text-xs">
                        {segment.topic}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-800">{segment.content}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-7xl mx-auto p-8">
        {/* Enhanced Header */}
        <div className="mb-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-black bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent">
                    Client Metrics Dashboard
                  </h1>
                  <p className="text-lg text-slate-600 font-medium">
                    Comprehensive analytics for client call performance
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="px-6 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 font-medium shadow-sm"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>
        </div>

        {/* Enhanced Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200/50 hover:shadow-2xl transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Phone className="w-7 h-7 text-white" />
              </div>
              <div className="text-right">
                <p className="text-4xl font-black text-slate-900 group-hover:text-blue-600 transition-colors duration-300">
                  {metrics.totalCalls}
                </p>
              </div>
            </div>
            <p className="text-sm font-bold text-slate-600 uppercase tracking-wider">Total Calls</p>
            <div className="mt-2 w-full bg-slate-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full w-full"></div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200/50 hover:shadow-2xl transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Clock className="w-7 h-7 text-white" />
              </div>
              <div className="text-right">
                <p className="text-4xl font-black text-slate-900 group-hover:text-green-600 transition-colors duration-300">
                  {metrics.averageDuration}
                </p>
              </div>
            </div>
            <p className="text-sm font-bold text-slate-600 uppercase tracking-wider">Avg Duration</p>
            <div className="mt-2 w-full bg-slate-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full w-4/5"></div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200/50 hover:shadow-2xl transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Star className="w-7 h-7 text-white" />
              </div>
              <div className="text-right">
                <p className="text-4xl font-black text-slate-900 group-hover:text-yellow-600 transition-colors duration-300">
                  {metrics.successRate}%
                </p>
              </div>
            </div>
            <p className="text-sm font-bold text-slate-600 uppercase tracking-wider">Success Rate</p>
            <div className="mt-2 w-full bg-slate-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-yellow-500 to-orange-600 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${metrics.successRate}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200/50 hover:shadow-2xl transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div className="text-right">
                <p className="text-4xl font-black text-slate-900 group-hover:text-purple-600 transition-colors duration-300">
                  {Math.round(metrics.averageSatisfaction * 100)}%
                </p>
              </div>
            </div>
            <p className="text-sm font-bold text-slate-600 uppercase tracking-wider">Avg Satisfaction</p>
            <div className="mt-2 w-full bg-slate-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-600 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${Math.round(metrics.averageSatisfaction * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

      {/* Charts Grid */}
      <div className="space-y-8 mb-8">
        {/* Top Section - Sentiment Trend (Full Width) */}
        <div className="w-full">
          <SentimentTrendChart />
        </div>
        
        {/* Bottom Section - 3 Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <TopicDistributionChart />
          <PerformanceMetricsChart />
          <CallDurationChart />
        </div>
      </div>

      {/* Individual Call Analysis */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Individual Call Analysis</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {callRecords.slice(0, 4).map((call) => (
            <div key={call._id} className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {new Date(call.timestamp).toLocaleDateString()}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {call.direction} • {Math.round(call.duration / 60)}m • {call.mood}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedCall(selectedCall?._id === call._id ? null : call)}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                >
                  {selectedCall?._id === call._id ? 'Hide Details' : 'Show Details'}
                </button>
              </div>

              {call.callAnalysis && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-sm text-slate-500 mb-1">Engagement</div>
                      <div className="text-lg font-semibold text-slate-900">
                        {Math.round((call.callAnalysis.customerEngagement || 0) * 100)}%
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-slate-500 mb-1">Performance</div>
                      <div className="text-lg font-semibold text-slate-900">
                        {Math.round((call.callAnalysis.agentPerformance || 0) * 100)}%
                      </div>
                    </div>
                  </div>

                  {call.callAnalysis.summary && (
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <p className="text-sm text-slate-700">{call.callAnalysis.summary}</p>
                    </div>
                  )}

                  {selectedCall?._id === call._id && (
                    <ConversationFlowChart call={call} />
                  )}
                </div>
              )}
          </div>
        ))}
        </div>
      </div>
      </div>
    </div>
  );
}
