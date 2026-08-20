import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  scanCreate: vi.fn(),
  scanUpdate: vi.fn(),
  scanUpdateMany: vi.fn(),
  policyFindMany: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    scanRun: {
      create: mocks.scanCreate,
      update: mocks.scanUpdate,
      updateMany: mocks.scanUpdateMany,
    },
    policy: { findMany: mocks.policyFindMany },
  },
}));

import { runFullScan, ScanAlreadyRunningError } from '@/app/api/cron/check-all/route';

describe('durable scan-run lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.scanCreate.mockResolvedValue({ id: 'scan-1' });
    mocks.scanUpdate.mockResolvedValue({ id: 'scan-1' });
    mocks.scanUpdateMany.mockResolvedValue({ count: 1 });
    mocks.policyFindMany.mockResolvedValue([]);
  });

  it('holds a unique renewable lease and clears it on ordinary completion', async () => {
    const result = await runFullScan(undefined, { limit: 5 });

    expect(result).toMatchObject({ scanRunId: 'scan-1', selected: 0, checked: 0 });
    expect(mocks.scanCreate).toHaveBeenCalledWith({ data: expect.objectContaining({
      status: 'running', leaseKey: 'policy-scan', leaseExpiresAt: expect.any(Date),
    }) });
    expect(mocks.scanUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: 'scan-1', leaseKey: 'policy-scan' }),
      data: { leaseExpiresAt: expect.any(Date) },
    }));
    expect(mocks.scanUpdate).toHaveBeenLastCalledWith({
      where: { id: 'scan-1' },
      data: expect.objectContaining({ status: 'completed', leaseKey: null, leaseExpiresAt: null }),
    });
  });

  it('maps the unique lease conflict to a stable already-running error', async () => {
    mocks.scanCreate.mockRejectedValue({ code: 'P2002' });
    await expect(runFullScan()).rejects.toBeInstanceOf(ScanAlreadyRunningError);
    expect(mocks.policyFindMany).not.toHaveBeenCalled();
  });

  it('closes a run as failed when execution aborts after lease acquisition', async () => {
    mocks.policyFindMany.mockRejectedValue(new Error('database unavailable'));
    await expect(runFullScan()).rejects.toThrow('database unavailable');
    expect(mocks.scanUpdateMany).toHaveBeenLastCalledWith({
      where: { id: 'scan-1', status: 'running' },
      data: expect.objectContaining({
        status: 'failed', completedAt: expect.any(Date), leaseKey: null,
        leaseExpiresAt: null, failureReason: 'scan_execution_failed',
      }),
    });
  });
});
