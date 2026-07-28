import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  diagnostics: vi.fn(),
  ensurePressMetricStorage: vi.fn(),
  companyCount: vi.fn(),
  policyCount: vi.fn(),
  snapshotCount: vi.fn(),
  changeCount: vi.fn(),
  subscriberCount: vi.fn(),
  inquiryCount: vi.fn(),
  latestChange: vi.fn(),
  allChanges: vi.fn(),
  pressGroupBy: vi.fn(),
}));

vi.mock('@/lib/adminAuth', () => ({ getSession: mocks.getSession }));
vi.mock('@/lib/databaseConfig', () => ({ getDatabaseDiagnostics: mocks.diagnostics }));
vi.mock('@/lib/pressMetricStorage', () => ({
  ensurePressMetricStorage: mocks.ensurePressMetricStorage,
}));
vi.mock('@/lib/db', () => ({
  db: {
    company: { count: mocks.companyCount },
    policy: { count: mocks.policyCount },
    policySnapshot: { count: mocks.snapshotCount },
    policyChange: {
      count: mocks.changeCount,
      findFirst: mocks.latestChange,
      findMany: mocks.allChanges,
    },
    subscriber: { count: mocks.subscriberCount },
    policyInquiry: { count: mocks.inquiryCount },
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
    mocks.companyCount.mockResolvedValue(16);
    mocks.policyCount.mockResolvedValue(32);
    mocks.snapshotCount.mockResolvedValue(64);
    mocks.changeCount.mockResolvedValue(8);
    mocks.subscriberCount.mockResolvedValue(2);
    mocks.latestChange.mockResolvedValue({ createdAt: new Date('2026-07-29T00:00:00.000Z') });
    mocks.allChanges.mockResolvedValue([{ overallScore: 50, overallRisk: 'Medium' }]);
  });

  it('returns core metrics when optional recent tables are unavailable', async () => {
    mocks.inquiryCount.mockRejectedValue(new Error('no such table: PolicyInquiry'));
    mocks.ensurePressMetricStorage.mockRejectedValue(new Error('read-only database'));

    const response = await GET(new Request('https://policywatcher.online/api/admin/metrics') as never);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.companies).toBe(16);
    expect(payload.data.openPolicyInquiries).toBe(0);
    expect(payload.data.metricAvailability).toEqual({
      policyInquiries: false,
      pressNewsroom: false,
    });
    expect(payload.data.pressNewsroom.available).toBe(false);
    expect(payload.data.pressNewsroom.allTime.pressPackageDownloadIntents.total).toBe(0);
    expect(mocks.pressGroupBy).not.toHaveBeenCalled();
  });
});
