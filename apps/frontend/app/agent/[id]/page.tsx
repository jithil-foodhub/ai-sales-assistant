'use client';

import { useParams } from 'next/navigation';
import { AgentDashboard } from '@/components/AgentDashboard';

export default function AgentPage() {
  const params = useParams();
  const agentId = params.id as string;

  return <AgentDashboard agentId={agentId} />;
}
