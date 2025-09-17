"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Phone,
  Target,
  AlertTriangle,
  Lightbulb,
  Award,
  BarChart3,
  PieChart,
  Calendar,
  Clock,
  MessageSquare,
  CheckCircle,
  XCircle,
  Star,
  ArrowUp,
  ArrowDown,
  Minus,
  Eye,
  Filter
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";

interface AnalyticsData {
  overview: {
    totalCalls: number;
    conversionRate: number;
    avgDuration: number;
    avgPerformanceScore: number;
    avgCustomerSatisfaction: number;
  };
  performanceTrends: Array<{
    _id: string;
    avgPerformance: number;
    avgSatisfaction: number;
    callCount: number;
    successRate: number;
  }>;
  agentScorecard: {
    overallScore: number;
    salesTechniques: number;
    customerHandling: number;
    conversationQuality: number;
    topStrengths: Array<{ insight: string; count: number }>;
    topImprovements: Array<{ insight: string; count: number }>;
    metrics: {
      speakingTimeRatio: number;
      avgInterruptions: number;
      avgQuestions: number;
    };
  };
  topicAnalysis: Array<{
    _id: string;
    count: number;
    avgPerformance: number;
    avgSatisfaction: number;
    successRate: number;
  }>;
  objectionAnalysis: {
    totalObjections: number;
    callsWithObjections: number;
    avgObjectionsPerCall: number;
    objectionSuccessRate: number;
    objectionRate: number;
    resolutionRate: number;
    unresolvedCount: number;
    topUnresolvedIssues: Array<{
      callId: string;
      timestamp: string;
      objectionCount: number;
      riskFactors: string[];
      improvements: string[];
      customerSatisfaction: number;
      phoneNumber: string;
    }>;
  };
  featureRequests: Array<{
    _id: string;
    mentionCount: number;
    recentMention: string;
    firstMention: string;
    priority: number;
    successRate: number;
    daysSinceFirstMention: number;
    daysSinceLastMention: number;
  }>;
  competitorAnalysis: Array<{
    _id: string;
    mentionCount: number;
    avgPerformanceWhenMentioned: number;
  }>;
}

export default function EnhancedDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedView, setSelectedView] = useState('overview');

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics/enhanced?range=${timeRange}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        console.error('Failed to fetch analytics:', result.error);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600 bg-green-100";
    if (score >= 6) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 8) return <TrendingUp className="w-4 h-4" />;
    if (score >= 6) return <Minus className="w-4 h-4" />;
    return <TrendingDown className="w-4 h-4" />;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <AppLayout currentScreen="dashboard">
        <div className="p-8 bg-gradient-to-br from-slate-50 to-blue-50 h-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading enhanced analytics...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!data) {
    return (
      <AppLayout currentScreen="dashboard">
        <div className="p-8 bg-gradient-to-br from-slate-50 to-blue-50 h-full flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">No Data Available</h2>
            <p className="text-slate-600">Unable to load analytics data. Please try again.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout currentScreen="dashboard">
      <div className="p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">
                  Enhanced Analytics Dashboard
            </h1>
            <p className="text-xl text-slate-600">
                  Comprehensive insights into call performance and conversion tracking
            </p>
          </div>

              <div className="flex items-center space-x-4">
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                </select>
                
                <div className="flex bg-white rounded-lg border border-slate-200 p-1">
                  {['overview', 'performance', 'topics', 'objections'].map((view) => (
                    <button
                      key={view}
                      onClick={() => setSelectedView(view)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        selectedView === view
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {view.charAt(0).toUpperCase() + view.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Calls</p>
                  <p className="text-3xl font-bold text-slate-900">{data.overview.totalCalls}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Phone className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Conversion Rate</p>
                  <p className="text-3xl font-bold text-green-600">{data.overview.conversionRate}%</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Avg Duration</p>
                  <p className="text-3xl font-bold text-slate-900">{data.overview.avgDuration}m</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Performance Score</p>
                  <p className="text-3xl font-bold text-blue-600">{data.overview.avgPerformanceScore}/10</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Award className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Customer Satisfaction</p>
                  <p className="text-3xl font-bold text-yellow-600">{Math.round(data.overview.avgCustomerSatisfaction * 100)}%</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Based on Selected View */}
          {selectedView === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Agent Performance Scorecard */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900">Agent Performance Scorecard</h3>
                  <Award className="w-6 h-6 text-blue-600" />
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Overall Score</span>
                    <div className={`flex items-center px-3 py-1 rounded-full ${getScoreColor(data.agentScorecard.overallScore)}`}>
                      {getScoreIcon(data.agentScorecard.overallScore)}
                      <span className="ml-1 font-bold">{data.agentScorecard.overallScore}/10</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Sales Techniques</span>
                    <div className={`flex items-center px-3 py-1 rounded-full ${getScoreColor(data.agentScorecard.salesTechniques)}`}>
                      {getScoreIcon(data.agentScorecard.salesTechniques)}
                      <span className="ml-1 font-bold">{data.agentScorecard.salesTechniques}/10</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Customer Handling</span>
                    <div className={`flex items-center px-3 py-1 rounded-full ${getScoreColor(data.agentScorecard.customerHandling)}`}>
                      {getScoreIcon(data.agentScorecard.customerHandling)}
                      <span className="ml-1 font-bold">{data.agentScorecard.customerHandling}/10</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Conversation Quality</span>
                    <div className={`flex items-center px-3 py-1 rounded-full ${getScoreColor(data.agentScorecard.conversationQuality)}`}>
                      {getScoreIcon(data.agentScorecard.conversationQuality)}
                      <span className="ml-1 font-bold">{data.agentScorecard.conversationQuality}/10</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-200">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">Key Metrics</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{data.agentScorecard.metrics.speakingTimeRatio}</p>
                      <p className="text-xs text-slate-500">Speaking Ratio</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-600">{data.agentScorecard.metrics.avgInterruptions}</p>
                      <p className="text-xs text-slate-500">Avg Interruptions</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">{data.agentScorecard.metrics.avgQuestions}</p>
                      <p className="text-xs text-slate-500">Avg Questions</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Objection Analysis */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900">Objection Analysis Engine</h3>
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                
                <div className="space-y-4">
                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-red-700 font-medium">Objection Rate</span>
                      <span className="text-2xl font-bold text-red-600">{Math.round(data.objectionAnalysis.objectionRate)}%</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-slate-900">{data.objectionAnalysis.totalObjections}</p>
                      <p className="text-sm text-slate-600">Total Objections</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-slate-900">{Math.round(data.objectionAnalysis.avgObjectionsPerCall * 100) / 100}</p>
                      <p className="text-sm text-slate-600">Avg per Call</p>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-blue-700 font-medium">Resolution Rate</span>
                      <span className="text-xl font-bold text-blue-600">{data.objectionAnalysis.resolutionRate}%</span>
                    </div>
                  </div>
                  
                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-orange-700 font-medium">Unresolved Issues Requiring Attention</span>
                      <span className="text-xl font-bold text-orange-600">{data.objectionAnalysis.unresolvedCount}</span>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-green-700 font-medium">Success Rate Despite Objections</span>
                      <span className="text-xl font-bold text-green-600">{Math.round(data.objectionAnalysis.objectionSuccessRate * 100)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Performance Trends */}
          {selectedView === 'performance' && (
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">Performance Trends Over Time</h3>
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-semibold text-slate-700 mb-4">Daily Performance Scores</h4>
                  <div className="space-y-3">
                    {data.performanceTrends.slice(-7).map((trend, index) => (
                      <div key={trend._id} className="flex items-center justify-between">
                        <span className="text-slate-600">{formatDate(trend._id)}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-slate-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${(trend.avgPerformance / 10) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-bold text-slate-900 w-12">{Math.round(trend.avgPerformance * 100) / 100}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-slate-700 mb-4">Success Rate Trends</h4>
                  <div className="space-y-3">
                    {data.performanceTrends.slice(-7).map((trend, index) => (
                      <div key={trend._id} className="flex items-center justify-between">
                        <span className="text-slate-600">{formatDate(trend._id)}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-slate-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${trend.successRate * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-bold text-slate-900 w-12">{Math.round(trend.successRate * 100)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Section - Strengths, Improvements, Features, and Topics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Strengths */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">Top Strengths</h3>
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              
              <div className="space-y-3">
                {data.agentScorecard.topStrengths.map((strength, index) => (
                  <div key={index} className="flex items-center justify-between bg-green-50 rounded-lg p-3">
                    <span className="text-green-800 font-medium">{strength.insight}</span>
                    <span className="bg-green-200 text-green-800 px-2 py-1 rounded-full text-sm font-bold">
                      {strength.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Areas for Improvement */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">Areas for Improvement</h3>
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              
              <div className="space-y-3">
                {data.agentScorecard.topImprovements.map((improvement, index) => (
                  <div key={index} className="flex items-center justify-between bg-red-50 rounded-lg p-3">
                    <span className="text-red-800 font-medium">{improvement.insight}</span>
                    <span className="bg-red-200 text-red-800 px-2 py-1 rounded-full text-sm font-bold">
                      {improvement.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Enhanced Feature Request Tracking */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">Feature Request Tracking</h3>
                <Lightbulb className="w-6 h-6 text-yellow-600" />
              </div>
              
              <div className="space-y-3">
                {data.featureRequests.slice(0, 8).map((request, index) => (
                  <div key={index} className="bg-yellow-50 rounded-lg p-4 border-l-4 border-yellow-400">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="text-yellow-800 font-medium text-sm mb-1">{request._id}</h4>
                        <div className="flex items-center space-x-4 text-xs text-yellow-600">
                          <span>Priority: {request.priority}</span>
                          <span>Success Rate: {request.successRate}%</span>
                          <span>Last: {request.daysSinceLastMention}d ago</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full text-sm font-bold">
                          {request.mentionCount} mentions
                        </span>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          request.priority > 5 ? 'bg-red-100 text-red-700' :
                          request.priority > 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {request.priority > 5 ? 'High Priority' :
                           request.priority > 2 ? 'Medium Priority' :
                           'Low Priority'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 text-center">
                <p className="text-xs text-slate-500">
                  Ordered by priority (mentions × success rate). Total requests tracked: {data.featureRequests.length}
                </p>
              </div>
            </div>

            {/* Topic Analysis */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">Most Discussed Topics</h3>
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              
              <div className="space-y-3">
                {data.topicAnalysis.slice(0, 5).map((topic, index) => (
                  <div key={index} className="bg-blue-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-blue-800 font-medium">{topic._id}</span>
                      <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded-full text-sm font-bold">
                        {topic.count}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center">
                        <p className="font-bold text-slate-700">{Math.round(topic.avgPerformance * 100) / 100}</p>
                        <p className="text-slate-500">Avg Score</p>
                  </div>
                      <div className="text-center">
                        <p className="font-bold text-slate-700">{Math.round(topic.avgSatisfaction * 100)}%</p>
                        <p className="text-slate-500">Satisfaction</p>
                </div>
                      <div className="text-center">
                        <p className="font-bold text-slate-700">{Math.round(topic.successRate * 100)}%</p>
                        <p className="text-slate-500">Success Rate</p>
                  </div>
                </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Unresolved Issues Requiring Attention */}
          {data.objectionAnalysis.unresolvedCount > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200 mt-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">Unresolved Issues Requiring Attention</h3>
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                  <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-bold">
                    {data.objectionAnalysis.unresolvedCount} Issues
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {data.objectionAnalysis.topUnresolvedIssues.map((issue, index) => (
                  <div key={index} className="bg-red-50 rounded-lg p-4 border-l-4 border-red-400">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-red-800 text-sm">Call {issue.phoneNumber}</h4>
                        <p className="text-xs text-red-600">{formatDate(issue.timestamp)}</p>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <span className="bg-red-200 text-red-800 px-2 py-1 rounded-full text-xs font-bold">
                          {issue.objectionCount} objections
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          issue.customerSatisfaction < 0.3 ? 'bg-red-200 text-red-800' :
                          issue.customerSatisfaction < 0.6 ? 'bg-yellow-200 text-yellow-800' :
                          'bg-green-200 text-green-800'
                        }`}>
                          {Math.round(issue.customerSatisfaction * 100)}% satisfaction
                        </span>
                      </div>
                    </div>
                    
                    {issue.riskFactors && issue.riskFactors.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs font-semibold text-red-700 mb-1">Risk Factors:</p>
                        <div className="flex flex-wrap gap-1">
                          {issue.riskFactors.map((risk, riskIndex) => (
                            <span key={riskIndex} className="bg-red-200 text-red-700 px-2 py-1 rounded text-xs">
                              {risk}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {issue.improvements && issue.improvements.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-red-700 mb-1">Suggested Improvements:</p>
                        <ul className="text-xs text-red-600 space-y-1">
                          {issue.improvements.slice(0, 2).map((improvement, impIndex) => (
                            <li key={impIndex} className="flex items-start">
                              <span className="w-1 h-1 bg-red-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                              {improvement}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-4 bg-orange-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-semibold text-orange-800">Action Required</span>
                </div>
                <p className="text-sm text-orange-700">
                  These calls had objections that weren't successfully resolved. Consider follow-up calls, 
                  additional training on objection handling, or product improvements to address common concerns.
                </p>
              </div>
            </div>
          )}

          {/* Competitor Analysis */}
          {data.competitorAnalysis.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200 mt-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">Competitor Mentions</h3>
                <Eye className="w-6 h-6 text-purple-600" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.competitorAnalysis.map((competitor, index) => (
                  <div key={index} className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-purple-800">{competitor._id}</h4>
                      <span className="bg-purple-200 text-purple-800 px-2 py-1 rounded-full text-sm font-bold">
                        {competitor.mentionCount}
                      </span>
                    </div>
                    <p className="text-sm text-purple-600">
                      Avg Performance: {Math.round(competitor.avgPerformanceWhenMentioned * 100) / 100}/10
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}