/** Offline falsification of exact r3 functions. No network, inference or database operations. */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, join } from 'node:path';
import { digest, structureDocument, compareDocuments, type SourceContract } from '../src/lib/engine/document';
import { extractEngineBody, assessCapture } from '../src/lib/engine/acquisition';
import { CLAIM_SCHEMA, validateClaims, validateVerification, type ClaimSet } from '../src/lib/engine/claims';

const out = resolve(process.argv[2] || '');
if (!out.startsWith(resolve('output') + '/')) throw new Error('output_directory_required');
mkdirSync(out, { recursive: false });
const sourceUrl = 'https://example.com/privacy';
const terminal = 'Contact our privacy team for information about this policy and your rights.';
const contract: SourceContract = { schemaVersion: 1, sourceUrl, titleAliases: ['Privacy Policy'], requiredHeadings: ['Data use', 'Contact'], terminalText: terminal, language: 'en', minimumChars: 100, maximumChars: 500000, preferredTransport: 'direct', reviewedAt: '2026-11-07T00:00:00Z', reviewNote: 'Authored synthetic diagnostic reference, not an approved provider source.' };
const wrap = (body: string) => `<html lang="en"><main><h1>Privacy Policy</h1><h2>Data use</h2>${body}<h2>Contact</h2><p>${terminal}</p></main></html>`;
type Fixture = { id: string; html: string; units: string[]; requireHold?: boolean; limitation?: string };
const fixtures: Fixture[] = [
  { id: 'inline-condition', html: wrap('<div>We share <strong>account records</strong> only <span>with your consent.</span></div>'), units: ['We share account records only with your consent.'] },
  { id: 'duplicate-occurrences', html: wrap('<p>You can request deletion.</p><p>You can request deletion.</p>'), units: ['You can request deletion.', 'You can request deletion.'] },
  { id: 'nested-list-order', html: wrap('<ul><li>We retain records:<ul><li>30 days for closed accounts.</li></ul>Except where a court orders preservation.</li></ul>'), units: ['We retain records:', '30 days for closed accounts.', 'Except where a court orders preservation.'] },
  { id: 'native-disclosure', html: wrap('<details><summary>Children exception</summary><p>We never use children data for training.</p></details>'), units: ['Children exception', 'We never use children data for training.'] },
  { id: 'aria-disclosure', html: wrap('<button aria-expanded="false" aria-controls="retention">Retention</button><div id="retention" hidden><p>We delete data after 30 days.</p></div>'), units: ['We delete data after 30 days.'] },
  { id: 'table-caption-context', html: wrap('<table><caption>Adults only</caption><tr><th>Purpose</th><th>Default</th></tr><tr><td>Training</td><td>No</td></tr><tr><td>Service</td><td>Yes</td></tr></table>'), units: ['Adults only', '| Purpose | Default |', '| Training | No |', '| Service | Yes |'] },
  { id: 'table-rowspan-context', html: wrap('<table><tr><th>Group</th><th>Purpose</th><th>Default</th></tr><tr><td rowspan="2">Children</td><td>Service</td><td>Yes</td></tr><tr><td>Training</td><td>No</td></tr></table>'), units: ['Children', 'Service', 'Training'], requireHold: true, limitation: 'Without explicit expanded cell associations, row-spanning semantics require a hold.' },
  { id: 'unlinked-hidden-clause', html: wrap('<p>We retain support logs for 30 days.</p><div hidden>Unless a court orders preservation for seven years.</div>'), units: ['We retain support logs for 30 days.'], requireHold: true },
  { id: 'policy-aside', html: wrap('<p>We retain support logs for 30 days.</p><aside>Except when you request earlier deletion.</aside>'), units: ['We retain support logs for 30 days.'], requireHold: true },
  { id: 'external-annex', html: wrap('<p>The <a href="/retention.pdf">retention annex</a> is an integral part of this policy.</p>'), units: ['retention annex'], requireHold: true, limitation: 'The annex bytes are absent. Text/link retention alone cannot qualify the composite document.' },
  { id: 'unicode-qualifier', html: wrap('<p>🔒 We keep café records for 30 days, unless you ask for deletion.</p>'), units: ['We keep', 'records for 30 days, unless you ask for deletion.'] },
];
const extraction = fixtures.map(f => {
  const htmlHash = digest(f.html);
  writeFileSync(join(out, `${f.id}.html`), f.html, { flag: 'wx' });
  try {
    const body = extractEngineBody(f.html, sourceUrl); const assessment = assessCapture(body, contract, sourceUrl);
    writeFileSync(join(out, `${f.id}.txt`), body.document.text, { flag: 'wx' });
    let cursor = 0;
    const occurrences = f.units.map(unit => { const at = body.document.text.indexOf(unit, cursor); if (at >= 0) cursor = at + unit.length; return { unit, at, foundInOrder: at >= 0 }; });
    const passed = occurrences.every(x => x.foundInOrder) && (f.requireHold ? !assessment.eligible : assessment.eligible);
    return { id: f.id, htmlHash, textHash: body.document.hash, expected: f.requireHold ? 'hold' : 'eligible_with_all_units', limitation: f.limitation, occurrences, assessment, passed };
  } catch (error) { return { id: f.id, htmlHash, expected: f.requireHold ? 'hold' : 'eligible_with_all_units', passed: false, error: error instanceof Error ? error.message : 'unknown' }; }
});
const corpusBytes = readFileSync('evals/engine-v6/claims-corpus.json', 'utf8');
const base = JSON.parse(corpusBytes).cases as Array<{ id: string; old: string; next: string; unsupportedEn?: string; unsupportedIt?: string }>;
const semanticCases = base.filter(c => c.unsupportedEn).map(c => ({ id: c.id, old: c.old, next: c.next, en: c.unsupportedEn!, it: c.unsupportedIt! }));
semanticCases.push(
  { id: 'numeric-trigger', old: '# Privacy\n\nWe retain records for 30 days after closure.', next: '# Privacy\n\nWe retain records for 60 days after closure.', en: 'Records are retained for 60 days after collection.', it: 'I dati vengono conservati per 60 giorni dalla raccolta.' },
  { id: 'translation-divergence', old: '# Privacy\n\nWe retain records for 30 days.', next: '# Privacy\n\nWe retain records for 60 days.', en: 'Retention changes from 30 to 60 days.', it: 'Il periodo di conservazione resta invariato a 30 giorni.' },
  { id: 'encryption-inference', old: '# Security\n\nWe encrypt data in transit using TLS 1.2.', next: '# Security\n\nWe encrypt data in transit using TLS 1.3.', en: 'All stored data is now encrypted at rest.', it: 'Tutti i dati archiviati sono ora cifrati a riposo.' },
);
const semantic = semanticCases.map(c => {
  const old = structureDocument(c.old), next = structureDocument(c.next), deltas = compareDocuments(old, next).deltas;
  const claims: ClaimSet = { schema: CLAIM_SCHEMA, claims: [{ id: c.id, operation: 'modified', category: 'content', impact: 3, textEn: c.en, textIt: c.it, deltaIds: deltas.map(d => d.id), evidence: [
    { side: 'old', documentHash: old.hash, start: 0, end: old.text.length, quote: old.text },
    { side: 'new', documentHash: next.hash, start: 0, end: next.text.length, quote: next.text },
  ] }] };
  return { id: c.id, authoredTruth: 'unsupported', old, next, claims, structural: validateClaims(claims, { old, next, deltas }), injectedVerifierControls: ['unsupported', 'uncertain', 'supported'].map(verdict => ({ verdict, reasons: validateVerification({ verdicts: [{ claimId: c.id, verdict, reason: 'Injected diagnostic verdict, not model inference.' }] }, claims) })), liveVerifier: 'not_executed' };
});
const sectionOld = structureDocument('# Privacy\n\n## Adults\n\nWe use data for training.\n\n## Children');
const sectionNext = structureDocument('# Privacy\n\n## Children\n\nWe use data for training.\n\n## Adults');
const sectionMove = { old: sectionOld, next: sectionNext, comparison: compareDocuments(sectionOld, sectionNext), expected: 'section_context_changes_must_be_exposed_to_semantic_review' };
const result = { observedAt: new Date().toISOString(), sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), implementationHash: '84085328fffc7b22fac33cc2cbe150120c540b75deda59d3b207c32b768a9a00', fixtureHash: digest(JSON.stringify(fixtures)), priorSemanticCorpusHash: digest(corpusBytes), harnessHash: digest(readFileSync('scripts/engine-o2-diagnostics.ts', 'utf8')), boundary: 'Authored offline fixtures; actual r3 extraction/diff/validators. No network/model/database calls. Injected verifier verdicts are control-flow diagnostics, not accuracy evidence.', extraction, semantic, sectionMove, qualification: { sourceCompleteness: 'not_qualified', semanticAccuracy: 'not_qualified', capacity500PerDay: 'not_run_prerequisites_unsatisfied' } };
writeFileSync(join(out, 'report.json'), JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ extraction: extraction.map(r => ({ id: r.id, passed: r.passed })), structuralFalseClaimsAccepted: semantic.filter(r => !r.structural.reasons.length).map(r => r.id), sectionMove: sectionMove.comparison, qualification: result.qualification }, null, 2));
