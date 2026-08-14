import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/adminAuth';
import { getAiTelemetrySummary } from '@/lib/aiTelemetry';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const telemetry = await getAiTelemetrySummary();
    return NextResponse.json({ ...telemetry, role: session.role }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (error) {
    console.warn('[AI Telemetry] Summary unavailable:', error instanceof Error ? error.name : 'unknown_error');
    return NextResponse.json({
      error: 'AI telemetry unavailable',
      boundary: 'No zero value is inferred when the telemetry store is unavailable.',
    }, {
      status: 503,
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  }
}
