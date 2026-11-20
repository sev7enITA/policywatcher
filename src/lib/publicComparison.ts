import { createHash } from 'node:crypto';

interface Snapshot { version: number; policyId?: string; publicEvidence: boolean; text: string }

export function comparisonPair(policyId: string, before: Snapshot | null, after: Snapshot | null) {
  if (!before?.publicEvidence || !after?.publicEvidence || before.policyId !== policyId || after.policyId !== policyId
    || !before.text.trim() || !after.text.trim()) return null;
  const digest = (text: string) => createHash('sha256').update(text).digest('hex');
  return { from: before.version, to: after.version, before: digest(before.text), after: digest(after.text) };
}
