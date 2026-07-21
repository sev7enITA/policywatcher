import { createHash, randomBytes } from 'node:crypto';
import { getDomain } from 'tldts';
import type { InquiryPolicyType, LocalPolicyInquiryClues } from './policyInquiryClient';

const ALLOWED_POLICY_TYPES = new Set<InquiryPolicyType>([
  'privacy', 'terms', 'ai', 'cookies', 'acceptable-use',
]);

export interface ParsedPolicyInquiry {
  companyHint: string | null;
  normalizedDomain: string | null;
  sourceUrl: string | null;
  noticeDate: Date | null;
  effectiveDate: Date | null;
  policyTypes: InquiryPolicyType[];
}

export interface InquiryCompanyCandidate {
  id: string;
  name: string;
  slug: string;
  website: string;
  policies?: Array<{ id: string; url: string; type: string }>;
}

export type InquiryCompanyMatch =
  | { state: 'matched'; company: InquiryCompanyCandidate; matchedPolicyId: string | null; reason: string }
  | { state: 'ambiguous'; candidates: InquiryCompanyCandidate[] }
  | { state: 'unknown' };

function normalizeText(value: string): string {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function normalizeCompanyToken(value: string): string {
  return normalizeText(value)
    .replace(/\b(inc|llc|ltd|limited|srl|spa|gmbh|plc|corp|corporation|company)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function normalizePolicyUrl(value: string): string | null {
  try {
    const url = new URL(value.replace(/[),.;!?]+$/, ''));
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    url.username = '';
    url.password = '';
    url.hash = '';
    // Query values can contain identifiers or recipient-specific tokens. No
    // query parameter is required for inquiry matching or onboarding review.
    url.search = '';
    url.hostname = url.hostname.toLowerCase();
    url.pathname = url.pathname.replace(/\/{2,}/g, '/').replace(/\/$/, '') || '/';
    return url.toString();
  } catch {
    return null;
  }
}

export function registrableDomain(value: string): string | null {
  try {
    const hostname = value.includes('://') ? new URL(value).hostname : value;
    return getDomain(hostname, { allowPrivateDomains: true })?.toLowerCase() || null;
  } catch {
    return null;
  }
}

function normalizeOrganizationHint(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const hint = value.trim().slice(0, 80);
  if (!hint || /@|https?:\/\//i.test(hint) || hint.split(/\s+/).length > 8) return null;
  return hint;
}

function normalizeDate(value: unknown): Date | null {
  if (typeof value !== 'string' || value.length > 40) return null;
  const parsed = new Date(value);
  const year = parsed.getUTCFullYear();
  return Number.isFinite(parsed.getTime()) && year >= 2000 && year <= 2100 ? parsed : null;
}

export function normalizePolicyInquiryClues(input: LocalPolicyInquiryClues): ParsedPolicyInquiry {
  const sourceUrl = input.sourceUrl ? normalizePolicyUrl(input.sourceUrl) : null;
  if (input.sourceUrl && !sourceUrl) throw new Error('INVALID_URL');
  const senderDomain = typeof input.senderDomain === 'string'
    ? registrableDomain(input.senderDomain.trim().toLowerCase())
    : null;
  const companyHint = normalizeOrganizationHint(input.companyHint);
  const policyTypes = Array.isArray(input.policyTypes)
    ? [...new Set(input.policyTypes.filter((value): value is InquiryPolicyType => ALLOWED_POLICY_TYPES.has(value)))]
    : [];
  const normalizedDomain = sourceUrl ? registrableDomain(sourceUrl) : senderDomain;

  if (!companyHint && !normalizedDomain && !sourceUrl) throw new Error('EMPTY_CLUES');

  return {
    companyHint,
    normalizedDomain,
    sourceUrl,
    noticeDate: normalizeDate(input.noticeDate),
    effectiveDate: normalizeDate(input.effectiveDate),
    policyTypes,
  };
}

export function createInquiryPublicToken(): string {
  return `inq_${randomBytes(12).toString('base64url')}`;
}

export function buildInquiryDedupeKey(parsed: ParsedPolicyInquiry, matchedCompanyId?: string | null): string {
  return createHash('sha256')
    .update([
      matchedCompanyId || parsed.normalizedDomain || normalizeCompanyToken(parsed.companyHint || ''),
      parsed.noticeDate?.toISOString().slice(0, 10) || '',
      parsed.effectiveDate?.toISOString().slice(0, 10) || '',
      parsed.sourceUrl || '',
      [...parsed.policyTypes].sort().join(','),
    ].join('|'))
    .digest('hex');
}

export function matchInquiryCompany(parsed: ParsedPolicyInquiry, companies: InquiryCompanyCandidate[]): InquiryCompanyMatch {
  const normalizedSource = parsed.sourceUrl ? normalizePolicyUrl(parsed.sourceUrl) : null;
  if (normalizedSource) {
    for (const company of companies) {
      const policy = company.policies?.find((item) => normalizePolicyUrl(item.url) === normalizedSource);
      if (policy) return { state: 'matched', company, matchedPolicyId: policy.id, reason: 'exact_policy_url' };
    }
  }

  if (parsed.normalizedDomain) {
    const domainMatches = companies.filter((company) => {
      if (registrableDomain(company.website) === parsed.normalizedDomain) return true;
      return company.policies?.some((policy) => registrableDomain(policy.url) === parsed.normalizedDomain);
    });
    if (domainMatches.length === 1) return { state: 'matched', company: domainMatches[0], matchedPolicyId: null, reason: 'registrable_domain' };
    if (domainMatches.length > 1) return { state: 'ambiguous', candidates: domainMatches.slice(0, 5) };
  }

  const hint = normalizeCompanyToken(parsed.companyHint || '');
  if (!hint) return { state: 'unknown' };
  const exact = companies.filter((company) => {
    const name = normalizeCompanyToken(company.name);
    const slug = normalizeCompanyToken(company.slug);
    return hint === name || hint === slug;
  });
  if (exact.length === 1) return { state: 'matched', company: exact[0], matchedPolicyId: null, reason: 'exact_company' };
  if (exact.length > 1) return { state: 'ambiguous', candidates: exact.slice(0, 5) };

  const hintTokens = hint.split(' ').filter((token) => token.length >= 4);
  const aliases = companies.filter((company) => {
    const tokens = new Set(normalizeCompanyToken(`${company.name} ${company.slug}`).split(' '));
    return hintTokens.length > 0 && hintTokens.every((token) => tokens.has(token));
  });
  if (aliases.length === 1) return { state: 'matched', company: aliases[0], matchedPolicyId: null, reason: 'conservative_alias' };
  if (aliases.length > 1) return { state: 'ambiguous', candidates: aliases.slice(0, 5) };
  return { state: 'unknown' };
}
