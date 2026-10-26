/** Opt-in rehearsal: actual cron, scraper, shadow storage and Prisma/SQLite; controlled transports. */
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import type { PrismaClient } from '@prisma/client';
import type { ScrapePolicyOptions, TransportResult } from '../../src/lib/scraper';
import type { ShadowFileConfig } from '../../src/lib/adaptiveAcquisition/shadowRuntime';
import { verifyShadowReceipt, type ShadowReceipt } from '../../src/lib/adaptiveAcquisition/shadow';

const transport = vi.hoisted(() => ({
  fixtures: new Map<string, { html: string; finalUrl?: string; failed?: boolean }>(),
  calls: [] as string[],
  forbidden: vi.fn(() => { throw new Error('external_side_effect_forbidden_in_rehearsal'); }),
}));

vi.mock('../../src/lib/scraper', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/lib/scraper')>();
  return {
    ...actual,
    scrapePolicyText: (url: string, options: ScrapePolicyOptions = {}) => {
      const unavailable = async (): Promise<TransportResult> => ({ ok: false, html: '', status: 0, finalUrl: url, error: 'fixture_unavailable' });
      return actual.scrapePolicyText(url, {
        ...options,
        controlledFallbacks: {
          skipDelays: true,
          direct: async () => {
            transport.calls.push(url);
            const fixture = transport.fixtures.get(url);
            if (!fixture) throw new Error('unconfigured_fixture');
            if (fixture.failed) return unavailable();
            return { ok: true, html: fixture.html, status: 200, finalUrl: fixture.finalUrl || url, error: '' };
          },
          http2: unavailable, rendered: unavailable, wayback: unavailable, commoncrawl: unavailable,
        },
      });
    },
  };
});
vi.mock('../../src/lib/gemini', () => ({ analyzePolicyChange: transport.forbidden }));
// None of these cases qualifies for a published change. Fail closed if the
// scan attempts analysis, canonical publication or subscriber selection.
vi.mock('../../src/lib/documentEvidenceSync', () => ({ dualWriteCanonicalPolicyGraph: transport.forbidden }));
vi.mock('../../src/lib/subscriberPreferences', () => ({ matchesSubscriberWatchlist: transport.forbidden }));
vi.mock('../../src/lib/mailer', () => ({
  sendPolicyChangeAlert: transport.forbidden,
  sendSourceSuspensionAdminAlert: transport.forbidden,
  maskEmailForLog: () => '[rehearsal]',
}));

let directory: string;
let database: PrismaClient;
let runFullScan: typeof import('../../src/app/api/cron/check-all/route')['runFullScan'];
let scrapePolicyText: typeof import('../../src/lib/scraper')['scrapePolicyText'];
let cleanHtml: string;
let noiseHtml: string;
const urls = ['https://8.8.8.8/legal/privacy', 'https://1.1.1.1/legal/privacy', 'https://8.8.4.4/us/legal/privacy'];

beforeAll(async () => {
  // A caller's DATABASE_URL, credentials and .env never select the rehearsal database.
  directory = await mkdtemp(join(tmpdir(), 'policywatcher-cron-rehearsal-'));
  const schema = await readFile('prisma/schema.prisma', 'utf8');
  if (!/provider\s*=\s*"sqlite"/.test(schema)) throw new Error('rehearsal_requires_sqlite_schema');
  await writeFile(join(directory, 'schema.prisma'), schema);
  const databaseUrl = `file:${join(directory, 'rehearsal.db')}`;
  vi.stubEnv('DATABASE_URL', databaseUrl);
  vi.stubEnv('POLICYWATCHER_DATABASE_PROVIDER', 'sqlite');
  execFileSync(process.execPath, [resolve('node_modules/prisma/build/index.js'), 'db', 'push',
    '--schema', join(directory, 'schema.prisma'), '--skip-generate'], {
    cwd: directory,
    env: { PATH: process.env.PATH, NODE_ENV: 'test', DATABASE_URL: databaseUrl,
      PRISMA_SCHEMA_ENGINE_BINARY: process.env.PRISMA_SCHEMA_ENGINE_BINARY,
      PRISMA_QUERY_ENGINE_LIBRARY: process.env.PRISMA_QUERY_ENGINE_LIBRARY },
    timeout: 45_000, stdio: 'pipe',
  });
  vi.stubGlobal('fetch', transport.forbidden);
  // This test file runs in its own worker; avoid an inherited development singleton.
  delete (globalThis as { prisma?: PrismaClient }).prisma;
  ({ db: database } = await import('../../src/lib/db'));
  ({ runFullScan } = await import('../../src/app/api/cron/check-all/route'));
  ({ scrapePolicyText } = await import('../../src/lib/scraper'));
  const corpus = JSON.parse(await readFile('evals/scraping/corpus.synthetic.v1.json', 'utf8'));
  cleanHtml = corpus.cases.find((entry: { id: string }) => entry.id === 'train-clean').capture.html;
  noiseHtml = corpus.cases.find((entry: { id: string }) => entry.id === 'train-noise').capture.html;
});

beforeEach(async () => {
  vi.stubEnv('POLICYWATCHER_SCRAPING_SHADOW_CONFIG', '');
  transport.fixtures.clear(); transport.calls.length = 0; transport.forbidden.mockClear();
  await database.company.deleteMany();
  await database.scanRun.deleteMany();
  await database.sourceRemediationIssue.deleteMany();
});
afterEach(() => {
  expect(transport.forbidden).not.toHaveBeenCalled();
});
afterAll(async () => {
  await database?.$disconnect();
  delete (globalThis as { prisma?: PrismaClient }).prisma;
  vi.unstubAllGlobals(); vi.unstubAllEnvs();
  if (directory) await rm(directory, { recursive: true, force: true });
});

async function seed(url: string, name: string, html = cleanHtml) {
  transport.fixtures.set(url, { html });
  const baseline = await scrapePolicyText(url);
  expect(baseline.status).toBe('ok'); expect(baseline.partial).not.toBe(true);
  const company = await database.company.create({ data: { name, slug: name, industry: 'Rehearsal', website: url } });
  return database.policy.create({ data: {
    companyId: company.id, name: 'Privacy Policy', type: 'privacy', url, jurisdiction: 'EU',
    currentText: baseline.text, currentHash: baseline.hash, ingestionMethod: 'Direct scrape',
    snapshots: { create: { version: 1, text: baseline.text, hash: baseline.hash, publicEvidence: true } },
  } });
}
async function configure(targetUrls: string[], budget = 10) {
  const outputDirectory = await mkdtemp(join(directory, 'shadow-'));
  const config: ShadowFileConfig = {
    schemaVersion: 1, mode: 'shadow', maxObservations: budget, outputDirectory,
    targets: targetUrls.map((url) => ({ url, language: 'en', jurisdiction: 'EU' })),
    recipes: [...new Set(targetUrls.map((url) => new URL(url).origin))].map((origin, index) => ({
      schemaVersion: 1, id: `rehearsal-article-${index}`, revision: 1,
      scope: { origin, pathPrefix: '/', language: 'en', jurisdiction: 'EU' },
      rootSelector: '#policy-document' })),
  };
  const path = join(outputDirectory, 'config.json'); await writeFile(path, JSON.stringify(config));
  vi.stubEnv('POLICYWATCHER_SCRAPING_SHADOW_CONFIG', path);
  return outputDirectory;
}
async function latestRun() {
  const run = await database.scanRun.findFirstOrThrow({ orderBy: { startedAt: 'desc' } });
  expect(run.status).toBe('completed'); expect(run.leaseKey).toBeNull(); expect(run.completedAt).not.toBeNull();
  return { run, metrics: JSON.parse(run.metricsJson!) };
}

describe('cron shadow rehearsal with a disposable SQLite database', () => {
  it('persists one observation per acquisition and keeps baseline text despite a different candidate', async () => {
    const first = await seed(urls[0], 'first', noiseHtml);
    const duplicate = await seed(urls[0], 'duplicate', noiseHtml);
    const output = await configure([urls[0]]);
    transport.calls.length = 0;
    const result = await runFullScan(undefined, { notificationMode: 'silent' });
    expect(result).toMatchObject({ checked: 2, changed: 0, errors: 0 });
    expect(result.details.map((detail) => detail.status)).toEqual(['unchanged', 'unchanged']);
    expect(transport.calls).toEqual([urls[0]]);
    const { run, metrics } = await latestRun();
    expect(run).toMatchObject({ uniqueSources: 1, networkRetrievals: 1, deduplicatedRetrievals: 1 });
    expect(metrics.scrapingShadow).toMatchObject({ mode: 'shadow', attempted: 1, persisted: 1, errors: 0, baselineMismatches: 0 });
    const logs = await database.policyCheckLog.findMany({ where: { scanRunId: run.id } });
    expect(logs).toHaveLength(2); expect(new Set(logs.map((log) => log.sourceRetrievalId)).size).toBe(1);
    const files = await readdir(join(output, 'observations')); expect(files).toHaveLength(1);
    const receipt: ShadowReceipt = JSON.parse(await readFile(join(output, 'observations', files[0]), 'utf8'));
    verifyShadowReceipt(receipt); expect(receipt.runId).toBe(run.id);
    expect(receipt.baseline.matchesProduction).toBe(true);
    expect(receipt.comparisons[0].disposition).toBe('extraction_differs');
    expect(receipt.livePromotionAllowed).toBe(false);
    for (const original of [first, duplicate]) {
      const current = await database.policy.findUniqueOrThrow({ where: { id: original.id } });
      expect(current.currentText).toBe(original.currentText); expect(current.currentHash).toBe(original.currentHash);
    }
    expect(await database.policySnapshot.count()).toBe(2); expect(await database.policyChange.count()).toBe(0);
  });

  it('keeps partial, regional-drift and first-change evidence out of new snapshots and publication', async () => {
    const originals = await Promise.all(urls.map((url, index) => seed(url, `guard-${index}`)));
    const paragraph = 'We collect personal information to provide our services. You have rights of access and erasure. We retain records for 30 days and protect your privacy. ';
    transport.fixtures.set(urls[0], { html: `<html><body><article id="policy-document"><h1>Privacy Policy</h1><p>${paragraph.repeat(4_000)}</p></article></body></html>` });
    transport.fixtures.set(urls[1], { html: cleanHtml.replaceAll('30 days', '90 days') });
    transport.fixtures.set(urls[2], { html: cleanHtml, finalUrl: urls[2].replace('/us/', '/en-it/') });
    await configure(urls);
    transport.calls.length = 0;
    const result = await runFullScan(undefined, { notificationMode: 'silent' });
    expect(result).toMatchObject({ checked: 3, changed: 0, confirmationPending: 1, partial: 1, invalid: 1, errors: 0 });
    expect(result.details.map((detail) => detail.status).sort()).toEqual(['confirmation_pending', 'invalid', 'partial']);
    const { run, metrics } = await latestRun();
    expect(metrics.scrapingShadow).toMatchObject({ attempted: 3, persisted: 3, errors: 0 });
    const logs = await database.policyCheckLog.findMany({ where: { scanRunId: run.id } });
    expect(logs.find((log) => log.policyId === originals[0].id)?.status).toBe('Partial');
    expect(logs.find((log) => log.policyId === originals[1].id)?.reason).toBe('change_confirmation_pending');
    expect(logs.find((log) => log.policyId === originals[2].id)?.textHash).toBeNull();
    for (const original of originals) {
      const current = await database.policy.findUniqueOrThrow({ where: { id: original.id } });
      expect(current.currentHash).toBe(original.currentHash); expect(current.currentText).toBe(original.currentText);
    }
    expect(await database.policySnapshot.count()).toBe(3); expect(await database.policyChange.count()).toBe(0);
  });

  it.each(['disabled', 'configuration_error'] as const)('completes the baseline scan when shadow is %s', async (mode) => {
    await seed(urls[0], mode);
    if (mode === 'configuration_error') vi.stubEnv('POLICYWATCHER_SCRAPING_SHADOW_CONFIG', join(directory, 'missing-config.json'));
    const result = await runFullScan(undefined, { notificationMode: 'silent' });
    expect(result.details[0].status).toBe('unchanged');
    const { metrics } = await latestRun();
    expect(metrics.scrapingShadow).toMatchObject({ mode, attempted: 0, persisted: 0 });
    expect(await database.policyChange.count()).toBe(0);
  });

  it('applies the observation budget without skipping baseline acquisition or check logs', async () => {
    await seed(urls[0], 'budget-a'); await seed(urls[1], 'budget-b');
    await configure(urls.slice(0, 2), 1); transport.calls.length = 0;
    const result = await runFullScan(undefined, { notificationMode: 'silent' });
    expect(result.details.every((detail) => detail.status === 'unchanged')).toBe(true);
    expect(transport.calls).toHaveLength(2);
    const { run, metrics } = await latestRun();
    expect(metrics.scrapingShadow).toMatchObject({ attempted: 1, persisted: 1, budgetSkipped: 1, errors: 0 });
    expect(await database.policyCheckLog.count({ where: { scanRunId: run.id } })).toBe(2);
  });
  it('persists completed observations and releases the lease after a fatal scan error', async () => {
    const original = await seed(urls[0], 'fatal');
    const output = await configure([urls[0]]);
    const failure = new Error('rehearsal_progress_failure');
    await expect(runFullScan((progress) => {
      if (progress.phase === 'policy_done') throw failure;
    }, { notificationMode: 'silent' })).rejects.toBe(failure);
    const run = await database.scanRun.findFirstOrThrow({ orderBy: { startedAt: 'desc' } });
    expect(run).toMatchObject({ status: 'failed', leaseKey: null, leaseExpiresAt: null });
    expect(run.completedAt).not.toBeNull();
    expect(JSON.parse(run.metricsJson!).scrapingShadow).toMatchObject({ attempted: 1, persisted: 1, errors: 0 });
    expect((await readdir(output)).filter((name) => name.endsWith('.summary.json'))).toHaveLength(1);
    expect(await database.policyChange.count()).toBe(0);
    expect((await database.policy.findUniqueOrThrow({ where: { id: original.id } })).currentHash).toBe(original.currentHash);
  });
});
