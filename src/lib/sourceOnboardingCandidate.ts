import type { Prisma } from '@prisma/client';

type CandidateClient = Pick<Prisma.TransactionClient, 'policyDiscoveryCandidate' | 'adminReviewLog'>;

const ACTIVE_ONBOARDING_STAGES = [
  'Proposed',
  'OfficialReview',
  'BaselinePending',
  'QaReview',
  'Ready',
] as const;

export interface BulkCandidateInput {
  companyId: string;
  companyName: string;
  name: string;
  type: string;
  url: string;
  jurisdiction: string;
  batchId: string;
  rowNumber: number;
  actorRole: string;
}

function candidateData(input: BulkCandidateInput) {
  return {
    name: input.name,
    confidence: 100,
    discoverySource: 'Bulk source onboarding / operator supplied',
    retrievalSource: 'operator-supplied',
    reason: 'Operator supplied for explicit official-source review; not public evidence.',
    diagnosticsJson: JSON.stringify({ batchId: input.batchId, rowNumber: input.rowNumber }),
  };
}

export async function resolveBulkOnboardingCandidate(client: CandidateClient, input: BulkCandidateInput) {
  const where = {
    companyId_url_type_jurisdiction: {
      companyId: input.companyId,
      url: input.url,
      type: input.type,
      jurisdiction: input.jurisdiction,
    },
  };
  const existing = await client.policyDiscoveryCandidate.findUnique({
    where,
    include: {
      sourceOnboardingItems: {
        where: { stage: { in: [...ACTIVE_ONBOARDING_STAGES] } },
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!existing) {
    return client.policyDiscoveryCandidate.create({
      data: {
        companyId: input.companyId,
        type: input.type,
        url: input.url,
        jurisdiction: input.jurisdiction,
        ...candidateData(input),
        status: 'Proposed',
      },
    });
  }

  if (existing.sourceOnboardingItems.length > 0) {
    throw new Error('This source already belongs to an active onboarding workflow.');
  }
  if (existing.status === 'Approved') {
    throw new Error('This source was already approved and cannot be proposed again.');
  }
  if (existing.status !== 'Proposed' && existing.status !== 'Rejected') {
    throw new Error(`This discovery candidate has unsupported status ${existing.status}.`);
  }

  const reopened = existing.status === 'Rejected';
  const candidate = await client.policyDiscoveryCandidate.update({
    where: { id: existing.id },
    data: {
      ...candidateData(input),
      status: 'Proposed',
      reviewedAt: reopened ? null : existing.reviewedAt,
      reviewedByRole: reopened ? null : existing.reviewedByRole,
      createdPolicyId: reopened ? null : existing.createdPolicyId,
    },
  });

  if (reopened) {
    await client.adminReviewLog.create({
      data: {
        actorRole: input.actorRole,
        action: 'policy_discovery_reopened_by_bulk_onboarding',
        targetType: 'PolicyDiscoveryCandidate',
        targetId: existing.id,
        targetLabel: `${input.companyName} / ${input.name}`,
        oldValue: 'Rejected',
        newValue: 'Proposed',
        note: 'Operator resubmitted the source through bulk onboarding for a new official-source review.',
        metadataJson: JSON.stringify({ batchId: input.batchId, rowNumber: input.rowNumber, url: input.url }),
      },
    });
  }

  return candidate;
}
