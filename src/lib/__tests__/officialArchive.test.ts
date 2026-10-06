import { createHash } from 'node:crypto';
import { describe, it, expect } from 'vitest';
import { validateOfficialComparison, type OfficialComparison } from '../officialArchive';
const capture = (word: string) => { const text = word.repeat(600); return { text, hash: createHash('sha256').update(text).digest('hex'), capturedAt: '2026-10-02T04:00:00Z', label: word, httpStatus: 200, sourceUrl: 'https://example.com/' + word }; };
const fixture = (): OfficialComparison => ({ companySlug: 'sample', title: 'Privacy Policy', documentType: 'privacy', jurisdiction: 'Global', archiveIndexUrl: 'https://example.com/archive', older: capture('older'), newer: capture('newer') });
const now = new Date('2026-10-02T05:00:00Z');
describe('retrospective archive evidence validation', () => {
  it('retains observation time separately from publisher effective date', () => {
    const pair = fixture(); pair.older.effectiveAt = '2025-01-01T00:00:00Z';
    expect(() => validateOfficialComparison(pair, now)).not.toThrow();
    expect(pair.older.capturedAt).toBe('2026-10-02T04:00:00Z');
  });
  it('rejects altered, future, unsuccessful and identical captures', () => {
    const altered = fixture(); altered.older.text += 'changed';
    expect(() => validateOfficialComparison(altered, now)).toThrow('hash mismatch');
    const future = fixture(); future.newer.capturedAt = '2027-01-01T00:00:00Z';
    expect(() => validateOfficialComparison(future, now)).toThrow('observation timestamp');
    const blocked = fixture(); blocked.newer.httpStatus = 403;
    expect(() => validateOfficialComparison(blocked, now)).toThrow('Unsuccessful');
    const same = fixture(); same.newer = same.older;
    expect(() => validateOfficialComparison(same, now)).toThrow('Identical');
  });
});
