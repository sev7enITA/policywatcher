import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ readiness: vi.fn() }));
vi.mock('../databaseReadiness', () => ({ getDatabaseReadinessReport: mocks.readiness }));

import { getProductionVerificationReport, resolveProductionVerificationOrigin } from '../productionVerification';

function response(status: number, body: unknown = {}, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });
}

describe('production verification contract', () => {
  afterEach(() => { vi.unstubAllEnvs(); mocks.readiness.mockReset(); });

  it('accepts HTTPS deployment origins and local HTTP only outside production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('APP_URL', 'https://policywatcher.online');
    expect(resolveProductionVerificationOrigin('https://ignored.example')).toBe('https://policywatcher.online');
    vi.stubEnv('APP_URL', 'http://policywatcher.online');
    expect(resolveProductionVerificationOrigin('http://attacker.example')).toBeNull();
  });

  it('keeps independent testing external while evaluating live and database evidence', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('APP_URL', 'https://policywatcher.online');
    vi.stubEnv('API_SECRET', 'a'.repeat(32));
    vi.stubEnv('SESSION_HMAC_SECRET', 'b'.repeat(32));
    mocks.readiness.mockResolvedValue({
      status: 'ready', schema: { presentTableCount: 10, expectedTableCount: 10, appliedMigrationCount: 4, expectedMigrationCount: 4 },
      integrity: { quickCheck: 'ok' },
    });
    const fetcher = vi.fn(async (url: string | URL | Request) => {
      const target = String(url);
      if (target.endsWith('/trust')) return response(200, {}, {
        'strict-transport-security': 'max-age=31536000', 'x-content-type-options': 'nosniff',
        'x-frame-options': 'DENY', 'content-security-policy': "frame-ancestors 'none'",
      });
      if (target.endsWith('/api/v1/manifest')) return response(200, { release: '3.9.0-beta.37' });
      return response(401, { error: 'Unauthorized' });
    }) as unknown as typeof fetch;

    const report = await getProductionVerificationReport({ requestOrigin: 'https://policywatcher.online', role: 'auditor', fetcher });
    expect(report.summary.attention).toBe(0);
    expect(report.summary.unavailable).toBe(0);
    expect(report.summary.external).toBe(1);
    expect(report.status).toBe('attention');
    expect(report.checks.find((check) => check.id === 'database-readiness')?.state).toBe('passed');
    expect(report.checks.find((check) => check.id === 'independent-dynamic-test')?.state).toBe('external');
  });
});
