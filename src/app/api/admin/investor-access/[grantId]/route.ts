import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/adminAuth';
import { rateLimit } from '@/lib/rateLimit';
import { revokeInvestorAccessGrant } from '@/lib/investorAccessService';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ grantId: string }> },
) {
  const session = getSession(request);
  if (!session.valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const limited = rateLimit(request, { intervalMs: 60_000, max: 20, name: 'investor-grant-admin', logClientIp: false });
  if (limited) return limited;
  const { grantId } = await params;
  const grant = await revokeInvestorAccessGrant(grantId);
  if (!grant) {
    return NextResponse.json({ error: 'This access grant is no longer active.' }, { status: 409 });
  }
  return NextResponse.json({ grant });
}
