import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  RELEASE_EVIDENCE_LEDGER,
  getReleaseEvidencePulse,
  releasesInWindow,
  validateReleaseEvidenceLedger,
} from '@/lib/releasePulse';
import { validateReleaseEvidenceJoins } from '@/lib/releasePulseValidation';

describe('release evidence pulse', () => {
  it('keeps one deterministic inclusive 14-day window with a valid digest', () => {
    expect(() => validateReleaseEvidenceLedger(RELEASE_EVIDENCE_LEDGER)).not.toThrow();
    expect(getReleaseEvidencePulse().map((release) => release.version)).toEqual([
      '3.9.0-beta.37', '3.9.0-beta.38', '3.9.0-beta.39', '3.9.0-beta.40', '3.9.0-beta.41', '3.9.0-beta.42',
    ]);
    const digest = createHash('sha256').update(JSON.stringify(RELEASE_EVIDENCE_LEDGER.releases)).digest('hex');
    expect(digest).toBe(RELEASE_EVIDENCE_LEDGER.integrity.digest);
  });

  it('joins every release and evidence reference to the public registries', () => {
    expect(() => validateReleaseEvidenceJoins(RELEASE_EVIDENCE_LEDGER)).not.toThrow();
    for (const release of RELEASE_EVIDENCE_LEDGER.releases) {
      expect(release.metrics.length).toBeGreaterThan(0);
      expect(release.evidence.length).toBeGreaterThan(0);
      expect(release.boundary.en.length).toBeGreaterThan(20);
      expect(release.boundary.it.length).toBeGreaterThan(20);
    }
  });

  it('includes both window edges and excludes future releases', () => {
    const releases = [
      { ...RELEASE_EVIDENCE_LEDGER.releases[0], date: '2026-08-01', version: 'before' },
      { ...RELEASE_EVIDENCE_LEDGER.releases[0], date: '2026-08-02', version: 'start' },
      { ...RELEASE_EVIDENCE_LEDGER.releases[0], date: '2026-08-15', version: 'end' },
      { ...RELEASE_EVIDENCE_LEDGER.releases[0], date: '2026-08-16', version: 'future' },
    ];
    expect(releasesInWindow(releases, '2026-08-02', '2026-08-15').map((release) => release.version)).toEqual(['start', 'end']);
  });
});
