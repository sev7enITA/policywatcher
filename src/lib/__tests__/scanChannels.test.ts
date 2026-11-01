import { beforeAll, beforeEach, afterAll, describe, it, expect, vi } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import { NextRequest } from 'next/server';
import { parseChannelRequest, experimentalChannelsAvailable, channelImplementationHash } from '../scanChannels';
import { digest, type SourceContract } from '../engine/document';
import type { CaptureBody } from '../engine/acquisition';

mkdirSync(resolve('output/engine-channels'), { recursive: true });
const dir = mkdtempSync(resolve('output/engine-channels/test-'));
const url = `file:${join(dir, 'test.db')}`;
const database = new PrismaClient({ datasources: { db: { url } } });
let role = 'admin';
let api: typeof import('../../app/api/admin/cron-status/route');
let store: typeof import('../engine/store');
let pipeline: typeof import('../engine/pipeline');
let acquisition: typeof import('../engine/acquisition');
let comparison: typeof import('../engine/comparison');
const source = 'https://example.com/privacy';
const paragraph = 'We collect account information to provide our services. We retain your records for thirty days and explain the rights available to all customers. ';
const terminal = 'Contact our privacy team for questions about this policy.';
const html = `<html lang="en"><main><h1>Privacy Policy</h1><h2>Data use</h2><p>${paragraph.repeat(12)}</p><button aria-controls="detail" aria-expanded="false">More information</button><section id="detail" aria-hidden="true"><p>We never sell medical records.</p></section><h2>Contact</h2><p>${terminal}</p></main></html>`;
const contract: SourceContract = { schemaVersion: 1, sourceUrl: source, titleAliases: ['Privacy Policy'], requiredHeadings: ['Data use', 'Contact'], terminalText: terminal, language: 'en', minimumChars: 100, maximumChars: 500000, preferredTransport: 'direct', reviewedAt: '2026-11-01T00:00:00.000Z', reviewNote: 'Reviewed the entire synthetic source for isolated channel tests.' };
const request = (body: Record<string, unknown>) => new NextRequest('http://localhost:3013/api/admin/cron-status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const get = (suffix = '') => new NextRequest(`http://localhost:3013/api/admin/cron-status${suffix}`);
async function seed(slug = 'fixture') {
  const body = acquisition.extractEngineBody(html, source, undefined, contract);
  const company = await database.company.create({ data: { name: `Channel test ${slug}`, slug, website: 'https://example.com', industry: 'Technology' } });
  const policy = await database.policy.create({ data: { companyId: company.id, name: 'Synthetic privacy policy', type: 'privacy', url: source, currentText: body.document.text, currentHash: body.document.hash, lastCheckDate: new Date(0), lastSuccessfulCheckDate: new Date(0), ingestionMethod: 'Direct Scrape', snapshots: { create: { version: 1, text: body.document.text, hash: body.document.hash, publicEvidence: true } } } });
  const contractJson = JSON.stringify(contract);
  await database.engineSourceContract.create({ data: { policyId: policy.id, contractJson, contractHash: digest(contractJson), reviewedBy: 'synthetic-test' } });
  return { policy, body };
}
async function drain(body: CaptureBody) {
  const analyze = vi.fn(async () => { throw new Error('model_must_not_run_for_unchanged'); });
  const acquire = vi.fn(async () => ({ artifactId: await store.putArtifact(body), observedAt: new Date().toISOString(), source: 'direct', httpStatus: 200, finalUrl: source, notModified: false, eligible: true, reasons: [], diagnostics: [] }));
  for (let i = 0; i < 8; i++) if (!await pipeline.workerStep({ acquire, analysis: { analyze, verify: analyze } })) break;
  expect(analyze).not.toHaveBeenCalled();
  return acquire;
}
async function settleStable() {
  for (let i = 0; api.cronState.isRunning && i < 200; i++) await new Promise(resolve => setTimeout(resolve, 10));
  expect(api.cronState.isRunning).toBe(false);
}
beforeAll(async () => {
  execFileSync(process.execPath, ['scripts/hostinger-init-db.mjs'], { env: { ...process.env, DATABASE_URL: url }, stdio: 'pipe' });
  vi.doMock('../db', () => ({ db: database }));
  vi.doMock('../adminAuth', () => ({ getSession: () => ({ valid: role !== 'none', role }) }));
  vi.doMock('../scraper', async importOriginal => ({ ...await importOriginal<typeof import('../scraper')>(),
    scrapePolicyText: async () => { throw new Error('unexpected_live_network_in_channel_test'); } }));
  api = await import('../../app/api/admin/cron-status/route'); store = await import('../engine/store');
  pipeline = await import('../engine/pipeline'); acquisition = await import('../engine/acquisition'); comparison = await import('../engine/comparison');
});
beforeEach(async () => {
  vi.stubEnv('NODE_ENV', 'test'); vi.stubEnv('DATABASE_URL', url); vi.stubEnv('POLICYWATCHER_ENGINE_CHANNELS', '1');
  vi.stubEnv('POLICYWATCHER_ENGINE_V6', '1'); vi.stubEnv('POLICYWATCHER_ENGINE_PUBLICATION', '0'); vi.stubEnv('POLICYWATCHER_ENGINE_NOTIFICATIONS', '0'); vi.stubEnv('POLICYWATCHER_SCANS_PAUSED', '0');
  role = 'admin'; await database.engineRun.deleteMany(); await database.engineReview.deleteMany(); await database.engineOutbox.deleteMany();
  await database.enginePolicyState.deleteMany(); await database.engineSourceContract.deleteMany(); await database.engineOrigin.deleteMany();
  await database.engineHttpCache.deleteMany(); await database.engineArtifact.deleteMany(); await database.company.deleteMany(); await database.scanRun.deleteMany();
  api.cronState.isRunning = false; api.cronState.requestKey = null; api.cronState.lastError = null;
});
afterAll(async () => { await settleStable(); await database.$disconnect(); vi.unstubAllEnvs(); rmSync(dir, { recursive: true, force: true }); });

describe('manual stable and experimental channel boundary', () => {
  it('defaults to stable, validates explicit scope, and rejects publication/notification overrides', () => {
    expect(parseChannelRequest({})).toMatchObject({ channel: 'stable', limit: 5 });
    for (const body of [{ channel: 'previeww' }, { limit: 501 }, { limit: 0.5 }, { limit: '5' }, { mode: 'publish' }, { notificationMode: 'subscribers' }, { companySlug: '../other' }]) expect(() => parseChannelRequest(body)).toThrow();
  });
  it('requires a real isolated database, disabled side effects and a non-production environment', () => {
    expect(experimentalChannelsAvailable()).toBe(true); expect(channelImplementationHash()).toMatch(/^[a-f0-9]{64}$/);
    vi.stubEnv('POLICYWATCHER_ENGINE_PUBLICATION', '1'); expect(experimentalChannelsAvailable()).toBe(false);
    vi.stubEnv('POLICYWATCHER_ENGINE_PUBLICATION', '0'); vi.stubEnv('NODE_ENV', 'production'); expect(experimentalChannelsAvailable()).toBe(false);
    vi.stubEnv('NODE_ENV', 'test'); vi.stubEnv('DATABASE_URL', 'file:/tmp/not-a-channel-copy.db'); expect(experimentalChannelsAvailable()).toBe(false);
    const external = resolve('output/scan-channel-external-test.db'); writeFileSync(external, '');
    try { symlinkSync(external, join(dir, 'link.db')); vi.stubEnv('DATABASE_URL', `file:${join(dir, 'link.db')}`); expect(experimentalChannelsAvailable()).toBe(false); }
    finally { rmSync(external); }
  });
  it('rejects anonymous and auditor reads and writes before creating work', async () => {
    for (const value of ['none', 'auditor']) { role = value; expect((await api.POST(request({ channel: 'preview' }))).status).toBe(403); expect((await api.GET(get())).status).toBe(403); }
    expect(await database.engineRun.count()).toBe(0); expect(await database.scanRun.count()).toBe(0);
  });
  it('never silently falls back to stable when preview is unavailable', async () => {
    vi.stubEnv('POLICYWATCHER_ENGINE_CHANNELS', '0');
    expect((await api.POST(request({ channel: 'preview' }))).status).toBe(409);
    expect(await database.scanRun.count()).toBe(0); expect(await database.engineRun.count()).toBe(0);
  });
  it('runs explicit Stable despite preview enablement, remains silent and replays its request once', async () => {
    const body = { channel: 'stable', requestKey: 'stable-test-0001', limit: 1 };
    expect((await api.POST(request(body))).status).toBe(200); await settleStable();
    const stored = await database.scanRun.findUniqueOrThrow({ where: { id: 'stable:stable-test-0001' } });
    expect(stored.status).toBe('completed'); expect(JSON.parse(stored.optionsJson!)).toMatchObject({ channel: 'stable', notificationMode: 'silent' });
    expect((await api.POST(request(body))).status).toBe(200); expect(await database.scanRun.count()).toBe(1);
    expect((await api.POST(request({ ...body, limit: 2 }))).status).toBe(409);
    expect(await database.engineRun.count()).toBe(0);
  });
  it('pins company scope and channel, returns the same durable preview run on retries', async () => {
    const a = await seed('company-a'); await seed('company-b');
    const body = { channel: 'preview', requestKey: 'preview-test-0001', limit: 1, companySlug: 'company-a' };
    const response = await api.POST(request(body)); expect(response.status).toBe(202); const accepted = await response.json();
    expect((await (await api.POST(request(body))).json()).runId).toBe(accepted.runId);
    expect((await api.POST(request({ ...body, channel: 'compare' }))).status).toBe(409);
    const run = await database.engineRun.findUniqueOrThrow({ where: { id: accepted.runId }, include: { tasks: true } });
    expect(run.mode).toBe('observe'); expect(run.notificationMode).toBe('silent');
    expect(run.tasks.filter(t => t.kind === 'policy').map(t => t.policyId)).toEqual([a.policy.id]);
    expect(JSON.parse(run.channelMetadataJson!)).toMatchObject({ channel: 'preview', companySlug: 'company-a' });
    expect(await database.engineRun.count()).toBe(1);
  });
  it('prevents both directions of concurrent stable and preview scans', async () => {
    await seed(); const accepted = await (await api.POST(request({ channel: 'preview' }))).json();
    expect((await api.POST(request({ channel: 'stable' }))).status).toBe(409); expect(await database.scanRun.count()).toBe(0);
    await store.cancelRun(accepted.runId, 'Synthetic test cancels work before testing the reverse direction.', 'test');
    await database.scanRun.create({ data: { status: 'running', leaseKey: 'policy-scan', leaseExpiresAt: new Date(Date.now() + 60000) } });
    const blocked = await api.POST(request({ channel: 'compare' })); expect(blocked.status).toBe(409); expect((await blocked.json()).error).toBe('stable_scan_active');
  });
  it('compares one capture without changing official evidence or invoking AI', async () => {
    const { policy, body } = await seed(); const before = await database.policy.findUniqueOrThrow({ where: { id: policy.id } });
    const accepted = await (await api.POST(request({ channel: 'compare', limit: 1 }))).json();
    const acquire = await drain(body); expect(acquire).toHaveBeenCalledTimes(1);
    const response = await api.GET(get(`?channelRunId=${accepted.runId}`)); expect(response.headers.get('cache-control')).toBe('private, no-store');
    const report = await response.json(); expect(report.status).toBe('completed'); expect(report.rows[0].outcome).toBe('unchanged');
    expect(report.rows[0].comparison).toMatchObject({ captureInputHash: digest(html), identicalText: false, modelComparisonPerformed: false, acquisitionComparisonPerformed: false, completenessQualified: false });
    expect(report.rows[0].comparison.preview.chars).toBeGreaterThan(report.rows[0].comparison.stable.chars);
    expect(report.rows[0].comparison.differences.some((part: { text: string }) => part.text.includes('never sell medical'))).toBe(true);
    expect(await database.policy.findUniqueOrThrow({ where: { id: policy.id } })).toEqual(before);
    expect(await database.policyChange.count()).toBe(0); expect(await database.policySnapshot.count()).toBe(1); expect(await database.engineOutbox.count()).toBe(0); expect(await database.policyCheckLog.count()).toBe(0);
  });
  it('preserves missing captures as unavailable comparisons, never as agreement', async () => {
    await seed(); await database.engineSourceContract.deleteMany();
    const accepted = await (await api.POST(request({ channel: 'compare', limit: 1 }))).json();
    for (let i = 0; i < 5; i++) if (!await pipeline.workerStep()) break;
    const report = await (await api.GET(get(`?channelRunId=${accepted.runId}`))).json();
    expect(report.rows[0].comparison).toBeNull(); expect(report.rows[0].reasons).toContain('source_contract_missing');
    expect(await database.policyChange.count()).toBe(0);
  });
  it('holds a queued preview when its model configuration changes instead of using a new identity', async () => {
    const { body } = await seed(); await api.POST(request({ channel: 'preview', limit: 1 }));
    vi.stubEnv('POLICYWATCHER_ENGINE_ANALYST_MODEL', 'changed-after-enqueue'); const acquire = await drain(body);
    expect(acquire).not.toHaveBeenCalled(); expect(await database.engineTask.count({ where: { lastError: 'channel_context_changed' } })).toBe(2);
    expect(await database.policyChange.count()).toBe(0);
    vi.unstubAllEnvs();
  });
  it('reports matching extraction deterministically without treating matching text as complete evidence', () => {
    const body = acquisition.extractEngineBody(`<html lang="en"><main><h1>Privacy Policy</h1><h2>Data use</h2><p>${paragraph.repeat(12)}</p><h2>Contact</h2><p>${terminal}</p></main></html>`, source, undefined, contract);
    const input = { mode: 'observe' as const, sourceUrl: source, scopeHash: 'scope', profileHash: 'profile', contractHash: null, contract, forceFresh: true, baselineHash: 'baseline', origin: 'https://example.com' };
    const observed = { artifactId: 'frozen', observedAt: '2026-11-01T12:00:00Z', source: 'direct', httpStatus: 200, finalUrl: source, eligible: true, notModified: false, reasons: [], diagnostics: [] };
    const a = comparison.compareCapturedExtraction(body, input, observed), b = comparison.compareCapturedExtraction(body, input, observed);
    expect(a.identicalText).toBe(true); expect(a.completenessQualified).toBe(false); expect(a.captureInputHash).toBe(b.captureInputHash); expect(a.stable.textHash).toBe(b.stable.textHash); expect(a.preview.textHash).toBe(b.preview.textHash);
  });
});
