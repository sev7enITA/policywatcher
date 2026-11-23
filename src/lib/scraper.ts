import { extractionEvidence } from './extractionProfile';
import * as cheerio from 'cheerio';
import type { AnyNode, Element } from 'domhandler';
import { lookup } from 'dns/promises';
import { isIP } from 'net';
import { connect } from 'http2';
import { brotliDecompress, gunzip, inflate } from 'zlib';
import { promisify } from 'node:util';
import https from 'https';
import http from 'http';
import tls from 'tls';
import { getDomain } from 'tldts';
import { extractPdfPolicyHtml } from '@/lib/pdfPolicy';
import { classifyRetrievalCause, terminalRetrievalCause, type RetrievalCause } from '@/lib/sourceReliability';
import { acquisitionOutcome, type AcquisitionOutcome } from './adaptiveAcquisition/outcome';
import { createCapture, type RawCapture, type CaptureTransport } from './adaptiveAcquisition/evidence';
import { hasExplicitLocaleDrift } from './acquisitionScope';

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
 *   3. Adaptive fallback cascade (5 strategies):
 *        a. Direct fetch with realistic browser fingerprint
 *        b. HTTP/2-only fetch (fixes Meta 400 errors)
 *        c. Rendered fetch via external Playwright service on the VPS
 *           (executes JavaScript: recovers SPA / bot-protected pages)
 *        d. Wayback Machine (web.archive.org) cached version
 *        e. Common Crawl archive
 *   4. Archive freshness guard: Wayback / Common Crawl snapshots older
 *      than `archiveNotBefore` (the policy's last successful check) are
 *      REJECTED. Without this, a temporary block on the live site would
 *      resurrect an old archived version and register it as a "change".
 *   5. Polite crawling: random delays between requests (1-3s) to
 *      avoid triggering rate-limiting / CAPTCHA.
 *   6. Deterministic result shape (ScrapeResult) so callers can branch
 *      cleanly without guessing.
 *
 * NOTE: the rendered-fetch strategy requires the companion service in
 * renderer/ deployed on a VPS (Hostinger shared hosting cannot run
 * Chromium). Configure RENDERER_URL + RENDERER_SECRET; when unset the
 * strategy is skipped and the cascade continues with the archives.
 */

export type ScrapeStatus = 'ok' | 'unavailable' | 'invalid';

export interface ScrapeResult {
  /** Independent acquisition dimensions, not a confirmed change or confidence score. */
  outcome?: AcquisitionOutcome;
  /** Present only when the caller requested private capture of extractor input. */
  rawCaptureSummary?: { attempted: number; recorded: number; failed: number };
  /** Private extractor input; never include in API responses. */
  extraction?: ReturnType<typeof extractionEvidence>;
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
  /** Stable terminal category for metrics and remediation routing. */
  reasonCode?: RetrievalCause;
  /** HTTP status code observed (0 if transport failed entirely). */
  httpStatus: number;
  /** Number of attempts made. */
  attempts: number;
  /** Which source provided the data: 'direct', 'http2', 'rendered', 'wayback', 'commoncrawl'. */
  source: string;
  /**
   * ISO timestamp of the archived snapshot, present only when the data
   * came from an archive ('wayback' | 'commoncrawl'). Lets callers show
   * users exactly how old the recovered copy is.
   */
  archiveTimestamp?: string;
  /** True when the scraper could only capture/store an incomplete text. */
  partial?: boolean;
  /** Machine-readable partial reason, e.g. text_truncated_at_max_length. */
  partialReason?: string;
  /** Original extracted text length before applying the storage cap. */
  originalTextLength?: number;
  /** Ordered fallback diagnostics for admin/runtime observability. */
  diagnostics?: ScrapeDiagnostic[];
  /** Dated archive metadata that is explicitly ineligible for change detection. */
  historicalReference?: {
    source: 'wayback' | 'commoncrawl';
    capturedAt: string;
    referenceUrl?: string;
  };
}

export interface ScrapeDiagnostic {
  source: string;
  status: 'ok' | 'partial' | 'failed' | 'skipped' | 'rejected';
  reason?: string;
  httpStatus?: number;
  finalUrl?: string;
  durationMs?: number;
  cause?: RetrievalCause;
}

export interface DiscoveryDocumentResult {
  status: ScrapeStatus;
  content: string;
  finalUrl: string;
  reason: string;
  httpStatus: number;
  source: string;
  diagnostics: ScrapeDiagnostic[];
}

/* ---------------------------------------------------------------
   Configuration
   --------------------------------------------------------------- */

const FETCH_TIMEOUT_MS = 20_000;
const MAX_RETRIES = 2; // total attempts = 1 + MAX_RETRIES = 3
const MAX_REDIRECTS = 5;
const BACKOFF_BASE_MS = 800;
const MIN_TEXT_LENGTH = 800; // a real policy page has way more than this
const MAX_TEXT_LENGTH = 500_000; // hard cap to avoid storing junk payloads
export const MAX_NETWORK_RESPONSE_BYTES = 5_000_000;
export const MAX_DECOMPRESSED_HTML_BYTES = 5_000_000;

const gunzipAsync = promisify(gunzip);
const inflateAsync = promisify(inflate);
const brotliDecompressAsync = promisify(brotliDecompress);

function responseLength(headers: http.IncomingHttpHeaders): number | null {
  if (Array.isArray(headers['content-length']) && headers['content-length'].length !== 1) return null;
  const raw = Array.isArray(headers['content-length'])
    ? headers['content-length'][0]
    : headers['content-length'];
  if (!raw || !/^\d+$/.test(raw)) return null;
  const parsed = Number(raw);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
}

export async function decodeBoundedResponseBody(
  buffer: Buffer,
  contentEncoding: string,
  maxOutputLength = MAX_DECOMPRESSED_HTML_BYTES,
): Promise<string> {
  return (await decodeBoundedResponseBytes(buffer, contentEncoding, maxOutputLength)).toString('utf8');
}

async function decodeBoundedResponseBytes(
  buffer: Buffer,
  contentEncoding: string,
  maxOutputLength = MAX_DECOMPRESSED_HTML_BYTES,
): Promise<Buffer> {
  if (buffer.byteLength > MAX_NETWORK_RESPONSE_BYTES) {
    throw new Error('response_body_too_large');
  }
  try {
    const encoding = contentEncoding.trim().toLowerCase();
    if (!['', 'identity', 'gzip', 'deflate', 'br'].includes(encoding)) throw new Error('unsupported_content_encoding');
    const decoded = encoding === 'gzip'
      ? await gunzipAsync(buffer, { maxOutputLength })
      : encoding === 'deflate'
        ? await inflateAsync(buffer, { maxOutputLength })
        : encoding === 'br'
          ? await brotliDecompressAsync(buffer, { maxOutputLength })
          : buffer;
    if (decoded.byteLength > maxOutputLength) throw new Error('decompressed_body_too_large');
    return decoded;
  } catch (error) {
    if (
      error instanceof RangeError
      || (error as { code?: unknown } | null)?.code === 'ERR_BUFFER_TOO_LARGE'
    ) {
      throw new Error('decompressed_body_too_large');
    }
    throw error;
  }
}

export async function decodeBoundedDocumentBody(buffer: Buffer, encoding: string, contentType: string): Promise<string> {
  const bytes = await decodeBoundedResponseBytes(buffer, encoding);
  // A signature is required even when an official CDN labels a PDF as binary.
  const isPdf = bytes.subarray(0, 5).toString('ascii') === '%PDF-';
  if (isPdf || /^application\/pdf\b/i.test(contentType)) return extractPdfPolicyHtml(bytes);
  if (/^(application\/octet-stream|image\/|video\/|audio\/)/i.test(contentType)) {
    throw new Error(`unsupported_content_type:${contentType.split(';')[0]}`);
  }
  return bytes.toString('utf8');
}

export interface TransportProof {
  schemaVersion: 1;
  scope: 'origin_response' | 'archive_response' | 'renderer_api_response';
  protocol: 'http1' | 'http2' | 'fetch';
  byteRepresentation: 'encoded' | 'decoded';
  declaredContentLength: number | null;
  receivedBytes: number;
  streamEnd: 'observed' | 'not_observed';
  framing: 'complete' | 'incomplete' | 'unknown';
  lengthCheck: 'matched' | 'mismatch' | 'not_declared' | 'not_comparable';
  decoding: 'completed' | 'failed' | 'not_applied';
  /** Framing and byte parity do not establish source or legal-document completeness. */
  entityCompleteness: 'not_proven';
}

export class TransportIntegrityError extends Error {
  constructor(message: string, public readonly transportProof: TransportProof, public readonly httpStatus = 0) {
    super(message);
    this.name = 'TransportIntegrityError';
  }
}

function makeTransportProof(protocol: TransportProof['protocol'], declared: number | null,
  receivedBytes: number, streamEnd: boolean, framing: TransportProof['framing'],
  decoding: TransportProof['decoding'] = 'not_applied', comparable = true,
  scope: TransportProof['scope'] = 'origin_response'): TransportProof {
  return { schemaVersion: 1, scope, protocol, byteRepresentation: protocol === 'fetch' ? 'decoded' : 'encoded',
    declaredContentLength: declared, receivedBytes, streamEnd: streamEnd ? 'observed' : 'not_observed', framing,
    lengthCheck: !comparable || !streamEnd ? 'not_comparable' : declared === null ? 'not_declared'
      : declared === receivedBytes ? 'matched' : 'mismatch', decoding, entityCompleteness: 'not_proven' };
}

interface FetchBodyOptions {
  scope?: TransportProof['scope'];
  /** Only for an explicitly requested, bounded whole WARC record; not a policy-document range. */
  expectedByteRange?: { start: number; end: number };
}

export async function readBoundedFetchBodyWithProof(
  response: Response,
  maxBytes = MAX_NETWORK_RESPONSE_BYTES,
  options: FetchBodyOptions = {},
): Promise<{ body: Buffer; transportProof: TransportProof }> {
  const rawLength = response.headers.get('content-length');
  const declaredLength = responseLength({ 'content-length': rawLength ?? undefined });
  const encoded = Boolean(response.headers.get('content-encoding')?.trim()
    && response.headers.get('content-encoding')?.trim().toLowerCase() !== 'identity');
  const bodyless = [204, 304].includes(response.status);
  const comparable = !encoded && !bodyless;
  let receivedBytes = 0;
  let ended = false;
  const proof = (framing: TransportProof['framing'], decoding: TransportProof['decoding'] = 'not_applied') =>
    makeTransportProof('fetch', declaredLength, receivedBytes, ended, framing, decoding, comparable,
      options.scope ?? 'origin_response');
  const fail = (token: string) => new TransportIntegrityError(token, proof('incomplete'), response.status);
  const rejectBody = async (token: string): Promise<never> => {
    await response.body?.cancel(token).catch(() => undefined);
    throw fail(token);
  };
  if (rawLength !== null && declaredLength === null) return rejectBody('invalid_content_length');
  if (declaredLength !== null && declaredLength > maxBytes) return rejectBody('response_body_too_large');
  const range = options.expectedByteRange;
  if (range && response.status !== 206) return rejectBody('response_range_not_honored');
  if (response.status === 206) {
    // Common Crawl requests one known WARC record by range. An unsolicited policy range is never accepted.
    const parts = /^bytes (\d+)-(\d+)\/(\d+|\*)$/.exec(response.headers.get('content-range') ?? '');
    if (!range || encoded || !Number.isSafeInteger(range.start) || !Number.isSafeInteger(range.end)
      || range.start < 0 || range.end < range.start || range.end - range.start + 1 > maxBytes
      || !parts || Number(parts[1]) !== range.start || Number(parts[2]) !== range.end
      || (parts[3] !== '*' && (!Number.isSafeInteger(Number(parts[3])) || Number(parts[3]) <= range.end))) {
      return rejectBody('http_206_partial_response');
    }
  }
  if (!response.body) {
    ended = true;
    if (comparable && declaredLength !== null && declaredLength !== 0) throw fail('response_length_mismatch');
    return { body: Buffer.alloc(0), transportProof: proof('unknown') };
  }
  const reader = response.body.getReader();
  const chunks: Buffer[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) { ended = true; break; }
      const chunk = Buffer.from(value);
      receivedBytes += chunk.byteLength;
      if (receivedBytes > maxBytes) {
        await reader.cancel('response_body_too_large').catch(() => undefined);
        throw fail('response_body_too_large');
      }
      chunks.push(chunk);
    }
    if (comparable && declaredLength !== null && declaredLength !== receivedBytes) throw fail('response_length_mismatch');
    if (response.status === 206 && range && receivedBytes !== range.end - range.start + 1) throw fail('response_range_length_mismatch');
  } catch (error) {
    if (error instanceof TransportIntegrityError) throw error;
    throw fail('response_stream_failed');
  } finally {
    reader.releaseLock();
  }
  // Fetch exposes decoded bytes. A stream end is observed, but raw framing/encoded byte parity is unavailable.
  return { body: Buffer.concat(chunks, receivedBytes), transportProof: proof('unknown', 'completed') };
}

export async function readBoundedFetchBody(response: Response, maxBytes = MAX_NETWORK_RESPONSE_BYTES,
  options: FetchBodyOptions = {}): Promise<Buffer> {
  return (await readBoundedFetchBodyWithProof(response, maxBytes, options)).body;
}

// Operators may supply a current, truthful UA without changing code. The
// override deliberately omits Client Hints so they cannot contradict it.
const CONFIGURED_USER_AGENT = process.env.SCRAPER_USER_AGENT?.trim();
const DEFAULT_BROWSER_PROFILES = [
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
const BROWSER_PROFILES = CONFIGURED_USER_AGENT
  ? [{ ua: CONFIGURED_USER_AGENT, secChUa: '', platform: '' }]
  : DEFAULT_BROWSER_PROFILES;

/**
 * Policy content markers - used to verify the page is actually a
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

export function sanitizeLogText(value: unknown, maxLength = 320): string {
  return String(value ?? '')
    .replace(/[\r\n\u2028\u2029]/g, ' ')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

/** Polite delay: random 1-3 seconds between requests. */
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

function normalizeIpInput(address: string): string {
  const withoutBrackets = address.startsWith('[') && address.endsWith(']')
    ? address.slice(1, -1)
    : address;
  return withoutBrackets.split('%')[0].toLowerCase();
}

function expandIpv6(address: string): string[] | null {
  const normalized = normalizeIpInput(address);
  if (normalized.includes('.')) {
    return null;
  }

  const doubleColonParts = normalized.split('::');
  if (doubleColonParts.length > 2) return null;

  const parseSide = (side: string) => side
    ? side.split(':').filter(Boolean)
    : [];

  const left = parseSide(doubleColonParts[0]);
  const right = doubleColonParts.length === 2 ? parseSide(doubleColonParts[1]) : [];

  if ([...left, ...right].some((part) => !/^[0-9a-f]{1,4}$/.test(part))) {
    return null;
  }

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

function isPrivateIpv6(address: string): boolean {
  const normalized = normalizeIpInput(address);
  if (normalized.startsWith('::ffff:')) {
    return isPrivateIpv4(normalized.replace('::ffff:', ''));
  }

  const parts = expandIpv6(normalized);
  if (!parts) return true;

  const first = parseInt(parts[0], 16);
  const second = parseInt(parts[1], 16);
  const isUnspecified = parts.every((part) => part === '0000');
  const isLoopback = parts.slice(0, 7).every((part) => part === '0000') && parts[7] === '0001';

  if (isUnspecified || isLoopback) return true;

  // Conservative outbound policy: permit only global unicast, excluding
  // special-purpose/documentation/transition ranges that can hide local hops.
  if (first < 0x2000 || first > 0x3fff) return true;
  if (first === 0x2001 && (second <= 0x0010 || second === 0x0db8)) return true;
  if (first === 0x2002) return true;

  return false;
}

function isPrivateAddress(address: string): boolean {
  const normalized = normalizeIpInput(address);
  const version = isIP(normalized);
  if (version === 4) return isPrivateIpv4(normalized);
  if (version === 6) return isPrivateIpv6(normalized);
  return true;
}

function isBlockedHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/\.$/, '');
  return normalized === 'localhost' || normalized.endsWith('.localhost');
}

export async function resolveAndPinHostname(hostname: string): Promise<string> {
  if (isBlockedHostname(hostname)) {
    throw new Error('blocked_private_hostname');
  }

  const normalizedIp = normalizeIpInput(hostname);
  if (isIP(normalizedIp)) {
    if (isPrivateAddress(normalizedIp)) {
      throw new Error('blocked_private_ip');
    }
    return normalizedIp;
  }

  let addresses: { address: string; family: number }[];
  try {
    addresses = await lookup(hostname, { all: true, verbatim: false });
  } catch {
    throw new Error('dns_lookup_failed');
  }

  if (addresses.length === 0) {
    throw new Error('dns_lookup_failed');
  }

  if (addresses.some((entry) => isPrivateAddress(entry.address))) {
    throw new Error('blocked_private_ip');
  }

  return addresses[0].address;
}

export async function validateOutboundUrl(rawUrl: string): Promise<{ ok: true; url: string; pinnedIp: string } | { ok: false; reason: string; finalUrl: string }> {
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

  try {
    const pinnedIp = await resolveAndPinHostname(parsed.hostname);
    return { ok: true, url: parsed.toString(), pinnedIp };
  } catch (err) {
    const msg = (err as Error).message;
    const reason = msg === 'blocked_private_ip' ? 'blocked_private_address' : msg;
    return { ok: false, reason, finalUrl: parsed.toString() };
  }
}

/* ---------------------------------------------------------------
   Layer 1: robust transport fetch with retries + backoff
   --------------------------------------------------------------- */

export interface TransportResult {
  /** Bounded transport facts; never proof of semantic/source completeness. */
  transportProof?: TransportProof;
  ok: boolean;
  html: string;
  status: number;
  finalUrl: string;
  error: string;
  /** Whitelisted representation metadata; never cookies or authorization. */
  validators?: { etag?: string; lastModified?: string; vary?: string; cacheControl?: string; contentLanguage?: string; serverDate?: string; age?: string };
  retryAfterMs?: number;
  /** Wayback/CDX timestamp (YYYYMMDDhhmmss) when the HTML came from an archive. */
  archiveTimestamp?: string;
  /** Latest known archive capture rejected by the freshness guard. */
  staleArchiveTimestamp?: string;
  staleArchiveUrl?: string;
}

/** One bounded, pinned request chain. V6 owns retries and per-origin backoff. */
export async function acquireEngineTransport(url: string, kind: 'direct' | 'http2' | 'rendered',
  validators?: { etag?: string; lastModified?: string }): Promise<TransportResult> {
  if (kind === 'http2') return fetchWithHttp2(url);
  if (kind === 'rendered') return rendererConfigured() ? fetchWithRenderer(url)
    : { ok: false, html: '', status: 0, finalUrl: url, error: 'renderer_not_configured' };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    let current = url;
    for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects++) {
      const destination = await validateOutboundUrl(current);
      if (!destination.ok) throw new Error(destination.reason);
      const headers = buildHeaders(BROWSER_PROFILES[0]);
      // Conditional validators are never forwarded across a redirect.
      if (!redirects && validators?.etag) headers['If-None-Match'] = validators.etag;
      else if (!redirects && validators?.lastModified) headers['If-Modified-Since'] = validators.lastModified;
      const res = await requestPinnedHttp(new URL(destination.url), destination.pinnedIp, headers, controller.signal);
      if (res.status >= 300 && res.status < 400 && res.status !== 304 && res.headers.location) {
        current = new URL(res.headers.location, current).toString();
        if (!isCoherentHost(new URL(url).hostname, new URL(current).hostname)) throw new Error('host_drift');
        continue;
      }
      const retry = res.headers['retry-after'];
      const retryAfterMs = retry ? Math.min(86_400_000, Math.max(0, /^\d+$/.test(retry) ? Number(retry) * 1000 : Date.parse(retry) - Date.now())) : undefined;
      return { ok: res.status >= 200 && res.status < 300 && res.status !== 202, html: res.body, status: res.status,
        finalUrl: destination.url, transportProof: res.transportProof, error: res.status === 200 ? '' : `http_${res.status}`,
        retryAfterMs: Number.isFinite(retryAfterMs) ? retryAfterMs : undefined,
        validators: { etag: res.headers.etag, lastModified: res.headers['last-modified'], vary: res.headers.vary,
          cacheControl: res.headers['cache-control'], contentLanguage: res.headers['content-language'], serverDate: res.headers.date, age: res.headers.age } };
    }
    throw new Error('too_many_redirects');
  } finally { clearTimeout(timer); }
}

export interface EngineAttachmentResponse {
  bytes: Buffer; html: string; status: number; finalUrl: string; mediaType: string;
  language?: string; transportProof: TransportProof;
}
/** Private Engine 6 only: one fresh pinned request chain, at most 1 MB decoded.
 * This retains original PDF/entity bytes, distinct from its derived inert HTML.
 */
export async function acquireEngineAttachment(url: string, maximumDecodedBytes = 1_000_000): Promise<EngineAttachmentResponse> {
  if (!Number.isSafeInteger(maximumDecodedBytes) || maximumDecodedBytes < 1 || maximumDecodedBytes > 1_000_000) throw new Error('invalid_attachment_budget');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const destination = await validateOutboundUrl(url);
    if (!destination.ok) throw new Error(destination.reason);
    const res = await requestPinnedHttp(new URL(destination.url), destination.pinnedIp, buildHeaders(BROWSER_PROFILES[0]), controller.signal, true, maximumDecodedBytes);
    // A redirect changes the exact reviewed resource; do not contact its target.
    if (res.status >= 300 && res.status < 400) throw new Error('attachment_redirect_unreviewed');
    if (res.status !== 200 || !res.entityBytes?.length) throw new Error('attachment_response_not_complete');
    return { bytes: res.entityBytes, html: res.body, status: res.status, finalUrl: destination.url,
      mediaType: (res.headers['content-type'] || '').split(';')[0].trim().toLowerCase(),
      language: res.headers['content-language'], transportProof: res.transportProof };
  } finally { clearTimeout(timer); }
}

type TestTransport = (url: string, notBefore?: Date) => Promise<TransportResult>;

export interface ScraperControlledFallbacks {
  /** Test-only deterministic transport substitutes used by fallback smoke tests. */
  direct?: TestTransport;
  http2?: TestTransport;
  rendered?: TestTransport;
  wayback?: TestTransport;
  commoncrawl?: TestTransport;
  skipDelays?: boolean;
}

export interface ScrapePolicyOptions {
  archiveNotBefore?: Date;
  /** Opt-in private corpus sink. Raw bodies never become public scrape results. */
  onRawCapture?: (capture: RawCapture) => Promise<void>;
  /** Refused in production; keeps smoke tests deterministic and offline. */
  controlledFallbacks?: ScraperControlledFallbacks;
}

function enrichDiagnostics(diagnostics: ScrapeDiagnostic[]): ScrapeDiagnostic[] {
  return diagnostics.map((diagnostic) => ({
    ...diagnostic,
    cause: classifyRetrievalCause(diagnostic),
  }));
}

/** Parses a Wayback/CDX timestamp (YYYYMMDDhhmmss, possibly shorter) into a UTC Date. */
export function parseArchiveTimestamp(ts: string): Date | null {
  const m = /^(\d{4})(\d{2})(\d{2})(\d{2})?(\d{2})?(\d{2})?/.exec(ts);
  if (!m) return null;
  const date = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0)));
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Archive freshness guard. A snapshot older than `notBefore` (typically the
 * policy's last successful live check) must be rejected: serving it would
 * resurrect an outdated version and could register a bogus "change" -
 * potentially emailing citizens about a regression to an old text.
 */
export function isFreshEnough(ts: string | undefined, notBefore?: Date): boolean {
  if (!notBefore) return true;
  if (!ts) return false;
  const date = parseArchiveTimestamp(ts);
  return date !== null && date.getTime() >= notBefore.getTime();
}

function comparableHost(rawUrl: string): string | null {
  try {
    return new URL(rawUrl).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

export function hasLiveHostDrift(originalUrl: string, finalUrl: string, source: string): boolean {
  if (source === 'wayback' || source === 'commoncrawl') return false;
  const originalHost = comparableHost(originalUrl);
  const finalHost = comparableHost(finalUrl);
  return Boolean(originalHost && finalHost && !isCoherentHost(originalHost, finalHost));
}

function normalizeComparablePath(rawUrl: string): string | null {
  try {
    const parsed = new URL(rawUrl);
    const path = parsed.pathname.replace(/\/+$/, '') || '/';
    return path.toLowerCase();
  } catch {
    return null;
  }
}

export function hasLivePathDrift(originalUrl: string, finalUrl: string, source: string): boolean {
  if (source === 'wayback' || source === 'commoncrawl') return false;
  if (hasExplicitLocaleDrift(originalUrl, finalUrl)) return true;
  const originalHost = comparableHost(originalUrl);
  const finalHost = comparableHost(finalUrl);
  if (!originalHost || !finalHost || originalHost !== finalHost) return false;

  const originalPath = normalizeComparablePath(originalUrl);
  const finalPath = normalizeComparablePath(finalUrl);
  if (!originalPath || !finalPath) return false;

  const finalPathIsError = /^\/(?:404|not-found|page-not-found|error)(?:\/|$)/.test(finalPath);
  return originalPath !== '/' && (finalPath === '/' || finalPathIsError);
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

export function isCoherentHost(originalHost: string, nextHost: string): boolean {
  const orig = originalHost.toLowerCase();
  const next = nextHost.toLowerCase();
  if (orig === next) return true;

  const origDomain = getDomain(orig, { allowPrivateDomains: true });
  const nextDomain = getDomain(next, { allowPrivateDomains: true });
  if (!origDomain || !nextDomain) return false;

  return origDomain === nextDomain;
}

function requestPinnedHttp(
  parsedUrl: URL,
  pinnedIp: string,
  headers: Record<string, string>,
  signal: AbortSignal,
  retainEntityBytes = false,
  maximumEntityBytes = 1_000_000
): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: string; transportProof: TransportProof; entityBytes?: Buffer }> {
  return new Promise((resolve, reject) => {
    let settled = false;
    let activeResponseFailure: ((token: string) => void) | null = null;
    const rejectOnce = (error: Error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };
    const isHttps = parsedUrl.protocol === 'https:';
    const transport = isHttps ? https : http;

    const reqHeaders = { ...headers };
    reqHeaders['host'] = parsedUrl.host;

    const requestOptions: https.RequestOptions = {
      hostname: pinnedIp,
      port: parsedUrl.port ? parseInt(parsedUrl.port, 10) : (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: reqHeaders,
      signal,
    };

    if (isHttps) {
      requestOptions.servername = parsedUrl.hostname;
      requestOptions.rejectUnauthorized = true;
    }

    const req = transport.request(requestOptions, (res) => {
      const chunks: Buffer[] = [];
      let receivedBytes = 0;
      let ended = false;
      const declaredLength = responseLength(res.headers);
      const bodyless = [204, 304].includes(res.statusCode ?? 0);
      const proof = (framing: TransportProof['framing'], decoding: TransportProof['decoding'] = 'not_applied') =>
        makeTransportProof('http1', declaredLength, receivedBytes, ended, framing, decoding, !bodyless);
      const fail = (token: string, decoding: TransportProof['decoding'] = 'not_applied') =>
        rejectOnce(new TransportIntegrityError(token, proof('incomplete', decoding), res.statusCode || 0));
      activeResponseFailure = fail;
      // Attach all failure listeners before inspecting headers or destroying a response.
      res.on('error', () => fail('response_stream_failed'));
      res.on('aborted', () => fail('response_aborted'));
      res.on('close', () => { if (!ended) fail('response_incomplete'); });
      if (res.statusCode === 206) { fail('http_206_partial_response'); res.destroy(); return; }
      if (res.headers['content-length'] !== undefined && declaredLength === null) {
        fail('invalid_content_length'); res.destroy(); return;
      }
      if (declaredLength !== null && declaredLength > MAX_NETWORK_RESPONSE_BYTES) {
        fail('response_body_too_large'); res.destroy(); return;
      }
      res.on('data', (chunk: Buffer) => {
        if (settled) return;
        const boundedChunk = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        receivedBytes += boundedChunk.byteLength;
        if (receivedBytes > MAX_NETWORK_RESPONSE_BYTES) {
          fail('response_body_too_large'); res.destroy(); return;
        }
        chunks.push(boundedChunk);
      });
      res.on('end', async () => {
        ended = true;
        if (settled) return;
        if (res.complete === false || res.aborted) { fail('response_incomplete'); return; }
        if (!bodyless && declaredLength !== null && declaredLength !== receivedBytes) {
          fail('response_length_mismatch'); return;
        }
        const buffer = Buffer.concat(chunks, receivedBytes);
        const encoding = (res.headers['content-encoding'] || '').toLowerCase();
        try {
          const entityBytes = retainEntityBytes ? await decodeBoundedResponseBytes(buffer, encoding, maximumEntityBytes) : undefined;
          const body = await decodeBoundedDocumentBody(entityBytes || buffer, entityBytes ? '' : encoding, res.headers['content-type'] || '');
          if (settled) return;
          settled = true;
          resolve({ status: res.statusCode || 0, headers: res.headers, body, ...(entityBytes ? { entityBytes } : {}),
            transportProof: proof(res.complete === true ? 'complete' : 'unknown', 'completed') });
        } catch {
          fail('response_decode_failed', 'failed');
        }
      });
    });

    req.on('error', (err) => {
      if (activeResponseFailure) activeResponseFailure('request_failed');
      else rejectOnce(err);
    });

    req.end();
  });
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
          return {
            ok: false,
            html: '',
            status: 0,
            finalUrl: destination.finalUrl,
            error: destination.reason,
          };
        }
        requestUrl = destination.url;
        const pinnedIp = destination.pinnedIp;

        const parsedUrl = new URL(requestUrl);
        const res = await requestPinnedHttp(
          parsedUrl,
          pinnedIp,
          buildHeaders(profile),
          controller.signal
        );

        if (res.status >= 300 && res.status < 400 && res.status !== 304) {
          const location = res.headers.location;
          if (!location) {
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
            return {
              ok: false,
              html: '',
              status: res.status,
              finalUrl: requestUrl,
              error: 'too_many_redirects',
            };
          }

          const nextUrl = new URL(location, requestUrl);
          const originalParsed = new URL(url);
          if (!isCoherentHost(originalParsed.hostname, nextUrl.hostname)) {
            return {
              ok: false,
              html: '',
              status: res.status,
              finalUrl: requestUrl,
              error: 'blocked_incoherent_host_drift',
            };
          }

          requestUrl = nextUrl.toString();
          continue;
        }

        // Transport has decoded bounded HTML or extracted an inert PDF body.
        const html = res.body;

        if (res.status === 202) {
          lastError = 'http_202_pending';
          if (attempt < MAX_RETRIES) {
            await sleep(BACKOFF_BASE_MS * Math.pow(2, attempt));
            break;
          }
          return {
            ok: false,
            html,
            status: res.status,
            finalUrl: requestUrl,
            error: lastError,
          };
        }

        if ((res.status >= 200 && res.status < 300) || (res.status === 403 && html.length > 5_000)) {
          // 200 OK, or 403 with substantial body (soft-block like Revolut)
          if (res.status === 403) {
            console.log(`[Scraper] 403 soft-block with ${html.length} bytes body - proceeding to content validation.`);
          }
          return {
            ok: true,
            html,
            transportProof: res.transportProof,
            status: res.status,
            finalUrl: requestUrl,
            error: '',
          };
        }

        // 4xx, except 429: not worth retrying, since the page moved, vanished, or requires auth.
        // 5xx / 429: retry with backoff.
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
          error: `HTTP ${res.status}`,
        };
      }
    } catch (err) {
      const e = err as Error;
      lastError = e.name === 'AbortError' ? 'timeout' : e.message;
      if (attempt < MAX_RETRIES) {
        await sleep(BACKOFF_BASE_MS * Math.pow(2, attempt));
        continue;
      }
    } finally {
      clearTimeout(timeout);
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
  const deadline = Date.now() + FETCH_TIMEOUT_MS;
  let current = url;
  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects++) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) return { ok: false, html: '', status: 0, finalUrl: current, error: 'h2_timeout' };
    const result = await requestWithHttp2(current, remaining);
    if (!result.redirectLocation) return result;
    let next: URL;
    try { next = new URL(result.redirectLocation, current); }
    catch { return { ...result, ok: false, error: 'h2_invalid_redirect' }; }
    if (next.protocol !== 'https:' || !isCoherentHost(new URL(url).hostname, next.hostname)) {
      return { ...result, ok: false, error: 'host_drift' };
    }
    current = next.href;
  }
  return { ok: false, html: '', status: 0, finalUrl: current, error: 'too_many_redirects' };
}

/** Every redirect hop is resolved and pinned independently within one deadline. */
async function requestWithHttp2(url: string, timeoutMs: number): Promise<TransportResult & { redirectLocation?: string }> {
  const began = Date.now();
  let dnsTimer: ReturnType<typeof setTimeout> | undefined;
  const destination = await Promise.race([
    validateOutboundUrl(url),
    new Promise<{ ok: false; reason: string; finalUrl: string }>(resolve => {
      dnsTimer = setTimeout(() => resolve({ ok: false, reason: 'h2_timeout', finalUrl: url }), timeoutMs);
    }),
  ]).finally(() => clearTimeout(dnsTimer));
  if (!destination.ok) {
    return { ok: false, html: '', status: 0, finalUrl: url, error: destination.reason };
  }
  const socketBudget = timeoutMs - (Date.now() - began);
  if (socketBudget <= 0) return { ok: false, html: '', status: 0, finalUrl: url, error: 'h2_timeout' };
  const pinnedIp = destination.pinnedIp;

  return new Promise((resolve) => {
    const parsed = new URL(destination.url);
    let client: ReturnType<typeof connect> | null = null;
    let settled = false;

    const finish = (result: TransportResult & { redirectLocation?: string }, destroyClient = true) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (client) {
        client.close();
        if (destroyClient) client.destroy();
      }
      resolve(result);
    };

    const timer = setTimeout(() => {
      finish({ ok: false, html: '', status: 0, finalUrl: url, error: 'h2_timeout' }, true);
    }, socketBudget);

    try {
      client = connect(`https://${parsed.hostname}`, {
        createConnection() {
          return tls.connect({
            host: pinnedIp,
            port: 443,
            servername: parsed.hostname,
            ALPNProtocols: ['h2'],
          });
        }
      }, () => {
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

        const activeClient = client;
        if (!activeClient) {
          finish({ ok: false, html: '', status: 0, finalUrl: url, error: 'h2_failed' }, true);
          return;
        }

        const req = activeClient.request(headers);
        const chunks: Buffer[] = [];
        let statusCode = 0;
        let receivedBytes = 0;
        let contentType = '';
        let contentEncoding = '';
        let declaredLength: number | null = null;
        let ended = false;
        const proof = (framing: TransportProof['framing'], decoding: TransportProof['decoding'] = 'not_applied') =>
          makeTransportProof('http2', declaredLength, receivedBytes, ended, framing, decoding, ![204, 304].includes(statusCode));
        const fail = (token: string, decoding: TransportProof['decoding'] = 'not_applied') => {
          finish({ ok: false, html: '', status: statusCode, finalUrl: url, error: token,
            transportProof: proof('incomplete', decoding) }, true);
        };

        req.on('response', (hdrs) => {
          statusCode = hdrs[':status'] as number || 0;
          if ([301, 302, 303, 307, 308].includes(statusCode) && typeof hdrs.location === 'string') {
            req.close();
            finish({ ok: false, html: '', status: statusCode, finalUrl: url,
              error: `h2_status_${statusCode}`, redirectLocation: hdrs.location }, true);
            return;
          }
          contentType = String(hdrs['content-type'] || '');
          contentEncoding = String(hdrs['content-encoding'] || '');
          const rawLength = hdrs['content-length'];
          declaredLength = responseLength({ 'content-length': typeof rawLength === 'string' ? rawLength : undefined });
          if (rawLength !== undefined && declaredLength === null) { fail('h2_invalid_content_length'); req.close(); return; }
          if (statusCode === 206) { fail('h2_206_partial_response'); req.close(); return; }
          if (declaredLength !== null && declaredLength > MAX_NETWORK_RESPONSE_BYTES) {
            fail('h2_response_body_too_large'); req.close();
          }
        });

        req.on('data', (chunk: Buffer) => {
          if (settled) return;
          receivedBytes += chunk.byteLength;
          if (receivedBytes > MAX_NETWORK_RESPONSE_BYTES) {
            fail('h2_response_body_too_large'); req.close();
            return;
          }
          chunks.push(chunk);
        });

        req.on('end', async () => {
          ended = true;
          if (settled) return;
          if (typeof req.rstCode === 'number' && req.rstCode !== 0) { fail('h2_response_incomplete'); return; }
          if (![204, 304].includes(statusCode) && declaredLength !== null && declaredLength !== receivedBytes) {
            fail('h2_response_length_mismatch'); return;
          }
          // Concat buffers BEFORE decoding: chunk boundaries can split
          // multi-byte UTF-8 sequences and corrupt the text otherwise.
          let data: string;
          try {
            data = await decodeBoundedDocumentBody(Buffer.concat(chunks), contentEncoding, contentType);
          } catch (error) {
            void error;
            fail('h2_response_decode_failed', 'failed');
            return;
          }
          // Redirects with Location were handled before reading the body.
          if (statusCode === 202) {
            finish({ ok: false, html: data, status: statusCode, finalUrl: url, error: 'h2_202_pending', transportProof: proof('complete', 'completed') });
          } else if (statusCode >= 200 && statusCode < 300 && data.length > 0) {
            finish({ ok: true, html: data, status: statusCode, finalUrl: url, error: '', transportProof: proof('complete', 'completed') });
          } else {
            finish({ ok: false, html: data, status: statusCode, finalUrl: url, error: `h2_status_${statusCode}`, transportProof: proof('complete', 'completed') });
          }
        });

        req.on('aborted', () => fail('h2_response_aborted'));
        req.on('close', () => { if (!ended && !settled) fail('h2_response_incomplete'); });
        req.on('error', () => fail('h2_request_failed'));

        req.end();
      });

      client.on('error', (err: Error) => {
        console.warn(`[Scraper] HTTP/2 connection error for ${parsed.hostname}: ${sanitizeLogText(err.message)}`);
        finish({ ok: false, html: '', status: 0, finalUrl: url, error: 'h2_connect_failed' }, true);
      });
    } catch (err) {
      const e = err as Error;
      console.warn(`[Scraper] HTTP/2 setup error for ${parsed.hostname}: ${sanitizeLogText(e.message)}`);
      finish({ ok: false, html: '', status: 0, finalUrl: url, error: 'h2_failed' }, true);
    }
  });
}

/* ---------------------------------------------------------------
   Freshness-guarded archive fallback
   --------------------------------------------------------------- */

/**
 * Tries to fetch the latest Wayback Machine snapshot for a URL.
 * Uses the Wayback Availability API first (fast check), then CDX
 * API as fallback if availability API returns no results.
 *
 * Snapshots older than `notBefore` are rejected (freshness guard).
 */
async function fetchFromWayback(originalUrl: string, notBefore?: Date): Promise<TransportResult> {
  let staleCandidate: { timestamp: string; url: string } | null = null;
  // Strategy A: Availability API (fast, simple)
  let availabilityTimedOut = false;
  try {
    const availUrl = `https://archive.org/wayback/available?url=${encodeURIComponent(originalUrl)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const availRes = await fetch(availUrl, {
        signal: controller.signal,
        headers: { 'User-Agent': 'PolicyWatcher/3.1 (https://policywatcher.online)' },
      });

      if (availRes.ok) {
        const data = await availRes.json() as {
          archived_snapshots?: { closest?: { available?: boolean; url?: string; timestamp?: string } };
        };
        const snap = data?.archived_snapshots?.closest;
        if (snap?.available && snap?.url && snap.timestamp) {
          if (isFreshEnough(snap.timestamp, notBefore)) {
            const rawUrl = snap.url.replace(/\/web\/(\d+)\//, '/web/$1id_/');
            const result = await fetchWaybackPage(rawUrl);
            if (result.ok) return { ...result, archiveTimestamp: snap.timestamp };
          } else {
            staleCandidate = { timestamp: snap.timestamp, url: snap.url };
          }
        }
      }
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    availabilityTimedOut = (error as Error).name === 'AbortError';
    // Fall through to CDX API
  }

  // Strategy B: CDX API (more comprehensive, finds older snapshots)
  const cdxUrl = `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(originalUrl)}&output=json&limit=-3&filter=statuscode:200&fl=timestamp`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    let cdxRes: Response;
    try {
      cdxRes = await fetch(cdxUrl, {
        signal: controller.signal,
        headers: { 'User-Agent': 'PolicyWatcher/3.1 (https://policywatcher.online)' },
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!cdxRes.ok) {
      return { ok: false, html: '', status: cdxRes.status, finalUrl: cdxUrl, error: 'wayback_cdx_error' };
    }

    const rows = await cdxRes.json() as string[][];
    // First row is header ["timestamp"], rest are data
    if (rows.length < 2) {
      return { ok: false, html: '', status: 0, finalUrl: cdxUrl, error: 'wayback_no_snapshots' };
    }

    // Try latest first, then second-latest, skipping stale snapshots.
    let sawStale = false;
    for (let i = rows.length - 1; i >= 1; i--) {
      const ts = rows[i][0];
      if (!isFreshEnough(ts, notBefore)) {
        sawStale = true;
        staleCandidate = { timestamp: ts, url: `https://web.archive.org/web/${ts}/${originalUrl}` };
        continue;
      }
      const rawUrl = `https://web.archive.org/web/${ts}id_/${originalUrl}`;
      const result = await fetchWaybackPage(rawUrl);
      if (result.ok) return { ...result, archiveTimestamp: ts };
    }

    return {
      ok: false,
      html: '',
      status: 0,
      finalUrl: cdxUrl,
      error: sawStale
        ? 'wayback_only_stale_snapshots'
        : availabilityTimedOut ? 'wayback_availability_timeout_no_fresh_snapshot' : 'wayback_all_snapshots_invalid',
      staleArchiveTimestamp: staleCandidate?.timestamp,
      staleArchiveUrl: staleCandidate?.url,
    };
  } catch (err) {
    const e = err as Error;
    return {
      ok: false,
      html: '',
      status: 0,
      finalUrl: cdxUrl,
      error: e.name === 'AbortError' ? 'wayback_cdx_timeout' : `wayback_cdx_error:${e.message}`,
      staleArchiveTimestamp: staleCandidate?.timestamp,
      staleArchiveUrl: staleCandidate?.url,
    };
  }
}

export function stripArchiveScripts(html: string): string {
  const $ = cheerio.load(html);
  $('script').remove();
  return $.html();
}

/** Fetches and cleans a single Wayback Machine page. */
async function fetchWaybackPage(rawUrl: string): Promise<TransportResult> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const controller = new AbortController();
    timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(rawUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'PolicyWatcher/3.1 (https://policywatcher.online)' },
    });

    if (!res.ok) {
      return { ok: false, html: '', status: res.status, finalUrl: rawUrl, error: `wayback_fetch_${res.status}` };
    }

    let html = (await readBoundedFetchBody(res)).toString('utf8');
    // Strip Wayback Machine toolbar injection and tracking scripts
    html = html.replace(/<!-- BEGIN WAYBACK TOOLBAR INSERT -->[\s\S]*?<!-- END WAYBACK TOOLBAR INSERT -->/gi, '');
    // Archive HTML is evidence input, never executable content. Parse it and
    // remove every script node instead of relying on repeated string deletion.
    html = stripArchiveScripts(html);
    // Fix Wayback-rewritten URLs back to originals (optional, for cleaner text)
    html = html.replace(/https?:\/\/web\.archive\.org\/web\/\d+\//g, '');

    return { ok: true, html, status: 200, finalUrl: rawUrl, error: '' };
  } catch (err) {
    const e = err as Error;
    return { ok: false, html: '', status: 0, finalUrl: rawUrl, error: `wayback_page_error:${e.message}` };
  } finally {
    clearTimeout(timeout);
  }
}

/* ---------------------------------------------------------------
   Rendered fetch via external Playwright service (VPS companion)
   Executes JavaScript like a real browser: recovers SPA and
   bot-protected policy pages (Meta, X, TikTok, OpenAI) that plain
   HTTP fetches cannot see. See renderer/ for the service itself.
   Skipped when RENDERER_URL / RENDERER_SECRET are not configured.

   (Replaces the former Google Web Cache strategy: Google retired
   the cache: endpoint in 2024 - it now returns a search page.)
   --------------------------------------------------------------- */

const RENDERER_TIMEOUT_MS = 75_000;

function rendererConfigured(): boolean {
  return Boolean(process.env.RENDERER_URL && process.env.RENDERER_SECRET);
}

async function fetchWithRenderer(url: string): Promise<TransportResult> {
  const endpoint = `${(process.env.RENDERER_URL || '').replace(/\/+$/, '')}/render`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), RENDERER_TIMEOUT_MS);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RENDERER_SECRET}`,
      },
      body: JSON.stringify({ url }),
    });

    if (!res.ok) {
      let errorToken = `renderer_${res.status}`;
      try {
        const payload = await res.json() as { error?: string };
        if (payload?.error) errorToken = payload.error;
      } catch {
        const detail = await res.text().catch(() => '');
        if (detail) errorToken = `renderer_error:${detail.slice(0, 100)}`;
      }
      return {
        ok: false,
        html: '',
        status: res.status,
        finalUrl: url,
        error: errorToken,
      };
    }

    const payload = JSON.parse((await readBoundedFetchBody(res, MAX_NETWORK_RESPONSE_BYTES,
      { scope: 'renderer_api_response' })).toString('utf8')) as { html?: string; finalUrl?: string; status?: number };
    if (payload.status === 206) {
      return { ok: false, html: '', status: 206, finalUrl: payload.finalUrl || url, error: 'renderer_partial_response' };
    }
    if (!payload.html) {
      return {
        ok: false,
        html: '',
        status: payload.status || 0,
        finalUrl: payload.finalUrl || url,
        error: 'renderer_empty_html',
      };
    }

    return {
      ok: true,
      html: payload.html,
      status: payload.status || 200,
      finalUrl: payload.finalUrl || url,
      error: '',
    };
  } catch (err) {
    const e = err as Error;
    return {
      ok: false,
      html: '',
      status: 0,
      finalUrl: url,
      error: e.name === 'AbortError' ? 'renderer_timeout' : `renderer_error:${e.message}`,
    };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Tries to fetch from Common Crawl, a massive open web archive.
 * with its own CDX index. Often has snapshots that Wayback Machine doesn't.
 * API: https://index.commoncrawl.org/
 */
type CommonCrawlCollection = { 'cdx-api': string; id: string };
let commonCrawlCollectionCache: { expiresAt: number; collections: CommonCrawlCollection[] } | null = null;
let lastCommonCrawlRequestAt = 0;

async function commonCrawlPacing(): Promise<void> {
  const waitMs = Math.max(0, 500 - (Date.now() - lastCommonCrawlRequestAt));
  if (waitMs > 0) await sleep(waitMs);
  lastCommonCrawlRequestAt = Date.now();
}

async function loadCommonCrawlCollections(): Promise<CommonCrawlCollection[]> {
  if (commonCrawlCollectionCache && commonCrawlCollectionCache.expiresAt > Date.now()) {
    return commonCrawlCollectionCache.collections;
  }
  await commonCrawlPacing();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch('https://index.commoncrawl.org/collinfo.json', {
      signal: controller.signal,
      headers: { 'User-Agent': 'PolicyWatcher/3.9 (+https://policywatcher.online/methodology/confidence)' },
    });
    if (!response.ok) throw new Error(`cc_collections_${response.status}`);
    const collections = await response.json() as CommonCrawlCollection[];
    commonCrawlCollectionCache = { expiresAt: Date.now() + 6 * 60 * 60 * 1000, collections };
    return collections;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchFromCommonCrawl(originalUrl: string, notBefore?: Date): Promise<TransportResult> {
  try {
    const collections = await loadCommonCrawlCollections();
    if (!collections.length) {
      return { ok: false, html: '', status: 0, finalUrl: originalUrl, error: 'cc_no_collections' };
    }

    type CdxRecord = { url: string; filename: string; offset: string; length: string; timestamp?: string };
    let record: CdxRecord | null = null;
    let lastSearchUrl = originalUrl;
    let lastFailure = 'cc_no_results';
    let staleRecord: CdxRecord | null = null;

    for (const collection of collections.slice(0, 3)) {
      await commonCrawlPacing();
      const searchUrl = `${collection['cdx-api']}?url=${encodeURIComponent(originalUrl)}&output=json&limit=1&filter=status:200`;
      lastSearchUrl = searchUrl;
      for (let attempt = 0; attempt < 2; attempt++) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15_000);
        try {
          const response = await fetch(searchUrl, {
            signal: controller.signal,
            headers: { 'User-Agent': 'PolicyWatcher/3.9 (+https://policywatcher.online/methodology/confidence)' },
          });
          if (!response.ok) {
            lastFailure = `cc_cdx_${response.status}`;
            if ((response.status === 429 || response.status >= 500) && attempt === 0) {
              await sleep(750);
              continue;
            }
            break;
          }
          const lines = (await response.text()).trim().split('\n').filter(Boolean);
          if (!lines.length) {
            lastFailure = 'cc_no_results';
            break;
          }
          const candidate = JSON.parse(lines[0]) as CdxRecord;
          if (!isFreshEnough(candidate.timestamp, notBefore)) {
            staleRecord = candidate;
            lastFailure = 'cc_only_stale_snapshots';
            break;
          }
          record = candidate;
          break;
        } catch (error) {
          lastFailure = (error as Error).name === 'AbortError' ? 'cc_cdx_timeout' : `cc_cdx_error:${(error as Error).message}`;
          if (attempt === 0) {
            await sleep(750);
            continue;
          }
        } finally {
          clearTimeout(timeout);
        }
      }
      if (record) break;
    }

    if (!record) {
      return {
        ok: false,
        html: '',
        status: 0,
        finalUrl: lastSearchUrl,
        error: lastFailure,
        staleArchiveTimestamp: staleRecord?.timestamp,
        staleArchiveUrl: staleRecord ? `commoncrawl://${staleRecord.url}` : undefined,
      };
    }

    // 3. Fetch the actual page from Common Crawl S3
    const warc_url = `https://data.commoncrawl.org/${record.filename}`;
    const offset = parseInt(record.offset);
    const length = parseInt(record.length);

    const controller3 = new AbortController();
    const timeout3 = setTimeout(() => controller3.abort(), 20_000);
    let warcRes: Response;
    let warcBuf: Buffer;
    try {
      warcRes = await fetch(warc_url, {
        signal: controller3.signal,
        headers: {
          'User-Agent': 'PolicyWatcher/3.9 (+https://policywatcher.online/methodology/confidence)',
          Range: `bytes=${offset}-${offset + length - 1}`,
        },
      });
      if (warcRes.status !== 206) {
        return { ok: false, html: '', status: warcRes.status, finalUrl: warc_url, error: `cc_warc_${warcRes.status}` };
      }
      // WARC records are individual gzip members. Require the exact indexed record range before decoding.
      warcBuf = await readBoundedFetchBody(warcRes, MAX_NETWORK_RESPONSE_BYTES, {
        scope: 'archive_response', expectedByteRange: { start: offset, end: offset + length - 1 },
      });
    } finally {
      clearTimeout(timeout3);
    }

    let warcData: string;
    try {
      warcData = await decodeBoundedResponseBody(warcBuf, 'gzip');
    } catch {
      // Defensive: fall back to raw text in case a record is uncompressed
      warcData = await decodeBoundedResponseBody(warcBuf, '');
    }

    // WARC records have headers before the HTML. Extract just the HTML body.
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
    return { ok: true, html, status: 200, finalUrl: `commoncrawl://${record.url}`, error: '', archiveTimestamp: record.timestamp };
  } catch (err) {
    const e = err as Error;
    return {
      ok: false,
      html: '',
      status: 0,
      finalUrl: originalUrl,
      error: e.name === 'AbortError' ? 'cc_index_timeout' : `cc_error:${e.message}`,
    };
  }
}

/* ---------------------------------------------------------------
   Layer 2: content validation
   --------------------------------------------------------------- */

const BLOCK_SIGNALS: Array<{ pattern: RegExp; reason: string }> = [
  // Cloudflare / bot challenge
  { pattern: /just a moment|cf-browser-verification|cf-challenge-running|checking your browser/i, reason: 'captcha_challenge' },
  // Generic captcha
  { pattern: /are you a robot|verify (?:that )?you are human|confirm you are human|complete (?:the )?security verification/i, reason: 'captcha' },
  // Maintenance / downtime
  { pattern: /(site|page) is (temporarily|currently) (down|unavailable|under maintenance)|scheduled maintenance|we'll be back soon|be back soon/i, reason: 'maintenance' },
  // Paywall / login wall
  { pattern: /subscribe to continue|this content is for subscribers|sign in to continue|log in to view/i, reason: 'paywall_or_login' },
  // Consent wall that hides the body
  { pattern: /we use cookies.*accept all.*to proceed|by clicking accept.*you allow/i, reason: 'consent_wall' },
  // Access denied (WAF block pages)
  { pattern: /access denied|error 1015|you have been blocked/i, reason: 'access_denied' },
  { pattern: /click the button below to continue shopping/i, reason: 'access_interstitial' },
];

/**
 * Returns a reason string if the page looks like a block/error page,
 * otherwise null. Asset names, comments and data attributes do not establish
 * a challenge. Test title/heading and the visible body prefix for wall text.
 * Page length must not exempt a padded challenge from these checks.
 */
export function detectBlockPage(html: string): string | null {
  const $ = cheerio.load(html);
  $('script, style, noscript, template').remove();
  if ($('#cf-challenge-running, #cf-browser-verification, #challenge-running, form#challenge-form').length) return 'captcha_challenge';
  const body = $('body').text().replace(/\s+/g, ' ').trim();
  if (body.length < 1500 && $('.g-recaptcha, .h-captcha, iframe[src*="recaptcha"], iframe[src*="hcaptcha"]').length) return 'captcha';
  const headings = `${$('title').text()} ${$('h1').first().text()}`;
  const head = `${headings} ${body.slice(0, 2000)}`;
  for (const signal of BLOCK_SIGNALS) {
    if (signal.pattern.test(head)) return signal.reason;
  }
  return null;
}

/**
 * Detects a "soft 404": the server returned 200 but the page is actually
 * a generic not-found / error template.
 */
export function detectSoft404(html: string): boolean {
  const $ = cheerio.load(html);
  const bodyText = $('body').text().toLowerCase();
  const titleAndHeading = `${$('title').text()} ${$('h1').first().text()}`.toLowerCase();
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
  return soft404Signals.some((signal) => titleAndHeading.includes(signal));
}

/**
 * Extracts clean visible text from HTML, stripping boilerplate.
 * This is the NORMALIZER that both the scraper (for storage) and
 * the diff engine (for comparison) should use to avoid comparing
 * raw HTML artifacts.
 *
 * Pure function (no network). Throws nothing.
 */
function urlFragment(sourceUrl?: string): string | null {
  if (!sourceUrl) return null;
  try {
    const hash = new URL(sourceUrl).hash.replace(/^#/, '').trim();
    if (!hash) return null;
    try { return decodeURIComponent(hash); } catch { return hash; }
  } catch {
    return null;
  }
}

type CheerioSelection = ReturnType<cheerio.CheerioAPI>;

function findFragmentTarget($: cheerio.CheerioAPI, fragment: string): CheerioSelection | null {
  let target: CheerioSelection | null = null;
  $('[id], [name]').each((_, element) => {
    const id = $(element).attr('id');
    const name = $(element).attr('name');
    if (id === fragment || name === fragment) {
      target = $(element);
      return false;
    }
  });
  return target;
}

function headingLevel(element: unknown): number | null {
  const tagName = (element as { tagName?: unknown } | undefined)?.tagName;
  const tag = typeof tagName === 'string' ? tagName.toLowerCase() : undefined;
  const match = tag ? /^h([1-6])$/.exec(tag) : null;
  return match ? Number(match[1]) : null;
}

function buildFragmentScopedHtml(
  $: cheerio.CheerioAPI,
  target: CheerioSelection,
  minimumTextLength: number,
): string | null {
  const targetElement = target[0];
  if (!targetElement) return null;

  const directText = target.text().replace(/\s+/g, ' ').trim();
  const targetLevel = headingLevel(targetElement);

  if (directText.length >= minimumTextLength && targetLevel === null) {
    return target.is('main, article, [role="main"]') ? $.html(target) : `<main>${$.html(target)}</main>`;
  }

  if (targetLevel !== null) {
    const pieces: string[] = [$.html(targetElement) || ''];
    let scopedText = directText;

    target.nextAll().each((_, sibling) => {
      const siblingLevel = headingLevel(sibling);
      if (siblingLevel !== null && siblingLevel <= targetLevel) {
        return false;
      }

      pieces.push($.html(sibling) || '');
      scopedText += ` ${$(sibling).text().replace(/\s+/g, ' ').trim()}`;
    });

    if (scopedText.trim().length >= minimumTextLength) {
      return `<main>${pieces.join('\n')}</main>`;
    }
    // A heading defines a hard boundary: a short section cannot borrow text
    // from sibling sections through its enclosing article.
    return null;
  }

  return null;
}

function scopedLanguages(target: CheerioSelection): string[] {
  const inherited = target.closest('[lang]').not('html').attr('lang');
  const nested = target.find('main[lang], article[lang], section[lang], [role="main"][lang]')
    .map((_, node) => node.attribs.lang).get();
  return [...new Set([inherited, ...nested].map(lang => lang?.trim()).filter((lang): lang is string => Boolean(lang)))];
}

export interface PolicyExtractionContract {
  /** Explicitly reviewed source minimum. Marker and block-page gates still apply. */
  minimumTextLength?: number;
  /** Engine 6 opt-in: preserve own-text runs around nested semantic blocks. */
  preserveNestedBlockOrder?: boolean;
  /** Internal recursion guard: an explicit URL fragment must not be narrowed again. */
  fragmentScopeResolved?: boolean;
  /** Engine 6 only: record language evidence from the actual selected DOM scope. */
  onScopedLanguage?: (languages: string[]) => void;
}

function extractionMinimum(contract: PolicyExtractionContract): number | null {
  const minimum = contract.minimumTextLength ?? MIN_TEXT_LENGTH;
  return Number.isInteger(minimum) && minimum >= 100 && minimum <= MAX_TEXT_LENGTH ? minimum : null;
}

export function extractPolicyText(html: string, sourceUrl?: string, contract: PolicyExtractionContract = {}): string {
  const minimumTextLength = extractionMinimum(contract);
  if (minimumTextLength === null) return '';
  const $ = cheerio.load(html);

  // Remove boilerplate elements
  $(
    'script, style, nav, footer, header, iframe, noscript, svg, form, ' +
    '.cookie-banner, #cookie-banner, [role="banner"], [role="contentinfo"], ' +
    '.nav-menu, #header, #footer, .breadcrumb, .breadcrumbs, ' +
    '.sidebar, aside, [aria-hidden="true"]'
  ).remove();

  const fragment = urlFragment(sourceUrl);
  if (fragment) {
    const target = findFragmentTarget($, fragment);
    if (!target) return '';

    const scopedHtml = buildFragmentScopedHtml($, target, minimumTextLength);
    if (!scopedHtml) return '';

    return extractPolicyText(scopedHtml, undefined, { ...contract, fragmentScopeResolved: true,
      onScopedLanguage: contract.onScopedLanguage
        ? languages => contract.onScopedLanguage!(languages.length ? languages : scopedLanguages(target))
        : undefined });
  }

  // OneTrust document text is a sibling of its language picker. Generic
  // policy-class matching otherwise selects the picker and loses the notice.
  const notice = $('.otnotice-content');
  if (!contract.fragmentScopeResolved && notice.length === 1 && notice.text().trim().length >= MIN_TEXT_LENGTH) {
    return extractPolicyText(`<main>${notice.html()}</main>`, undefined, { ...contract,
      onScopedLanguage: contract.onScopedLanguage
        ? languages => contract.onScopedLanguage!(languages.length ? languages : scopedLanguages(notice))
        : undefined });
  }

  const mainSelectors = [
    'main',
    'article',
    '[role="main"]',
    '[data-testid*="policy"]',
    '[data-testid*="legal"]',
    '.main-content',
    '#main-content',
    '.policy-content',
    '.legal-content',
    '[class*="policy"]',
    '[class*="legal"]',
    '#content',
  ];

  let container: ReturnType<typeof $> | null = null;
  let bestLength = 0;
  for (const sel of mainSelectors) {
    $(sel).each((_, element) => {
      const el = $(element);
      const textLength = el.text().replace(/\s+/g, ' ').trim().length;
      if (textLength >= minimumTextLength && textLength > bestLength) {
        bestLength = textLength;
        container = el;
      }
    });
  }

  const $target = container || $('body');
  contract.onScopedLanguage?.(scopedLanguages($target));
  const blocks: string[] = [];

  // Extract structured text from semantic leaf blocks. Avoid generic div/span
  // selectors: they overlap with child paragraphs and duplicate whole sections.
  const semantic = 'h1, h2, h3, h4, h5, h6, p, li, table, dt, dd, blockquote';
  type Entry = { element: Element; ownText?: string };
  let entries: Entry[] = $target.find(semantic).toArray().map(element => ({ element }));
  if (contract.preserveNestedBlockOrder) {
    entries = [];
    function visitChildren(parent: AnyNode, owner?: Element) {
      if (!('children' in parent)) return;
      let run: AnyNode[] = [];
      function flush() {
        const ownText = $(run).text().replace(/\s+/g, ' ').trim();
        if (owner && ownText) entries.push({ element: owner, ownText });
        run = [];
      }
      function visit(nodes: AnyNode[]) {
        for (const child of nodes) {
          if (child.type === 'comment') continue;
          if (child.type === 'text') { run.push(child); continue; }
          const el = $(child);
          if (el.is(semantic)) {
            flush();
            if (el.is('table') || !el.find(semantic).length) entries.push({ element: child as Element });
            else visitChildren(child, child as Element);
          } else if (el.find(semantic).length && 'children' in child) {
            // A layout wrapper does not split a single leading/trailing run.
            visit(child.children);
          } else run.push(child);
        }
      }
      visit(parent.children);
      flush();
    }
    $target.each((_, element) => {
      if (!$(element).is(semantic)) visitChildren(element);
      else if ($(element).is('table') || !$(element).find(semantic).length) entries.push({ element });
      else visitChildren(element, element);
    });
  }
  const emittedListItems = new Set<AnyNode>();
  entries.forEach(({ element, ownText: orderedText }) => {
    const $el = $(element);
    const tag = element.tagName.toLowerCase();
    const listItem = contract.preserveNestedBlockOrder ? $el.closest('li')[0] : undefined;
    if ($el.parents('table').length) return;
    if (tag === 'table') {
      // Cell position and repeated/short values are evidence, including "No".
      const rows: string[] = [];
      $el.find('tr').each((__, row) => {
        const cells = $(row).children('th, td').map((___, cell) => {
          const span = Math.max(Number($(cell).attr('colspan') || 1), Number($(cell).attr('rowspan') || 1));
          // Escape the escape character first so source backslashes cannot
          // consume the escape added for a literal table separator.
          // DOM textContent joins adjacent block nodes without a separator.
          // Preserve word boundaries while leaving inline word fragments intact.
          const content = $(cell).clone();
          content.find('p, div, li, ul, ol, dl, dt, dd, blockquote, h1, h2, h3, h4, h5, h6, br').before(' ').after(' ');
          const value = content.text().replace(/\s+/g, ' ').trim().replace(/\\/g, '\\\\').replace(/\|/g, '\\|');
          return span > 1 ? `${value} [colspan=${$(cell).attr('colspan') || 1}; rowspan=${$(cell).attr('rowspan') || 1}]` : value;
        }).get();
        if (cells.length) rows.push(`| ${cells.join(' | ')} |`);
      });
      if (rows.length) blocks.push(`\n${rows.join('\n')}\n`);
      return;
    }
    // Skip overlapping containers, preserving their own text when present.
    if (orderedText === undefined && $el.find('p, li, table, blockquote, dt, dd').length) {
      const own = $el.clone();
      own.find('p, li, table, blockquote, dt, dd').remove();
      const ownText = own.text().replace(/\s+/g, ' ').trim();
      if (ownText) blocks.push(tag === 'li' ? `- ${ownText}` : `\n${ownText}\n`);
      return;
    }
    const text = orderedText ?? $el.text().trim().replace(/\s+/g, ' ');
    if (!text) return;
    if (tag.startsWith('h')) {
      const level = parseInt(tag.substring(1));
      blocks.push(`\n${'#'.repeat(level)} ${text}\n`);
      if (listItem) emittedListItems.add(listItem);
    } else if (listItem && !emittedListItems.has(listItem)) {
      emittedListItems.add(listItem);
      blocks.push(`- ${text}`);
    } else if (tag === 'li' && !contract.preserveNestedBlockOrder) {
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
export async function validateContent(html: string, sourceUrl?: string, contract: PolicyExtractionContract = {}): Promise<
  | { ok: true; text: string; hash: string; partial?: boolean; partialReason?: string; originalTextLength?: number }
  | { ok: false; reason: string }
> {
  const minimumTextLength = extractionMinimum(contract);
  if (minimumTextLength === null) return { ok: false, reason: 'invalid_extraction_contract' };
  const blockReason = detectBlockPage(html);
  if (blockReason) return { ok: false, reason: `blocked:${blockReason}` };

  if (detectSoft404(html)) return { ok: false, reason: 'soft_404' };

  const text = extractPolicyText(html, sourceUrl, contract);
  if (text.length < minimumTextLength) {
    if (urlFragment(sourceUrl)) {
      const fragment = urlFragment(sourceUrl)!;
      const target = findFragmentTarget(cheerio.load(html), fragment);
      return { ok: false, reason: target ? 'scope_incomplete' : 'scope_missing' };
    }
    // Before giving up, check raw visible text length
    // Some sites have complex DOM that our extractor misses
    const rawText = visibleText(html);
    if (rawText.length >= minimumTextLength) {
      // Use raw visible text as fallback
      const trimmed = rawText.slice(0, MAX_TEXT_LENGTH);
      // Validate it's actually a policy page
      if (!isPolicyContent(trimmed)) return { ok: false, reason: 'not_a_policy_page' };
      const hash = await sha256(trimmed);
      return {
        ok: true,
        text: trimmed,
        hash,
        ...(rawText.length > MAX_TEXT_LENGTH
          ? {
              partial: true,
              partialReason: 'text_truncated_at_max_length',
              originalTextLength: rawText.length,
            }
          : {}),
      };
    }
    return { ok: false, reason: 'content_too_short' };
  }

  // Verify extracted text is actually a policy page (not a random page)
  if (!isPolicyContent(text)) return { ok: false, reason: 'not_a_policy_page' };

  const trimmed = text.slice(0, MAX_TEXT_LENGTH);
  const hash = await sha256(trimmed);

  return {
    ok: true,
    text: trimmed,
    hash,
    ...(text.length > MAX_TEXT_LENGTH
      ? {
          partial: true,
          partialReason: 'text_truncated_at_max_length',
          originalTextLength: text.length,
        }
      : {}),
  };
}

/**
 * Checks if extracted text looks like a genuine policy/ToS page
 * by counting occurrences of policy-related keywords.
 * Prevents false positives from error pages or unrelated content.
 */
export function isPolicyContent(text: string): boolean {
  const lower = text.toLowerCase();
  const hits = POLICY_MARKERS.filter(m => lower.includes(m)).length;
  return hits >= MIN_MARKER_HITS;
}

function validateDiscoveryDocumentContent(content: string): string | null {
  if (!content || content.trim().length < 120) return 'content_too_short';
  const blockReason = detectBlockPage(content);
  if (blockReason) return blockReason;
  if (detectSoft404(content)) return 'soft_404';
  return null;
}

/**
 * Retrieves an HTML/XML/text discovery document through the same five-level
 * transport cascade used by policy monitoring. It deliberately does not
 * require policy markers: home pages, legal hubs, robots.txt and sitemaps are
 * discovery inputs rather than policy evidence.
 */
export async function fetchDiscoveryDocument(url: string): Promise<DiscoveryDocumentResult> {
  const diagnostics: ScrapeDiagnostic[] = [];
  const destination = await validateOutboundUrl(url);
  if (!destination.ok) {
    diagnostics.push({
      source: 'direct',
      status: 'failed',
      reason: destination.reason,
      finalUrl: destination.finalUrl,
    });
    return {
      status: 'unavailable',
      content: '',
      finalUrl: destination.finalUrl,
      reason: destination.reason,
      httpStatus: 0,
      source: 'none',
      diagnostics,
    };
  }
  const logUrl = sanitizeLogText(destination.url);

  const accept = (source: string, result: TransportResult): DiscoveryDocumentResult | null => {
    if (!result.ok) {
      diagnostics.push({
        source,
        status: 'failed',
        reason: result.error,
        httpStatus: result.status,
        finalUrl: result.finalUrl,
      });
      return null;
    }

    const rejection = validateDiscoveryDocumentContent(result.html);
    if (rejection) {
      diagnostics.push({
        source,
        status: 'rejected',
        reason: rejection,
        httpStatus: result.status,
        finalUrl: result.finalUrl,
      });
      return null;
    }

    diagnostics.push({
      source,
      status: 'ok',
      httpStatus: result.status,
      finalUrl: result.finalUrl,
    });
    return {
      status: 'ok',
      content: result.html,
      finalUrl: result.finalUrl,
      reason: '',
      httpStatus: result.status,
      source,
      diagnostics,
    };
  };

  console.log(`[Discovery] [1/5] Direct fetch: ${logUrl}`);
  const direct = await fetchWithRetry(destination.url);
  const directAccepted = accept('direct', direct);
  if (directAccepted) return directAccepted;

  await politeDelay();
  console.log(`[Discovery] [2/5] HTTP/2 fetch: ${logUrl}`);
  try {
    const http2Result = await fetchWithHttp2(destination.url);
    const http2Accepted = accept('http2', http2Result);
    if (http2Accepted) return http2Accepted;
  } catch (error) {
    diagnostics.push({ source: 'http2', status: 'failed', reason: (error as Error).message });
  }

  if (rendererConfigured()) {
    await politeDelay();
    console.log(`[Discovery] [3/5] Rendered fetch: ${logUrl}`);
    const rendered = await fetchWithRenderer(destination.url);
    const renderedAccepted = accept('rendered', rendered);
    if (renderedAccepted) return renderedAccepted;
  } else {
    diagnostics.push({ source: 'rendered', status: 'skipped', reason: 'renderer_not_configured' });
  }

  await politeDelay();
  console.log(`[Discovery] [4/5] Wayback fetch: ${logUrl}`);
  const wayback = await fetchFromWayback(destination.url);
  const waybackAccepted = accept('wayback', wayback);
  if (waybackAccepted) return waybackAccepted;

  await politeDelay();
  console.log(`[Discovery] [5/5] Common Crawl fetch: ${logUrl}`);
  const commonCrawl = await fetchFromCommonCrawl(destination.url);
  const commonCrawlAccepted = accept('commoncrawl', commonCrawl);
  if (commonCrawlAccepted) return commonCrawlAccepted;

  const reason = diagnostics
    .map((item) => `${item.source}:${item.status}${item.reason ? `:${item.reason}` : ''}`)
    .join(' | ') || 'all_sources_failed';
  return {
    status: reason.includes('soft_404') || reason.includes('gone') ? 'invalid' : 'unavailable',
    content: '',
    finalUrl: direct.finalUrl || destination.url,
    reason,
    httpStatus: direct.status,
    source: 'none',
    diagnostics,
  };
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
 *   3. Rendered fetch via Playwright service on the VPS (JS execution)
 *   4. Wayback Machine (web.archive.org) cached version
 *   5. Common Crawl archive
 *
 * Archive strategies (4-5) honour `options.archiveNotBefore`: snapshots
 * older than that date are rejected, so a temporarily blocked live site
 * can never be silently replaced by an outdated archived copy. Callers
 * should pass the policy's lastSuccessfulCheckDate.
 *
 * Returns a ScrapeResult. Callers MUST check `.status`:
 *   - 'ok'          -> store text + hash
 *   - 'unavailable' -> surface "Temporarily unavailable, visit official site"
 *   - 'invalid'     -> the URL points to a non-policy page (wrong link)
 *
 * The function NEVER fabricates content: if it can't get a clean policy
 * text, it returns a non-ok status.
 */
export async function scrapePolicyText(
  url: string,
  options: ScrapePolicyOptions = {},
): Promise<ScrapeResult> {
  const rawCaptureSummary = { attempted: 0, recorded: 0, failed: 0 };
  const result = await scrapePolicyTextInternal(url, options, rawCaptureSummary);
  return {
    ...result, outcome: acquisitionOutcome(result),
    ...(options.onRawCapture ? { rawCaptureSummary } : {}),
  };
}

async function scrapePolicyTextInternal(
  url: string,
  options: ScrapePolicyOptions,
  captureSummary: { attempted: number; recorded: number; failed: number },
): Promise<ScrapeResult> {
  const { archiveNotBefore, controlledFallbacks } = options;
  const capture = async (transport: TransportResult, source: CaptureTransport) => {
    if (!options.onRawCapture) return;
    captureSummary.attempted += 1;
    try {
      await options.onRawCapture(createCapture({
        requestedUrl: url, finalUrl: transport.finalUrl || url, transport: source,
        transportOk: transport.ok, httpStatus: transport.status, html: transport.html,
        // Direct/archive inputs may already be converted from PDF by the baseline transport.
        bodyKind: source === 'rendered' ? 'rendered_dom' : 'decoded_document_html',
        capturedAt: new Date().toISOString(), archiveTimestamp: transport.archiveTimestamp,
      }));
      captureSummary.recorded += 1;
    } catch {
      captureSummary.failed += 1;
      // Storage is observational: it cannot turn failed content into success or
      // interrupt an otherwise valid acquisition. The sink must report its errors.
      console.warn('[Scraper] Private raw capture failed.');
    }
  };
  if (controlledFallbacks && process.env.NODE_ENV === 'production') {
    throw new Error('controlled_fallbacks_disabled_in_production');
  }
  const fallbackDelay = controlledFallbacks?.skipDelays
    ? async () => undefined
    : politeDelay;
  const diagnostics: ScrapeDiagnostic[] = [];
  const destination = await validateOutboundUrl(url);
  if (!destination.ok) {
    diagnostics.push({
      source: 'direct',
      status: 'failed',
      reason: destination.reason,
      finalUrl: destination.finalUrl,
    });
    return makeResult('unavailable', destination.finalUrl, destination.reason, 0, 0, 'direct', diagnostics);
  }
  const logUrl = sanitizeLogText(destination.url);

  let directReason = '';

  // Strategy 1: Direct HTTP/1.1 fetch.
  console.log(`[Scraper] [1/5] Direct fetch: ${logUrl}`);
  const directStartedAt = Date.now();
  const transport = controlledFallbacks?.direct
    ? await controlledFallbacks.direct(destination.url, archiveNotBefore)
    : await fetchWithRetry(destination.url);
  const directDurationMs = Date.now() - directStartedAt;
  await capture(transport, 'direct');

    if (!transport.ok && transport.html === '') {
      directReason = transport.error;
      diagnostics.push({
        source: 'direct',
        status: 'failed',
        reason: transport.error,
        httpStatus: transport.status,
        finalUrl: transport.finalUrl,
        durationMs: directDurationMs,
      });
      console.log('[Scraper] [1/5] Transport failure recorded.');
    } else {
    const httpStatus = transport.status;

    if (httpStatus === 404 || httpStatus === 410) {
      directReason = `http_${httpStatus}_gone`;
      diagnostics.push({
        source: 'direct',
        status: 'failed',
        reason: directReason,
        httpStatus,
        finalUrl: transport.finalUrl,
        durationMs: directDurationMs,
      });
      console.log(`[Scraper] [1/5] ${httpStatus} Gone`);
    } else if (httpStatus >= 400 && !(httpStatus === 403 && transport.html.length > 5_000)) {
      directReason = `http_${httpStatus}`;
      diagnostics.push({
        source: 'direct',
        status: 'failed',
        reason: directReason,
        httpStatus,
        finalUrl: transport.finalUrl,
        durationMs: directDurationMs,
      });
      console.log(`[Scraper] [1/5] HTTP ${httpStatus}`);
    } else {
      const validation = await validateContent(transport.html, url);
      if (validation.ok) {
        if (hasLiveHostDrift(url, transport.finalUrl, 'direct')) {
          console.log(`[Scraper] [1/5] Host drift rejected: ${logUrl} -> ${sanitizeLogText(transport.finalUrl)}`);
          diagnostics.push({ source: 'direct', status: 'rejected', reason: 'host_drift', httpStatus, finalUrl: transport.finalUrl, durationMs: directDurationMs });
          return makeResult('invalid', transport.finalUrl, 'host_drift', httpStatus, MAX_RETRIES + 1, 'direct', diagnostics);
        }
        if (hasLivePathDrift(url, transport.finalUrl, 'direct')) {
          console.log(`[Scraper] [1/5] Path drift rejected: ${logUrl} -> ${sanitizeLogText(transport.finalUrl)}`);
          diagnostics.push({ source: 'direct', status: 'rejected', reason: 'path_drift', httpStatus, finalUrl: transport.finalUrl, durationMs: directDurationMs });
          return makeResult('invalid', transport.finalUrl, 'path_drift', httpStatus, MAX_RETRIES + 1, 'direct', diagnostics);
        }
        console.log(`[Scraper] [OK] Direct fetch OK (${validation.text.length} chars)`);
        diagnostics.push({
          source: 'direct',
          status: validation.partial ? 'partial' : 'ok',
          reason: validation.partial
            ? validation.partialReason || 'partial_retrieval'
            : httpStatus !== 200 ? `accepted_noncanonical_http_status:${httpStatus}` : undefined,
          httpStatus,
          finalUrl: transport.finalUrl,
          durationMs: directDurationMs,
        });
        return {
          status: 'ok',
          text: validation.text,
          hash: validation.hash,
          finalUrl: transport.finalUrl,
          reason: '',
          httpStatus,
          attempts: MAX_RETRIES + 1,
          source: 'direct',
          extraction: extractionEvidence(transport.html, url),
          partial: validation.partial,
          partialReason: validation.partialReason,
          originalTextLength: validation.originalTextLength,
          diagnostics: enrichDiagnostics(diagnostics),
        };
      }
      directReason = validation.reason;
      diagnostics.push({
        source: 'direct',
        status: 'rejected',
        reason: validation.reason,
        httpStatus,
        finalUrl: transport.finalUrl,
        durationMs: directDurationMs,
      });
      console.log(`[Scraper] [1/5] Content rejected: ${validation.reason}`);
    }
  }

  // Strategy 2: HTTP/2 explicit (for Meta 400 errors).
  // Try protocol-sensitive 400s, SPA shells, and one bounded 403 probe.
  // Repeated source-level failures are handled by the remediation registry;
  // this is not an anti-bot bypass and never attempts a CAPTCHA challenge.
  if (directReason.includes('400') || directReason.includes('403') || directReason === 'content_too_short') {
    await fallbackDelay();
    console.log(`[Scraper] [2/5] HTTP/2 explicit: ${logUrl}`);
    const h2StartedAt = Date.now();
    try {
      const h2Result = controlledFallbacks?.http2
        ? await controlledFallbacks.http2(destination.url, archiveNotBefore)
        : await fetchWithHttp2(destination.url);
      const h2DurationMs = Date.now() - h2StartedAt;
      await capture(h2Result, 'http2');
      if (h2Result.ok) {
        const validation = await validateContent(h2Result.html, url);
        if (validation.ok) {
          if (hasLiveHostDrift(url, h2Result.finalUrl, 'http2')) {
            console.log(`[Scraper] [2/5] Host drift rejected: ${logUrl} -> ${sanitizeLogText(h2Result.finalUrl)}`);
            diagnostics.push({ source: 'http2', status: 'rejected', reason: 'host_drift', httpStatus: h2Result.status, finalUrl: h2Result.finalUrl, durationMs: h2DurationMs });
            return makeResult('invalid', h2Result.finalUrl, 'host_drift', h2Result.status, MAX_RETRIES + 2, 'http2', diagnostics);
          }
          if (hasLivePathDrift(url, h2Result.finalUrl, 'http2')) {
            console.log(`[Scraper] [2/5] Path drift rejected: ${logUrl} -> ${sanitizeLogText(h2Result.finalUrl)}`);
            diagnostics.push({ source: 'http2', status: 'rejected', reason: 'path_drift', httpStatus: h2Result.status, finalUrl: h2Result.finalUrl, durationMs: h2DurationMs });
            return makeResult('invalid', h2Result.finalUrl, 'path_drift', h2Result.status, MAX_RETRIES + 2, 'http2', diagnostics);
          }
          console.log(`[Scraper] [OK] HTTP/2 fetch OK (${validation.text.length} chars)`);
          diagnostics.push({
            source: 'http2',
            status: validation.partial ? 'partial' : 'ok',
            reason: validation.partial
              ? validation.partialReason || 'partial_retrieval'
              : h2Result.status !== 200 ? `accepted_noncanonical_http_status:${h2Result.status}` : undefined,
            httpStatus: h2Result.status,
            finalUrl: h2Result.finalUrl,
            durationMs: h2DurationMs,
          });
          return {
            status: 'ok',
            text: validation.text,
            hash: validation.hash,
            finalUrl: h2Result.finalUrl,
            reason: '',
            httpStatus: h2Result.status,
            attempts: MAX_RETRIES + 2,
            source: 'http2',
            extraction: extractionEvidence(h2Result.html, url),
            partial: validation.partial,
            partialReason: validation.partialReason,
            originalTextLength: validation.originalTextLength,
            diagnostics: enrichDiagnostics(diagnostics),
          };
        }
        diagnostics.push({
          source: 'http2',
          status: 'rejected',
          reason: validation.reason,
          httpStatus: h2Result.status,
          finalUrl: h2Result.finalUrl,
          durationMs: h2DurationMs,
        });
        console.log(`[Scraper] [2/5] H2 content rejected: ${validation.reason}`);
      } else {
        diagnostics.push({
          source: 'http2',
          status: 'failed',
          reason: h2Result.error,
          httpStatus: h2Result.status,
          finalUrl: h2Result.finalUrl,
          durationMs: h2DurationMs,
        });
        console.log(`[Scraper] [2/5] H2 fetch failed: ${sanitizeLogText(h2Result.error)}`);
      }
    } catch (err) {
      diagnostics.push({ source: 'http2', status: 'failed', reason: (err as Error).message, durationMs: Date.now() - h2StartedAt });
      console.log(`[Scraper] [2/5] H2 error: ${sanitizeLogText((err as Error).message)}`);
    }
  } else {
    diagnostics.push({ source: 'http2', status: 'skipped', reason: 'routing_policy_not_protocol_spa_or_403' });
    console.log(`[Scraper] [2/5] HTTP/2 skipped by routing policy`);
  }

  // Strategy 3: Rendered fetch (Playwright service on the VPS).
  // Executes JavaScript: recovers SPA shells and many bot-protected pages.
  // This is the LAST strategy that sees the live site. Archives below
  // can only confirm past versions, never the current one.
  if (controlledFallbacks?.rendered || rendererConfigured()) {
    await fallbackDelay();
    console.log(`[Scraper] [3/5] Rendered fetch: ${logUrl}`);
    const renderedStartedAt = Date.now();
    const rendered = controlledFallbacks?.rendered
      ? await controlledFallbacks.rendered(destination.url, archiveNotBefore)
      : await fetchWithRenderer(destination.url);
    const renderedDurationMs = Date.now() - renderedStartedAt;
    await capture(rendered, 'rendered');
    if (rendered.ok) {
      const validation = await validateContent(rendered.html, url);
      if (validation.ok) {
        if (hasLiveHostDrift(url, rendered.finalUrl, 'rendered')) {
          console.log(`[Scraper] [3/5] Host drift rejected: ${logUrl} -> ${sanitizeLogText(rendered.finalUrl)}`);
          diagnostics.push({ source: 'rendered', status: 'rejected', reason: 'host_drift', httpStatus: rendered.status, finalUrl: rendered.finalUrl, durationMs: renderedDurationMs });
          return makeResult('invalid', rendered.finalUrl, 'host_drift', rendered.status, MAX_RETRIES + 3, 'rendered', diagnostics);
        }
        if (hasLivePathDrift(url, rendered.finalUrl, 'rendered')) {
          console.log(`[Scraper] [3/5] Path drift rejected: ${logUrl} -> ${sanitizeLogText(rendered.finalUrl)}`);
          diagnostics.push({ source: 'rendered', status: 'rejected', reason: 'path_drift', httpStatus: rendered.status, finalUrl: rendered.finalUrl, durationMs: renderedDurationMs });
          return makeResult('invalid', rendered.finalUrl, 'path_drift', rendered.status, MAX_RETRIES + 3, 'rendered', diagnostics);
        }
        console.log(`[Scraper] [OK] Rendered fetch OK (${validation.text.length} chars)`);
        diagnostics.push({
          source: 'rendered',
          status: validation.partial ? 'partial' : 'ok',
          reason: validation.partial
            ? validation.partialReason || 'partial_retrieval'
            : rendered.status !== 200 ? `accepted_noncanonical_http_status:${rendered.status}` : undefined,
          httpStatus: rendered.status,
          finalUrl: rendered.finalUrl,
          durationMs: renderedDurationMs,
        });
        return {
          status: 'ok',
          text: validation.text,
          hash: validation.hash,
          finalUrl: rendered.finalUrl,
          reason: '',
          httpStatus: rendered.status,
          attempts: MAX_RETRIES + 3,
          source: 'rendered',
          extraction: extractionEvidence(rendered.html, url),
          partial: validation.partial,
          partialReason: validation.partialReason,
          originalTextLength: validation.originalTextLength,
          diagnostics: enrichDiagnostics(diagnostics),
        };
      }
      diagnostics.push({
        source: 'rendered',
        status: 'rejected',
        reason: validation.reason,
        httpStatus: rendered.status,
        finalUrl: rendered.finalUrl,
        durationMs: renderedDurationMs,
      });
      console.log(`[Scraper] [3/5] Rendered content rejected: ${validation.reason}`);
    } else {
      diagnostics.push({
        source: 'rendered',
        status: 'failed',
        reason: rendered.error,
        httpStatus: rendered.status,
        finalUrl: rendered.finalUrl,
        durationMs: renderedDurationMs,
      });
      console.log(`[Scraper] [3/5] Rendered fetch failed: ${sanitizeLogText(rendered.error)}`);
    }
  } else {
    diagnostics.push({ source: 'rendered', status: 'skipped', reason: 'renderer_not_configured' });
    console.log(`[Scraper] [3/5] Rendered fetch skipped (RENDERER_URL not configured)`);
  }

  // Strategy 4: Wayback Machine (freshness-guarded).
  await fallbackDelay();
  console.log(`[Scraper] [4/5] Wayback Machine: ${logUrl}`);
  const waybackStartedAt = Date.now();
  const wayback = controlledFallbacks?.wayback
    ? await controlledFallbacks.wayback(url, archiveNotBefore)
    : await fetchFromWayback(url, archiveNotBefore);
  const waybackDurationMs = Date.now() - waybackStartedAt;
  await capture(wayback, 'wayback');
  if (wayback.ok) {
    const validation = await validateContent(wayback.html, url);
    if (validation.ok) {
      console.log(`[Scraper] [OK] Wayback Machine OK (${validation.text.length} chars from ${sanitizeLogText(wayback.finalUrl)})`);
      diagnostics.push({
        source: 'wayback',
        status: validation.partial ? 'partial' : 'ok',
        httpStatus: 200,
        finalUrl: wayback.finalUrl,
        durationMs: waybackDurationMs,
        reason: validation.partial
          ? validation.partialReason || 'partial_retrieval'
          : wayback.archiveTimestamp ? `archive_timestamp:${wayback.archiveTimestamp}` : undefined,
      });
      return {
        status: 'ok',
        text: validation.text,
        hash: validation.hash,
        finalUrl: wayback.finalUrl,
        reason: '',
        httpStatus: 200,
        attempts: MAX_RETRIES + 4,
        source: 'wayback',
        archiveTimestamp: wayback.archiveTimestamp
          ? parseArchiveTimestamp(wayback.archiveTimestamp)?.toISOString()
          : undefined,
        partial: validation.partial,
        partialReason: validation.partialReason,
        originalTextLength: validation.originalTextLength,
        diagnostics: enrichDiagnostics(diagnostics),
      };
    }
    diagnostics.push({
      source: 'wayback',
      status: 'rejected',
      reason: validation.reason,
      httpStatus: wayback.status,
      finalUrl: wayback.finalUrl,
      durationMs: waybackDurationMs,
    });
    console.log(`[Scraper] [4/5] Wayback content rejected: ${validation.reason}`);
  } else {
    diagnostics.push({
      source: 'wayback',
      status: 'failed',
      reason: wayback.error,
      httpStatus: wayback.status,
      finalUrl: wayback.finalUrl,
      durationMs: waybackDurationMs,
    });
    console.log(`[Scraper] [4/5] Wayback failed: ${sanitizeLogText(wayback.error)}`);
  }

  // Strategy 5: Common Crawl (freshness-guarded).
  await fallbackDelay();
  console.log(`[Scraper] [5/5] Common Crawl: ${logUrl}`);
  const commonCrawlStartedAt = Date.now();
  const cc = controlledFallbacks?.commoncrawl
    ? await controlledFallbacks.commoncrawl(url, archiveNotBefore)
    : await fetchFromCommonCrawl(url, archiveNotBefore);
  const commonCrawlDurationMs = Date.now() - commonCrawlStartedAt;
  await capture(cc, 'commoncrawl');
  if (cc.ok) {
    const validation = await validateContent(cc.html, url);
    if (validation.ok) {
      console.log(`[Scraper] [OK] Common Crawl OK (${validation.text.length} chars)`);
      diagnostics.push({
        source: 'commoncrawl',
        status: validation.partial ? 'partial' : 'ok',
        httpStatus: 200,
        finalUrl: cc.finalUrl,
        durationMs: commonCrawlDurationMs,
        reason: validation.partial
          ? validation.partialReason || 'partial_retrieval'
          : cc.archiveTimestamp ? `archive_timestamp:${cc.archiveTimestamp}` : undefined,
      });
      return {
        status: 'ok',
        text: validation.text,
        hash: validation.hash,
        finalUrl: cc.finalUrl,
        reason: '',
        httpStatus: 200,
        attempts: MAX_RETRIES + 5,
        source: 'commoncrawl',
        archiveTimestamp: cc.archiveTimestamp
          ? parseArchiveTimestamp(cc.archiveTimestamp)?.toISOString()
          : undefined,
        partial: validation.partial,
        partialReason: validation.partialReason,
        originalTextLength: validation.originalTextLength,
        diagnostics: enrichDiagnostics(diagnostics),
      };
    }
    diagnostics.push({
      source: 'commoncrawl',
      status: 'rejected',
      reason: validation.reason,
      httpStatus: cc.status,
      finalUrl: cc.finalUrl,
      durationMs: commonCrawlDurationMs,
    });
    console.log(`[Scraper] [5/5] Common Crawl content rejected: ${validation.reason}`);
  } else {
    diagnostics.push({
      source: 'commoncrawl',
      status: 'failed',
      reason: cc.error,
      httpStatus: cc.status,
      finalUrl: cc.finalUrl,
      durationMs: commonCrawlDurationMs,
    });
    console.log(`[Scraper] [5/5] Common Crawl failed: ${sanitizeLogText(cc.error)}`);
  }

  // All strategies exhausted.
  const diagnosticReason = diagnostics
    .map((item) => `${item.source}:${item.status}${item.reason ? `:${item.reason}` : ''}`)
    .join(' | ');
  const finalReason = diagnosticReason || directReason || 'all_sources_failed';
  const httpStatus = transport.status;
  const enrichedDiagnostics = enrichDiagnostics(diagnostics);
  const reasonCode = terminalRetrievalCause(enrichedDiagnostics);

  const historicalCandidates = [
    wayback.staleArchiveTimestamp
      ? { source: 'wayback' as const, capturedAt: wayback.staleArchiveTimestamp, referenceUrl: wayback.staleArchiveUrl }
      : null,
    cc.staleArchiveTimestamp
      ? { source: 'commoncrawl' as const, capturedAt: cc.staleArchiveTimestamp, referenceUrl: cc.staleArchiveUrl }
      : null,
  ].filter((candidate): candidate is NonNullable<typeof candidate> => Boolean(candidate));
  historicalCandidates.sort((left, right) => {
    const leftDate = parseArchiveTimestamp(left.capturedAt)?.getTime() || 0;
    const rightDate = parseArchiveTimestamp(right.capturedAt)?.getTime() || 0;
    return rightDate - leftDate;
  });

  console.log('[Scraper] [ERROR] All 5 strategies exhausted.');
  const failedResult = makeResult(
    reasonCode === 'source_gone' ? 'invalid' : 'unavailable',
    transport.finalUrl || url,
    finalReason,
    httpStatus,
    MAX_RETRIES + 5,
    'none',
    enrichedDiagnostics,
  );
  failedResult.reasonCode = reasonCode;
  const historicalReference = historicalCandidates[0];
  if (historicalReference) {
    const capturedAt = parseArchiveTimestamp(historicalReference.capturedAt)?.toISOString();
    if (capturedAt) failedResult.historicalReference = { ...historicalReference, capturedAt };
  }
  return failedResult;
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
  diagnostics: ScrapeDiagnostic[] = [],
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
    diagnostics: enrichDiagnostics(diagnostics),
    reasonCode: status === 'ok' ? 'verified' : terminalRetrievalCause(diagnostics),
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
