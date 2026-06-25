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
}

const buckets = new Map<string, Bucket>();

// Periodically prune stale buckets so memory doesn't grow unbounded.
const PRUNE_INTERVAL_MS = 5 * 60 * 1000; // 5 min
let lastPrune = Date.now();

/**
 * Removes stale buckets from the in-memory map to prevent unbounded
 * memory growth.  Runs at most once every `PRUNE_INTERVAL_MS`.
 *
 * @param now - Current timestamp in milliseconds.
 * @param ttlMs - The interval window; buckets older than 2× this are pruned.
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

/**
 * Extracts the client IP address from the request headers.
 * Checks `x-forwarded-for` first (reverse-proxy), then `x-real-ip`,
 * and falls back to `'unknown'` if neither is present.
 *
 * @param request - The incoming HTTP request.
 * @returns The client's IP address string.
 */
function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const real = request.headers.get('x-real-ip');
  if (real) return real;
  return 'unknown';
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
  const ip = getClientIp(request);
  const key = `${name}:${ip}`;

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
    console.warn(
      `[RateLimit] ${name} - IP ${ip} rate-limited. Retry in ${retryAfter}s.`
    );
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
