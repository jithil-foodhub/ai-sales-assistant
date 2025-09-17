import { Request, Response } from 'express';
import { CallRecord } from '../models/CallRecord';
import { Client } from '../models/Client';

// Enhanced Analytics Dashboard API
export async function getEnhancedAnalytics(req: Request, res: Response) {
  try {
    const { range = '30d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (range) {
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
        startDate.setDate(now.getDate() - 30);
    }

    console.log(`📊 Fetching enhanced analytics for range: ${range} (${startDate.toISOString()} to ${now.toISOString()})`);

    // Main aggregation pipeline for comprehensive analytics
    const analyticsData = await CallRecord.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: now },
          status: 'completed',
          callAnalysis: { $exists: true }
        }
      },
      {
        $facet: {
          // Conversion Tracking
          conversionMetrics: [
            {
              $group: {
                _id: null,
                totalCalls: { $sum: 1 },
                successfulCalls: {
                  $sum: { $cond: [{ $eq: ['$outcome', 'successful'] }, 1, 0] }
                },
                followUpCalls: {
                  $sum: { $cond: [{ $eq: ['$outcome', 'follow_up'] }, 1, 0] }
                },
                avgDuration: { $avg: '$duration' },
                avgPerformanceScore: { $avg: '$agentFeedback.performanceScore' },
                avgCustomerSatisfaction: { $avg: '$callAnalysis.metrics.customerSatisfaction' },
                avgConversationQuality: { $avg: '$agentFeedback.conversationQuality.rating' }
              }
            }
          ],

          // Performance Trends Over Time
          performanceTrends: [
            {
              $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" }},
                avgPerformance: { $avg: '$agentFeedback.performanceScore' },
                avgSatisfaction: { $avg: '$callAnalysis.metrics.customerSatisfaction' },
                callCount: { $sum: 1 },
                successRate: {
                  $avg: { $cond: [{ $eq: ['$outcome', 'successful'] }, 1, 0] }
                }
              }
            },
            { $sort: { "_id": 1 }}
          ],

          // Agent Performance Breakdown
          agentPerformance: [
            {
              $group: {
                _id: null,
                totalCalls: { $sum: 1 },
                avgPerformanceScore: { $avg: '$agentFeedback.performanceScore' },
                avgSalesTechniques: { $avg: '$agentFeedback.salesTechniques.rating' },
                avgCustomerHandling: { $avg: '$agentFeedback.customerHandling.rating' },
                avgConversationQuality: { $avg: '$agentFeedback.conversationQuality.rating' },
                strengths: { $push: '$agentFeedback.strengths' },
                improvements: { $push: '$agentFeedback.improvements' },
                speakingTimeRatio: { $avg: '$callAnalysis.metrics.speakingTimeRatio' },
                interruptionCount: { $avg: '$callAnalysis.metrics.interruptionCount' },
                questionCount: { $avg: '$callAnalysis.metrics.questionCount' }
              }
            }
          ],

          // Topic Analysis & Feature Requests
          topicAnalysis: [
            { $unwind: '$callAnalysis.keyTopics' },
            {
              $group: {
                _id: '$callAnalysis.keyTopics',
                count: { $sum: 1 },
                avgPerformance: { $avg: '$agentFeedback.performanceScore' },
                avgSatisfaction: { $avg: '$callAnalysis.metrics.customerSatisfaction' },
                successRate: {
                  $avg: { $cond: [{ $eq: ['$outcome', 'successful'] }, 1, 0] }
                }
              }
            },
            { $sort: { count: -1 }},
            { $limit: 20 }
          ],

          // Enhanced Objection Analysis with Resolution Tracking
          objectionAnalysis: [
            {
              $match: {
                'callAnalysis.metrics.objectionCount': { $gt: 0 }
              }
            },
            {
              $group: {
                _id: null,
                totalObjections: { $sum: '$callAnalysis.metrics.objectionCount' },
                callsWithObjections: { $sum: 1 },
                avgObjectionsPerCall: { $avg: '$callAnalysis.metrics.objectionCount' },
                resolvedObjections: {
                  $sum: { $cond: [{ $eq: ['$outcome', 'successful'] }, '$callAnalysis.metrics.objectionCount', 0] }
                },
                unresolvedObjections: {
                  $sum: { $cond: [{ $ne: ['$outcome', 'successful'] }, '$callAnalysis.metrics.objectionCount', 0] }
                },
                objectionSuccessRate: {
                  $avg: { $cond: [{ $eq: ['$outcome', 'successful'] }, 1, 0] }
                },
                commonObjections: { $push: '$callAnalysis.insights.riskFactors' },
                unresolvedIssues: {
                  $push: {
                    $cond: [
                      { $ne: ['$outcome', 'successful'] },
                      {
                        callId: '$_id',
                        timestamp: '$timestamp',
                        objectionCount: '$callAnalysis.metrics.objectionCount',
                        riskFactors: '$callAnalysis.insights.riskFactors',
                        improvements: '$agentFeedback.improvements',
                        customerSatisfaction: '$callAnalysis.metrics.customerSatisfaction',
                        phoneNumber: '$phoneNumber'
                      },
                      null
                    ]
                  }
                }
              }
            },
            {
              $addFields: {
                resolutionRate: {
                  $cond: [
                    { $gt: ['$totalObjections', 0] },
                    { $divide: ['$resolvedObjections', '$totalObjections'] },
                    0
                  ]
                },
                unresolvedIssues: {
                  $filter: {
                    input: '$unresolvedIssues',
                    cond: { $ne: ['$$this', null] }
                  }
                }
              }
            }
          ],

          // Feature Request Extraction with Enhanced Tracking
          featureRequests: [
            {
              $match: {
                $or: [
                  { 'enhancedAnalysis.keyInformation.actionItems': { $exists: true, $ne: [] }},
                  { 'callAnalysis.insights.recommendations': { $exists: true, $ne: [] }},
                  { 'agentFeedback.nextSteps': { $exists: true, $ne: [] }}
                ]
              }
            },
            {
              $addFields: {
                allFeatureRequests: {
                  $concatArrays: [
                    { $ifNull: ['$enhancedAnalysis.keyInformation.actionItems', []] },
                    { $ifNull: ['$callAnalysis.insights.recommendations', []] },
                    { $ifNull: ['$agentFeedback.nextSteps', []] }
                  ]
                }
              }
            },
            { $unwind: '$allFeatureRequests' },
            {
              $match: {
                'allFeatureRequests': { 
                  $regex: /(feature|integration|support|add|implement|need|request|enhancement|improvement|capability)/i 
                }
              }
            },
            {
              $group: {
                _id: '$allFeatureRequests',
                mentionCount: { $sum: 1 },
                recentMention: { $max: '$timestamp' },
                firstMention: { $min: '$timestamp' },
                avgPerformanceScore: { $avg: '$agentFeedback.performanceScore' },
                successfulCallsWithRequest: {
                  $sum: { $cond: [{ $eq: ['$outcome', 'successful'] }, 1, 0] }
                },
                totalCallsWithRequest: { $sum: 1 }
              }
            },
            {
              $addFields: {
                priority: {
                  $multiply: [
                    '$mentionCount',
                    { $divide: ['$successfulCallsWithRequest', '$totalCallsWithRequest'] }
                  ]
                },
                successRate: { $divide: ['$successfulCallsWithRequest', '$totalCallsWithRequest'] }
              }
            },
            { $sort: { priority: -1, mentionCount: -1 }},
            { $limit: 20 }
          ],

          // Competitor Analysis
          competitorAnalysis: [
            {
              $match: {
                'enhancedAnalysis.competitorAnalysis.competitors': { $exists: true, $ne: [] }
              }
            },
            { $unwind: '$enhancedAnalysis.competitorAnalysis.competitors' },
            {
              $group: {
                _id: '$enhancedAnalysis.competitorAnalysis.competitors.name',
                mentionCount: { $sum: 1 },
                highlights: { $addToSet: '$enhancedAnalysis.competitorAnalysis.competitors.highlights' },
                avgPerformanceWhenMentioned: { $avg: '$agentFeedback.performanceScore' }
              }
            },
            { $sort: { mentionCount: -1 }},
            { $limit: 10 }
          ]
        }
      }
    ]);

    // Process and format the data
    const data = analyticsData[0];
    
    // Flatten strengths and improvements arrays
    const allStrengths: string[] = [];
    const allImprovements: string[] = [];
    
    if (data.agentPerformance[0]) {
      data.agentPerformance[0].strengths.forEach((strengthArray: string[]) => {
        allStrengths.push(...strengthArray);
      });
      data.agentPerformance[0].improvements.forEach((improvementArray: string[]) => {
        allImprovements.push(...improvementArray);
      });
    }

    // Get top insights
    const getTopInsights = (insights: string[], limit: number = 5) => {
      const counts: { [key: string]: number } = {};
      insights.forEach(insight => {
        counts[insight] = (counts[insight] || 0) + 1;
      });
      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([insight, count]) => ({ insight, count }));
    };

    // Calculate conversion rate
    const conversionMetrics = data.conversionMetrics[0] || {};
    const conversionRate = conversionMetrics.totalCalls > 0 
      ? (conversionMetrics.successfulCalls / conversionMetrics.totalCalls) * 100 
      : 0;

    // Format response
    const enhancedAnalytics = {
      overview: {
        totalCalls: conversionMetrics.totalCalls || 0,
        conversionRate: Math.round(conversionRate * 100) / 100,
        avgDuration: Math.round((conversionMetrics.avgDuration || 0) / 60), // Convert to minutes
        avgPerformanceScore: Math.round((conversionMetrics.avgPerformanceScore || 0) * 100) / 100,
        avgCustomerSatisfaction: Math.round((conversionMetrics.avgCustomerSatisfaction || 0) * 100) / 100
      },
      
      performanceTrends: data.performanceTrends || [],
      
      agentScorecard: {
        overallScore: Math.round((conversionMetrics.avgPerformanceScore || 0) * 100) / 100,
        salesTechniques: Math.round((data.agentPerformance[0]?.avgSalesTechniques || 0) * 100) / 100,
        customerHandling: Math.round((data.agentPerformance[0]?.avgCustomerHandling || 0) * 100) / 100,
        conversationQuality: Math.round((data.agentPerformance[0]?.avgConversationQuality || 0) * 100) / 100,
        topStrengths: getTopInsights(allStrengths),
        topImprovements: getTopInsights(allImprovements),
        metrics: {
          speakingTimeRatio: Math.round((data.agentPerformance[0]?.speakingTimeRatio || 0) * 100) / 100,
          avgInterruptions: Math.round((data.agentPerformance[0]?.interruptionCount || 0) * 100) / 100,
          avgQuestions: Math.round((data.agentPerformance[0]?.questionCount || 0) * 100) / 100
        }
      },
      
      topicAnalysis: data.topicAnalysis || [],
      
      objectionAnalysis: {
        ...data.objectionAnalysis[0],
        objectionRate: data.objectionAnalysis[0] 
          ? (data.objectionAnalysis[0].callsWithObjections / conversionMetrics.totalCalls) * 100 
          : 0,
        resolutionRate: data.objectionAnalysis[0]?.resolutionRate 
          ? Math.round(data.objectionAnalysis[0].resolutionRate * 100 * 100) / 100 
          : 0,
        unresolvedCount: data.objectionAnalysis[0]?.unresolvedIssues?.length || 0,
        topUnresolvedIssues: (data.objectionAnalysis[0]?.unresolvedIssues || [])
          .sort((a: any, b: any) => b.objectionCount - a.objectionCount)
          .slice(0, 10)
      },
      
      featureRequests: (data.featureRequests || []).map((request: any) => ({
        ...request,
        priority: Math.round(request.priority * 100) / 100,
        successRate: Math.round(request.successRate * 100 * 100) / 100,
        daysSinceFirstMention: Math.floor((new Date().getTime() - new Date(request.firstMention).getTime()) / (1000 * 60 * 60 * 24)),
        daysSinceLastMention: Math.floor((new Date().getTime() - new Date(request.recentMention).getTime()) / (1000 * 60 * 60 * 24))
      })),
      
      competitorAnalysis: data.competitorAnalysis || []
    };

    console.log(`✅ Enhanced analytics generated for ${conversionMetrics.totalCalls} calls`);

    res.json({
      success: true,
      data: enhancedAnalytics
    });

  } catch (error) {
    console.error('❌ Error fetching enhanced analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch enhanced analytics data'
    });
  }
}

// Get detailed objection analysis
export async function getObjectionAnalysis(req: Request, res: Response) {
  try {
    const { range = '30d' } = req.query;
    
    const now = new Date();
    let startDate = new Date();
    const rangeStr = typeof range === 'string' ? range : '30d';
    startDate.setDate(now.getDate() - parseInt(rangeStr.replace('d', '')));

    const objectionData = await CallRecord.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: now },
          'callAnalysis.metrics.objectionCount': { $gt: 0 }
        }
      },
      {
        $project: {
          timestamp: 1,
          objectionCount: '$callAnalysis.metrics.objectionCount',
          outcome: 1,
          performanceScore: '$agentFeedback.performanceScore',
          riskFactors: '$callAnalysis.insights.riskFactors',
          improvements: '$agentFeedback.improvements'
        }
      },
      { $sort: { timestamp: -1 }}
    ]);

    res.json({
      success: true,
      data: objectionData
    });

  } catch (error) {
    console.error('❌ Error fetching objection analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch objection analysis'
    });
  }
}
