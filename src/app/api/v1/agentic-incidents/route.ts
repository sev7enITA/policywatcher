import { NextRequest, NextResponse } from 'next/server';
import { getAgenticIncidentObservatory, parseAgenticIncidentQuery } from '@/lib/agenticIncidentService';
import { rateLimit } from '@/lib/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PUBLIC_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'public, max-age=30, s-maxage=300, stale-while-revalidate=900',
  'X-Content-Type-Options': 'nosniff',
};
const ERROR_HEADERS = { ...PUBLIC_HEADERS, 'Cache-Control': 'no-store' };

export async function GET(request: NextRequest) {
  const limited = rateLimit(request, { intervalMs: 60_000, max: 30, name: 'public-agentic-incidents', logClientIp: false });
  if (limited) {
    for (const [name, value] of Object.entries(ERROR_HEADERS)) limited.headers.set(name, value);
    return limited;
  }
  const query = parseAgenticIncidentQuery(request.nextUrl.searchParams);
  if (!query.ok) return NextResponse.json({ error: query.error }, { status: 400, headers: ERROR_HEADERS });
  try {
    return NextResponse.json(await getAgenticIncidentObservatory(query.value), { headers: PUBLIC_HEADERS });
  } catch (error) {
    console.error('[Agentic Incident Observatory] Public feed failed:', error);
    return NextResponse.json(
      { error: 'The agentic incident research surface is temporarily unavailable. Do not infer that no incidents exist.' },
      { status: 503, headers: ERROR_HEADERS },
    );
  }
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...PUBLIC_HEADERS,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Accept',
      'Access-Control-Max-Age': '86400',
    },
  });
}
