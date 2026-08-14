import { NextRequest, NextResponse } from 'next/server';
import { getPublicChangeEventFeed } from '@/lib/publicChangeEventData';
import { parsePublicChangeEventQuery } from '@/lib/publicChangeEvents';
import { rateLimit } from '@/lib/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PUBLIC_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'public, max-age=30, s-maxage=60, stale-while-revalidate=300',
  'X-Content-Type-Options': 'nosniff',
};

const ERROR_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};

export async function GET(request: NextRequest) {
  const limited = rateLimit(request, { intervalMs: 60_000, max: 30, name: 'public-change-events', logClientIp: false });
  if (limited) {
    for (const [name, value] of Object.entries(ERROR_HEADERS)) limited.headers.set(name, value);
    return limited;
  }

  const query = parsePublicChangeEventQuery(request.nextUrl.searchParams);
  if (!query.ok) return NextResponse.json({ error: query.error }, { status: 400, headers: ERROR_HEADERS });

  try {
    return NextResponse.json(await getPublicChangeEventFeed(query), { headers: PUBLIC_HEADERS });
  } catch (error) {
    console.error('[Public Change Events] Feed generation failed:', error);
    return NextResponse.json({ error: 'The public change event feed is temporarily unavailable.' }, { status: 503, headers: ERROR_HEADERS });
  }
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Accept',
      'Access-Control-Max-Age': '86400',
    },
  });
}
