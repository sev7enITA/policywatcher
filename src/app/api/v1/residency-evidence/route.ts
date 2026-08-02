import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rateLimit';
import { getResidencyEvidencePack } from '@/lib/residencyEvidence';

const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
  'Cache-Control': 'public, max-age=60, s-maxage=300',
  Vary: 'Origin',
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: HEADERS });
}
export function GET(request: NextRequest) {
  const limited = rateLimit(request, { intervalMs: 60_000, max: 60, name: 'residency-evidence-v1' });
  if (limited) {
    for (const [key, value] of Object.entries(HEADERS)) limited.headers.set(key, value);
    return limited;
  }
  return NextResponse.json(getResidencyEvidencePack(), { headers: HEADERS });
}
