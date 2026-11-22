import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { POLICYWATCHER_BROWSER_EXTENSION_STORE_STATUS } from '../browserExtensionStores';

const developerKit = 'https://github.com/sev7enITA/policywatcher/releases/tag/safari-ios-0.1.0-build1-preview';
const report = 'https://github.com/sev7enITA/policywatcher/blob/main/docs/reports/browser-extension-ios-assessment-2026-11-22.md';

describe('browser-extension public candidate and localized handoff', () => {
  it.each(['en', 'it'] as const)('renders bounded iOS development evidence and retains language in %s', async lang => {
    const { default: Page, generateMetadata } = await import('@/app/browser-extension/page');
    const props = { searchParams: Promise.resolve({ lang }) };
    const html = renderToStaticMarkup(await Page(props));
    const candidate = html.match(/<section[^>]*id="ios-developer-candidate"[\s\S]*?<\/section>/)?.[0];
    expect(candidate).toBeDefined();
    expect(candidate).toContain('0.1.0');
    expect(candidate).toContain('build 1');
    expect(candidate).toContain('3.8.3.3');
    expect(candidate).toContain('5.6.0');
    expect(candidate).toContain('iPhone Duo');
    expect(candidate).toContain('27.1');
    expect(candidate).toContain(lang === 'it' ? 'non firmati' : 'Unsigned');
    expect(candidate).toContain(lang === 'it' ? 'Ancora da verificare' : 'Still unverified');
    expect(candidate).toContain(lang === 'it' ? 'iPhone fisico, iPad, iOS 17 minimo e accessibilità' : 'physical iPhone, iPad, minimum iOS 17 and accessibility');
    expect(candidate).toContain(lang === 'it' ? 'Nessun caricamento su App Store o TestFlight' : 'No App Store or TestFlight upload');
    expect(candidate).toContain(`href="${report}"`);
    expect(candidate).toContain(`href="${developerKit}"`);
    const kitLink = candidate?.match(/<a\b[^>]*data-ios-developer-kit[^>]*>[\s\S]*?<\/a>/)?.[0];
    expect(kitLink).toContain(lang === 'it' ? 'Kit per sviluppatori' : 'Developer kit');
    expect(kitLink).not.toContain(lang === 'it' ? 'Apri e installa' : 'View and install');
    expect(candidate).toContain(lang === 'it' ? 'non è un’installazione ordinaria' : 'not an ordinary installation');
    expect(candidate).not.toContain('download=');
    expect(html).not.toMatch(/href="https:\/\/(?:apps\.apple\.com|testflight\.apple\.com)\//);
    expect(POLICYWATCHER_BROWSER_EXTENSION_STORE_STATUS.safari.state).toBe('unavailable');
    const query = lang === 'it' ? '?lang=it' : '';
    for (const path of ['/', '/what-changed', '/privacy', '/methodology/confidence', '/about']) {
      expect(html).toContain(`href="${path}${query}"`);
    }
    expect(html).toContain(`href="/what-changed${query}#paste-notice"`);
    expect(html).toContain(`<main class=`);
    expect(html).toContain(`lang="${lang}"`);
    expect((await generateMetadata(props)).alternates?.canonical).toBe(`https://policywatcher.online/browser-extension${query}`);
    expect(html).toContain('data-store-state="unverified"');
    expect(html).toContain(lang === 'it' ? 'Scheda Edge attuale non verificata' : 'Current Edge listing unverified');
    expect(html).not.toContain('6 August 2026');
    expect(html).not.toContain('6 agosto 2026');
  });
});
