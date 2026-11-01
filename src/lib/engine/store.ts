import { randomUUID } from 'node:crypto';
import type { EngineRun, EngineTask, Prisma } from '@prisma/client';
import { db } from '../db';
import { digest, ENGINE_SCHEMA, parseSourceContract, type SourceContract } from './document';
import { extractionProfileHash } from '../extractionProfile';
import { channelMetadata, channelRequestFingerprint, experimentalChannelsAvailable } from '../scanChannels';

export const LEASE_MS = 5 * 60_000;
export const MAX_ATTEMPTS = 3;
export const DAILY_MS = 24 * 60 * 60_000;
export const CONFIRMATION_MS = 60 * 60_000;
export const MAX_ARTIFACT_BYTES = 12_000_000;
export type Lease = EngineTask & { leaseToken: string };
export type Tx = Prisma.TransactionClient;
export interface TaskInput {
  mode: 'publish' | 'observe';
  sourceUrl: string;
  scopeHash: string;
  profileHash: string;
  contractHash: string | null;
  contract: SourceContract | null;
  forceFresh: boolean;
  baselineHash: string;
  origin: string;
}
export const stateKey = (policyId: string, mode: string) => ({ policyId_mode: { policyId, mode } });
export const engineEnabled = () => process.env.POLICYWATCHER_ENGINE_V6 === '1';
export const engineExtractionProfileHash = (url: string) => digest(`engine-extractor-1:${extractionProfileHash(url)}`);
export const policyScopeHash = (policy: { url: string; retrievalUrl?: string | null; jurisdiction: string; type: string }) =>
  digest(JSON.stringify([policy.url, policy.retrievalUrl || policy.url, policy.jurisdiction, policy.type]));

export async function enqueueRun(options: { requestKey: string; mode: 'observe' | 'publish'; requestedBy: string; limit?: number; companySlug?: string; notificationMode?: 'silent' | 'subscribers'; channel?: 'preview' | 'compare' }, retry = 0): Promise<EngineRun> {
  if (process.env.POLICYWATCHER_SCANS_PAUSED === '1') throw new Error('policy_scans_paused');
  if (!/^[\w:.\-]{8,150}$/.test(options.requestKey)) throw new Error('invalid_request_key');
  const limit = options.limit ?? 500;
  if (!Number.isInteger(limit) || limit < 1 || limit > 500) throw new Error('invalid_engine_limit');
  if (options.channel && (!experimentalChannelsAvailable() || options.mode !== 'observe' || options.notificationMode !== 'silent' || limit > 50)) throw new Error('experimental_channel_unavailable');
  const metadata = options.channel ? channelMetadata({ channel: options.channel, limit, companySlug: options.companySlug }) : null;
  const existing = await db.engineRun.findUnique({ where: { requestKey: options.requestKey } });
  const checkExisting = (run: EngineRun) => {
    if (run.mode !== options.mode || Boolean(run.channelMetadataJson) !== Boolean(metadata)
        || (metadata && JSON.parse(run.channelMetadataJson!).requestFingerprint !== channelRequestFingerprint({ channel: options.channel!, limit, companySlug: options.companySlug }))) throw new Error('request_key_conflict');
    return run;
  };
  if (existing) return checkExisting(existing);
  const now = new Date();
  const [policies, contracts] = await Promise.all([
    db.policy.findMany({ where: options.companySlug ? { company: { slug: options.companySlug } } : undefined,
      orderBy: [{ lastCheckDate: 'asc' }, { id: 'asc' }], take: 5000 }),
    db.engineSourceContract.findMany(),
  ]);
  const contractMap = new Map(contracts.map(c => [c.policyId, c]));
  try {
    return await db.$transaction(async tx => {
      if (experimentalChannelsAvailable()) {
        const stable = await tx.scanRun.findFirst({ where: { status: 'running', leaseKey: 'policy-scan' } });
        // Expiry alone does not prove the old process has stopped. Keep the hold explicit.
        if (stable) throw new Error(stable.leaseExpiresAt && stable.leaseExpiresAt <= now ? 'stable_scan_recovery_required' : 'stable_scan_active');
      }
      const [active, freshStates] = await Promise.all([
        tx.engineTask.findMany({ where: { activePolicyId: { not: null } }, select: { activePolicyId: true } }),
        tx.enginePolicyState.findMany({ where: { mode: options.mode } }),
      ]);
      const occupied = new Set(active.map(t => t.activePolicyId));
      const freshStateMap = new Map(freshStates.map(s => [s.policyId, s]));
      const selected = policies.filter(p => !occupied.has(p.id) && (!freshStateMap.get(p.id) || freshStateMap.get(p.id)!.nextDueAt <= now))
        .sort((a, b) => Number(Boolean(freshStateMap.get(b.id)?.candidateHash)) - Number(Boolean(freshStateMap.get(a.id)?.candidateHash))
          || (freshStateMap.get(a.id)?.nextDueAt.getTime() || 0) - (freshStateMap.get(b.id)?.nextDueAt.getTime() || 0)).slice(0, limit);
      const run = await tx.engineRun.create({ data: { requestKey: options.requestKey, mode: options.mode,
        channelMetadataJson: metadata ? JSON.stringify(metadata) : null,
        requestedBy: options.requestedBy, notificationMode: options.notificationMode || 'silent', selected: selected.length, status: selected.length ? 'queued' : 'completed', completedAt: selected.length ? null : now } });
      const fetches = new Map<string, string>();
      for (const policy of selected) {
        const row = contractMap.get(policy.id);
        const contract = row ? parseSourceContract(JSON.parse(row.contractJson)) : null;
        const sourceUrl = policy.retrievalUrl || policy.url;
        const state = freshStateMap.get(policy.id);
        const profileHash = engineExtractionProfileHash(sourceUrl);
        const input: TaskInput = { mode: options.mode, sourceUrl, scopeHash: policyScopeHash(policy), profileHash, baselineHash: policy.currentHash,
          contractHash: row?.contractHash || null, contract,
          // Only a verified stable baseline can reuse a conditional representation.
          forceFresh: policy.sourceMigrationPending || !state?.lastVerifiedAt || Boolean(state.candidateHash) || state.reason !== `verified:${profileHash}`,
          origin: new URL(sourceUrl).origin };
        const fetchKey = digest(JSON.stringify([sourceUrl, profileHash, input.contractHash, input.baselineHash, contract?.language, contract?.preferredTransport, input.forceFresh]));
        let dependencyId = fetches.get(fetchKey);
        if (!dependencyId) {
          const fetch = await tx.engineTask.create({ data: { runId: run.id, key: `${run.id}:fetch:${fetchKey}`,
            kind: 'fetch', stage: 'acquire', priority: state?.candidateHash ? 1 : 0,
            inputJson: JSON.stringify(input) } });
          dependencyId = fetch.id; fetches.set(fetchKey, fetch.id);
        }
        await tx.engineTask.create({ data: { runId: run.id, key: `${run.id}:policy:${policy.id}`,
          kind: 'policy', policyId: policy.id, activePolicyId: policy.id, dependencyId, stage: 'evaluate', status: 'blocked',
          expectedBaselineHash: policy.currentHash, inputJson: JSON.stringify(input) } });
      }
      return run;
    }, { timeout: 20_000 });
  } catch (error) {
    // Concurrent clients with the same request key observe the same committed run.
    const duplicate = await db.engineRun.findUnique({ where: { requestKey: options.requestKey } });
    if (duplicate) return checkExisting(duplicate);
    if (retry < 1 && error && typeof error === 'object' && 'code' in error && ['P2002', 'P2034'].includes(String(error.code))) return enqueueRun(options, retry + 1);
    throw error;
  }
}

export async function recoverExpiredTasks(now = new Date()) {
  const expired = await db.engineTask.findMany({ where: { status: 'running', leaseExpiresAt: { lte: now } }, take: 500 });
  for (const task of expired) {
    await db.$transaction(async tx => {
      const terminal = task.attempt >= MAX_ATTEMPTS;
      const changed = await tx.engineTask.updateMany({ where: { id: task.id, status: 'running', leaseToken: task.leaseToken,
        leaseExpiresAt: { lte: now } }, data: { status: terminal ? 'failed' : 'queued', leaseToken: null, leaseExpiresAt: null,
        nextAttemptAt: now, completedAt: terminal ? now : null, ...(terminal ? { activePolicyId: null } : {}), lastError: terminal ? 'lease_attempts_exhausted' : 'lease_expired' } });
      if (!changed.count) return;
      await tx.engineAttempt.updateMany({ where: { taskId: task.id, generation: task.totalAttempts, status: 'running' },
        data: { status: 'expired', reason: 'lease_expired', endedAt: now } });
      if (terminal) await terminalFailure(tx, task, 'lease_attempts_exhausted');
    });
  }
  const failedDependencies = await db.engineTask.findMany({ where: { kind: 'fetch', status: { in: ['failed', 'completed'] },
    run: { status: { in: ['queued', 'running'] } } }, select: { id: true } });
  if (failedDependencies.length) await db.engineTask.updateMany({ where: { status: 'blocked', dependencyId: { in: failedDependencies.map(d => d.id) } }, data: { status: 'queued' } });
  // A process can die after the final task commits but before run reconciliation.
  // Sweep persisted terminal runs even when no lease expired in this invocation.
  // Predicates are checked in each UPDATE, rather than using a stale task snapshot.
  const terminal = ['completed', 'failed', 'cancelled'];
  await db.engineRun.updateMany({ where: { status: { in: ['queued', 'running'] },
    tasks: { none: { status: { notIn: terminal } }, some: { status: 'failed' } } },
    data: { status: 'completed_with_errors', completedAt: now } });
  await db.engineRun.updateMany({ where: { status: { in: ['queued', 'running'] },
    tasks: { none: { status: { notIn: ['completed', 'cancelled'] } } } },
    data: { status: 'completed', completedAt: now } });
}

export async function claimTask(): Promise<Lease | null> {
  if (process.env.POLICYWATCHER_SCANS_PAUSED === '1') return null;
  await recoverExpiredTasks();
  const now = new Date();
  const candidates = await db.engineTask.findMany({ where: { status: 'queued', nextAttemptAt: { lte: now }, attempt: { lt: MAX_ATTEMPTS },
    run: { status: { in: ['queued', 'running'] }, ...(process.env.POLICYWATCHER_ENGINE_PUBLICATION === '1' ? {} : { mode: 'observe' }) } }, orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }], take: 10_000 });
  const blockedOrigins = new Set((await db.engineOrigin.findMany({ where: { OR: [
    { nextAllowedAt: { gt: now } }, { leaseToken: { not: null }, leaseExpiresAt: { gt: now } },
  ] }, select: { origin: true } })).map(o => o.origin));
  for (const candidate of candidates) {
    if (candidate.kind === 'fetch' && blockedOrigins.has((JSON.parse(candidate.inputJson) as TaskInput).origin)) continue;
    const token = randomUUID();
    try {
      const claimed = await db.$transaction(async tx => {
        if (candidate.kind === 'fetch') {
          const { origin } = JSON.parse(candidate.inputJson) as TaskInput;
          await tx.engineOrigin.upsert({ where: { origin }, create: { origin, nextAllowedAt: new Date(0) }, update: {} });
          const originClaim = await tx.engineOrigin.updateMany({ where: { origin, nextAllowedAt: { lte: now },
            OR: [{ leaseToken: null }, { leaseExpiresAt: { lte: now } }] },
          data: { leaseToken: token, leaseExpiresAt: new Date(now.getTime() + LEASE_MS) } });
          if (!originClaim.count) return null;
        }
        const updated = await tx.engineTask.updateMany({ where: { id: candidate.id, status: 'queued', attempt: candidate.attempt },
          data: { status: 'running', leaseToken: token, leaseExpiresAt: new Date(now.getTime() + LEASE_MS),
            attempt: { increment: 1 }, totalAttempts: { increment: 1 } } });
        if (!updated.count) throw new Error('claim_raced');
        await tx.engineAttempt.create({ data: { id: `${candidate.id}:${candidate.totalAttempts + 1}`, taskId: candidate.id,
          stage: candidate.stage, generation: candidate.totalAttempts + 1 } });
        await tx.engineRun.update({ where: { id: candidate.runId }, data: { status: 'running' } });
        return await tx.engineTask.findUniqueOrThrow({ where: { id: candidate.id } }) as Lease;
      });
      if (claimed) return claimed;
    } catch (error) {
      if (error instanceof Error && /claim_raced|P2034|database is locked/.test(error.message)) continue;
      throw error;
    }
  }
  return null;
}

/** Both checks use the database-owner process clock. No remote worker timestamp is trusted. */
export async function fenced<T>(lease: Lease, work: (tx: Tx) => Promise<T>): Promise<T> {
  return db.$transaction(async tx => {
    const before = await tx.engineTask.findUniqueOrThrow({ where: { id: lease.id } });
    const assert = async () => {
      const result = await tx.engineTask.updateMany({ where: { id: lease.id, leaseToken: lease.leaseToken,
        totalAttempts: lease.totalAttempts, status: 'running', leaseExpiresAt: { gt: new Date() } }, data: { updatedAt: new Date() } });
      if (result.count !== 1) throw new Error('engine_lease_lost');
    };
    await assert();
    const result = await work(tx);
    // No network calls in work. The transaction owns the row until commit; expiry is
    // checked again even if work cleared the lease while completing the task.
    if (!before.leaseExpiresAt || before.leaseExpiresAt.getTime() <= Date.now()) throw new Error('engine_lease_lost');
    return result;
  }, { timeout: 15_000 });
}

export async function transition(tx: Tx, lease: Lease, data: Prisma.EngineTaskUpdateManyMutationInput) {
  const result = await tx.engineTask.updateMany({ where: { id: lease.id, leaseToken: lease.leaseToken,
    totalAttempts: lease.totalAttempts, status: 'running', leaseExpiresAt: { gt: new Date() } }, data });
  if (result.count !== 1) throw new Error('engine_lease_lost');
}

export async function heartbeat(lease: Lease) {
  const expires = new Date(Date.now() + LEASE_MS);
  await fenced(lease, async tx => {
    await transition(tx, lease, { leaseExpiresAt: expires });
    if (lease.kind === 'fetch') await tx.engineOrigin.updateMany({ where: { leaseToken: lease.leaseToken }, data: { leaseExpiresAt: expires } });
  });
}

export async function putArtifact(body: unknown): Promise<string> {
  const bodyJson = JSON.stringify(body);
  const byteCount = Buffer.byteLength(bodyJson);
  if (byteCount > MAX_ARTIFACT_BYTES) throw new Error('artifact_size_limit');
  const id = digest(bodyJson);
  await db.engineArtifact.upsert({ where: { id }, create: { id, bodyJson, byteCount }, update: {} });
  return id;
}
export async function readArtifact<T>(id: string, reader: Pick<Tx, 'engineArtifact'> = db): Promise<T> {
  const row = await reader.engineArtifact.findUniqueOrThrow({ where: { id } });
  if (digest(row.bodyJson) !== id || Buffer.byteLength(row.bodyJson) !== row.byteCount) throw new Error('artifact_integrity_failure');
  return JSON.parse(row.bodyJson) as T;
}

export async function finishTask(tx: Tx, lease: Lease, result: unknown, cooldownMs = 1500) {
  await tx.engineAttempt.updateMany({ where: { taskId: lease.id, generation: lease.totalAttempts, status: 'running' },
    data: { status: 'completed', endedAt: new Date() } });
  await transition(tx, lease, { status: 'completed', resultJson: JSON.stringify(result), completedAt: new Date(),
    leaseToken: null, leaseExpiresAt: null, activePolicyId: null, lastError: null });
  if (lease.kind === 'fetch') {
    await tx.engineOrigin.updateMany({ where: { leaseToken: lease.leaseToken }, data: { leaseToken: null, leaseExpiresAt: null,
      nextAllowedAt: new Date(Date.now() + Math.min(Math.max(cooldownMs, 1500), DAILY_MS)) } });
    await tx.engineTask.updateMany({ where: { dependencyId: lease.id, status: 'blocked' }, data: { status: 'queued' } });
  }
}
export async function advanceTask(lease: Lease, stage: string, checkpoint: unknown) {
  await fenced(lease, async tx => {
    await tx.engineAttempt.updateMany({ where: { taskId: lease.id, generation: lease.totalAttempts, status: 'running' },
      data: { status: 'completed', endedAt: new Date() } });
    await transition(tx, lease, { stage, checkpointJson: JSON.stringify(checkpoint), status: 'queued',
      attempt: 0, leaseToken: null, leaseExpiresAt: null, nextAttemptAt: new Date() });
  });
}
async function terminalFailure(tx: Tx, task: EngineTask, reason: string) {
  if (task.kind !== 'policy' || !task.policyId) return;
  const policy = await tx.policy.findUnique({ where: { id: task.policyId } });
  if (!policy) return;
  const input = JSON.parse(task.inputJson) as TaskInput;
  const contract = await tx.engineSourceContract.findUnique({ where: { policyId: task.policyId } });
  if (policy.currentHash !== task.expectedBaselineHash || policyScopeHash(policy) !== input.scopeHash
    || (contract?.contractHash || null) !== input.contractHash || engineExtractionProfileHash(input.sourceUrl) !== input.profileHash) return;
  const won = await tx.policy.updateMany({ where: { id: policy.id, currentHash: task.expectedBaselineHash!, url: policy.url,
    retrievalUrl: policy.retrievalUrl, jurisdiction: policy.jurisdiction, type: policy.type }, data: { currentHash: policy.currentHash } });
  if (!won.count) return;
  const now = new Date(), nextDueAt = new Date(now.getTime() + DAILY_MS);
  await tx.enginePolicyState.upsert({ where: stateKey(task.policyId, input.mode), create: { policyId: task.policyId, mode: input.mode, lastAttemptAt: now, nextDueAt, reason },
    update: { lastAttemptAt: now, nextDueAt, reason } });
  const run = await tx.engineRun.findUniqueOrThrow({ where: { id: task.runId } });
  if (run.mode === 'publish') {
    await tx.policy.update({ where: { id: task.policyId }, data: { lastCheckDate: now, dataStatus: 'Needs Review' } });
    await tx.policyCheckLog.create({ data: { policyId: task.policyId, engineTaskId: task.id, status: 'Needs Review', reason, reasonCode: reason, checkedAt: now } });
  }
}
export async function failTask(lease: Lease, code: string, retryAfterMs = 0) {
  if (!/^[a-z0-9_:.-]{1,120}$/i.test(code)) code = 'engine_processing_error';
  const terminal = lease.attempt >= MAX_ATTEMPTS || ['engine_context_changed', 'channel_context_changed', 'public_old_snapshot_missing'].includes(code);
  const retryAt = new Date(Date.now() + Math.min(DAILY_MS, Math.max(60_000 * 2 ** lease.attempt, retryAfterMs)));
  await fenced(lease, async tx => {
    await tx.engineAttempt.updateMany({ where: { taskId: lease.id, generation: lease.totalAttempts, status: 'running' },
      data: { status: 'failed', reason: code, endedAt: new Date() } });
    if (terminal && !['engine_context_changed', 'channel_context_changed'].includes(code)) await terminalFailure(tx, lease, code);
    await transition(tx, lease, { status: terminal ? 'failed' : 'queued', lastError: code,
      nextAttemptAt: retryAt,
      completedAt: terminal ? new Date() : null, ...(terminal ? { activePolicyId: null } : {}), leaseToken: null, leaseExpiresAt: null });
    if (lease.kind === 'fetch') {
      await tx.engineOrigin.updateMany({ where: { leaseToken: lease.leaseToken }, data: { leaseToken: null, leaseExpiresAt: null,
        failures: { increment: 1 }, nextAllowedAt: retryAt } });
      if (terminal) await tx.engineTask.updateMany({ where: { dependencyId: lease.id, status: 'blocked' }, data: { status: 'queued' } });
    }
  });
}

export async function reconcileRun(runId: string) {
  const tasks = await db.engineTask.findMany({ where: { runId }, select: { kind: true, status: true } });
  const active = tasks.some(t => !['completed', 'failed', 'cancelled'].includes(t.status));
  if (!active) await db.engineRun.updateMany({ where: { id: runId, status: { in: ['queued', 'running'] } },
    data: { status: tasks.some(t => t.status === 'failed') ? 'completed_with_errors' : 'completed', completedAt: new Date() } });
  return { schema: ENGINE_SCHEMA, active, policyTasks: tasks.filter(t => t.kind === 'policy').length,
    completed: tasks.filter(t => t.kind === 'policy' && t.status === 'completed').length,
    failed: tasks.filter(t => t.kind === 'policy' && t.status === 'failed').length };
}

/** Cancel preserves artifacts/checkpoints and fences in-flight workers before releasing reservations. */
export async function cancelRun(id: string, note: string, actor: string) {
  if (note.trim().length < 20 || note.length > 2000) throw new Error('cancellation_note_required');
  return db.$transaction(async tx => {
    const run = await tx.engineRun.findUniqueOrThrow({ where: { id } });
    if (['completed', 'completed_with_errors', 'cancelled'].includes(run.status)) return { status: run.status };
    const tasks = await tx.engineTask.findMany({ where: { runId: id, status: { in: ['queued', 'blocked', 'running'] } }, select: { id: true, leaseToken: true } });
    const tokens = tasks.map(t => t.leaseToken).filter((t): t is string => Boolean(t));
    await tx.engineTask.updateMany({ where: { runId: id, status: { in: ['queued', 'blocked', 'running'] } },
      data: { status: 'cancelled', activePolicyId: null, leaseToken: null, leaseExpiresAt: null, completedAt: new Date(), lastError: 'run_cancelled' } });
    await tx.engineAttempt.updateMany({ where: { taskId: { in: tasks.map(t => t.id) }, status: 'running' }, data: { status: 'cancelled', reason: 'run_cancelled', endedAt: new Date() } });
    if (tokens.length) await tx.engineOrigin.updateMany({ where: { leaseToken: { in: tokens } }, data: { leaseToken: null, leaseExpiresAt: null, nextAllowedAt: new Date(Date.now() + 1500) } });
    await tx.engineRun.update({ where: { id }, data: { status: 'cancelled', completedAt: new Date() } });
    await tx.adminReviewLog.create({ data: { actorRole: actor, action: 'engine_run_cancelled', targetType: 'engine_run', targetId: id, note,
      metadataJson: JSON.stringify({ cancelledTasks: tasks.length }) } });
    return { status: 'cancelled' };
  });
}
