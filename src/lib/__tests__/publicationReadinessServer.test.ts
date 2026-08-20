import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  policyCount: vi.fn(),
  latestCapture: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    policy: { count: mocks.policyCount },
    policyCheckLog: { findFirst: mocks.latestCapture },
  },
}));

import {
  getAuthoritativePublicationReadiness,
  serializePublicPublicationReadiness,
} from '@/lib/publicationReadinessServer';

describe('authoritative publication readiness data source', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.policyCount
      .mockResolvedValueOnce(20)
      .mockResolvedValueOnce(18)
      .mockResolvedValueOnce(15)
      .mockResolvedValueOnce(12)
      .mockResolvedValueOnce(7);
    mocks.latestCapture.mockResolvedValue({
      checkedAt: new Date('2026-08-19T10:15:00.000Z'),
    });
  });

  it('derives every published stage and latest capture from one database service', async () => {
    const result = await getAuthoritativePublicationReadiness({
      checkedAt: new Date('2026-08-19T11:00:00.000Z'),
    });

    expect(result.stages.map((stage) => stage.count)).toEqual([20, 18, 15, 12, 7]);
    expect(result.latestCapture).toMatchObject({
      availability: 'measured',
      capturedAt: '2026-08-19T10:15:00.000Z',
    });
    expect(mocks.policyCount).toHaveBeenCalledTimes(5);
    expect(mocks.latestCapture).toHaveBeenCalledWith(expect.objectContaining({
      orderBy: { checkedAt: 'desc' },
      select: { checkedAt: true },
    }));
  });

  it('keeps one failed query unavailable and sanitizes the public representation', async () => {
    mocks.policyCount.mockReset();
    mocks.policyCount
      .mockResolvedValueOnce(20)
      .mockRejectedValueOnce(new Error('SELECT secret FROM private_table'))
      .mockResolvedValueOnce(15)
      .mockResolvedValueOnce(12)
      .mockResolvedValueOnce(7);

    const result = await getAuthoritativePublicationReadiness({
      checkedAt: new Date('2026-08-19T11:00:00.000Z'),
    });
    const payload = serializePublicPublicationReadiness(result);

    expect(result.stages[1]).toMatchObject({ availability: 'unavailable', count: null });
    expect(payload).toMatchObject({
      schema: 'https://policywatcher.online/schemas/publication-readiness/v1',
      metricId: 'publication-readiness',
      contractVersion: '1.0.0',
      source: 'database',
    });
    expect(payload.stages[0]).not.toHaveProperty('actionHref');
    expect(payload.stages[0]).not.toHaveProperty('actionLabel');
    expect(JSON.stringify(payload)).not.toMatch(/SELECT secret|private_table/i);
  });
});
