import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { load } from 'cheerio';
import { describe, expect, it } from 'vitest';
import PublicBreadcrumbs from '@/components/PublicBreadcrumbs';
import { serializeJsonLd, AUTHOR_PROFILES, PUBLIC_AUTHOR, PUBLIC_PUBLISHER, SOFTWARE_ID } from '../structuredData';
import { HOME_STRUCTURED_DATA } from '../homeSeo';
import { PRESS_KIT_STRUCTURED_DATA } from '../pressKitStructuredData';

function graph(value: unknown): Array<Record<string, unknown>> {
  return JSON.parse(serializeJsonLd(value))['@graph'];
}

describe('public JSON-LD contract', () => {
  it('round-trips nested multilingual text without allowing an HTML script breakout', () => {
    const payload = { name: '</script><script>alert(1)</script>', nested: [{ text: '<!-- café 日本語 & "quotes"\n\u2028\u2029' }] };
    const serialized = serializeJsonLd(payload);
    const $ = load(`<script type="application/ld+json">${serialized}</script><p>Visible page</p>`);
    expect($('script')).toHaveLength(1);
    expect(serialized).not.toContain('<');
    expect(JSON.parse($('script').text())).toEqual(payload);
    expect($('p').text()).toBe('Visible page');
  });

  it('preserves breadcrumb text and the Italian canonical query in rendered HTML', () => {
    const name = 'Policy <check> </script><script>alert(1)</script>';
    const html = renderToStaticMarkup(createElement(PublicBreadcrumbs, { lang: 'it', items: [
      { name: 'Guide', path: '/guides?lang=it' },
      { name, path: '/guides/example?lang=it' },
    ] }));
    const $ = load(html);
    expect($('script')).toHaveLength(1);
    const schema = JSON.parse($('script[type="application/ld+json"]').text());
    expect(schema.itemListElement[1]).toMatchObject({ position: 2, name, item: 'https://policywatcher.online/guides/example?lang=it' });
    expect($('[aria-current="page"]').text()).toBe(name);
  });

  it('keeps person identity separate from the project repository across public graphs', () => {
    for (const value of [HOME_STRUCTURED_DATA, PRESS_KIT_STRUCTURED_DATA]) {
      const author = graph(value).find(node => node['@id'] === PUBLIC_AUTHOR['@id']);
      expect(author).toMatchObject(PUBLIC_AUTHOR);
      expect(author?.sameAs).toEqual(AUTHOR_PROFILES);
      expect(author?.sameAs).not.toContain('https://github.com/sev7enITA/policywatcher');
    }
  });

  it('describes the source repository as SoftwareSourceCode linked to the application', () => {
    const nodes = graph(PRESS_KIT_STRUCTURED_DATA);
    const software = nodes.find(node => node['@id'] === SOFTWARE_ID)!;
    const source = nodes.find(node => node['@type'] === 'SoftwareSourceCode')!;
    expect(source.codeRepository).toBe('https://github.com/sev7enITA/policywatcher');
    expect(source.targetProduct).toEqual({ '@id': SOFTWARE_ID });
    expect(software).not.toHaveProperty('codeRepository');
    expect(software).not.toHaveProperty('datePublished');
    expect(software.provider).toEqual(PUBLIC_PUBLISHER);
    expect(software.creator).toEqual(PUBLIC_AUTHOR);
  });

  it('does not fabricate offers or review ratings to satisfy Google software rich-result eligibility', () => {
    for (const value of [HOME_STRUCTURED_DATA, PRESS_KIT_STRUCTURED_DATA]) {
      const software = graph(value).find(node => node['@type'] === 'SoftwareApplication')!;
      expect(software).not.toHaveProperty('offers');
      expect(software).not.toHaveProperty('aggregateRating');
      expect(software).not.toHaveProperty('review');
    }
  });
});
