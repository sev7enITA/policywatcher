import { NextRequest, NextResponse } from 'next/server';
import { getAgenticIncidentBrief } from '@/lib/agenticIncidentAgent';
import { AGENT_ERROR_HEADERS, AGENT_PUBLIC_HEADERS, agentOptions, applyAgentRateLimit } from '../_shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function OPTIONS() {
  return agentOptions();
}

export async function GET(request: NextRequest) {
  const limited = applyAgentRateLimit(request);
  if (limited) return limited;
  try {
    const result = await getAgenticIncidentBrief(request.nextUrl.searchParams);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400, headers: AGENT_ERROR_HEADERS });
    return NextResponse.json(result.value, { headers: AGENT_PUBLIC_HEADERS });
  } catch (error) {
    console.error('[Agent Gateway] Agentic incident brief failed:', error);
    return NextResponse.json(
      { error: 'Agentic incident context is temporarily unavailable. Do not infer that no incidents exist.' },
      { status: 503, headers: AGENT_ERROR_HEADERS },
    );
  }
}
