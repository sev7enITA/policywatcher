import * as cheerio from 'cheerio';
import { getDomain } from 'tldts';
import {
  fetchDiscoveryDocument,
  scrapePolicyText,
  type ScrapeDiagnostic,
} from './scraper';

export type DiscoveredPolicyType = 'privacy' | 'terms' | 'ai' | 'aup' | 'developer';
export type DiscoveredJurisdiction = 'Global' | 'EU' | 'US' | 'UK';

export interface PolicyDiscoveryCandidateResult {
  name: string;
  type: DiscoveredPolicyType;
  url: string;
  jurisdiction: DiscoveredJurisdiction;
  confidence: number;
  discoverySource: string;
  retrievalSource: string;
  reason: string;
  diagnostics: ScrapeDiagnostic[];
}

interface ClassifiedPolicyCandidate {
  name: string;
  type: DiscoveredPolicyType;
  jurisdiction: DiscoveredJurisdiction;
}

interface LinkCandidate extends ClassifiedPolicyCandidate {
  url: string;
  label: string;
  discoverySource: string;
  confidence: number;
  localeHint?: string;
}

const POLICY_NAMES: Record<DiscoveredPolicyType, string> = {
  privacy: 'Privacy Policy',
  terms: 'Terms of Service',
  ai: 'AI Policy',
  aup: 'Acceptable Use Policy',
  developer: 'Developer Policy',
};

const TYPE_PATTERNS: Array<[DiscoveredPolicyType, RegExp[]]> = [
  ['privacy', [
    /\bprivacy\b/i,
    /data[\s_-]+protection/i,
    /privacy[\s_-]+notice/i,
    /datenschutz/i,
    /privacidad/i,
    /confidentialit[eé]/i,
  ]],
  ['ai', [
    /\bartificial[\s_-]+intelligence\b/i,
    /\bgenerative[\s_-]+ai\b/i,
    /\bai[\s_-]+policy\b/i,
    /\bai[\s_-]+terms\b/i,
    /model[\s_-]+training/i,
  ]],
  ['aup', [
    /acceptable[\s_-]+use/i,
    /\baup\b/i,
    /community[\s_-]+guidelines/i,
    /content[\s_-]+policy/i,
    /usage[\s_-]+policy/i,
  ]],
  ['developer', [
    /developer[\s_-]+policy/i,
    /developer[\s_-]+terms/i,
    /api[\s_-]+terms/i,
    /platform[\s_-]+policy/i,
    /sdk[\s_-]+terms/i,
  ]],
  ['terms', [
    /terms[\s_-]+of[\s_-]+service/i,
    /terms[\s_-]+of[\s_-]+use/i,
    /service[\s_-]+agreement/i,
    /user[\s_-]+agreement/i,
    /legal[\s_-]+terms/i,
    /\btos\b/i,
    /\beula\b/i,
    /\bterms\b/i,
    /\bconditions\b/i,
  ]],
];

const COMMON_POLICY_PATHS = [
  '/privacy',
  '/privacy-policy',
  '/legal/privacy',
  '/terms',
  '/terms-of-service',
  '/legal/terms',
  '/acceptable-use-policy',
  '/legal/acceptable-use',
  '/ai-policy',
  '/legal/ai-policy',
  '/developer-terms',
  '/legal/developer-terms',
];

// Bounded locale-prefixed probing for regional variants. Kept small on purpose:
// the ranked cap and per-jurisdiction cap downstream limit how many of these
// reach the network-bound verification step.
const LOCALE_PROBE_PREFIXES = ['us', 'uk', 'de', 'fr', 'it', 'es'];
const LOCALE_PROBE_PATHS = ['/privacy', '/legal/privacy', '/terms', '/legal/terms'];

function normalizeSearchText(value: string): string {
  try {
    return decodeURIComponent(value).replace(/[+._/#?=&%-]+/g, ' ');
  } catch {
    return value.replace(/[+._/#?=&%-]+/g, ' ');
  }
}

const UK_REGIONS = new Set(['gb', 'uk']);
const US_REGIONS = new Set(['us']);
// EU and EEA country codes seen in locale path segments, ccTLDs, and query hints.
const EU_REGIONS = new Set([
  'eu', 'at', 'be', 'bg', 'hr', 'cy', 'cz', 'dk', 'ee', 'fi', 'fr', 'de', 'gr', 'el',
  'hu', 'ie', 'it', 'lv', 'lt', 'lu', 'mt', 'nl', 'pl', 'pt', 'ro', 'sk', 'si', 'es',
  'se', 'is', 'li', 'no',
]);
// Languages that, used as a bare locale (for example /de/ or ?hl=fr), indicate
// an EU/EEA market. English is deliberately excluded because it is ambiguous.
const EU_LANGUAGES = new Set([
  'de', 'fr', 'it', 'es', 'nl', 'pt', 'pl', 'sv', 'da', 'fi', 'el', 'cs', 'hu', 'ro',
  'sk', 'sl', 'hr', 'lt', 'lv', 'et', 'bg', 'ga', 'mt',
]);
const LOCALE_QUERY_KEYS = ['hl', 'locale', 'lang', 'language', 'cc', 'country', 'region', 'market'];
const WORLDWIDE_TOKENS = new Set(['ww', 'world', 'global', 'int', 'intl', 'international']);

function regionBucket(region: string): DiscoveredJurisdiction | null {
  const value = region.toLowerCase();
  if (UK_REGIONS.has(value)) return 'UK';
  if (US_REGIONS.has(value)) return 'US';
  if (EU_REGIONS.has(value)) return 'EU';
  if (WORLDWIDE_TOKENS.has(value)) return 'Global';
  return null;
}

// Maps a BCP-47-ish locale token (de, en-gb, fr_FR, pt-br) to a jurisdiction
// bucket, or null when it does not denote one of the tracked regions. A bare
// two-letter token is tried as a region first (uk, us, de) then as a language.
function localeBucket(token: string): DiscoveredJurisdiction | null {
  const normalized = token.trim();
  if (/^x-default$/i.test(normalized)) return 'Global';
  const match = /^([a-z]{2})(?:[-_]([a-z]{2}))?$/i.exec(normalized);
  if (!match) return null;
  const language = match[1].toLowerCase();
  const region = match[2]?.toLowerCase();
  // A supplied region is authoritative. Falling back to the language would
  // incorrectly map fr-CA, es-MX, or pt-BR to the EU.
  if (region) return regionBucket(region);
  return regionBucket(language) ?? (EU_LANGUAGES.has(language) ? 'EU' : null);
}

/**
 * Resolves the jurisdiction from the URL structure first (ccTLD, locale path
 * segment, locale query parameter, or an explicit hreflang hint), and only then
 * from strong words in the link label. Reading structure rather than free text
 * avoids false positives such as the English word "us" in a sentence, and it
 * recovers the regional variants (/de/, /fr/, ?hl=it) that previously all
 * collapsed to Global.
 */
export function resolveJurisdiction(url: string, label = '', localeHint?: string): DiscoveredJurisdiction {
  if (localeHint) {
    const hinted = localeBucket(localeHint) ?? regionBucket(localeHint);
    if (hinted) return hinted;
  }
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (host.endsWith('.uk')) return 'UK';
    const tld = host.split('.').pop() || '';
    if (EU_REGIONS.has(tld)) return 'EU';
    for (const segment of parsed.pathname.toLowerCase().split('/').filter(Boolean)) {
      const bucket = localeBucket(segment);
      if (bucket) return bucket;
    }
    for (const key of LOCALE_QUERY_KEYS) {
      const value = parsed.searchParams.get(key);
      const bucket = value ? (localeBucket(value) ?? regionBucket(value)) : null;
      if (bucket) return bucket;
    }
  } catch {
    // Not a parseable URL: fall through to explicit label words.
  }
  const labelText = normalizeSearchText(label);
  // Uppercase market abbreviations are strong label evidence, while the
  // lowercase English pronoun in phrases such as "contact us" is not.
  if (/\bEU\b/.test(labelText)) return 'EU';
  if (/\bUK\b/.test(labelText)) return 'UK';
  if (/\bUS\b/.test(labelText)) return 'US';
  const normalized = ` ${labelText.toLowerCase()} `;
  if (/\b(gdpr|eea|european union|europe|european)\b/.test(normalized)) return 'EU';
  if (/\b(united kingdom|great britain)\b/.test(normalized)) return 'UK';
  if (/\b(united states)\b/.test(normalized)) return 'US';
  return 'Global';
}

export function classifyPolicyCandidate(
  url: string,
  label = '',
  localeHint?: string
): ClassifiedPolicyCandidate | null {
  const searchable = normalizeSearchText(`${url} ${label}`);
  const match = TYPE_PATTERNS.find(([, patterns]) =>
    patterns.some((pattern) => pattern.test(searchable))
  );
  if (!match) return null;

  const type = match[0];
  const jurisdiction = resolveJurisdiction(url, label, localeHint);
  return {
    name: `${POLICY_NAMES[type]}${jurisdiction === 'Global' ? '' : ` (${jurisdiction})`}`,
    type,
    jurisdiction,
  };
}

export function normalizeDiscoveredUrl(href: string, baseUrl: string): string | null {
  try {
    const parsed = new URL(href, baseUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    parsed.hash = '';
    for (const key of [...parsed.searchParams.keys()]) {
      if (/^(utm_|gclid|fbclid|ref$|source$)/i.test(key)) parsed.searchParams.delete(key);
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

export interface DiscoveryLink {
  url: string;
  label: string;
  discoverySource: string;
  localeHint?: string;
}

export function extractDiscoveryLinks(
  content: string,
  baseUrl: string,
  discoverySource: string
): DiscoveryLink[] {
  const results = new Map<string, DiscoveryLink>();
  const add = (href: string, label: string, localeHint?: string) => {
    const url = normalizeDiscoveredUrl(href, baseUrl);
    if (!url || results.has(url)) return;
    results.set(url, { url, label: label.trim(), discoverySource, localeHint });
  };

  const sitemapMatches = content.matchAll(/<loc[^>]*>([\s\S]*?)<\/loc>/gi);
  for (const match of sitemapMatches) add(match[1].trim(), 'Sitemap URL');

  const robotsMatches = content.matchAll(/^\s*Sitemap:\s*(\S+)\s*$/gim);
  for (const match of robotsMatches) add(match[1].trim(), 'Sitemap');

  const $ = cheerio.load(content);

  // hreflang alternates are the standard way sites expose localized and
  // regional variants; they are frequently absent from the visible footer.
  // Read them first so the locale is attached even when the URL is opaque.
  $('link[rel="alternate"][hreflang], a[hreflang]').slice(0, 2_000).each((_, element) => {
    const href = $(element).attr('href');
    const hreflang = $(element).attr('hreflang');
    if (href) add(href, ($(element).attr('title') || $(element).text() || '').trim(), hreflang || undefined);
  });

  $('a[href]').slice(0, 5_000).each((_, element) => {
    const href = $(element).attr('href');
    if (href) add(href, $(element).text());
  });

  return [...results.values()];
}

function sameRegistrableDomain(leftUrl: string, rightUrl: string): boolean {
  try {
    const left = getDomain(new URL(leftUrl).hostname, { allowPrivateDomains: true });
    const right = getDomain(new URL(rightUrl).hostname, { allowPrivateDomains: true });
    return Boolean(left && right && left === right);
  } catch {
    return false;
  }
}

function candidateConfidence(
  candidateUrl: string,
  companyWebsite: string,
  label: string,
  discoverySource: string
): number {
  let confidence = sameRegistrableDomain(candidateUrl, companyWebsite) ? 68 : 52;
  if (label && classifyPolicyCandidate('', label)) confidence += 10;
  if (!discoverySource.includes('common-path') && hasCanonicalPolicyLabel(label)) confidence += 20;
  if (classifyPolicyCandidate(candidateUrl)) confidence += 10;
  if (discoverySource.includes('sitemap')) confidence += 5;
  if (discoverySource.includes('common-path')) confidence -= 8;
  try {
    const path = new URL(candidateUrl).pathname;
    if (/\/(?:answer|announcements?|support|help|community)\//i.test(path)) confidence -= 22;
  } catch {
    confidence -= 10;
  }
  return Math.max(0, Math.min(95, confidence));
}

const POLICY_EVIDENCE: Record<DiscoveredPolicyType, RegExp[]> = {
  privacy: [
    /\bprivacy (?:policy|notice|statement)\b/i,
    /\bdata protection (?:policy|notice)\b/i,
  ],
  terms: [
    /\bterms of (?:service|use)\b/i,
    /\b(?:service|user) agreement\b/i,
    /\blegal terms\b/i,
  ],
  ai: [
    /\b(?:artificial intelligence|ai) (?:policy|terms|principles|guidelines)\b/i,
    /\bgenerative ai (?:policy|terms|guidelines)\b/i,
  ],
  aup: [
    /\bacceptable use (?:policy|terms)\b/i,
    /\bcommunity guidelines\b/i,
    /\bcontent policy\b/i,
  ],
  developer: [
    /\bdeveloper (?:policy|policies|terms|agreement)\b/i,
    /\b(?:api|platform|sdk) (?:terms|policy|agreement)\b/i,
  ],
};

const LEGAL_STRUCTURE_EVIDENCE = [
  /\blast (?:updated|modified|revised)\b/i,
  /\beffective date\b/i,
  /\bthese terms\b|\bthis (?:privacy |acceptable use |ai |developer )?policy\b/i,
  /\bgoverning law\b|\bapplicable law\b/i,
  /\blimitation of liability\b|\bdisclaimer of warranties\b/i,
  /\btermination\b|\bsuspension\b/i,
  /\byour rights\b|\bdata subject rights\b/i,
];

/**
 * Scores the retrieved text as evidence for the candidate's specific policy
 * type. Generic support articles often contain legal words in navigation or
 * footers; requiring both a type-specific title and legal-document structure
 * keeps those pages out of the human review queue.
 */
export function policyEvidenceScore(text: string, type: DiscoveredPolicyType): number {
  const normalized = text.replace(/\s+/g, ' ').trim();
  const leadingText = normalized.slice(0, 1_500);
  const hasTypeEvidence = POLICY_EVIDENCE[type].some((pattern) => pattern.test(normalized));
  if (!hasTypeEvidence) return 0;

  let score = 2;
  if (POLICY_EVIDENCE[type].some((pattern) => pattern.test(leadingText))) score += 2;
  score += Math.min(
    3,
    LEGAL_STRUCTURE_EVIDENCE.filter((pattern) => pattern.test(normalized)).length
  );
  if (normalized.length >= 2_500) score += 1;
  return score;
}

function addClassifiedLinks(
  target: Map<string, LinkCandidate>,
  links: DiscoveryLink[],
  companyWebsite: string
) {
  for (const link of links) {
    const classification = classifyPolicyCandidate(link.url, link.label, link.localeHint);
    if (!classification) continue;
    const key = `${link.url}|${classification.type}|${classification.jurisdiction}`;
    const confidence = candidateConfidence(
      link.url,
      companyWebsite,
      link.label,
      link.discoverySource
    );
    const existing = target.get(key);
    if (!existing || confidence > existing.confidence) {
      target.set(key, { ...classification, ...link, confidence });
    }
  }
}

function isLegalHubLink(url: string, label: string): boolean {
  const value = normalizeSearchText(`${url} ${label}`).toLowerCase();
  return /\b(legal|policies|policy center|trust center)\b/.test(value);
}

function isCompanyHomepageLink(
  url: string,
  label: string,
  companyName: string,
  configuredWebsite: string
): boolean {
  const normalizedLabel = normalizeSearchText(label).trim().toLowerCase();
  const normalizedCompany = normalizeSearchText(companyName).trim().toLowerCase();
  if (!normalizedLabel || normalizedLabel !== normalizedCompany) return false;

  try {
    const parsed = new URL(url);
    const isHomepage = parsed.pathname === '/' || parsed.pathname === '';
    return isHomepage && !sameRegistrableDomain(url, configuredWebsite);
  } catch {
    return false;
  }
}

function hasCanonicalPolicyLabel(label: string): boolean {
  const normalized = normalizeSearchText(label).trim();
  return /^(?:[\w.-]+\s+){0,3}(?:privacy (?:policy|notice|statement)|terms of (?:service|use)|acceptable use policy|community (?:guidelines|terms of service)|developer (?:policy|terms)|api terms|ai (?:policy|terms))$/i.test(normalized);
}

function isLowConfidenceSupportArticle(url: string, label: string): boolean {
  try {
    const isNumberedArticle = /\/(?:answer|announcements?)\/\d+(?:\/|$)/i.test(
      new URL(url).pathname
    );
    return isNumberedArticle && !hasCanonicalPolicyLabel(label);
  } catch {
    return false;
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  const worker = async () => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex++;
      results[currentIndex] = await mapper(items[currentIndex]);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker())
  );
  return results;
}

async function discoveryDocuments(companyWebsite: string) {
  const website = new URL(companyWebsite);
  const origin = website.origin;
  const initialUrls = [...new Set([
    website.toString(),
    origin,
    `${origin}/robots.txt`,
    `${origin}/sitemap.xml`,
  ])];
  const documents: Array<{
    url: string;
    content: string;
    finalUrl: string;
    source: string;
    diagnostics: ScrapeDiagnostic[];
  }> = [];

  for (const url of initialUrls) {
    const result = await fetchDiscoveryDocument(url);
    if (result.status === 'ok') {
      documents.push({
        url,
        content: result.content,
        finalUrl: result.finalUrl,
        source: result.source,
        diagnostics: result.diagnostics,
      });
    }
  }

  return documents;
}

export async function discoverPolicySources(
  company: { name: string; website: string }
): Promise<PolicyDiscoveryCandidateResult[]> {
  const candidates = new Map<string, LinkCandidate>();
  const documents = await discoveryDocuments(company.website);
  const hubQueue = new Map<string, { url: string; source: string }>();
  const sitemapQueue = new Map<string, { url: string; source: string }>();
  const companySiteQueue = new Map<string, { url: string; source: string }>();
  const probeOrigins = new Set<string>([new URL(company.website).origin]);

  const collectDocumentLinks = (document: {
    url: string;
    content: string;
    finalUrl: string;
    source: string;
  }) => {
    const source = document.url.endsWith('sitemap.xml')
      ? `sitemap:${document.source}`
      : document.url.endsWith('robots.txt')
        ? `robots:${document.source}`
        : `page:${document.source}`;
    const links = extractDiscoveryLinks(document.content, document.finalUrl, source);
    addClassifiedLinks(candidates, links, company.website);
    for (const link of links) {
      if (/sitemap[^/]*\.xml(?:$|\?)/i.test(link.url)) {
        sitemapQueue.set(link.url, { url: link.url, source: `nested-sitemap:${document.source}` });
      }
      if (isLegalHubLink(link.url, link.label) && !classifyPolicyCandidate(link.url, link.label)) {
        hubQueue.set(link.url, { url: link.url, source: `legal-hub:${document.source}` });
      }
      if (isCompanyHomepageLink(link.url, link.label, company.name, company.website)) {
        companySiteQueue.set(link.url, { url: link.url, source: `company-homepage:${document.source}` });
      }
    }
  };

  for (const document of documents) {
    collectDocumentLinks(document);
  }

  // A company record may point to a help-center profile (for example
  // support.google.com/waze) rather than the brand's own domain. When that
  // page exposes an exact brand-labelled homepage link, follow it through the
  // same discovery cascade and treat it as another official-origin candidate.
  const companySites = [...companySiteQueue.values()].slice(0, 2);
  if (companySites.length > 0) probeOrigins.clear();
  for (const companySite of companySites) {
    probeOrigins.add(new URL(companySite.url).origin);
    const companyDocuments = await discoveryDocuments(companySite.url);
    for (const document of companyDocuments) {
      collectDocumentLinks(document);
    }
  }

  for (const sitemap of [...sitemapQueue.values()].slice(0, 5)) {
    const result = await fetchDiscoveryDocument(sitemap.url);
    if (result.status !== 'ok') continue;
    addClassifiedLinks(
      candidates,
      extractDiscoveryLinks(result.content, result.finalUrl, sitemap.source),
      company.website
    );
  }

  for (const hub of [...hubQueue.values()].slice(0, 4)) {
    const result = await fetchDiscoveryDocument(hub.url);
    if (result.status !== 'ok') continue;
    addClassifiedLinks(
      candidates,
      extractDiscoveryLinks(result.content, result.finalUrl, hub.source),
      company.website
    );
  }

  for (const origin of probeOrigins) {
    const commonLinks: DiscoveryLink[] = COMMON_POLICY_PATHS.map((path) => ({
      url: new URL(path, origin).toString(),
      label: path,
      discoverySource: 'common-path-probe',
    }));
    // Locale-prefixed probes recover regional variants (for example
    // /de/privacy or /uk/legal/terms) that are not linked from the default
    // homepage footer. Bounded to a small set of markets and core paths.
    const localeLinks: DiscoveryLink[] = [];
    for (const locale of LOCALE_PROBE_PREFIXES) {
      for (const path of LOCALE_PROBE_PATHS) {
        localeLinks.push({
          url: new URL(`/${locale}${path}`, origin).toString(),
          label: `/${locale}${path}`,
          discoverySource: 'common-path-probe-locale',
          localeHint: locale,
        });
      }
    }
    addClassifiedLinks(candidates, [...commonLinks, ...localeLinks], company.website);
  }

  const rankedCounts = new Map<string, number>();
  const ranked = [...candidates.values()]
    .filter((candidate) => !isLowConfidenceSupportArticle(candidate.url, candidate.label))
    .sort((left, right) => right.confidence - left.confidence)
    .filter((candidate) => {
      const key = `${candidate.type}|${candidate.jurisdiction}`;
      const count = rankedCounts.get(key) || 0;
      // Allow more variants per type and jurisdiction to reach verification so
      // genuine regional pages are not discarded as near-duplicates before the
      // retrieval chain can confirm them.
      if (count >= 5) return false;
      rankedCounts.set(key, count + 1);
      return true;
    })
    .slice(0, 40);
  // Candidate verification is network-bound. Keeping a small worker pool makes
  // the five-level fallback practical on managed hosting without overwhelming
  // either the origin site or the configured renderer/VPS.
  const verifiedResults = await mapWithConcurrency(ranked, 4, async (candidate) => {
    const scrape = await scrapePolicyText(candidate.url);
    if (scrape.status !== 'ok') return null;
    if (policyEvidenceScore(scrape.text, candidate.type) < 4) return null;

    const isArchive = ['wayback', 'commoncrawl'].includes(scrape.source);
    const liveSourceBonus = isArchive ? -20 : 5;
    const confidence = Math.max(0, Math.min(100, candidate.confidence + liveSourceBonus));
    return {
      name: candidate.name,
      type: candidate.type,
      // Archive URLs are evidence locations, not durable monitoring targets.
      // Keep the original official URL so approval never configures Wayback or
      // Common Crawl as the source to monitor.
      url: isArchive || !scrape.finalUrl?.startsWith('http')
        ? candidate.url
        : scrape.finalUrl,
      jurisdiction: candidate.jurisdiction,
      confidence,
      discoverySource: candidate.discoverySource,
      retrievalSource: scrape.source,
      reason: isArchive
        ? 'Policy evidence was recovered from an archive. The original official URL is preserved, but human confirmation is required before approval.'
        : sameRegistrableDomain(candidate.url, company.website)
          ? 'Policy-like source discovered on the official registrable domain and verified by the retrieval chain.'
          : 'Policy-like source linked from the configured company site and verified by the retrieval chain; confirm organizational ownership.',
      diagnostics: scrape.diagnostics || [],
    } satisfies PolicyDiscoveryCandidateResult;
  });
  const verified = verifiedResults.filter(
    (candidate): candidate is PolicyDiscoveryCandidateResult => candidate !== null
  );

  // Keep the review queue useful: regional variants can coexist, while near-
  // duplicate footer/help links for the same type and market are capped.
  const counts = new Map<string, number>();
  return verified
    .sort((left, right) => right.confidence - left.confidence)
    .filter((candidate) => {
      const key = `${candidate.type}|${candidate.jurisdiction}`;
      const count = counts.get(key) || 0;
      // Regional variants within a bucket (several EU markets, for example)
      // should survive for human review, not be dropped as duplicates.
      if (count >= 4) return false;
      counts.set(key, count + 1);
      return true;
    });
}
