import { describe, expect, it, vi } from 'vitest';
import {
  claimDiscoveryJob,
  completeDiscoveryJob,
  failDiscoveryJob,
  serializeDiscoveryJob,
} from '../policyDiscoveryJobs';

function job(overrides: Record<string, unknown> = {}) {
  return {
    id: 'job-1',
    companyId: 'company-1',
    runToken: 'run-old',
    status: 'running',
    startedAt: new Date('2026-07-21T10:00:00Z'),
    completedAt: null,
    candidateCount: 0,
    error: null,
    createdAt: new Date('2026-07-21T10:00:00Z'),
    updatedAt: new Date('2026-07-21T10:00:00Z'),
    ...overrides,
  };
}

describe('persistent policy discovery jobs', () => {
  it('rejects a second claim while a persisted job is still active', async () => {
    const existing = job();
    const updateMany = vi.fn();
    const client = {
      policyDiscoveryJob: {
        findUnique: vi.fn().mockResolvedValue(existing),
        create: vi.fn(),
        updateMany,
      },
    };

    const result = await claimDiscoveryJob(client as never, 'company-1', {
      now: new Date('2026-07-21T10:05:00Z'),
      runToken: 'run-new',
    });

    expect(result).toMatchObject({ claimed: false, job: { status: 'running' } });
    expect(updateMany).not.toHaveBeenCalled();
  });

  it('atomically replaces a stale persisted claim', async () => {
    const client = {
      policyDiscoveryJob: {
        findUnique: vi.fn().mockResolvedValue(job()),
        create: vi.fn(),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };

    const result = await claimDiscoveryJob(client as never, 'company-1', {
      now: new Date('2026-07-21T10:11:00Z'),
      runToken: 'run-new',
    });

    expect(result).toMatchObject({ claimed: true, runToken: 'run-new' });
    expect(client.policyDiscoveryJob.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ runToken: 'run-old', status: 'running' }),
      data: expect.objectContaining({ runToken: 'run-new', status: 'running' }),
    }));
  });

  it('completes or fails only the matching active run token', async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const client = { policyDiscoveryJob: { updateMany } };

    await completeDiscoveryJob(client as never, 'company-1', 'run-1', 4, new Date('2026-07-21T10:04:00Z'));
    await failDiscoveryJob(client as never, 'company-1', 'run-2', 'x'.repeat(2_100), new Date('2026-07-21T10:05:00Z'));

    expect(updateMany.mock.calls[0][0].where).toEqual({ companyId: 'company-1', runToken: 'run-1', status: 'running' });
    expect(updateMany.mock.calls[0][0].data).toMatchObject({ status: 'completed', candidateCount: 4 });
    expect(updateMany.mock.calls[1][0].where).toEqual({ companyId: 'company-1', runToken: 'run-2', status: 'running' });
    expect(updateMany.mock.calls[1][0].data.error).toHaveLength(2_000);
  });

  it('serializes persisted timestamps for the polling API', () => {
    expect(serializeDiscoveryJob(job({ status: 'completed', completedAt: new Date('2026-07-21T10:04:00Z') })))
      .toMatchObject({
        status: 'completed',
        startedAt: '2026-07-21T10:00:00.000Z',
        completedAt: '2026-07-21T10:04:00.000Z',
      });
  });
});
