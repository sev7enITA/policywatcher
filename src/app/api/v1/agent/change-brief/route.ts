import { NextRequest, NextResponse } from 'next/server';
import { getAgentChangeBrief, parseAgentBriefQuery } from '@/lib/agentGateway';
import { AGENT_ERROR_HEADERS, AGENT_PUBLIC_HEADERS, agentOptions, applyAgentRateLimit } from '../_shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function OPTIONS() {
  return agentOptions();
}

export async function GET(request: NextRequest) {
  const limited = applyAgentRateLimit(request);
  if (limited) return limited;
  const query = parseAgentBriefQuery(request.nextUrl.searchParams);
  if (!query.ok) return NextResponse.json({ error: query.error }, { status: 400, headers: AGENT_ERROR_HEADERS });

  try {
    return NextResponse.json(await getAgentChangeBrief(query.value), { headers: AGENT_PUBLIC_HEADERS });
  } catch (error) {
    console.error('[Agent Gateway] Change brief generation failed:', error);
    return NextResponse.json({ error: 'Public change evidence is temporarily unavailable.' }, { status: 503, headers: AGENT_ERROR_HEADERS });
  }
}
