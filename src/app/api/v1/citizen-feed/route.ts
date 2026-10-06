import { NextRequest, NextResponse } from 'next/server';
import { getCitizenFeed, parseCitizenFeedQuery } from '@/lib/citizenData';
import { rateLimit } from '@/lib/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const HEADERS = { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };

export async function GET(request: NextRequest) {
  const limited = rateLimit(request, { intervalMs: 60_000, max: 30, name: 'citizen-feed', logClientIp: false });
  if (limited) {
    for (const [name, value] of Object.entries(HEADERS)) limited.headers.set(name, value);
    return limited;
  }
  const query = parseCitizenFeedQuery(request.nextUrl.searchParams);
  if (!query.ok) return NextResponse.json({ error: query.error }, { status: 400, headers: HEADERS });
  try { return NextResponse.json(await getCitizenFeed(query), { headers: HEADERS }); }
  catch {
    // No private database diagnostics, account context or pasted notices are logged here.
    console.error('[Citizen feed] Public metadata is temporarily unavailable.');
    return NextResponse.json({ error: 'Citizen feed temporarily unavailable.' }, { status: 503, headers: HEADERS });
  }
}
export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: { ...HEADERS, 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Accept', 'Access-Control-Max-Age': '86400' } });
}
