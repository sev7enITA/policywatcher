import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';

const guards = vi.hoisted(() => ({ context: vi.fn(), hash: vi.fn(() => 'a'.repeat(64)) }));
vi.mock('../hostedPreview', () => ({
  assertHostedPreviewContext: guards.context,
  isHostedPreview: () => process.env.POLICYWATCHER_HOSTED_PREVIEW === '1',
}));
vi.mock('../scanChannels', () => ({ channelImplementationHash: guards.hash }));
import { assertHostedWorkerLease, getHostedWorkerStatus, HOSTED_WORKER_LEASE_MS, HOSTED_WORKER_ORIGIN,
  startHostedPreviewWorker, stopHostedPreviewWorker } from '../engine/hostedWorker';

mkdirSync(resolve('output/engine-channels'), { recursive: true });
const directory = mkdtempSync(resolve('output/engine-channels/hosted-worker-test-'));
const url = `file:${join(directory, 'test.db')}`;
const database = new PrismaClient({ datasources: { db: { url } } });
vi.mock('../db', () => ({ db: database, databaseRuntimeConfiguration: Promise.resolve() }));
const singleton = Symbol.for('policywatcher.hosted-preview-worker.v1');
const globals = globalThis as unknown as Record<symbol, unknown>;
const idleMs = 10;
const renewMs = 20;
function deferred<T>() {
  let resolvePromise!: (value: T) => void;
  const promise = new Promise<T>(resolve => { resolvePromise = resolve; });
  return { promise, resolve: resolvePromise };
}
async function until(predicate: () => boolean | Promise<boolean>) {
  for (let index = 0; index < 300; index++) {
    if (await predicate()) return;
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  throw new Error('worker_test_timeout');
}
async function launch(step = vi.fn(async () => false)) {
  const load = vi.fn(async () => ({ database, step }));
  await startHostedPreviewWorker({ load, idleMs, renewMs });
  return { load, step };
}

beforeAll(() => {
  execFileSync(process.execPath, ['scripts/hostinger-init-db.mjs'], {
    env: { ...process.env, DATABASE_URL: url }, stdio: 'pipe',
  });
});
beforeEach(async () => {
  vi.stubEnv('DATABASE_URL', url);
  vi.stubEnv('POLICYWATCHER_HOSTED_PREVIEW', '1');
  vi.stubEnv('POLICYWATCHER_ENGINE_BUILD_PHASE', '0');
  vi.stubEnv('NEXT_PHASE', 'phase-production-server');
  guards.context.mockReset(); guards.hash.mockReset().mockReturnValue('a'.repeat(64));
  delete globals[singleton];
  await database.engineOrigin.deleteMany();
});
afterEach(async () => {
  await stopHostedPreviewWorker();
  delete globals[singleton];
  vi.unstubAllEnvs();
});
afterAll(async () => { await database.$disconnect(); rmSync(directory, { recursive: true, force: true }); });

describe('hosted preview worker bootstrap and durable ownership', () => {
  it('never imports the database or claims work during build or in stable deployments', async () => {
    const load = vi.fn(async () => ({ database, step: async () => true }));
    vi.stubEnv('POLICYWATCHER_ENGINE_BUILD_PHASE', '1');
    await startHostedPreviewWorker({ load });
    vi.stubEnv('POLICYWATCHER_ENGINE_BUILD_PHASE', '0'); vi.stubEnv('NEXT_PHASE', 'phase-production-build');
    await startHostedPreviewWorker({ load });
    vi.stubEnv('NEXT_PHASE', 'phase-production-server'); vi.stubEnv('POLICYWATCHER_HOSTED_PREVIEW', '0');
    await startHostedPreviewWorker({ load });
    expect(load).not.toHaveBeenCalled(); expect(guards.context).not.toHaveBeenCalled();
    expect(await database.engineOrigin.count()).toBe(0);
  });

  it('fails closed before database initialization and sanitizes bootstrap errors', async () => {
    guards.context.mockImplementation(() => { throw new Error('secret credential and /private/database/path'); });
    const load = vi.fn(async () => ({ database, step: async () => true }));
    await startHostedPreviewWorker({ load });
    expect(load).not.toHaveBeenCalled();
    const status = await getHostedWorkerStatus();
    expect(status.active).toBe(false);
    expect(status.local).toMatchObject({ phase: 'failed', lastError: 'hosted_worker_start_failed' });
    expect(JSON.stringify(status)).not.toMatch(/credential|private\/database/);
  });

  it('rejects a missing build identity before database loading', async () => {
    guards.hash.mockReturnValue('');
    const load = vi.fn(async () => ({ database, step: async () => true }));
    await startHostedPreviewWorker({ load });
    expect(load).not.toHaveBeenCalled();
    expect((await getHostedWorkerStatus()).local).toMatchObject({ phase: 'failed', lastError: 'hosted_worker_implementation_changed' });
    expect(await database.engineOrigin.count()).toBe(0);
  });

  it('returns promptly while initialization is pending and creates one loop per process', async () => {
    const gate = deferred<{ database: PrismaClient; step: () => Promise<boolean> }>();
    const load = vi.fn(() => gate.promise);
    const first = startHostedPreviewWorker({ load, idleMs, renewMs });
    await first;
    await startHostedPreviewWorker({ load, idleMs, renewMs });
    expect(load).toHaveBeenCalledTimes(1);
    expect((await getHostedWorkerStatus()).local?.phase).toBe('starting');
    gate.resolve({ database, step: async () => false });
    await until(async () => (await getHostedWorkerStatus()).active);
  });

  it('waits behind a live durable leader, takes over only after expiry and releases its own lease', async () => {
    const peer = '00000000-0000-4000-a000-000000000001';
    await database.engineOrigin.create({ data: { origin: HOSTED_WORKER_ORIGIN, leaseToken: peer,
      leaseExpiresAt: new Date(Date.now() + 60_000), nextAllowedAt: new Date(0) } });
    const { step } = await launch();
    await until(async () => (await getHostedWorkerStatus()).local?.phase === 'standby');
    expect(step).not.toHaveBeenCalled();
    await database.engineOrigin.update({ where: { origin: HOSTED_WORKER_ORIGIN }, data: { leaseExpiresAt: new Date(0) } });
    await until(() => step.mock.calls.length > 0);
    const status = await getHostedWorkerStatus();
    expect(status.active).toBe(true); expect(status.leader?.instanceId).not.toBe(peer);
    expect(status.leader?.implementationHash).toBe('a'.repeat(64));
    await stopHostedPreviewWorker();
    expect((await database.engineOrigin.findUniqueOrThrow({ where: { origin: HOSTED_WORKER_ORIGIN } })).leaseToken).toBeNull();
    expect((await getHostedWorkerStatus()).leader?.phase).toBe('stopped');
    // Shared DB client remains usable after shutdown.
    expect(await database.engineOrigin.count()).toBe(2);
  });

  it('renews ownership while a step is running and fences an old owner after replacement', async () => {
    const gate = deferred<boolean>();
    const step = vi.fn(() => gate.promise);
    await launch(step);
    await until(() => step.mock.calls.length === 1);
    await database.engineOrigin.update({ where: { origin: HOSTED_WORKER_ORIGIN }, data: { leaseExpiresAt: new Date(Date.now() + 200) } });
    await until(async () => (await database.engineOrigin.findUniqueOrThrow({ where: { origin: HOSTED_WORKER_ORIGIN } })).leaseExpiresAt!.getTime() > Date.now() + HOSTED_WORKER_LEASE_MS / 2);
    await database.$transaction(tx => assertHostedWorkerLease(tx));
    const peer = '00000000-0000-4000-a000-000000000002';
    await database.engineOrigin.update({ where: { origin: HOSTED_WORKER_ORIGIN }, data: { leaseToken: peer, leaseExpiresAt: new Date(Date.now() + 60_000) } });
    await expect(database.$transaction(tx => assertHostedWorkerLease(tx))).rejects.toThrow('hosted_worker_lease_lost');
    await until(async () => (await getHostedWorkerStatus()).local?.phase === 'failed');
    gate.resolve(true);
    await stopHostedPreviewWorker();
    expect(step).toHaveBeenCalledTimes(1);
    expect((await database.engineOrigin.findUniqueOrThrow({ where: { origin: HOSTED_WORKER_ORIGIN } })).leaseToken).toBe(peer);
  });

  it('stops new claims on configuration or implementation change', async () => {
    const { step } = await launch();
    await until(() => step.mock.calls.length > 0);
    guards.hash.mockReturnValue('b'.repeat(64));
    await until(async () => (await getHostedWorkerStatus()).local?.phase === 'failed');
    const claims = step.mock.calls.length;
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(step).toHaveBeenCalledTimes(claims);
    expect((await getHostedWorkerStatus()).local?.lastError).toBe('hosted_worker_implementation_changed');
  });

  it('recovers one transient renewal transaction failure without restarting or reclaiming leadership', async () => {
    const gate = deferred<boolean>();
    const step = vi.fn(() => gate.promise);
    await launch(step);
    await until(() => step.mock.calls.length === 1);
    const prior = await database.engineOrigin.findUniqueOrThrow({ where: { origin: HOSTED_WORKER_ORIGIN } });
    await database.engineOrigin.update({ where: { origin: HOSTED_WORKER_ORIGIN }, data: { leaseExpiresAt: new Date(Date.now() + 10_000) } });
    // The step remains pending, so the timer is the only transaction caller.
    const transaction = vi.spyOn(database, '$transaction').mockRejectedValueOnce(new Error('SQLITE_BUSY: temporary database lock'));
    try {
      await until(() => transaction.mock.calls.length >= 2);
      await until(async () => (await database.engineOrigin.findUniqueOrThrow({ where: { origin: HOSTED_WORKER_ORIGIN } })).leaseExpiresAt!.getTime() > Date.now() + HOSTED_WORKER_LEASE_MS / 2);
      const status = await getHostedWorkerStatus();
      expect(status.active).toBe(true); expect(status.local?.phase).toBe('active');
      expect(status.leader?.instanceId).toBe(prior.leaseToken);
      expect(status.local?.lastError).toBeNull(); expect(step).toHaveBeenCalledTimes(1);
    } finally { transaction.mockRestore(); gate.resolve(false); await stopHostedPreviewWorker(); }
  });

  it('stops after three failed renewal attempts and does not run another task', async () => {
    const gate = deferred<boolean>();
    const step = vi.fn(() => gate.promise);
    await launch(step);
    await until(() => step.mock.calls.length === 1);
    const transaction = vi.spyOn(database, '$transaction').mockRejectedValue(new Error('SQLITE_BUSY: persistent database lock'));
    try {
      await until(async () => (await getHostedWorkerStatus()).local?.phase === 'failed');
      expect(transaction).toHaveBeenCalledTimes(3);
      const status = await getHostedWorkerStatus();
      expect(status.local?.lastError).toBe('hosted_worker_renewal_failed');
      expect(status.active).toBe(false); // The last durable heartbeat can still say active while this step drains.
      expect(step).toHaveBeenCalledTimes(1);
    } finally { transaction.mockRestore(); gate.resolve(false); await stopHostedPreviewWorker(); }
  });

  it('does not retry a reported lease loss even when a step is still pending', async () => {
    const gate = deferred<boolean>();
    const step = vi.fn(() => gate.promise);
    await launch(step);
    await until(() => step.mock.calls.length === 1);
    const transaction = vi.spyOn(database, '$transaction').mockRejectedValueOnce(new Error('hosted_worker_lease_lost'));
    try {
      await until(async () => (await getHostedWorkerStatus()).local?.phase === 'failed');
      expect(transaction).toHaveBeenCalledTimes(1);
      expect((await getHostedWorkerStatus()).local?.lastError).toBe('hosted_worker_lease_lost');
    } finally { transaction.mockRestore(); gate.resolve(false); await stopHostedPreviewWorker(); }
  });

  it('never revives a lease that expires between a transient failure and its retry', async () => {
    const gate = deferred<boolean>();
    const step = vi.fn(() => gate.promise);
    await launch(step);
    await until(() => step.mock.calls.length === 1);
    const transaction = vi.spyOn(database, '$transaction').mockRejectedValueOnce(new Error('SQLITE_BUSY: transient lock before lease expiry'));
    try {
      await until(() => transaction.mock.calls.length === 1);
      await database.engineOrigin.update({ where: { origin: HOSTED_WORKER_ORIGIN }, data: { leaseExpiresAt: new Date(0) } });
      await until(async () => (await getHostedWorkerStatus()).local?.phase === 'failed');
      expect(transaction).toHaveBeenCalledTimes(2);
      expect((await getHostedWorkerStatus()).local?.lastError).toBe('hosted_worker_lease_lost');
      const lease = await database.engineOrigin.findUniqueOrThrow({ where: { origin: HOSTED_WORKER_ORIGIN } });
      expect(lease.leaseExpiresAt?.getTime()).toBe(0);
      expect(step).toHaveBeenCalledTimes(1);
    } finally { transaction.mockRestore(); gate.resolve(false); await stopHostedPreviewWorker(); }
  });

  it('supervises repeated infrastructure errors and retains only a bounded failure code', async () => {
    const step = vi.fn(async () => { throw new Error('sqlite failed with token=do-not-expose'); });
    await startHostedPreviewWorker({ load: async () => ({ database, step }), idleMs: 1, renewMs: 5 });
    await until(async () => (await getHostedWorkerStatus()).local?.phase === 'failed');
    expect(step).toHaveBeenCalledTimes(5);
    const status = await getHostedWorkerStatus();
    expect(status.active).toBe(false);
    expect(status.local?.lastError).toBe('hosted_worker_step_failed');
    expect(JSON.stringify(status)).not.toContain('do-not-expose');
  });

  it('stops on termination without clearing another process lease or disconnecting HTTP storage', async () => {
    const { step } = await launch();
    await until(() => step.mock.calls.length > 0);
    process.emit('SIGTERM');
    await until(async () => (await getHostedWorkerStatus()).local?.phase === 'stopped');
    const count = step.mock.calls.length;
    await new Promise(resolve => setTimeout(resolve, 30));
    expect(step).toHaveBeenCalledTimes(count);
    expect(await database.engineOrigin.count()).toBe(2);
  });

  it('returns only the declared fields from persisted status and rejects unknown error text', async () => {
    const { step } = await launch();
    await until(() => step.mock.calls.length > 0);
    await stopHostedPreviewWorker();
    const origin = 'policywatcher-internal:hosted-preview-worker-status';
    const row = await database.engineOrigin.findUniqueOrThrow({ where: { origin } });
    const snapshot = JSON.parse(row.leaseToken!);
    await database.engineOrigin.update({ where: { origin }, data: { leaseToken: JSON.stringify({ ...snapshot, unexpectedSecret: 'never return this' }) } });
    expect(JSON.stringify(await getHostedWorkerStatus())).not.toContain('never return this');
    await database.engineOrigin.update({ where: { origin }, data: { leaseToken: JSON.stringify({ ...snapshot, lastError: 'credential-sensitive-detail' }) } });
    const status = await getHostedWorkerStatus();
    expect(status.leader).toBeNull(); expect(JSON.stringify(status)).not.toContain('credential-sensitive-detail');
  });
});
