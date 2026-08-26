import { NextResponse } from 'next/server';
import { buildAgenticIncidentSchema } from '@/lib/agenticIncidents';

export const dynamic = 'force-static';

export function GET() {
  return NextResponse.json(buildAgenticIncidentSchema(), {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=86400, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
