import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { getCanonicalHostRedirect, proxy } from '../../proxy';
import {
  POLICYWATCHER_CANONICAL_HOSTNAME,
  POLICYWATCHER_CANONICAL_ORIGIN,
  normalizeRequestHostname,
  policyWatcherUrl,
} from '../siteOrigin';

const read = (path: string) => readFileSync(path, 'utf8');

const staticCanonicalFiles = new Map<string, string>([
  ['/', 'src/app/page.tsx'],
  ['/associazioni', 'src/app/associazioni/page.tsx'],
  ['/evidence', 'src/app/evidence/page.tsx'],
  ['/collections', 'src/app/collections/page.tsx'],
  ['/showcase', 'src/app/showcase/page.tsx'],
  ['/atlas', 'src/app/atlas/page.tsx'],
  ['/feature-atlas', 'src/app/feature-atlas/page.tsx'],
  ['/observatory', 'src/app/observatory/page.tsx'],
  ['/developers', 'src/app/developers/page.tsx'],
  ['/developers/event-continuity', 'src/app/developers/event-continuity/page.tsx'],
  ['/developers/webhook-readiness', 'src/app/developers/webhook-readiness/page.tsx'],
  ['/integrations', 'src/app/integrations/page.tsx'],
  ['/timeline', 'src/app/timeline/layout.tsx'],
  ['/what-changed', 'src/app/what-changed/page.tsx'],
  ['/browser-extension', 'src/app/browser-extension/page.tsx'],
  ['/leaderboard', 'src/app/leaderboard/page.tsx'],
  ['/trust', 'src/app/trust/page.tsx'],
  ['/trust/residency', 'src/app/trust/residency/page.tsx'],
  ['/infographics', 'src/app/infographics/layout.tsx'],
  ['/roadmap', 'src/app/roadmap/page.tsx'],
  ['/press', 'src/app/press/page.tsx'],
  ['/press-kit', 'src/app/press-kit/page.tsx'],
  ['/pulse', 'src/app/pulse/page.tsx'],
  ['/press-kit/releases', 'src/app/press-kit/releases/page.tsx'],
  ['/press-kit/data', 'src/app/press-kit/data/page.tsx'],
  ['/press-kit/reference', 'src/app/press-kit/reference/page.tsx'],
  ['/press-kit/corrections', 'src/app/press-kit/corrections/page.tsx'],
  ['/press-kit/glossary', 'src/app/press-kit/glossary/page.tsx'],
  ['/about', 'src/app/about/page.tsx'],
  ['/methodology/confidence', 'src/app/methodology/confidence/layout.tsx'],
  ['/security', 'src/app/security/page.tsx'],
  ['/privacy', 'src/app/privacy/page.tsx'],
  ['/terms', 'src/app/terms/page.tsx'],
  ['/knowledge', 'src/app/knowledge/page.tsx'],
]);

describe('public canonical URL contract', () => {
  it('uses one immutable non-www HTTPS origin', () => {
    expect(POLICYWATCHER_CANONICAL_ORIGIN).toBe('https://policywatcher.online');
    expect(POLICYWATCHER_CANONICAL_HOSTNAME).toBe('policywatcher.online');
    expect(policyWatcherUrl('/trust')).toBe('https://policywatcher.online/trust');
    expect(normalizeRequestHostname('WWW.PolicyWatcher.Online:443')).toBe('www.policywatcher.online');
    expect(normalizeRequestHostname('www.policywatcher.online, internal-proxy')).toBe('www.policywatcher.online');
  });

  it('permanently redirects crawlable www routes while preserving path and query', () => {
    const request = new NextRequest('https://www.policywatcher.online/change/example?lang=it');
    const target = getCanonicalHostRedirect(request);
    const response = proxy(request);

    expect(target?.toString()).toBe('https://policywatcher.online/change/example?lang=it');
    expect(response.status).toBe(308);
    expect(response.headers.get('location')).toBe('https://policywatcher.online/change/example?lang=it');
  });

  it('honors the proxy-facing host header and keeps legacy API clients compatible', () => {
    const forwarded = new NextRequest('http://127.0.0.1:3000/robots.txt', {
      headers: { 'X-Forwarded-Host': 'www.policywatcher.online' },
    });
    const legacyApi = new NextRequest('https://www.policywatcher.online/api/policy-inquiries', { method: 'POST' });

    expect(getCanonicalHostRedirect(forwarded)?.toString()).toBe('https://policywatcher.online/robots.txt');
    expect(getCanonicalHostRedirect(legacyApi)).toBeNull();
    expect(proxy(legacyApi).headers.get('location')).toBeNull();
  });

  it('gives every literal static sitemap route explicit canonical metadata', () => {
    for (const [route, file] of staticCanonicalFiles) {
      expect(read(file), `${route} (${file})`).toContain('alternates: { canonical:');
    }
  });

  it('keeps sitemap URLs canonical and last-modified values evidence-backed', () => {
    const sitemap = read('src/app/sitemap.ts');
    const robots = read('src/app/robots.ts');
    expect(sitemap).toContain('const BASE_URL = POLICYWATCHER_CANONICAL_ORIGIN');
    expect(sitemap).toContain("import { POLICYWATCHER_CANONICAL_ORIGIN } from '@/lib/siteOrigin'");
    expect(sitemap).not.toContain('process.env.NEXT_PUBLIC_APP_URL');
    expect(sitemap).not.toContain('lastModified: new Date()');
    expect(sitemap).toMatch(/url: `\$\{BASE_URL\}\/change\/\$\{c\.id\}`/);
    expect(sitemap).not.toContain('/change/${c.id}?lang=en');
    expect(sitemap).toMatch(/url: `\$\{BASE_URL\}\/evidence\/\$\{c\.id\}`/);
    expect(robots).toContain("import { POLICYWATCHER_CANONICAL_ORIGIN } from '@/lib/siteOrigin'");
    expect(robots).toMatch(/sitemap: `\$\{POLICYWATCHER_CANONICAL_ORIGIN\}\/sitemap\.xml`/);
    expect(robots).toContain('host: POLICYWATCHER_CANONICAL_ORIGIN');
    expect(robots).not.toContain('NEXT_PUBLIC_APP_URL');
  });

  it('keeps localized public records self-canonical and utility routes out of the index', () => {
    const change = read('src/app/change/[id]/page.tsx');
    const pulse = read('src/app/pulse/[slug]/page.tsx');
    expect(change).toContain("canonical = lang === 'it' ? italianUrl : englishUrl");
    expect(change).toContain("languages: {");
    expect(pulse).toContain("canonical = lang === 'it' ? italianUrl : englishUrl");
    expect(pulse).toContain("languages: { en: englishUrl, it: italianUrl, 'x-default': englishUrl }");
    expect(read('src/app/unsubscribe/layout.tsx')).toContain('robots: { index: false');
    expect(read('src/app/office-addin/contract-review/page.tsx')).toContain('robots: { index: false');
  });

  it('aligns well-known discovery and the Hostinger artifact contract', () => {
    const security = read('public/.well-known/security.txt');
    const packaging = read('scripts/package-release.sh');
    expect(security).toContain('Canonical: https://policywatcher.online/.well-known/security.txt');
    expect(security).toContain('Policy: https://policywatcher.online/security');
    expect(security).not.toContain('https://www.policywatcher.online');
    for (const required of [
      'src/lib/siteOrigin.ts',
      'src/proxy.ts',
      'src/app/infographics/layout.tsx',
      'src/app/methodology/confidence/layout.tsx',
      'src/app/timeline/layout.tsx',
      'src/app/unsubscribe/layout.tsx',
      'public/.well-known/security.txt',
    ]) {
      expect(packaging, required).toContain(required);
    }
  });
});
