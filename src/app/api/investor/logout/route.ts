import { NextRequest, NextResponse } from 'next/server';
import { clearInvestorSessionCookie, INVESTOR_SESSION_COOKIE } from '@/lib/investorAccess';
import { recordInvestorAccessEvent, resolveInvestorSession } from '@/lib/investorAccessService';
import { evaluateInvestorMutationRequest, INVESTOR_RESPONSE_HEADERS } from '@/lib/investorMutationBoundary';

function withHeaders(response: NextResponse): NextResponse {
  for (const [name, value] of Object.entries(INVESTOR_RESPONSE_HEADERS)) response.headers.set(name, value);
  return response;
}

export async function DELETE(request: NextRequest) {
  const decision = evaluateInvestorMutationRequest({
    method: request.method,
    requestOrigin: request.nextUrl.origin,
    originHeader: request.headers.get('origin'),
    fetchSiteHeader: request.headers.get('sec-fetch-site'),
    contentTypeHeader: request.headers.get('content-type'),
    contentLengthHeader: request.headers.get('content-length'),
    bodyMode: 'none',
    environment: process.env.NODE_ENV,
    allowMissingProvenance: process.env.INVESTOR_MUTATION_ALLOW_MISSING_PROVENANCE === 'true',
  });
  if (!decision.allowed) {
    return withHeaders(NextResponse.json({ error: 'This logout request could not be verified.' }, { status: decision.status }));
  }
  const grant = await resolveInvestorSession(request.cookies.get(INVESTOR_SESSION_COOKIE)?.value).catch(() => null);
  if (grant) await recordInvestorAccessEvent({ event: 'logout', grantId: grant.id }).catch(() => undefined);
  return withHeaders(clearInvestorSessionCookie(NextResponse.json({ success: true })));
}
