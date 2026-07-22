import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

const manifest = JSON.parse(readFileSync('browser-extension/manifest.json', 'utf8')) as {
  manifest_version: number;
  version: string;
  version_name: string;
  permissions: string[];
  host_permissions: string[];
};
const popupSource = readFileSync('browser-extension/popup.js', 'utf8');
const popupHtml = readFileSync('browser-extension/popup.html', 'utf8');
const workerSource = readFileSync('browser-extension/service-worker.js', 'utf8');

function scannerFixture(options: {
  pageText: string;
  selectionText?: string;
  anchors?: Array<{ textContent: string; href: string; ariaLabel?: string; context?: 'message' | 'global' }>;
}) {
  const anchors = (options.anchors || []).map((anchor) => ({
    ...anchor,
    getAttribute: (name: string) => name === 'aria-label' ? anchor.ariaLabel || '' : '',
  }));
  const messageContext = {
    nodeType: 1,
    closest: () => messageContext,
    querySelectorAll: (selector: string) => selector === 'a[href]' ? anchors.filter((anchor) => anchor.context === 'message') : [],
  };
  const hasMessageContext = anchors.some((anchor) => anchor.context === 'message');
  const document = {
    title: 'Policy update notice',
    body: { innerText: options.pageText },
    querySelectorAll: (selector: string) => selector === 'a[href]' ? anchors : [],
    querySelector: () => hasMessageContext ? messageContext : null,
    addEventListener: () => undefined,
    getElementById: () => null,
    documentElement: { lang: 'en', scrollTop: 0 },
  };
  const context = vm.createContext({
    AbortController,
    Date,
    URL,
    chrome: { runtime: { getManifest: () => manifest }, tabs: {}, scripting: {} },
    document,
    location: { href: 'https://mail.google.com/mail/u/0/#inbox/message', hostname: 'mail.google.com', pathname: '/mail/u/0/' },
    setTimeout,
    clearTimeout,
    window: { getSelection: () => ({
      toString: () => options.selectionText || '',
      rangeCount: options.selectionText && hasMessageContext ? 1 : 0,
      getRangeAt: () => ({ commonAncestorContainer: messageContext }),
    }) },
  });
  vm.runInContext(popupSource, context);
  return vm.runInContext('inspectPageLocally()', context) as Record<string, unknown>;
}

function workerContext() {
  const listeners: Array<(...args: unknown[]) => unknown> = [];
  const context = vm.createContext({
    AbortController,
    console,
    fetch: async () => ({ ok: true, status: 200, json: async () => ({ state: 'queued' }) }),
    setTimeout,
    clearTimeout,
    chrome: {
      runtime: {
        id: 'policywatcher-test',
        onMessage: { addListener: (listener: (...args: unknown[]) => unknown) => listeners.push(listener) },
      },
    },
  });
  vm.runInContext(workerSource, context);
  return context;
}

describe('browser extension production boundary', () => {
  it('passes the standalone manifest and source validator', () => {
    expect(() => execFileSync(process.execPath, ['scripts/validate-browser-extension.mjs'], { stdio: 'pipe' })).not.toThrow();
  });

  it('uses minimum permissions and the production-only host', () => {
    expect(manifest.manifest_version).toBe(3);
    expect(manifest.version_name).toBe(`${manifest.version} Beta`);
    expect(manifest.permissions.sort()).toEqual(['activeTab', 'scripting']);
    expect(manifest.host_permissions).toEqual(['https://www.policywatcher.online/*']);
  });

  it('labels every installed and popup surface as Beta with localized first-use limits', () => {
    const en = JSON.parse(readFileSync('browser-extension/_locales/en/messages.json', 'utf8'));
    const it = JSON.parse(readFileSync('browser-extension/_locales/it/messages.json', 'utf8'));
    expect(en.extensionName.message).toMatch(/BETA$/);
    expect(it.extensionName.message).toMatch(/BETA$/);
    expect(en.extensionDescription.message).toMatch(/^BETA:/);
    expect(it.extensionDescription.message).toMatch(/^BETA:/);
    expect(popupHtml).toContain('id="beta-info-button"');
    expect(popupHtml).toContain('class="beta-warning"');
    expect(popupSource).toContain('You are using a BETA version');
    expect(popupSource).toContain('Stai usando una versione BETA');
    expect(popupSource).toContain('confidential, health, financial, employment or authentication communications');
  });

  it('returns structured clues without returning the selected notification text', () => {
    const notice = `From: Waze <noreply@waze.com>\nDate: Fri, Jul 10, 2026\nWe are updating our Terms of Service and Privacy Policy. The changes take effect on August 1, 2026.`;
    const result = scannerFixture({ pageText: notice, selectionText: notice });
    expect(result).toMatchObject({
      companyName: 'Waze',
      senderDomain: 'waze.com',
      policyTypes: ['privacy', 'terms'],
      sourceKind: 'selection',
      rawDiscarded: true,
    });
    expect(Object.keys(result).sort()).toEqual([
      'companyName', 'confidence', 'effectiveDate', 'noticeDate', 'policyTypes',
      'rawDiscarded', 'senderDomain', 'sourceKind', 'sourceUrl',
    ].sort());
    expect(JSON.stringify(result)).not.toContain('We are updating');
    expect(JSON.stringify(result)).not.toContain('noreply@waze.com');
  });

  it('supports a visible Outlook-style message and removes tracking data from policy links', () => {
    const result = scannerFixture({
      pageText: `From: BlaBlaCar <updates@news.blablacar.com>\nDate: 20 July 2026\nWe maintain clarity by updating our Terms and conditions and Privacy Policy. Effective on 21 August 2026.`,
      anchors: [{
        textContent: 'Privacy Policy',
        href: 'https://www.blablacar.com/privacy?recipient=private@example.com&utm_source=email#notice',
      }],
    });
    expect(result).toMatchObject({
      companyName: 'BlaBlaCar',
      senderDomain: 'news.blablacar.com',
      sourceUrl: 'https://www.blablacar.com/privacy',
      policyTypes: ['privacy', 'terms'],
      sourceKind: 'page',
      rawDiscarded: true,
    });
    expect(result.policyTypes).not.toContain('ai');
    expect(JSON.stringify(result)).not.toContain('private@example.com');
    expect(JSON.stringify(result)).not.toContain('utm_source');
  });

  it('prefers policy anchors inside the selected notification and ignores unrelated webmail navigation', () => {
    const notice = `From: Acme Mobility <updates@acme.example>\nWe updated our Terms and Privacy Policy.`;
    const result = scannerFixture({
      pageText: notice,
      selectionText: notice,
      anchors: [
        { textContent: 'Privacy settings', href: 'https://mail.example/settings/privacy?account=user@example.com', context: 'global' },
        { textContent: 'Read the Privacy Policy', href: 'https://acme.example/legal/privacy?utm_source=email&token=secret#changes', context: 'message' },
      ],
    });
    expect(result.sourceUrl).toBe('https://acme.example/legal/privacy');
    expect(JSON.stringify(result)).not.toContain('user@example.com');
    expect(JSON.stringify(result)).not.toContain('token');
  });

  it('fails closed for opaque redirect links instead of forwarding tokens or guessing destinations', () => {
    const notice = `The Contoso Team\nWe updated our Terms.`;
    const result = scannerFixture({
      pageText: notice,
      selectionText: notice,
      anchors: [{
        textContent: 'Read the Terms',
        href: 'https://click.contoso.example/redirect?token=secret&url=https%3A%2F%2Fcontoso.example%2Fterms',
        context: 'message',
      }],
    });
    expect(result.sourceUrl).toBeNull();
    expect(JSON.stringify(result)).not.toContain('secret');
  });

  it('recognizes a no-link MioDottore notice from its signature and contextual Italian IA language', () => {
    const result = scannerFixture({
      pageText: `Gentile utente,
Siamo sempre al lavoro per migliorare MioDottore. Abbiamo aggiornato la nostra Informativa e pubblicato una nuova cookie policy.
Le funzionalità supportate dall'IA sono facoltative.
Il Team MioDottore`,
      selectionText: `Gentile utente,
Abbiamo aggiornato la nostra Informativa e pubblicato una nuova cookie policy.
Le funzionalità supportate dall'IA sono facoltative.
Il Team MioDottore`,
    });
    expect(result).toMatchObject({
      companyName: 'MioDottore',
      policyTypes: ['privacy', 'cookies', 'ai'],
      sourceKind: 'selection',
      rawDiscarded: true,
    });
    expect(JSON.stringify(result)).not.toContain('Gentile utente');
  });

  it('rejects unknown and raw-content fields before the network layer', () => {
    const context = workerContext();
    expect(() => vm.runInContext(`sanitizePayload({companyName: 'Waze', rawText: 'private'})`, context)).toThrow(/INVALID_PAYLOAD/);
    const sanitized = vm.runInContext(`sanitizePayload({companyName: ' Waze ', policyTypes: ['privacy', 'privacy', 'invalid'], lang: 'en', honeypot: 'must be cleared'})`, context) as Record<string, unknown>;
    expect(sanitized).toMatchObject({ companyName: 'Waze', policyTypes: ['privacy'], lang: 'en', honeypot: '' });
    expect(Object.keys(sanitized).sort()).toEqual([
      'companyName', 'effectiveDate', 'honeypot', 'lang', 'noticeDate',
      'policyTypes', 'senderDomain', 'sourceUrl',
    ].sort());
  });
});
