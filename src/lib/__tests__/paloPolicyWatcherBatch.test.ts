import { describe, expect, it } from 'vitest';
import {
  buildPaloPolicyWatcherBatch,
  parsePaloPolicyWatcherBatchQuery,
  PALO_POLICYWATCHER_BATCH_BOUNDARY,
} from '../paloPolicyWatcherBatch';
import { decodePublicChangeEventCursor, type PublicChangeEventRow } from '../publicChangeEvents';
import goldenBatch from './fixtures/palo-policywatcher-signal-batch.v1.json';

const rows: PublicChangeEventRow[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    publicPublishedAt: '2026-08-26T10:00:00.000Z',
    overallRisk: 'Medium', overallScore: 5,
    tldrEn: 'Alpha published a public policy change.', tldrIt: 'Alpha ha pubblicato una modifica pubblica.',
    aiSummaryEn: 'English fallback.', aiSummaryIt: 'Fallback italiano.',
    policy: { id: 'policy-1', name: 'AI Policy', type: 'ai', jurisdiction: 'EU', company: { id: 'company-1', name: 'Alpha', slug: 'alpha', industry: 'Technology' } },
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    publicPublishedAt: '2026-08-26T11:00:00.000Z',
    overallRisk: 'Low', overallScore: 2,
    tldrEn: 'Beta published a public terms change.', tldrIt: 'Beta ha pubblicato una modifica pubblica.',
    aiSummaryEn: 'English fallback.', aiSummaryIt: 'Fallback italiano.',
    policy: { id: 'policy-2', name: 'Terms', type: 'terms', jurisdiction: 'Global', company: { id: 'company-2', name: 'Beta', slug: 'beta', industry: 'Technology' } },
  },
];

describe('PALO signal batch contract', () => {
  it('accepts only bounded forward-page input', () => {
    expect(parsePaloPolicyWatcherBatchQuery(new URLSearchParams('limit=25&lang=en'))).toEqual({
      ok: true, locale: 'en', limit: 25, cursor: null,
    });
    expect(parsePaloPolicyWatcherBatchQuery(new URLSearchParams('limit=26'))).toMatchObject({ ok: false });
    expect(parsePaloPolicyWatcherBatchQuery(new URLSearchParams('private=true'))).toMatchObject({ ok: false });
    expect(parsePaloPolicyWatcherBatchQuery(new URLSearchParams('lang=fr'))).toMatchObject({ ok: false });
  });

  it('builds a complete active snapshot page with PALO-owned signals and an opaque cursor', () => {
    const batch = buildPaloPolicyWatcherBatch(rows.slice(0, 1), { locale: 'en', limit: 25, inputCursor: null, hasMore: false });
    expect(batch).toEqual(goldenBatch);
    expect(batch).toMatchObject({
      format: 'palo-policywatcher-signal-batch', schemaVersion: '1.0.0', mode: 'complete-active-snapshot',
      locale: 'en', count: 1, limit: 25, hasMore: false, boundary: PALO_POLICYWATCHER_BATCH_BOUNDARY,
    });
    expect(batch.signals).toHaveLength(1);
    expect(batch.signals.every((signal) => signal.authority.status === 'non-authoritative-monitoring-signal')).toBe(true);
    expect(decodePublicChangeEventCursor(batch.nextCursor || '')).toEqual({
      version: 1, occurredAt: rows[0].publicPublishedAt, changeId: rows[0].id,
    });
  });
});
