import { describe, expect, it } from 'vitest';
import {
  dataStatusClassKey,
  dataStatusFromScrapeFailure,
  getWorstDataStatus,
  isDataStatus,
  normalizeDataStatus,
  normalizeIngestionMethod,
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
});
