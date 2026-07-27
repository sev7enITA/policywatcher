import { describe, expect, it } from 'vitest';
import {
  getBrowserExtensionStoreLinks,
  normalizeExtensionStoreUrl,
} from '../browserExtensionStores';

describe('browser extension public store status', () => {
  it('shows no install destination when store URLs are not configured', () => {
    expect(getBrowserExtensionStoreLinks({})).toEqual({
      chrome: null,
      edge: null,
      safari: null,
    });
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

  it('wires the route to truthful configured and pending states', async () => {
    const { readFile } = await import('node:fs/promises');
    const client = await readFile('src/app/browser-extension/BrowserExtensionClient.tsx', 'utf8');
    const release = await readFile('src/lib/release.ts', 'utf8');
    expect(client).toContain('POLICYWATCHER_BROWSER_EXTENSION_RELEASE_STATUS[lang]');
    expect(release).toContain('Pacchetto Beta pronto · invio allo store pianificato');
    expect(release).toContain('Beta package ready · store submission planned');
    expect(client).toContain('storeLinks[id]');
    expect(client).toContain('href={storeLinks[id]!}');
    expect(client).toContain('/what-changed#paste-notice');
    expect(client).toContain('Versione Beta per test controllati');
    expect(client).toContain('Beta version for controlled testing');
    expect(client).toContain('className={styles.betaNotice}');
    expect(client).not.toContain('developer mode');
  });
});
