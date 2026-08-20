import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rateLimit';
import {
  getAuthoritativePublicationReadiness,
  serializePublicPublicationReadiness,
} from '@/lib/publicationReadinessServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PUBLIC_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Accept',
  'Access-Control-Max-Age': '86400',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  Vary: 'Origin',
};

export async function GET(request: NextRequest) {
  const limited = rateLimit(request, {
    intervalMs: 60_000,
    max: 60,
    name: 'public-publication-readiness',
    logClientIp: false,
  });
  if (limited) {
    for (const [name, value] of Object.entries(PUBLIC_HEADERS)) limited.headers.set(name, value);
    return limited;
  }

  const result = await getAuthoritativePublicationReadiness();
  return NextResponse.json(serializePublicPublicationReadiness(result), {
    status: result.available ? 200 : 503,
    headers: PUBLIC_HEADERS,
  });
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: PUBLIC_HEADERS });
}
