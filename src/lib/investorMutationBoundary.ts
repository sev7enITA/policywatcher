export const INVESTOR_RESPONSE_HEADERS = {
  'Cache-Control': 'private, no-store, max-age=0',
  'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex, nofollow, noarchive, noimageindex',
  'Referrer-Policy': 'no-referrer',
  Vary: 'Origin, Sec-Fetch-Site',
} as const;

export type InvestorMutationDenial =
  | 'method_not_allowed'
  | 'cross_site_request'
  | 'origin_mismatch'
  | 'provenance_missing'
  | 'json_content_type_required'
  | 'invalid_content_length'
  | 'payload_too_large'
  | 'body_not_allowed';

export type InvestorMutationDecision =
  | { allowed: true }
  | { allowed: false; status: 400 | 403 | 405 | 413 | 415; reason: InvestorMutationDenial };

export function evaluateInvestorMutationRequest(input: {
  method: string;
  requestOrigin: string;
  originHeader: string | null;
  fetchSiteHeader: string | null;
  contentTypeHeader: string | null;
  contentLengthHeader: string | null;
  bodyMode: 'json' | 'none';
  environment?: string;
  allowMissingProvenance?: boolean;
  maxBodyBytes?: number;
}): InvestorMutationDecision {
  if (!['POST', 'DELETE'].includes(input.method.toUpperCase())) {
    return { allowed: false, status: 405, reason: 'method_not_allowed' };
  }
  const fetchSite = input.fetchSiteHeader?.trim().toLowerCase() || null;
  const origin = input.originHeader?.trim() || null;
  const browserAssertsSameOrigin = fetchSite === 'same-origin';
  if (fetchSite === 'cross-site') return { allowed: false, status: 403, reason: 'cross_site_request' };
  if (origin && origin !== input.requestOrigin && !browserAssertsSameOrigin) {
    return { allowed: false, status: 403, reason: 'origin_mismatch' };
  }
  const trusted = browserAssertsSameOrigin || origin === input.requestOrigin;
  const controlledTest = input.environment !== 'production' && input.allowMissingProvenance === true;
  if (!trusted && !controlledTest) return { allowed: false, status: 403, reason: 'provenance_missing' };

  const rawLength = input.contentLengthHeader;
  const contentLength = rawLength === null ? null : Number(rawLength);
  if (contentLength !== null && (!/^\d+$/.test(rawLength || '') || !Number.isSafeInteger(contentLength))) {
    return { allowed: false, status: 400, reason: 'invalid_content_length' };
  }
  if (contentLength !== null && contentLength > (input.maxBodyBytes ?? 4_096)) {
    return { allowed: false, status: 413, reason: 'payload_too_large' };
  }
  if (input.bodyMode === 'none') {
    if ((contentLength !== null && contentLength > 0) || input.contentTypeHeader) {
      return { allowed: false, status: 400, reason: 'body_not_allowed' };
    }
    return { allowed: true };
  }
  const mediaType = input.contentTypeHeader?.split(';', 1)[0]?.trim().toLowerCase();
  if (mediaType !== 'application/json') {
    return { allowed: false, status: 415, reason: 'json_content_type_required' };
  }
  return { allowed: true };
}
