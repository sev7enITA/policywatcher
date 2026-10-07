import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import { NextRequest } from 'next/server';
import { extractionEvidence, extractionProfileHash, sha256 } from '../extractionProfile';
import { compareExtractions, reviewedMetrics } from '../evidenceQuality';
import { confirmationReason, isConsecutiveChangeConfirmation } from '../changeConfirmation';
import { discoverEuPilot, pilotDocument } from '../euArchive';

const url = 'https://example.com/privacy';
const html = `<main><h1>Privacy Policy</h1><p>${'We collect personal data and information for account services. Users have privacy rights, cookie consent controls, retention details, processing purposes, third party disclosure terms, legal agreement protections, and GDPR remedies. '.repeat(8)}</p></main>`;
const dir = mkdtempSync(join(tmpdir(), 'pw-assurance-'));
const databaseUrl = `file:${join(dir, 'test.db')}`;
const db = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
let guard: typeof import('../extractionGuard');
let scraper: typeof import('../scraper');
let api: typeof import('../../app/api/admin/evidence-quality/route');
let scrapeApi: typeof import('../../app/api/scrape/route');
const analyze = vi.fn().mockResolvedValue({ executiveSummaryEn: 'Fixture analysis', executiveSummaryIt: 'Analisi fixture', overallRisk: 'Low', overallScore: 1, remediations: [], regionImpacts: [], aiTrainingOptOut: 'Not assessed', aiDataScrapingRestricted: 'Not assessed', aiIpLicensing: 'Not assessed', aiPromptRetention: 'Not assessed' });
let session = { valid: true, role: 'admin' as 'admin' | 'auditor' };

beforeAll(async () => {
  execFileSync(process.execPath, ['scripts/hostinger-init-db.mjs'], { env: { ...process.env, DATABASE_URL: databaseUrl }, stdio: 'pipe' });
  // Idempotency of the actual deployment initializer.
  execFileSync(process.execPath, ['scripts/hostinger-init-db.mjs'], { env: { ...process.env, DATABASE_URL: databaseUrl }, stdio: 'pipe' });
  vi.doMock('../db', () => ({ db }));
  vi.doMock('../adminAuth', () => ({ getSession: async () => session }));
  guard = await import('../extractionGuard'); scraper = await import('../scraper');
  api = await import('../../app/api/admin/evidence-quality/route');
  vi.doMock('../auth', () => ({ isAuthorized: () => true }));
  vi.doMock('../rateLimit', () => ({ rateLimit: () => null }));
  vi.doMock('../gemini', () => ({ analyzePolicyChange: analyze }));
  vi.doMock('../mailer', () => ({ sendSourceSuspensionAdminAlert: vi.fn() }));
  scrapeApi = await import('../../app/api/scrape/route');
});
beforeEach(async () => {
  vi.stubEnv('POLICYWATCHER_EXTRACTION_GUARD', '1');
  vi.stubEnv('POLICYWATCHER_SCANS_PAUSED', '0');
  vi.stubEnv('POLICYWATCHER_DOCUMENT_EVIDENCE_DUAL_WRITE', '0');
  session = { valid: true, role: 'admin' };
  analyze.mockClear();
  vi.restoreAllMocks();
  await db.evidenceQualityReview.deleteMany(); await db.adminReviewLog.deleteMany();
  await db.externalDocumentReference.deleteMany(); await db.company.deleteMany();
});
afterAll(async () => { await db.$disconnect(); vi.unstubAllEnvs(); rmSync(dir, { recursive: true, force: true }); });

async function setup(oldText?: string) {
  const parsed = await scraper.validateContent(html, url); if (!parsed.ok) throw new Error(parsed.reason);
  const text = oldText || parsed.text;
  const company = await db.company.create({ data: { name: 'Fixture', slug: 'fixture', industry: 'Technology', website: 'https://example.com' } });
  const policy = await db.policy.create({ data: { companyId: company.id, name: 'Privacy', type: 'privacy', url,
    currentText: text, currentHash: sha256(text), ingestionMethod: 'Direct Scrape',
    snapshots: { create: { version: 1, text, hash: sha256(text), publicEvidence: true } } } });
  return { policy, result: { status: 'ok' as const, text: parsed.text, hash: parsed.hash, finalUrl: url, reason: '',
    httpStatus: 200, attempts: 1, source: 'direct', extraction: extractionEvidence(html, url) } };
}
function request(body: object) {
  return new NextRequest('https://localhost/api/admin/evidence-quality', { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } });
}

describe('extraction guard with real isolated SQLite', () => {
  it('anchors an unchanged live extraction without creating a change or altering KPI evidence', async () => {
    const { policy, result } = await setup();
    expect((await guard.guardExtraction(policy, result)).proceed).toBe(true);
    expect(await db.extractionBaseline.count()).toBe(1);
    expect(await db.policyChange.count()).toBe(0);
  });
  it('uses the scan acquisition identity without collapsing language or fragment scope', async () => {
    const { policy, result } = await setup();
    const equivalent = { ...result, extraction: extractionEvidence(html, `${url}?utm_source=example`) };
    expect((await guard.guardExtraction(policy, equivalent)).proceed).toBe(true);
    expect(extractionProfileHash(`${url}#eu`)).not.toBe(extractionProfileHash(`${url}#us`));
    expect(extractionProfileHash(`${url}?hl=en`)).not.toBe(extractionProfileHash(`${url}?hl=it`));
  });
  it('replays the same old input after a parser change without a provider change', async () => {
    const { policy, result } = await setup('Earlier parser omitted a section');
    await db.extractionBaseline.create({ data: { policyId: policy.id, baselineHash: policy.currentHash,
      profileHash: 'old-parser', inputHash: sha256(html), input: html, sourceUrl: url, capturedAt: new Date('2026-01-01') } });
    expect(await guard.guardExtraction(policy, result)).toMatchObject({ proceed: false, reason: 'parser_upgrade' });
    expect((await db.policy.findUniqueOrThrow({ where: { id: policy.id } })).currentHash).toBe(result.hash);
    expect(await db.policySnapshot.count()).toBe(2); expect(await db.policyChange.count()).toBe(0);
    expect(await db.adminReviewLog.count({ where: { action: 'parser_upgrade' } })).toBe(1);
    expect((await guard.guardExtraction({ ...policy, currentHash: result.hash }, result)).proceed).toBe(true);
    expect(await db.policySnapshot.count()).toBe(2);
  });
  it('does not swallow a simultaneous provider edit during parser upgrade', async () => {
    const { policy, result } = await setup('Earlier parser text');
    await db.extractionBaseline.create({ data: { policyId: policy.id, baselineHash: policy.currentHash,
      profileHash: 'old-parser', inputHash: sha256(html), input: html, sourceUrl: url, capturedAt: new Date() } });
    const edited = { ...result, text: result.text + '\nWe now retain data for 900 days.', hash: sha256(result.text + '\nWe now retain data for 900 days.') };
    await guard.guardExtraction(policy, edited);
    const updated = await db.policy.findUniqueOrThrow({ where: { id: policy.id } });
    expect(updated.currentHash).toBe(result.hash); expect(updated.currentHash).not.toBe(edited.hash);
    expect((await guard.guardExtraction(updated, edited)).proceed).toBe(true);
    const latest = await db.policyCheckLog.findFirst({ orderBy: { checkedAt: 'desc' } });
    expect(isConsecutiveChangeConfirmation(latest, edited.hash, extractionProfileHash(url))).toBe(false);
  });
  it('holds missing/corrupt replay input, archives, partial text and profile drift', async () => {
    const { policy, result } = await setup('Old baseline');
    expect((await guard.guardExtraction(policy, result)).reason).toBe('extraction_baseline_missing');
    expect((await guard.guardExtraction(policy, { ...result, source: 'wayback' })).reason).toBe('external_capture_not_live_confirmation');
    expect((await guard.guardExtraction(policy, { ...result, partial: true })).reason).toBe('extraction_input_incomplete');
    await db.extractionBaseline.create({ data: { policyId: policy.id, baselineHash: policy.currentHash,
      profileHash: 'old', inputHash: 'corrupt', input: html, sourceUrl: url, capturedAt: new Date() } });
    expect((await guard.guardExtraction(policy, result)).reason).toBe('extraction_replay_unavailable');
    expect(await db.policyChange.count()).toBe(0);
  });
  it('exposes incomplete replay for reviewed recovery without fabricating a provider change', async () => {
    const { policy, result } = await setup('Old baseline');
    const unusable = '<main>Consent required</main>';
    await db.extractionBaseline.create({ data: { policyId: policy.id, baselineHash: policy.currentHash,
      profileHash: 'old', inputHash: sha256(unusable), input: unusable, sourceUrl: url, capturedAt: new Date() } });
    expect((await guard.guardExtraction(policy, result)).reason).toBe('extraction_replay_incomplete');
    const overview = await (await api.GET(new NextRequest('https://localhost/api/admin/evidence-quality'))).json();
    expect(overview.held.some((h: { reason: string }) => h.reason === 'extraction_replay_incomplete')).toBe(true);
    expect((await api.POST(request({ action: 'baseline_review', policyId: policy.id,
      expectedHash: policy.currentHash, note: 'Reviewed unusable historical extraction input.' }))).status).toBe(200);
    expect(await db.policyChange.count()).toBe(0);
  });
  it('runs the actual manual route through two live observations before AI and publication', async () => {
    const { policy, result } = await setup(); await guard.guardExtraction(policy, result);
    const newHtml = html.replace('</main>', '<p>We now retain personal data for 900 days.</p></main>');
    const parsed = await scraper.validateContent(newHtml, url); if (!parsed.ok) throw new Error(parsed.reason);
    const changed = { ...result, text: parsed.text, hash: parsed.hash, extraction: extractionEvidence(newHtml, url) };
    vi.spyOn(scraper, 'scrapePolicyText').mockResolvedValue(changed);
    const first = await scrapeApi.POST(request({ policyId: policy.id }));
    expect(first.status).toBe(202); expect(analyze).not.toHaveBeenCalled();
    const second = await scrapeApi.POST(request({ policyId: policy.id }));
    expect(second.status).toBe(200); expect(analyze).toHaveBeenCalledOnce();
    expect(await db.policyChange.count()).toBe(1);
    expect((await db.extractionBaseline.findUniqueOrThrow({ where: { policyId: policy.id } })).baselineHash).toBe(changed.hash);
    const third = await scrapeApi.POST(request({ policyId: policy.id }));
    expect(third.status).toBe(200); expect(analyze).toHaveBeenCalledOnce();
  });
  it('requires the same profile and live source for consecutive confirmation', () => {
    const log = { status: 'Needs Review', reason: confirmationReason('profile'), textHash: 'hash', source: 'direct' };
    expect(isConsecutiveChangeConfirmation(log, 'hash', 'profile')).toBe(true);
    expect(isConsecutiveChangeConfirmation(log, 'hash', 'new-profile')).toBe(false);
    expect(isConsecutiveChangeConfirmation({ ...log, source: 'wayback' }, 'hash', 'profile')).toBe(false);
  });
  it('does not authorize baseline replacement from a stale reviewed hash', async () => {
    const { policy, result } = await setup('Old baseline'); await guard.guardExtraction(policy, result);
    expect((await api.POST(request({ action: 'baseline_review', policyId: policy.id, expectedHash: 'wrong', note: 'Reviewed acquisition gap.' }))).status).toBe(400);
    expect((await api.POST(request({ action: 'baseline_review', policyId: policy.id, expectedHash: policy.currentHash, note: 'Reviewed acquisition gap.' }))).status).toBe(200);
    expect((await db.policy.findUniqueOrThrow({ where: { id: policy.id } })).sourceMigrationPending).toBe(true);
    expect(await db.policyChange.count()).toBe(0);
  });
});

describe('reviewed quality and boundaries', () => {
  it('removes private extraction inputs and operator notes from sanitized staging copies', () => {
    const source = join(dir, 'sanitization-source.db'); const target = join(dir, 'sanitization-target.db');
    const output = execFileSync(process.execPath, ['--input-type=module', '-e', `
      import { DatabaseSync } from 'node:sqlite';
      import { createStagingDatabase } from './scripts/create-staging-database.mjs';
      const source = process.argv[1]; const target = process.argv[2];
      const db = new DatabaseSync(source);
      for (const table of ['ExtractionBaseline', 'EvidenceQualityReview', 'ExternalDocumentReference', 'Policy']) {
        db.exec('CREATE TABLE "' + table + '" (id TEXT)'); db.prepare('INSERT INTO "' + table + '" VALUES (?)').run('fixture');
      }
      db.close(); const result = createStagingDatabase({ sourcePath: source, outputPath: target });
      const clean = new DatabaseSync(target); const original = new DatabaseSync(source);
      console.log(JSON.stringify({ removed: result.removed,
        publicRows: clean.prepare('SELECT COUNT(*) AS n FROM Policy').get().n,
        originalRows: original.prepare('SELECT COUNT(*) AS n FROM ExtractionBaseline').get().n }));
      clean.close(); original.close();
    `, source, target], { encoding: 'utf8' });
    expect(JSON.parse(output)).toEqual({ removed: { ExtractionBaseline: 1, EvidenceQualityReview: 1, ExternalDocumentReference: 1 }, publicRows: 1, originalRows: 1 });
  });
  it('reports unknown at zero denominator and excludes outdated evidence', () => {
    expect(reviewedMetrics([], new Map()).falsePositiveShare.percent).toBeNull();
    const m = reviewedMetrics([{ changeId: 'a', metric: 'substantive_change', verdict: 'fail', evidenceHash: 'old' },
      { changeId: 'b', metric: 'substantive_change', verdict: 'pass', evidenceHash: 'current' }], new Map([['a', 'new'], ['b', 'current']]));
    expect(m.falsePositiveShare).toMatchObject({ numerator: 0, denominator: 1 }); expect(m.staleReviews).toBe(1);
  });
  it('rejects scope mismatch and detects number/negation differences without a confidence score', () => {
    expect(compareExtractions('We retain for 30 days.', 'We do not retain for 300 days.', false).comparable).toBe(false);
    expect(compareExtractions('We retain for 30 days.', 'We do not retain for 300 days.', true)).toMatchObject({ comparable: true, numbersDiffer: true, negationCounts: [0, 1] });
  });
  it('persists human samples once, rejects invented citations and excludes revised evidence', async () => {
    const { policy } = await setup();
    const snapshot = await db.policySnapshot.findFirstOrThrow({ where: { policyId: policy.id } });
    const change = await db.policyChange.create({ data: { policyId: policy.id, newSnapshotId: snapshot.id,
      diff: '[]', aiSummaryEn: 'We collect personal data', aiSummaryIt: 'Raccogliamo dati personali',
      overallRisk: 'Low', overallScore: 1, remediationsJson: '[]', aiTrainingOptOut: 'Not assessed',
      aiDataScrapingRestricted: 'Not assessed', aiIpLicensing: 'Not assessed', aiPromptRetention: 'Not assessed' } });
    const response = await api.GET(new NextRequest(`https://localhost/api/admin/evidence-quality?changeId=${change.id}`));
    const { evidenceHash } = await response.json();
    const body = { changeId: change.id, evidenceHash, metric: 'ai_citation', verdict: 'pass',
      claim: 'We collect personal data', quote: 'We collect personal data', note: 'Human fixture review: the passage supports this exact claim.' };
    expect((await api.POST(request({ ...body, quote: 'Invented source passage' }))).status).toBe(400);
    expect((await api.POST(request(body))).status).toBe(200);
    expect((await api.POST(request(body))).status).toBe(200);
    expect(await db.evidenceQualityReview.count()).toBe(1);
    await db.policyChange.update({ where: { id: change.id }, data: { aiSummaryEn: 'Updated interpretation' } });
    const metricsResponse = await api.GET(new NextRequest('https://localhost/api/admin/evidence-quality?metricsOnly=1'));
    const metrics = (await metricsResponse.json()).metrics;
    expect(metrics.staleReviews).toBe(1); expect(metrics.citationSupport.percent).toBeNull();
    expect((await api.POST(request(body))).status).toBe(400);
  });
  it('stops manual scans before retrieval while the rollout pause is active', async () => {
    vi.stubEnv('POLICYWATCHER_SCANS_PAUSED', '1');
    const fetch = vi.spyOn(scraper, 'scrapePolicyText');
    expect((await scrapeApi.POST(request({ policyId: 'irrelevant' }))).status).toBe(503);
    expect(fetch).not.toHaveBeenCalled(); expect(analyze).not.toHaveBeenCalled();
  });
  it('requires authentication and blocks auditor writes', async () => {
    session.valid = false;
    expect((await api.GET(new NextRequest('https://localhost/api/admin/evidence-quality'))).status).toBe(401);
    session = { valid: true, role: 'auditor' };
    expect((await api.POST(request({}))).status).toBe(403);
  });
  it('never publishes raw extraction input through the admin overview', async () => {
    const { policy, result } = await setup(); await guard.guardExtraction(policy, result);
    const r = await api.GET(new NextRequest('https://localhost/api/admin/evidence-quality'));
    const body = await r.text(); expect(r.status).toBe(200); expect(body).not.toContain('<main>');
  });
});

describe('EU metadata-only discovery', () => {
  it('preserves document identity and leaves uncertain jurisdiction unconfirmed', () => {
    expect(pilotDocument('OpenAI/EU Privacy Policy.md')).toMatchObject({ jurisdiction: 'EU', suggestedType: 'privacy' });
    expect(pilotDocument('Google/Terms of Service.md')).toMatchObject({ jurisdiction: 'unconfirmed' });
    expect(pilotDocument('Other/Privacy Policy.md')).toBeNull();
  });
  it('pins reads, imports only metadata and keeps repeated imports idempotent', async () => {
    const sha = 'a'.repeat(40); const blob = 'b'.repeat(40); const paths: string[] = [];
    const license = readFileSync('docs/reports/eu-terms-reuse-2026-10-07/cc-by-4.0.txt', 'utf8');
    const result = await discoverEuPilot(async path => {
      paths.push(path);
      if (path.startsWith('/files/LICENSE')) return { encoding: 'base64', content: Buffer.from(license).toString('base64') };
      if (path.startsWith('/commits')) return [{ id: sha, committed_date: '2026-10-02T00:00:00Z' }];
      return [{ id: blob, type: 'blob', path: 'Google/Privacy Policy.md' }];
    });
    expect(result.references).toHaveLength(1); expect(paths.every(p => !p.includes('/raw'))).toBe(true);
    expect(paths.filter(p => p.startsWith('/tree')).every(p => p.includes(`ref=${sha}`))).toBe(true);
    for (let i = 0; i < 2; i++) for (const row of result.references) await db.externalDocumentReference.upsert({ where: { referenceKey: row.referenceKey }, create: row, update: {} });
    expect(await db.externalDocumentReference.count()).toBe(1); expect(await db.policyChange.count()).toBe(0);
    expect(Object.keys(result.references[0])).not.toContain('text');
  });
  it('stops if upstream licensing changes', async () => {
    await expect(discoverEuPilot(async path => path.startsWith('/commits')
      ? [{ id: 'a'.repeat(40), committed_date: '2026-01-01' }] : { encoding: 'base64', content: Buffer.from('Different terms').toString('base64') }))
      .rejects.toThrow('license_requires_review');
  });
});
