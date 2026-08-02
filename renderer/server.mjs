/**
 * PolicyWatcher Renderer - headless-browser fetch service
 * ========================================================
 *
 * Companion service for src/lib/scraper.ts (strategy 3: rendered fetch).
 * Runs on a VPS where Chromium is available; Hostinger shared hosting
 * calls it over HTTPS with a bearer secret.
 *
 *   POST /render   { "url": "https://..." }
 *     → 200 { html, finalUrl, status }
 *     → 4xx/5xx { error }
 *   GET /healthz   → 200 { ok: true }
 *
 * Design notes:
 *   - Browser requests are validated against the same private/internal
 *     address policy used by the app. Chromium still owns its sockets, so
 *     this is request-boundary validation rather than app-side DNS pinning.
 *   - Heavy resources (images, media, fonts) are aborted: we only need
 *     the DOM text, and this cuts render time and bandwidth sharply.
 *   - One shared Chromium instance, one fresh context per request
 *     (no cookie/session bleed between renders), small concurrency cap.
 *
 * Uses Playwright plus a Public Suffix List parser for redirect coherence.
 */

import { createServer } from 'http';
import { lookup } from 'dns/promises';
import { realpathSync } from 'fs';
import { isIP } from 'net';
import { randomUUID, timingSafeEqual } from 'crypto';
import { fileURLToPath, pathToFileURL } from 'url';
import { chromium } from 'playwright';
import { getDomain } from 'tldts';

function boundedInteger(rawValue, fallback, minimum, maximum) {
  const parsed = Number(rawValue);
  return Number.isInteger(parsed) && parsed >= minimum && parsed <= maximum ? parsed : fallback;
}

const PORT = boundedInteger(process.env.PORT, 8787, 1, 65_535);
const PRIMARY_SECRET = process.env.RENDERER_SECRET?.trim() || '';
const PREVIOUS_SECRET = process.env.RENDERER_SECRET_PREVIOUS?.trim() || '';
const AUTH_SECRETS = [...new Set([PRIMARY_SECRET, PREVIOUS_SECRET].filter(Boolean))];
const NAV_TIMEOUT_MS = boundedInteger(process.env.NAV_TIMEOUT_MS, 45_000, 5_000, 90_000);
const TOTAL_TIMEOUT_MS = boundedInteger(process.env.RENDER_TOTAL_TIMEOUT_MS, 70_000, 10_000, 120_000);
const MAX_CONCURRENCY = boundedInteger(process.env.MAX_CONCURRENCY, 3, 1, 12);
const MAX_HTML_BYTES = boundedInteger(process.env.MAX_HTML_BYTES, 5_000_000, 100_000, 10_000_000);
const MAX_BODY_BYTES = boundedInteger(process.env.MAX_BODY_BYTES, 16_384, 1_024, 65_536);
const ALLOW_HTTP_TARGETS = process.env.RENDERER_ALLOW_HTTP === 'true';
function isMainModule() {
  if (!process.argv[1]) return false;
  try {
    return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1]);
  } catch {
    return import.meta.url === pathToFileURL(process.argv[1]).href;
  }
}
const IS_MAIN_MODULE = isMainModule();

export function parseUserAgentOverride(rawValue) {
  const value = rawValue?.trim() || '';
  if (!value) return { ok: true, value: null };
  if (value.length > 512 || /[\u0000-\u001f\u007f]/.test(value)) {
    return { ok: false, value: null, reason: 'RENDER_USER_AGENT must be a single printable line of at most 512 characters.' };
  }
  return { ok: true, value };
}

const USER_AGENT_CONFIGURATION = parseUserAgentOverride(process.env.RENDER_USER_AGENT);
const USER_AGENT_OVERRIDE = USER_AGENT_CONFIGURATION.value;
const STARTED_AT = new Date();
const SERVICE_VERSION = '1.2.0';

export function parseAllowedDomains(rawValue) {
  if (!rawValue?.trim()) return [];
  return [...new Set(rawValue.split(',').map((value) => value.trim().toLowerCase().replace(/\.$/, '')).filter((value) => {
    if (!value || value.includes('*') || value.includes('/') || value.includes(':')) return false;
    const domain = getDomain(value, { allowPrivateDomains: true });
    return Boolean(domain && domain === value);
  }))];
}

const TARGET_ALLOWED_DOMAINS = parseAllowedDomains(process.env.RENDERER_ALLOWED_DOMAINS);
const SUBRESOURCE_ALLOWED_DOMAINS = parseAllowedDomains(process.env.RENDERER_SUBRESOURCE_ALLOWED_DOMAINS);

if (IS_MAIN_MODULE) {
  const configurationErrors = [];
  if (PRIMARY_SECRET.length < 32) configurationErrors.push('RENDERER_SECRET must contain at least 32 characters.');
  if (PREVIOUS_SECRET && PREVIOUS_SECRET.length < 32) configurationErrors.push('RENDERER_SECRET_PREVIOUS must contain at least 32 characters when configured.');
  if (PREVIOUS_SECRET && PREVIOUS_SECRET === PRIMARY_SECRET) configurationErrors.push('RENDERER_SECRET_PREVIOUS must differ from RENDERER_SECRET.');
  if (TARGET_ALLOWED_DOMAINS.length === 0) configurationErrors.push('RENDERER_ALLOWED_DOMAINS must contain at least one registrable domain.');
  if (!USER_AGENT_CONFIGURATION.ok) configurationErrors.push(USER_AGENT_CONFIGURATION.reason);
  if (configurationErrors.length > 0) {
    for (const error of configurationErrors) console.error(`[Renderer] Configuration error: ${error}`);
    process.exit(1);
  }
}

export function secureStringEqual(left, right) {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));
  if (leftBuffer.length !== rightBuffer.length) {
    const length = Math.max(leftBuffer.length, rightBuffer.length, 1);
    timingSafeEqual(Buffer.alloc(length), Buffer.alloc(length));
    return false;
  }
  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function isAuthorizedWithSecrets(authHeader, secrets) {
  let match = false;
  for (const secret of secrets.length > 0 ? secrets : ['']) {
    match = secureStringEqual(authHeader || '', `Bearer ${secret}`) || match;
  }
  return match && secrets.length > 0;
}

export function isAuthorizedRequest(authHeader) {
  return isAuthorizedWithSecrets(authHeader, AUTH_SECRETS);
}

/* ---------------- SSRF guard (mirrors src/lib/scraper.ts) ---------------- */

function isPrivateIpv4(address) {
  const parts = address.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => !Number.isInteger(p) || p < 0 || p > 255)) return true;
  const [a, b] = parts;
  return (
    a === 0 || a === 10 || a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function normalizeIpInput(address) {
  const withoutBrackets = address.startsWith('[') && address.endsWith(']')
    ? address.slice(1, -1)
    : address;
  return withoutBrackets.split('%')[0].toLowerCase();
}

function expandIpv6(address) {
  const n = normalizeIpInput(address);
  if (n.includes('.')) return null;

  const doubleColonParts = n.split('::');
  if (doubleColonParts.length > 2) return null;

  const parseSide = (side) => side ? side.split(':').filter(Boolean) : [];
  const left = parseSide(doubleColonParts[0]);
  const right = doubleColonParts.length === 2 ? parseSide(doubleColonParts[1]) : [];
  const all = [...left, ...right];

  if (all.some((part) => !/^[0-9a-f]{1,4}$/.test(part))) return null;

  if (doubleColonParts.length === 1) {
    return left.length === 8 ? left.map((part) => part.padStart(4, '0')) : null;
  }

  const missing = 8 - left.length - right.length;
  if (missing < 1) return null;

  return [
    ...left.map((part) => part.padStart(4, '0')),
    ...Array.from({ length: missing }, () => '0000'),
    ...right.map((part) => part.padStart(4, '0')),
  ];
}

function isPrivateIpv6(address) {
  const n = normalizeIpInput(address);
  if (n.startsWith('::ffff:')) return isPrivateIpv4(n.replace('::ffff:', ''));

  const parts = expandIpv6(n);
  if (!parts) return true;

  const first = parseInt(parts[0], 16);
  const second = parseInt(parts[1], 16);
  const isUnspecified = parts.every((part) => part === '0000');
  const isLoopback = parts.slice(0, 7).every((part) => part === '0000') && parts[7] === '0001';

  if (isUnspecified || isLoopback) return true;
  if (first < 0x2000 || first > 0x3fff) return true;
  if (first === 0x2001 && (second <= 0x0010 || second === 0x0db8)) return true;
  if (first === 0x2002) return true;

  return false;
}

function isPrivateAddress(address) {
  const normalized = normalizeIpInput(address);
  const v = isIP(normalized);
  if (v === 4) return isPrivateIpv4(normalized);
  if (v === 6) return isPrivateIpv6(normalized);
  return true;
}

export function isCoherentHost(originalHost, nextHost) {
  const orig = originalHost.toLowerCase();
  const next = nextHost.toLowerCase();
  if (orig === next) return true;
  const origDomain = getDomain(orig, { allowPrivateDomains: true });
  const nextDomain = getDomain(next, { allowPrivateDomains: true });
  if (!origDomain || !nextDomain) return false;

  return origDomain === nextDomain;
}

export function isAllowedEgressHost(rawHost, allowedDomains = TARGET_ALLOWED_DOMAINS) {
  const host = rawHost.toLowerCase().replace(/\.$/, '');
  return allowedDomains.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

export function sanitizeTargetForLog(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    const path = parsed.pathname.length > 180 ? `${parsed.pathname.slice(0, 177)}...` : parsed.pathname;
    return `${parsed.protocol}//${parsed.host}${path}`;
  } catch {
    return 'invalid-target';
  }
}

export async function validateTargetUrl(rawUrl, options = {}) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { ok: false, reason: 'malformed_url' };
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) return { ok: false, reason: 'invalid_url_scheme' };
  const allowHttp = options.allowHttp ?? ALLOW_HTTP_TARGETS;
  if (!allowHttp && parsed.protocol !== 'https:') return { ok: false, reason: 'https_required' };
  if (parsed.username || parsed.password) return { ok: false, reason: 'blocked_url_credentials' };
  const host = parsed.hostname.toLowerCase().replace(/\.$/, '');
  if (host === 'localhost' || host.endsWith('.localhost')) return { ok: false, reason: 'blocked_private_hostname' };
  const allowedDomains = options.allowedDomains ?? TARGET_ALLOWED_DOMAINS;
  if (options.enforceAllowlist !== false && !isAllowedEgressHost(host, allowedDomains)) {
    return { ok: false, reason: 'blocked_unlisted_domain' };
  }
  const normalizedHostIp = normalizeIpInput(parsed.hostname);
  if (isIP(normalizedHostIp)) {
    return isPrivateAddress(normalizedHostIp) ? { ok: false, reason: 'blocked_private_address' } : { ok: true };
  }
  try {
    const lookupFn = options.lookupFn ?? lookup;
    const addresses = await lookupFn(parsed.hostname, { all: true, verbatim: false });
    if (addresses.some((entry) => isPrivateAddress(entry.address))) {
      return { ok: false, reason: 'blocked_private_address' };
    }
  } catch {
    return { ok: false, reason: 'dns_lookup_failed' };
  }
  return { ok: true };
}

export async function validateBrowserRequestUrl(rawUrl, originalHost) {
  const validation = await validateTargetUrl(rawUrl, {
    allowedDomains: [...TARGET_ALLOWED_DOMAINS, ...SUBRESOURCE_ALLOWED_DOMAINS],
  });
  if (!validation.ok) return validation;
  const requestedHost = new URL(rawUrl).hostname;
  if (isCoherentHost(originalHost, requestedHost) || isAllowedEgressHost(requestedHost, SUBRESOURCE_ALLOWED_DOMAINS)) {
    return { ok: true };
  }
  return { ok: false, reason: 'blocked_cross_site_subresource' };
}

/* ---------------- Rendering ---------------- */

let browserPromise = null;

export function buildBrowserContextOptions(userAgentOverride = USER_AGENT_OVERRIDE) {
  return {
    ...(userAgentOverride ? { userAgent: userAgentOverride } : {}),
    locale: 'en-US',
    viewport: { width: 1366, height: 900 },
    ignoreHTTPSErrors: false,
  };
}

async function getBrowser() {
  if (!browserPromise) {
    browserPromise = chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    });
    const browser = await browserPromise;
    browser.on('disconnected', () => {
      // Chromium crashed or was killed: relaunch lazily on the next request.
      browserPromise = null;
    });
  }
  return browserPromise;
}

let active = 0;
let accepting = true;

async function renderPage(url) {
  const browser = await getBrowser();
  const context = await browser.newContext(buildBrowserContextOptions());

  try {
    const page = await context.newPage();
    let totalTimedOut = false;
    const totalTimeout = setTimeout(() => {
      totalTimedOut = true;
      void page.close().catch(() => {});
    }, TOTAL_TIMEOUT_MS);

    try {
      // Skip heavy resources: only the DOM text matters for policy diffing.
      await page.route('**/*', (route) => {
        const type = route.request().resourceType();
        if (type === 'image' || type === 'media' || type === 'font') return route.abort();
        return validateBrowserRequestUrl(route.request().url(), new URL(url).hostname)
          .then((validation) => {
            if (!validation.ok) {
              console.warn(`[Renderer] Blocked browser request (${validation.reason}).`);
              return route.abort();
            }
            return route.continue();
          })
          .catch(() => {
            console.warn('[Renderer] Browser request validation failed.');
            return route.abort();
          });
      });

      let response;
      try {
        response = await page.goto(url, {
          waitUntil: 'domcontentloaded',
          timeout: NAV_TIMEOUT_MS,
        });
      } catch (error) {
        if (totalTimedOut) throw new Error('renderer_total_timeout');
        throw error;
      }

      // Give SPAs time to hydrate; tolerate pages that never go network-idle.
      await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
      await page.waitForTimeout(1_000);

      const finalUrl = page.url();
      const finalValidation = await validateTargetUrl(finalUrl);
      if (!finalValidation.ok) {
        throw new Error(`blocked_final_url:${finalValidation.reason}`);
      }
      if (!isCoherentHost(new URL(url).hostname, new URL(finalUrl).hostname)) {
        throw new Error('blocked_final_url:blocked_incoherent_host_drift');
      }

      const html = await page.content();
      if (Buffer.byteLength(html) > MAX_HTML_BYTES) throw new Error('render_output_too_large');
      return {
        html,
        finalUrl,
        status: response ? response.status() : 0,
      };
    } finally {
      clearTimeout(totalTimeout);
    }
  } finally {
    await context.close().catch(() => {});
  }
}

/* ---------------- HTTP server ---------------- */

function send(res, code, body, requestId) {
  const payload = JSON.stringify(body);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    'Cache-Control': 'no-store, max-age=0',
    'X-Content-Type-Options': 'nosniff',
    ...(requestId ? { 'X-Request-ID': requestId } : {}),
  });
  res.end(payload);
}

function readBody(req, limit = MAX_BODY_BYTES) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error('body_too_large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

const server = createServer(async (req, res) => {
  const requestId = randomUUID();
  if (req.method === 'GET' && req.url === '/healthz') {
    return send(res, 200, {
      ok: true,
      service: 'policywatcher-renderer',
      version: SERVICE_VERSION,
    }, requestId);
  }

  if (req.method === 'GET' && req.url === '/readyz') {
    if (!isAuthorizedRequest(req.headers.authorization || '')) return send(res, 401, { error: 'unauthorized' }, requestId);
    if (!accepting) return send(res, 503, { ok: false, state: 'draining' }, requestId);
    try {
      const browser = await getBrowser();
      return send(res, browser.isConnected() ? 200 : 503, {
        ok: browser.isConnected(),
        service: 'policywatcher-renderer',
        version: SERVICE_VERSION,
        state: browser.isConnected() ? 'ready' : 'browser_unavailable',
        active,
        capacity: MAX_CONCURRENCY,
        secretRotation: PREVIOUS_SECRET ? 'overlap-active' : 'single-active',
        targetAllowlistCount: TARGET_ALLOWED_DOMAINS.length,
        subresourceAllowlistCount: SUBRESOURCE_ALLOWED_DOMAINS.length,
        browserVersionMajor: browser.version().split('.')[0] || 'unknown',
        userAgentMode: USER_AGENT_OVERRIDE ? 'operator-override' : 'browser-default',
        uptimeSeconds: Math.round((Date.now() - STARTED_AT.getTime()) / 1000),
      }, requestId);
    } catch {
      return send(res, 503, { ok: false, state: 'browser_unavailable' }, requestId);
    }
  }

  if (req.method !== 'POST' || req.url !== '/render') {
    return send(res, 404, { error: 'not_found' }, requestId);
  }

  const auth = req.headers.authorization || '';
  if (!isAuthorizedRequest(auth)) {
    return send(res, 401, { error: 'unauthorized' }, requestId);
  }

  if (!accepting) {
    return send(res, 503, { error: 'renderer_draining' }, requestId);
  }

  if (active >= MAX_CONCURRENCY) {
    res.setHeader('Retry-After', '5');
    return send(res, 429, { error: 'renderer_busy' }, requestId);
  }

  let url;
  try {
    const body = JSON.parse(await readBody(req));
    url = body?.url;
  } catch {
    return send(res, 400, { error: 'invalid_json' }, requestId);
  }
  if (typeof url !== 'string' || !url) {
    return send(res, 400, { error: 'url_required' }, requestId);
  }

  const validation = await validateTargetUrl(url);
  if (!validation.ok) {
    let cleanValErr = 'render_failed';
    if (validation.reason === 'blocked_private_hostname' || validation.reason === 'blocked_private_address') {
      cleanValErr = 'blocked_private_ip';
    } else if (validation.reason === 'blocked_url_credentials') {
      cleanValErr = 'blocked_credentials';
    } else if (validation.reason === 'dns_lookup_failed') {
      cleanValErr = 'dns_lookup_failed';
    } else if (validation.reason === 'blocked_unlisted_domain') {
      cleanValErr = 'domain_not_allowed';
    } else if (validation.reason === 'https_required') {
      cleanValErr = 'https_required';
    }
    return send(res, 400, { error: cleanValErr }, requestId);
  }

  active++;
  const started = Date.now();
  const safeTarget = sanitizeTargetForLog(url);
  try {
    const result = await renderPage(url);
    console.log(`[Renderer] OK ${requestId} ${safeTarget} -> ${result.status} (${result.html.length} bytes, ${Date.now() - started}ms)`);
    return send(res, 200, result, requestId);
  } catch (err) {
    const msg = err.message || String(err);
    console.error(`[Renderer] FAIL ${requestId} ${safeTarget}: ${err.name || 'Error'} ${msg.split('\n')[0].slice(0, 180)}`);

    let cleanError = 'render_failed';
    if (msg.startsWith('blocked_final_url:')) {
      const subReason = msg.split(':')[1] || '';
      if (subReason === 'blocked_private_hostname' || subReason === 'blocked_private_address') {
        cleanError = 'blocked_private_ip';
      } else {
        cleanError = 'blocked_final_url';
      }
    } else if (msg.includes('dns_lookup_failed')) {
      cleanError = 'dns_lookup_failed';
    } else if (msg.includes('timeout') || msg.includes('Timeout')) {
      cleanError = 'renderer_timeout';
    } else if (msg.includes('render_output_too_large')) {
      cleanError = 'render_output_too_large';
    }

    return send(res, 502, { error: cleanError }, requestId);
  } finally {
    active--;
  }
});

if (IS_MAIN_MODULE) {
  server.listen(PORT, () => {
    console.log(
      `[Renderer] Listening on :${PORT} (v${SERVICE_VERSION}, concurrency ${MAX_CONCURRENCY}, ` +
      `nav timeout ${NAV_TIMEOUT_MS}ms, user agent ${USER_AGENT_OVERRIDE ? 'operator override' : 'Chromium default'})`
    );
  });

  process.on('SIGTERM', async () => {
    accepting = false;
    server.close();
    if (browserPromise) {
      const browser = await browserPromise.catch(() => null);
      await browser?.close().catch(() => {});
    }
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    accepting = false;
    server.close();
    if (browserPromise) {
      const browser = await browserPromise.catch(() => null);
      await browser?.close().catch(() => {});
    }
    process.exit(0);
  });
}
