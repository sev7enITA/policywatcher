import type { Prisma } from '@prisma/client';
import { db } from './db';
import { PolicyActionHold } from './policyActionCompletion';

type CheckEvidence = Pick<Prisma.PolicyCheckLogUncheckedCreateInput,
  'policyId' | 'checkedAt' | 'source' | 'httpStatus' | 'finalUrl' | 'textHash' | 'textLength'
  | 'archiveTimestamp' | 'scanRunId' | 'sourceRetrievalId' | 'durationMs'>;

/** Preserve the last verified baseline and append the hold to the permanent check history. */
export async function recordPolicyActionHold(evidence: CheckEvidence, expectedHash: string, hold: PolicyActionHold) {
  await db.$transaction([
    db.policy.updateMany({
      where: { id: evidence.policyId, currentHash: expectedHash },
      data: { lastCheckDate: evidence.checkedAt },
    }),
    db.policyCheckLog.create({
      data: { ...evidence, status: 'Needs Review', reasonCode: hold.code, reason: hold.message },
    }),
  ]);
}

/** Assert and advance the exact starting baseline inside the change transaction. */
export async function advancePolicyBaseline(
  tx: Pick<Prisma.TransactionClient, 'policy'>,
  policyId: string,
  expectedHash: string,
  data: Prisma.PolicyUpdateManyMutationInput,
) {
  const updated = await tx.policy.updateMany({ where: { id: policyId, currentHash: expectedHash }, data });
  if (updated.count !== 1) throw new PolicyActionHold('baseline_conflict', 'starting_baseline_changed');
}
