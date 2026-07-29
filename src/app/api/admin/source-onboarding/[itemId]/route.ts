import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/adminAuth';
import { createConfiguredPolicy } from '@/lib/configuredPolicy';
import { db } from '@/lib/db';
import {
  canPublishSourceOnboardingItem,
  evaluateSourceOnboardingQa,
  summarizeSourceOnboardingBatch,
  transitionSourceOnboardingStage,
  type SourceOnboardingAction,
  type SourceOnboardingStage,
} from '@/lib/sourceOnboarding';

const SOURCE_GRADE = ['direct', 'http2', 'rendered', 'wayback', 'commoncrawl'];

async function readQaEvidence(itemId: string) {
  const item = await db.sourceOnboardingItem.findUnique({
    where: { id: itemId },
    include: {
      policy: {
        include: {
          snapshots: { orderBy: { version: 'desc' }, take: 1 },
          checkLogs: {
            where: { source: { in: SOURCE_GRADE }, status: 'Available' },
            orderBy: { checkedAt: 'desc' },
            take: 1,
          },
        },
      },
    },
  });
  if (!item) return null;
  return {
    item,
    result: evaluateSourceOnboardingQa({
      policyId: item.policyId,
      policyUrl: item.policy?.url,
      ingestionMethod: item.policy?.ingestionMethod,
      dataStatus: item.policy?.dataStatus,
      currentHash: item.policy?.currentHash,
      snapshot: item.policy?.snapshots[0] || null,
      checkLog: item.policy?.checkLogs[0] || null,
    }),
  };
}

async function refreshBatch(
  batchId: string,
  client: Pick<typeof db, 'sourceOnboardingItem' | 'sourceOnboardingBatch'> = db
) {
  const items = await client.sourceOnboardingItem.findMany({
    where: { batchId },
    select: { stage: true },
  });
  const summary = summarizeSourceOnboardingBatch(items.map((item) => item.stage));
  await client.sourceOnboardingBatch.update({
    where: { id: batchId },
    data: {
      totalItems: summary.totalItems,
      successfulItems: summary.successfulItems,
      failedItems: summary.failedItems,
      status: summary.status,
      completedAt: summary.terminal ? new Date() : null,
    },
  });
}

function reviewLogData(input: {
  actorRole: string;
  action: string;
  itemId: string;
  targetLabel: string;
  oldValue: string;
  newValue: string;
  note?: string;
  metadata?: Record<string, unknown>;
}) {
  return {
    actorRole: input.actorRole,
    action: input.action,
    targetType: 'SourceOnboardingItem',
    targetId: input.itemId,
    targetLabel: input.targetLabel,
    oldValue: input.oldValue,
    newValue: input.newValue,
    note: input.note,
    metadataJson: JSON.stringify(input.metadata || {}),
  };
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ itemId: string }> }
) {
  const session = getSession(request);
  if (!session.valid || session.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }
  const actorRole = session.role || 'admin';
  const { itemId } = await context.params;
  const body = await request.json().catch(() => null) as { action?: unknown; note?: unknown } | null;
  const action = typeof body?.action === 'string' ? body.action as SourceOnboardingAction : null;
  const note = typeof body?.note === 'string' ? body.note.trim().slice(0, 500) : '';
  if (!action) return NextResponse.json({ error: 'A workflow action is required.' }, { status: 400 });

  const item = await db.sourceOnboardingItem.findUnique({
    where: { id: itemId },
    include: { company: true, discoveryCandidate: true, policy: true },
  });
  if (!item) return NextResponse.json({ error: 'Source onboarding item not found.' }, { status: 404 });
  const label = `${item.companyName} / ${item.policyName}`;

  if (action === 'run-qa') {
    if (item.stage !== 'QaReview') {
      return NextResponse.json({ error: `QA cannot run from ${item.stage}.` }, { status: 409 });
    }
    const qa = await readQaEvidence(item.id);
    if (!qa) return NextResponse.json({ error: 'Source onboarding item not found.' }, { status: 404 });
    const nextStage = qa.result.status === 'Pass' ? 'Ready' : 'QaReview';
    await db.$transaction(async (tx) => {
      await tx.sourceOnboardingItem.update({
        where: { id: item.id },
        data: {
          stage: nextStage,
          qaStatus: qa.result.status,
          qaSummary: qa.result.summary,
          qaChecksJson: JSON.stringify(qa.result.checks),
          error: qa.result.status === 'Fail' ? qa.result.summary : null,
          reviewedByRole: actorRole,
          reviewedAt: new Date(),
        },
      });
      await tx.adminReviewLog.create({
        data: reviewLogData({
          actorRole,
          action: qa.result.status === 'Pass' ? 'source_onboarding_qa_passed' : 'source_onboarding_qa_failed',
          itemId: item.id,
          targetLabel: label,
          oldValue: item.stage,
          newValue: nextStage,
          note: qa.result.summary,
          metadata: { checks: qa.result.checks, policyId: item.policyId },
        }),
      });
    });
    await refreshBatch(item.batchId);
    return NextResponse.json({ success: true, qa: qa.result });
  }

  if (action === 'publish') {
    if (!canPublishSourceOnboardingItem(item)) {
      return NextResponse.json({ error: 'Only a QA-passing Ready or Held item may be published.' }, { status: 409 });
    }
    const qa = await readQaEvidence(item.id);
    if (!qa || qa.result.status !== 'Pass' || !item.policyId) {
      if (qa) {
        await db.$transaction(async (tx) => {
          await tx.sourceOnboardingItem.update({
            where: { id: item.id },
            data: {
              stage: 'QaReview',
              qaStatus: 'Fail',
              qaSummary: qa.result.summary,
              qaChecksJson: JSON.stringify(qa.result.checks),
              error: 'Evidence changed after QA. Review is required again.',
            },
          });
          await tx.adminReviewLog.create({
            data: reviewLogData({
              actorRole,
              action: 'source_onboarding_publication_revalidation_failed',
              itemId: item.id,
              targetLabel: label,
              oldValue: item.stage,
              newValue: 'QaReview',
              note: qa.result.summary,
              metadata: { checks: qa.result.checks, policyId: item.policyId },
            }),
          });
          await refreshBatch(item.batchId, tx);
        });
      }
      return NextResponse.json({ error: 'Evidence no longer passes QA; publication was blocked.' }, { status: 409 });
    }
    const publishedAt = new Date();
    await db.$transaction(async (tx) => {
      await tx.policySnapshot.updateMany({ where: { policyId: item.policyId! }, data: { publicEvidence: true } });
      await tx.policyChange.updateMany({
        where: { policyId: item.policyId!, publicEvidence: false },
        data: { publicEvidence: true, publicPublishedAt: publishedAt },
      });
      await tx.sourceOnboardingItem.update({
        where: { id: item.id },
        data: {
          stage: 'Published',
          publicationDecision: 'Published',
          decisionByRole: actorRole,
          decisionAt: publishedAt,
          error: null,
        },
      });
      await tx.adminReviewLog.create({
        data: reviewLogData({
          actorRole,
          action: 'source_onboarding_published',
          itemId: item.id,
          targetLabel: label,
          oldValue: item.stage,
          newValue: 'Published',
          note: note || 'QA-passing baseline approved for public evidence.',
          metadata: { policyId: item.policyId, qaChecks: qa.result.checks },
        }),
      });
    });
    await refreshBatch(item.batchId);
    return NextResponse.json({ success: true });
  }

  const nextStage = transitionSourceOnboardingStage(item.stage as SourceOnboardingStage, action);
  if (!nextStage) {
    return NextResponse.json({ error: `${action} is not valid from ${item.stage}.` }, { status: 409 });
  }

  if (action === 'start-review') {
    await db.$transaction(async (tx) => {
      await tx.sourceOnboardingItem.update({ where: { id: item.id }, data: { stage: nextStage, error: null } });
      await tx.adminReviewLog.create({
        data: reviewLogData({
          actorRole,
          action: 'source_onboarding_official_review_started',
          itemId: item.id,
          targetLabel: label,
          oldValue: item.stage,
          newValue: nextStage,
          note,
          metadata: { candidateId: item.discoveryCandidateId, url: item.policyUrl },
        }),
      });
    });
  } else if (action === 'approve-source') {
    if (!item.companyId || !item.discoveryCandidate || item.discoveryCandidate.status !== 'Proposed') {
      return NextResponse.json({ error: 'A proposed discovery candidate and company are required.' }, { status: 409 });
    }
    await db.$transaction(async (tx) => {
      const policy = await createConfiguredPolicy(tx, {
        companyId: item.companyId!,
        name: item.policyName,
        type: item.policyType,
        url: item.policyUrl,
        jurisdiction: item.jurisdiction,
      });
      await tx.policyDiscoveryCandidate.update({
        where: { id: item.discoveryCandidateId! },
        data: {
          status: 'Approved',
          reviewedAt: new Date(),
          reviewedByRole: actorRole,
          createdPolicyId: policy.id,
        },
      });
      await tx.sourceOnboardingItem.update({
        where: { id: item.id },
        data: {
          policyId: policy.id,
          stage: nextStage,
          reviewedByRole: actorRole,
          reviewedAt: new Date(),
          error: null,
        },
      });
      await tx.adminReviewLog.create({
        data: reviewLogData({
          actorRole,
          action: 'source_onboarding_source_approved',
          itemId: item.id,
          targetLabel: label,
          oldValue: item.stage,
          newValue: nextStage,
          note: note || 'Official source approved; configured policy created for a private first baseline.',
          metadata: { candidateId: item.discoveryCandidateId, policyId: policy.id, url: item.policyUrl },
        }),
      });
    });
  } else if (action === 'reject-source') {
    await db.$transaction(async (tx) => {
      if (item.discoveryCandidateId) {
        await tx.policyDiscoveryCandidate.update({
          where: { id: item.discoveryCandidateId },
          data: { status: 'Rejected', reviewedAt: new Date(), reviewedByRole: actorRole },
        });
      }
      await tx.sourceOnboardingItem.update({
        where: { id: item.id },
        data: {
          stage: nextStage,
          publicationDecision: 'Rejected',
          reviewedByRole: actorRole,
          reviewedAt: new Date(),
          decisionByRole: actorRole,
          decisionAt: new Date(),
          error: note || 'Official source rejected by administrator.',
        },
      });
      await tx.adminReviewLog.create({
        data: reviewLogData({
          actorRole,
          action: 'source_onboarding_source_rejected',
          itemId: item.id,
          targetLabel: label,
          oldValue: item.stage,
          newValue: nextStage,
          note: note || 'Official source rejected.',
          metadata: { candidateId: item.discoveryCandidateId, url: item.policyUrl },
        }),
      });
    });
  } else if (action === 'hold' || action === 'reject-publication') {
    if (!item.policyId) return NextResponse.json({ error: 'No linked policy evidence exists.' }, { status: 409 });
    const decision = action === 'hold' ? 'Held' : 'Rejected';
    await db.$transaction(async (tx) => {
      await tx.policySnapshot.updateMany({ where: { policyId: item.policyId! }, data: { publicEvidence: false } });
      await tx.policyChange.updateMany({ where: { policyId: item.policyId! }, data: { publicEvidence: false } });
      await tx.sourceOnboardingItem.update({
        where: { id: item.id },
        data: {
          stage: nextStage,
          publicationDecision: decision,
          decisionByRole: actorRole,
          decisionAt: new Date(),
          error: action === 'hold' ? null : note || 'Publication rejected by administrator.',
        },
      });
      await tx.adminReviewLog.create({
        data: reviewLogData({
          actorRole,
          action: action === 'hold' ? 'source_onboarding_held' : 'source_onboarding_publication_rejected',
          itemId: item.id,
          targetLabel: label,
          oldValue: item.stage,
          newValue: nextStage,
          note: note || (action === 'hold' ? 'Evidence held private.' : 'Publication rejected.'),
          metadata: { policyId: item.policyId },
        }),
      });
    });
  }

  await refreshBatch(item.batchId);
  return NextResponse.json({ success: true, stage: nextStage });
}
