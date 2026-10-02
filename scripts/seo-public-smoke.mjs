#!/usr/bin/env node
/** Read-only checks of the public sitemap, initial HTML and structured data. */
import fs from 'node:fs';
import { load } from 'cheerio';

const args = process.argv.slice(2);
const option = (name) => { const index = args.indexOf(name); return index < 0 ? undefined : args[index + 1]; };
const base = option('--base-url');
if (!base) throw new Error('Usage: node scripts/seo-public-smoke.mjs --base-url <origin> [--output report.json] [--expect-noindex]');
const origin = new URL(base).origin;
const expectNoindex = args.includes('--expect-noindex');
const fetchPage = (url) => fetch(url, { signal: AbortSignal.timeout(20_000), headers: { 'User-Agent': 'PolicyWatcher-SEO-Verification/1.0' } });
const sitemapResponse = await fetchPage(`${origin}/sitemap.xml`);
if (!sitemapResponse.ok) throw new Error(`Sitemap returned ${sitemapResponse.status}`);
const xml = load(await sitemapResponse.text(), { xml: true });
const urls = xml('url > loc').map((_, element) => xml(element).text()).get();
if (!urls.length || urls.length > 5000) throw new Error(`Unexpected sitemap size: ${urls.length}`);
const pages = [];
let next = 0;
async function worker() {
  while (next < urls.length) {
    const canonicalUrl = urls[next++];
    const url = new URL(canonicalUrl);
    const route = `${url.pathname}${url.search}`;
    const issues = [];
    try {
      const response = await fetchPage(`${origin}${route}`);
      const $ = load(await response.text());
      const title = $('title').text();
      const description = $('meta[name="description"]').attr('content');
      const canonical = $('link[rel="canonical"]').attr('href');
      const robots = `${response.headers.get('x-robots-tag') || ''} ${$('meta[name="robots"]').map((_, el) => $(el).attr('content')).get().join(' ')}`;
      if (response.status !== 200) issues.push(`HTTP ${response.status}`);
      if (!title || !description) issues.push('Missing title or description');
      if (!canonical || new URL(canonical).href !== url.href) issues.push('Canonical does not match sitemap URL');
      if (!$('head link[rel="canonical"]').length) issues.push('Canonical missing from initial head');
      if (!$('h1').length) issues.push('Missing primary heading');
      const noindex = /\bnoindex\b/i.test(robots);
      if (noindex !== expectNoindex) issues.push(expectNoindex ? 'Expected staging noindex is missing' : 'Public sitemap URL is noindex');
      for (const property of ['og:title', 'og:description', 'og:url', 'og:image']) {
        if (!$(`meta[property="${property}"]`).attr('content')) issues.push(`Missing ${property}`);
      }
      const schemas = [];
      $('script[type="application/ld+json"]').each((_, el) => {
        try { schemas.push(JSON.parse($(el).text())); } catch { issues.push('Invalid JSON-LD'); }
      });
      if (route.startsWith('/change/') && JSON.stringify(schemas).includes('aggregateRating')) issues.push('Policy risk must not be a review rating');
      const lang = $('html').attr('lang');
      if ((route.startsWith('/it/') || url.searchParams.get('lang') === 'it') && lang !== 'it') issues.push('Italian URL has a different document language');
      const translated = xml('url').filter((_, el) => xml(el).find('loc').text() === canonicalUrl).find('xhtml\\:link').map((_, el) => ({ lang: xml(el).attr('hreflang'), href: xml(el).attr('href') })).get();
      for (const alternate of translated) {
        const tag = $(`link[rel="alternate"][hreflang="${alternate.lang}"]`);
        // Existing Civic pages declare the more specific it-IT locale.
        const localized = alternate.lang === 'it' && !tag.length ? $('link[rel="alternate"][hreflang="it-IT"]') : tag;
        if (localized.attr('href') !== alternate.href) issues.push(`Missing or mismatched ${alternate.lang} alternate`);
      }
      pages.push({ route, status: response.status, title, description, canonical, lang, issues });
    } catch (error) {
      pages.push({ route, issues: [`Request or parsing failed: ${error.message}`] });
    }
  }
}
await Promise.all(Array.from({ length: 4 }, worker));
const titles = new Map();
for (const page of pages) {
  if (!page.title) continue;
  const identities = titles.get(page.title) || new Set();
  identities.add(page.route.split('?')[0]);
  titles.set(page.title, identities);
}
const duplicateTitles = [...titles.entries()].filter(([, paths]) => paths.size > 1).map(([title, paths]) => ({ title, paths: [...paths] }));
const failed = pages.filter(page => page.issues.length);
const report = { checkedAt: new Date().toISOString(), origin, expectNoindex, status: failed.length || duplicateTitles.length ? 'failed' : 'passed', pageCount: pages.length, failed, duplicateTitles, pages };
const output = option('--output');
if (output) fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ status: report.status, pageCount: pages.length, failed, duplicateTitles }, null, 2));
if (report.status !== 'passed') process.exitCode = 1;
