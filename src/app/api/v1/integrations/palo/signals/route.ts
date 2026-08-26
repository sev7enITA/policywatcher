import { NextRequest, NextResponse } from 'next/server';
import { getPublicPaloSignalBatch } from '@/lib/publicChangeEventData';
import { parsePaloPolicyWatcherBatchQuery } from '@/lib/paloPolicyWatcherBatch';
import { rateLimit } from '@/lib/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PUBLIC_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};

export async function GET(request: NextRequest) {
  const limited = rateLimit(request, { intervalMs: 60_000, max: 30, name: 'public-palo-signal-batch', logClientIp: false });
  if (limited) {
    for (const [name, value] of Object.entries(PUBLIC_HEADERS)) limited.headers.set(name, value);
    return limited;
  }

  const query = parsePaloPolicyWatcherBatchQuery(request.nextUrl.searchParams);
  if (!query.ok) return NextResponse.json({ error: query.error }, { status: 400, headers: PUBLIC_HEADERS });

  try {
    return NextResponse.json(await getPublicPaloSignalBatch(query), { headers: PUBLIC_HEADERS });
  } catch (error) {
    console.error('[PALO handoff] Batch generation failed:', error);
    return NextResponse.json(
      { error: 'The complete PALO signal snapshot is temporarily unavailable. Do not infer revocation or absence from this response.' },
      { status: 503, headers: PUBLIC_HEADERS },
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
