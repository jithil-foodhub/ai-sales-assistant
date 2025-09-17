"use client";

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { ConversationFlowChart } from '@/components/ConversationFlowChart';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Phone, 
  Clock, 
  Star,
  MessageSquare,
  Target,
  AlertCircle,
  CheckCircle,
  Activity,
  PieChart
} from 'lucide-react';

interface CallAnalytics {
  totalCalls: number;
  averageDuration: number;
  customerSatisfaction: number;
  agentPerformance: number;
  topTopics: Array<{ topic: string; count: number }>;
  callTrends: Array<{ date: string; calls: number; satisfaction: number }>;
  conversationFlow: Array<{
    timestamp: number;
    speaker: 'customer' | 'agent';
    content: string;
    sentiment: number;
    topic: string;
  }>;
  insights: {
    strengths: string[];
    improvements: string[];
    recommendations: string[];
  };
}

export default function AnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<CallAnalytics | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');

  useEffect(() => {
    fetchAnalytics();
  }, [selectedTimeRange]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/analytics?range=${selectedTimeRange}`);
      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <AppLayout currentScreen="analytics">
        <div className="p-8 bg-gradient-to-br from-slate-50 to-blue-50 h-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading analytics...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout currentScreen="analytics">
      <div className="p-8 bg-gradient-to-br from-slate-50 to-blue-50 h-full overflow-y-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Call Analytics</h1>
              <p className="text-slate-600">Comprehensive insights into call performance and customer engagement</p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Calls</p>
                <p className="text-3xl font-bold text-slate-900">{analytics?.totalCalls || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Phone className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Avg Duration</p>
                <p className="text-3xl font-bold text-slate-900">{analytics?.averageDuration || 0}m</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Customer Satisfaction</p>
                <p className="text-3xl font-bold text-slate-900">
                  {analytics?.customerSatisfaction ? Math.round(analytics.customerSatisfaction * 100) : 0}%
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Agent Performance</p>
                <p className="text-3xl font-bold text-slate-900">
                  {analytics?.agentPerformance ? Math.round(analytics.agentPerformance * 100) : 0}%
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Visualizations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Call Trends Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
              Call Trends
            </h3>
            <div className="h-64 flex items-center justify-center text-slate-500">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 text-slate-400" />
                <p>Call trends chart will be displayed here</p>
              </div>
            </div>
          </div>

          {/* Top Topics */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
              <PieChart className="w-5 h-5 mr-2 text-green-600" />
              Top Discussion Topics
            </h3>
            <div className="space-y-3">
              {analytics?.topTopics?.map((topic, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-slate-700 capitalize">{topic.topic}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${(topic.count / (analytics.topTopics[0]?.count || 1)) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-slate-500 w-8">{topic.count}</span>
                  </div>
                </div>
              )) || (
                <p className="text-slate-500 text-center py-4">No topic data available</p>
              )}
            </div>
          </div>
        </div>

        {/* Conversation Flow Visualization */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200 mb-8">
          <ConversationFlowChart 
            segments={analytics?.conversationFlow || []}
            className="h-96"
          />
        </div>

        {/* Insights and Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Strengths */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
              Strengths
            </h3>
            <div className="space-y-2">
              {analytics?.insights?.strengths?.map((strength, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-slate-700">{strength}</p>
                </div>
              )) || (
                <p className="text-slate-500 text-sm">No strengths data available</p>
              )}
            </div>
          </div>

          {/* Improvements */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-yellow-600" />
              Areas for Improvement
            </h3>
            <div className="space-y-2">
              {analytics?.insights?.improvements?.map((improvement, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-slate-700">{improvement}</p>
                </div>
              )) || (
                <p className="text-slate-500 text-sm">No improvement data available</p>
              )}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
              <Target className="w-5 h-5 mr-2 text-blue-600" />
              Recommendations
            </h3>
            <div className="space-y-2">
              {analytics?.insights?.recommendations?.map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-slate-700">{recommendation}</p>
                </div>
              )) || (
                <p className="text-slate-500 text-sm">No recommendations available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}