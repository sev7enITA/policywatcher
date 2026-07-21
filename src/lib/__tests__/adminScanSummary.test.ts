import { describe, expect, it } from 'vitest';
import { formatScanCompletionLog } from '../adminScanSummary';

const clean = {
  checked: 50,
  changed: 0,
  rebaselined: 0,
  partial: 0,
  errors: 0,
  unavailable: 0,
  invalid: 0,
};

describe('formatScanCompletionLog', () => {
  it('does not label a completed scan as OK when policy errors occurred', () => {
    expect(formatScanCompletionLog({ ...clean, errors: 4 }, new Date('2026-07-21T12:00:00Z')))
      .toContain('Scan complete [ATTENTION]');
  });

  it('keeps the OK marker for a fully clean run', () => {
    expect(formatScanCompletionLog(clean, new Date('2026-07-21T12:00:00Z')))
      .toContain('Scan complete [OK]');
  });
});
