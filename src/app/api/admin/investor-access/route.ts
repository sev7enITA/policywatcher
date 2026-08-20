import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/adminAuth';
import { rateLimit } from '@/lib/rateLimit';
import {
  createInvestorAccessGrant,
  listInvestorAccessGrants,
} from '@/lib/investorAccessService';

function requireAdmin(request: NextRequest): NextResponse | null {
  const session = getSession(request);
  if (!session.valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return null;
}

export async function GET(request: NextRequest) {
  const denial = requireAdmin(request);
  if (denial) return denial;
  const limited = rateLimit(request, { intervalMs: 60_000, max: 60, name: 'investor-grant-admin', logClientIp: false });
  if (limited) return limited;
  const grants = await listInvestorAccessGrants();
  return NextResponse.json({ grants });
}

export async function POST(request: NextRequest) {
  const denial = requireAdmin(request);
  if (denial) return denial;
  const limited = rateLimit(request, { intervalMs: 60_000, max: 20, name: 'investor-grant-admin', logClientIp: false });
  if (limited) return limited;
  try {
    const body = await request.json() as { recipientLabel?: unknown };
    const result = await createInvestorAccessGrant(body.recipientLabel);
    return NextResponse.json({
      grant: result.grant,
      magicPath: `/investor/access#token=${result.token}`,
      oneTimeReveal: true,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_RECIPIENT_LABEL') {
      return NextResponse.json({ error: 'Enter an investor or fund label between 2 and 120 characters.' }, { status: 400 });
    }
    console.error('[Investor access] Grant creation failed.');
    return NextResponse.json({ error: 'Unable to create an investor link.' }, { status: 503 });
  }
}
