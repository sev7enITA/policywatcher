import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/adminAuth';
import { db } from '@/lib/db';
import { readBoundedJsonObject } from '@/lib/requestBody';
import { digest, ENGINE_SCHEMA, parseSourceContract } from '@/lib/engine/document';
import { enqueueRun, cancelRun, engineEnabled, stateKey, readArtifact } from '@/lib/engine/store';
import { approveReview, closeReview, requestConfirmedRebaseline } from '@/lib/engine/pipeline';
import { validateOutboundUrl } from '@/lib/scraper';

const json = (value: unknown, status = 200) => NextResponse.json(value, { status, headers: { 'Cache-Control': 'private, no-store' } });
const authorized = (request: NextRequest) => { const s = getSession(request); return s.valid && s.role === 'admin'; };

export async function GET(request: NextRequest) {
  if (!authorized(request)) return json({ error: 'Admin access required' }, 403);
  if (!engineEnabled()) return json({ enabled: false, schema: ENGINE_SCHEMA, runs: [], reviews: [], policies: [] });
  const policyId = request.nextUrl.searchParams.get('policyId');
  if (policyId) {
    const stored = await db.engineSourceContract.findUnique({ where: { policyId } });
    return json({ contract: stored ? JSON.parse(stored.contractJson) : null });
  }
  const reviewId = request.nextUrl.searchParams.get('reviewId');
  if (reviewId) {
    const review = await db.engineReview.findUnique({ where: { id: reviewId } });
    if (!review) return json({ error: 'Review not found' }, 404);
    const payload = JSON.parse(review.payloadJson);
    const artifactId = payload.observation?.artifactId;
    // Raw HTML stays in the private artifact store. The authenticated reviewer sees frozen text and claims.
    const artifact = artifactId ? await readArtifact<{ document: unknown; extraction?: unknown }>(artifactId) : null;
    const oldDocument = payload.checkpoint?.oldArtifactId ? await readArtifact(payload.checkpoint.oldArtifactId) : null;
    const baselineCandidate = payload.checkpoint?.baselineCandidateArtifactId ? await readArtifact<{ document: unknown; extraction?: unknown }>(payload.checkpoint.baselineCandidateArtifactId) : null;
    return json({ review, payload, document: artifact?.document, extraction: artifact?.extraction, oldDocument, baselineCandidate: baselineCandidate?.document, baselineExtraction: baselineCandidate?.extraction });
  }
  const [runs, reviews, policies, outbox, tasks, states, contracts] = await Promise.all([
    db.engineRun.findMany({ orderBy: { createdAt: 'desc' }, take: 20, include: { tasks: {
      select: { id: true, policyId: true, kind: true, stage: true, status: true, attempt: true, lastError: true, resultJson: true } } } }),
    db.engineReview.findMany({ where: { status: { in: ['pending', 'observed'] } }, orderBy: { createdAt: 'desc' }, take: 100,
      select: { id: true, policyId: true, reasonsJson: true, status: true, mode: true, createdAt: true } }),
    db.policy.findMany({ select: { id: true, name: true, url: true, retrievalUrl: true, jurisdiction: true, company: { select: { name: true } } }, take: 1000 }),
    db.engineOutbox.groupBy({ by: ['status'], _count: true }),
    db.engineTask.groupBy({ by: ['status'], _count: true }),
    db.enginePolicyState.findMany({ where: { mode: 'publish' } }), db.engineSourceContract.findMany({ select: { policyId: true } }),
  ]);
  return json({ enabled: true, schema: ENGINE_SCHEMA, runs, reviews, policies, outbox, tasks,
    coverage: { total: policies.length, contracted: contracts.length, verified: states.filter(s => s.lastVerifiedAt && s.lastVerifiedAt.getTime() > Date.now() - 86400000).length, awaitingConfirmation: states.filter(s => s.candidateHash).length },
    publicationEnabled: process.env.POLICYWATCHER_ENGINE_PUBLICATION === '1' });
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return json({ error: 'Admin access required' }, 403);
  if (!engineEnabled()) return json({ error: 'engine_disabled' }, 409);
  const parsed = await readBoundedJsonObject(request, 64 * 1024);
  if (!parsed.ok) return json({ error: parsed.reason }, 400);
  const body = parsed.value;
  try {
    if (body.action === 'cancel') {
      if (typeof body.runId !== 'string' || typeof body.note !== 'string') return json({ error: 'run_and_note_required' }, 400);
      return json(await cancelRun(body.runId, body.note, 'admin'));
    }
    if (body.action === 'enqueue') {
      if (body.mode !== 'observe' && body.mode !== 'publish') return json({ error: 'invalid_engine_mode' }, 400);
      if (body.mode === 'publish' && process.env.POLICYWATCHER_ENGINE_PUBLICATION !== '1') return json({ error: 'publication_disabled' }, 409);
      if (typeof body.requestKey !== 'string') return json({ error: 'request_key_required' }, 400);
      const run = await enqueueRun({ requestKey: body.requestKey, mode: body.mode, requestedBy: 'admin',
        limit: body.limit === undefined ? 500 : Number(body.limit), notificationMode: body.notifications === true ? 'subscribers' : 'silent' });
      return json({ run }, 202);
    }
    if (body.action === 'contract') {
      if (typeof body.policyId !== 'string') return json({ error: 'policy_id_required' }, 400);
      const contract = parseSourceContract(body.contract);
      const policy = await db.policy.findUniqueOrThrow({ where: { id: body.policyId } });
      if (contract.sourceUrl !== (policy.retrievalUrl || policy.url)) return json({ error: 'contract_source_mismatch' }, 400);
      const destination = await validateOutboundUrl(contract.sourceUrl);
      if (!destination.ok) return json({ error: 'contract_source_not_public' }, 400);
      contract.reviewedAt = new Date().toISOString();
      const contractJson = JSON.stringify(contract), contractHash = digest(contractJson);
      await db.$transaction(async tx => {
        await tx.engineSourceContract.upsert({ where: { policyId: policy.id }, create: { policyId: policy.id, contractJson, contractHash, reviewedBy: 'admin' },
          update: { contractJson, contractHash, reviewedBy: 'admin' } });
        await tx.enginePolicyState.upsert({ where: stateKey(policy.id, 'publish'), create: { policyId: policy.id, mode: 'publish', reason: 'contract_updated' },
          update: { nextDueAt: new Date(), reason: 'contract_updated', candidateHash: null, candidateObservedAt: null, candidateRunId: null, candidateArtifactId: null, candidateProfileHash: null } });
        await tx.enginePolicyState.updateMany({ where: { policyId: policy.id, mode: 'observe' }, data: { nextDueAt: new Date(), reason: 'contract_updated', candidateHash: null, candidateObservedAt: null, candidateRunId: null, candidateArtifactId: null, candidateProfileHash: null } });
        await tx.engineReview.updateMany({ where: { policyId: policy.id, status: { in: ['pending', 'observed'] } }, data: { status: 'superseded', reviewedAt: new Date(), reviewNote: 'Source contract revised.' } });
        await tx.adminReviewLog.create({ data: { actorRole: 'admin', action: 'engine_source_contract', targetType: 'policy', targetId: policy.id,
          note: contract.reviewNote, newValue: contractHash } });
      });
      return json({ contractHash });
    }
    if (body.action === 'rebaseline') {
      if (typeof body.reviewId !== 'string' || typeof body.note !== 'string') return json({ error: 'review_and_note_required' }, 400);
      return json(await requestConfirmedRebaseline(body.reviewId, body.note, 'admin'));
    }
    if (body.action === 'reject' || body.action === 'refresh') {
      if (typeof body.reviewId !== 'string' || typeof body.note !== 'string') return json({ error: 'review_and_note_required' }, 400);
      return json(await closeReview(body.reviewId, body.action, body.note, 'admin'));
    }
    if (body.action === 'approve') {
      if (process.env.POLICYWATCHER_ENGINE_PUBLICATION !== '1') return json({ error: 'publication_disabled' }, 409);
      if (typeof body.reviewId !== 'string' || typeof body.note !== 'string') return json({ error: 'review_and_note_required' }, 400);
      return json({ changeId: await approveReview(body.reviewId, body.note, 'admin') });
    }
    return json({ error: 'unknown_engine_action' }, 400);
  } catch (error) {
    const message = error instanceof Error && /^[a-z_]{1,80}$/.test(error.message) ? error.message : 'engine_request_failed';
    return json({ error: message }, 409);
  }
}
