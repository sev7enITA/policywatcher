import { describe, expect, it } from 'vitest';
import {
  archiveFreshnessFloor,
  dataStatusClassKey,
  dataStatusFromScrapeFailure,
  getWorstDataStatus,
  isSeededIngestionEvidence,
  isDataStatus,
  normalizeDataStatus,
  normalizeIngestionMethod,
  hasVerifiedSourceEvidence,
  shouldRebaselineFromSeededRecord,
} from '../policyConfidence';

describe('policyConfidence', () => {
  it('validates and normalizes accepted data statuses', () => {
    expect(isDataStatus('Available')).toBe(true);
    expect(isDataStatus('Needs Review')).toBe(true);
    expect(isDataStatus('Unknown')).toBe(false);
    expect(normalizeDataStatus('Reviewed')).toBe('Reviewed');
    expect(normalizeDataStatus('Unknown')).toBe('Needs Review');
  });

  it('selects the highest-risk data status across policy groups', () => {
    expect(getWorstDataStatus([{ dataStatus: 'Available' }, { dataStatus: 'Partial' }])).toBe('Partial');
    expect(getWorstDataStatus([{ dataStatus: 'Reviewed' }, { dataStatus: 'Unavailable' }])).toBe('Unavailable');
    expect(getWorstDataStatus([])).toBe('Configured');
  });

  it('builds stable CSS keys and scraper-failure statuses', () => {
    expect(dataStatusClassKey('Needs Review')).toBe('needsreview');
    expect(dataStatusFromScrapeFailure('invalid')).toBe('Needs Review');
    expect(dataStatusFromScrapeFailure('unavailable')).toBe('Unavailable');
  });

  it('normalizes ingestion method labels without inventing transport evidence', () => {
    expect(normalizeIngestionMethod('direct')).toBe('Direct scrape');
    expect(normalizeIngestionMethod('wayback')).toBe('Wayback cache');
    expect(normalizeIngestionMethod('')).toBe('Seeded');
    expect(normalizeIngestionMethod('custom proxy')).toBe('custom proxy');
  });

  it('detects seeded records that need a real-source rebaseline', () => {
    expect(isSeededIngestionEvidence('Seeded')).toBe(true);
    expect(isSeededIngestionEvidence(' Direct scrape ')).toBe(false);
    expect(shouldRebaselineFromSeededRecord({ ingestionMethod: 'Seeded', dataStatus: 'Configured' })).toBe(true);
    expect(shouldRebaselineFromSeededRecord({ ingestionMethod: 'Direct scrape', dataStatus: 'Configured' })).toBe(false);
    expect(shouldRebaselineFromSeededRecord({ ingestionMethod: 'Direct scrape', dataStatus: 'Available' })).toBe(false);
  });

  it('does not rebaseline seeded-looking records that already have source evidence', () => {
    const checkLogs = [{ source: 'direct', textHash: 'verified-hash' }];

    expect(hasVerifiedSourceEvidence(checkLogs)).toBe(true);
    expect(shouldRebaselineFromSeededRecord({
      ingestionMethod: 'Seeded',
      dataStatus: 'Configured',
      checkLogs,
    })).toBe(false);
  });

  it('does not rebaseline records with an existing public baseline', () => {
    expect(shouldRebaselineFromSeededRecord({
      ingestionMethod: 'Seeded',
      dataStatus: 'Configured',
      snapshots: [{ publicEvidence: true }],
    })).toBe(false);
  });

  it('rejects archives older than a pending source-migration request', () => {
    const requestedAt = new Date('2026-08-18T02:15:15.323Z');

    expect(archiveFreshnessFloor({
      lastSuccessfulCheckDate: new Date('2026-08-01T04:37:39.895Z'),
      sourceMigrationPending: true,
      sourceMigrationRequestedAt: requestedAt,
    })).toEqual(requestedAt);
  });

  it('keeps the last successful check as the archive floor for seeded and ordinary records', () => {
    const lastSuccessfulCheckDate = new Date('2026-08-17T00:00:00.000Z');

    expect(archiveFreshnessFloor({ lastSuccessfulCheckDate })).toEqual(lastSuccessfulCheckDate);
    expect(archiveFreshnessFloor({
      lastSuccessfulCheckDate,
      sourceMigrationPending: true,
      sourceMigrationRequestedAt: null,
    })).toEqual(lastSuccessfulCheckDate);
  });
});
