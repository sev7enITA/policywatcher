import { diffLines } from 'diff';
import type { Policy } from '@prisma/client';
import { db } from '../db';
import { dualWriteCanonicalPolicyGraph } from '../documentEvidenceSync';
import { acquire, assessCapture, extractEngineBody, saveRepresentation, type Observation, type CaptureBody } from './acquisition';
import { digest, structureDocument, compareDocuments, ENGINE_SCHEMA } from './document';
import { assertChannelWorkerContext, type ChannelMetadata } from '../scanChannels';
import { assertHostedPreviewContext, isHostedPreview } from '../hostedPreview';
import { compareCapturedExtraction } from './comparison';
import { liveAnalysis, validateClaims, validateVerification, validateModelPair, type AnalysisProvider, type AnalysisInput, type ClaimSet,
  type ModelOutput, type Verification } from './claims';
import { approveClaimLedger, recordClaimLedger } from './claimLedger';
import { advanceTask, claimTask, failTask, fenced, finishTask, heartbeat, putArtifact, readArtifact, reconcileRun,
  policyScopeHash, stateKey, engineExtractionProfileHash, DAILY_MS, CONFIRMATION_MS, MAX_ATTEMPTS, type Lease, type TaskInput, type Tx } from './store';

interface Checkpoint {
  observation: Observation;
  oldArtifactId: string;
  baselineCandidateArtifactId?: string;
  confirmation?: { firstRunId: string; firstArtifactId: string; firstObservedAt: string; secondRunId: string };
  analysis?: ModelOutput<ClaimSet>;
  verification?: ModelOutput<Verification>;
}
export interface EngineDependencies {
  acquire: typeof acquire;
  analysis: AnalysisProvider;
}
const defaults: EngineDependencies = { acquire, analysis: liveAnalysis };
const clearCandidate = { candidateHash: null, candidateArtifactId: null, candidateRunId: null,
  candidateObservedAt: null, candidateProfileHash: null };

async function publicationMode(tx: Tx, runId: string) {
  return (await tx.engineRun.findUniqueOrThrow({ where: { id: runId } })).mode === 'publish';
}
async function currentPolicy(tx: Tx, lease: Lease, input: TaskInput): Promise<Policy> {
  const policy = await tx.policy.findUniqueOrThrow({ where: { id: lease.policyId! } });
  const contract = await tx.engineSourceContract.findUnique({ where: { policyId: policy.id } });
  if (policy.currentHash !== lease.expectedBaselineHash || policyScopeHash(policy) !== input.scopeHash
    || (contract?.contractHash || null) !== input.contractHash || engineExtractionProfileHash(input.sourceUrl) !== input.profileHash) {
    throw new Error('engine_context_changed');
  }
  if (contract) {
    const lockedContract = await tx.engineSourceContract.updateMany({ where: { policyId: policy.id, contractHash: input.contractHash!, updatedAt: contract.updatedAt }, data: { contractHash: input.contractHash!, updatedAt: contract.updatedAt } });
    if (!lockedContract.count) throw new Error('engine_context_changed');
  }
  // Acquire the policy write lock with a CAS before any baseline/snapshot effect.
  // On PostgreSQL this also prevents concurrent tasks reading the same version.
  // Preserve the revision timestamp: taking a lock is not a document update.
  const locked = await tx.policy.updateMany({ where: { id: policy.id, currentHash: lease.expectedBaselineHash || '',
    updatedAt: policy.updatedAt, url: policy.url, retrievalUrl: policy.retrievalUrl, jurisdiction: policy.jurisdiction, type: policy.type },
    data: { currentHash: policy.currentHash, updatedAt: policy.updatedAt } });
  if (!locked.count) throw new Error('engine_context_changed');
  return policy;
}
async function recordAttempt(tx: Tx, lease: Lease, observation: Observation, reason: string, verified: boolean) {
  const now = new Date();
  const input = JSON.parse(lease.inputJson) as TaskInput;
  await currentPolicy(tx, lease, input);
  const configurationMissing = /source_contract_missing|source_contract_mismatch/.test(reason);
  if (!configurationMissing && await publicationMode(tx, lease.runId)) {
    await tx.policy.update({ where: { id: lease.policyId! }, data: { lastCheckDate: now,
      ...(verified ? { lastSuccessfulCheckDate: now, dataStatus: 'Available' } : { dataStatus: 'Needs Review' }) } });
    await tx.policyCheckLog.create({ data: { policyId: lease.policyId!, status: verified ? 'Available' : 'Needs Review',
      engineTaskId: lease.id, checkedAt: now, source: observation.source, httpStatus: observation.httpStatus, finalUrl: observation.finalUrl,
      reason, reasonCode: reason, durationMs: Math.max(0, now.getTime() - lease.createdAt.getTime()) } });
  }
  await tx.enginePolicyState.upsert({ where: stateKey(lease.policyId!, input.mode),
    create: { policyId: lease.policyId!, mode: input.mode, lastAttemptAt: now, nextDueAt: new Date(now.getTime() + DAILY_MS), reason },
    update: { lastAttemptAt: now, nextDueAt: new Date(now.getTime() + DAILY_MS), reason } });
}

/** claimsValidated: only the commit stage passes true, after validateClaims accepted every span. */
async function hold(lease: Lease, observation: Observation, reasons: string[], checkpoint?: Checkpoint, claimsValidated = false) {
  const input = JSON.parse(lease.inputJson) as TaskInput;
  await fenced(lease, async tx => {
    await recordAttempt(tx, lease, observation, reasons.join(','), reasons.every(r => r === 'high_impact_review_required'));
    if (!reasons.every(r => ['origin_backoff', 'live_source_unverified', 'acquisition_failed'].includes(r))) {
      await tx.enginePolicyState.update({ where: stateKey(lease.policyId!, input.mode), data: clearCandidate });
    }
    const mode = input.mode;
    const configurationMissing = reasons.every(r => r === 'source_contract_missing' || r === 'source_contract_mismatch');
    const evidenceKey = digest(JSON.stringify([mode, lease.policyId, lease.expectedBaselineHash, input.scopeHash, input.contractHash,
      input.profileHash, reasons, configurationMissing ? null : lease.id]));
    let review = await tx.engineReview.findUnique({ where: { evidenceKey } });
    if (!review) {
      await tx.engineReview.updateMany({ where: { policyId: lease.policyId!, mode, status: { in: ['pending', 'observed'] } },
        data: { status: 'superseded', reviewedAt: new Date(), reviewNote: 'Superseded by a newer frozen observation.' } });
      review = await tx.engineReview.create({ data: { evidenceKey, policyId: lease.policyId!, mode, status: mode === 'observe' ? 'observed' : 'pending',
        expectedBaselineHash: lease.expectedBaselineHash || '', taskId: lease.id, reasonsJson: JSON.stringify(reasons),
        payloadJson: JSON.stringify({ checkpoint, input, observation, runId: lease.runId }) } });
    }
    if (claimsValidated && checkpoint?.analysis) {
      await recordClaimLedger(tx, { taskId: lease.id, policyId: lease.policyId!, analysis: checkpoint.analysis,
        verification: checkpoint.verification, reviewId: review.id });
    }
    if (checkpoint) await tx.engineTask.update({ where: { id: lease.id }, data: { checkpointJson: JSON.stringify(checkpoint) } });
    await finishTask(tx, lease, { outcome: 'review', reasons, artifactId: observation.artifactId });
  });
}

async function anchor(tx: Tx, policyId: string, input: TaskInput, body: CaptureBody, observation: Observation) {
  const data = { baselineHash: body.document.hash, profileHash: input.profileHash, inputHash: digest(body.html),
    input: body.html, sourceUrl: input.sourceUrl, capturedAt: new Date(observation.observedAt) };
  await tx.extractionBaseline.upsert({ where: { policyId }, create: { policyId, ...data }, update: data });
}
async function baseline(tx: Tx, policy: Policy, input: TaskInput, body: CaptureBody, observation: Observation) {
  const latest = await tx.policySnapshot.findFirst({ where: { policyId: policy.id }, orderBy: { version: 'desc' } });
  const snapshot = await tx.policySnapshot.create({ data: { policyId: policy.id, version: (latest?.version || 0) + 1,
    text: body.document.text, hash: body.document.hash, sourceUrl: policy.url, requestedUrl: input.sourceUrl,
    finalUrl: observation.finalUrl, sourceProvenance: observation.source, publicEvidence: true } });
  await tx.policy.update({ where: { id: policy.id }, data: { currentHash: body.document.hash, currentText: body.document.text,
    sourceMigrationPending: false, sourceMigrationRequestedAt: null, ingestionMethod: observation.source === 'rendered' ? 'Rendered Scrape' : 'Direct Scrape' } });
  await anchor(tx, policy.id, input, body, observation);
  await saveRepresentation(tx, observation);
  return snapshot;
}

async function evaluate(lease: Lease, input: TaskInput) {
  const dependency = await db.engineTask.findUniqueOrThrow({ where: { id: lease.dependencyId! } });
  const observation: Observation = dependency.status === 'completed' && dependency.resultJson ? JSON.parse(dependency.resultJson) : {
    artifactId: null, observedAt: new Date().toISOString(), source: 'none', httpStatus: 0, finalUrl: input.sourceUrl,
    notModified: false, eligible: false, reasons: ['acquisition_failed'], diagnostics: [] };
  if (!observation.eligible || !observation.artifactId) return hold(lease, observation, observation.reasons);
  const body = await readArtifact<CaptureBody>(observation.artifactId);
  const policy = await db.policy.findUniqueOrThrow({ where: { id: lease.policyId! } });
  if (policy.currentHash !== lease.expectedBaselineHash || policyScopeHash(policy) !== input.scopeHash) return hold(lease, observation, ['engine_context_changed']);
  if (body.document.hash === policy.currentHash && !policy.sourceMigrationPending) {
    await fenced(lease, async tx => {
      await currentPolicy(tx, lease, input);
      await recordAttempt(tx, lease, observation, observation.notModified ? 'http_revalidated' : 'verified_unchanged', true);
      if (await publicationMode(tx, lease.runId)) {
        await anchor(tx, policy.id, input, body, observation); await saveRepresentation(tx, observation);
      }
      await tx.engineReview.updateMany({ where: { policyId: policy.id, mode: input.mode, status: { in: ['pending', 'observed'] } },
        data: { status: 'superseded', reviewedAt: new Date(), reviewNote: 'Source verified against the current baseline.' } });
      await tx.enginePolicyState.update({ where: stateKey(policy.id, input.mode), data: { ...clearCandidate,
        lastVerifiedAt: new Date(), reason: `verified:${input.profileHash}` } });
      await finishTask(tx, lease, { outcome: observation.notModified ? 'revalidated' : 'unchanged', artifactId: observation.artifactId });
    });
    return;
  }
  if (observation.notModified) return hold(lease, observation, ['conditional_response_cannot_confirm_change']);
  const oldAnchor = await db.extractionBaseline.findUnique({ where: { policyId: policy.id } });
  const establishing = policy.sourceMigrationPending || (!policy.currentText.trim() && policy.currentHash === digest(''));
  if (!establishing && (!oldAnchor || oldAnchor.baselineHash !== policy.currentHash || oldAnchor.sourceUrl !== input.sourceUrl)) {
    return hold(lease, observation, ['extraction_baseline_missing']);
  }
  if (!establishing && oldAnchor!.profileHash !== input.profileHash) {
    if (!oldAnchor!.input || digest(oldAnchor!.input) !== oldAnchor!.inputHash) return hold(lease, observation, ['extraction_replay_unavailable']);
    let replayBody: CaptureBody;
    try { replayBody = extractEngineBody(oldAnchor!.input, input.sourceUrl, input.contract?.language, input.contract); }
    catch { return hold(lease, observation, ['extraction_replay_incomplete']); }
    // The reviewer explicitly checks old language and extraction before adoption.
    const baselineCandidateArtifactId = await putArtifact(replayBody);
    const replayReason = assessCapture(replayBody, input.contract, input.sourceUrl).eligible
      ? 'parser_upgrade_requires_baseline_review' : 'parser_upgrade_rebaseline_required';
    return hold(lease, observation, [replayReason], {
      observation, oldArtifactId: await putArtifact(structureDocument(policy.currentText)), baselineCandidateArtifactId,
    });
  }
  const state = await db.enginePolicyState.findUnique({ where: stateKey(policy.id, input.mode) });
  const observedAt = new Date(observation.observedAt);
  const confirmation = state?.candidateHash === body.document.hash && state.candidateProfileHash === digest(input.profileHash + (input.contractHash || ''))
    && state.candidateRunId !== lease.runId && state.candidateObservedAt
    && observedAt.getTime() - state.candidateObservedAt.getTime() >= CONFIRMATION_MS
    && observedAt.getTime() - state.candidateObservedAt.getTime() <= 7 * DAILY_MS;
  if (!confirmation) {
    await fenced(lease, async tx => {
      await currentPolicy(tx, lease, input);
      await recordAttempt(tx, lease, observation, 'awaiting_independent_confirmation', true);
      const sameCandidate = state?.candidateHash === body.document.hash && state.candidateProfileHash === digest(input.profileHash + (input.contractHash || ''))
        && state.candidateObservedAt && observedAt.getTime() - state.candidateObservedAt.getTime() <= 7 * DAILY_MS;
      await tx.enginePolicyState.update({ where: stateKey(policy.id, input.mode), data: {
        candidateHash: body.document.hash, candidateArtifactId: observation.artifactId, candidateRunId: sameCandidate ? state.candidateRunId : lease.runId,
        candidateObservedAt: sameCandidate ? state.candidateObservedAt : observedAt, candidateProfileHash: digest(input.profileHash + (input.contractHash || '')),
        nextDueAt: new Date(Date.now() + CONFIRMATION_MS) } });
      await finishTask(tx, lease, { outcome: 'confirmation_pending', artifactId: observation.artifactId });
    });
    return;
  }
  if (establishing) {
    await fenced(lease, async tx => {
      const fresh = await currentPolicy(tx, lease, input);
      const publish = await publicationMode(tx, lease.runId);
      await recordAttempt(tx, lease, observation, publish ? 'baseline_established' : 'observed_baseline_ready', publish);
      if (publish) {
        await baseline(tx, fresh, input, body, observation);
        await dualWriteCanonicalPolicyGraph(tx, policy.id);
        await tx.enginePolicyState.update({ where: stateKey(policy.id, input.mode), data: { ...clearCandidate, lastVerifiedAt: new Date(), reason: `verified:${input.profileHash}` } });
      }
      await finishTask(tx, lease, { outcome: publish ? 'baseline_established' : 'observed_baseline_ready' });
    });
    return;
  }
  const old = structureDocument(policy.currentText);
  if (old.hash !== policy.currentHash) return hold(lease, observation, ['baseline_integrity_failure']);
  const comparison = compareDocuments(old, body.document);
  const oldArtifactId = await putArtifact(old);
  if (comparison.kind === 'formatting') return hold(lease, observation, ['formatting_requires_baseline_review'], { observation, oldArtifactId, confirmation: { firstRunId: state!.candidateRunId!, firstArtifactId: state!.candidateArtifactId!, firstObservedAt: state!.candidateObservedAt!.toISOString(), secondRunId: lease.runId } });
  await advanceTask(lease, 'analyze', { observation, oldArtifactId, confirmation: {
    firstRunId: state!.candidateRunId!, firstArtifactId: state!.candidateArtifactId!,
    firstObservedAt: state!.candidateObservedAt!.toISOString(), secondRunId: lease.runId,
  } } satisfies Checkpoint);
}

async function analysisInput(checkpoint: Checkpoint): Promise<AnalysisInput> {
  const [old, body] = await Promise.all([readArtifact<AnalysisInput['old']>(checkpoint.oldArtifactId), readArtifact<CaptureBody>(checkpoint.observation.artifactId!)]);
  return { old, next: body.document, deltas: compareDocuments(old, body.document).deltas };
}

async function publish(tx: Tx, policy: Policy, input: TaskInput, checkpoint: Checkpoint, taskId: string, body: CaptureBody) {
  const claims = checkpoint.analysis!.value.claims;
  const previous = await tx.policySnapshot.findFirst({ where: { policyId: policy.id, hash: policy.currentHash, publicEvidence: true }, orderBy: { version: 'desc' } });
  if (!previous) throw new Error('public_old_snapshot_missing');
  const next = await baseline(tx, policy, input, body, checkpoint.observation);
  const score = Math.max(...claims.map(c => c.impact));
  const change = await tx.policyChange.create({ data: {
    policyId: policy.id, oldSnapshotId: previous.id, newSnapshotId: next.id,
    diff: JSON.stringify(diffLines(policy.currentText, body.document.text)),
    aiSummaryEn: claims.map(c => c.textEn).join('\n\n'), aiSummaryIt: claims.map(c => c.textIt).join('\n\n'),
    tldrEn: claims[0].textEn, tldrIt: claims[0].textIt,
    keyPointsJson: JSON.stringify(claims.map(c => ({ textEn: c.textEn, textIt: c.textIt, sentiment: 'neutral' }))),
    overallRisk: score >= 7 ? 'High' : score >= 4 ? 'Medium' : 'Low', overallScore: score,
    remediationsJson: '[]', riskReasonsJson: '[]', aiTrainingOptOut: 'Not assessed', aiDataScrapingRestricted: 'Not assessed',
    aiIpLicensing: 'Not assessed', aiPromptRetention: 'Not assessed', publicEvidence: true, publicPublishedAt: new Date(),
    analysisTraceId: taskId, analysisMethod: 'grounded-claims-independent-verifier', analysisSchemaVersion: ENGINE_SCHEMA,
    analysisPromptVersion: checkpoint.analysis!.receipt.promptVersion, analysisInputHash: checkpoint.analysis!.receipt.inputHash,
    analysisEvidenceJson: JSON.stringify({ claims: checkpoint.analysis!.value, analysis: checkpoint.analysis!.receipt, confirmation: checkpoint.confirmation,
      verification: checkpoint.verification, artifactId: checkpoint.observation.artifactId, oldArtifactId: checkpoint.oldArtifactId }),
  } });
  await dualWriteCanonicalPolicyGraph(tx, policy.id);
  await tx.engineReview.updateMany({ where: { policyId: policy.id, mode: 'publish', status: 'pending' }, data: { status: 'superseded', reviewedAt: new Date(), reviewNote: 'Baseline advanced after verified publication.' } });
  const task = await tx.engineTask.findUniqueOrThrow({ where: { id: taskId }, include: { run: true } });
  if (task.run.notificationMode === 'subscribers') await tx.engineOutbox.create({ data: { eventKey: `change:${change.id}`, changeId: change.id, payloadJson: JSON.stringify({ changeId: change.id }) } });
  await tx.enginePolicyState.update({ where: stateKey(policy.id, input.mode), data: { ...clearCandidate,
    lastVerifiedAt: new Date(), lastChangedAt: new Date(), reason: `verified:${input.profileHash}` } });
  return change.id;
}

async function processTask(lease: Lease, dependencies: EngineDependencies) {
  const input = JSON.parse(lease.inputJson) as TaskInput;
  const run = await db.engineRun.findUniqueOrThrow({ where: { id: lease.runId } });
  let channel: ChannelMetadata | null;
  try { channel = run.channelMetadataJson ? JSON.parse(run.channelMetadataJson) as ChannelMetadata : null; }
  catch { throw new Error('channel_context_changed'); }
  if (isHostedPreview()) {
    assertHostedPreviewContext();
    if (!channel || input.mode !== 'observe' || run.mode !== 'observe' || run.notificationMode !== 'silent') throw new Error('channel_context_changed');
  }
  if (channel) assertChannelWorkerContext(channel, run.mode, run.notificationMode);
  if (lease.kind === 'fetch') {
    const observation = await dependencies.acquire(input);
    if (!observation.eligible && observation.reasons.some(r => ['origin_backoff', 'live_source_unverified'].includes(r)) && lease.attempt < MAX_ATTEMPTS) {
      return failTask(lease, observation.reasons[0], observation.retryAfterMs);
    }
    const result: Observation & { comparisonArtifactId?: string } = { ...observation };
    if (channel?.channel === 'compare' && observation.artifactId) {
      const body = await readArtifact<CaptureBody>(observation.artifactId);
      result.comparisonArtifactId = await putArtifact(compareCapturedExtraction(body, input, observation));
    }
    if (channel) assertChannelWorkerContext(channel, run.mode, run.notificationMode);
    await fenced(lease, tx => finishTask(tx, lease, result, observation.retryAfterMs));
    return;
  }
  if (lease.stage === 'evaluate') return evaluate(lease, input);
  const checkpoint = JSON.parse(lease.checkpointJson!) as Checkpoint;
  const evidence = await analysisInput(checkpoint);
  if (lease.stage === 'analyze') {
    checkpoint.analysis = await dependencies.analysis.analyze(evidence);
    const validation = validateClaims(checkpoint.analysis.value, evidence);
    if (validation.reasons.length) return hold(lease, checkpoint.observation, validation.reasons, checkpoint);
    return advanceTask(lease, 'verify', checkpoint);
  }
  const validation = validateClaims(checkpoint.analysis?.value, evidence);
  if (!validation.claims || validation.reasons.length) return hold(lease, checkpoint.observation, validation.reasons, checkpoint);
  if (lease.stage === 'verify') {
    checkpoint.verification = await dependencies.analysis.verify(evidence, validation.claims);
    return advanceTask(lease, 'commit', checkpoint);
  }
  if (lease.stage !== 'commit') throw new Error('unknown_engine_stage');
  const reasons = [...validateVerification(checkpoint.verification?.value, validation.claims),
    ...validateModelPair(checkpoint.analysis?.receipt, checkpoint.verification?.receipt)];
  if (validation.highImpact) reasons.push('high_impact_review_required');
  if (Date.now() - Date.parse(checkpoint.observation.observedAt) > 2 * DAILY_MS) reasons.push('evidence_stale');
  if (reasons.length) return hold(lease, checkpoint.observation, reasons, checkpoint, true);
  const body = await readArtifact<CaptureBody>(checkpoint.observation.artifactId!);
  await fenced(lease, async tx => {
    const policy = await currentPolicy(tx, lease, input);
    const shouldPublish = await publicationMode(tx, lease.runId);
    await recordAttempt(tx, lease, checkpoint.observation, shouldPublish ? 'verified_change' : 'observed_change_ready', shouldPublish);
    const changeId = shouldPublish ? await publish(tx, policy, input, checkpoint, lease.id, body) : null;
    // Both modes record validated claims; only a public change gets a changeId.
    await recordClaimLedger(tx, { taskId: lease.id, policyId: policy.id, analysis: checkpoint.analysis!,
      verification: checkpoint.verification, changeId });
    await finishTask(tx, lease, { outcome: shouldPublish ? 'published' : 'observed_change_ready', changeId,
      artifactId: checkpoint.observation.artifactId });
  });
}

/** A worker step is durable; HTTP request lifetimes never own this loop. */
export async function workerStep(dependencies: EngineDependencies = defaults): Promise<boolean> {
  const lease = await claimTask();
  if (!lease) return false;
  let lost = false;
  const timer = setInterval(() => { void heartbeat(lease).then(() => { lost = false; }).catch(() => { lost = true; }); }, 60_000);
  try {
    await processTask(lease, dependencies);
  } catch (error) {
    const code = error instanceof Error ? error.message : 'engine_processing_error';
    if (['analysis_context_budget_exceeded', 'analysis_output_budget_exceeded'].includes(code) && lease.checkpointJson) {
      const checkpoint = JSON.parse(lease.checkpointJson) as Checkpoint;
      try { await hold(lease, checkpoint.observation, [code], checkpoint); } catch { /* Fencing still applies. */ }
    } else if (!lost && code !== 'engine_lease_lost') {
      try { await failTask(lease, code); } catch { /* Another lease owner now decides the outcome. */ }
    }
  } finally { clearInterval(timer); }
  await reconcileRun(lease.runId);
  return true;
}

/** Explicitly request a new baseline when historical DOM cannot be safely replayed.
 * This does not adopt a snapshot: two fresh contract-eligible captures are still required.
 */
export async function requestConfirmedRebaseline(id: string, note: string, actor: string) {
  if (process.env.POLICYWATCHER_ENGINE_PUBLICATION !== '1' || process.env.POLICYWATCHER_SCANS_PAUSED === '1') throw new Error('publication_disabled');
  if (note.trim().length < 20 || note.length > 2000) throw new Error('review_note_required');
  return db.$transaction(async tx => {
    const review = await tx.engineReview.findUniqueOrThrow({ where: { id } });
    if (review.status === 'rebaseline_requested') return { status: review.status };
    if (review.status !== 'pending' || review.mode !== 'publish'
      || JSON.stringify(JSON.parse(review.reasonsJson)) !== JSON.stringify(['parser_upgrade_rebaseline_required'])) throw new Error('rebaseline_review_required');
    const payload = JSON.parse(review.payloadJson) as { input: TaskInput; runId: string; observation?: Observation };
    if (!payload.observation?.eligible || !payload.observation.artifactId
      || Date.now() - Date.parse(payload.observation.observedAt) > 2 * DAILY_MS) throw new Error('review_hard_gate_unresolved');
    const captured = await readArtifact<CaptureBody>(payload.observation.artifactId, tx);
    if (!assessCapture(captured, payload.input.contract, payload.input.sourceUrl).eligible) throw new Error('review_hard_gate_unresolved');
    if (await tx.engineTask.count({ where: { activePolicyId: review.policyId } })) throw new Error('policy_active_cancel_first');
    const task = await tx.engineTask.findUniqueOrThrow({ where: { id: review.taskId } });
    const policy = await currentPolicy(tx, task as Lease, payload.input);
    if (!await publicationMode(tx, payload.runId)) throw new Error('observe_run_cannot_publish');
    const won = await tx.engineReview.updateMany({ where: { id, status: 'pending' }, data: { status: 'rebaseline_requested', reviewedAt: new Date(), reviewedBy: actor, reviewNote: note } });
    if (!won.count) throw new Error('review_conflict');
    await tx.policy.update({ where: { id: policy.id }, data: { sourceMigrationPending: true, sourceMigrationRequestedAt: new Date() } });
    await tx.enginePolicyState.update({ where: stateKey(policy.id, 'publish'), data: { ...clearCandidate, nextDueAt: new Date(), reason: 'confirmed_rebaseline_requested' } });
    await tx.adminReviewLog.create({ data: { actorRole: actor, action: 'engine_rebaseline_requested', targetType: 'policy', targetId: policy.id,
      note, metadataJson: JSON.stringify({ reviewId: id, retainedBaselineHash: policy.currentHash, requiresFreshCaptures: 2 }) } });
    return { status: 'rebaseline_requested' };
  }, { timeout: 15_000 });
}

export async function approveReview(id: string, note: string, actor: string) {
  if (process.env.POLICYWATCHER_ENGINE_PUBLICATION !== '1' || process.env.POLICYWATCHER_SCANS_PAUSED === '1') throw new Error('publication_disabled');
  if (note.trim().length < 20 || note.length > 2000) throw new Error('review_note_required');
  const review = await db.engineReview.findUniqueOrThrow({ where: { id } });
  if (review.status === 'approved') return review.changeId;
  if (review.status !== 'pending') throw new Error('review_not_pending');
  const payload = JSON.parse(review.payloadJson) as { checkpoint?: Checkpoint; input: TaskInput; runId: string };
  const reasons = JSON.parse(review.reasonsJson) as string[];
  if (reasons.length === 1 && ['parser_upgrade_requires_baseline_review', 'formatting_requires_baseline_review'].includes(reasons[0])) return approveBaselineReview(review, payload, note, actor);
  // Human approval resolves impact, not missing/invalid evidence or an observe-only run.
  if (!payload.checkpoint || reasons.some(r => r !== 'high_impact_review_required')) throw new Error('review_hard_gate_unresolved');
  const evidence = await analysisInput(payload.checkpoint);
  const body = await readArtifact<CaptureBody>(payload.checkpoint.observation.artifactId!);
  const validated = validateClaims(payload.checkpoint.analysis?.value, evidence);
  if (!validated.claims || validated.reasons.length || validateVerification(payload.checkpoint.verification?.value, validated.claims).length
    || validateModelPair(payload.checkpoint.analysis?.receipt, payload.checkpoint.verification?.receipt).length
    || Date.now() - Date.parse(payload.checkpoint.observation.observedAt) > 2 * DAILY_MS) throw new Error('review_hard_gate_unresolved');
  return db.$transaction(async tx => {
    const task = await tx.engineTask.findUniqueOrThrow({ where: { id: review.taskId } });
    const policy = await currentPolicy(tx, task as Lease, payload.input);
    if (!await publicationMode(tx, payload.runId)) throw new Error('observe_run_cannot_publish');
    const won = await tx.engineReview.updateMany({ where: { id, status: 'pending' }, data: { status: 'approving' } });
    if (won.count !== 1) throw new Error('review_conflict');
    const changeId = await publish(tx, policy, payload.input, payload.checkpoint!, review.taskId, body);
    // Claims re-validated above; the hold normally wrote them already.
    await recordClaimLedger(tx, { taskId: review.taskId, policyId: policy.id, analysis: payload.checkpoint!.analysis!,
      verification: payload.checkpoint!.verification, reviewId: id, changeId });
    await approveClaimLedger(tx, review.taskId, actor);
    await tx.policy.update({ where: { id: policy.id }, data: { lastSuccessfulCheckDate: new Date(), dataStatus: 'Available' } });
    await tx.engineReview.update({ where: { id }, data: { status: 'approved', reviewedAt: new Date(), reviewedBy: actor, reviewNote: note, changeId } });
    await tx.adminReviewLog.create({ data: { actorRole: actor, action: 'engine_evidence_approved', targetType: 'policy', targetId: policy.id,
      note, policyChangeId: changeId, metadataJson: JSON.stringify({ reviewId: id, taskId: task.id }) } });
    return changeId;
  }, { timeout: 15_000 });
}

async function approveBaselineReview(review: { id: string; taskId: string }, payload: { checkpoint?: Checkpoint; input: TaskInput; runId: string }, note: string, actor: string) {
  const checkpoint = payload.checkpoint;
  if (!checkpoint) throw new Error('review_hard_gate_unresolved');
  const replay = Boolean(checkpoint.baselineCandidateArtifactId);
  const body = await readArtifact<CaptureBody>(checkpoint.baselineCandidateArtifactId || checkpoint.observation.artifactId!);
  if (body.document.hash !== digest(body.document.text)) throw new Error('artifact_integrity_failure');
  if (!assessCapture(body, payload.input.contract, payload.input.sourceUrl).eligible) throw new Error('review_hard_gate_unresolved');
  if (Date.now() - Date.parse(checkpoint.observation.observedAt) > 2 * DAILY_MS || (!replay && !checkpoint.confirmation)) throw new Error('review_hard_gate_unresolved');
  return db.$transaction(async tx => {
    const task = await tx.engineTask.findUniqueOrThrow({ where: { id: review.taskId } });
    const policy = await currentPolicy(tx, task as Lease, payload.input);
    if (!await publicationMode(tx, payload.runId)) throw new Error('observe_run_cannot_publish');
    const won = await tx.engineReview.updateMany({ where: { id: review.id, status: 'pending' }, data: { status: 'approving' } });
    if (!won.count) throw new Error('review_conflict');
    const prior = await tx.extractionBaseline.findUnique({ where: { policyId: policy.id } });
    if (replay && (!prior || prior.baselineHash !== policy.currentHash || digest(body.html) !== prior.inputHash)) throw new Error('review_hard_gate_unresolved');
    const previous = await tx.policySnapshot.findFirst({ where: { policyId: policy.id, hash: policy.currentHash, publicEvidence: true }, orderBy: { version: 'desc' } });
    if (!previous) throw new Error('public_old_snapshot_missing');
    const observation = replay ? { ...checkpoint.observation, source: 'replayed', finalUrl: previous.finalUrl || prior!.sourceUrl,
      observedAt: prior!.capturedAt.toISOString(), cache: undefined } : checkpoint.observation;
    if (replay && body.document.hash === policy.currentHash) await anchor(tx, policy.id, payload.input, body, observation);
    else await baseline(tx, policy, payload.input, body, observation);
    await tx.policy.update({ where: { id: policy.id }, data: { dataStatus: 'Available',
      lastSuccessfulCheckDate: new Date(checkpoint.observation.observedAt), ...(replay ? { ingestionMethod: policy.ingestionMethod } : {}) } });
    await dualWriteCanonicalPolicyGraph(tx, policy.id);
    await tx.enginePolicyState.update({ where: stateKey(policy.id, payload.input.mode), data: { ...clearCandidate, nextDueAt: new Date(), reason: 'baseline_review_approved' } });
    await tx.engineReview.updateMany({ where: { policyId: policy.id, mode: 'publish', status: 'pending' }, data: { status: 'superseded', reviewedAt: new Date(), reviewNote: 'Baseline replaced by explicit review.' } });
    await tx.engineReview.update({ where: { id: review.id }, data: { status: 'approved', reviewedAt: new Date(), reviewedBy: actor, reviewNote: note } });
    await tx.adminReviewLog.create({ data: { actorRole: actor, action: 'engine_baseline_approved', targetType: 'policy', targetId: policy.id, note,
      metadataJson: JSON.stringify({ reviewId: review.id, oldHash: policy.currentHash, newHash: body.document.hash, replay }) } });
    return null;
  }, { timeout: 15_000 });
}

/** Closing a review never deletes its evidence. Refresh schedules a new acquisition. */
export async function closeReview(id: string, action: 'reject' | 'refresh', note: string, actor: string) {
  if (note.trim().length < 20 || note.length > 2000) throw new Error('review_note_required');
  return db.$transaction(async tx => {
    const review = await tx.engineReview.findUniqueOrThrow({ where: { id } });
    if (!['pending', 'observed'].includes(review.status)) throw new Error('review_not_pending');
    const won = await tx.engineReview.updateMany({ where: { id, status: review.status }, data: {
      status: action === 'refresh' ? 'superseded' : 'rejected', reviewedAt: new Date(), reviewedBy: actor, reviewNote: note } });
    if (!won.count) throw new Error('review_conflict');
    await tx.enginePolicyState.updateMany({ where: { policyId: review.policyId, mode: review.mode }, data: { nextDueAt: new Date(), reason: `review_${action}` } });
    await tx.adminReviewLog.create({ data: { actorRole: actor, action: `engine_review_${action}`, targetType: 'policy', targetId: review.policyId,
      note, metadataJson: JSON.stringify({ reviewId: id }) } });
    return { status: action === 'refresh' ? 'superseded' : 'rejected' };
  });
}
