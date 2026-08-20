/**
 * Central policy for unsafe administrative API requests.
 *
 * This is deliberately a single-instance, in-memory boundary. It is defense in
 * depth for the current deployment shape, not a distributed rate limiter, a
 * CSRF certification, a penetration test, or proof of reverse-proxy behavior.
 */

import { MAX_RENDERER_PACKAGE_REQUEST_BYTES } from './vpsPackageContract';

export const ADMIN_API_RESPONSE_HEADERS = {
  'Cache-Control': 'private, no-store',
  'X-Content-Type-Options': 'nosniff',
  Vary: 'Origin, Sec-Fetch-Site',
} as const;

export const ADMIN_MUTATION_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'] as const;

type AdminMutationMethod = (typeof ADMIN_MUTATION_METHODS)[number];
type BodyMode = 'json' | 'optional-json' | 'none';

export type AdminMutationDenialReason =
  | 'cross_site_request'
  | 'origin_mismatch'
  | 'provenance_missing'
  | 'invalid_content_length'
  | 'payload_too_large'
  | 'json_content_type_required'
  | 'body_not_allowed';

export interface AdminMutationBoundaryInput {
  pathname: string;
  method: string;
  requestOrigin: string;
  originHeader: string | null;
  fetchSiteHeader: string | null;
  contentTypeHeader: string | null;
  contentLengthHeader: string | null;
  environment: string | undefined;
  /** Must only be enabled explicitly outside production for controlled tools/tests. */
  allowMissingProvenance: boolean;
}

export interface AdminMutationRoutePolicy {
  routeKey: string;
  maxBodyBytes: number;
  bodyMode: BodyMode;
}

export type AdminMutationBoundaryDecision =
  | {
      applies: false;
      allowed: true;
    }
  | {
      applies: true;
      allowed: true;
      policy: AdminMutationRoutePolicy;
    }
  | {
      applies: true;
      allowed: false;
      policy: AdminMutationRoutePolicy;
      reason: AdminMutationDenialReason;
      status: 400 | 403 | 413 | 415;
    };

const KIB = 1_024;
const MIB = 1_024 * KIB;
const DEFAULT_BODY_CAP = 64 * KIB;

const EXACT_ROUTE_CAPS: Record<string, number> = {
  '/api/admin/auth': 8 * KIB,
  '/api/admin/cron-status': 8 * KIB,
  '/api/admin/dashboard-telemetry': 8 * KIB,
  '/api/admin/webhook-delivery': 8 * KIB,
  '/api/admin/export-encrypted': 8 * KIB,
  '/api/admin/investor-access': 8 * KIB,
  '/api/admin/investor-access/[grantId]': 8 * KIB,
  // Base64-encoded Renderer packages are bounded to 5 MiB before forwarding.
  '/api/admin/vps-services': MAX_RENDERER_PACKAGE_REQUEST_BYTES,
  // Up to 100 bounded onboarding rows, including long official source URLs.
  '/api/admin/source-onboarding': 512 * KIB,
  // An encrypted database export is intentionally much larger than onboarding.
  '/api/admin/decrypt-backup': 32 * MIB,
};

function isMutationMethod(method: string): method is AdminMutationMethod {
  return ADMIN_MUTATION_METHODS.includes(method.toUpperCase() as AdminMutationMethod);
}

export function normalizeAdminMutationRoute(pathname: string): string {
  if (/^\/api\/admin\/investor-access\/[^/]+\/?$/.test(pathname)) {
    return '/api/admin/investor-access/[grantId]';
  }
  if (/^\/api\/admin\/source-onboarding\/[^/]+\/?$/.test(pathname)) {
    return '/api/admin/source-onboarding/[itemId]';
  }
  return pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

export function getAdminMutationRoutePolicy(pathname: string, method: string): AdminMutationRoutePolicy {
  const routeKey = normalizeAdminMutationRoute(pathname);
  let bodyMode: BodyMode = 'json';

  if (routeKey === '/api/admin/auth' && method.toUpperCase() === 'DELETE') {
    bodyMode = 'none';
  } else if (
    (routeKey === '/api/admin/cron-status' && method.toUpperCase() === 'POST')
    || (routeKey === '/api/admin/webhook-delivery' && method.toUpperCase() === 'POST')
  ) {
    bodyMode = 'optional-json';
  }

  return {
    routeKey,
    maxBodyBytes: EXACT_ROUTE_CAPS[routeKey] ?? DEFAULT_BODY_CAP,
    bodyMode,
  };
}

function declaredContentLength(raw: string | null): number | null | 'invalid' {
  if (raw === null) return null;
  const value = raw.trim();
  if (!/^\d+$/.test(value)) return 'invalid';
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) return 'invalid';
  return parsed;
}

function isJsonMediaType(raw: string | null): boolean {
  if (!raw) return false;
  const mediaType = raw.split(';', 1)[0]?.trim().toLowerCase() || '';
  return mediaType === 'application/json'
    || /^application\/[a-z0-9!#$&^_.+-]+\+json$/.test(mediaType);
}

function deny(
  policy: AdminMutationRoutePolicy,
  reason: AdminMutationDenialReason,
  status: 400 | 403 | 413 | 415,
): AdminMutationBoundaryDecision {
  return { applies: true, allowed: false, policy, reason, status };
}

export function evaluateAdminMutationBoundary(
  input: AdminMutationBoundaryInput,
): AdminMutationBoundaryDecision {
  const method = input.method.toUpperCase();
  if (!input.pathname.startsWith('/api/admin/') || !isMutationMethod(method)) {
    return { applies: false, allowed: true };
  }

  const policy = getAdminMutationRoutePolicy(input.pathname, method);
  const fetchSite = input.fetchSiteHeader?.trim().toLowerCase() || null;
  const origin = input.originHeader?.trim() || null;
  // Sec-Fetch-Site is computed by the browser from the public-facing URL.
  // Prefer its exact same-origin assertion when a reverse proxy rewrites the
  // host or protocol seen by Next.js, making request.nextUrl.origin differ
  // from the browser's otherwise valid Origin header.
  const browserAssertsSameOrigin = fetchSite === 'same-origin';

  if (fetchSite === 'cross-site') {
    return deny(policy, 'cross_site_request', 403);
  }
  if (origin && origin !== input.requestOrigin && !browserAssertsSameOrigin) {
    return deny(policy, 'origin_mismatch', 403);
  }

  const trustedProvenance = browserAssertsSameOrigin
    || origin === input.requestOrigin
    || (!origin && fetchSite === 'same-site');
  const controlledNonProductionPath = input.environment !== 'production'
    && input.allowMissingProvenance;
  if (!trustedProvenance && !controlledNonProductionPath) {
    return deny(policy, 'provenance_missing', 403);
  }

  const contentLength = declaredContentLength(input.contentLengthHeader);
  if (contentLength === 'invalid') {
    return deny(policy, 'invalid_content_length', 400);
  }
  if (contentLength !== null && contentLength > policy.maxBodyBytes) {
    return deny(policy, 'payload_too_large', 413);
  }

  if (policy.bodyMode === 'none') {
    if ((contentLength !== null && contentLength > 0) || input.contentTypeHeader !== null) {
      return deny(policy, 'body_not_allowed', 400);
    }
    return { applies: true, allowed: true, policy };
  }

  const declaredBody = contentLength !== null && contentLength > 0;
  const contentTypeSupplied = Boolean(input.contentTypeHeader?.trim());
  if (
    policy.bodyMode === 'json'
    || declaredBody
    || contentTypeSupplied
  ) {
    if (!isJsonMediaType(input.contentTypeHeader)) {
      return deny(policy, 'json_content_type_required', 415);
    }
  }

  return { applies: true, allowed: true, policy };
}

interface MutationBucket {
  count: number;
  windowStartedAt: number;
}

export interface AdminMutationRateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

/**
 * Fixed-window limiter with bounded storage. Keys are never logged by this
 * module. Instantiate separately in tests; the proxy uses one process-local
 * instance for the current single-instance deployment.
 */
export class AdminMutationRateLimiter {
  private readonly buckets = new Map<string, MutationBucket>();

  constructor(
    private readonly windowMs = 60_000,
    private readonly maxRequests = 120,
    private readonly maxBuckets = 2_048,
  ) {}

  check(key: string, now = Date.now()): AdminMutationRateLimitResult {
    const existing = this.buckets.get(key);
    if (!existing || now - existing.windowStartedAt >= this.windowMs) {
      if (!existing && this.buckets.size >= this.maxBuckets) {
        const oldestKey = this.buckets.keys().next().value as string | undefined;
        if (oldestKey) this.buckets.delete(oldestKey);
      }
      this.buckets.set(key, { count: 1, windowStartedAt: now });
      return { allowed: true, retryAfterSeconds: 0 };
    }

    if (existing.count >= this.maxRequests) {
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, Math.ceil((this.windowMs - (now - existing.windowStartedAt)) / 1_000)),
      };
    }

    existing.count += 1;
    return { allowed: true, retryAfterSeconds: 0 };
  }

  clear(): void {
    this.buckets.clear();
  }
}
