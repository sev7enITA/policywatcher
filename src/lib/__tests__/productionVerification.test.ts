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
    vi.stubEnv('ADMIN_SESSION_HMAC_SECRET', 'b'.repeat(32));
    vi.stubEnv('INVESTOR_SESSION_HMAC_SECRET', 'c'.repeat(32));
    mocks.readiness.mockResolvedValue({
      status: 'ready', schema: { presentTableCount: 10, expectedTableCount: 10, appliedMigrationCount: 4, expectedMigrationCount: 4 },
      integrity: { quickCheck: 'ok' },
      database: { provider: 'sqlite' },
    });
    const fetcher = vi.fn(async (url: string | URL | Request) => {
      const target = String(url);
      if (target.endsWith('/trust')) return response(200, {}, {
        'strict-transport-security': 'max-age=31536000', 'x-content-type-options': 'nosniff',
        'x-frame-options': 'DENY', 'content-security-policy': "frame-ancestors 'none'",
      });
      if (target.endsWith('/api/v1/manifest')) return response(200, { release: '4.0.0-beta.2' });
      if (target.endsWith('/api/v1/publication-readiness')) return response(200, {
        schema: 'https://policywatcher.online/schemas/publication-readiness/v1',
        metricId: 'publication-readiness',
        contractVersion: '1.0.0',
        source: 'database',
        stages: [
          { id: 'configured' },
          { id: 'retrieved' },
          { id: 'baseline-verified' },
          { id: 'public' },
          { id: 'analysed' },
        ],
        latestCapture: { capturedAt: null },
      }, { 'cache-control': 'no-store' });
      return response(401, { error: 'Unauthorized' });
    }) as unknown as typeof fetch;

    const report = await getProductionVerificationReport({ requestOrigin: 'https://policywatcher.online', role: 'auditor', fetcher });
    expect(report.contractVersion).toBe('1.1.0');
    expect(report.summary.attention).toBe(0);
    expect(report.summary.unavailable).toBe(0);
    expect(report.summary.external).toBe(1);
    expect(report.status).toBe('attention');
    expect(report.checks.find((check) => check.id === 'database-readiness')?.state).toBe('passed');
    expect(report.checks.find((check) => check.id === 'publication-readiness-contract')?.state).toBe('passed');
    expect(report.checks.find((check) => check.id === 'independent-dynamic-test')?.state).toBe('external');
  });

  it('flags a production www origin as divergent from the public canonical host', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('APP_URL', 'https://www.policywatcher.online');
    vi.stubEnv('API_SECRET', 'a'.repeat(32));
    vi.stubEnv('ADMIN_SESSION_HMAC_SECRET', 'b'.repeat(32));
    vi.stubEnv('INVESTOR_SESSION_HMAC_SECRET', 'c'.repeat(32));
    mocks.readiness.mockResolvedValue({ status: 'ready', schema: {}, integrity: {}, database: { provider: 'sqlite' } });
    const fetcher = vi.fn(async () => response(401, { error: 'Unauthorized' })) as unknown as typeof fetch;

    const report = await getProductionVerificationReport({
      requestOrigin: 'https://policywatcher.online',
      role: 'auditor',
      fetcher,
    });

    expect(report.checks.find((check) => check.id === 'production-runtime')).toMatchObject({
      state: 'attention',
      expected: 'Production mode with APP_URL=https://policywatcher.online.',
    });
  });
});
