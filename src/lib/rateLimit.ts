/**
 * PolicyWatcher - In-memory rate limiter (token bucket per IP).
 *
 * Designed for single-instance deployments (Hostinger Node.js).
 * For multi-instance, replace with Upstash Redis or similar.
 *
 * Usage in a route:
 *   import { rateLimit } from '@/lib/rateLimit';
 *   const limited = rateLimit(request, { intervalMs: 60_000, max: 10 });
 *   if (limited) return limited; // 429 response
 */

import { NextResponse } from 'next/server';

/** Internal state for a single rate-limit bucket (one per IP + group). */
interface Bucket {
  /** Remaining request tokens in this window. */
  tokens: number;
  /** Timestamp (ms) of the last token refill calculation. */
  lastRefill: number;
}

interface RateLimitConfig {
  /** Time window in milliseconds. Default: 60_000 (1 min). */
  intervalMs?: number;
  /** Max requests allowed in the window. Default: 10. */
  max?: number;
  /** Optional human-readable label for the rate-limit group (logs). */
  name?: string;
  /** Set false for endpoints whose privacy contract excludes persistent IP logs. */
  logClientIp?: boolean;
}

export const UNATTRIBUTED_CLIENT_IDENTITY = 'unattributed' as const;

const buckets = new Map<string, Bucket>();

// Periodically prune stale buckets so memory doesn't grow unbounded.
const PRUNE_INTERVAL_MS = 5 * 60 * 1000; // 5 min
let lastPrune = Date.now();

/**
 * Removes stale buckets from the in-memory map to prevent unbounded
 * memory growth.  Runs at most once every `PRUNE_INTERVAL_MS`.
 *
 * @param now - Current timestamp in milliseconds.
 * @param ttlMs - The interval window; buckets older than 2 times this are pruned.
 */
function pruneStale(now: number, ttlMs: number) {
  if (now - lastPrune < PRUNE_INTERVAL_MS) return;
  lastPrune = now;
  for (const [key, bucket] of buckets) {
    if (now - bucket.lastRefill > ttlMs * 2) {
      buckets.delete(key);
    }
  }
}

const TRUST_PROXY_HEADERS = process.env.TRUST_PROXY_HEADERS === 'true';
const TRUSTED_CLIENT_IP_HEADER = process.env.TRUSTED_CLIENT_IP_HEADER?.trim().toLowerCase();
const missingIdentityWarnings = new Set<string>();

export function trustedClientIdentityConfigured(
  environment: NodeJS.ProcessEnv = process.env,
): boolean {
  return environment.TRUST_PROXY_HEADERS?.trim().toLowerCase() === 'true'
    || Boolean(environment.TRUSTED_CLIENT_IP_HEADER?.trim());
}

export function trustedClientIdentityRequired(
  environment: NodeJS.ProcessEnv = process.env,
): boolean {
  const deploymentTarget = environment.POLICYWATCHER_DEPLOYMENT_TARGET?.trim().toLowerCase();
  return environment.NODE_ENV === 'production'
    || deploymentTarget === 'staging'
    || deploymentTarget === 'production';
}

function normalizeTrustedClientIdentity(value: string | null): string | null {
  const candidate = value?.split(',')[0]?.trim();
  if (!candidate || candidate.length > 128 || /[\u0000-\u001f\u007f\s]/.test(candidate)) return null;
  return candidate;
}

/**
 * Extracts the client IP address from trusted deployment headers only.
 *
 * By default, client-supplied forwarding headers are not trusted. In
 * production, set `TRUSTED_CLIENT_IP_HEADER` to a provider-controlled header
 * or set `TRUST_PROXY_HEADERS=true` only after the reverse proxy is confirmed
 * to overwrite incoming `x-forwarded-for` values.
 */
export function getClientIp(request: Request): string {
  if (TRUSTED_CLIENT_IP_HEADER) {
    const trusted = normalizeTrustedClientIdentity(request.headers.get(TRUSTED_CLIENT_IP_HEADER));
    if (trusted) return trusted;
  }

  if (TRUST_PROXY_HEADERS) {
    const forwarded = normalizeTrustedClientIdentity(request.headers.get('x-forwarded-for'));
    if (forwarded) return forwarded;
    const real = normalizeTrustedClientIdentity(request.headers.get('x-real-ip'));
    if (real) return real;
  }

  return UNATTRIBUTED_CLIENT_IDENTITY;
}

export function clientIdentityUnavailableResponse(name: string): NextResponse {
  if (!missingIdentityWarnings.has(name)) {
    missingIdentityWarnings.add(name);
    console.error(`[RateLimit] ${name} rejected because trusted client identity is unavailable.`);
  }
  return NextResponse.json(
    {
      error: 'Request identity is temporarily unavailable.',
      code: 'client_identity_unavailable',
    },
    {
      status: 503,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Retry-After': '60',
      },
    },
  );
}

/**
 * Apply rate limiting to a request. Returns a 429 NextResponse if the
 * limit has been exceeded, or null if the request is allowed.
 *
 * The function is purposely simple: it does NOT use a global lock because
 * Node.js is single-threaded (no race conditions on Map mutations).
 */
export function rateLimit(
  request: Request,
  config: RateLimitConfig = {}
): NextResponse | null {
  const intervalMs = config.intervalMs ?? 60_000;
  const max = config.max ?? 10;
  const name = config.name ?? 'default';
  const logClientIp = config.logClientIp ?? true;
  const ip = getClientIp(request);
  if (ip === UNATTRIBUTED_CLIENT_IDENTITY && trustedClientIdentityRequired()) {
    return clientIdentityUnavailableResponse(name);
  }
  const identity = ip === UNATTRIBUTED_CLIENT_IDENTITY ? 'local-development' : ip;
  const key = `${name}:${identity}`;

  const now = Date.now();
  pruneStale(now, intervalMs);

  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { tokens: max, lastRefill: now };
    buckets.set(key, bucket);
  }

  // Refill tokens proportionally to elapsed time (token bucket).
  const elapsed = now - bucket.lastRefill;
  const refill = (elapsed / intervalMs) * max;
  bucket.tokens = Math.min(max, bucket.tokens + refill);
  bucket.lastRefill = now;

  if (bucket.tokens < 1) {
    const retryAfter = Math.ceil((1 - bucket.tokens) * (intervalMs / max) / 1000);
    console.warn(logClientIp
      ? `[RateLimit] ${name} - IP ${identity} rate-limited. Retry in ${retryAfter}s.`
      : `[RateLimit] ${name} rate-limited. Retry in ${retryAfter}s.`);
    return NextResponse.json(
      {
        error: 'Too many requests. Please slow down.',
        retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
        },
      }
    );
  }

  bucket.tokens -= 1;
  return null;
}
