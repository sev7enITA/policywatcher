import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import { digest, structureDocument, type SourceContract } from '../engine/document';
import { coverageInventoryDigest, coverageScopeId, observedCoverageSequenceDigest, observedCoverageUnits } from '../engine/coverage';
import type { CaptureBody, Observation } from '../engine/acquisition';

const directory = mkdtempSync(join(tmpdir(), 'pw-coverage-workflow-'));
const databaseUrl = `file:${join(directory, 'isolated.db')}`;
const database = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
const sourceUrl = 'https://example.org/policy';
const referenceText = '# Terms\n\n## Use\n\nThe independent sample prohibits sharing private credentials.\n\n## Contact\n\nContact the sample service for information about these terms.';
const contract: SourceContract = { schemaVersion: 1, sourceUrl, titleAliases: ['Terms'], requiredHeadings: ['Use', 'Contact'],
  terminalText: 'Contact the sample service for information about these terms.', language: 'en', minimumChars: 100, maximumChars: 500_000,
  preferredTransport: 'direct', reviewedAt: '2026-11-22T10:00:00.000Z', reviewNote: 'Reviewed a synthetic independently authored literal reference.' };
let store: typeof import('../engine/store');
let pipeline: typeof import('../engine/pipeline');
const modelForbidden = vi.fn(async () => { throw new Error('model_call_not_authorized'); });

function coveredContract() {
  const expected = structureDocument(referenceText); // Authored test oracle, never a transport response.
  const scope = { sourceUrl, language: 'en' as const, referenceVersion: 'manual-synthetic-1' };
  const body = { schemaVersion: 1 as const, scope, scopeId: coverageScopeId(scope),
    reference: { method: 'manual_reference' as const, url: sourceUrl, sha256: digest(referenceText),
      capturedAt: '2026-11-22T09:00:00.000Z', reviewedAt: '2026-11-22T10:00:00.000Z', reviewNote: 'A manually authored synthetic reference, no production qualification.' },
    units: observedCoverageUnits(expected), sequenceSha256: observedCoverageSequenceDigest(expected) };
  return { ...contract, completenessInventory: { ...body, inventorySha256: coverageInventoryDigest(body) } };
}
async function seed(inventory = false, text = '') {
  const company = await database.company.create({ data: { name: 'Coverage Synthetic', slug: 'coverage-synthetic', industry: 'Synthetic', website: 'https://example.org' } });
  const policy = await database.policy.create({ data: { companyId: company.id, name: 'Terms', type: 'terms', url: sourceUrl,
    currentText: text, currentHash: digest(text), ingestionMethod: 'Direct Scrape', lastSuccessfulCheckDate: new Date(0) } });
  const value = inventory ? coveredContract() : contract;
  const json = JSON.stringify(value);
  await database.engineSourceContract.create({ data: { policyId: policy.id, contractJson: json, contractHash: digest(json), reviewedBy: 'synthetic-admin' } });
  return policy;
}
async function observation(text = referenceText): Promise<Observation> {
  const body: CaptureBody = { html: '', document: structureDocument(text), language: 'en' };
  return { artifactId: await store.putArtifact(body), observedAt: new Date().toISOString(), source: 'direct', httpStatus: 200,
    finalUrl: sourceUrl, notModified: false, eligible: true, reasons: [], diagnostics: [] };
}
async function run(key: string, mode: 'observe' | 'publish', text = referenceText) {
  await store.enqueueRun({ requestKey: key, mode, requestedBy: 'synthetic-admin', notificationMode: 'silent' });
  for (let i = 0; i < 12; i++) if (!await pipeline.workerStep({ acquire: async () => observation(text), analysis: { analyze: modelForbidden, verify: modelForbidden } })) break;
}
async function second(policyId: string, mode: 'observe' | 'publish') {
  await database.enginePolicyState.update({ where: store.stateKey(policyId, mode), data: { candidateObservedAt: new Date(Date.now() - store.CONFIRMATION_MS - 1000), nextDueAt: new Date(0) } });
  await database.engineOrigin.updateMany({ data: { nextAllowedAt: new Date(0) } });
}
beforeAll(async () => {
  execFileSync(process.execPath, ['scripts/hostinger-init-db.mjs'], { env: { ...process.env, DATABASE_URL: databaseUrl }, stdio: 'pipe' });
  vi.doMock('../db', () => ({ db: database }));
  store = await import('../engine/store'); pipeline = await import('../engine/pipeline');
});
beforeEach(async () => {
  vi.stubEnv('POLICYWATCHER_SCANS_PAUSED', '0'); vi.stubEnv('POLICYWATCHER_ENGINE_PUBLICATION', '1'); vi.stubEnv('POLICYWATCHER_ENGINE_NOTIFICATIONS', '0');
  await database.engineRun.deleteMany(); await database.engineReview.deleteMany(); await database.engineOutbox.deleteMany();
  await database.engineSourceContract.deleteMany(); await database.enginePolicyState.deleteMany(); await database.engineOrigin.deleteMany();
  await database.engineArtifact.deleteMany(); await database.company.deleteMany(); vi.clearAllMocks();
});
afterAll(async () => { await database.$disconnect(); vi.unstubAllEnvs(); rmSync(directory, { recursive: true, force: true }); });

describe('coverage publication hard gates, actual isolated database and worker', () => {
  it('holds legacy publication despite a forged eligible observation', async () => {
    const policy = await seed(); await run('legacy-publish', 'publish');
    const review = await database.engineReview.findFirstOrThrow();
    expect(review.reasonsJson).toContain('source_coverage_not_qualified');
    expect((await database.policy.findUniqueOrThrow({ where: { id: policy.id } })).currentHash).toBe(policy.currentHash);
    expect(await database.policySnapshot.count()).toBe(0);
    expect(await database.policyChange.count()).toBe(0);
    expect(await database.engineOutbox.count()).toBe(0);
    expect(modelForbidden).not.toHaveBeenCalled();
  });
  it('does not refresh public successful time from an uncovered unchanged capture', async () => {
    const policy = await seed(false, referenceText); await run('legacy-unchanged', 'publish');
    expect((await database.policy.findUniqueOrThrow({ where: { id: policy.id } })).lastSuccessfulCheckDate.getTime()).toBe(0);
    expect((await database.engineReview.findFirstOrThrow()).reasonsJson).toContain('source_coverage_not_qualified');
  });
  it('keeps two legacy observations private without silently qualifying coverage', async () => {
    const policy = await seed(); await run('legacy-observe-1', 'observe'); await second(policy.id, 'observe'); await run('legacy-observe-2', 'observe');
    expect(await database.policySnapshot.count()).toBe(0);
    expect(await database.policyChange.count()).toBe(0);
    expect((await database.policy.findUniqueOrThrow({ where: { id: policy.id } })).currentHash).toBe(policy.currentHash);
    expect((await database.engineTask.findMany({ where: { kind: 'policy' } })).some(t => t.resultJson?.includes('observed_baseline_ready'))).toBe(true);
  });
  it('admits a reviewed synthetic baseline only after two matching fresh captures', async () => {
    const policy = await seed(true); await run('covered-1', 'publish');
    expect(await database.policySnapshot.count()).toBe(0);
    await second(policy.id, 'publish'); await run('covered-2', 'publish');
    expect(await database.policySnapshot.count({ where: { publicEvidence: true } })).toBe(1);
    expect((await database.policy.findUniqueOrThrow({ where: { id: policy.id } })).currentHash).toBe(digest(referenceText));
    expect(await database.policyChange.count()).toBe(0);
    expect(await database.engineOutbox.count()).toBe(0);
  });
  it.each(['publish', 'observe'] as const)('holds missing middle content in %s even when transport claims eligibility', async mode => {
    await seed(true); await run(`middle-${mode}`, mode, referenceText.replace('The independent sample prohibits sharing private credentials.', ''));
    expect((await database.engineReview.findFirstOrThrow()).reasonsJson).toContain('completeness_reference_units_missing');
    expect(await database.policySnapshot.count()).toBe(0);
    expect(await database.policyChange.count()).toBe(0);
    expect(modelForbidden).not.toHaveBeenCalled();
  });
  it('cannot turn an uncovered high-impact review into publication with human approval', async () => {
    await seed(); await run('manual-gate', 'publish');
    const review = await database.engineReview.findFirstOrThrow();
    const payload = JSON.parse(review.payloadJson);
    const oldArtifactId = await store.putArtifact(structureDocument(referenceText));
    payload.checkpoint = { observation: payload.observation, oldArtifactId };
    await database.engineReview.update({ where: { id: review.id }, data: { reasonsJson: '["high_impact_review_required"]', payloadJson: JSON.stringify(payload) } });
    await expect(pipeline.approveReview(review.id, 'Attempted synthetic human approval cannot waive missing coverage.', 'synthetic-admin')).rejects.toThrow('source_coverage_not_qualified');
    expect((await database.engineReview.findUniqueOrThrow({ where: { id: review.id } })).status).toBe('pending');
    expect(await database.policySnapshot.count()).toBe(0);
    expect(await database.policyChange.count()).toBe(0);
    expect(await database.engineOutbox.count()).toBe(0);
  });
});
