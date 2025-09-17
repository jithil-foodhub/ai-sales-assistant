'use client';

import { TrendingUp, Clock, BarChart3, Activity } from 'lucide-react';

interface AnalyticsDashboardProps {
  analytics: {
    totalSuggestions: number;
    averageLatency: number;
    suggestionsByType: Record<string, number>;
    recentActivity: Array<{
      timestamp: string;
      transcript: string;
      suggestionsCount: number;
      latency: number;
    }>;
  };
}

export function AnalyticsDashboard({ analytics }: AnalyticsDashboardProps) {
  const { totalSuggestions, averageLatency, suggestionsByType, recentActivity } = analytics;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'upsell':
        return 'bg-primary-500';
      case 'cross-sell':
        return 'bg-success-500';
      case 'retention':
        return 'bg-warning-500';
      case 'new-offer':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'upsell':
        return 'Upsell';
      case 'cross-sell':
        return 'Cross-sell';
      case 'retention':
        return 'Retention';
      case 'new-offer':
        return 'New Offer';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">
        Analytics Dashboard
      </h2>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-primary-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Suggestions</p>
              <p className="text-2xl font-bold text-gray-900">{totalSuggestions}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-success-100 rounded-lg">
              <Clock className="w-6 h-6 text-success-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Avg Latency</p>
              <p className="text-2xl font-bold text-gray-900">
                {averageLatency > 0 ? `${Math.round(averageLatency)}ms` : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Suggestions by Type */}
      {Object.keys(suggestionsByType).length > 0 && (
        <div className="card">
          <h3 className="text-md font-semibold text-gray-900 mb-4">
            Suggestions by Type
          </h3>
          <div className="space-y-3">
            {Object.entries(suggestionsByType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${getTypeColor(type)}`}></div>
                  <span className="text-sm font-medium text-gray-700">
                    {getTypeLabel(type)}
                  </span>
                </div>
                <span className="text-sm font-bold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <div className="card">
          <h3 className="text-md font-semibold text-gray-900 mb-4">
            Recent Activity
          </h3>
          <div className="space-y-3">
            {recentActivity.slice(0, 5).map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex-1">
                  <p className="text-sm text-gray-800">{activity.transcript}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(activity.timestamp).toLocaleTimeString()} • 
                    {activity.suggestionsCount} suggestions • 
                    {Math.round(activity.latency)}ms
                  </p>
                </div>
                <div className="ml-4">
                  <Activity className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {totalSuggestions === 0 && (
        <div className="card text-center py-8">
          <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">No analytics data yet</p>
          <p className="text-sm text-gray-400">
            Run some simulations to see analytics
          </p>
        </div>
      )}
    </div>
  );
}
