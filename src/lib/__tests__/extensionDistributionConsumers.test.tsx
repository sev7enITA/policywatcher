import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
// Isolate the dashboard's consent-granted view; no data fetch or consent persistence is simulated.
vi.mock('@/components/TermsGate', () => ({ default: ({ children }: { children: ReactNode }) => children }));
import { renderToStaticMarkup } from 'react-dom/server';
import { POLICYWATCHER_BROWSER_EXTENSION_RELEASE_STATUS } from '../release';

const oldCurrentClaim = 'Chrome Web Store and Microsoft Edge Add-ons published';

describe('current browser distribution claims in public consumers', () => {
  it.each(['en', 'it'] as const)('renders independent current store evidence in the consent-granted homepage body and Press Kit in %s', async lang => {
    const { default: HomeLanding } = await import('@/app/HomeLanding');
    const { default: PressKit } = await import('@/app/press-kit/page');
    const home = renderToStaticMarkup(<HomeLanding initialLang={lang} initiallyHidden={false} knowledge={null} />);
    const press = renderToStaticMarkup(await PressKit({ searchParams: Promise.resolve({ lang }) }));
    const strip = home.match(/<section\b[^>]*aria-labelledby="extension-beta-title"[\s\S]*?<\/section>/)?.[0];
    expect(strip).toBeDefined();
    for (const consumer of [strip, press]) {
      expect(consumer).toContain(POLICYWATCHER_BROWSER_EXTENSION_RELEASE_STATUS[lang]);
      expect(consumer).toContain(lang === 'it' ? 'scheda Edge non verificata' : 'Edge listing unverified');
      expect(consumer).toContain(lang === 'it' ? 'pubblicazione storica dichiarata' : 'publication historically reported');
      expect(consumer).toContain(lang === 'it' ? 'nessuna release App Store o TestFlight' : 'no App Store or TestFlight release');
      expect(consumer).not.toContain(oldCurrentClaim);
    }
  });

  it('keeps the privacy policy current distribution statement bounded', async () => {
    const { default: Privacy } = await import('@/app/privacy/page');
    const html = renderToStaticMarkup(<Privacy />);
    expect(html).toContain(POLICYWATCHER_BROWSER_EXTENSION_RELEASE_STATUS.en);
    expect(html).not.toContain(oldCurrentClaim);
    expect(html).toContain('Beta status does not');
  });

  it.each(['en', 'it'] as const)('withholds an unverified Edge install action even for a syntactically valid supplied link in %s', async lang => {
    const { default: Extension } = await import('@/app/browser-extension/BrowserExtensionClient');
    const html = renderToStaticMarkup(<Extension lang={lang} storeLinks={{ chrome: null, edge: 'https://microsoftedge.microsoft.com/addons/detail/unverified/example', safari: 'https://apps.apple.com/app/unverified/example' }} />);
    expect(html).toContain('data-store-state="unverified"');
    expect(html).not.toContain('href="https://microsoftedge.microsoft.com/addons/detail/unverified/example"');
    expect(html).not.toContain('href="https://apps.apple.com/app/unverified/example"');
    expect(html).toContain(lang === 'it' ? 'pubblicazione dichiarata in precedenza' : 'previously reported as published');
  });
});
