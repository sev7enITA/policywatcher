import { describe, expect, it } from 'vitest';
import {
  createEventContinuityCheckpoint,
  EVENT_CONTINUITY_BOUNDARY,
  inspectEventContinuity,
  parseEventContinuityCheckpoint,
  serializeEventContinuityCheckpoint,
} from '../eventContinuity';
import { buildPublicChangeEventFeed, type PublicChangeEventRow } from '../publicChangeEvents';

const rows: PublicChangeEventRow[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    publicPublishedAt: '2026-07-29T08:00:00.000Z',
    overallRisk: 'Medium',
    overallScore: 5,
    tldrEn: 'First event.',
    tldrIt: 'Primo evento.',
    aiSummaryEn: 'First event fallback.',
    aiSummaryIt: 'Fallback primo evento.',
    policy: { id: 'policy-1', name: 'Privacy Policy', type: 'privacy', jurisdiction: 'EU', company: { id: 'company-1', name: 'Alpha', slug: 'alpha', industry: 'Technology' } },
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    publicPublishedAt: '2026-07-30T08:00:00.000Z',
    overallRisk: 'Low',
    overallScore: 3,
    tldrEn: 'Second event.',
    tldrIt: 'Secondo evento.',
    aiSummaryEn: 'Second event fallback.',
    aiSummaryIt: 'Fallback secondo evento.',
    policy: { id: 'policy-2', name: 'AI Terms', type: 'ai', jurisdiction: 'US', company: { id: 'company-2', name: 'Beta', slug: 'beta', industry: 'Technology' } },
  },
];

function feed(inputRows = rows, initialWindowTruncated = false) {
  return buildPublicChangeEventFeed(inputRows, {
    locale: 'en',
    limit: 25,
    inputCursor: null,
    hasMore: false,
    initialWindowTruncated,
  });
}

describe('event feed continuity checkpoint', () => {
  it('creates and deterministically serializes a bounded browser-local checkpoint', () => {
    const checkpoint = createEventContinuityCheckpoint(feed(), null, '2026-07-30T09:00:00.000Z');
    expect(checkpoint).toMatchObject({
      version: 1,
      savedAt: '2026-07-30T09:00:00.000Z',
      feedSchemaVersion: '1.0.0',
      locale: 'en',
      observedEventCount: 2,
      boundary: EVENT_CONTINUITY_BOUNDARY,
    });
    expect(checkpoint.watermark?.eventId).toBe(feed().events[1].eventId);
    const serialized = serializeEventContinuityCheckpoint(checkpoint);
    expect(serializeEventContinuityCheckpoint(parseEventContinuityCheckpoint(serialized)!)).toBe(serialized);
  });

  it('rejects oversized, extended and internally inconsistent checkpoint input', () => {
    const checkpoint = createEventContinuityCheckpoint(feed(), null, '2026-07-30T09:00:00.000Z');
    expect(parseEventContinuityCheckpoint('x'.repeat(16_385))).toBeNull();
    expect(parseEventContinuityCheckpoint(JSON.stringify({ ...checkpoint, secret: 'not-allowed' }))).toBeNull();
    expect(parseEventContinuityCheckpoint(JSON.stringify({ ...checkpoint, observedEventIds: [] }))).toBeNull();
    expect(parseEventContinuityCheckpoint(JSON.stringify({ ...checkpoint, cursor: 'invalid cursor' }))).toBeNull();
  });

  it('reports a clear chronological window without making completeness claims', () => {
    const report = inspectEventContinuity(feed());
    expect(report).toMatchObject({
      status: 'clear',
      metrics: { received: 2, unique: 2, duplicates: 0, orderedChronologically: true },
      boundary: EVENT_CONTINUITY_BOUNDARY,
    });
    expect(JSON.stringify(report)).not.toMatch(/guaranteed|complete coverage|zero gaps/i);
  });

  it('identifies truncation, duplicates and ordering regressions', () => {
    const malformed = feed([rows[1], rows[0], rows[0]], true);
    const report = inspectEventContinuity(malformed);
    expect(report.status).toBe('attention');
    expect(report.findings.map((finding) => finding.code)).toEqual(expect.arrayContaining([
      'initial_window_truncated',
      'duplicate_event_id',
      'ordering_regression',
    ]));
  });

  it('detects overlap with bounded local history and preserves a checkpoint through an empty poll', () => {
    const firstFeed = feed([rows[0]]);
    const checkpoint = createEventContinuityCheckpoint(firstFeed, null, '2026-07-29T09:00:00.000Z');
    const overlap = inspectEventContinuity(firstFeed, checkpoint);
    expect(overlap.metrics.crossWindowDuplicates).toBe(1);
    expect(overlap.findings.some((finding) => finding.code === 'checkpoint_overlap')).toBe(true);

    const emptyFeed = buildPublicChangeEventFeed([], {
      locale: 'en',
      limit: 25,
      inputCursor: null,
      hasMore: false,
      initialWindowTruncated: false,
    });
    const updated = createEventContinuityCheckpoint(emptyFeed, checkpoint, '2026-07-30T10:00:00.000Z');
    expect(updated.cursor).toBeNull();
    expect(updated.watermark).toEqual(checkpoint.watermark);
    expect(updated.observedEventIds).toEqual(checkpoint.observedEventIds);
  });
});
