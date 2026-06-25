import * as cheerio from 'cheerio';

/**
 * PolicyWatcher - Hardened Policy Scraper
 * ========================================
 *
 * This module is the FOUNDATION of the entire dataset: every risk score,
 * KPI, and AI analysis downstream depends on the text it returns.
 *
 * Design principles:
 *   1. NEVER fabricate. If a page is not reachable or the content is
 *      unusable, return status "unavailable": the caller MUST surface
 *      "Temporarily unavailable, visit the official site" to the user.
 *   2. Double-checking system:
 *        - Layer 1 (transport): fetch with timeout, retries w/ backoff,
 *          redirect + User-Agent rotation, final-URL validation.
 *        - Layer 2 (content): structural validation: HTTP status,
 *          minimum length, presence of boilerplate, captcha / 404 /
 *          maintenance / paywall / consent-wall detection.
 *   3. Deterministic result shape (ScrapeResult) so callers can branch
 *      cleanly without guessing.
 */

export type ScrapeStatus = 'ok' | 'unavailable' | 'invalid';

export interface ScrapeResult {
  status: ScrapeStatus;
  /** Cleaned plain-text policy content. Present only when status === 'ok'. */
  text: string;
  /** SHA-256 hash of the cleaned text. Present only when status === 'ok'. */
  hash: string;
  /** Final URL after redirects (useful for detecting soft-404s). */
  finalUrl: string;
  /** Human-readable reason for non-ok status (for logging / surfacing). */
  reason: string;
  /** HTTP status code observed (0 if transport failed entirely). */
  httpStatus: number;
  /** Number of attempts made. */
  attempts: number;
}

/* ---------------------------------------------------------------
   Configuration
   --------------------------------------------------------------- */

const FETCH_TIMEOUT_MS = 20_000;
const MAX_RETRIES = 2; // total attempts = 1 + MAX_RETRIES = 3
const BACKOFF_BASE_MS = 800;
const MIN_TEXT_LENGTH = 400; // a real policy page has way more than this
const MAX_TEXT_LENGTH = 200_000; // hard cap to avoid storing junk payloads

const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
];

/* ---------------------------------------------------------------
   Utility: SHA-256 hash (async, Node WebCrypto compatible)
   --------------------------------------------------------------- */

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/* ---------------------------------------------------------------
   Layer 1: robust transport fetch with retries + backoff
   --------------------------------------------------------------- */

interface TransportResult {
  ok: boolean;
  html: string;
  status: number;
  finalUrl: string;
  error: string;
}

async function fetchWithRetry(url: string): Promise<TransportResult> {
  let lastError = '';

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const ua = USER_AGENTS[attempt % USER_AGENTS.length];

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'User-Agent': ua,
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,it;q=0.8',
        },
      });

      clearTimeout(timeout);

      // Definitive success or a definitive non-retryable status
      if (res.ok) {
        const html = await res.text();
        return {
          ok: true,
          html,
          status: res.status,
          finalUrl: res.url,
          error: '',
        };
      }

      // 4xx (except 429) → not worth retrying (page moved/gone/auth)
      // 5xx / 429 → retry with backoff
      if (res.status === 429 || res.status >= 500) {
        lastError = `HTTP ${res.status}`;
        if (attempt < MAX_RETRIES) {
          await sleep(BACKOFF_BASE_MS * Math.pow(2, attempt));
          continue;
        }
      }

      const html = await res.text().catch(() => '');
      return {
        ok: false,
        html,
        status: res.status,
        finalUrl: res.url,
        error: `HTTP ${res.status} ${res.statusText}`,
      };
    } catch (err) {
      clearTimeout(timeout);
      const e = err as Error;
      lastError = e.name === 'AbortError' ? 'timeout' : e.message;
      if (attempt < MAX_RETRIES) {
        await sleep(BACKOFF_BASE_MS * Math.pow(2, attempt));
        continue;
      }
    }
  }

  return {
    ok: false,
    html: '',
    status: 0,
    finalUrl: url,
    error: lastError || 'unknown transport error',
  };
}

/* ---------------------------------------------------------------
   Layer 2: content validation
   --------------------------------------------------------------- */

const BLOCK_SIGNALS: Array<{ pattern: RegExp; reason: string }> = [
  // Cloudflare / bot challenge
  { pattern: /just a moment|cf-browser-verification|cf-challenge-running|checking your browser/i, reason: 'captcha_challenge' },
  // Generic captcha
  { pattern: /recaptcha|hcaptcha|g-recaptcha|are you a robot/i, reason: 'captcha' },
  // Maintenance / downtime
  { pattern: /(site|page) is (temporarily|currently) (down|unavailable|under maintenance)|scheduled maintenance|we'll be back soon|be back soon/i, reason: 'maintenance' },
  // Paywall / login wall
  { pattern: /subscribe to continue|this content is for subscribers|sign in to continue|log in to view/i, reason: 'paywall_or_login' },
  // Consent wall that hides the body
  { pattern: /we use cookies.*accept all.*to proceed|by clicking accept.*you allow/i, reason: 'consent_wall' },
];

/**
 * Returns a reason string if the page looks like a block/error page,
 * otherwise null. Checks raw HTML, not cleaned text.
 */
function detectBlockPage(html: string): string | null {
  for (const signal of BLOCK_SIGNALS) {
    if (signal.pattern.test(html)) return signal.reason;
  }
  return null;
}

/**
 * Detects a "soft 404": the server returned 200 but the page is actually
 * a generic not-found / error template.
 */
function detectSoft404(html: string): boolean {
  const $ = cheerio.load(html);
  const bodyText = $('body').text().toLowerCase();
  const soft404Signals = [
    'page not found',
    '404 error',
    'not found',
    "doesn't exist",
    'no longer available',
    'page you requested could not be found',
    'oops! something went wrong',
    'errore 404',
    'pagina non trovata',
  ];
  // Short page + signal = very likely a soft 404
  if (bodyText.length < 1500) {
    return soft404Signals.some((s) => bodyText.includes(s));
  }
  return false;
}

/**
 * Extracts the main policy text from HTML, stripping boilerplate.
 * Pure function (no network). Throws nothing.
 */
function extractPolicyText(html: string): string {
  const $ = cheerio.load(html);

  // Remove boilerplate elements
  $(
    'script, style, nav, footer, header, iframe, noscript, svg, form, .cookie-banner, #cookie-banner, [role="banner"], [role="contentinfo"], .nav-menu, #header, #footer, .breadcrumb, .breadcrumbs'
  ).remove();

  const mainSelectors = [
    'article',
    'main',
    '[role="main"]',
    '.main-content',
    '#main-content',
    '.policy-content',
    '.legal-content',
    '#content',
    '.container',
  ];

  let container = null;
  for (const sel of mainSelectors) {
    const el = $(sel);
    if (el.length > 0) {
      container = el;
      break;
    }
  }

  const $target = container || $('body');
  const blocks: string[] = [];

  $target.find('h1, h2, h3, h4, h5, h6, p, li').each((_, element) => {
    const $el = $(element);
    const tag = element.tagName.toLowerCase();
    const text = $el.text().trim().replace(/\s+/g, ' ');
    if (!text) return;
    if (tag.startsWith('h')) {
      const level = parseInt(tag.substring(1));
      blocks.push(`\n${'#'.repeat(level)} ${text}\n`);
    } else if (tag === 'li') {
      blocks.push(`- ${text}`);
    } else {
      blocks.push(`\n${text}\n`);
    }
  });

  if (blocks.length === 0) {
    return $target.text().trim().replace(/\n\s*\n/g, '\n\n');
  }

  return blocks.join('\n').replace(/\n\s*\n+/g, '\n\n').trim();
}

/* ---------------------------------------------------------------
   Public API
   --------------------------------------------------------------- */

/**
 * Scrapes a policy URL with the double-checking system.
 *
 * Returns a ScrapeResult. Callers MUST check `.status`:
 *   - 'ok'          → store text + hash
 *   - 'unavailable' → surface "Temporarily unavailable, visit official site"
 *   - 'invalid'     → the URL points to a non-policy page (wrong link)
 *
 * The function NEVER fabricates content: if it can't get a clean policy
 * text, it returns a non-ok status.
 */
export async function scrapePolicyText(url: string): Promise<ScrapeResult> {
  // Basic URL sanity
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return unavailable(url, 'invalid_url_scheme', 0, 0);
    }
  } catch {
    return unavailable(url, 'malformed_url', 0, 0);
  }

  // Layer 1: transport
  const transport = await fetchWithRetry(url);

  if (!transport.ok && transport.html === '') {
    // Complete transport failure (timeout, DNS, connection refused)
    return unavailable(transport.finalUrl, `transport:${transport.error}`, 0, MAX_RETRIES + 1);
  }

  const httpStatus = transport.status;

  // HTTP-level failures that returned no usable body
  if (httpStatus === 404 || httpStatus === 410) {
    return unavailable(transport.finalUrl, `http_${httpStatus}_gone`, httpStatus, MAX_RETRIES + 1);
  }
  if (httpStatus >= 400) {
    // Other client/server errors after retries exhausted
    return unavailable(transport.finalUrl, `http_${httpStatus}`, httpStatus, MAX_RETRIES + 1);
  }

  const html = transport.html;

  // Layer 2: content validation
  const blockReason = detectBlockPage(html);
  if (blockReason) {
    return unavailable(transport.finalUrl, `blocked:${blockReason}`, httpStatus, MAX_RETRIES + 1);
  }

  if (detectSoft404(html)) {
    return unavailable(transport.finalUrl, 'soft_404', httpStatus, MAX_RETRIES + 1);
  }

  const text = extractPolicyText(html);

  if (text.length < MIN_TEXT_LENGTH) {
    // Too short to be a real policy → likely an error stub or stub page
    return unavailable(transport.finalUrl, 'content_too_short', httpStatus, MAX_RETRIES + 1);
  }

  const trimmed = text.slice(0, MAX_TEXT_LENGTH);
  const hash = await sha256(trimmed);

  return {
    status: 'ok',
    text: trimmed,
    hash,
    finalUrl: transport.finalUrl,
    reason: '',
    httpStatus,
    attempts: MAX_RETRIES + 1,
  };
}

/**
 * Builds an "unavailable" result. Centralised so the shape stays consistent.
 */
function unavailable(
  finalUrl: string,
  reason: string,
  httpStatus: number,
  attempts: number
): ScrapeResult {
  // Classify whether it's a temporary outage or a fundamentally invalid URL.
  // 'gone' / 'soft_404' / 'invalid_url_scheme' / 'malformed_url' = invalid link
  const invalidReasons = [
    'invalid_url_scheme',
    'malformed_url',
    'http_410_gone',
    'http_404_gone',
    'soft_404',
  ];
  const status: ScrapeStatus = invalidReasons.includes(reason)
    ? 'invalid'
    : 'unavailable';

  return {
    status,
    text: '',
    hash: '',
    finalUrl,
    reason,
    httpStatus,
    attempts,
  };
}

/* ---------------------------------------------------------------
   Legacy compatibility shim
   --------------------------------------------------------------- */

/**
 * @deprecated Use scrapePolicyText() which returns a ScrapeResult.
 *
 * Older callers expected a string and threw on failure. This wrapper keeps
 * them working by returning the text on success and throwing a typed error
 * on failure, so callers that rely on try/catch still behave correctly.
 *
 * NEW code should use scrapePolicyText() and branch on `.status`.
 */
export async function scrapePolicyTextLegacy(url: string): Promise<string> {
  const result = await scrapePolicyText(url);
  if (result.status === 'ok') return result.text;
  throw new Error(`scrape_failed:${result.reason}`);
}
