/** Bounded synthetic semantic trial of unchanged r3. No hosted DB or publication. */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { homedir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { digest, structureDocument, compareDocuments } from '../src/lib/engine/document';
import { liveAnalysis, validateClaims, validateVerification, validateModelPair, type ClaimSet, type AnalysisInput } from '../src/lib/engine/claims';

type Fixture = { id: string; old: string; next: string; expectation: string; unsupportedEn?: string; unsupportedIt?: string };
async function main() {
const out = resolve(process.argv[2] || '');
if (!out.startsWith(resolve('output') + '/')) throw new Error('isolated_output_required');
const analyst = 'gemini-3.5-flash-lite', verifier = 'gemini-3.8-flash';
const manifest = JSON.parse(readFileSync('src/lib/engineImplementation.generated.json', 'utf8'));
if (manifest.hash !== '84085328fffc7b22fac33cc2cbe150120c540b75deda59d3b207c32b768a9a00') throw new Error('candidate_mismatch');
execFileSync(process.execPath, ['scripts/engine-implementation-manifest.mjs', '--check']);
const sourceBytes = readFileSync('evals/engine-v6/claims-corpus.json', 'utf8');
const positives = JSON.parse(sourceBytes).cases as Fixture[];
const negatives: Fixture[] = positives.filter(c => c.unsupportedEn).concat([
  { id: 'numeric-trigger', old: '# Privacy\n\nWe retain records for 30 days after closure.', next: '# Privacy\n\nWe retain records for 60 days after closure.', expectation: 'Reject: trigger is closure, not collection.', unsupportedEn: 'Records are retained for 60 days after collection.', unsupportedIt: 'I dati vengono conservati per 60 giorni dalla raccolta.' },
  { id: 'translation-divergence', old: '# Privacy\n\nWe retain records for 30 days.', next: '# Privacy\n\nWe retain records for 60 days.', expectation: 'Reject: Italian contradicts both the English claim and the source change.', unsupportedEn: 'Retention changes from 30 to 60 days.', unsupportedIt: 'Il periodo di conservazione resta invariato a 30 giorni.' },
  { id: 'encryption-inference', old: '# Security\n\nWe encrypt data in transit using TLS 1.2.', next: '# Security\n\nWe encrypt data in transit using TLS 1.3.', expectation: 'Reject: transport encryption does not establish encryption at rest.', unsupportedEn: 'All stored data is now encrypted at rest.', unsupportedIt: 'Tutti i dati archiviati sono ora cifrati a riposo.' },
]);
const plan = { schema: 'pw-o2-live-wave-1', implementation: manifest.hash, analyst, verifier, sourceCorpusHash: digest(sourceBytes),
  positives, negatives, maxGenerationAttempts: 18, minimumModelIntervalMs: 15000,
  boundary: 'Authored synthetic references, six analyst cases plus six deliberately false claims. Real Google SDK inference and unchanged r3 validators. No source fetch, database, observation day, hosted configuration or capacity claim. No retries or model fallback. Any quota error stops the remaining calls.' };
const planText = JSON.stringify(plan, null, 2) + '\n';
if (process.argv.includes('--prepare')) {
  mkdirSync(out, { recursive: false });
  writeFileSync(join(out, 'plan.json'), planText, { flag: 'wx' });
  console.log(JSON.stringify({ prepared: true, planHash: digest(planText), positives: positives.length, negatives: negatives.length, maxGenerationAttempts: 18 }));
} else if (process.argv.includes('--run')) {
  if (readFileSync(join(out, 'plan.json'), 'utf8') !== planText) throw new Error('plan_changed');
  if (process.env.O2_FREE_TIER_CONFIRMED !== '1') throw new Error('free_tier_confirmation_required');
  writeFileSync(join(out, 'started.json'), JSON.stringify({ at: new Date().toISOString(), planHash: digest(planText), harnessHash: digest(readFileSync('scripts/engine-o2-live-wave.ts', 'utf8')) }), { flag: 'wx' });
  const config = Object.fromEntries(readFileSync(join(homedir(), '.config/policywatcher/o2-free-qa.env'), 'utf8').trim().split('\n').map(line => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1)]));
  if (config.GOOGLE_CLOUD_PROJECT !== 'gen-lang-client-0064897471' || !config.GEMINI_API_KEY) throw new Error('dedicated_project_required');
  process.env.GEMINI_API_KEY = config.GEMINI_API_KEY;
  process.env.POLICYWATCHER_ENGINE_ANALYST_MODEL = analyst;
  process.env.POLICYWATCHER_ENGINE_VERIFIER_MODEL = verifier;
  process.env.POLICYWATCHER_ENGINE_PUBLICATION = '0'; process.env.POLICYWATCHER_ENGINE_NOTIFICATIONS = '0';
  const redact = (value: string) => value.replaceAll(config.GEMINI_API_KEY, '[REDACTED]');
  const originalFetch = globalThis.fetch;
  let sequence = 0, generations = 0, stopped = false;
  let currentCase = '';
  const sent = new Set<string>(), last = new Map<string, number>();
  globalThis.fetch = async (input, init) => {
    if (stopped) throw new Error('campaign_stopped');
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
    if (url.hostname !== 'generativelanguage.googleapis.com') throw new Error('unexpected_api_origin');
    const body = typeof init?.body === 'string' ? init.body : input instanceof Request ? await input.clone().text() : '';
    if (!body) throw new Error('request_capture_unavailable');
    const requestHash = digest(url.pathname + body);
    if (sent.has(requestHash)) throw new Error('retry_not_permitted');
    sent.add(requestHash);
    const generation = url.pathname.endsWith(':generateContent');
    if (generation && ++generations > plan.maxGenerationAttempts) throw new Error('generation_budget_exceeded');
    if (generation) {
      const delay = plan.minimumModelIntervalMs - (Date.now() - (last.get(url.pathname) || 0));
      if (delay > 0) await new Promise(r => setTimeout(r, delay));
      last.set(url.pathname, Date.now());
    }
    const path = join(out, `http-${String(++sequence).padStart(3, '0')}.json`);
    const record: Record<string, unknown> = { case: currentCase, at: new Date().toISOString(), path: url.pathname, requestHash, requestBody: body };
    writeFileSync(path, redact(JSON.stringify(record, null, 2)));
    try {
      const response = await originalFetch(input, init);
      const responseText = await response.clone().text();
      Object.assign(record, { status: response.status, responseText, completedAt: new Date().toISOString() });
      if (response.status === 429 || response.status === 403) stopped = true;
      writeFileSync(path, redact(JSON.stringify(record, null, 2)) + '\n');
      return response;
    } catch (error) {
      Object.assign(record, { error: redact(String(error)), completedAt: new Date().toISOString() });
      writeFileSync(path, redact(JSON.stringify(record, null, 2)) + '\n'); throw error;
    }
  };
  const results: Array<Record<string, unknown>> = [];
  const makeInput = (c: Fixture): AnalysisInput => {
    const old = structureDocument(c.old), next = structureDocument(c.next);
    return { old, next, deltas: compareDocuments(old, next).deltas };
  };
  for (const [kind, cases] of [['negative', negatives], ['analyst', positives]] as const) {
    for (const c of cases) {
      currentCase = `${kind}-${c.id}`;
      const input = makeInput(c);
      const result: Record<string, unknown> = { id: currentCase, expectation: c.expectation, input, startedAt: new Date().toISOString() };
      try {
        if (stopped) throw new Error('not_attempted_campaign_stopped');
        if (kind === 'negative') {
          const claims: ClaimSet = { schema: 'pw-claims-1', claims: [{ id: c.id, operation: 'modified', category: 'content', impact: 3,
            textEn: c.unsupportedEn!, textIt: c.unsupportedIt!, deltaIds: input.deltas.map(d => d.id),
            evidence: [{ side: 'old', documentHash: input.old.hash, start: 0, end: input.old.text.length, quote: input.old.text },
              { side: 'new', documentHash: input.next.hash, start: 0, end: input.next.text.length, quote: input.next.text }] }] };
          result.claims = claims; result.structural = validateClaims(claims, input);
          const verification = await liveAnalysis.verify(input, claims);
          result.verification = verification; result.verificationReasons = validateVerification(verification.value, claims);
        } else {
          const analysis = await liveAnalysis.analyze(input);
          result.analysis = analysis;
          const structural = validateClaims(analysis.value, input); result.structural = structural;
          if (structural.claims && !structural.reasons.length) {
            const verification = await liveAnalysis.verify(input, structural.claims);
            result.verification = verification;
            result.verificationReasons = validateVerification(verification.value, structural.claims);
            result.modelPairReasons = validateModelPair(analysis.receipt, verification.receipt);
          } else result.verifierSkipped = 'r3_structural_hold';
        }
      } catch (error) { result.error = redact(String(error)); }
      result.completedAt = new Date().toISOString(); results.push(result);
      writeFileSync(join(out, `${currentCase}.json`), redact(JSON.stringify(result, null, 2)) + '\n', { flag: 'wx' });
      console.log(JSON.stringify({ id: currentCase, error: result.error, verificationReasons: result.verificationReasons, structuralReasons: (result.structural as { reasons?: string[] })?.reasons, verifierSkipped: result.verifierSkipped }));
    }
  }
  globalThis.fetch = originalFetch;
  writeFileSync(join(out, 'report.json'), redact(JSON.stringify({ completedAt: new Date().toISOString(), planHash: digest(planText), implementation: manifest.hash, generations, httpAttempts: sequence, stopped, results, qualification: 'open_pending_adjudication_and_remaining_gates' }, null, 2)) + '\n', { flag: 'wx' });
  execFileSync(process.execPath, ['scripts/engine-implementation-manifest.mjs', '--check']);
} else throw new Error('prepare_or_run_required');
}
main().catch(error => { console.error(error instanceof Error ? error.message : 'wave_failed'); process.exitCode = 1; });
