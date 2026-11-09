/** One lab workflow, real r3 functions and live models; no real source/time qualification. */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { homedir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { digest, type SourceContract } from '../src/lib/engine/document';
import type { AnalysisProvider } from '../src/lib/engine/claims';
import type { TaskInput } from '../src/lib/engine/store';

async function main() {
  const out = resolve(process.argv[2] || '');
  if (!out.startsWith(resolve('output') + '/') || process.env.O2_FREE_TIER_CONFIRMED !== '1') throw new Error('isolated_free_trial_required');
  execFileSync(process.execPath, ['scripts/engine-implementation-manifest.mjs', '--check']);
  const identity = JSON.parse(readFileSync('src/lib/engineImplementation.generated.json', 'utf8')).hash;
  if (identity !== '84085328fffc7b22fac33cc2cbe150120c540b75deda59d3b207c32b768a9a00') throw new Error('candidate_mismatch');
  mkdirSync(out, { recursive: false });
  process.env.DATABASE_URL = `file:${join(out, 'lab.db')}`;
  process.env.POLICYWATCHER_SCANS_PAUSED = '0';
  process.env.POLICYWATCHER_ENGINE_PUBLICATION = '0'; process.env.POLICYWATCHER_ENGINE_NOTIFICATIONS = '0';
  delete process.env.POLICYWATCHER_HOSTED_PREVIEW;
  const privateConfig = Object.fromEntries(readFileSync(join(homedir(), '.config/policywatcher/o2-free-qa.env'), 'utf8').trim().split('\n').map(line => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1)]));
  if (privateConfig.GOOGLE_CLOUD_PROJECT !== 'gen-lang-client-0064897471') throw new Error('dedicated_project_required');
  process.env.GEMINI_API_KEY = privateConfig.GEMINI_API_KEY;
  process.env.POLICYWATCHER_ENGINE_ANALYST_MODEL = 'gemini-3.5-flash-lite';
  process.env.POLICYWATCHER_ENGINE_VERIFIER_MODEL = 'gemini-3.8-flash';
  const save = (name: string, value: unknown) => writeFileSync(join(out, name), JSON.stringify(value, null, 2).replaceAll(privateConfig.GEMINI_API_KEY, '[REDACTED]') + '\n');
  writeFileSync(join(out, 'db-init.log'), execFileSync(process.execPath, ['scripts/hostinger-init-db.mjs'], { env: process.env, encoding: 'utf8' }));
  const { db } = await import('../src/lib/db');
  const store = await import('../src/lib/engine/store');
  const acquisition = await import('../src/lib/engine/acquisition');
  const { workerStep } = await import('../src/lib/engine/pipeline');
  const { liveAnalysis } = await import('../src/lib/engine/claims');
  const sourceUrl = 'https://example.com/privacy';
  const terminal = 'Contact the privacy team for information about this policy and your rights.';
  const html = (days: number) => `<html lang="en"><main><h1>Privacy Policy</h1><h2>Data use</h2><p>We keep account records for ${days} days after closure.</p><h2>Contact</h2><p>${terminal}</p></main></html>`;
  const oldBody = acquisition.extractEngineBody(html(30), sourceUrl);
  const contract: SourceContract = { schemaVersion: 1, sourceUrl, titleAliases: ['Privacy Policy'], requiredHeadings: ['Data use', 'Contact'], terminalText: terminal, language: 'en', minimumChars: 100, maximumChars: 500000, preferredTransport: 'direct', reviewedAt: new Date().toISOString(), reviewNote: 'Authored lab HTML, not a reviewed provider source.' };
  save('plan.json', { at: new Date().toISOString(), implementation: identity, contract, oldHtml: html(30), newHtml: html(60), maxGenerationAttempts: 2,
    boundary: 'Controlled synthetic transport, real extraction/assessment/worker/ledger; live SDK analyst and verifier. Candidate confirmation timer is explicitly rewound in this lab DB. No live source, elapsed observation day, hosted DB or publication.' });
  let analyzeCalls = 0, verifyCalls = 0, generationAttempts = 0, httpSequence = 0;
  const originalFetch = globalThis.fetch;
  const sent = new Set<string>();
  globalThis.fetch = async (input, init) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
    if (url.hostname !== 'generativelanguage.googleapis.com') throw new Error('network_origin_not_permitted');
    const body = typeof init?.body === 'string' ? init.body : input instanceof Request ? await input.clone().text() : '';
    if (!body) throw new Error('request_capture_unavailable');
    const key = digest(url.pathname + body);
    if (sent.has(key)) throw new Error('retry_not_permitted');
    sent.add(key);
    if (url.pathname.endsWith(':generateContent') && ++generationAttempts > 2) throw new Error('generation_budget_exceeded');
    const name = `http-${++httpSequence}.json`;
    const record: Record<string, unknown> = { at: new Date().toISOString(), path: url.pathname, requestBody: body };
    save(name, record);
    try {
      const response = await originalFetch(input, init);
      Object.assign(record, { status: response.status, responseText: await response.clone().text(), completedAt: new Date().toISOString() }); save(name, record); return response;
    } catch (error) { Object.assign(record, { error: String(error) }); save(name, record); throw error; }
  };
  try {
    const company = await db.company.create({ data: { name: 'O2 Lab Fixture', slug: 'o2-lab-fixture', website: 'https://example.com', industry: 'Technology' } });
    const policy = await db.policy.create({ data: { companyId: company.id, name: 'Privacy Policy', type: 'privacy', url: sourceUrl, currentText: oldBody.document.text, currentHash: oldBody.document.hash, lastCheckDate: new Date(0), lastSuccessfulCheckDate: new Date(0), snapshots: { create: { version: 1, text: oldBody.document.text, hash: oldBody.document.hash, publicEvidence: false } } } });
    const contractJson = JSON.stringify(contract);
    await db.engineSourceContract.create({ data: { policyId: policy.id, contractJson, contractHash: digest(contractJson), reviewedBy: 'synthetic-lab-reference' } });
    await db.extractionBaseline.create({ data: { policyId: policy.id, baselineHash: policy.currentHash, profileHash: store.engineExtractionProfileHash(sourceUrl), inputHash: digest(html(30)), input: html(30), sourceUrl, capturedAt: new Date() } });
    const before = { policy, snapshots: await db.policySnapshot.findMany(), baseline: await db.extractionBaseline.findMany() }; save('before.json', before);
    const analysis: AnalysisProvider = {
      async analyze(input) { if (++analyzeCalls > 1) throw new Error('analyst_retry_not_permitted'); const output = await liveAnalysis.analyze(input); save('analysis.json', { input, output }); return output; },
      async verify(input, claims) { if (++verifyCalls > 1) throw new Error('verifier_retry_not_permitted'); const output = await liveAnalysis.verify(input, claims); save('verification.json', { input, claims, output }); return output; },
    };
    const dependencies = { analysis, acquire: (input: TaskInput) => acquisition.acquire(input, async () => ({ ok: true, html: html(60), status: 200, finalUrl: sourceUrl, error: '' })) };
    const drain = async () => { for (let step = 0; step < 20; step++) if (!await workerStep(dependencies)) break; };
    await store.enqueueRun({ requestKey: 'o2-live-lab-first', mode: 'observe', requestedBy: 'lab', notificationMode: 'silent', limit: 1 }); await drain();
    const first = await db.engineTask.findFirstOrThrow({ where: { kind: 'policy' } }); save('first-task.json', first);
    if (JSON.parse(first.resultJson || '{}').outcome !== 'confirmation_pending') throw new Error('first_observation_did_not_reach_confirmation');
    const timerBefore = await db.enginePolicyState.findUniqueOrThrow({ where: store.stateKey(policy.id, 'observe') });
    await db.enginePolicyState.update({ where: store.stateKey(policy.id, 'observe'), data: { candidateObservedAt: new Date(Date.now() - store.CONFIRMATION_MS - 1000), nextDueAt: new Date(0) } });
    await db.engineOrigin.updateMany({ data: { nextAllowedAt: new Date(0) } });
    save('synthetic-timer-adjustment.json', { reason: 'Lab branch exercise only, zero elapsed qualification days.', before: timerBefore, after: await db.enginePolicyState.findUnique({ where: store.stateKey(policy.id, 'observe') }) });
    await store.enqueueRun({ requestKey: 'o2-live-lab-second', mode: 'observe', requestedBy: 'lab', notificationMode: 'silent', limit: 1 }); await drain();
    const after = { policy: await db.policy.findUniqueOrThrow({ where: { id: policy.id } }), snapshots: await db.policySnapshot.findMany(), baseline: await db.extractionBaseline.findMany() };
    save('after.json', after);
    const counts = { publicChanges: await db.policyChange.count(), outbox: await db.engineOutbox.count(), claims: await db.engineClaim.count(), evidence: await db.engineClaimEvidence.count() };
    const tasks = await db.engineTask.findMany(), runs = await db.engineRun.findMany(), ledger = await db.engineClaim.findMany({ include: { evidence: true } }), reviews = await db.engineReview.findMany();
    save('report.json', { completedAt: new Date().toISOString(), implementation: identity, analyzeCalls, verifyCalls, generationAttempts, counts, policyAndSnapshotsAndBaselineUnchanged: JSON.stringify(before) === JSON.stringify(after), runs, tasks, ledger, reviews, observationDaysAdded: 0, hostedChanges: false });
    console.log(JSON.stringify({ counts, analyzeCalls, verifyCalls, generationAttempts, policyAndSnapshotsAndBaselineUnchanged: JSON.stringify(before) === JSON.stringify(after), tasks: tasks.map(t => ({ stage: t.stage, status: t.status, result: t.resultJson, error: t.lastError })) }));
  } finally { globalThis.fetch = originalFetch; await db.$disconnect(); }
}
main().catch(error => { console.error(error instanceof Error ? error.message : 'integration_failed'); process.exitCode = 1; });
