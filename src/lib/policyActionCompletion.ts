export const POLICY_ACTION_HOLD_CODES = [
  'analysis_input_incomplete',
  'analysis_output_incomplete',
  'comparison_incomplete',
  'baseline_conflict',
] as const;

export type PolicyActionHoldCode = typeof POLICY_ACTION_HOLD_CODES[number];

export class PolicyActionHold extends Error {
  constructor(readonly code: PolicyActionHoldCode, readonly detail: string) {
    super(`${code}:${detail}`);
    this.name = 'PolicyActionHold';
  }
}

export function scanExecutionStatus(status: string, metricsJson: string | null): string {
  if (status !== 'completed') return status;
  try {
    const metrics = JSON.parse(metricsJson ?? 'null');
    if (metrics?.actionReceipts?.complete === true && ['complete', 'attention'].includes(metrics.execution)) {
      return metrics.execution as 'complete' | 'attention';
    }
  } catch {
    // Historical or corrupt records cannot establish a verified execution.
  }
  return 'unverified';
}

export function reconcilePolicyActionReceipts(
  plannedPolicyIds: readonly string[],
  receipts: readonly { policyId: string }[],
) {
  const planned = new Set(plannedPolicyIds);
  const counts = new Map<string, number>();
  for (const { policyId } of receipts) counts.set(policyId, (counts.get(policyId) ?? 0) + 1);
  const missing = [...planned].filter(id => !counts.has(id));
  const duplicate = [...counts].filter(([, count]) => count !== 1).map(([id]) => id);
  const unexpected = [...counts.keys()].filter(id => !planned.has(id));
  return {
    planned: plannedPolicyIds.length,
    receipts: receipts.length,
    missing,
    duplicate,
    unexpected,
    complete: planned.size === plannedPolicyIds.length && !missing.length && !duplicate.length && !unexpected.length,
  };
}
