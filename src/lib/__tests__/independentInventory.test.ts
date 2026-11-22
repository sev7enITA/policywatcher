import { describe, expect, it, vi, afterEach } from 'vitest';
import { createHash } from 'node:crypto';
import { digest, structureDocument, type SourceContract } from '../engine/document';
import { assessCoverage, coverageInventoryDigest, coverageScopeId, observedCoverageUnits, observedCoverageSequenceDigest,
  parseCoverageInventory, publicationCoverageSatisfied, type AttachmentCapture, type CoverageEvidence, type ReviewedCoverageInventory } from '../engine/coverage';
import { reviewedFixture } from './fixtures/independentCoverage';
import type { TransportProof } from '../scraper';

const mainUrl = 'https://example.org/terms';
const attachmentUrl = 'https://example.org/annex';
const clause = 'The supplier must preserve each original receipt for seven years.';
const mainText = '# Terms\n\n## Records\n\n' + clause + '\n\n' + clause + '\n\n## Fees\n\n| Basic | 100 |\n\n| Pro | 200 |\n\n## Contact\n\nContact the independent records owner for further details.';
const annexText = '# Records annex\n\nThe records annex defines the separately reviewed seven year retention schedule and the mandatory receipt preservation workflow for every service.';
const annexHtml = '<html lang="en"><main><h1>Records annex</h1><p>The records annex defines the separately reviewed seven year retention schedule and the mandatory receipt preservation workflow for every service.</p></main></html>';
const bytes = Buffer.from(annexHtml);
const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');
function legacy(text = mainText, sourceUrl = mainUrl): ReviewedCoverageInventory {
  const reference = structureDocument(text);
  const scope = { sourceUrl, language: 'en' as const, referenceVersion: 'separate-reference-1' };
  const body = { schemaVersion: 1 as const, scope, scopeId: coverageScopeId(scope),
    reference: { method: 'independent_capture' as const, url: sourceUrl, sha256: digest(text),
      capturedAt: '2026-11-22T10:00:00Z', reviewedAt: '2026-11-22T10:10:00Z', reviewNote: 'Separately retained synthetic reference reviewed before the candidate.' },
    units: observedCoverageUnits(reference), sequenceSha256: observedCoverageSequenceDigest(reference) };
  return { ...body, inventorySha256: coverageInventoryDigest(body) };
}
function inventory(attachment = false) {
  const { inventorySha256: ignored, ...base } = legacy(); void ignored;
  const v2 = reviewedFixture(base);
  if (attachment) v2.attachments = [{ id: 'annex-1', url: attachmentUrl, mediaType: 'text/html', bytesSha256: sha(bytes), linkOccurrences: 1, coverage: legacy(annexText, attachmentUrl) }];
  return seal(v2);
}
function seal(reference: ReviewedCoverageInventory) {
  if (reference.schemaVersion === 2) reference.links = (reference.attachments || []).map(a => ({ url: a.url, occurrences: a.linkOccurrences, purpose: 'attachment' as const }));
  const { inventorySha256: ignored, ...body } = reference; void ignored;
  return { ...body, inventorySha256: coverageInventoryDigest(body) };
}
const proof: TransportProof = { schemaVersion: 1, scope: 'origin_response', protocol: 'http1', byteRepresentation: 'encoded',
  receivedBytes: bytes.length, declaredContentLength: bytes.length, streamEnd: 'observed', framing: 'complete',
  lengthCheck: 'matched', decoding: 'completed', entityCompleteness: 'not_proven' };
function captured(): AttachmentCapture {
  return { url: attachmentUrl, finalUrl: attachmentUrl, status: 200, mediaType: 'text/html', bytesBase64: bytes.toString('base64'), extractionIssues: [],
    document: structureDocument(annexText), language: 'en', transportProof: { ...proof } };
}
const evidence = (): CoverageEvidence => ({ captureId: 'actual-candidate-capture', attachmentLinks: { [attachmentUrl]: 1 }, attachments: [captured()] });
const assess = (ref = inventory(), ev: CoverageEvidence = { captureId: 'actual-candidate-capture', attachmentLinks: {} }, text = mainText) => assessCoverage(structureDocument(text), ref, mainUrl, 'en', ev);

describe('independent expected-content inventory', () => {
  it('keeps the old reviewed block reference observable but blocks its publication', () => {
    const coverage = assess(legacy());
    expect(coverage.state).toBe('matched_reviewed_reference');
    expect(coverage.detail.state).toBe('not_configured');
    expect(publicationCoverageSatisfied({ eligible: true, coverage })).toBe(false);
  });
  it('counts every section, clause occurrence and table row against the separate reference', () => {
    const coverage = assess();
    expect(coverage.detail).toMatchObject({ state: 'matched_reviewed_inventory', independence: 'reviewer_attested',
      expectedSections: 4, expectedClauses: 3, expectedTableRows: 2, missingSections: 0, missingClauses: 0, missingTableRows: 0, expectedAttachments: 0 });
    expect(publicationCoverageSatisfied({ eligible: true, coverage })).toBe(true);
    expect(coverage.referenceOriginVerified).toBe(false); expect(coverage.sourceCompletenessQualified).toBe(false);
  });
  it.each([undefined, 'reference-fixture-capture'])('holds missing or self-reference candidate identity %s', captureId => {
    expect(assess(inventory(), { captureId }).detail.state).toBe('mismatch');
  });
  it.each([
    ['clause', mainText.replace(clause + '\n\n', ''), 'missingClauses'],
    ['table row', mainText.replace('| Pro | 200 |\n\n', ''), 'missingTableRows'],
    ['section', mainText.replace('## Fees\n\n', ''), 'missingSections'],
  ])('finds missing %s with exact denominators', (_name, text, missing) => {
    const coverage = assess(inventory(), undefined, text);
    expect(coverage.state).toBe('mismatch'); expect(coverage.detail[missing as 'missingClauses']).toBeGreaterThan(0);
  });
  it('holds a new or changed link even when all visible document text is unchanged', () => {
    const coverage = assess(inventory(), { captureId: 'actual-candidate-capture', attachmentLinks: { 'https://example.org/new-annex.pdf': 1 } });
    expect(coverage.detail.linkState).toBe('mismatch'); expect(coverage.detail.unexpectedLinks).toBe(1);
    expect(publicationCoverageSatisfied({ eligible: true, coverage })).toBe(false);
  });
  it('requires a declared link census even when it is intentionally empty', () => {
    expect(assess(inventory(), { captureId: 'actual-candidate-capture' }).detail.linkState).toBe('mismatch');
  });
  it('rejects a v2 inventory without an element for every base group', () => {
    const ref = inventory(); ref.elements!.pop();
    expect(() => parseCoverageInventory(seal(ref))).toThrow('invalid_independent_content_inventory');
  });
  it('rejects a well-hashed element that does not bind the declared reference', () => {
    const ref = inventory(); ref.elements![0].textSha256 = 'a'.repeat(64);
    expect(() => parseCoverageInventory(seal(ref))).toThrow('expected_element_not_bound_to_reference');
  });
  it('recomputes blocks from frozen text so forged complete blocks cannot hide a missing clause', () => {
    const document = structureDocument(mainText.replace(clause + '\n\n', ''));
    document.blocks = structureDocument(mainText).blocks;
    const result = assessCoverage(document, inventory(), mainUrl, 'en', { captureId: 'actual-candidate-capture', attachmentLinks: {} });
    expect(result.state).toBe('mismatch'); expect(result.reasons).toContain('retained_document_structure_mismatch');
    expect(result.detail.missingClauses).toBe(1);
  });
  it('rejects a false independence attestation and duplicate attachment identities', () => {
    const ref = inventory(true); (ref.independence as unknown as { independentOfCandidate: boolean }).independentOfCandidate = false;
    expect(() => parseCoverageInventory(seal(ref))).toThrow();
    const duplicate = inventory(true); duplicate.attachments!.push(structuredClone(duplicate.attachments![0]));
    expect(() => parseCoverageInventory(seal(duplicate))).toThrow();
  });
  it('accepts an attachment only with exact link, full origin capture, byte digest and text coverage', () => {
    const coverage = assess(inventory(true), evidence());
    expect(coverage.detail).toMatchObject({ state: 'matched_reviewed_inventory', expectedAttachments: 1, matchedAttachments: 1,
      attachments: [{ id: 'annex-1', state: 'matched', reasons: [] }] });
  });
  it.each([
    ['missing link', (e: CoverageEvidence) => { e.attachmentLinks = {}; }],
    ['duplicate link', (e: CoverageEvidence) => { e.attachmentLinks![attachmentUrl] = 2; }],
    ['missing capture', (e: CoverageEvidence) => { e.attachments = []; }],
    ['duplicate capture', (e: CoverageEvidence) => { e.attachments!.push(captured()); }],
    ['malformed base64', (e: CoverageEvidence) => { e.attachments![0].bytesBase64 = '%%%='; }],
    ['oversized bytes', (e: CoverageEvidence) => { e.attachments![0].bytesBase64 = Buffer.alloc(1_000_001).toString('base64'); }],
    ['wrong bytes', (e: CoverageEvidence) => { e.attachments![0].bytesBase64 = Buffer.from('truncated').toString('base64'); }],
    ['incomplete text', (e: CoverageEvidence) => { e.attachments![0].document = structureDocument('# Records annex\n\nIncomplete.'); }],
    ['wrong language', (e: CoverageEvidence) => { e.attachments![0].language = 'it'; }],
    ['origin redirect', (e: CoverageEvidence) => { e.attachments![0].finalUrl += '/changed'; }],
    ['partial response', (e: CoverageEvidence) => { e.attachments![0].status = 206; }],
    ['uncertain extraction', (e: CoverageEvidence) => { e.attachments![0].extractionIssues = ['removed_document_content_unreviewed']; }],
    ['unknown framing', (e: CoverageEvidence) => { e.attachments![0].transportProof!.framing = 'unknown'; }],
    ['renderer API proof', (e: CoverageEvidence) => { e.attachments![0].transportProof!.scope = 'renderer_api_response'; }],
  ])('holds an attachment with %s', (_name, mutate) => {
    const ev = evidence(); mutate(ev);
    const coverage = assess(inventory(true), ev);
    expect(coverage.detail.state).toBe('mismatch'); expect(coverage.detail.matchedAttachments).toBe(0);
    expect(publicationCoverageSatisfied({ eligible: true, coverage })).toBe(false);
  });
});

// Storage substitutes keep these acquisition checks offline; bytes and extraction remain real.
const stored = vi.hoisted(() => ({ bodies: [] as unknown[] }));
vi.mock('../db', () => ({ db: { engineHttpCache: { findUnique: vi.fn(async () => null) } } }));
vi.mock('../engine/store', () => ({ DAILY_MS: 86400000, putArtifact: vi.fn(async (body: unknown) => { stored.bodies.push(structuredClone(body)); return digest(JSON.stringify(body)); }), readArtifact: vi.fn() }));
import { acquire, extractEngineBody, assessCapture, expectedAttachmentLinks } from '../engine/acquisition';
import type { TaskInput } from '../engine/store';
const mainHtml = '<html lang="en"><main><h1>Terms</h1><h2>Records</h2><p>' + clause + '</p><p>' + clause + '</p><h2>Fees</h2><table><tr><td>Basic</td><td>100</td></tr><tr><td>Pro</td><td>200</td></tr></table><h2>Contact</h2><p>Contact the independent records owner for further details.</p><p><a href="/annex">Records annex</a></p></main></html>';
function input(): TaskInput {
  const ref = legacy(extractEngineBody(mainHtml, mainUrl).document.text);
  const { inventorySha256: ignored, ...base } = ref; void ignored;
  const expected = reviewedFixture(base); expected.attachments = inventory(true).attachments;
  const contract: SourceContract = { schemaVersion: 1, sourceUrl: mainUrl, language: 'en', titleAliases: ['Terms'], requiredHeadings: ['Records','Fees','Contact'],
    terminalText: 'Contact the independent records owner for further details.', minimumChars: 100, maximumChars: 500000,
    preferredTransport: 'direct', reviewedAt: '2026-11-22T10:10:00Z', reviewNote: 'Separately reviewed synthetic transport test.', completenessInventory: seal(expected) };
  return { sourceUrl: mainUrl, contract, profileHash: digest('profile'), contractHash: digest(JSON.stringify(contract)), forceFresh: true } as TaskInput;
}
const rootTransport = vi.fn(async () => ({ ok: true, html: mainHtml, status: 200, finalUrl: mainUrl, error: '' }));
const attachmentTransport = vi.fn(async () => ({ bytes, html: annexHtml, status: 200, finalUrl: attachmentUrl, mediaType: 'text/html', language: 'en', transportProof: proof }));
afterEach(() => { vi.clearAllMocks(); stored.bodies.length = 0; });
describe('bounded attachment acquisition and retained evidence', () => {
  it('counts links only in the exact fragment scope and rejects ambiguous targets', () => {
    const contract = input().contract!; const scoped = mainUrl + '#part';
    expect(expectedAttachmentLinks('<main><a href="/outside">Outside</a><section id="part"><a href="/annex">Annex</a></section></main>', scoped, contract)).toEqual({ [attachmentUrl]: 1 });
    expect(expectedAttachmentLinks('<main><section id="part"></section><section id="part"></section></main>', scoped, contract)).toHaveProperty('unresolved_fragment_scope', 1);
  });
  it('fetches and preserves original entity bytes plus independently checked extraction', async () => {
    const result = await acquire(input(), rootTransport, attachmentTransport);
    expect(result.eligible).toBe(true); expect(result.coverage?.detail.matchedAttachments).toBe(1);
    expect(attachmentTransport).toHaveBeenCalledTimes(1);
    const body = stored.bodies[0] as Parameters<typeof assessCapture>[0];
    expect(body.attachments![0].bytesBase64).toBe(bytes.toString('base64'));
    expect(assessCapture(body, input().contract, mainUrl).coverage.detail.state).toBe('matched_reviewed_inventory');
  });
  it('does not multiply failed attachment requests across root fallbacks', async () => {
    const failing = vi.fn(async () => { throw new Error('PRIVATE_FAILURE_CANARY'); });
    const result = await acquire(input(), rootTransport, failing);
    expect(failing).toHaveBeenCalledTimes(1); expect(result.eligible).toBe(false);
    expect(result.reasons).toContain('attachment_capture_failed'); expect(JSON.stringify(stored.bodies)).not.toContain('PRIVATE_FAILURE_CANARY');
  });
  it('holds cross-origin attachments without issuing an unleased request', async () => {
    const value = input(); const ref = value.contract!.completenessInventory!;
    ref.attachments![0].url = 'https://cdn.example.net/annex'; ref.attachments![0].coverage.scope.sourceUrl = 'https://cdn.example.net/annex';
    ref.attachments![0].coverage.scopeId = coverageScopeId(ref.attachments![0].coverage.scope);
    ref.attachments![0].coverage = seal(ref.attachments![0].coverage); value.contract!.completenessInventory = seal(ref);
    const result = await acquire(value, rootTransport, attachmentTransport);
    expect(attachmentTransport).not.toHaveBeenCalled(); expect(result.reasons).toContain('attachment_cross_origin_requires_dedicated_acquisition');
  });
});
