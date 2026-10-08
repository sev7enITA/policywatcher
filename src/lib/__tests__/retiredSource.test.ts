import { describe, expect, it } from 'vitest';
import { canResolveRetiredSource } from '../retiredSource';
const issue = { retrievalKey: 'https://provider.example/old', lastDetectedAt: new Date('2026-10-01'), affectedPolicyIdsJson: '["p1"]' };
const policy = { id: 'p1', url: 'https://provider.example/old', retrievalUrl: 'https://provider.example/current.pdf', lastSuccessfulCheckDate: new Date('2026-10-08'), dataStatus: 'Available' };
describe('retired source reconciliation', () => {
  it('resolves only superseded paths with later successful current evidence for every affected policy', () => {
    expect(canResolveRetiredSource(issue, [policy])).toBe(true);
    expect(canResolveRetiredSource(issue, [{ ...policy, retrievalUrl: null }])).toBe(false);
    expect(canResolveRetiredSource(issue, [{ ...policy, lastSuccessfulCheckDate: new Date('2026-09-01') }])).toBe(false);
    expect(canResolveRetiredSource(issue, [{ ...policy, dataStatus: 'Unavailable' }])).toBe(false);
    expect(canResolveRetiredSource({ ...issue, affectedPolicyIdsJson: '["p1","missing"]' }, [policy])).toBe(false);
    expect(canResolveRetiredSource({ ...issue, affectedPolicyIdsJson: 'invalid' }, [policy])).toBe(false);
  });
});
