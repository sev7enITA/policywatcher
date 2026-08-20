import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_API_RESPONSE_HEADERS,
  AdminMutationRateLimiter,
  evaluateAdminMutationBoundary,
} from '@/lib/adminMutationBoundary';
import { getClientIp } from '@/lib/rateLimit';
import { COOKIE_NAME, verifySessionToken } from '@/lib/adminAuth';
import {
  INVESTOR_SESSION_COOKIE,
  verifyInvestorSessionToken,
} from '@/lib/investorAccess';
import { INVESTOR_RESPONSE_HEADERS } from '@/lib/investorMutationBoundary';
import {
  POLICYWATCHER_CANONICAL_ORIGIN,
  POLICYWATCHER_WWW_HOSTNAME,
  normalizeRequestHostname,
} from '@/lib/siteOrigin';

const adminMutationRateLimiter = new AdminMutationRateLimiter();
const STAGING_ROBOTS_HEADER = 'noindex, nofollow, noarchive';
const INTERNAL_STUDY_PATH = '/admin/executive-study';
const INTERNAL_STUDY_ROBOTS_HEADER = 'noindex, nofollow, noarchive, noimageindex';
const INVESTOR_ACCESS_PATH = '/investor/access';
const INVESTOR_STUDY_PATH = '/investor/executive-study';

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

function applyDeploymentResponseHeaders<T extends Response>(response: T): T {
  if (process.env.POLICYWATCHER_DEPLOYMENT_TARGET?.trim().toLowerCase() === 'staging') {
    response.headers.set('X-Robots-Tag', STAGING_ROBOTS_HEADER);
  }
  return response;
}

function applyInternalStudyResponseHeaders<T extends Response>(response: T): T {
  response.headers.set('Cache-Control', 'private, no-cache, no-store, max-age=0, must-revalidate');
  response.headers.set('X-Robots-Tag', INTERNAL_STUDY_ROBOTS_HEADER);
  return response;
}

function applyInvestorResponseHeaders<T extends Response>(response: T): T {
  for (const [name, value] of Object.entries(INVESTOR_RESPONSE_HEADERS)) {
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
  if (canonicalRedirect) return applyDeploymentResponseHeaders(NextResponse.redirect(canonicalRedirect, 308));

  if (request.nextUrl.pathname === '/associazioni') {
    const localizedUrl = request.nextUrl.clone();
    localizedUrl.pathname = '/it/associazioni';
    return applyDeploymentResponseHeaders(NextResponse.redirect(localizedUrl, 308));
  }

  if (request.nextUrl.pathname === INTERNAL_STUDY_PATH) {
    const session = verifySessionToken(request.cookies.get(COOKIE_NAME)?.value);
    if (!session.valid || (session.role !== 'admin' && session.role !== 'auditor')) {
      const response = NextResponse.redirect(new URL('/admin/login', request.url), 307);
      return applyDeploymentResponseHeaders(applyInternalStudyResponseHeaders(response));
    }
  }

  if (request.nextUrl.pathname === INVESTOR_STUDY_PATH) {
    const session = verifyInvestorSessionToken(request.cookies.get(INVESTOR_SESSION_COOKIE)?.value);
    if (!session.valid) {
      const response = NextResponse.redirect(new URL(INVESTOR_ACCESS_PATH, request.url), 307);
      return applyDeploymentResponseHeaders(applyInvestorResponseHeaders(response));
    }
  }

  if (request.nextUrl.pathname.startsWith('/api/admin/')) {
    return applyDeploymentResponseHeaders(handleAdminApi(request));
  }


  if (request.nextUrl.pathname.startsWith('/api/investor/')) {
    return applyDeploymentResponseHeaders(applyInvestorResponseHeaders(NextResponse.next()));
  }

  if (
    request.nextUrl.pathname.startsWith('/api/')
    || request.nextUrl.pathname === '/robots.txt'
    || request.nextUrl.pathname === '/sitemap.xml'
  ) {
    return applyDeploymentResponseHeaders(NextResponse.next());
  }

  const nonce = createNonce();
  const csp = createContentSecurityPolicy(nonce, request.nextUrl.pathname);
  const requestHeaders = new Headers(request.headers);

  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);
  requestHeaders.set('x-policywatcher-locale', request.nextUrl.pathname.startsWith('/it/') ? 'it' : 'en');

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set('Content-Security-Policy', csp);
  response.headers.set(
    'Referrer-Policy',
    request.nextUrl.pathname.startsWith('/office-addin/') || request.nextUrl.pathname.startsWith('/investor/')
      ? 'no-referrer'
      : 'strict-origin-when-cross-origin',
  );

  if (request.nextUrl.pathname === INTERNAL_STUDY_PATH) {
    applyInternalStudyResponseHeaders(response);
  }

  if (request.nextUrl.pathname.startsWith('/investor/')) {
    applyInvestorResponseHeaders(response);
  }

  return applyDeploymentResponseHeaders(response);
}

export const config = {
  matcher: [
    '/admin/executive-study',
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
