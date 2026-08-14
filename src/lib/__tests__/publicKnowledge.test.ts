import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import HomeKnowledgeSnapshot from '../../components/HomeKnowledgeSnapshot';
import { isUuid, safePublicUrl, serializeJsonLd, type PublicKnowledgeHub } from '../publicKnowledge';

const read = (path: string) => readFileSync(path, 'utf8');

describe('crawlable public knowledge layer', () => {
  it('uses the canonical public gates for policies, changes and snapshots', () => {
    const data = read('src/lib/publicKnowledge.ts');
    expect(data).toContain("import { publicChangeWhere, publicPolicyWhere, publicSnapshotWhere }");
    expect(data.match(/publicPolicyWhere\(/g)?.length).toBeGreaterThanOrEqual(5);
    expect(data.match(/publicChangeWhere\(/g)?.length).toBeGreaterThanOrEqual(6);
    expect(data.match(/publicSnapshotWhere\(/g)?.length).toBeGreaterThanOrEqual(4);
    expect(data).toContain('where: publicPolicyWhere({ id: policyId, company: { slug: companySlug } })');
  });

  it('keeps private and operational fields outside public knowledge selections', () => {
    const data = read('src/lib/publicKnowledge.ts');
    for (const field of ['currentText', 'diff:', 'adminNote', 'attemptsJson', 'reasonCode', 'retrievalUrl', 'checkLogs']) {
      expect(data, field).not.toContain(field);
    }
    expect(data).toContain('select: { version: true, hash: true, createdAt: true }');
  });

  it('validates UUIDs before the policy database query and emits real 404 states', () => {
    const data = read('src/lib/publicKnowledge.ts');
    const queryOffset = data.indexOf('db.policy.findFirst');
    expect(data.indexOf('if (!isUuid(policyId)) return null;')).toBeLessThan(queryOffset);
    expect(isUuid('8a94ce6b-4415-4d62-83d2-e87a4040ae62')).toBe(true);
    expect(isUuid('../admin')).toBe(false);

    const policyPage = read('src/app/knowledge/companies/[slug]/policies/[id]/page.tsx');
    const companyPage = read('src/app/knowledge/companies/[slug]/page.tsx');
    expect(policyPage).toContain('if (!isUuid(id)) notFound();');
    expect(policyPage).toContain('if (!unavailable && !policy) notFound();');
    expect(companyPage).toContain('if (!unavailable && !company) notFound();');
  });

  it('renders explicit empty and unavailable states without internal diagnostics', () => {
    const hub = read('src/app/knowledge/page.tsx');
    const home = read('src/components/HomeKnowledgeSnapshot.tsx');
    expect(hub).toContain("data.availability === 'empty'");
    expect(hub).toContain('Public knowledge inventory temporarily unavailable');
    expect(hub).toContain('This is an empty publication state, not a healthy-data claim.');
    expect(home).toContain('This is an empty evidence state, not a positive data-quality status.');
    expect(hub).not.toMatch(/DATABASE_URL|production\.db|sqlite|SELECT\s|PRAGMA/i);
  });

  it('serializes JSON-LD safely and keeps structured claims visible on the page', () => {
    const serialized = serializeJsonLd({ name: '</script><script>alert(1)</script>' });
    expect(serialized).not.toContain('<');
    expect(serialized).toContain('\\u003c/script>');

    const hub = read('src/app/knowledge/page.tsx');
    expect(hub).toContain("'@type': 'CollectionPage'");
    expect(hub).toContain("'@type': 'Dataset'");
    expect(hub).toContain("'@type': 'ItemList'");
    expect(hub).toContain('Companies: ${data.counts.companies}');
    expect(hub).toContain('{data.counts.companies}');

    const company = read('src/app/knowledge/companies/[slug]/page.tsx');
    const policy = read('src/app/knowledge/companies/[slug]/policies/[id]/page.tsx');
    expect(company).toContain("'@type': 'Organization'");
    expect(policy).toContain("'@type': 'DigitalDocument'");
    expect(policy).toContain('Raw policy text is not reproduced.');
    expect(company).toContain('<Link href="/methodology/confidence">Publication methodology</Link>');
    expect(company).toContain('<Link href="/evidence">Public evidence register</Link>');
    expect(policy).toContain('<Link href="/methodology/confidence">Publication methodology</Link>');
    expect(policy).toContain('href={`/evidence/${change.id}`}');
    expect(policy).toContain("about: { '@type': 'Organization', name: policy.company.name }");
  });

  it('rejects unsafe official-source schemes', () => {
    expect(safePublicUrl('javascript:alert(1)')).toBeNull();
    expect(safePublicUrl('file:///tmp/private')).toBeNull();
    expect(safePublicUrl('https://example.com/policy')).toBe('https://example.com/policy');
  });

  it('publishes crawler rules without reopening protected or mutation routes', () => {
    const robots = read('src/app/robots.ts');
    expect(robots).toContain("userAgent: 'OAI-SearchBot'");
    expect(robots).toContain("userAgent: 'PerplexityBot'");
    for (const route of ['/admin', '/api/admin', '/api/cron', '/api/scrape', '/api/seed', '/api/subscribers', '/api/policy-inquiries', '/api/v2']) {
      expect(robots).toContain(`'${route}'`);
    }
    expect(robots).toContain("allow: '/'");
  });

  it('publishes concise llms guidance with evidence and citation boundaries', () => {
    const llms = read('src/app/llms.txt/route.ts');
    expect(llms).toContain('## Canonical public sections');
    expect(llms).toContain('## Machine-readable public access');
    expect(llms).toContain('## Evidence boundary');
    expect(llms).toContain('## Citation guidance');
    expect(llms).toContain('do not expose raw policy text, internal logs, raw failures, admin notes, credentials');
  });

  it('adds stable entity discovery to sitemap and public navigation', () => {
    const sitemap = read('src/app/sitemap.ts');
    expect(sitemap).toContain('where: publicPolicyWhere()');
    expect(sitemap).toContain('/knowledge/companies/${policy.company.slug}/policies/${policy.id}');
    expect(sitemap).toContain('/knowledge/companies/${slug}');
    expect(sitemap).toContain('lastSuccessfulCheckDate');

    expect(read('src/components/PublicHeader.tsx')).toContain("{ id: 'knowledge', href: '/knowledge'");
    expect(read('src/components/Footer.tsx')).toContain('href="/knowledge"');
    expect(read('src/lib/publicSections.ts')).toContain("id: 'knowledge'");
  });

  it('renders the public home snapshot as raw semantic HTML with entity links', () => {
    const data = {
      availability: 'available',
      counts: { companies: 1, policies: 1, baselines: 1, changes: 0 },
      lastObservedAt: '2026-07-31T08:00:00.000Z',
      lastVerifiedAt: '2026-07-31T08:00:00.000Z',
      dateModified: '2026-07-31T08:00:00.000Z',
      companies: [{
        id: 'company-1', name: 'Example Provider', slug: 'example-provider', industry: 'Technology',
        officialWebsiteUrl: 'https://example.com/', publicPolicyCount: 1, lastObservedAt: '2026-07-31T08:00:00.000Z',
      }],
      policies: [{
        id: '22222222-2222-4222-8222-222222222222', name: 'Privacy Policy', type: 'privacy', jurisdiction: 'EU',
        officialSourceUrl: 'https://example.com/privacy', dataStatus: 'Reviewed', ingestionMethod: 'Direct Scrape',
        lastCheckedAt: '2026-07-31T08:00:00.000Z', lastRetrievedAt: '2026-07-31T08:00:00.000Z',
        latestBaselineAt: '2026-07-31T08:00:00.000Z', publishedChangeCount: 0,
        company: { name: 'Example Provider', slug: 'example-provider' },
      }],
      recentChanges: [],
    } satisfies PublicKnowledgeHub;

    const html = renderToStaticMarkup(createElement('main', null, createElement(HomeKnowledgeSnapshot, { data })));
    expect(html.match(/<main/g)).toHaveLength(1);
    expect(html).toContain('<section');
    expect(html).toContain('Crawlable public knowledge');
    expect(html).toContain('href="/knowledge"');
    expect(html).toContain('href="/knowledge/companies/example-provider"');
    expect(html).toContain('href="/knowledge/companies/example-provider/policies/22222222-2222-4222-8222-222222222222"');
    expect(html).not.toContain('<script');
  });

  it('keeps one server main outside the gated interactive dashboard', () => {
    const route = read('src/app/page.tsx');
    const dashboard = read('src/app/DashboardClient.tsx');
    expect(route).not.toContain("'use client'");
    expect(route).toContain('<main className={styles.publicKnowledgeMain}>');
    expect(route).toContain('<HomeKnowledgeSnapshot data={knowledge} />');
    expect(route).toContain('<DashboardClient />');
    expect(route.indexOf('<HomeKnowledgeSnapshot data={knowledge} />')).toBeLessThan(route.indexOf('<DashboardClient />'));
    expect(dashboard).toContain("'use client'");
    expect(dashboard).not.toContain('knowledgeSnapshot');
    expect(dashboard).not.toContain('<main');
    expect(dashboard).toContain('role="region" aria-label="Interactive policy monitoring workspace"');
  });

  it('scopes terms acknowledgement to the interactive workspace without a covering overlay', () => {
    const gate = read('src/components/TermsGate.tsx');
    const styles = read('src/components/TermsGate.module.css');
    const overlayRule = styles.match(/\.overlay \{([\s\S]*?)\n\}/)?.[1] || '';
    const languageRule = styles.match(/\.langToggle \{([\s\S]*?)\n\}/)?.[1] || '';

    expect(gate).toContain('data-scope="interactive-workspace"');
    expect(gate).toContain('aria-labelledby="workspace-access-title"');
    expect(gate).toContain('id="workspace-access-title"');
    expect(overlayRule).toContain('position: relative');
    expect(overlayRule).not.toContain('position: fixed');
    expect(languageRule).toContain('position: absolute');
    expect(languageRule).not.toContain('position: fixed');
  });

  it('keeps empty-state anchors valid and internal reference icons accurate', () => {
    const hub = read('src/app/knowledge/page.tsx');
    expect(hub).toContain('<section id="inventory"');
    expect(hub).toContain("data?.availability === 'available'");
    expect(hub).toContain('<Link href="/methodology/confidence">Publication methodology</Link>');
    expect(hub).toContain('<Link href="/evidence">Evidence register</Link>');
    expect(hub).not.toContain('<ExternalLink size={12}');
    expect(hub).toContain('<ArrowRight size={12}');
  });

  it('separates publication time and screening state on narrow layouts', () => {
    const company = read('src/app/knowledge/companies/[slug]/page.tsx');
    const policy = read('src/app/knowledge/companies/[slug]/policies/[id]/page.tsx');
    const styles = read('src/app/knowledge/knowledge.module.css');
    expect(company).toContain('<time dateTime={change.publishedAt}>');
    expect(policy).toContain('<time dateTime={change.publishedAt}>');
    expect(styles).toMatch(/\.changeMeta \{[^}]*flex-direction: column/);
    expect(styles).toMatch(/\.riskLabel \{[^}]*display: block/);
  });
});
