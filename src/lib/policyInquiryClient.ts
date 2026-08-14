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

export interface LocalPolicyInquiryOverrides {
  policyTypes?: InquiryPolicyType[];
  noticeDate?: string | null;
  effectiveDate?: string | null;
}

const EMAIL_RE = /\b[A-Z0-9._%+-]+@([A-Z0-9.-]+\.[A-Z]{2,})\b/gi;
const URL_RE = /https?:\/\/[^\s<>"']+/gi;

// Personal and webmail providers. A brand notification pasted as visible text
// usually also contains the reader's own address (To:) and webmail chrome.
// Never treat these as the sending organization: no domain is safer than the
// reader's own domain.
const FREEMAIL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'outlook.com', 'outlook.it', 'hotmail.com', 'hotmail.it',
  'live.com', 'live.it', 'msn.com', 'yahoo.com', 'yahoo.it', 'ymail.com', 'icloud.com',
  'me.com', 'mac.com', 'proton.me', 'protonmail.com', 'pm.me', 'aol.com', 'gmx.com',
  'gmx.net', 'gmx.de', 'libero.it', 'virgilio.it', 'tin.it', 'alice.it', 'tiscali.it',
  'fastwebnet.it', 'email.it', 'pec.it',
]);

// Local-parts that strongly indicate a sender/notification address rather than a
// person, used only to rank competing brand domains found in the visible text.
const NOTIFY_LOCALPART = /^(?:no-?reply|do-?not-?reply|noreply|privacy|dpo|legal|support|help|hello|team|info|contatto|contact|assistenza|news|newsletter|notif|notifications?|account|service|customer|care)/i;

function senderDomainFromText(input: string, headerFromEmail: string | null): string | null {
  const bare = (email: string): string | null => {
    const domain = email.split('@')[1]?.toLowerCase().replace(/^www\./, '').replace(/[.,;:!?)]+$/, '');
    return domain && domain.includes('.') && !FREEMAIL_DOMAINS.has(domain) ? domain : null;
  };
  // A From: header, when the user pasted the raw source, is the most reliable.
  const headerDomain = headerFromEmail ? bare(headerFromEmail) : null;
  if (headerDomain) return headerDomain;

  // Otherwise scan the whole visible text and rank brand domains by how
  // sender-like their local-part is and how often they appear.
  const scores = new Map<string, number>();
  const order: string[] = [];
  for (const email of input.match(EMAIL_RE) || []) {
    const domain = bare(email);
    if (!domain) continue;
    if (!scores.has(domain)) order.push(domain);
    const bonus = NOTIFY_LOCALPART.test(email.split('@')[0]) ? 3 : 0;
    scores.set(domain, (scores.get(domain) || 0) + 1 + bonus);
  }
  if (!order.length) return null;
  // Array.sort is stable, so equal scores retain first-seen order.
  order.sort((a, b) => scores.get(b)! - scores.get(a)!);
  return order[0];
}

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

function strictUtcDate(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year
    || parsed.getUTCMonth() !== month - 1
    || parsed.getUTCDate() !== day
  ) return null;
  return parsed.toISOString();
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
  // Numeric European dates (day first): 22/07/2026, 22-07-2026, 22.07.2026.
  const numeric = normalized.match(/\b(\d{1,2})[\/.\-](\d{1,2})[\/.\-](20\d{2})\b/);
  if (numeric) {
    const day = Number(numeric[1]);
    const month = Number(numeric[2]);
    return strictUtcDate(Number(numeric[3]), month, day);
  }
  // ISO dates: 2026-07-22.
  const iso = normalized.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/);
  if (iso) {
    return strictUtcDate(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  }
  const dateOnly = normalized.match(/\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d{2})\b/i);
  if (dateOnly) {
    const months = ['january','february','march','april','may','june','july','august','september','october','november','december'];
    return strictUtcDate(
      Number(dateOnly[3]),
      months.indexOf(dateOnly[2].toLowerCase()) + 1,
      Number(dateOnly[1])
    );
  }
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function effectiveDateHint(input: string): string | null {
  const prefix = String.raw`(?:effective(?:\s+date)?(?:\s+is|\s+on)?|takes?\s+effect(?:\s+on)?|in\s+vigore|a\s+partire\s+dal|dal|on|\bil)`;
  const datePatterns = [
    String.raw`(20\d{2}-\d{1,2}-\d{1,2})`,
    String.raw`(\d{1,2}[\/.\-]\d{1,2}[\/.\-]20\d{2})`,
    String.raw`(\d{1,2}[°º]?\s+[\p{L}]+\s+20\d{2})`,
    String.raw`([\p{L}]+\s+\d{1,2},?\s+20\d{2})`,
  ];
  for (const datePattern of datePatterns) {
    const match = input.match(new RegExp(`${prefix}\\s+(?:il\\s+)?${datePattern}`, 'iu'));
    const parsed = parseDateHint(match?.[1]);
    if (parsed) return parsed;
  }
  return null;
}

function inferPolicyTypes(input: string): InquiryPolicyType[] {
  const text = normalizeText(input);
  const found = new Set<InquiryPolicyType>();
  if (/privacy|informativa|norme sulla privacy|personal data|dati personali/.test(text)) found.add('privacy');
  if (/termini|condizioni|terms|conditions|condizioni d uso|terms of service/.test(text)) found.add('terms');
  if (/cookie/.test(text)) found.add('cookies');
  if (
    /intelligenza artificiale|artificial intelligence|generative ai|ai (?:policy|governance|training|model|system)/.test(text)
    || /funzionalita\s+(?:supportat[aei]\s+dall['’]?\s*)?ia\b|\bia\s+(?:generativa|facoltativa|policy|governance|training|model|system|feature)/.test(text)
  ) found.add('ai');
  if (/acceptable use|uso accettabile/.test(text)) found.add('acceptable-use');
  return [...found];
}

function inferredOrganizationHint(value: string | undefined): string | null {
  const hint = explicitOrganizationHint(value)?.replace(/[.!,:;]+$/, '').trim() || null;
  if (!hint) return null;

  // Greetings, recipients and generic signatures are not organization names.
  // Keep this stricter than explicitOrganizationHint: a user may deliberately
  // confirm an unusual brand, while automatic extraction must fail closed.
  if (/^(?:gentil[ei](?:\s+(?:utente|cliente|customer|signor[ae]?))?|spettabile(?:\s+cliente)?|buongiorno|buonasera|salve|hello|hi|dear(?:\s+(?:user|customer))?|utente|cliente|customer|support|assistenza|staff|team)$/i.test(hint)) {
    return null;
  }
  return hint;
}

function inferCompanyFromBody(input: string): string | null {
  const candidatePatterns = [
    // General Italian and international signatures: "Il Team Acme",
    // "Il team di Northwind", "Team Contoso" and "The Acme Team".
    /(?:^|\n)[ \t]*(?:il[ \t]+)?team(?:[ \t]+(?:di|of))?[ \t]+([\p{L}\p{N}][\p{L}\p{N}&.'’ -]{1,60})[ \t]*$/imu,
    /(?:^|\n)[ \t]*(?:the[ \t]+)?([\p{L}\p{N}][\p{L}\p{N}&.'’ -]{1,60})[ \t]+team[ \t]*$/imu,
    /\b([\p{Lu}][\p{L}\p{N}&.'’\-]*(?:\s+[\p{Lu}][\p{L}\p{N}&.'’\-]*){0,3})\s+(?:si\s+evolve|ha\s+aggiornato|aggiorner[aà]|is\s+updating|has\s+updated|will\s+update)\b/u,
  ];
  for (const pattern of candidatePatterns) {
    const candidate = input.match(pattern)?.[1]?.trim().replace(/[.!,:;]+$/, '');
    const explicit = inferredOrganizationHint(candidate);
    if (explicit) return explicit;
  }

  const rejected = /(?:^(?:from|to|cc|bcc|date|subject)\s*:|forwarded message|aggiornament|update|privacy|termin|condition|informativa|hello\b|hi\b|ciao\b|salve\b|buongiorno\b|buonasera\b|gentil[ei]\b|spettabile\b|utente\b|cliente\b|customer\b|cosa\s+cambia|what\s+changes|dear\b|buon\s+viaggio)/i;
  for (const rawLine of input.split(/\r?\n/).slice(0, 12)) {
    const line = rawLine.replace(/[-–\u2014]{3,}/g, ' ').trim();
    if (!line || line.length < 2 || line.length > 80 || rejected.test(line)) continue;
    if (/[:;]$/.test(line)) continue;
    if (/https?:\/\/|@/.test(line) || !/[A-Za-zÀ-ÿ]/.test(line)) continue;
    if (line.split(/\s+/).length > 5) continue;
    const candidate = inferredOrganizationHint(line);
    if (candidate) return candidate;
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
  explicitUrl?: string,
  overrides: LocalPolicyInquiryOverrides = {},
): LocalPolicyInquiryClues {
  if (new TextEncoder().encode(input).byteLength > POLICY_INQUIRY_MAX_LOCAL_INPUT_BYTES) {
    throw new Error('INPUT_TOO_LARGE');
  }

  const from = headerValue(input, 'From');
  const headerFromEmail = from?.match(EMAIL_RE)?.[0] || null;
  // Read the sending organization from any brand address in the visible text,
  // not only from a From: header, since a pasted copy rarely contains headers.
  const senderDomain = senderDomainFromText(input, headerFromEmail);
  const explicitSource = explicitUrl ? normalizeLocalUrl(explicitUrl) : null;
  if (explicitUrl && !explicitSource) throw new Error('INVALID_URL');
  const sourceUrl = explicitSource || (input.match(URL_RE) || [])
    .map(normalizeLocalUrl)
    .find((value): value is string => Boolean(value && /privacy|terms|termin|condition|policy|legal/i.test(value))) || null;
  const dateHeader = headerValue(input, 'Date');
  const inferredEffectiveDate = effectiveDateHint(input);

  const inferredTypes = inferPolicyTypes(`${headerValue(input, 'Subject') || ''}\n${input}`);
  const selectedTypes = overrides.policyTypes
    ? [...new Set(overrides.policyTypes)]
    : inferredTypes;

  return {
    // An explicit organization label wins; otherwise infer a brand from the
    // body signature so the review form shows a name to confirm. The inference
    // fails closed on greetings and generic words, and a brand name is not
    // sensitive, so we no longer suppress it just because a domain was found.
    companyHint: explicitOrganizationHint(explicitCompany)
      || explicitOrganizationHint(inferCompanyFromBody(input) || undefined),
    senderDomain,
    sourceUrl,
    noticeDate: overrides.noticeDate === undefined
      ? parseDateHint(dateHeader || undefined)
      : parseDateHint(overrides.noticeDate || undefined),
    effectiveDate: overrides.effectiveDate === undefined
      ? inferredEffectiveDate
      : parseDateHint(overrides.effectiveDate || undefined),
    policyTypes: selectedTypes,
  };
}
