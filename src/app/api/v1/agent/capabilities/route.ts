import { NextRequest, NextResponse } from 'next/server';
import { getAgentCapabilities } from '@/lib/agentGateway';
import { AGENT_PUBLIC_HEADERS, agentOptions, applyAgentRateLimit } from '../_shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function OPTIONS() {
  return agentOptions();
}

export function GET(request: NextRequest) {
  const limited = applyAgentRateLimit(request);
  if (limited) return limited;
  return NextResponse.json(getAgentCapabilities(), { headers: AGENT_PUBLIC_HEADERS });
}
