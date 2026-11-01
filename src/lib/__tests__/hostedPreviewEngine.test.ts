import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PrismaClient } from '@prisma/client';

const project = process.cwd();
const root = realpathSync(mkdtempSync(join(tmpdir(), 'pw-hosted-engine-')));
const file = join(root, 'output/engine-channels/hosted-preview/preview.db');
const url = `file:${file}`;
const database = new PrismaClient({ datasources: { db: { url } } });
const assertLeader = vi.fn(async () => undefined);
let store: typeof import('../engine/store');
let pipeline: typeof import('../engine/pipeline');
let channels: typeof import('../scanChannels');
const input = { mode: 'observe', sourceUrl: 'https://example.com/privacy', origin: 'https://example.com',
  scopeHash: 'scope', profileHash: 'profile', baselineHash: '', contractHash: null, contract: null, forceFresh: true };

beforeAll(async () => {
  mkdirSync(join(root, 'output/engine-channels/hosted-preview'), { recursive: true });
  execFileSync(process.execPath, [join(project, 'scripts/hostinger-init-db.mjs')], { cwd: project, env: { ...process.env, DATABASE_URL: url }, stdio: 'pipe' });
  vi.spyOn(process, 'cwd').mockReturnValue(root);
  vi.doMock('../db', () => ({ db: database }));
  // Leadership itself has separate worker integration coverage. These cases
  // exercise real SQLite task fencing and the actual hosted/source guards.
  vi.doMock('../engine/hostedWorker', () => ({ assertHostedWorkerLease: assertLeader }));
  channels = await import('../scanChannels');
  store = await import('../engine/store');
  pipeline = await import('../engine/pipeline');
});
beforeEach(async () => {
  for (const [name, value] of Object.entries({ NODE_ENV: 'production', POLICYWATCHER_HOSTED_PREVIEW: '1',
    POLICYWATCHER_DEPLOYMENT_TARGET: 'staging', APP_URL: 'https://staging.policywatcher.online',
    NEXT_PUBLIC_APP_URL: 'https://staging.policywatcher.online', DATABASE_URL: url,
    POLICYWATCHER_ENGINE_V6: '1', POLICYWATCHER_ENGINE_CHANNELS: '1', POLICYWATCHER_ENGINE_PUBLICATION: '0',
    POLICYWATCHER_ENGINE_NOTIFICATIONS: '0', POLICYWATCHER_SCANS_PAUSED: '0',
    POLICYWATCHER_ENGINE_ANALYST_MODEL: '', POLICYWATCHER_ENGINE_VERIFIER_MODEL: '' })) vi.stubEnv(name, value);
  assertLeader.mockReset().mockResolvedValue(undefined);
  await database.engineRun.deleteMany(); await database.engineOrigin.deleteMany(); await database.engineAttempt.deleteMany();
});
afterAll(async () => { await database.$disconnect(); vi.restoreAllMocks(); vi.unstubAllEnvs(); rmSync(root, { recursive: true, force: true }); });

async function task(metadata: string | null, overrides: { notificationMode?: string; inputMode?: string; stage?: string; kind?: string } = {}) {
  const run = await database.engineRun.create({ data: { requestKey: crypto.randomUUID(), requestedBy: 'isolated-test', mode: 'observe',
    notificationMode: overrides.notificationMode || 'silent', channelMetadataJson: metadata, selected: 1 } });
  return database.engineTask.create({ data: { runId: run.id, key: crypto.randomUUID(), kind: overrides.kind || 'fetch',
    stage: overrides.stage || 'acquire', inputJson: JSON.stringify({ ...input, mode: overrides.inputMode || 'observe' }) } });
}
function metadata() { return channels.channelMetadata({ channel: 'preview', limit: 1 }); }

describe('hosted preview central execution constraints', () => {
  it('uses bundled identity without a source checkout and defaults to preview only', () => {
    expect(channels.channelImplementationHash()).toMatch(/^[a-f0-9]{64}$/);
    expect(channels.scanChannelCapabilities()).toMatchObject({ defaultChannel: 'preview', stable: false, preview: true, compare: true });
    expect(channels.parseChannelRequest({})).toMatchObject({ channel: 'preview' });
  });
  it('blocks generic, oversized, publishing and notifying enqueue routes before database writes', async () => {
    const base = { requestKey: 'hosted-test-valid', requestedBy: 'test', mode: 'observe' as const, notificationMode: 'silent' as const, limit: 1 };
    await expect(store.enqueueRun(base)).rejects.toThrow('experimental_channel_unavailable');
    await expect(store.enqueueRun({ ...base, channel: 'preview', limit: 51 })).rejects.toThrow('experimental_channel_unavailable');
    await expect(store.enqueueRun({ ...base, channel: 'preview', mode: 'publish' })).rejects.toThrow('experimental_channel_unavailable');
    await expect(store.enqueueRun({ ...base, channel: 'preview', notificationMode: 'subscribers' })).rejects.toThrow('experimental_channel_unavailable');
    expect(await database.engineRun.count()).toBe(0);
    const allowed = await store.enqueueRun({ ...base, channel: 'preview' });
    expect(allowed).toMatchObject({ mode: 'observe', notificationMode: 'silent' });
    expect(JSON.parse(allowed.channelMetadataJson!)).toMatchObject({ implementationHash: channels.channelImplementationHash(), channel: 'preview' });
  });
  it.each(['missing', 'malformed', 'identity', 'fingerprint', 'model', 'notifications', 'input-mode', 'analysis-stage'])('rejects %s queued context before acquisition or model work', async variant => {
    const frozen = metadata();
    if (variant === 'identity') frozen.implementationHash = 'f'.repeat(64);
    if (variant === 'fingerprint') frozen.requestFingerprint = 'f'.repeat(64);
    if (variant === 'model') frozen.requestedModels.analyst = 'changed-model';
    const row = await task(variant === 'missing' ? null : variant === 'malformed' ? '{broken' : JSON.stringify(frozen), {
      ...(variant === 'notifications' ? { notificationMode: 'subscribers' } : {}),
      ...(variant === 'input-mode' ? { inputMode: 'publish' } : {}),
      ...(variant === 'analysis-stage' ? { stage: 'analyze', kind: 'policy' } : {}),
    });
    if (variant === 'analysis-stage') await database.engineRun.update({ where: { id: row.runId }, data: { channelMetadataJson: null } });
    const acquire = vi.fn(async () => { throw new Error('unexpected_acquisition'); });
    const model = vi.fn(async () => { throw new Error('unexpected_model'); });
    await pipeline.workerStep({ acquire, analysis: { analyze: model, verify: model } });
    expect(acquire).not.toHaveBeenCalled(); expect(model).not.toHaveBeenCalled();
    expect(await database.engineTask.findUniqueOrThrow({ where: { id: row.id } })).toMatchObject({ status: 'failed', lastError: 'channel_context_changed' });
    expect(await database.policyChange.count()).toBe(0); expect(await database.engineOutbox.count()).toBe(0);
  });
  it('allows no second task while any unexpired task is running, even on a different origin', async () => {
    const active = await task(JSON.stringify(metadata()));
    await database.engineTask.update({ where: { id: active.id }, data: { status: 'running', leaseToken: 'existing-task', leaseExpiresAt: new Date(Date.now() + 60_000) } });
    const queued = await task(JSON.stringify(metadata()));
    await database.engineTask.update({ where: { id: queued.id }, data: { inputJson: JSON.stringify({ ...input, origin: 'https://other.example' }) } });
    expect(await store.claimTask()).toBeNull();
    expect(await database.engineTask.findUniqueOrThrow({ where: { id: queued.id } })).toMatchObject({ status: 'queued', attempt: 0 });
  });
  it('requires a live worker leader before task recovery or claim', async () => {
    await task(JSON.stringify(metadata())); assertLeader.mockRejectedValue(new Error('hosted_worker_lease_lost'));
    await expect(store.claimTask()).rejects.toThrow('hosted_worker_lease_lost');
    expect(await database.engineTask.count({ where: { status: 'running' } })).toBe(0);
  });
  it('fences effects when worker leadership is lost after claiming a task', async () => {
    await task(JSON.stringify(metadata()));
    const lease = await store.claimTask(); expect(lease).not.toBeNull();
    assertLeader.mockRejectedValue(new Error('hosted_worker_lease_lost'));
    const work = vi.fn(async () => 'must-not-run');
    await expect(store.fenced(lease!, work)).rejects.toThrow('hosted_worker_lease_lost');
    expect(work).not.toHaveBeenCalled();
  });
  it('processes a valid private acquisition task without official policy or notification writes', async () => {
    const row = await task(JSON.stringify(metadata()));
    const acquire = vi.fn(async () => ({ artifactId: null, observedAt: new Date().toISOString(), source: 'none', httpStatus: 0,
      finalUrl: input.sourceUrl, notModified: false, eligible: false, reasons: ['source_contract_missing'], diagnostics: [] }));
    const model = vi.fn(async () => { throw new Error('unexpected_model'); });
    await pipeline.workerStep({ acquire, analysis: { analyze: model, verify: model } });
    expect(acquire).toHaveBeenCalledTimes(1); expect(model).not.toHaveBeenCalled();
    expect(await database.engineTask.findUniqueOrThrow({ where: { id: row.id } })).toMatchObject({ status: 'completed' });
    expect(await database.policy.count()).toBe(0); expect(await database.policySnapshot.count()).toBe(0);
    expect(await database.policyChange.count()).toBe(0); expect(await database.engineOutbox.count()).toBe(0);
  });
});
