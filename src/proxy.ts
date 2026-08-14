import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_API_RESPONSE_HEADERS,
  AdminMutationRateLimiter,
  evaluateAdminMutationBoundary,
} from '@/lib/adminMutationBoundary';
import { getClientIp } from '@/lib/rateLimit';
import {
  POLICYWATCHER_CANONICAL_ORIGIN,
  POLICYWATCHER_WWW_HOSTNAME,
  normalizeRequestHostname,
} from '@/lib/siteOrigin';

const adminMutationRateLimiter = new AdminMutationRateLimiter();

const imageSources = [
  "'self'",
  'data:',
  'blob:',
  'https://logo.clearbit.com',
  'https://web.archive.org',
  'https://www.google.com',
  'https://*.gstatic.com',
  'https://github.com',
  'https://api.scorecard.dev',
  'https://www.bestpractices.dev',
  'https://sonarcloud.io',
  'https://codecov.io',
  'https://img.shields.io',
].join(' ');

function createNonce() {
  return btoa(crypto.randomUUID());
}

function compactCsp(value: string) {
  return value.replace(/\s{2,}/g, ' ').trim();
}

function createContentSecurityPolicy(nonce: string, pathname: string) {
  const isDev = process.env.NODE_ENV === 'development';
  const isEmbed = pathname.startsWith('/embed/');
  const isOfficeAddin = pathname.startsWith('/office-addin/');
  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    isOfficeAddin ? 'https://appsforoffice.microsoft.com' : '',
    isDev ? "'unsafe-eval'" : '',
  ].filter(Boolean).join(' ');
  const styleElemSrc = isDev
    ? "'self' https://fonts.googleapis.com 'unsafe-inline'"
    : `'self' 'nonce-${nonce}' https://fonts.googleapis.com`;

  return compactCsp(`
    default-src 'none';
    base-uri 'self';
    object-src 'none';
    script-src ${scriptSrc};
    style-src 'self' https://fonts.googleapis.com;
    style-src-elem ${styleElemSrc};
    style-src-attr 'unsafe-inline';
    font-src 'self' https://fonts.gstatic.com;
    img-src ${imageSources};
    connect-src ${isOfficeAddin ? "'self'" : "'self' https://generativelanguage.googleapis.com"};
    frame-src 'self';
    manifest-src 'self';
    media-src 'self';
    worker-src 'self' blob:;
    form-action 'self';
    frame-ancestors ${isEmbed
      ? '*'
      : isOfficeAddin
        ? "https://*.office.com https://*.officeapps.live.com https://*.microsoft365.com https://*.microsoft.com"
        : "'none'"};
    upgrade-insecure-requests;
  `);
}

function applyAdminApiResponseHeaders(response: NextResponse) {
  for (const [name, value] of Object.entries(ADMIN_API_RESPONSE_HEADERS)) {
    response.headers.set(name, value);
  }
  return response;
}

function adminMutationError(
  reason: string,
  status: number,
  retryAfterSeconds?: number,
) {
  const response = NextResponse.json(
    { error: 'Administrative mutation request rejected.', reason },
    { status },
  );
  if (retryAfterSeconds) response.headers.set('Retry-After', String(retryAfterSeconds));
  return applyAdminApiResponseHeaders(response);
}

function handleAdminApi(request: NextRequest): NextResponse {
  const decision = evaluateAdminMutationBoundary({
    pathname: request.nextUrl.pathname,
    method: request.method,
    requestOrigin: request.nextUrl.origin,
    originHeader: request.headers.get('origin'),
    fetchSiteHeader: request.headers.get('sec-fetch-site'),
    contentTypeHeader: request.headers.get('content-type'),
    contentLengthHeader: request.headers.get('content-length'),
    environment: process.env.NODE_ENV,
    allowMissingProvenance:
      process.env.NODE_ENV !== 'production'
      && process.env.ADMIN_MUTATION_ALLOW_MISSING_PROVENANCE === 'true',
  });

  if (decision.applies && !decision.allowed) {
    console.warn('[Admin mutation boundary] request denied', {
      route: decision.policy.routeKey,
      method: request.method.toUpperCase(),
      reason: decision.reason,
    });
    return adminMutationError(decision.reason, decision.status);
  }

  if (decision.applies) {
    const rateLimit = adminMutationRateLimiter.check(
      `${getClientIp(request)}:${request.method.toUpperCase()}:${decision.policy.routeKey}`,
    );
    if (!rateLimit.allowed) {
      console.warn('[Admin mutation boundary] request denied', {
        route: decision.policy.routeKey,
        method: request.method.toUpperCase(),
        reason: 'mutation_rate_limited',
      });
      return adminMutationError('mutation_rate_limited', 429, rateLimit.retryAfterSeconds);
    }
  }

  return applyAdminApiResponseHeaders(NextResponse.next());
}

export function getCanonicalHostRedirect(request: NextRequest): URL | null {
  // Existing published integrations may pin the legacy API hostname and reject
  // redirects. API responses are not canonical HTML surfaces, so preserve this
  // compatibility path while consolidating every crawlable page and discovery file.
  if (request.nextUrl.pathname.startsWith('/api/')) return null;

  const forwardedHostname = normalizeRequestHostname(request.headers.get('x-forwarded-host'));
  const hostHostname = normalizeRequestHostname(request.headers.get('host'));
  const requestHostname = request.nextUrl.hostname.toLowerCase().replace(/\.$/, '');
  const observedHostnames = [forwardedHostname, hostHostname, requestHostname];

  if (!observedHostnames.includes(POLICYWATCHER_WWW_HOSTNAME)) return null;

  return new URL(`${request.nextUrl.pathname}${request.nextUrl.search}`, `${POLICYWATCHER_CANONICAL_ORIGIN}/`);
}

export function proxy(request: NextRequest) {
  const canonicalRedirect = getCanonicalHostRedirect(request);
  if (canonicalRedirect) return NextResponse.redirect(canonicalRedirect, 308);

  if (request.nextUrl.pathname.startsWith('/api/admin/')) {
    return handleAdminApi(request);
  }

  if (
    request.nextUrl.pathname.startsWith('/api/')
    || request.nextUrl.pathname === '/robots.txt'
    || request.nextUrl.pathname === '/sitemap.xml'
  ) {
    return NextResponse.next();
  }

  const nonce = createNonce();
  const csp = createContentSecurityPolicy(nonce, request.nextUrl.pathname);
  const requestHeaders = new Headers(request.headers);

  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set('Content-Security-Policy', csp);
  response.headers.set(
    'Referrer-Policy',
    request.nextUrl.pathname.startsWith('/office-addin/') ? 'no-referrer' : 'strict-origin-when-cross-origin',
  );

  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
    '/robots.txt',
    '/sitemap.xml',
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico|logo.png|robots.txt|sitemap.xml).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
