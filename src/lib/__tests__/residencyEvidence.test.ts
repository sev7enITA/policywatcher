import { describe, expect, it } from 'vitest';
import { getResidencyEvidencePack } from '../residencyEvidence';

describe('residency and processor evidence pack', () => {
  it('is deterministic, bounded and explicit about every record limit', () => {
    const first = getResidencyEvidencePack();
    const second = getResidencyEvidencePack();
    expect(first.digest).toBe(second.digest);
    expect(first.digest).toMatch(/^[a-f0-9]{64}$/);
    expect(first.records).toHaveLength(6);
    expect(first.references).toHaveLength(4);
    expect(first.records.every((record) => record.limitation.length > 30 && record.referenceIds.length > 0)).toBe(true);
    expect(first.records.some((record) => record.state === 'open')).toBe(true);
    expect(first.boundary).toContain('not a DPA');
  });

  it('does not convert deployment-dependent location statements into documented facts', () => {
    const pack = getResidencyEvidencePack();
    expect(pack.records.find((record) => record.id === 'primary-application-hosting')?.state).toBe('operator-declared');
    expect(pack.records.find((record) => record.id === 'database-backups')?.state).toBe('open');
    expect(pack.records.find((record) => record.id === 'renderer-vps')?.state).toBe('configuration-dependent');
  });
});
