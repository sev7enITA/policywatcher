import { randomUUID } from 'node:crypto';
import type { Prisma, PrismaClient } from '@prisma/client';
import { assertHostedPreviewContext, isHostedPreview } from '../hostedPreview';
import { channelImplementationHash } from '../scanChannels';

// These reserved rows cannot collide with a policy's HTTP(S) origin. They use
// the existing durable lease table, without changing the frozen acquisition schema.
export const HOSTED_WORKER_ORIGIN = 'policywatcher-internal:hosted-preview-worker';
const STATUS_ORIGIN = 'policywatcher-internal:hosted-preview-worker-status';
export const HOSTED_WORKER_LEASE_MS = 90_000;
const RENEW_MS = 10_000;
const RENEW_RETRY_DELAYS_MS = [250, 1_000] as const;
const IDLE_MS = 2_000;
const SINGLETON = Symbol.for('policywatcher.hosted-preview-worker.v1');
const ERROR_CODES = new Set(['hosted_preview_context_invalid', 'hosted_worker_implementation_changed',
  'hosted_worker_lease_lost', 'hosted_worker_renewal_failed', 'hosted_worker_step_failed',
  'hosted_worker_start_failed', 'hosted_worker_status_unavailable']);

type Phase = 'starting' | 'standby' | 'active' | 'stopping' | 'stopped' | 'failed';
export interface HostedWorkerSnapshot {
  schema: 'pw-hosted-worker-1';
  instanceId: string;
  implementationHash: string;
  phase: Phase;
  startedAt: string;
  lastHeartbeatAt: string | null;
  lastSuccessfulStepAt: string | null;
  lastError: string | null;
  completedSteps: number;
}
interface Dependencies {
  assertContext(): void;
  implementationHash(): string | null;
  load(): Promise<{ database: PrismaClient; step(): Promise<boolean> }>;
  idleMs: number;
  renewMs: number;
}
interface Runtime {
  snapshot: HostedWorkerSnapshot;
  dependencies: Dependencies;
  database?: PrismaClient;
  leader: boolean;
  stopping: boolean;
  signal: () => void;
  wake?: () => void;
  timer?: ReturnType<typeof setInterval>;
  renewal?: Promise<void>;
  done: Promise<void>;
}
const globals = globalThis as unknown as Record<symbol, Runtime | undefined>;
const defaults: Dependencies = {
  assertContext: assertHostedPreviewContext,
  implementationHash: channelImplementationHash,
  async load() {
    // The caller validates the deployment and real DB path before this import.
    const { db, databaseRuntimeConfiguration } = await import('../db');
    await databaseRuntimeConfiguration;
    const { workerStep } = await import('./pipeline');
    return { database: db, step: () => workerStep() };
  },
  idleMs: IDLE_MS,
  renewMs: RENEW_MS,
};

function validate(runtime: Runtime) {
  runtime.dependencies.assertContext();
  if (runtime.dependencies.implementationHash() !== runtime.snapshot.implementationHash) {
    throw new Error('hosted_worker_implementation_changed');
  }
}
function safeError(error: unknown, fallback: string): string {
  const message = error instanceof Error ? error.message : '';
  return ERROR_CODES.has(message) ? message : fallback;
}
function stop(runtime: Runtime, error?: string) {
  runtime.stopping = true;
  if (error) runtime.snapshot.lastError = error;
  runtime.snapshot.phase = error ? 'failed' : 'stopping';
  runtime.wake?.();
}
function idle(runtime: Runtime, milliseconds: number) {
  return new Promise<void>(resolve => {
    const timer = setTimeout(finish, milliseconds);
    timer.unref?.();
    function finish() { clearTimeout(timer); runtime.wake = undefined; resolve(); }
    runtime.wake = finish;
    if (runtime.stopping) finish();
  });
}

/** Called inside the same transaction as a hosted task claim or commit.
 * Its UPDATE takes the durable leader-row lock and fences an old process.
 */
export async function assertHostedWorkerLease(tx: Pick<Prisma.TransactionClient, 'engineOrigin'>): Promise<void> {
  const runtime = globals[SINGLETON];
  if (!runtime || !runtime.leader || runtime.stopping) throw new Error('hosted_worker_lease_lost');
  validate(runtime);
  const now = new Date();
  const updated = await tx.engineOrigin.updateMany({
    where: { origin: HOSTED_WORKER_ORIGIN, leaseToken: runtime.snapshot.instanceId, leaseExpiresAt: { gt: now } },
    data: { leaseExpiresAt: new Date(now.getTime() + HOSTED_WORKER_LEASE_MS) },
  });
  if (updated.count !== 1) throw new Error('hosted_worker_lease_lost');
}

async function acquireLeadership(runtime: Runtime): Promise<boolean> {
  const database = runtime.database!;
  return database.$transaction(async tx => {
    const now = new Date();
    await tx.engineOrigin.upsert({ where: { origin: HOSTED_WORKER_ORIGIN },
      create: { origin: HOSTED_WORKER_ORIGIN, nextAllowedAt: new Date(0) }, update: {} });
    const updated = await tx.engineOrigin.updateMany({
      where: { origin: HOSTED_WORKER_ORIGIN, OR: [{ leaseToken: null }, { leaseExpiresAt: { lte: now } }] },
      data: { leaseToken: runtime.snapshot.instanceId, leaseExpiresAt: new Date(now.getTime() + HOSTED_WORKER_LEASE_MS) },
    });
    return updated.count === 1;
  }, { timeout: 10_000 });
}

async function saveStatus(runtime: Runtime, renew: boolean) {
  await runtime.database!.$transaction(async tx => {
    const now = new Date();
    const updated = await tx.engineOrigin.updateMany({
      where: { origin: HOSTED_WORKER_ORIGIN, leaseToken: runtime.snapshot.instanceId, leaseExpiresAt: { gt: now } },
      data: { ...(renew ? { leaseExpiresAt: new Date(now.getTime() + HOSTED_WORKER_LEASE_MS) } : {}),
        failures: runtime.snapshot.lastError ? 1 : 0 },
    });
    if (updated.count !== 1) throw new Error('hosted_worker_lease_lost');
    runtime.snapshot.lastHeartbeatAt = now.toISOString();
    const leaseToken = JSON.stringify(runtime.snapshot);
    await tx.engineOrigin.upsert({ where: { origin: STATUS_ORIGIN },
      create: { origin: STATUS_ORIGIN, leaseToken, nextAllowedAt: new Date(0) }, update: { leaseToken } });
  }, { timeout: 10_000 });
}

function startRenewal(runtime: Runtime) {
  runtime.timer = setInterval(() => {
    if (runtime.renewal || runtime.stopping) return;
    runtime.renewal = (async () => {
      try {
        for (let attempt = 0; !runtime.stopping; attempt++) {
          try {
            // Retry only an interrupted infrastructure operation. A changed
            // context or lost/expired token always stops without another try.
            validate(runtime);
            await saveStatus(runtime, true);
            return;
          } catch (error) {
            const knownFailure = error instanceof Error && ERROR_CODES.has(error.message);
            if (knownFailure || attempt >= RENEW_RETRY_DELAYS_MS.length) {
              stop(runtime, safeError(error, 'hosted_worker_renewal_failed'));
              return;
            }
            await new Promise<void>(resolve => {
              const timer = setTimeout(resolve, RENEW_RETRY_DELAYS_MS[attempt]);
              timer.unref?.();
            });
          }
        }
      }
      finally { runtime.renewal = undefined; }
    })();
  }, runtime.dependencies.renewMs);
  runtime.timer.unref?.();
}

async function run(runtime: Runtime) {
  let failures = 0;
  try {
    validate(runtime);
    const loaded = await runtime.dependencies.load();
    runtime.database = loaded.database;
    validate(runtime);
    while (!runtime.stopping) {
      try {
        validate(runtime);
        if (!runtime.leader) {
          runtime.leader = await acquireLeadership(runtime);
          runtime.snapshot.phase = runtime.leader ? 'active' : 'standby';
          if (!runtime.leader) { await idle(runtime, runtime.dependencies.idleMs); continue; }
          await saveStatus(runtime, true);
          startRenewal(runtime);
        }
        // claimTask independently fences leadership and permits only one live
        // hosted task across processes. This precheck alone is not a lock.
        validate(runtime);
        const worked = await loaded.step();
        if (runtime.stopping) break;
        if (worked) {
          runtime.snapshot.completedSteps++;
          runtime.snapshot.lastSuccessfulStepAt = new Date().toISOString();
        }
        failures = 0;
        runtime.snapshot.lastError = null;
        await saveStatus(runtime, true);
        if (!worked) await idle(runtime, runtime.dependencies.idleMs);
      } catch (error) {
        const code = safeError(error, 'hosted_worker_step_failed');
        runtime.snapshot.lastError = code;
        if (code !== 'hosted_worker_step_failed' || ++failures >= 5) { stop(runtime, code); break; }
        await idle(runtime, Math.min(30_000, runtime.dependencies.idleMs * 2 ** failures));
      }
    }
  } catch (error) {
    stop(runtime, safeError(error, 'hosted_worker_start_failed'));
  } finally {
    if (runtime.timer) clearInterval(runtime.timer);
    await runtime.renewal;
    runtime.snapshot.phase = runtime.snapshot.lastError ? 'failed' : 'stopped';
    if (runtime.database && runtime.leader) {
      try { await saveStatus(runtime, false); } catch { /* Never overwrite a newer leader's status. */ }
      try {
        await runtime.database.engineOrigin.updateMany({ where: { origin: HOSTED_WORKER_ORIGIN,
          leaseToken: runtime.snapshot.instanceId }, data: { leaseToken: null, leaseExpiresAt: null } });
      } catch { /* A failed process relinquishes ownership through lease expiry. */ }
    }
    runtime.leader = false;
    process.removeListener('SIGTERM', runtime.signal);
    process.removeListener('SIGINT', runtime.signal);
    // Do not disconnect the Prisma client shared with HTTP handlers.
  }
}

/** Starts a supervised loop and returns immediately; server readiness never
 * waits for a scan. Overrides are for isolated lifecycle/lease tests only.
 */
export async function startHostedPreviewWorker(overrides: Partial<Dependencies> = {}): Promise<void> {
  if (!isHostedPreview() || process.env.NEXT_PHASE === 'phase-production-build'
      || process.env.POLICYWATCHER_ENGINE_BUILD_PHASE === '1' || globals[SINGLETON]) return;
  const dependencies = { ...defaults, ...overrides };
  const runtime: Runtime = {
    snapshot: { schema: 'pw-hosted-worker-1', instanceId: randomUUID(), implementationHash: '', phase: 'starting',
      startedAt: new Date().toISOString(), lastHeartbeatAt: null, lastSuccessfulStepAt: null, lastError: null, completedSteps: 0 },
    dependencies, leader: false, stopping: false, signal: () => {}, done: Promise.resolve(),
  };
  globals[SINGLETON] = runtime;
  runtime.signal = () => stop(runtime);
  try {
    dependencies.assertContext();
    const implementationHash = dependencies.implementationHash();
    if (!implementationHash || !/^[a-f0-9]{64}$/.test(implementationHash)) throw new Error('hosted_worker_implementation_changed');
    runtime.snapshot.implementationHash = implementationHash;
    process.on('SIGTERM', runtime.signal);
    process.on('SIGINT', runtime.signal);
    runtime.done = run(runtime);
  } catch (error) {
    stop(runtime, safeError(error, 'hosted_worker_start_failed'));
  }
}

/** Primarily useful for controlled shutdown and isolated tests. */
export async function stopHostedPreviewWorker(): Promise<void> {
  const runtime = globals[SINGLETON];
  if (!runtime) return;
  stop(runtime);
  await runtime.done;
}

function parseSnapshot(text: string): HostedWorkerSnapshot | null {
  const value = JSON.parse(text) as HostedWorkerSnapshot;
  const date = (input: unknown) => typeof input === 'string' && input.length <= 30 && Number.isFinite(Date.parse(input));
  if (value.schema !== 'pw-hosted-worker-1' || !/^[a-f0-9]{64}$/.test(value.implementationHash)
      || !/^[a-f0-9-]{36}$/.test(value.instanceId) || !date(value.startedAt)
      || !['starting', 'standby', 'active', 'stopping', 'stopped', 'failed'].includes(value.phase)
      || (value.lastHeartbeatAt !== null && !date(value.lastHeartbeatAt))
      || (value.lastSuccessfulStepAt !== null && !date(value.lastSuccessfulStepAt))
      || (value.lastError !== null && !ERROR_CODES.has(value.lastError))
      || !Number.isSafeInteger(value.completedSteps) || value.completedSteps < 0) return null;
  // Explicit selection prevents unexpected persisted properties reaching HTTP.
  return { schema: value.schema, instanceId: value.instanceId, implementationHash: value.implementationHash,
    phase: value.phase, startedAt: value.startedAt, lastHeartbeatAt: value.lastHeartbeatAt,
    lastSuccessfulStepAt: value.lastSuccessfulStepAt, lastError: value.lastError, completedSteps: value.completedSteps };
}

/** Private API only. No URLs, secrets, stack traces or raw exceptions appear. */
export async function getHostedWorkerStatus() {
  const runtime = globals[SINGLETON];
  const local = runtime ? { ...runtime.snapshot } : null;
  if (!isHostedPreview()) return { enabled: false, active: false, local, leader: null, oldestQueuedAt: null };
  try {
    assertHostedPreviewContext();
    const implementationHash = channelImplementationHash();
    if (!implementationHash) throw new Error('hosted_worker_implementation_changed');
    const database = runtime?.database || (await import('../db')).db;
    const [lease, row, oldest] = await Promise.all([
      database.engineOrigin.findUnique({ where: { origin: HOSTED_WORKER_ORIGIN } }),
      database.engineOrigin.findUnique({ where: { origin: STATUS_ORIGIN } }),
      database.engineTask.findFirst({ where: { status: { in: ['queued', 'blocked'] } }, orderBy: { createdAt: 'asc' }, select: { createdAt: true } }),
    ]);
    let leader: HostedWorkerSnapshot | null = null;
    if (row?.leaseToken) leader = parseSnapshot(row.leaseToken);
    const active = Boolean(lease?.leaseToken && lease.leaseExpiresAt && lease.leaseExpiresAt > new Date()
      && leader?.instanceId === lease.leaseToken && leader.phase === 'active' && leader.implementationHash === implementationHash
      && (local?.instanceId !== lease.leaseToken || local.phase === 'active'));
    return { enabled: true, active, implementationHash, local, leader,
      leaseExpiresAt: lease?.leaseExpiresAt?.toISOString() || null, oldestQueuedAt: oldest?.createdAt.toISOString() || null };
  } catch (error) {
    return { enabled: true, active: false, local, leader: null, oldestQueuedAt: null,
      error: safeError(error, 'hosted_worker_status_unavailable') };
  }
}
