import { NextRequest, NextResponse } from 'next/server';

const imageSources = [
  "'self'",
  'data:',
  'blob:',
  'https://logo.clearbit.com',
  'https://web.archive.org',
  'https://www.google.com',
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
  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    isDev ? "'unsafe-eval'" : '',
  ].filter(Boolean).join(' ');

  return compactCsp(`
    default-src 'none';
    base-uri 'self';
    object-src 'none';
    script-src ${scriptSrc};
    style-src 'self' https://fonts.googleapis.com;
    style-src-elem 'self' 'nonce-${nonce}' https://fonts.googleapis.com;
    style-src-attr 'unsafe-inline';
    font-src 'self' https://fonts.gstatic.com;
    img-src ${imageSources};
    connect-src 'self' https://generativelanguage.googleapis.com;
    frame-src 'self';
    manifest-src 'self';
    media-src 'self';
    worker-src 'self' blob:;
    form-action 'self';
    frame-ancestors ${isEmbed ? '*' : "'none'"};
    upgrade-insecure-requests;
  `);
}

export function proxy(request: NextRequest) {
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
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: [
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico|logo.png|robots.txt|sitemap.xml).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
