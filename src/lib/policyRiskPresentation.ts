import type { Perspective, Policy, Region } from '@/types';

/** Keep the scope of a risk label separate from the change's overall score. */
export function getPolicyRiskPresentation(
  policy: Policy | undefined,
  region: Region,
  perspective: Perspective,
) {
  const change = policy?.changes[0];
  const impact = change?.regionImpacts.find(
    (candidate) => candidate.region === region && candidate.perspective === perspective,
  );

  return {
    change,
    riskLevel: impact?.riskLevel ?? change?.overallRisk ?? null,
    scope: impact ? 'context' as const : change ? 'overall' as const : 'unassessed' as const,
    overallScore: change && Number.isFinite(change.overallScore) ? change.overallScore : null,
  };
}
