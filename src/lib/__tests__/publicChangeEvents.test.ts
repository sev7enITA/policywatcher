import { describe, expect, it } from 'vitest';
import { pressKitSchemas } from '../pressKitSchemas';
import {
  buildPublicChangeEventFeed,
  decodePublicChangeEventCursor,
  encodePublicChangeEventCursor,
  parsePublicChangeEventQuery,
  type PublicChangeEventRow,
} from '../publicChangeEvents';

const CHANGE_ID = '11111111-1111-4111-8111-111111111111';
const row: PublicChangeEventRow = {
  id: CHANGE_ID,
  publicPublishedAt: '2026-07-29T08:00:00.000Z',
  overallRisk: 'Medium',
  overallScore: 5,
  tldrEn: 'English public summary.',
  tldrIt: 'Sommario pubblico italiano.',
  aiSummaryEn: 'English fallback.',
  aiSummaryIt: 'Fallback italiano.',
  policy: {
    id: 'policy-1',
    name: 'Privacy Policy',
    type: 'privacy',
    jurisdiction: 'EU',
    company: { id: 'company-1', name: 'Alpha', slug: 'alpha', industry: 'Technology' },
  },
};

describe('public change event polling contract', () => {
  it('parses bounded queries and rejects unknown or malformed input', () => {
    expect(parsePublicChangeEventQuery(new URLSearchParams())).toEqual({ ok: true, locale: 'en', limit: 25, cursor: null });
    expect(parsePublicChangeEventQuery(new URLSearchParams('limit=100&lang=it'))).toMatchObject({ ok: true, locale: 'it', limit: 100 });
    expect(parsePublicChangeEventQuery(new URLSearchParams('limit=101'))).toMatchObject({ ok: false });
    expect(parsePublicChangeEventQuery(new URLSearchParams('limit=2.5'))).toMatchObject({ ok: false });
    expect(parsePublicChangeEventQuery(new URLSearchParams('lang=fr'))).toMatchObject({ ok: false });
    expect(parsePublicChangeEventQuery(new URLSearchParams('admin=true'))).toMatchObject({ ok: false });
    expect(parsePublicChangeEventQuery(new URLSearchParams('cursor=invalid'))).toMatchObject({ ok: false });
  });

  it('round-trips a strict opaque forward cursor', () => {
    const cursor = { version: 1 as const, occurredAt: row.publicPublishedAt as string, changeId: CHANGE_ID };
    const encoded = encodePublicChangeEventCursor(cursor);
    expect(decodePublicChangeEventCursor(encoded)).toEqual(cursor);
    expect(decodePublicChangeEventCursor(`${encoded}!`)).toBeNull();
    expect(decodePublicChangeEventCursor(Buffer.from(JSON.stringify({ ...cursor, version: 2 })).toString('base64url'))).toBeNull();
    expect(decodePublicChangeEventCursor(Buffer.from(` ${JSON.stringify(cursor)}`).toString('base64url'))).toBeNull();
  });

  it('builds deterministic localized envelopes without delivery claims', () => {
    const first = buildPublicChangeEventFeed([row], { locale: 'it', limit: 25, inputCursor: null, hasMore: false, initialWindowTruncated: false });
    const second = buildPublicChangeEventFeed([row], { locale: 'it', limit: 25, inputCursor: null, hasMore: false, initialWindowTruncated: false });

    expect(first.schema).toBe(pressKitSchemas['change-event-feed'].$id);
    expect(first.events[0]).toMatchObject({
      eventType: 'policy.change.published',
      occurredAt: row.publicPublishedAt,
      screening: { summary: row.tldrIt },
      subject: { changeId: CHANGE_ID },
    });
    expect(first.events[0].eventId).toBe(second.events[0].eventId);
    expect(first.nextCursor).toBe(second.nextCursor);
    expect(JSON.stringify(first)).not.toMatch(/recipient|subscription|deliveryReceipt|webhookSecret|rawText/i);
  });

  it('assigns a new event identity when the same change is published again later', () => {
    const first = buildPublicChangeEventFeed([row], { locale: 'en', limit: 25, inputCursor: null, hasMore: false, initialWindowTruncated: false });
    const republished = buildPublicChangeEventFeed(
      [{ ...row, publicPublishedAt: '2026-07-30T08:00:00.000Z' }],
      { locale: 'en', limit: 25, inputCursor: null, hasMore: false, initialWindowTruncated: false },
    );
    expect(republished.events[0].eventId).not.toBe(first.events[0].eventId);
  });

  it('retains the input cursor when a poll returns no new events', () => {
    const cursor = { version: 1 as const, occurredAt: row.publicPublishedAt as string, changeId: CHANGE_ID };
    const feed = buildPublicChangeEventFeed([], { locale: 'en', limit: 25, inputCursor: cursor, hasMore: false, initialWindowTruncated: false });
    expect(feed.events).toEqual([]);
    expect(decodePublicChangeEventCursor(feed.nextCursor as string)).toEqual(cursor);
  });
});
