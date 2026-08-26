import { NextRequest, NextResponse } from 'next/server';
import { getPublicChangeEventRow } from '@/lib/publicChangeEventData';
import { buildPaloPolicyWatcherSignal, parsePaloPolicyWatcherSignalQuery } from '@/lib/paloPolicyWatcherSignal';
import { rateLimit } from '@/lib/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PUBLIC_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};
const ERROR_HEADERS = PUBLIC_HEADERS;

export async function GET(request: NextRequest) {
  const limited = rateLimit(request, { intervalMs: 60_000, max: 30, name: 'public-palo-signal', logClientIp: false });
  if (limited) {
    for (const [name, value] of Object.entries(ERROR_HEADERS)) limited.headers.set(name, value);
    return limited;
  }
  const query = parsePaloPolicyWatcherSignalQuery(request.nextUrl.searchParams);
  if (!query.ok) return NextResponse.json({ error: query.error }, { status: 400, headers: ERROR_HEADERS });

  try {
    const row = await getPublicChangeEventRow(query.changeId);
    if (!row) {
      return NextResponse.json(
        { error: 'No public, evidence-gated PolicyWatcher change exists for this identifier.' },
        { status: 404, headers: ERROR_HEADERS },
      );
    }
    return NextResponse.json(buildPaloPolicyWatcherSignal(row, query.locale), {
      headers: {
        ...PUBLIC_HEADERS,
        'Content-Disposition': `attachment; filename="policywatcher-palo-signal-${query.changeId}.json"`,
      },
    });
  } catch (error) {
    console.error('[PALO handoff] Signal generation failed:', error);
    return NextResponse.json(
      { error: 'The PALO handoff is temporarily unavailable. Do not infer that no public PolicyWatcher change exists.' },
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
