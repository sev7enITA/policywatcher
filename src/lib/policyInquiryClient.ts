export const POLICY_INQUIRY_MAX_LOCAL_INPUT_BYTES = 20 * 1024;

export type InquiryPolicyType = 'privacy' | 'terms' | 'ai' | 'cookies' | 'acceptable-use';

export interface LocalPolicyInquiryClues {
  companyHint: string | null;
  senderDomain: string | null;
  sourceUrl: string | null;
  noticeDate: string | null;
  effectiveDate: string | null;
  policyTypes: InquiryPolicyType[];
}

const EMAIL_RE = /\b[A-Z0-9._%+-]+@([A-Z0-9.-]+\.[A-Z]{2,})\b/gi;
const URL_RE = /https?:\/\/[^\s<>"']+/gi;

function normalizeText(value: string): string {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function normalizeLocalUrl(value: string): string | null {
  try {
    const url = new URL(value.replace(/[),.;!?]+$/, ''));
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    url.username = '';
    url.password = '';
    url.hash = '';
    url.search = '';
    url.hostname = url.hostname.toLowerCase();
    url.pathname = url.pathname.replace(/\/{2,}/g, '/').replace(/\/$/, '') || '/';
    return url.toString();
  } catch {
    return null;
  }
}

function headerValue(input: string, name: string): string | null {
  const match = input.match(new RegExp(`^${name}\\s*:\\s*(.+)$`, 'im'));
  return match?.[1]?.trim().slice(0, 300) || null;
}

function parseDateHint(value: string | undefined): string | null {
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
    return new Date(Date.UTC(Number(dateOnly[3]), months.indexOf(dateOnly[2].toLowerCase()), Number(dateOnly[1]))).toISOString();
  }
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function inferPolicyTypes(input: string): InquiryPolicyType[] {
  const text = normalizeText(input);
  const found = new Set<InquiryPolicyType>();
  if (/privacy|informativa|norme sulla privacy|personal data|dati personali/.test(text)) found.add('privacy');
  if (/termini|condizioni|terms|conditions|condizioni d uso|terms of service/.test(text)) found.add('terms');
  if (/cookie/.test(text)) found.add('cookies');
  if (/intelligenza artificiale|artificial intelligence|generative ai|ai (?:policy|governance|training|model|system)/.test(text)) found.add('ai');
  if (/acceptable use|uso accettabile/.test(text)) found.add('acceptable-use');
  return [...found];
}

function inferCompanyFromBody(input: string): string | null {
  const rejected = /^(?:from|to|cc|bcc|date|subject)\s*:|forwarded message|aggiornament|update|privacy|termin|condition|informativa|hello|ciao\b/i;
  for (const rawLine of input.split(/\r?\n/).slice(0, 12)) {
    const line = rawLine.replace(/[-–—]{3,}/g, ' ').trim();
    if (!line || line.length < 2 || line.length > 80 || rejected.test(line)) continue;
    if (/https?:\/\/|@/.test(line) || !/[A-Za-zÀ-ÿ]/.test(line)) continue;
    if (line.split(/\s+/).length > 5) continue;
    return line;
  }
  return null;
}

function explicitOrganizationHint(value: string | undefined): string | null {
  const hint = value?.trim().slice(0, 80) || '';
  if (!hint || /@|https?:\/\//i.test(hint) || hint.split(/\s+/).length > 8) return null;
  return hint;
}

export function parsePolicyInquiryLocally(
  input: string,
  explicitCompany?: string,
  explicitUrl?: string
): LocalPolicyInquiryClues {
  if (new TextEncoder().encode(input).byteLength > POLICY_INQUIRY_MAX_LOCAL_INPUT_BYTES) {
    throw new Error('INPUT_TOO_LARGE');
  }

  const from = headerValue(input, 'From');
  const senderEmail = from?.match(EMAIL_RE)?.[0] || null;
  const senderDomain = senderEmail?.split('@')[1]?.toLowerCase() || null;
  const explicitSource = explicitUrl ? normalizeLocalUrl(explicitUrl) : null;
  if (explicitUrl && !explicitSource) throw new Error('INVALID_URL');
  const sourceUrl = explicitSource || (input.match(URL_RE) || [])
    .map(normalizeLocalUrl)
    .find((value): value is string => Boolean(value && /privacy|terms|termin|condition|policy|legal/i.test(value))) || null;
  const dateHeader = headerValue(input, 'Date');
  const effectiveMatch = input.match(/(?:effective|in vigore|a partire dal|dal|on|\bil)\s+(?:il\s+)?([^\n,.]{4,50}\b20\d{2})/i);

  return {
    // An explicit organization label is allowed. Otherwise a body brand is
    // sent only when no sender domain can identify the organization.
    companyHint: explicitOrganizationHint(explicitCompany)
      || (!senderDomain ? explicitOrganizationHint(inferCompanyFromBody(input) || undefined) : null),
    senderDomain,
    sourceUrl,
    noticeDate: parseDateHint(dateHeader || undefined),
    effectiveDate: parseDateHint(effectiveMatch?.[1]),
    policyTypes: inferPolicyTypes(`${headerValue(input, 'Subject') || ''}\n${input}`),
  };
}
