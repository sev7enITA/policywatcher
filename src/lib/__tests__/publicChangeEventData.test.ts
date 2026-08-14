import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../db', () => ({ db: { policyChange: { findMany: vi.fn() } } }));

import { db } from '../db';
import { getPublicChangeEventFeed } from '../publicChangeEventData';

describe('public change event data gate', () => {
  beforeEach(() => vi.clearAllMocks());

  it('queries only public changes and returns the latest window chronologically', async () => {
    vi.mocked(db.policyChange.findMany).mockResolvedValue([]);
    const feed = await getPublicChangeEventFeed({ ok: true, locale: 'en', limit: 25, cursor: null });
    const query = vi.mocked(db.policyChange.findMany).mock.calls[0][0] as Record<string, unknown>;

    expect(query.where).toMatchObject({ publicEvidence: true, publicPublishedAt: { not: null } });
    expect(query.take).toBe(26);
    expect(query.orderBy).toEqual([{ publicPublishedAt: 'desc' }, { id: 'desc' }]);
    expect(feed.initialWindowTruncated).toBe(false);
  });

  it('uses an ascending compound boundary for forward cursor polls', async () => {
    vi.mocked(db.policyChange.findMany).mockResolvedValue([]);
    await getPublicChangeEventFeed({
      ok: true,
      locale: 'en',
      limit: 10,
      cursor: { version: 1, occurredAt: '2026-07-29T08:00:00.000Z', changeId: '11111111-1111-4111-8111-111111111111' },
    });
    const query = vi.mocked(db.policyChange.findMany).mock.calls[0][0] as Record<string, unknown>;
    expect(query.orderBy).toEqual([{ publicPublishedAt: 'asc' }, { id: 'asc' }]);
    expect(query.where).toMatchObject({ OR: expect.any(Array), publicEvidence: true, publicPublishedAt: { not: null } });
  });
});
