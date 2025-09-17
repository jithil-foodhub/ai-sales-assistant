"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { AppLayout } from '@/components/AppLayout';
import { ClientMetricsDashboard } from '@/components/ClientMetricsDashboard';

interface CallRecord {
  _id: string;
  timestamp: string;
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

export default function ClientMetricsPage() {
  const { agentId } = useParams();
  const [callRecords, setCallRecords] = useState<CallRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCallRecords();
  }, [agentId]);

  const fetchCallRecords = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/clients/${agentId}/calls`);
      const data = await response.json();
      
      if (data.success) {
        setCallRecords(data.data);
      }
    } catch (error) {
      console.error('Error fetching call records:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <AppLayout currentScreen="clients">
        <div className="p-8 bg-gradient-to-br from-slate-50 to-blue-50 h-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading metrics...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout currentScreen="clients">
      <ClientMetricsDashboard 
        clientId={agentId as string} 
        callRecords={callRecords} 
      />
    </AppLayout>
  );
}
