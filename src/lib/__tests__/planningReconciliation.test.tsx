import { describe, expect, it, vi } from 'vitest';
vi.mock('@/lib/db', () => ({ db: { policyChange: { findMany: async () => [] }, policy: { findMany: async () => [] } } }));
import { renderToStaticMarkup } from 'react-dom/server';
import PlanningResearchStatus from '@/components/PlanningResearchStatus';
import { planningHref } from '../planningLocale';
import { publicRequestLanguage } from '../seo';
import { engineSixDemoAuditUpdate, engineSixRemoteFollowupUpdate, latestResearchUpdate, pressKitReleases, previewResearchUpdate } from '../pressKit';

const pages = [
  ['atlas', 'Mappa del sito', () => import('@/app/atlas/page')],
  ['feature-atlas', 'Atlante delle funzioni', () => import('@/app/feature-atlas/page')],
  ['roadmap', 'Roadmap del prodotto', () => import('@/app/roadmap/page')],
] as const;

describe('planning page language and evidence handoff', () => {
  it.each(pages)('preserves Italian metadata, visible entry point and source boundaries on %s', async (path, heading, load) => {
    const page = await load();
    const props = { searchParams: Promise.resolve({ lang: 'it' }) };
    const metadata = await page.generateMetadata(props);
    expect(metadata.title).toBe(`${heading} | PolicyWatcher`);
    expect(metadata.alternates?.canonical).toBe(`https://policywatcher.online/${path}?lang=it`);
    expect(metadata.openGraph?.locale).toBe('it_IT');
    const element = await page.default(props);
    expect(element.props.lang).toBe('it');
    expect(publicRequestLanguage('/' + path, 'it')).toBe('it');
    const html = renderToStaticMarkup(element);
    expect(html).toContain(`<h1>${heading}</h1>`);
    expect(html).toContain('/engine-6-preview?lang=it#validation');
    expect(html).toContain('129 casi restano sospesi');
    expect(html).toContain('non costituiscono una traduzione completa');
    expect(html).toContain('lang="en"');
    expect(html).toContain('href="/what-changed?lang=it"');
    expect(html).toContain('href="/roadmap?lang=it"');
    expect(html).toContain('href="/feature-atlas?lang=it"');
    expect(html).toContain('href="/?lang=it"');
  });

  it.each(pages)('keeps the English canonical on %s', async (path, _heading, load) => {
    const page = await load();
    const props = { searchParams: Promise.resolve({ lang: 'en' }) };
    expect((await page.generateMetadata(props)).alternates?.canonical).toBe(`https://policywatcher.online/${path}`);
    expect((await page.default(props)).props.lang).toBe('en');
  });

  it('advertises the actual Italian and English planning routes and new research detail in the sitemap', async () => {
    const { default: sitemap } = await import('@/app/sitemap');
    const entries = await sitemap();
    for (const path of ['atlas', 'feature-atlas', 'roadmap', 'what-changed']) {
      for (const lang of ['en', 'it'] as const) {
        const url = `https://policywatcher.online/${path}${lang === 'it' ? '?lang=it' : ''}`;
        expect(entries.filter(entry => entry.url === url)).toHaveLength(1);
        expect(entries.find(entry => entry.url === url)?.alternates?.languages?.it).toBe(`https://policywatcher.online/${path}?lang=it`);
      }
    }
    expect(entries.some(entry => entry.url === `https://policywatcher.online/press-kit/releases/${latestResearchUpdate.slug}?lang=it`)).toBe(true);
  });

  it('starts the notice-verification form in the URL-selected language and preserves the browser-extension handoff', async () => {
    const { default: Page, generateMetadata } = await import('@/app/what-changed/page');
    for (const lang of ['en', 'it'] as const) {
      const props = { searchParams: Promise.resolve({ lang }) };
      const element = await Page(props);
      expect(element.props.initialLang).toBe(lang);
      const html = renderToStaticMarkup(element);
      expect(html).toContain(lang === 'it' ? 'Verifica di una notifica' : 'Policy notice verification');
      expect(html).toContain(`/browser-extension${lang === 'it' ? '?lang=it' : ''}`);
      expect((await generateMetadata(props)).alternates?.canonical).toBe(`https://policywatcher.online/what-changed${lang === 'it' ? '?lang=it' : ''}`);
      expect(publicRequestLanguage('/what-changed', lang)).toBe(lang);
      expect(html).toContain(`href="/what-changed${lang === 'en' ? '?lang=it' : ''}"`);
      expect(html).toContain(`hrefLang="${lang === 'en' ? 'it' : 'en'}"`);
    }
  });

  it('preserves anchors and existing route language conventions without rewriting external or protected destinations', () => {
    expect(planningHref('/engine-6-preview#validation', 'it')).toBe('/engine-6-preview?lang=it#validation');
    expect(planningHref('/per-te', 'en')).toBe('/per-te?lang=en');
    expect(planningHref('/per-te?lang=en#choices', 'it')).toBe('/per-te#choices');
    expect(planningHref('/en/associations?country=IT', 'it')).toBe('/it/associazioni?country=IT');
    expect(planningHref('https://staging.policywatcher.online/admin/engine', 'it')).toBe('https://staging.policywatcher.online/admin/engine');
    expect(planningHref('/admin', 'it')).toBe('/admin');
    expect(planningHref('/developers', 'it')).toBe('/developers');
    expect(planningHref('/what-changed', 'it')).toBe('/what-changed?lang=it');
    expect(planningHref('#technical-baseline', 'it')).toBe('#technical-baseline');
  });

  it.each(['en', 'it'] as const)('separates stable, deployed private and unqualified candidate states in %s', lang => {
    const html = renderToStaticMarkup(<PlanningResearchStatus lang={lang} path="/atlas" />);
    expect(html).toContain('5.5.0');
    expect(html).toContain('r3');
    expect(html).toContain('133');
    expect(html).toContain('129');
    expect(html).toContain(lang === 'it' ? 'Restano da qualificare' : 'remain unqualified');
    expect(html).toContain(lang === 'it' ? 'candidato congelato separato' : 'separate frozen candidate');
  });
});

describe('latest research distribution', () => {
  it('retains the historical r3 record and distinguishes observation and publication dates', () => {
    expect(latestResearchUpdate).toBe(engineSixDemoAuditUpdate);
    expect(pressKitReleases).toContain(engineSixRemoteFollowupUpdate);
    expect(latestResearchUpdate.status).toBe('research');
    expect(latestResearchUpdate.version).toBe('5.5.0');
    expect(latestResearchUpdate.datePublished).toBe('2026-11-22');
    expect(engineSixRemoteFollowupUpdate.summary.en).toContain('21 November');
    expect(latestResearchUpdate.summary.en).toContain('reconfirmed four of six');
    expect(previewResearchUpdate.datePublished).toBe('2026-11-07');
    expect(pressKitReleases).toContain(previewResearchUpdate);
    expect(engineSixRemoteFollowupUpdate.boundaries.map(x => x.en).join(' ')).toContain('cannot be added');
    expect(latestResearchUpdate.boundaries.map(x => x.en).join(' ')).toContain('do not run HTML acquisition');
  });

  it.each(['en', 'it'] as const)('labels the latest research paragraphs independently of an older release topic in %s', async lang => {
    const { default: EnginePage } = await import('@/app/engine-6-preview/page');
    const html = renderToStaticMarkup(await EnginePage({ searchParams: Promise.resolve({ lang }) }));
    const section = html.match(/<section[^>]*id="latest-research"[\s\S]*?<\/section>/)?.[0];
    expect(section).toBeDefined();
    for (const number of [1, 2, 3]) expect(section).toContain(`<h3>${lang === 'it' ? 'Osservazione' : 'Observation'} ${number}</h3>`);
    for (const item of latestResearchUpdate.changes.slice(0, 3)) expect(section).toContain(renderToStaticMarkup(<p>{item[lang]}</p>));
    expect(section).toContain('contract_satisfied');
    expect(section).toContain('3.8.3.3');
    expect(html).toContain(lang === 'it' ? '21 novembre · Verifica dei 133 casi' : '21 November · Follow-up of 133 remote');
    expect(html).toContain('129');
    expect(section).not.toContain('r4 remediation');
    expect(section).not.toContain('Passage recovery');
    expect(section).not.toContain('Correzioni r4');
    expect(section).not.toContain('Recupero dei passaggi');
    expect(html).toContain('dateTime="2026-11-22"');
  });

  it('includes the same dated record in JSON feed, RSS, static detail routes and bilingual structured data', async () => {
    const { GET: jsonFeed } = await import('@/app/press-kit/feed.json/route');
    const { GET: xmlFeed } = await import('@/app/press-kit/feed.xml/route');
    const { generateStaticParams, default: Detail, generateMetadata } = await import('@/app/press-kit/releases/[slug]/page');
    const slug = latestResearchUpdate.slug;
    expect((await jsonFeed().json()).items[0].url).toContain(`/press-kit/releases/${slug}`);
    expect(await xmlFeed().text()).toContain(`/press-kit/releases/${slug}`);
    expect(generateStaticParams()).toContainEqual({ slug });
    for (const lang of ['en', 'it'] as const) {
      const props = { params: Promise.resolve({ slug }), searchParams: Promise.resolve({ lang }) };
      const html = renderToStaticMarkup(await Detail(props));
      expect(html).toContain(`"inLanguage":"${lang}"`);
      expect(html).toContain(latestResearchUpdate.title[lang]);
      expect((await generateMetadata(props)).description).toBe(latestResearchUpdate.summary[lang]);
    }
  });
});
