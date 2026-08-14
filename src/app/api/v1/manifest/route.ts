import { NextRequest, NextResponse } from 'next/server';
import { getPublicApiManifest, PUBLIC_API_CACHE_SECONDS } from '@/lib/publicApi';
import { rateLimit } from '@/lib/rateLimit';

const PUBLIC_API_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
  'Cache-Control': `public, max-age=60, s-maxage=${PUBLIC_API_CACHE_SECONDS}`,
  Vary: 'Origin',
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: PUBLIC_API_HEADERS });
}

export function GET(request: NextRequest) {
  const limited = rateLimit(request, { intervalMs: 60_000, max: 60, name: 'public-api-v1' });
  if (limited) {
    for (const [key, value] of Object.entries(PUBLIC_API_HEADERS)) limited.headers.set(key, value);
    return limited;
  }

  return NextResponse.json(getPublicApiManifest(), { headers: PUBLIC_API_HEADERS });
}
