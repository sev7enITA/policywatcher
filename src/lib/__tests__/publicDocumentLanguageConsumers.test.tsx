import { createHash } from 'node:crypto';
import { useEffect } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const context = vi.hoisted(() => ({
  pathname: '/press', query: new URLSearchParams(), requestHeaders: new Headers(),
  findFirst: vi.fn(),
}));
vi.mock('@/lib/db', () => ({ db: { policyChange: { findFirst: context.findFirst } } }));
vi.mock('next/font/google', () => ({ Titillium_Web: () => ({ variable: 'test-font' }) }));
vi.mock('next/headers', () => ({ headers: async () => context.requestHeaders }));
vi.mock('next/server', async original => ({ ...await original<typeof import('next/server')>(), connection: async () => {} }));
vi.mock('next/navigation', () => ({
  usePathname: () => context.pathname,
  useSearchParams: () => context.query,
  notFound: () => { throw new Error('TEST_NOT_FOUND'); },
}));
vi.mock('react', async original => ({ ...await original<typeof import('react')>(), useEffect: vi.fn() }));

import { NextRequest } from 'next/server';
import { proxy } from '../../proxy';
import RootLayout from '@/app/layout';
import DocumentLanguage from '@/components/DocumentLanguage';
import { publicNavigationPath, publicRequestLanguage } from '../seo';
import { pressCoverageRecords } from '../pressCoverage';

const id = '7db948e3-a96e-4118-85d0-41c51c80796f';
const policyId = 'fixture-policy';
const before = 'This synthetic source retains data for thirty days.';
const after = 'This synthetic source retains data for sixty days.';
const digest = (text: string) => createHash('sha256').update(text).digest('hex');
const pair = { before: digest(before), after: digest(after), from: '1', to: '2' };
const record = {
  policyId, diff: '-thirty\n+sixty', riskReasonsJson: null,
  publicPublishedAt: new Date('2026-11-20T12:00:00Z'),
  policy: { url: 'https://example.invalid/policy', name: 'Synthetic policy', jurisdiction: 'EU', company: { name: 'Fixture company' } },
  oldSnapshot: { id: 'old', policyId, text: before, publicEvidence: true, version: 1 },
  newSnapshot: { id: 'new', policyId, text: after, publicEvidence: true, version: 2 },
};

async function renderedDocument(pathname: string, query: Record<string, string>, child: React.ReactNode) {
  context.pathname = pathname;
  context.query = new URLSearchParams(query);
  const response = proxy(new NextRequest(`https://policywatcher.online${pathname}?${context.query}`));
  const forwarded = response.headers.get('x-middleware-request-x-policywatcher-locale');
  expect(forwarded).not.toBeNull();
  context.requestHeaders = new Headers({ 'x-policywatcher-locale': forwarded! });
  return renderToStaticMarkup(await RootLayout({ children: child }));
}

function runDocumentLanguageEffect(pathname: string, query: Record<string, string>) {
  context.pathname = pathname;
  context.query = new URLSearchParams(query);
  vi.mocked(useEffect).mockClear();
  const document = { documentElement: { lang: 'uninitialized' } };
  vi.stubGlobal('document', document);
  // Invoke the actual component with controlled routing hooks, then its registered effect.
  // This is an effect-unit boundary, not browser hydration or a React scheduling test.
  expect(DocumentLanguage()).toBeNull();
  const call = vi.mocked(useEffect).mock.calls.at(-1);
  expect(call).toBeDefined();
  call![0]();
  return document.documentElement.lang;
}

beforeEach(() => { context.findFirst.mockReset().mockResolvedValue(record); });
afterEach(() => { vi.unstubAllGlobals(); });

const locales = [undefined, 'en', 'it', 'de'] as const;

describe('actual localized route consumers and document-language bridge', () => {
  it.each(locales)('renders press registry and its document/metadata consistently for lang=%s', async requested => {
    const { default: Page, generateMetadata } = await import('@/app/press/page');
    const lang = requested === 'it' ? 'it' : 'en';
    const query: Record<string, string> = requested ? { lang: requested } : {};
    const props = { searchParams: Promise.resolve(query) };
    const html = await renderedDocument('/press', query, await Page(props));
    expect(html).toContain(`<html lang="${lang}"`);
    expect(html).toContain(lang === 'it' ? 'Rassegna stampa' : 'Coverage Registry');
    const metadata = await generateMetadata(props);
    expect(metadata.alternates?.canonical).toBe(`https://policywatcher.online/press${lang === 'it' ? '?lang=it' : ''}`);
    expect(metadata.openGraph?.locale).toBe(lang === 'it' ? 'it_IT' : 'en_US');
    expect(runDocumentLanguageEffect('/press', query)).toBe(lang);
  });

  it.each(pressCoverageRecords.filter(record => record.caseSlug).map(record => record.caseSlug!))('renders the real %s case template in both languages with matching canonical and document', async slug => {
    const { default: Page, generateMetadata } = await import('@/app/press/cases/[slug]/page');
    for (const requested of locales) {
      const lang = requested === 'it' ? 'it' : 'en';
      const query: Record<string, string> = requested ? { lang: requested } : {};
      const props = { params: Promise.resolve({ slug }), searchParams: Promise.resolve(query) };
      const pathname = `/press/cases/${slug}`;
      const html = await renderedDocument(pathname, query, await Page(props));
      expect(html).toContain(`<html lang="${lang}"`);
      expect(html).toContain(`<main lang="${lang}"`);
      expect(html).toContain(lang === 'it' ? 'Articolo originale' : 'Original article');
      expect(html).toContain(`href="/press?lang=${lang}#registry"`);
      const metadata = await generateMetadata(props);
      expect(metadata.alternates?.canonical).toBe(`https://policywatcher.online${pathname}${lang === 'it' ? '?lang=it' : ''}`);
      expect(metadata.alternates?.languages?.it).toBe(`https://policywatcher.online${pathname}?lang=it`);
      expect(metadata.openGraph?.locale).toBe(lang === 'it' ? 'it_IT' : 'en_US');
      expect(metadata.title).toContain(slug === 'meta-ai' ? 'Meta' : 'TikTok');
      expect(runDocumentLanguageEffect(pathname, query)).toBe(lang);
    }
  });

  it.each(locales)('renders a valid public comparison with complete identity, noindex and lang=%s', async requested => {
    const { default: Page, generateMetadata } = await import('@/app/briefing/comparison/[id]/page');
    const lang = requested === 'it' ? 'it' : 'en';
    const query = { ...pair, ...(requested ? { lang: requested } : {}) };
    const props = { params: Promise.resolve({ id }), searchParams: Promise.resolve(query) };
    const pathname = `/briefing/comparison/${id}`;
    const html = await renderedDocument(pathname, query, await Page(props));
    expect(html).toContain(`<html lang="${lang}"`);
    expect(html).toContain(`lang="${lang}"`);
    expect(html).toContain(lang === 'it' ? 'Versioni condivise' : 'Shared versions');
    expect(html).toContain(`href="/briefing?lang=${lang}"`);
    const metadata = await generateMetadata(props);
    expect(metadata.robots).toEqual({ index: false });
    const canonical = new URL(String(metadata.alternates?.canonical));
    expect(canonical.pathname).toBe(pathname);
    for (const [key, value] of Object.entries(pair)) expect(canonical.searchParams.get(key)).toBe(value);
    expect(canonical.searchParams.get('lang')).toBe(lang === 'it' ? 'it' : null);
    const italianAlternate = new URL(String(metadata.alternates?.languages?.it));
    expect(italianAlternate.searchParams.get('lang')).toBe('it');
    for (const [key, value] of Object.entries(pair)) expect(italianAlternate.searchParams.get(key)).toBe(value);
    expect(runDocumentLanguageEffect(pathname, query)).toBe(lang);
  });

  it('keeps unrelated English-only and protected destinations outside the new allowlist', () => {
    for (const path of ['/developers', '/privacy', '/admin/engine', '/investor/access', '/press/unknown', '/press/cases/example/deep', '/briefing/comparison/id/deep']) {
      expect(publicRequestLanguage(path, 'it')).toBe('en');
      expect(publicNavigationPath(path, 'it')).toBe(path);
    }
    expect(publicNavigationPath('/press#registry', 'it')).toBe('/press?lang=it#registry');
    expect(publicNavigationPath('/press/cases/meta-ai', 'it')).toBe('/press/cases/meta-ai?lang=it');
    expect(publicNavigationPath(`/briefing/comparison/${id}?before=${pair.before}&after=${pair.after}&from=1&to=2`, 'it')).toContain('&lang=it');
  });

  it('does not turn unavailable or unverified records into valid localized pages', async () => {
    const page = await import('@/app/press/cases/[slug]/page');
    const unknown = { params: Promise.resolve({ slug: 'not-a-real-case' }), searchParams: Promise.resolve({ lang: 'it' }) };
    await expect(page.default(unknown)).rejects.toThrow('TEST_NOT_FOUND');
    await expect(page.generateMetadata(unknown)).rejects.toThrow('TEST_NOT_FOUND');
    const comparison = await import('@/app/briefing/comparison/[id]/page');
    const props = { params: Promise.resolve({ id }), searchParams: Promise.resolve({ ...pair, lang: 'it' }) };
    context.findFirst.mockResolvedValueOnce(null);
    await expect(comparison.default(props)).rejects.toThrow('TEST_NOT_FOUND');
    context.findFirst.mockResolvedValueOnce({ ...record, oldSnapshot: { ...record.oldSnapshot, publicEvidence: false } });
    await expect(comparison.default(props)).rejects.toThrow('TEST_NOT_FOUND');
    const bad = { params: Promise.resolve({ id }), searchParams: Promise.resolve({ ...pair, from: '01', lang: 'it' }) };
    await expect(comparison.default(bad)).rejects.toThrow('TEST_NOT_FOUND');
    await expect(comparison.generateMetadata(bad)).rejects.toThrow('TEST_NOT_FOUND');
    const malformed = { params: Promise.resolve({ id }), searchParams: Promise.resolve({ lang: 'it' }) };
    await expect(comparison.generateMetadata(malformed)).rejects.toThrow('TEST_NOT_FOUND');
  });
});
