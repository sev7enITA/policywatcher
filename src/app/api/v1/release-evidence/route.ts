import { RELEASE_EVIDENCE_LEDGER } from '@/lib/releasePulse';

const PUBLIC_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
  'Content-Type': 'application/json; charset=utf-8',
  'X-Content-Type-Options': 'nosniff',
};

export async function GET(request: Request) {
  const etag = `\"sha256-${RELEASE_EVIDENCE_LEDGER.integrity.digest}\"`;
  if (request.headers.get('if-none-match') === etag) {
    return new Response(null, { status: 304, headers: { ...PUBLIC_HEADERS, ETag: etag } });
  }
  return Response.json(RELEASE_EVIDENCE_LEDGER, {
    headers: {
      ...PUBLIC_HEADERS,
      ETag: etag,
    },
  });
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Accept, If-None-Match',
      'Access-Control-Max-Age': '86400',
    },
  });
}
