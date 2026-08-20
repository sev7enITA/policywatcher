import { NextRequest, NextResponse } from 'next/server';
import {
  hasInvestorSessionSigningSecret,
  setInvestorSessionCookie,
} from '@/lib/investorAccess';
import { redeemInvestorMagicToken, recordInvestorAccessEvent } from '@/lib/investorAccessService';
import { evaluateInvestorMutationRequest, INVESTOR_RESPONSE_HEADERS } from '@/lib/investorMutationBoundary';
import { rateLimit } from '@/lib/rateLimit';

function withHeaders(response: NextResponse): NextResponse {
  for (const [name, value] of Object.entries(INVESTOR_RESPONSE_HEADERS)) response.headers.set(name, value);
  return response;
}

export async function POST(request: NextRequest) {
  const decision = evaluateInvestorMutationRequest({
    method: request.method,
    requestOrigin: request.nextUrl.origin,
    originHeader: request.headers.get('origin'),
    fetchSiteHeader: request.headers.get('sec-fetch-site'),
    contentTypeHeader: request.headers.get('content-type'),
    contentLengthHeader: request.headers.get('content-length'),
    bodyMode: 'json',
    environment: process.env.NODE_ENV,
    allowMissingProvenance: process.env.INVESTOR_MUTATION_ALLOW_MISSING_PROVENANCE === 'true',
  });
  if (!decision.allowed) {
    return withHeaders(NextResponse.json({ error: 'This access request could not be verified.' }, { status: decision.status }));
  }
  const limited = rateLimit(request, { intervalMs: 60_000, max: 12, name: 'investor-redeem', logClientIp: false });
  if (limited) return withHeaders(limited);
  if (!hasInvestorSessionSigningSecret()) {
    await recordInvestorAccessEvent({ event: 'denial', detail: 'session_signing_unavailable' }).catch(() => undefined);
    return withHeaders(NextResponse.json({ error: 'Investor access is temporarily unavailable.' }, { status: 503 }));
  }

  try {
    const body = await request.json() as { token?: unknown };
    const result = await redeemInvestorMagicToken(body.token);
    if (!result.ok) {
      return withHeaders(NextResponse.json({ outcome: result.reason }, { status: 401 }));
    }
    const response = NextResponse.json({ success: true, expiresAt: result.grant.expiresAt.toISOString() });
    return withHeaders(setInvestorSessionCookie(response, result.grant.id, result.grant.expiresAt));
  } catch {
    return withHeaders(NextResponse.json({ error: 'This access request could not be completed.' }, { status: 400 }));
  }
}
