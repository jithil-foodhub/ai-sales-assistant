import { Request, Response } from 'express';
import { CallRecord } from '../models/CallRecord';
import { Client } from '../models/Client';

export async function getAnalytics(req: Request, res: Response) {
  try {
    const { range = '7d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (range) {
      case '24h':
        startDate.setHours(now.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    console.log(`📊 Fetching analytics for range: ${range} (${startDate.toISOString()} to ${now.toISOString()})`);

    // Get call records with analysis
    const callRecords = await CallRecord.find({
      timestamp: { $gte: startDate, $lte: now },
      callAnalysis: { $exists: true }
    })
    .populate('clientId', 'phoneNumber name')
    .sort({ timestamp: -1 })
    .lean();

    console.log(`📞 Found ${callRecords.length} calls with analysis data`);

    // Calculate basic metrics
    const totalCalls = callRecords.length;
    const averageDuration = totalCalls > 0 
      ? Math.round(callRecords.reduce((sum, call) => sum + (call.duration || 0), 0) / totalCalls / 60) // Convert to minutes
      : 0;

    // Calculate satisfaction and performance metrics
    const satisfactionScores = callRecords
      .map(call => call.callAnalysis?.metrics?.customerSatisfaction)
      .filter(score => score !== undefined);
    
    const performanceScores = callRecords
      .map(call => call.callAnalysis?.agentPerformance)
      .filter(score => score !== undefined);

    const customerSatisfaction = satisfactionScores.length > 0
      ? satisfactionScores.reduce((sum, score) => sum + score, 0) / satisfactionScores.length
      : 0;

    const agentPerformance = performanceScores.length > 0
      ? performanceScores.reduce((sum, score) => sum + score, 0) / performanceScores.length
      : 0;

    // Analyze topics
    const topicCounts: { [key: string]: number } = {};
    callRecords.forEach(call => {
      if (call.callAnalysis?.keyTopics) {
        call.callAnalysis.keyTopics.forEach(topic => {
          topicCounts[topic] = (topicCounts[topic] || 0) + 1;
        });
      }
    });

    const topTopics = Object.entries(topicCounts)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Generate call trends (daily)
    const trendsMap: { [key: string]: { calls: number; satisfaction: number } } = {};
    callRecords.forEach(call => {
      const date = call.timestamp.toISOString().split('T')[0];
      if (!trendsMap[date]) {
        trendsMap[date] = { calls: 0, satisfaction: 0 };
      }
      trendsMap[date].calls += 1;
      if (call.callAnalysis?.metrics?.customerSatisfaction) {
        trendsMap[date].satisfaction += call.callAnalysis.metrics.customerSatisfaction;
      }
    });

    const callTrends = Object.entries(trendsMap)
      .map(([date, data]) => ({
        date,
        calls: data.calls,
        satisfaction: data.calls > 0 ? data.satisfaction / data.calls : 0
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Aggregate insights
    const allStrengths: string[] = [];
    const allImprovements: string[] = [];
    const allRecommendations: string[] = [];

    callRecords.forEach(call => {
      if (call.callAnalysis?.insights) {
        allStrengths.push(...(call.callAnalysis.insights.strengths || []));
        allImprovements.push(...(call.callAnalysis.insights.improvements || []));
        allRecommendations.push(...(call.callAnalysis.insights.recommendations || []));
      }
    });

    // Get most common insights
    const getTopInsights = (insights: string[], limit: number = 5) => {
      const counts: { [key: string]: number } = {};
      insights.forEach(insight => {
        counts[insight] = (counts[insight] || 0) + 1;
      });
      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([insight]) => insight);
    };

    // Generate conversation flow data (sample from recent calls)
    const recentCalls = callRecords.slice(0, 3);
    const conversationFlow = recentCalls
      .flatMap(call => call.callAnalysis?.conversationFlow?.segments || [])
      .map(segment => ({
        ...segment,
        content: segment.content || 'No content available'
      }))
      .slice(0, 20); // Limit for performance

    const analytics = {
      totalCalls,
      averageDuration,
      customerSatisfaction,
      agentPerformance,
      topTopics,
      callTrends,
      conversationFlow,
      insights: {
        strengths: getTopInsights(allStrengths),
        improvements: getTopInsights(allImprovements),
        recommendations: getTopInsights(allRecommendations)
      }
    };

    console.log(`✅ Analytics generated:`, {
      totalCalls,
      averageDuration,
      customerSatisfaction: Math.round(customerSatisfaction * 100) / 100,
      agentPerformance: Math.round(agentPerformance * 100) / 100,
      topTopicsCount: topTopics.length,
      trendsCount: callTrends.length
    });

    res.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('❌ Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics data'
    });
  }
}

export async function getCallSummary(req: Request, res: Response) {
  try {
    const { callId } = req.params;
    
    const callRecord = await CallRecord.findById(callId)
      .populate('clientId', 'phoneNumber name')
      .lean();

    if (!callRecord) {
      return res.status(404).json({
        success: false,
        error: 'Call record not found'
      });
    }

    res.json({
      success: true,
      data: {
        call: callRecord,
        summary: callRecord.callAnalysis?.summary || 'No summary available',
        metrics: callRecord.callAnalysis?.metrics || {},
        insights: callRecord.callAnalysis?.insights || {}
      }
    });

  } catch (error) {
    console.error('❌ Error fetching call summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch call summary'
    });
  }
}
