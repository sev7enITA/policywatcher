import { describe, expect, it } from 'vitest';
import type { Policy, PolicyChange } from '@/types';
import { getPolicyRiskPresentation } from '../policyRiskPresentation';

const change: PolicyChange = {
  id: 'change', policyId: 'privacy', oldSnapshotId: null, newSnapshotId: 'snapshot',
  diff: '[]', aiSummaryEn: 'Summary', aiSummaryIt: 'Sintesi', overallRisk: 'High', overallScore: 9,
  remediationsJson: '[]', aiTrainingOptOut: '', aiDataScrapingRestricted: '', aiIpLicensing: '',
  aiPromptRetention: '', createdAt: '2026-09-08T00:00:00Z',
  regionImpacts: [{ id: 'impact', region: 'EU', perspective: 'Individual', riskLevel: 'Low',
    impactAnalysisEn: 'Regional assessment', impactAnalysisIt: 'Valutazione regionale' }],
};
const policy: Policy = {
  id: 'privacy', companyId: 'company', name: 'Privacy', type: 'Privacy Policy', jurisdiction: 'Global',
  url: 'https://example.org/privacy', currentText: '', currentHash: '', dataStatus: 'Available',
  updatedAt: change.createdAt, changes: [change],
};

describe('policy risk presentation', () => {
  it('keeps a low contextual risk separate from a high overall score', () => {
    expect(getPolicyRiskPresentation(policy, 'EU', 'Individual')).toMatchObject({
      riskLevel: 'Low', scope: 'context', overallScore: 9, change,
    });
  });

  it.each([['US', 'Individual'], ['EU', 'Enterprise']] as const)(
    'labels the fallback as overall when %s / %s has no assessment', (region, perspective) => {
      expect(getPolicyRiskPresentation(policy, region, perspective)).toMatchObject({
        riskLevel: 'High', scope: 'overall', overallScore: 9,
      });
    },
  );

  it('does not invent a low risk or a score for a baseline or missing policy', () => {
    for (const source of [undefined, { ...policy, changes: [] }]) {
      expect(getPolicyRiskPresentation(source, 'Global', 'Individual')).toMatchObject({
        riskLevel: null, scope: 'unassessed', overallScore: null,
      });
    }
  });

  it('uses only the latest change of the specified policy', () => {
    const differentPolicy = { ...policy, id: 'terms', changes: [{ ...change, id: 'new',
      policyId: 'terms', overallRisk: 'Medium' as const, overallScore: 5, regionImpacts: [] }, change] };
    expect(getPolicyRiskPresentation(differentPolicy, 'EU', 'Individual')).toMatchObject({
      riskLevel: 'Medium', scope: 'overall', overallScore: 5, change: { id: 'new', policyId: 'terms' },
    });
    expect(getPolicyRiskPresentation(policy, 'EU', 'Individual').riskLevel).toBe('Low');
  });

  it('preserves a zero score and omits non-finite scores instead of rendering null/10', () => {
    expect(getPolicyRiskPresentation({ ...policy, changes: [{ ...change, overallScore: 0 }] }, 'EU', 'Individual').overallScore).toBe(0);
    expect(getPolicyRiskPresentation({ ...policy, changes: [{ ...change, overallScore: NaN }] }, 'EU', 'Individual').overallScore).toBeNull();
  });
});
