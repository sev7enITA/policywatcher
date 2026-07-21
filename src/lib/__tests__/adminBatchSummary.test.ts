import { describe, expect, it } from 'vitest';
import { getBatchLimitSummary } from '../adminBatchSummary';

describe('getBatchLimitSummary', () => {
  it('explains the inventory-wide document cap', () => {
    expect(getBatchLimitSummary({ limit: 5 })).toBe(
      'Scans at most 5 policy documents total across the inventory, starting with the least recently checked.'
    );
  });

  it('explains that a selected-company limit never counts companies', () => {
    expect(getBatchLimitSummary({ limit: 2, targetName: 'WAZE', availablePolicyCount: 4 }))
      .toContain('2 of 4 approved policy documents for WAZE. It never means 2 companies.');
  });

  it('disables the concept during discovery', () => {
    expect(getBatchLimitSummary({ limit: 5, targetName: 'WAZE', availablePolicyCount: 0 }))
      .toBe('Not used during discovery. Approve at least one source first.');
  });

  it('states when unused capacity remains', () => {
    expect(getBatchLimitSummary({ limit: 5, targetName: 'WAZE', availablePolicyCount: 1 }))
      .toContain('All 1 available policy will be scanned; the remaining 4 slots are unused.');
  });
});
