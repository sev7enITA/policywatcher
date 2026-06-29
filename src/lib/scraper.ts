import * as cheerio from 'cheerio';
import { lookup } from 'dns/promises';
import { isIP } from 'net';
import { connect } from 'http2';

/**
 * PolicyWatcher - Hardened Policy Scraper v3
 * ==========================================
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
 *          minimum length, policy-marker verification, captcha / 404 /
 *          maintenance / paywall / consent-wall detection.
 *   3. Adaptive fallback cascade (4 strategies):
 *        a. Direct fetch with realistic browser fingerprint
 *        b. HTTP/2-only fetch (fixes Meta 400 errors)
 *        c. Wayback Machine (web.archive.org) cached version
 *        d. Google Web Cache
 *   4. Polite crawling: random delays between requests (1–3s) to
 *      avoid triggering rate-limiting / CAPTCHA.
 *   5. Deterministic result shape (ScrapeResult) so callers can branch
 *      cleanly without guessing.
 *
 * NOTE: Playwright/headless browser is NOT available on Hostinger shared
 * hosting (no root access to install Chromium). If you migrate to a VPS,
 * add a fetchRendered() strategy between HTTP/2 and Wayback.
 */

export type ScrapeStatus = 'ok' | 'unavailable' | 'invalid';

export interface ScrapeResult {
  /** Overall status of the scrape attempt. */
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
  /** Which source provided the data: 'direct', 'http2', 'wayback', 'cache'. */
  source: string;
}

/* ---------------------------------------------------------------
   Configuration
   --------------------------------------------------------------- */

const FETCH_TIMEOUT_MS = 20_000;
const MAX_RETRIES = 2; // total attempts = 1 + MAX_RETRIES = 3
const MAX_REDIRECTS = 5;
const BACKOFF_BASE_MS = 800;
const MIN_TEXT_LENGTH = 400; // a real policy page has way more than this
const MAX_TEXT_LENGTH = 200_000; // hard cap to avoid storing junk payloads

// Realistic browser headers — rotation per attempt
const BROWSER_PROFILES = [
  {
    ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    secChUa: '"Chromium";v="126", "Google Chrome";v="126", "Not-A.Brand";v="8"',
    platform: '"macOS"',
  },
  {
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    secChUa: '"Chromium";v="126", "Google Chrome";v="126", "Not-A.Brand";v="8"',
    platform: '"Windows"',
  },
  {
    ua: 'Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0',
    secChUa: '',
    platform: '',
  },
];

/**
 * Policy content markers — used to verify the page is actually a
 * privacy policy / ToS and not a random error page or empty SPA shell.
 * At least 3 of these must appear in the extracted text.
 */
const POLICY_MARKERS = [
  'privacy', 'data', 'personal', 'terms', 'agreement',
  'information', 'rights', 'cookie', 'consent', 'collect',
  'service', 'policy', 'user', 'account', 'third party',
  'processing', 'disclosure', 'retention', 'gdpr', 'legal',
];
const MIN_MARKER_HITS = 3;

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

/** Polite delay: random 1–3 seconds between requests */
async function politeDelay(): Promise<void> {
  const ms = 1000 + Math.random() * 2000;
  await sleep(ms);
}

function isPrivateIpv4(address: string): boolean {
  const parts = address.split('.').map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return true;
  }

  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function isPrivateIpv6(address: string): boolean {
  const normalized = address.toLowerCase();
  if (normalized.startsWith('::ffff:')) {
    return isPrivateIpv4(normalized.replace('::ffff:', ''));
  }

  return (
    normalized === '::' ||
    normalized === '::1' ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    normalized.startsWith('fe80:') ||
    normalized.startsWith('fec0:')
  );
}

function isPrivateAddress(address: string): boolean {
  const version = isIP(address);
  if (version === 4) return isPrivateIpv4(address);
  if (version === 6) return isPrivateIpv6(address);
  return true;
}

function isBlockedHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/\.$/, '');
  return normalized === 'localhost' || normalized.endsWith('.localhost');
}

async function validateOutboundUrl(rawUrl: string): Promise<{ ok: true; url: string } | { ok: false; reason: string; finalUrl: string }> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { ok: false, reason: 'malformed_url', finalUrl: rawUrl };
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { ok: false, reason: 'invalid_url_scheme', finalUrl: rawUrl };
  }

  if (parsed.username || parsed.password) {
    return { ok: false, reason: 'blocked_url_credentials', finalUrl: parsed.toString() };
  }

  if (isBlockedHostname(parsed.hostname)) {
    return { ok: false, reason: 'blocked_private_hostname', finalUrl: parsed.toString() };
  }

  if (isIP(parsed.hostname)) {
    return isPrivateAddress(parsed.hostname)
      ? { ok: false, reason: 'blocked_private_address', finalUrl: parsed.toString() }
      : { ok: true, url: parsed.toString() };
  }

  try {
    const addresses = await lookup(parsed.hostname, { all: true, verbatim: false });
    if (addresses.some((entry) => isPrivateAddress(entry.address))) {
      return { ok: false, reason: 'blocked_private_address', finalUrl: parsed.toString() };
    }
  } catch {
    return { ok: false, reason: 'dns_lookup_failed', finalUrl: parsed.toString() };
  }

  return { ok: true, url: parsed.toString() };
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

function buildHeaders(profile: typeof BROWSER_PROFILES[0]): Record<string, string> {
  const headers: Record<string, string> = {
    'User-Agent': profile.ua,
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9,it;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
    'Upgrade-Insecure-Requests': '1',
    'DNT': '1',
    'Connection': 'keep-alive',
  };

  // Chrome-specific Sec-CH-UA headers (not sent by Firefox)
  if (profile.secChUa) {
    headers['Sec-CH-UA'] = profile.secChUa;
    headers['Sec-CH-UA-Mobile'] = '?0';
    headers['Sec-CH-UA-Platform'] = profile.platform;
    headers['Sec-Fetch-Dest'] = 'document';
    headers['Sec-Fetch-Mode'] = 'navigate';
    headers['Sec-Fetch-Site'] = 'none';
    headers['Sec-Fetch-User'] = '?1';
  }

  return headers;
}

async function fetchWithRetry(url: string): Promise<TransportResult> {
  let lastError = '';

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      // Polite delay between retries (reduces CAPTCHA triggers)
      await politeDelay();
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const profile = BROWSER_PROFILES[attempt % BROWSER_PROFILES.length];

    try {
      let requestUrl = url;
      let redirects = 0;

      while (true) {
        const destination = await validateOutboundUrl(requestUrl);
        if (!destination.ok) {
          clearTimeout(timeout);
          return {
            ok: false,
            html: '',
            status: 0,
            finalUrl: destination.finalUrl,
            error: destination.reason,
          };
        }
        requestUrl = destination.url;

        const res = await fetch(requestUrl, {
          signal: controller.signal,
          redirect: 'manual',
          headers: buildHeaders(profile),
        });

        if (res.status >= 300 && res.status < 400) {
          const location = res.headers.get('location');
          if (!location) {
            clearTimeout(timeout);
            return {
              ok: false,
              html: '',
              status: res.status,
              finalUrl: requestUrl,
              error: 'redirect_without_location',
            };
          }

          redirects++;
          if (redirects > MAX_REDIRECTS) {
            clearTimeout(timeout);
            return {
              ok: false,
              html: '',
              status: res.status,
              finalUrl: requestUrl,
              error: 'too_many_redirects',
            };
          }

          requestUrl = new URL(location, requestUrl).toString();
          continue;
        }

        clearTimeout(timeout);

        // For ALL responses (including 4xx), read the body
        const html = await res.text().catch(() => '');

        if (res.ok || (res.status === 403 && html.length > 5_000)) {
          // 200 OK, or 403 with substantial body (soft-block like Revolut)
          if (res.status === 403) {
            console.log(`[Scraper] 403 soft-block with ${html.length} bytes body — proceeding to content validation.`);
          }
          return {
            ok: true,
            html,
            status: res.status,
            finalUrl: requestUrl,
            error: '',
          };
        }

        // 4xx (except 429) → not worth retrying (page moved/gone/auth)
        // 5xx / 429 → retry with backoff
        if (res.status === 429 || res.status >= 500) {
          lastError = `HTTP ${res.status}`;
          if (attempt < MAX_RETRIES) {
            await sleep(BACKOFF_BASE_MS * Math.pow(2, attempt));
            break;
          }
        }

        return {
          ok: false,
          html,
          status: res.status,
          finalUrl: requestUrl,
          error: `HTTP ${res.status} ${res.statusText}`,
        };
      }
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
   HTTP/2 explicit fetch (fixes Meta 400 errors)
   Some servers (notably Meta/Facebook) reject HTTP/1.1 requests
   with 400 Bad Request. Node's built-in http2 module negotiates
   H2 directly over TLS (ALPN), like a real browser.
   --------------------------------------------------------------- */

async function fetchWithHttp2(url: string): Promise<TransportResult> {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const timer = setTimeout(() => {
      resolve({ ok: false, html: '', status: 0, finalUrl: url, error: 'h2_timeout' });
    }, FETCH_TIMEOUT_MS);

    try {
      const client = connect(`https://${parsed.hostname}`, {}, () => {
        const profile = BROWSER_PROFILES[0];
        const headers: Record<string, string> = {
          ':method': 'GET',
          ':path': parsed.pathname + parsed.search,
          ':scheme': 'https',
          ':authority': parsed.hostname,
          'user-agent': profile.ua,
          'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'accept-language': 'en-US,en;q=0.9',
          'accept-encoding': 'identity', // no compression for simplicity
        };
        if (profile.secChUa) {
          headers['sec-ch-ua'] = profile.secChUa;
          headers['sec-ch-ua-mobile'] = '?0';
          headers['sec-ch-ua-platform'] = profile.platform;
          headers['sec-fetch-dest'] = 'document';
          headers['sec-fetch-mode'] = 'navigate';
          headers['sec-fetch-site'] = 'none';
          headers['sec-fetch-user'] = '?1';
        }

        const req = client.request(headers);
        let data = '';
        let statusCode = 0;

        req.on('response', (hdrs) => {
          statusCode = hdrs[':status'] as number || 0;
        });

        req.on('data', (chunk: Buffer) => {
          data += chunk.toString();
        });

        req.on('end', () => {
          clearTimeout(timer);
          client.close();
          if (statusCode >= 200 && statusCode < 400 && data.length > 0) {
            resolve({ ok: true, html: data, status: statusCode, finalUrl: url, error: '' });
          } else {
            resolve({ ok: false, html: data, status: statusCode, finalUrl: url, error: `h2_status_${statusCode}` });
          }
        });

        req.on('error', (err: Error) => {
          clearTimeout(timer);
          client.close();
          resolve({ ok: false, html: '', status: 0, finalUrl: url, error: `h2_req_error:${err.message}` });
        });

        req.end();
      });

      client.on('error', (err: Error) => {
        clearTimeout(timer);
        resolve({ ok: false, html: '', status: 0, finalUrl: url, error: `h2_connect_error:${err.message}` });
      });
    } catch (err) {
      clearTimeout(timer);
      const e = err as Error;
      resolve({ ok: false, html: '', status: 0, finalUrl: url, error: `h2_error:${e.message}` });
    }
  });
}

/* ---------------------------------------------------------------
   Wayback Machine & Google Cache fallback
   --------------------------------------------------------------- */

/**
 * Tries to fetch the latest Wayback Machine snapshot for a URL.
 * Uses the Wayback Availability API first (fast check), then CDX
 * API as fallback if availability API returns no results.
 */
async function fetchFromWayback(originalUrl: string): Promise<TransportResult> {
  // Strategy A: Availability API (fast, simple)
  try {
    const availUrl = `https://archive.org/wayback/available?url=${encodeURIComponent(originalUrl)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const availRes = await fetch(availUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'PolicyWatcher/3.1 (https://policywatcher.online)' },
    });
    clearTimeout(timeout);

    if (availRes.ok) {
      const data = await availRes.json() as {
        archived_snapshots?: { closest?: { available?: boolean; url?: string; timestamp?: string } };
      };
      const snap = data?.archived_snapshots?.closest;
      if (snap?.available && snap?.url) {
        // Convert to raw URL (id_ prefix prevents Wayback toolbar injection)
        const rawUrl = snap.url.replace(/\/web\/(\d+)\//, '/web/$1id_/');
        const result = await fetchWaybackPage(rawUrl);
        if (result.ok) return result;
      }
    }
  } catch {
    // Fall through to CDX API
  }

  // Strategy B: CDX API (more comprehensive, finds older snapshots)
  const cdxUrl = `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(originalUrl)}&output=json&limit=-3&filter=statuscode:200&fl=timestamp`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    const cdxRes = await fetch(cdxUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'PolicyWatcher/3.1 (https://policywatcher.online)' },
    });
    clearTimeout(timeout);

    if (!cdxRes.ok) {
      return { ok: false, html: '', status: cdxRes.status, finalUrl: cdxUrl, error: 'wayback_cdx_error' };
    }

    const rows = await cdxRes.json() as string[][];
    // First row is header ["timestamp"], rest are data
    if (rows.length < 2) {
      return { ok: false, html: '', status: 0, finalUrl: cdxUrl, error: 'wayback_no_snapshots' };
    }

    // Try latest first, then second-latest
    for (let i = rows.length - 1; i >= 1; i--) {
      const ts = rows[i][0];
      const rawUrl = `https://web.archive.org/web/${ts}id_/${originalUrl}`;
      const result = await fetchWaybackPage(rawUrl);
      if (result.ok) return result;
    }

    return { ok: false, html: '', status: 0, finalUrl: cdxUrl, error: 'wayback_all_snapshots_invalid' };
  } catch (err) {
    const e = err as Error;
    return { ok: false, html: '', status: 0, finalUrl: cdxUrl, error: `wayback_error:${e.message}` };
  }
}

/** Fetches and cleans a single Wayback Machine page. */
async function fetchWaybackPage(rawUrl: string): Promise<TransportResult> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(rawUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'PolicyWatcher/3.1 (https://policywatcher.online)' },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return { ok: false, html: '', status: res.status, finalUrl: rawUrl, error: `wayback_fetch_${res.status}` };
    }

    let html = await res.text();
    // Strip Wayback Machine toolbar injection and tracking scripts
    html = html.replace(/<!-- BEGIN WAYBACK TOOLBAR INSERT -->[\s\S]*?<!-- END WAYBACK TOOLBAR INSERT -->/gi, '');
    html = html.replace(/<script[^>]*wombat[^>]*>[\s\S]*?<\/script>/gi, '');
    html = html.replace(/<script[^>]*archive\.org[^>]*>[\s\S]*?<\/script>/gi, '');
    // Fix Wayback-rewritten URLs back to originals (optional, for cleaner text)
    html = html.replace(/https?:\/\/web\.archive\.org\/web\/\d+\//g, '');

    return { ok: true, html, status: 200, finalUrl: rawUrl, error: '' };
  } catch (err) {
    const e = err as Error;
    return { ok: false, html: '', status: 0, finalUrl: rawUrl, error: `wayback_page_error:${e.message}` };
  }
}

/**
 * Tries to fetch from Google Web Cache.
 */
async function fetchFromGoogleCache(originalUrl: string): Promise<TransportResult> {
  const cacheUrl = `https://webcache.googleusercontent.com/search?q=cache:${encodeURIComponent(originalUrl)}&strip=1`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    const res = await fetch(cacheUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': BROWSER_PROFILES[0].ua,
        Accept: 'text/html',
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return { ok: false, html: '', status: res.status, finalUrl: cacheUrl, error: `gcache_${res.status}` };
    }

    const html = await res.text();
    return { ok: true, html, status: 200, finalUrl: cacheUrl, error: '' };
  } catch (err) {
    const e = err as Error;
    return { ok: false, html: '', status: 0, finalUrl: cacheUrl, error: `gcache_error:${e.message}` };
  }
}

/**
 * Tries to fetch from Common Crawl — a massive open web archive
 * with its own CDX index. Often has snapshots that Wayback Machine doesn't.
 * API: https://index.commoncrawl.org/
 */
async function fetchFromCommonCrawl(originalUrl: string): Promise<TransportResult> {
  try {
    // 1. Get the latest Common Crawl index
    const controller1 = new AbortController();
    const timeout1 = setTimeout(() => controller1.abort(), 10_000);
    const collRes = await fetch('https://index.commoncrawl.org/collinfo.json', {
      signal: controller1.signal,
      headers: { 'User-Agent': 'PolicyWatcher/3.1' },
    });
    clearTimeout(timeout1);

    if (!collRes.ok) {
      return { ok: false, html: '', status: 0, finalUrl: originalUrl, error: 'cc_index_error' };
    }

    const collections = await collRes.json() as Array<{ 'cdx-api': string; id: string }>;
    if (!collections.length) {
      return { ok: false, html: '', status: 0, finalUrl: originalUrl, error: 'cc_no_collections' };
    }

    // Use the most recent collection
    const latestCdx = collections[0]['cdx-api'];

    // 2. Search for the URL in the CDX index
    const controller2 = new AbortController();
    const timeout2 = setTimeout(() => controller2.abort(), 15_000);
    const searchUrl = `${latestCdx}?url=${encodeURIComponent(originalUrl)}&output=json&limit=1&filter=status:200`;
    const cdxRes = await fetch(searchUrl, {
      signal: controller2.signal,
      headers: { 'User-Agent': 'PolicyWatcher/3.1' },
    });
    clearTimeout(timeout2);

    if (!cdxRes.ok) {
      return { ok: false, html: '', status: 0, finalUrl: searchUrl, error: `cc_cdx_${cdxRes.status}` };
    }

    const text = await cdxRes.text();
    const lines = text.trim().split('\n').filter(l => l.length > 0);
    if (lines.length === 0) {
      return { ok: false, html: '', status: 0, finalUrl: searchUrl, error: 'cc_no_results' };
    }

    // Parse the CDX record (NDJSON format)
    const record = JSON.parse(lines[0]) as {
      url: string;
      filename: string;
      offset: string;
      length: string;
    };

    // 3. Fetch the actual page from Common Crawl S3
    const warc_url = `https://data.commoncrawl.org/${record.filename}`;
    const offset = parseInt(record.offset);
    const length = parseInt(record.length);

    const controller3 = new AbortController();
    const timeout3 = setTimeout(() => controller3.abort(), 20_000);
    const warcRes = await fetch(warc_url, {
      signal: controller3.signal,
      headers: {
        'User-Agent': 'PolicyWatcher/3.1',
        Range: `bytes=${offset}-${offset + length - 1}`,
      },
    });
    clearTimeout(timeout3);

    if (!warcRes.ok && warcRes.status !== 206) {
      return { ok: false, html: '', status: warcRes.status, finalUrl: warc_url, error: `cc_warc_${warcRes.status}` };
    }

    const warcData = await warcRes.text();
    // WARC records have headers before the HTML — extract just the HTML body
    const htmlStart = warcData.indexOf('<!');
    const htmlStartAlt = warcData.indexOf('<html');
    const start = Math.min(
      htmlStart >= 0 ? htmlStart : Infinity,
      htmlStartAlt >= 0 ? htmlStartAlt : Infinity,
    );

    if (start === Infinity) {
      return { ok: false, html: '', status: 0, finalUrl: warc_url, error: 'cc_no_html_in_warc' };
    }

    const html = warcData.substring(start);
    return { ok: true, html, status: 200, finalUrl: `commoncrawl://${record.url}`, error: '' };
  } catch (err) {
    const e = err as Error;
    return { ok: false, html: '', status: 0, finalUrl: originalUrl, error: `cc_error:${e.message}` };
  }
}

/* ---------------------------------------------------------------
   Layer 2: content validation
   --------------------------------------------------------------- */

const BLOCK_SIGNALS: Array<{ pattern: RegExp; reason: string }> = [
  // Cloudflare / bot challenge
  { pattern: /just a moment|cf-browser-verification|cf-challenge-running|checking your browser/i, reason: 'captcha_challenge' },
  // Generic captcha
  { pattern: /recaptcha|hcaptcha|g-recaptcha|are you a robot|verify you are human/i, reason: 'captcha' },
  // Maintenance / downtime
  { pattern: /(site|page) is (temporarily|currently) (down|unavailable|under maintenance)|scheduled maintenance|we'll be back soon|be back soon/i, reason: 'maintenance' },
  // Paywall / login wall
  { pattern: /subscribe to continue|this content is for subscribers|sign in to continue|log in to view/i, reason: 'paywall_or_login' },
  // Consent wall that hides the body
  { pattern: /we use cookies.*accept all.*to proceed|by clicking accept.*you allow/i, reason: 'consent_wall' },
  // Access denied (WAF block pages)
  { pattern: /access denied|error 1015|you have been blocked/i, reason: 'access_denied' },
];

/**
 * Returns a reason string if the page looks like a block/error page,
 * otherwise null. Checks ONLY the first 2000 chars of raw HTML
 * to avoid false positives from legitimate policy text mentioning
 * terms like "captcha" or "blocked" in context.
 */
function detectBlockPage(html: string): string | null {
  const head = html.slice(0, 2000).toLowerCase();
  for (const signal of BLOCK_SIGNALS) {
    if (signal.pattern.test(head)) return signal.reason;
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
 * Extracts clean visible text from HTML, stripping boilerplate.
 * This is the NORMALIZER that both the scraper (for storage) and
 * the diff engine (for comparison) should use to avoid comparing
 * raw HTML artifacts.
 *
 * Pure function (no network). Throws nothing.
 */
function extractPolicyText(html: string): string {
  const $ = cheerio.load(html);

  // Remove boilerplate elements
  $(
    'script, style, nav, footer, header, iframe, noscript, svg, form, ' +
    '.cookie-banner, #cookie-banner, [role="banner"], [role="contentinfo"], ' +
    '.nav-menu, #header, #footer, .breadcrumb, .breadcrumbs, ' +
    '.sidebar, aside, [aria-hidden="true"]'
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

  // Extract structured text from semantic elements + table cells + definition lists
  $target.find('h1, h2, h3, h4, h5, h6, p, li, td, th, dt, dd, blockquote, div > span, section > div').each((_, element) => {
    const $el = $(element);
    const tag = element.tagName.toLowerCase();
    const text = $el.text().trim().replace(/\s+/g, ' ');
    if (!text || text.length < 3) return;
    if (tag.startsWith('h')) {
      const level = parseInt(tag.substring(1));
      blocks.push(`\n${'#'.repeat(level)} ${text}\n`);
    } else if (tag === 'li') {
      blocks.push(`- ${text}`);
    } else {
      blocks.push(`\n${text}\n`);
    }
  });

  // Fallback: if structured extraction found nothing, use raw visible text
  if (blocks.length === 0) {
    return $target.text().trim().replace(/\n\s*\n/g, '\n\n');
  }

  return blocks.join('\n').replace(/\n\s*\n+/g, '\n\n').trim();
}

/**
 * Quick visible-text extractor for validation purposes.
 * Strips all tags and returns normalized whitespace text.
 */
function visibleText(html: string): string {
  const $ = cheerio.load(html);
  $('script, style, noscript').remove();
  return $('body').text().replace(/\s+/g, ' ').trim();
}

/* ---------------------------------------------------------------
   Content validation pipeline
   --------------------------------------------------------------- */

/**
 * Validates HTML content through Layer 2 checks.
 * Returns { ok: true, text, hash } or { ok: false, reason }.
 */
async function validateContent(html: string, _finalUrl: string): Promise<
  | { ok: true; text: string; hash: string }
  | { ok: false; reason: string }
> {
  const blockReason = detectBlockPage(html);
  if (blockReason) return { ok: false, reason: `blocked:${blockReason}` };

  if (detectSoft404(html)) return { ok: false, reason: 'soft_404' };

  const text = extractPolicyText(html);
  if (text.length < MIN_TEXT_LENGTH) {
    // Before giving up, check raw visible text length
    // Some sites have complex DOM that our extractor misses
    const rawText = visibleText(html);
    if (rawText.length >= MIN_TEXT_LENGTH) {
      // Use raw visible text as fallback
      const trimmed = rawText.slice(0, MAX_TEXT_LENGTH);
      // Validate it's actually a policy page
      if (!isPolicyContent(trimmed)) return { ok: false, reason: 'not_a_policy_page' };
      const hash = await sha256(trimmed);
      return { ok: true, text: trimmed, hash };
    }
    return { ok: false, reason: 'content_too_short' };
  }

  // Verify extracted text is actually a policy page (not a random page)
  if (!isPolicyContent(text)) return { ok: false, reason: 'not_a_policy_page' };

  const trimmed = text.slice(0, MAX_TEXT_LENGTH);
  const hash = await sha256(trimmed);

  return { ok: true, text: trimmed, hash };
}

/**
 * Checks if extracted text looks like a genuine policy/ToS page
 * by counting occurrences of policy-related keywords.
 * Prevents false positives from error pages or unrelated content.
 */
function isPolicyContent(text: string): boolean {
  const lower = text.toLowerCase();
  const hits = POLICY_MARKERS.filter(m => lower.includes(m)).length;
  return hits >= MIN_MARKER_HITS;
}

/* ---------------------------------------------------------------
   Public API
   --------------------------------------------------------------- */

/**
 * Scrapes a policy URL with the double-checking system and
 * adaptive fallback cascade.
 *
 * Fetch strategy (in order of cost):
 *   1. Direct HTTP/1.1 fetch with realistic browser fingerprint
 *   2. HTTP/2 explicit fetch (fixes Meta 400 errors)
 *   3. Wayback Machine (web.archive.org) cached version
 *   4. Google Web Cache
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
  const destination = await validateOutboundUrl(url);
  if (!destination.ok) {
    return makeResult('unavailable', destination.finalUrl, destination.reason, 0, 0, 'direct');
  }

  let directReason = '';

  // ── Strategy 1: Direct HTTP/1.1 fetch ──
  console.log(`[Scraper] [1/5] Direct fetch: ${url}`);
  const transport = await fetchWithRetry(destination.url);

  if (!transport.ok && transport.html === '') {
    directReason = transport.error;
    console.log(`[Scraper] [1/5] Transport failure: ${transport.error}`);
  } else {
    const httpStatus = transport.status;

    if (httpStatus === 404 || httpStatus === 410) {
      directReason = `http_${httpStatus}_gone`;
      console.log(`[Scraper] [1/5] ${httpStatus} Gone`);
    } else if (httpStatus >= 400 && !(httpStatus === 403 && transport.html.length > 5_000)) {
      directReason = `http_${httpStatus}`;
      console.log(`[Scraper] [1/5] HTTP ${httpStatus}`);
    } else {
      const validation = await validateContent(transport.html, transport.finalUrl);
      if (validation.ok) {
        console.log(`[Scraper] ✅ Direct fetch OK (${validation.text.length} chars)`);
        return {
          status: 'ok',
          text: validation.text,
          hash: validation.hash,
          finalUrl: transport.finalUrl,
          reason: '',
          httpStatus,
          attempts: MAX_RETRIES + 1,
          source: 'direct',
        };
      }
      directReason = validation.reason;
      console.log(`[Scraper] [1/5] Content rejected: ${validation.reason}`);
    }
  }

  // ── Strategy 2: HTTP/2 explicit (for Meta 400 errors) ──
  // Only try if direct fetch got 400 (protocol mismatch) or content_too_short (SPA shell)
  if (directReason.includes('400') || directReason === 'content_too_short') {
    await politeDelay();
    console.log(`[Scraper] [2/5] HTTP/2 explicit: ${url}`);
    try {
      const h2Result = await fetchWithHttp2(destination.url);
      if (h2Result.ok) {
        const validation = await validateContent(h2Result.html, h2Result.finalUrl);
        if (validation.ok) {
          console.log(`[Scraper] ✅ HTTP/2 fetch OK (${validation.text.length} chars)`);
          return {
            status: 'ok',
            text: validation.text,
            hash: validation.hash,
            finalUrl: h2Result.finalUrl,
            reason: '',
            httpStatus: h2Result.status,
            attempts: MAX_RETRIES + 2,
            source: 'http2',
          };
        }
        console.log(`[Scraper] [2/5] H2 content rejected: ${validation.reason}`);
      } else {
        console.log(`[Scraper] [2/5] H2 fetch failed: ${h2Result.error}`);
      }
    } catch (err) {
      console.log(`[Scraper] [2/5] H2 error: ${(err as Error).message}`);
    }
  } else {
    console.log(`[Scraper] [2/5] HTTP/2 skipped (not a 400/SPA issue)`);
  }

  // ── Strategy 3: Wayback Machine ──
  await politeDelay();
  console.log(`[Scraper] [3/5] Wayback Machine: ${url}`);
  const wayback = await fetchFromWayback(url);
  if (wayback.ok) {
    const validation = await validateContent(wayback.html, wayback.finalUrl);
    if (validation.ok) {
      console.log(`[Scraper] ✅ Wayback Machine OK (${validation.text.length} chars from ${wayback.finalUrl})`);
      return {
        status: 'ok',
        text: validation.text,
        hash: validation.hash,
        finalUrl: wayback.finalUrl,
        reason: '',
        httpStatus: 200,
        attempts: MAX_RETRIES + 3,
        source: 'wayback',
      };
    }
    console.log(`[Scraper] [3/5] Wayback content rejected: ${validation.reason}`);
  } else {
    console.log(`[Scraper] [3/5] Wayback failed: ${wayback.error}`);
  }

  // ── Strategy 4: Google Web Cache ──
  await politeDelay();
  console.log(`[Scraper] [4/5] Google Cache: ${url}`);
  const gcache = await fetchFromGoogleCache(url);
  if (gcache.ok) {
    const validation = await validateContent(gcache.html, gcache.finalUrl);
    if (validation.ok) {
      console.log(`[Scraper] ✅ Google Cache OK (${validation.text.length} chars)`);
      return {
        status: 'ok',
        text: validation.text,
        hash: validation.hash,
        finalUrl: gcache.finalUrl,
        reason: '',
        httpStatus: 200,
        attempts: MAX_RETRIES + 4,
        source: 'cache',
      };
    }
    console.log(`[Scraper] [4/5] Google Cache content rejected: ${validation.reason}`);
  } else {
    console.log(`[Scraper] [4/5] Google Cache failed: ${gcache.error}`);
  }

  // ── Strategy 5: Common Crawl ──
  await politeDelay();
  console.log(`[Scraper] [5/5] Common Crawl: ${url}`);
  const cc = await fetchFromCommonCrawl(url);
  if (cc.ok) {
    const validation = await validateContent(cc.html, cc.finalUrl);
    if (validation.ok) {
      console.log(`[Scraper] ✅ Common Crawl OK (${validation.text.length} chars)`);
      return {
        status: 'ok',
        text: validation.text,
        hash: validation.hash,
        finalUrl: cc.finalUrl,
        reason: '',
        httpStatus: 200,
        attempts: MAX_RETRIES + 5,
        source: 'commoncrawl',
      };
    }
    console.log(`[Scraper] [5/5] Common Crawl content rejected: ${validation.reason}`);
  } else {
    console.log(`[Scraper] [5/5] Common Crawl failed: ${cc.error}`);
  }

  // ── All strategies exhausted ──
  const finalReason = directReason || 'all_sources_failed';
  const httpStatus = transport.status;

  console.log(`[Scraper] ❌ All 5 strategies exhausted for ${url}: ${finalReason}`);
  return makeResult(
    finalReason.includes('gone') || finalReason === 'soft_404' ? 'invalid' : 'unavailable',
    transport.finalUrl || url,
    finalReason,
    httpStatus,
    MAX_RETRIES + 5,
    'none',
  );
}

/**
 * Builds a ScrapeResult.
 */
function makeResult(
  status: ScrapeStatus,
  finalUrl: string,
  reason: string,
  httpStatus: number,
  attempts: number,
  source: string,
): ScrapeResult {
  return {
    status,
    text: '',
    hash: '',
    finalUrl,
    reason,
    httpStatus,
    attempts,
    source,
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
