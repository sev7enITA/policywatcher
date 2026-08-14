import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(), create: vi.fn(), findMany: vi.fn(), deleteMany: vi.fn(),
}));
vi.mock('@/lib/db', () => ({ db: { adminDashboardMetricEvent: mocks } }));

import { cleanupAdminDashboardTelemetry, recordAdminDashboardTelemetry } from '@/lib/adminDashboardTelemetryStorage';

const base = {
  visitId: 'e0d8d3af-37f2-4f3f-8d65-635e505bc047',
  priorityId: 'scan-stale',
  destination: '/admin/cron',
  numericValue: null,
  viewportClass: 'desktop' as const,
};

describe('admin dashboard telemetry storage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('derives actor role server-side and deduplicates the per-visit event key', async () => {
    mocks.create.mockResolvedValue({ id: 'event' });
    await expect(recordAdminDashboardTelemetry({ ...base, eventType: 'action-center-cta-attempt' }, 'auditor')).resolves.toBe('recorded');
    expect(mocks.create).toHaveBeenCalledWith({ data: expect.objectContaining({ actorRole: 'auditor', eventKey: 'action-center-cta-attempt:scan-stale:/admin/cron' }) });
    mocks.create.mockRejectedValueOnce({ code: 'P2002' });
    await expect(recordAdminDashboardTelemetry({ ...base, eventType: 'action-center-cta-attempt' }, 'admin')).resolves.toBe('deduplicated');
  });

  it('accepts arrival only after the matching attempt exists', async () => {
    mocks.findUnique.mockResolvedValueOnce(null);
    await expect(recordAdminDashboardTelemetry({ ...base, eventType: 'canonical-route-arrival' }, 'admin')).resolves.toBe('arrival-unconfirmed');
    expect(mocks.create).not.toHaveBeenCalled();
    mocks.findUnique.mockResolvedValueOnce({ id: 'attempt' });
    mocks.create.mockResolvedValueOnce({ id: 'arrival' });
    await expect(recordAdminDashboardTelemetry({ ...base, eventType: 'canonical-route-arrival' }, 'admin')).resolves.toBe('recorded');
  });

  it('deletes no more than the bounded 90-day retention batch', async () => {
    mocks.findMany.mockResolvedValue([{ id: 'old-1' }, { id: 'old-2' }]);
    mocks.deleteMany.mockResolvedValue({ count: 2 });
    await expect(cleanupAdminDashboardTelemetry(new Date('2026-08-01T00:00:00.000Z'), 9999)).resolves.toBe(2);
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 250 }));
    const cutoff = mocks.findMany.mock.calls[0][0].where.createdAt.lt as Date;
    expect(cutoff.toISOString()).toBe('2026-05-03T00:00:00.000Z');
  });
});
