import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rateLimit';

export const AGENT_PUBLIC_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Accept',
  'Access-Control-Max-Age': '86400',
  'Cache-Control': 'public, max-age=30, s-maxage=60, stale-while-revalidate=300',
  'X-Content-Type-Options': 'nosniff',
};

export const AGENT_ERROR_HEADERS = {
  ...AGENT_PUBLIC_HEADERS,
  'Cache-Control': 'no-store',
};

export function applyAgentRateLimit(request: NextRequest) {
  const limited = rateLimit(request, {
    intervalMs: 60_000,
    max: 30,
    name: 'agent-evidence-gateway',
    logClientIp: false,
  });
  if (limited) {
    for (const [name, value] of Object.entries(AGENT_ERROR_HEADERS)) limited.headers.set(name, value);
  }
  return limited;
}

export function agentOptions() {
  return new NextResponse(null, { status: 204, headers: AGENT_PUBLIC_HEADERS });
}
