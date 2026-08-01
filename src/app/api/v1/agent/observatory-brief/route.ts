import { NextRequest, NextResponse } from 'next/server';
import { getAgentObservatoryBrief, parseAgentBriefQuery } from '@/lib/agentGateway';
import { AGENT_ERROR_HEADERS, AGENT_PUBLIC_HEADERS, agentOptions, applyAgentRateLimit } from '../_shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function OPTIONS() {
  return agentOptions();
}

export function GET(request: NextRequest) {
  const limited = applyAgentRateLimit(request);
  if (limited) return limited;
  const query = parseAgentBriefQuery(request.nextUrl.searchParams);
  if (!query.ok) return NextResponse.json({ error: query.error }, { status: 400, headers: AGENT_ERROR_HEADERS });
  return NextResponse.json(getAgentObservatoryBrief(query.value), { headers: AGENT_PUBLIC_HEADERS });
}
