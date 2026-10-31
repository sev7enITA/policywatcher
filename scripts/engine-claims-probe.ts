/** Bounded real-model evaluation on fixed synthetic documents; no database or publication. */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { structureDocument, compareDocuments } from '../src/lib/engine/document';
import { liveAnalysis, engineModelPair, validateClaims, validateVerification, validateModelPair, CLAIM_SCHEMA, type ClaimSet } from '../src/lib/engine/claims';

async function main() {
  const out = resolve(process.argv[2] || '');
  const models = engineModelPair();
  if (!out.startsWith(resolve('output') + '/') || !process.env.GEMINI_API_KEY
      || process.env.POLICYWATCHER_ENGINE_PUBLICATION === '1' || process.env.POLICYWATCHER_ENGINE_NOTIFICATIONS === '1') {
    throw new Error('isolated_probe_configuration_required');
  }
  const corpusBytes = await readFile('evals/engine-v6/claims-corpus.json', 'utf8');
  const corpus = JSON.parse(corpusBytes) as { version: string; cases: Array<{ id: string; old: string; next: string; expectation: string; unsupportedEn?: string; unsupportedIt?: string }> };
  if (corpus.cases.length > 6 || corpus.cases.some(c => c.old.length + c.next.length > 6000)) throw new Error('probe_budget_exceeded');
  await mkdir(out, { recursive: false });
  const rows: Record<string, unknown>[] = [];
  const startedAt = new Date().toISOString();
  let stopped = false;
  for (const c of corpus.cases) {
    const old = structureDocument(c.old), next = structureDocument(c.next);
    const input = { old, next, deltas: compareDocuments(old, next).deltas };
    const row: Record<string, unknown> = { id: c.id, expectation: c.expectation, startedAt: new Date().toISOString() };
    try {
      const analysis = await liveAnalysis.analyze(input);
      row.analysis = analysis;
      const validation = validateClaims(analysis.value, input);
      row.validation = validation;
      if (validation.claims && !validation.reasons.length) {
        const verification = await liveAnalysis.verify(input, validation.claims);
        row.verification = verification;
        row.verificationReasons = [...validateVerification(verification.value, validation.claims), ...validateModelPair(analysis.receipt, verification.receipt)];
      }
      if (c.unsupportedEn && c.unsupportedIt) {
        // Full exact old/new quotes deliberately accompany a FALSE interpretation.
        // This checks entailment, not just the presence of matching quotations.
        const unsupported: ClaimSet = { schema: CLAIM_SCHEMA, claims: [{ id: 'false-claim', operation: 'modified', category: 'content', impact: 3,
          textEn: c.unsupportedEn, textIt: c.unsupportedIt, deltaIds: input.deltas.map(d => d.id), evidence: [
            { side: 'old', documentHash: old.hash, start: 0, end: old.text.length, quote: old.text },
            { side: 'new', documentHash: next.hash, start: 0, end: next.text.length, quote: next.text },
          ] }] };
        const result = await liveAnalysis.verify(input, unsupported);
        row.negativeControl = { claims: unsupported, structuralGate: validateClaims(unsupported, input), result,
          rejected: validateVerification(result.value, unsupported).length > 0 };
      }
    } catch (error) {
      // Do not persist SDK messages, request objects or keys.
      const status = typeof error === 'object' && error !== null && 'status' in error ? Number(error.status) : null;
      const internalCode = error instanceof Error && /^analysis_[a-z_]+$/.test(error.message) ? error.message : null;
      const networkFailure = error instanceof Error && /fetch failed|network|timeout|timed out/i.test(error.message);
      row.error = { code: status ? `provider_http_${status}` : internalCode || (networkFailure ? 'model_transport_failure' : 'model_or_response_failure') };
      stopped = true;
    }
    row.finishedAt = new Date().toISOString(); rows.push(row);
    await writeFile(join(out, 'results.json'), JSON.stringify({ corpus: corpus.version, startedAt, finishedAt: new Date().toISOString(),
      boundary: 'Real model calls over fixed synthetic fixtures; no live policy retrieval, database, publication or delivery. No automatic promotion. Outputs require semantic review.',
      configuredAnalyst: models.analyst, configuredVerifier: models.verifier, stopped, rows }, null, 2));
    console.log(JSON.stringify({ id: c.id, error: row.error, validationReasons: validationReasons(row), verifierReasons: row.verificationReasons,
      negativeRejected: (row.negativeControl as { rejected?: boolean } | undefined)?.rejected }));
    if (stopped) break;
  }
  if (stopped) process.exitCode = 2;
}
function validationReasons(row: Record<string, unknown>) { return (row.validation as { reasons?: string[] } | undefined)?.reasons; }
void main().catch(() => { console.error('claims_probe_failed'); process.exitCode = 1; });
