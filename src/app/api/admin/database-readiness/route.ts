import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/adminAuth';
import { getDatabaseReadinessReport } from '@/lib/databaseReadiness';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const report = await getDatabaseReadinessReport();
  return NextResponse.json({ ...report, role: session.role }, {
    status: report.status === 'unavailable' ? 503 : 200,
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}
