import { describe, expect, it } from 'vitest';
import {
  POLICYWATCHER_BROWSER_EXTENSION_STORE_STATUS,
  POLICYWATCHER_CHROME_WEB_STORE_URL,
  getBrowserExtensionStoreLinks,
  normalizeExtensionStoreUrl,
} from '../browserExtensionStores';

describe('browser extension public store status', () => {
  it('reports Chrome and Edge as published while keeping unconfigured links closed', () => {
    expect(getBrowserExtensionStoreLinks({})).toEqual({
      chrome: POLICYWATCHER_CHROME_WEB_STORE_URL,
      edge: null,
      safari: null,
    });
    expect(POLICYWATCHER_BROWSER_EXTENSION_STORE_STATUS.chrome.state).toBe('published');
    expect(POLICYWATCHER_BROWSER_EXTENSION_STORE_STATUS.edge.state).toBe('published');
    expect(POLICYWATCHER_BROWSER_EXTENSION_STORE_STATUS.safari.state).toBe('unavailable');
  });

  it('accepts only credential-free HTTPS store destinations', () => {
    expect(getBrowserExtensionStoreLinks({
      NEXT_PUBLIC_CHROME_EXTENSION_URL: 'https://chromewebstore.google.com/detail/policywatcher/example',
      NEXT_PUBLIC_EDGE_EXTENSION_URL: 'http://microsoftedge.microsoft.com/addons/detail/example',
      NEXT_PUBLIC_SAFARI_EXTENSION_URL: 'https://user:secret@apps.apple.com/app/example',
    })).toEqual({
      chrome: 'https://chromewebstore.google.com/detail/policywatcher/example',
      edge: null,
      safari: null,
    });
    expect(normalizeExtensionStoreUrl('not a URL')).toBeNull();
    expect(normalizeExtensionStoreUrl('https://example.com/fake-extension', 'chrome')).toBeNull();
    expect(normalizeExtensionStoreUrl(
      'https://microsoftedge.microsoft.com/addons/detail/policywatcher/example',
      'edge',
    )).toBe('https://microsoftedge.microsoft.com/addons/detail/policywatcher/example');
  });

  it('wires the route to independently verified store states', async () => {
    const { readFile } = await import('node:fs/promises');
    const client = await readFile('src/app/browser-extension/BrowserExtensionClient.tsx', 'utf8');
    const release = await readFile('src/lib/release.ts', 'utf8');
    expect(client).toContain('POLICYWATCHER_BROWSER_EXTENSION_STORE_STATUS[id]');
    expect(client).toContain("status.state === 'published'");
    expect(client).toContain('hasInstallLink');
    expect(client).toContain('directLinkPending');
    expect(client).toContain('styles.storePublished');
    expect(release).toContain('Pubblicata su Chrome Web Store');
    expect(release).toContain('Microsoft Edge Add-ons');
    expect(release).not.toContain('store submission planned');
    expect(release).not.toContain('invio allo store pianificato');
    expect(client).toContain('storeLinks[id]');
    expect(client).toContain('href={storeLinks[id]!}');
    expect(client).toContain('/what-changed#paste-notice');
    expect(client).toContain('Versione Beta per test controllati');
    expect(client).toContain('Beta version for controlled testing');
    expect(client).toContain('className={styles.betaNotice}');
    expect(client).not.toContain('developer mode');
  });
});
