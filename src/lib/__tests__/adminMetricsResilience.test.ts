import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  diagnostics: vi.fn(),
  readiness: vi.fn(),
  environmentReadiness: vi.fn(),
  ensurePressMetricStorage: vi.fn(),
  companyCount: vi.fn(),
  policyCount: vi.fn(),
  snapshotCount: vi.fn(),
  changeCount: vi.fn(),
  subscriberCount: vi.fn(),
  inquiryCount: vi.fn(),
  inquiryFindFirst: vi.fn(),
  policyFindMany: vi.fn(),
  scanFindFirst: vi.fn(),
  remediationCount: vi.fn(),
  remediationFindFirst: vi.fn(),
  webhookCount: vi.fn(),
  webhookFindFirst: vi.fn(),
  latestChange: vi.fn(),
  allChanges: vi.fn(),
  pressGroupBy: vi.fn(),
}));

vi.mock('@/lib/adminAuth', () => ({ getSession: mocks.getSession }));
vi.mock('@/lib/databaseConfig', () => ({ getDatabaseDiagnostics: mocks.diagnostics }));
vi.mock('@/lib/databaseReadiness', () => ({
  getDatabaseReadinessReport: mocks.readiness,
  buildEnvironmentReadiness: mocks.environmentReadiness,
}));
vi.mock('@/lib/pressMetricStorage', () => ({
  ensurePressMetricStorage: mocks.ensurePressMetricStorage,
}));
vi.mock('@/lib/db', () => ({
  db: {
    company: { count: mocks.companyCount },
    policy: { count: mocks.policyCount, findMany: mocks.policyFindMany },
    policySnapshot: { count: mocks.snapshotCount },
    policyChange: {
      count: mocks.changeCount,
      findFirst: mocks.latestChange,
      findMany: mocks.allChanges,
    },
    subscriber: { count: mocks.subscriberCount },
    policyInquiry: { count: mocks.inquiryCount, findFirst: mocks.inquiryFindFirst },
    scanRun: { findFirst: mocks.scanFindFirst },
    sourceRemediationIssue: { count: mocks.remediationCount, findFirst: mocks.remediationFindFirst },
    webhookDelivery: { count: mocks.webhookCount, findFirst: mocks.webhookFindFirst },
    pressMetricEvent: { groupBy: mocks.pressGroupBy },
  },
}));

import { GET } from '@/app/api/admin/metrics/route';

describe('admin metrics resilience', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockReturnValue({ valid: true, role: 'admin' });
    mocks.diagnostics.mockResolvedValue({
      configured: true,
      url: 'file:/tmp/policywatcher.db',
      filePath: '/tmp/policywatcher.db',
      directoryPath: '/tmp',
      directoryExists: true,
      directoryWritable: true,
      fileExists: true,
      fileReadable: true,
      fileWritable: true,
      fileSizeBytes: 1024,
    });
    mocks.readiness.mockResolvedValue({
      status: 'ready',
      checkedAt: '2026-07-31T12:00:00.000Z',
      schema: { missingTables: [], missingMigrations: [] },
      diagnosticCode: null,
    });
    mocks.environmentReadiness.mockReturnValue({
      configuredCount: 6,
      expectedCount: 6,
      variables: [],
      boundary: 'Presence only.',
    });
    mocks.companyCount.mockResolvedValue(16);
    mocks.policyCount.mockResolvedValue(32);
    mocks.snapshotCount.mockResolvedValue(64);
    mocks.changeCount.mockResolvedValue(8);
    mocks.subscriberCount.mockResolvedValue(2);
    mocks.latestChange.mockResolvedValue({ createdAt: new Date('2026-07-29T00:00:00.000Z') });
    mocks.allChanges.mockResolvedValue([{ overallScore: 50, overallRisk: 'Medium' }]);
    mocks.inquiryFindFirst.mockResolvedValue(null);
    mocks.policyFindMany.mockResolvedValue([]);
    mocks.scanFindFirst.mockResolvedValue({ status: 'completed', startedAt: new Date() });
    mocks.remediationCount.mockResolvedValue(0);
    mocks.remediationFindFirst.mockResolvedValue(null);
    mocks.webhookCount.mockResolvedValue(0);
    mocks.webhookFindFirst.mockResolvedValue(null);
  });

  it('returns core metrics when optional recent tables are unavailable', async () => {
    mocks.inquiryCount.mockRejectedValue(new Error('no such table: PolicyInquiry'));
    mocks.ensurePressMetricStorage.mockRejectedValue(new Error('read-only database'));

    const response = await GET(new Request('https://policywatcher.online/api/admin/metrics') as never);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.companies).toBe(16);
    expect(payload.data.openPolicyInquiries).toBe(0);
    expect(payload.data.metricAvailability).toMatchObject({
      policyInquiries: false,
      pressNewsroom: false,
    });
    expect(payload.actionCenter.priorities.some((priority: { id: string }) => (
      priority.id === 'inquiry-metric-unavailable'
    ))).toBe(true);
    expect(payload.data.pressNewsroom.available).toBe(false);
    expect(payload.data.pressNewsroom.allTime.pressPackageDownloadIntents.total).toBe(0);
    expect(mocks.pressGroupBy).not.toHaveBeenCalled();
  });

  it('keeps one failed funnel query unavailable while other stages remain measured', async () => {
    mocks.policyCount.mockImplementation((args?: { where?: { checkLogs?: unknown } }) => {
      if (args?.where?.checkLogs) return Promise.reject(new Error('PolicyCheckLog unavailable'));
      return Promise.resolve(32);
    });

    const response = await GET(new Request('https://policywatcher.online/api/admin/metrics') as never);
    const payload = await response.json();
    const stages = Object.fromEntries(
      payload.publicationReadiness.stages.map((stage: { id: string }) => [stage.id, stage]),
    );

    expect(response.status).toBe(200);
    expect(stages.retrieved).toMatchObject({
      availability: 'unavailable',
      count: null,
      denominator: null,
      excluded: null,
    });
    expect(stages.configured).toMatchObject({ availability: 'measured', count: 32, denominator: 32 });
    expect(stages['baseline-verified']).toMatchObject({ availability: 'measured', count: 32, denominator: 32 });
    expect(stages.public).toMatchObject({ availability: 'measured', count: 32, denominator: 32 });
    expect(stages.analysed).toMatchObject({ availability: 'measured', count: 32, denominator: 32 });
  });
});
