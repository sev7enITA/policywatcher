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
import { timingSafeEqual } from 'crypto';
import { fileURLToPath, pathToFileURL } from 'url';
import { chromium } from 'playwright';
import { getDomain } from 'tldts';

const PORT = Number(process.env.PORT || 8787);
const SECRET = process.env.RENDERER_SECRET || '';
const NAV_TIMEOUT_MS = Number(process.env.NAV_TIMEOUT_MS || 45_000);
const MAX_CONCURRENCY = Number(process.env.MAX_CONCURRENCY || 3);
function isMainModule() {
  if (!process.argv[1]) return false;
  try {
    return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1]);
  } catch {
    return import.meta.url === pathToFileURL(process.argv[1]).href;
  }
}
const IS_MAIN_MODULE = isMainModule();
const USER_AGENT =
  process.env.RENDER_USER_AGENT ||
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const STARTED_AT = new Date();
const SERVICE_VERSION = '3.5.1';

if (!SECRET && IS_MAIN_MODULE) {
  console.error('RENDERER_SECRET is required. Refusing to start an open renderer.');
  process.exit(1);
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

export function isAuthorizedRequest(authHeader) {
  return secureStringEqual(authHeader || '', `Bearer ${SECRET}`);
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

export async function validateTargetUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { ok: false, reason: 'malformed_url' };
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) return { ok: false, reason: 'invalid_url_scheme' };
  if (parsed.username || parsed.password) return { ok: false, reason: 'blocked_url_credentials' };
  const host = parsed.hostname.toLowerCase().replace(/\.$/, '');
  if (host === 'localhost' || host.endsWith('.localhost')) return { ok: false, reason: 'blocked_private_hostname' };
  const normalizedHostIp = normalizeIpInput(parsed.hostname);
  if (isIP(normalizedHostIp)) {
    return isPrivateAddress(normalizedHostIp) ? { ok: false, reason: 'blocked_private_address' } : { ok: true };
  }
  try {
    const addresses = await lookup(parsed.hostname, { all: true, verbatim: false });
    if (addresses.some((entry) => isPrivateAddress(entry.address))) {
      return { ok: false, reason: 'blocked_private_address' };
    }
  } catch {
    return { ok: false, reason: 'dns_lookup_failed' };
  }
  return { ok: true };
}

export async function validateBrowserRequestUrl(rawUrl) {
  return validateTargetUrl(rawUrl);
}

/* ---------------- Rendering ---------------- */

let browserPromise = null;

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

async function renderPage(url) {
  const browser = await getBrowser();
  const context = await browser.newContext({
    userAgent: USER_AGENT,
    locale: 'en-US',
    viewport: { width: 1366, height: 900 },
    ignoreHTTPSErrors: false,
  });

  try {
    const page = await context.newPage();

    // Skip heavy resources: only the DOM text matters for policy diffing.
    await page.route('**/*', (route) => {
      const type = route.request().resourceType();
      if (type === 'image' || type === 'media' || type === 'font') return route.abort();
      return validateBrowserRequestUrl(route.request().url())
        .then((validation) => {
          if (!validation.ok) {
            console.warn(`[Renderer] Blocked request ${route.request().url()}: ${validation.reason}`);
            return route.abort();
          }
          return route.continue();
        })
        .catch((err) => {
          console.warn(`[Renderer] Failed request validation ${route.request().url()}: ${err.message}`);
          return route.abort();
        });
    });

    const response = await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: NAV_TIMEOUT_MS,
    });

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
    return {
      html,
      finalUrl,
      status: response ? response.status() : 0,
    };
  } finally {
    await context.close().catch(() => {});
  }
}

/* ---------------- HTTP server ---------------- */

function send(res, code, body) {
  const payload = JSON.stringify(body);
  res.writeHead(code, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) });
  res.end(payload);
}

function readBody(req, limit = 16_384) {
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
  if (req.method === 'GET' && req.url === '/healthz') {
    return send(res, 200, {
      ok: true,
      service: 'policywatcher-renderer',
      version: SERVICE_VERSION,
      active,
      maxConcurrency: MAX_CONCURRENCY,
      navTimeoutMs: NAV_TIMEOUT_MS,
      uptimeSeconds: Math.round((Date.now() - STARTED_AT.getTime()) / 1000),
      nodeVersion: process.version,
    });
  }

  if (req.method !== 'POST' || req.url !== '/render') {
    return send(res, 404, { error: 'not_found' });
  }

  const auth = req.headers.authorization || '';
  if (!isAuthorizedRequest(auth)) {
    return send(res, 401, { error: 'unauthorized' });
  }

  if (active >= MAX_CONCURRENCY) {
    return send(res, 429, { error: 'renderer_busy' });
  }

  let url;
  try {
    const body = JSON.parse(await readBody(req));
    url = body?.url;
  } catch {
    return send(res, 400, { error: 'invalid_json' });
  }
  if (typeof url !== 'string' || !url) {
    return send(res, 400, { error: 'url_required' });
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
    }
    return send(res, 400, { error: cleanValErr });
  }

  active++;
  const started = Date.now();
  try {
    const result = await renderPage(url);
    console.log(`[Renderer] OK ${url} → ${result.status} (${result.html.length} bytes, ${Date.now() - started}ms)`);
    return send(res, 200, result);
  } catch (err) {
    const msg = err.message || String(err);
    console.error(`[Renderer] FAIL ${url}:`, err);

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
    }

    return send(res, 502, { error: cleanError });
  } finally {
    active--;
  }
});

if (IS_MAIN_MODULE) {
  server.listen(PORT, () => {
    console.log(`[Renderer] Listening on :${PORT} (concurrency ${MAX_CONCURRENCY}, nav timeout ${NAV_TIMEOUT_MS}ms)`);
  });

  process.on('SIGTERM', async () => {
    server.close();
    if (browserPromise) {
      const browser = await browserPromise.catch(() => null);
      await browser?.close().catch(() => {});
    }
    process.exit(0);
  });
}
