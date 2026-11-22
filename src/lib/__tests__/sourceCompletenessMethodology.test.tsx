import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { load } from 'cheerio';
vi.mock('@/components/PublicHeader', () => ({ default: () => null }));
vi.mock('@/components/Footer', () => ({ default: () => null }));
import Page, { generateMetadata } from '@/app/methodology/confidence/page';
import { publicRequestLanguage } from '@/lib/seo';

describe('responsible AI methodology locale and evidence boundaries', () => {
  it.each(['en', 'it'] as const)('renders the requested %s locale in the initial HTML and metadata', async lang => {
    const props = { searchParams: Promise.resolve({ lang }) };
    const $ = load(renderToStaticMarkup(await Page(props)));
    expect($('h1').text()).toBe(lang === 'it' ? 'Metodologia delle evidenze' : 'Evidence methodology');
    const opposite = lang === 'it' ? 'en' : 'it';
    expect($(`a[href="/methodology/confidence${opposite === 'it' ? '?lang=it' : ''}"]`).length).toBe(1);
    expect(publicRequestLanguage('/methodology/confidence', lang)).toBe(lang);
    const metadata = await generateMetadata(props);
    expect(JSON.stringify(metadata.alternates)).toContain(`/methodology/confidence${lang === 'it' ? '?lang=it' : ''}`);
    expect($('a[href="https://www.nist.gov/itl/ai-risk-management-framework"]').length).toBeGreaterThan(0);
    expect($('a[href="https://www.oecd.org/en/topics/ai-principles.html"]').length).toBeGreaterThan(0);
  });
  it('defaults an unsupported locale to English rather than creating an unsupported claim variant', async () => {
    const $ = load(renderToStaticMarkup(await Page({ searchParams: Promise.resolve({ lang: 'xx' }) })));
    expect($('h1').text()).toBe('Evidence methodology');
    expect(publicRequestLanguage('/methodology/confidence', 'xx')).toBe('en');
  });
});
