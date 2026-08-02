import { describe, expect, it } from 'vitest';
import {
  calculateDatasetQualityScore,
  newestTimestampedRecord,
} from '../datasetQuality';

describe('Dataset QA evidence reduction', () => {
  it('selects the chronologically latest parsed record regardless of database storage order', () => {
    const seededTextDate = { id: 'seeded', checkedAt: new Date('2026-07-21T00:00:00.000Z') };
    const currentPrismaDate = { id: 'scan', checkedAt: new Date('2026-08-01T04:38:00.000Z') };

    expect(newestTimestampedRecord([seededTextDate, currentPrismaDate])?.id).toBe('scan');
    expect(newestTimestampedRecord([])).toBeUndefined();
  });

  it('scores evaluated coverage cells without multiplying issue occurrences into zero', () => {
    expect(calculateDatasetQualityScore([
      { passed: 50, total: 50 },
      { passed: 42, total: 50 },
      { passed: 372, total: 615 },
      { passed: 246, total: 246 },
    ])).toBe(73.9);
  });

  it('bounds malformed counts and returns zero when no cells were evaluated', () => {
    expect(calculateDatasetQualityScore([{ passed: 12, total: 10 }])).toBe(100);
    expect(calculateDatasetQualityScore([{ passed: 0, total: 0 }])).toBe(0);
  });
});
