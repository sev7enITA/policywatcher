import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { unstable_doesMiddlewareMatch } from 'next/experimental/testing/server';

const session = vi.hoisted(() => ({ valid: false, role: 'admin' }));
vi.mock('../adminAuth', () => ({ COOKIE_NAME: 'admin_session', verifySessionToken: () => session }));
import { config, proxy } from '../../proxy';

const request = (path: string, headers: Record<string, string> = {}, method = 'GET') => new NextRequest(`https://staging.policywatcher.online${path}`, { method, headers });
afterEach(() => { vi.unstubAllEnvs(); session.valid = false; session.role = 'admin'; });

describe('private hosted preview gateway', () => {
  it('protects pages, RSC, prefetch, APIs, feeds and exports from anonymous readers', () => {
    vi.stubEnv('POLICYWATCHER_HOSTED_PREVIEW', '1');
    for (const path of ['/', '/admin/engine', '/company/apple', '/api/v1/policies', '/api/admin/engine', '/feed.xml', '/sitemap.xml', '/export.csv', '/_next/image?url=%2Fprivate.png&w=640&q=75']) {
      for (const headers of [{}, { RSC: '1', 'next-router-prefetch': '1' }, { purpose: 'prefetch' }]) {
        expect(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url: path, headers })).toBe(true);
        const response = proxy(request(path, headers as Record<string, string>));
        expect(response.status).toBe(path.startsWith('/api/') ? 401 : 307);
        expect(response.headers.get('Cache-Control')).toContain('private, no-store');
        expect(response.headers.get('X-Robots-Tag')).toContain('noindex');
      }
    }
  });

  it('rejects an auditor and allows the login screen without disclosing private pages', () => {
    vi.stubEnv('POLICYWATCHER_HOSTED_PREVIEW', '1');
    session.valid = true; session.role = 'auditor';
    expect(proxy(request('/api/admin/engine')).status).toBe(401);
    expect(proxy(request('/admin/login')).status).toBe(200);
    expect(proxy(request('/api/admin/auth')).status).toBe(200);
  });

  it('routes an authenticated administrator to the actual engine and blocks legacy mutations', () => {
    vi.stubEnv('POLICYWATCHER_HOSTED_PREVIEW', '1'); session.valid = true;
    expect(proxy(request('/')).headers.get('Location')).toBe('https://staging.policywatcher.online/admin/engine');
    expect(proxy(request('/admin/engine')).status).toBe(200);
    expect(proxy(request('/api/admin/engine')).status).toBe(200);
    for (const path of ['/api/cron/check-all', '/api/admin/webhooks', '/api/subscribe']) {
      expect(proxy(request(path, {}, 'POST')).status).toBe(409);
    }
  });

  it('does not apply the hosted gate to the stable service and keeps the trial out of search', async () => {
    expect(proxy(request('/')).status).toBe(200);
    vi.stubEnv('POLICYWATCHER_HOSTED_PREVIEW', '1');
    expect(await proxy(request('/robots.txt')).text()).toBe('User-agent: *\nDisallow: /\n');
  });

  it('keeps the production preview artifact private even when its opt-in flag is missing or malformed', () => {
    vi.stubEnv('NODE_ENV', 'production');
    for (const flag of ['', '0', 'true']) {
      vi.stubEnv('POLICYWATCHER_HOSTED_PREVIEW', flag);
      expect(proxy(request('/api/companies')).status).toBe(401);
      expect(proxy(request('/admin/engine', { RSC: '1', purpose: 'prefetch' })).status).toBe(307);
      session.valid = true;
      expect(proxy(request('/api/cron/check-all', {}, 'POST')).status).toBe(409);
      session.valid = false;
    }
  });
});
