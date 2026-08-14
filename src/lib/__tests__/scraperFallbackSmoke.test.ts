import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  scrapePolicyText,
  type ScraperControlledFallbacks,
  type TransportResult,
} from '../scraper';

const URL = 'https://8.8.8.8/policy';
const POLICY_HTML = `
  <html><body><main>
    <h1>Privacy Policy</h1>
    <p>${'We collect personal data and information for account services. Users have privacy rights, cookie consent controls, retention details, processing purposes, third party disclosure terms, legal agreement protections, and GDPR remedies. '.repeat(8)}</p>
  </main></body></html>
`;

function failed(error: string, status = 403): TransportResult {
  return { ok: false, html: '', status, finalUrl: URL, error };
}

function accepted(finalUrl = URL, archiveTimestamp?: string): TransportResult {
  return {
    ok: true,
    html: POLICY_HTML,
    status: 200,
    finalUrl,
    error: '',
    archiveTimestamp,
  };
}

function controlled(
  overrides: Partial<ScraperControlledFallbacks>
): ScraperControlledFallbacks {
  return {
    skipDelays: true,
    direct: async () => failed('HTTP 403'),
    http2: async () => failed('h2_status_403'),
    wayback: async () => failed('wayback_no_snapshots', 0),
    commoncrawl: async () => failed('cc_no_results', 0),
    ...overrides,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe('controlled fallback rescue smoke tests', () => {
  it('accepts evidence rescued by the HTTP/2 strategy', async () => {
    const result = await scrapePolicyText(URL, {
      controlledFallbacks: controlled({ http2: async () => accepted() }),
    });

    expect(result.status).toBe('ok');
    expect(result.source).toBe('http2');
    expect(result.diagnostics?.map((item) => `${item.source}:${item.status}`))
      .toEqual(['direct:failed', 'http2:ok']);
  });

  it('accepts evidence rescued by the renderer strategy', async () => {
    const result = await scrapePolicyText(URL, {
      controlledFallbacks: controlled({ rendered: async () => accepted() }),
    });

    expect(result.status).toBe('ok');
    expect(result.source).toBe('rendered');
    expect(result.diagnostics?.at(-1)).toMatchObject({ source: 'rendered', status: 'ok' });
  });

  it('accepts fresh evidence rescued by Common Crawl', async () => {
    vi.stubEnv('RENDERER_URL', '');
    vi.stubEnv('RENDERER_SECRET', '');
    const result = await scrapePolicyText(URL, {
      archiveNotBefore: new Date('2026-08-01T00:00:00Z'),
      controlledFallbacks: controlled({
        commoncrawl: async () => accepted(
          'commoncrawl://8.8.8.8/policy',
          '20260805090000'
        ),
      }),
    });

    expect(result.status).toBe('ok');
    expect(result.source).toBe('commoncrawl');
    expect(result.archiveTimestamp).toBe('2026-08-05T09:00:00.000Z');
    expect(result.diagnostics?.at(-1)).toMatchObject({ source: 'commoncrawl', status: 'ok' });
  });

  it('keeps untrusted transport details out of console logs while retaining diagnostics', async () => {
    vi.stubEnv('RENDERER_URL', '');
    vi.stubEnv('RENDERER_SECRET', '');
    const forgedError = 'timeout\r\n[Admin] forged';
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const result = await scrapePolicyText(URL, {
      controlledFallbacks: controlled({ direct: async () => failed(forgedError, 0) }),
    });

    const consoleOutput = log.mock.calls.map(([message]) => String(message)).join('\n');
    expect(result.diagnostics?.find((item) => item.source === 'direct')?.reason).toBe(forgedError);
    expect(consoleOutput).toContain('[Scraper] [1/5] Transport failure recorded.');
    expect(consoleOutput).toContain('[Scraper] [ERROR] All 5 strategies exhausted.');
    expect(consoleOutput).not.toContain('[Admin] forged');
  });
});
