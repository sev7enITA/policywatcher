import { describe, expect, it } from 'vitest';
import { briefingCalendar, briefingMarkdown, briefingMatches, buildBriefingRows, buildPolicyBriefing, emptyBriefing, mergeBriefingHistory, parseBriefingPreferences, validBriefingDate, type BriefingPreferences } from '../../../shared/policyBriefing';
import { publicRequestLanguage } from '../seo';
import type { CitizenChange, CitizenFeed } from '../../../shared/citizen';

const now = new Date('2026-11-17T12:00:00.000Z');
const change: CitizenChange = { id: 'c-1', serviceId: 's-1', policyId: 'p-1', publishedAt: '2026-11-16T10:00:00.000Z', detectedAt: '2026-11-15T10:00:00.000Z', summary: { en: 'We do not use your data for AI training.', it: 'Non usiamo i dati per addestramento IA.' }, kind: 'substantive', impact: 'not_assessed', evidence: [{ before: 'Retained for 30 days.', after: 'Retained for 60 days.' }], detailPath: '/change/c-1', evidencePath: '/api/evidence-packet/c-1' };
const feed = (): CitizenFeed => ({ schemaVersion: '1.0', generatedAt: '2026-11-17T11:00:00.000Z', services: [{ id: 's-1', name: 'Example', slug: 'example', website: 'https://example.com', policies: [{ id: 'p-1', name: 'Privacy', type: 'Privacy', jurisdiction: 'EU', sourceUrl: 'https://example.com/privacy', lastRetrievedAt: '2026-11-17T10:00:00.000Z', freshness: 'recent', latestChange: { id: 'c-1', publishedAt: change.publishedAt } }] }], changes: [structuredClone(change)], history: { limit: 25, hasMore: true, nextCursor: 'opaqueCursor' }, catalogTruncated: false });
const prefs = (): BriefingPreferences => ({ ...emptyBriefing(), reviews: [{ changeId: 'c-1', policyId: 'p-1', status: 'reviewed', role: 'PRIVATE HR ROLE', dueDate: '2026-11-20', updatedAt: '2026-11-17T11:30:00.000Z' }] });

describe('Policy briefing evidence and private workflow', () => {
  it.each(['en', 'it'] as const)('keeps the document language aligned with the %s briefing', lang => {
    expect(publicRequestLanguage('/briefing', lang)).toBe(lang);
  });
  it('matches a negated mention without claiming risk or applicability and cites exact origin', () => {
    const matches = briefingMatches(change, 'en');
    expect(matches).toContainEqual({ topic: 'training', term: 'training', location: 'summary' });
    expect(matches).toContainEqual({ topic: 'retention', term: 'retained', location: 'excerpt' });
    expect(briefingMatches({ ...change, summary: { en: 'A retainedartist read a shareholding overview.', it: 'niente' }, evidence: [] }, 'en')).toEqual([]);
    const brief = buildPolicyBriefing(feed(), emptyBriefing(), 'en', false, now);
    expect(brief.boundary).toContain('not risk or applicability');
    expect(brief.records[0]).not.toHaveProperty('risk');
    expect(brief.records[0]).not.toHaveProperty('effectiveDate');
  });
  it('applies services, date window and selected-topic OR matching only to loaded changes', () => {
    const p = emptyBriefing();
    p.filters.topics = ['commercial'];
    const brief = buildPolicyBriefing(feed(), p, 'en', false, now);
    expect(brief.records).toHaveLength(0);
    expect(brief.coverage.loadedChanges).toBe(1);
    expect(brief.coverage.hasMoreHistory).toBe(true);
    expect(brief.boundary).toContain('No matches does not mean no changes');
    p.filters.topics = ['commercial', 'retention'];
    expect(buildBriefingRows(feed(), p, 'en', now)).toHaveLength(1);
    p.filters.serviceIds = ['s-missing'];
    expect(buildPolicyBriefing(feed(), p, 'en', false, now).coverage.missingSelectedServices).toEqual(['s-missing']);
    p.filters.serviceIds = [];
    const f = feed(); f.changes[0].publishedAt = '2026-01-01T00:00:00Z';
    expect(buildBriefingRows(f, p, 'en', now)).toHaveLength(0);
    p.filters.days = 0;
    expect(buildBriefingRows(f, p, 'en', now)).toHaveLength(1);
    f.changes[0].publishedAt = '2026-12-01T00:00:00Z';
    expect(buildBriefingRows(f, p, 'en', now)).toHaveLength(0);
  });
  it('keeps newer rows at the history limit and discloses omitted history even on the last page', () => {
    const first = feed(), last = feed();
    first.changes = Array.from({ length: 1999 }, (_, i) => ({ ...change, id: 'first-' + i }));
    last.history = { limit: 25, nextCursor: null, hasMore: false };
    last.changes = [{ ...change, id: 'first-0', summary: { en: 'older copy', it: 'vecchia copia' } }, { ...change, id: 'older' }, { ...change, id: 'oldest' }];
    const result = mergeBriefingHistory(first, last);
    expect(result.changes).toHaveLength(2000);
    expect(result.changes[0]).toEqual(first.changes[0]);
    expect(result.changes.at(-1)?.id).toBe('older');
    expect(result.history.hasMore).toBe(true);
  });
  it('explicitly describes a failed refresh in both human-readable exports', () => {
    for (const locale of ['en', 'it'] as const) {
      const report = buildPolicyBriefing(feed(), prefs(), locale, false, now, false);
      expect(briefingMarkdown(report)).toContain(locale === 'en' ? 'Current coverage is unknown' : 'La copertura attuale è sconosciuta');
      expect(report.coverage.liveAvailable).toBe(false);
    }
  });
  it('reopens an exact historical review when policy metadata identifies a newer publication', () => {
    const f = feed(); const p = prefs();
    expect(buildBriefingRows(f, p, 'en', now)[0].reviewState).toBe('reviewed');
    f.services[0].policies[0].latestChange = { id: 'c-2', publishedAt: '2026-11-17T10:00:00Z' };
    expect(buildBriefingRows(f, p, 'en', now)[0].reviewState).toBe('reopened');
    p.reviews[0].updatedAt = '2026-11-17T11:59:00Z';
    expect(buildBriefingRows(f, p, 'en', now)[0].reviewState).toBe('reopened');
    const newChange = { ...change, id: 'c-2', publishedAt: '2026-11-17T10:00:00Z' };
    f.changes.push(newChange);
    expect(buildBriefingRows(f, p, 'en', now)[0].reviewState).toBe('todo');
  });
  it.each(['missing', 'stale', 'future', 'malformedReviewDate', 'malformedLatestDate', 'beforePublication', 'olderLatest', 'failedRefresh'] as const)('keeps %s data from asserting a valid reviewed state', condition => {
    const f = feed(); const p = prefs();
    if (condition === 'missing') f.services[0].policies[0].lastRetrievedAt = null;
    if (condition === 'stale') f.services[0].policies[0].lastRetrievedAt = '2026-10-01T00:00:00Z';
    if (condition === 'future') p.reviews[0].updatedAt = '2026-12-01T00:00:00Z';
    if (condition === 'malformedReviewDate') p.reviews[0].updatedAt = 'invalid-date';
    if (condition === 'malformedLatestDate') f.services[0].policies[0].latestChange!.publishedAt = 'invalid-date';
    if (condition === 'beforePublication') p.reviews[0].updatedAt = '2026-11-01T00:00:00Z';
    if (condition === 'olderLatest') f.services[0].policies[0].latestChange!.publishedAt = '2026-10-01T00:00:00Z';
    expect(buildBriefingRows(f, p, 'en', now, condition !== 'failedRefresh')[0].reviewState).toBe('unknown');
  });
  it('retains acquisition provenance after failed refresh but labels unavailable in rows and export', () => {
    const brief = buildPolicyBriefing(feed(), prefs(), 'en', true, now, false);
    expect(brief.catalogGeneratedAt).toBe(feed().generatedAt);
    expect(brief.coverage.catalogFreshness).toBe('unavailable');
    expect(brief.coverage.liveAvailable).toBe(false);
    expect(brief.records[0].source.retrievedAt).toBe('2026-11-17T10:00:00.000Z');
    expect(brief.records[0].source.freshness).toBe('unavailable');
    expect(brief.records[0].localReview?.effectiveState).toBe('unknown');
  });
  it('excludes local role, due date and status from JSON/Markdown unless explicitly selected', () => {
    const brief = buildPolicyBriefing(feed(), prefs(), 'en', false, now);
    expect(JSON.stringify(brief)).not.toContain('PRIVATE HR ROLE');
    expect(JSON.stringify(brief)).not.toContain('2026-11-20');
    expect(briefingMarkdown(brief)).not.toContain('PRIVATE HR ROLE');
    expect(briefingCalendar(brief)).not.toContain('BEGIN:VEVENT');
    const included = buildPolicyBriefing(feed(), prefs(), 'en', true, now);
    expect(included.records[0].localReview?.role).toBe('PRIVATE HR ROLE');
    expect(briefingMarkdown(included)).toContain('PRIVATE HR ROLE');
  });
  it('makes all-day calendar reminders for explicitly included open reviews, with no alarms or invitations', () => {
    const p = prefs(); p.reviews[0].status = 'todo';
    const calendar = briefingCalendar(buildPolicyBriefing(feed(), p, 'en', true, now));
    expect(calendar).toContain('DTSTART;VALUE=DATE:20261120\r\n');
    expect(calendar).toContain('User-selected review date');
    expect(calendar).not.toMatch(/VALARM|ATTENDEE|ORGANIZER|PRIVATE HR ROLE/);
    expect(briefingCalendar(buildPolicyBriefing(feed(), prefs(), 'en', true, now))).not.toContain('BEGIN:VEVENT');
    const f = feed(); f.services[0].name = 'è'.repeat(150) + ',;\nInjected';
    const folded = briefingCalendar(buildPolicyBriefing(f, p, 'en', true, now));
    expect(folded.split('\r\n').every(line => new TextEncoder().encode(line).length <= 75)).toBe(true);
    expect(folded).toContain('\\,\\;\\nInjected');
  });
  it('validates persisted private state without accepting prototype topics, impossible dates or oversized content', () => {
    expect(parseBriefingPreferences(JSON.stringify(prefs()))).toEqual(prefs());
    const invalid = [
      { ...prefs(), filters: { ...prefs().filters, topics: ['__proto__'] } },
      { ...prefs(), filters: { ...prefs().filters, serviceIds: ['s-1', 's-1'] } },
      { ...prefs(), filters: { ...prefs().filters, days: '30' } },
      { ...prefs(), reviews: [{ ...prefs().reviews[0], dueDate: '2026-02-30' }] },
      { ...prefs(), reviews: [{ ...prefs().reviews[0], role: 'x\nBEGIN:VEVENT' }] },
    ];
    for (const value of invalid) expect(parseBriefingPreferences(JSON.stringify(value))).toBeNull();
    expect(parseBriefingPreferences('x'.repeat(160_001))).toBeNull();
    expect(validBriefingDate('2028-02-29')).toBe(true);
    expect(validBriefingDate('2026-02-29')).toBe(false);
  });
});
