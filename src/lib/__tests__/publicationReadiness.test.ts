import { describe, expect, it } from 'vitest';
import {
  buildPublicationReadiness,
  buildUnavailablePublicationReadiness,
  PUBLICATION_READINESS_STAGE_IDS,
} from '@/lib/publicationReadiness';

const measured = (count: number) => ({ available: true, count });

describe('publication readiness funnel', () => {
  it('preserves the exact stage order and calculates one configured denominator', () => {
    const result = buildPublicationReadiness({
      checkedAt: '2026-07-31T12:00:00.000Z',
      configured: measured(20),
      retrieved: measured(18),
      baselineVerified: measured(15),
      public: measured(12),
      analysed: measured(7),
      latestCapture: { available: true, capturedAt: '2026-07-31T11:30:00.000Z' },
    });

    expect(result.stages.map((stage) => stage.id)).toEqual(PUBLICATION_READINESS_STAGE_IDS);
    expect(result.denominator).toBe(20);
    expect(result.stages.map((stage) => stage.count)).toEqual([20, 18, 15, 12, 7]);
    expect(result.stages.map((stage) => stage.denominator)).toEqual([20, 20, 20, 20, 20]);
    expect(result.stages.map((stage) => stage.excluded)).toEqual([0, 2, 5, 8, 13]);
    expect(result.stages.every((stage) => stage.availability === 'measured')).toBe(true);
    expect(result.latestCapture).toMatchObject({
      availability: 'measured',
      capturedAt: '2026-07-31T11:30:00.000Z',
    });
  });

  it('keeps a failed optional stage unavailable rather than converting it to zero', () => {
    const result = buildPublicationReadiness({
      checkedAt: '2026-07-31T12:00:00.000Z',
      configured: measured(20),
      retrieved: { available: false, count: null, reason: 'Query unavailable.' },
      baselineVerified: measured(15),
      public: measured(12),
      analysed: measured(7),
    });

    expect(result.stages[1]).toMatchObject({
      availability: 'unavailable',
      count: null,
      denominator: null,
      excluded: null,
      reason: 'Query unavailable.',
    });
    expect(result.stages[2]).toMatchObject({ availability: 'measured', count: 15, denominator: 20 });
  });

  it('makes every stage unavailable when the configured denominator is unavailable', () => {
    const result = buildPublicationReadiness({
      checkedAt: '2026-07-31T12:00:00.000Z',
      configured: { available: false, count: null },
      retrieved: measured(18),
      baselineVerified: measured(15),
      public: measured(12),
      analysed: measured(7),
    });

    expect(result.available).toBe(false);
    expect(result.latestCapture.availability).toBe('unavailable');
    expect(result.denominator).toBeNull();
    expect(result.stages.every((stage) => (
      stage.availability === 'unavailable'
      && stage.count === null
      && stage.denominator === null
      && stage.excluded === null
    ))).toBe(true);
  });

  it('preserves non-monotonic measurements and emits a consistency warning', () => {
    const result = buildPublicationReadiness({
      checkedAt: '2026-07-31T12:00:00.000Z',
      configured: measured(20),
      retrieved: measured(10),
      baselineVerified: measured(12),
      public: measured(9),
      analysed: measured(11),
    });

    expect(result.stages[2]).toMatchObject({ count: 12, availability: 'review' });
    expect(result.stages[4]).toMatchObject({ count: 11, availability: 'review' });
    expect(result.consistencyWarning).toContain('greater than the earlier measured');
  });

  it('creates a sanitized all-unavailable contract', () => {
    const result = buildUnavailablePublicationReadiness('2026-07-31T12:00:00.000Z');
    expect(result.available).toBe(false);
    expect(JSON.stringify(result)).not.toMatch(/sqlite|production\.db|SELECT|sourceUrl/i);
  });
});
