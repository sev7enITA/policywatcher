import { NextResponse } from 'next/server';

/** Credential-free process liveness for external uptime checks. */
export async function GET() {
  return NextResponse.json(
    { status: 'ok' },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  );
}
