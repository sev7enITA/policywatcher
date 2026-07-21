import { createHash, randomBytes } from 'node:crypto';
import { getDomain } from 'tldts';

export const POLICY_INQUIRY_MAX_INPUT_BYTES = 20 * 1024;
export const POLICY_INQUIRY_MAX_EXCERPT_CHARS = 1200;

const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const URL_RE = /https?:\/\/[^\s<>"']+/gi;
const TRACKING_PARAMS = new Set([
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id',
  'gclid', 'fbclid', 'mc_cid', 'mc_eid', 'mkt_tok', 'trk', 'tracking_id',
]);

export type InquiryPolicyType = 'privacy' | 'terms' | 'ai' | 'cookies' | 'acceptable-use';

export interface ParsedPolicyInquiry {
  fingerprint: string;
  companyHint: string | null;
  normalizedDomain: string | null;
  sourceUrl: string | null;
  noticeSubject: string | null;
  noticeDate: Date | null;
  effectiveDate: Date | null;
  policyTypes: InquiryPolicyType[];
  redactedExcerpt: string;
  urls: string[];
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
    url.hash = '';
    for (const key of [...url.searchParams.keys()]) {
      if (TRACKING_PARAMS.has(key.toLowerCase()) || key.toLowerCase().startsWith('utm_')) {
        url.searchParams.delete(key);
      }
    }
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

function parseDateHint(value: string | undefined): Date | null {
  if (!value) return null;
  const normalized = value
    .replace(/\s+at\s+/gi, ' ')
    .replace(/(\d)(am|pm)\b/gi, '$1 $2')
    .replace(/\bgen(?:naio)?\b/gi, 'January')
    .replace(/\bfeb(?:braio)?\b/gi, 'February')
    .replace(/\bmar(?:zo)?\b/gi, 'March')
    .replace(/\bapr(?:ile)?\b/gi, 'April')
    .replace(/\bmag(?:gio)?\b/gi, 'May')
    .replace(/\bgiu(?:gno)?\b/gi, 'June')
    .replace(/\blug(?:lio)?\b/gi, 'July')
    .replace(/\bago(?:sto)?\b/gi, 'August')
    .replace(/\bset(?:tembre)?\b/gi, 'September')
    .replace(/\bott(?:obre)?\b/gi, 'October')
    .replace(/\bnov(?:embre)?\b/gi, 'November')
    .replace(/\bdic(?:embre)?\b/gi, 'December')
    .replace(/(\d{1,2})[°º]/g, '$1');
  const dateOnly = normalized.match(/\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d{2})\b/i);
  if (dateOnly) {
    const months = ['january','february','march','april','may','june','july','august','september','october','november','december'];
    return new Date(Date.UTC(Number(dateOnly[3]), months.indexOf(dateOnly[2].toLowerCase()), Number(dateOnly[1])));
  }
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function inferPolicyTypes(input: string): InquiryPolicyType[] {
  const text = normalizeText(input);
  const found = new Set<InquiryPolicyType>();
  if (/privacy|informativa|norme sulla privacy|personal data|dati personali/.test(text)) found.add('privacy');
  if (/termini|condizioni|terms|conditions|condizioni d uso|terms of service/.test(text)) found.add('terms');
  if (/cookie/.test(text)) found.add('cookies');
  // Do not classify the Italian preposition "ai" (for example
  // "aggiornamenti ai termini") as an artificial-intelligence policy.
  if (/intelligenza artificiale|artificial intelligence|generative ai|ai (?:policy|governance|training|model|system)/.test(text)) found.add('ai');
  if (/acceptable use|uso accettabile/.test(text)) found.add('acceptable-use');
  return [...found];
}

function headerValue(input: string, name: string): string | null {
  const match = input.match(new RegExp(`^${name}\\s*:\\s*(.+)$`, 'im'));
  return match?.[1]?.trim().slice(0, 300) || null;
}

function inferCompanyFromSender(input: string): { name: string | null; domain: string | null } {
  const from = headerValue(input, 'From');
  if (!from) return { name: null, domain: null };
  const email = from.match(EMAIL_RE)?.[0];
  const domain = email ? registrableDomain(email.split('@')[1]) : null;
  const namePart = from.replace(EMAIL_RE, '').replace(/[<>"']/g, ' ').trim();
  const name = namePart && !/^no-?reply$/i.test(namePart) ? namePart.slice(0, 160) : null;
  return { name, domain };
}

function inferCompanyFromBody(input: string): string | null {
  const rejected = /^(?:from|to|cc|bcc|date|subject)\s*:|forwarded message|aggiornament|update|privacy|termin|condition|informativa|hello|ciao\b/i;
  for (const rawLine of input.split(/\r?\n/).slice(0, 12)) {
    const line = rawLine.replace(/[-–—]{3,}/g, ' ').trim();
    if (!line || line.length < 2 || line.length > 80 || rejected.test(line)) continue;
    if (/https?:\/\/|@/.test(line) || !/[A-Za-zÀ-ÿ]/.test(line)) continue;
    if (line.split(/\s+/).length > 5) continue;
    return line.slice(0, 160);
  }
  return null;
}

export function redactInquiryExcerpt(input: string): string {
  const withoutRecipientHeaders = input
    .split(/\r?\n/)
    .filter((line) => !/^\s*(to|cc|bcc)\s*:/i.test(line))
    .join('\n');
  const redacted = withoutRecipientHeaders
    .replace(EMAIL_RE, '[email redacted]')
    .replace(URL_RE, (raw) => normalizePolicyUrl(raw) || '[link removed]')
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return redacted.slice(0, POLICY_INQUIRY_MAX_EXCERPT_CHARS);
}

export function parsePolicyInquiry(input: string, explicitCompany?: string, explicitUrl?: string): ParsedPolicyInquiry {
  const size = Buffer.byteLength(input, 'utf8');
  if (!input.trim()) throw new Error('EMPTY_INPUT');
  if (size > POLICY_INQUIRY_MAX_INPUT_BYTES) throw new Error('INPUT_TOO_LARGE');

  const sender = inferCompanyFromSender(input);
  const subject = headerValue(input, 'Subject');
  const dateHeader = headerValue(input, 'Date');
  const effectiveMatch = input.match(/(?:effective|in vigore|a partire dal|dal|on|\bil)\s+(?:il\s+)?([^\n,.]{4,50}\b20\d{2})/i);
  const discoveredUrls = (input.match(URL_RE) || [])
    .map(normalizePolicyUrl)
    .filter((value): value is string => Boolean(value));
  const explicitNormalized = explicitUrl ? normalizePolicyUrl(explicitUrl) : null;
  if (explicitUrl && !explicitNormalized) throw new Error('INVALID_URL');
  const urls = [...new Set([...(explicitNormalized ? [explicitNormalized] : []), ...discoveredUrls])].slice(0, 12);
  const sourceUrl = explicitNormalized || urls.find((url) => /privacy|terms|termin|condition|policy|legal/i.test(url)) || urls[0] || null;
  const normalizedDomain = sourceUrl ? registrableDomain(sourceUrl) : sender.domain;

  return {
    fingerprint: createHash('sha256').update(input).digest('hex'),
    companyHint: explicitCompany?.trim().slice(0, 160) || sender.name || inferCompanyFromBody(input) || (input.trim().length <= 160 && !input.includes('\n') ? input.trim() : null),
    normalizedDomain,
    sourceUrl,
    noticeSubject: subject,
    noticeDate: parseDateHint(dateHeader || undefined),
    effectiveDate: parseDateHint(effectiveMatch?.[1]),
    policyTypes: inferPolicyTypes(`${subject || ''}\n${input}`),
    redactedExcerpt: redactInquiryExcerpt(input),
    urls,
  };
}

export function createInquiryPublicToken(): string {
  return `inq_${randomBytes(12).toString('base64url')}`;
}

export function buildInquiryDedupeKey(parsed: ParsedPolicyInquiry, matchedCompanyId?: string | null): string {
  return createHash('sha256')
    .update([
      matchedCompanyId || parsed.normalizedDomain || normalizeCompanyToken(parsed.companyHint || ''),
      normalizeText(parsed.noticeSubject || ''),
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

  // Conservative alias match: require at least one distinctive token of 4+ chars,
  // and return ambiguity rather than selecting when more than one company matches.
  const hintTokens = hint.split(' ').filter((token) => token.length >= 4);
  const aliases = companies.filter((company) => {
    const tokens = new Set(normalizeCompanyToken(`${company.name} ${company.slug}`).split(' '));
    return hintTokens.length > 0 && hintTokens.every((token) => tokens.has(token));
  });
  if (aliases.length === 1) return { state: 'matched', company: aliases[0], matchedPolicyId: null, reason: 'conservative_alias' };
  if (aliases.length > 1) return { state: 'ambiguous', candidates: aliases.slice(0, 5) };
  return { state: 'unknown' };
}
