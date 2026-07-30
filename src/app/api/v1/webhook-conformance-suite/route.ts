import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rateLimit';
import { getWebhookConformanceSuite } from '@/lib/webhookVerification';

export const runtime = 'nodejs';

const PUBLIC_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
  'X-Content-Type-Options': 'nosniff',
};

export function GET(request: NextRequest) {
  const limited = rateLimit(request, {
    intervalMs: 60_000,
    max: 60,
    name: 'webhook-conformance-suite',
    logClientIp: false,
  });
  if (limited) {
    limited.headers.set('Access-Control-Allow-Origin', '*');
    limited.headers.set('Cache-Control', 'no-store');
    limited.headers.set('X-Content-Type-Options', 'nosniff');
    return limited;
  }

  return NextResponse.json(getWebhookConformanceSuite(), { headers: PUBLIC_HEADERS });
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
