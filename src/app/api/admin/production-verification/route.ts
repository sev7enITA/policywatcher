import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/adminAuth';
import { getProductionVerificationReport } from '@/lib/productionVerification';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session.valid || !session.role) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const report = await getProductionVerificationReport({
    requestOrigin: request.nextUrl.origin,
    role: session.role,
  });
  return NextResponse.json(report, {
    status: 200,
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}
