import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { assessDocument, parseSourceContract, structureDocument, type SourceContract } from '../engine/document';
import { assessCoverage, coverageInventoryDigest, coverageScopeId, normalizeCoverageUnit, observedCoverageSequenceDigest, parseCoverageInventory, publicationCoverageSatisfied, type CoverageUnit, type ReviewedCoverageInventory } from '../engine/coverage';

const sourceUrl = 'https://example.org/terms#service';
const middle = 'A critical middle clause prohibits commercial resale without written approval.';
const repeated = 'The supplier retains responsibility for the defined service.';
const terminal = 'Contact the independent service owner for further information.';
const sectionBody = 'This required section contains a separately reviewed substantive obligation.';
const fullText = ['# Sample Terms', '## Use', middle, repeated, repeated, '- Review the applicable service scope.', '## Fees', '| Plan | Amount |', '| Standard | 100 |', '| Premium | 200 |', '## Empty', sectionBody, '## Contact', terminal].join('\n\n');
const sha = (s: string) => createHash('sha256').update(s).digest('hex');
function unit(kind: CoverageUnit['kind'], section: string[], text: string, occurrences = 1): CoverageUnit {
  return { kind, section, textSha256: sha(normalizeCoverageUnit(text)), occurrences };
}
/** Hand-authored expected fixture, not populated by reading extraction under test. */
function reference(): ReviewedCoverageInventory {
  const scope = { sourceUrl, language: 'en' as const, referenceVersion: 'publisher-reference-2026-11-22' };
  const body: Omit<ReviewedCoverageInventory, 'inventorySha256'> = {
    schemaVersion: 1, scope, scopeId: coverageScopeId(scope),
    reference: { method: 'manual_reference', url: 'https://publisher.example.org/archive/terms-v1', sha256: sha('reviewed publisher reference fixture'),
      capturedAt: '2026-11-22T10:00:00.000Z', reviewedAt: '2026-11-22T10:05:00.000Z', reviewNote: 'Synthetic independent manual reference; not a production qualification.' },
    sequenceSha256: observedCoverageSequenceDigest(structureDocument(fullText)),
    units: [unit('heading', ['Sample Terms'], '# Sample Terms'), unit('heading', ['Sample Terms', 'Use'], '## Use'),
      unit('paragraph', ['Sample Terms', 'Use'], middle), unit('paragraph', ['Sample Terms', 'Use'], repeated, 2),
      unit('list', ['Sample Terms', 'Use'], '- Review the applicable service scope.'), unit('heading', ['Sample Terms', 'Fees'], '## Fees'),
      unit('table', ['Sample Terms', 'Fees'], '| Plan | Amount |'), unit('table', ['Sample Terms', 'Fees'], '| Standard | 100 |'), unit('table', ['Sample Terms', 'Fees'], '| Premium | 200 |'),
      unit('heading', ['Sample Terms', 'Empty'], '## Empty'), unit('paragraph', ['Sample Terms', 'Empty'], sectionBody), unit('heading', ['Sample Terms', 'Contact'], '## Contact'),
      unit('paragraph', ['Sample Terms', 'Contact'], terminal)],
  };
  return { ...body, inventorySha256: coverageInventoryDigest(body) };
}
function contract(inventory?: ReviewedCoverageInventory): SourceContract {
  return { schemaVersion: 1, sourceUrl, titleAliases: ['Sample Terms'], requiredHeadings: ['Use', 'Empty', 'Contact'], terminalText: terminal,
    language: 'en', minimumChars: 100, maximumChars: 500_000, preferredTransport: 'direct', reviewedAt: '2026-11-22T10:05:00Z',
    reviewNote: 'Synthetic scoped source contract for coverage tests.', ...(inventory ? { completenessInventory: inventory } : {}) };
}
const assess = (text = fullText) => assessDocument(structureDocument(text), contract(reference()), sourceUrl, 'en');

describe('reviewed source inventory coverage', () => {
  it('does not turn a self-consistent incomplete reference into independent qualification', () => {
    const incomplete = structureDocument(fullText.replace(middle, ''));
    const inv = reference();
    inv.units = inv.units.filter(u => u.textSha256 !== sha(normalizeCoverageUnit(middle)));
    inv.sequenceSha256 = observedCoverageSequenceDigest(incomplete);
    const { inventorySha256: ignored, ...body } = inv; void ignored;
    inv.inventorySha256 = coverageInventoryDigest(body);
    const result = assessCoverage(incomplete, inv, sourceUrl, 'en');
    expect(result.state).toBe('matched_reviewed_reference');
    expect(result.referenceOriginVerified).toBe(false);
    expect(result.sourceCompletenessQualified).toBe(false);
  });
  it('rejects a reordered sequence even when every block occurrence remains', () => {
    const changed = fullText.replace(middle + '\n\n' + repeated, repeated + '\n\n' + middle);
    const result = assess(changed);
    expect(result.coverage.missingUnits).toBe(0);
    expect(result.coverage.unexpectedUnits).toBe(0);
    expect(result.coverage.orderMatches).toBe(false);
    expect(result.reasons).toContain('completeness_order_mismatch');
    expect(publicationCoverageSatisfied(result)).toBe(false);
  });
  it('does not fold compatibility characters into an apparently identical legal amendment', () => {
    const text = fullText.replace(middle, middle + ' Limit: 10² units.');
    const inv = reference();
    inv.units.find(u => u.kind === 'paragraph' && u.textSha256 === sha(normalizeCoverageUnit(middle)))!.textSha256 = sha(normalizeCoverageUnit(middle + ' Limit: 10² units.'));
    inv.sequenceSha256 = observedCoverageSequenceDigest(structureDocument(text));
    const { inventorySha256: ignored, ...body } = inv; void ignored;
    inv.inventorySha256 = coverageInventoryDigest(body);
    expect(assessCoverage(structureDocument(text), inv, sourceUrl, 'en').state).toBe('matched_reviewed_reference');
    expect(assessCoverage(structureDocument(text.replace('10²', '102')), inv, sourceUrl, 'en').state).toBe('mismatch');
  });
  it('rejects future review attestations and excessive total inventory bytes', () => {
    const future = reference(); future.reference.reviewedAt = '2999-01-01T00:00:00Z';
    expect(() => parseCoverageInventory(future)).toThrow();
    const huge = reference();
    huge.units = Array.from({ length: 600 }, (_, i) => unit('paragraph', ['x'.repeat(900)], 'unique unit ' + i));
    expect(() => parseCoverageInventory(huge)).toThrow('completeness_inventory_budget_exceeded');
  });
  it('keeps legacy observation eligible while explicitly unknown and unpublishable', () => {
    const a = assessDocument(structureDocument(fullText), contract(), sourceUrl, 'en');
    expect(a.eligible).toBe(true); expect(a.completeness).toBe('unknown');
    expect(a.coverage.state).toBe('not_configured'); expect(publicationCoverageSatisfied(a)).toBe(false);
  });
  it('matches every group and occurrence without claiming universal completeness', () => {
    const a = assess(); expect(a.eligible).toBe(true); expect(a.completeness).toBe('matched_reviewed_reference');
    expect(a.coverage).toMatchObject({ state: 'matched_reviewed_reference', expectedUnits: 14, observedUnits: 14, expectedGroups: 13, observedGroups: 13, missingUnits: 0, unexpectedUnits: 0, reasons: [] });
    expect(publicationCoverageSatisfied(a)).toBe(true);
  });
  it.each([
    ['middle clause', fullText.replace(middle + '\n\n', '')],
    ['duplicate paragraph', fullText.replace(repeated + '\n\n', '')],
    ['table row', fullText.replace('| Premium | 200 |\n\n', '')],
    ['empty section', fullText.replace(sectionBody + '\n\n', '')],
    ['required heading', fullText.replace('## Use\n\n', '')],
    ['terminal text', fullText.replace(terminal, '')],
  ])('holds missing %s even when heading and terminal heuristics are otherwise satisfied', (name, text) => {
    if (['middle clause', 'duplicate paragraph', 'table row', 'empty section'].includes(name)) {
      expect(assessDocument(structureDocument(text), contract(), sourceUrl, 'en').eligible).toBe(true);
    }
    const a = assess(text); expect(a.eligible).toBe(false); expect(a.coverage.state).toBe('mismatch');
    expect(a.coverage.missingUnits).toBeGreaterThan(0); expect(publicationCoverageSatisfied(a)).toBe(false);
  });
  it('holds unexpected content and modifications as requiring a newly reviewed reference', () => {
    for (const text of [fullText + '\n\nAn unexpected clause.', fullText.replace('commercial resale', 'COMMERCIAL resale'), fullText.replace('| Premium | 200 |', '| Premium | 999 |')]) {
      const a = assess(text); expect(a.eligible).toBe(false); expect(a.coverage.unexpectedUnits).toBeGreaterThan(0);
    }
  });
  it('retains normalization but not section/kind or duplicate-count collisions', () => {
    expect(assess(fullText.replace(middle, middle.replace(/ /g, '  '))).eligible).toBe(true);
    expect(assess(fullText.replace('- Review', 'Review')).eligible).toBe(false);
    expect(assess(fullText.replace('## Fees', '## Prices')).eligible).toBe(false);
    expect(assess(fullText.replace(terminal, repeated + '\n\n' + terminal)).coverage.unexpectedUnits).toBeGreaterThan(0);
  });
  it('binds exact source scope and observed language', () => {
    const doc = structureDocument(fullText), inv = reference();
    expect(assessCoverage(doc, inv, sourceUrl + '-other', 'en').reasons).toContain('completeness_scope_mismatch');
    expect(assessCoverage(doc, inv, sourceUrl, 'it').reasons).toContain('completeness_language_mismatch');
    expect(assessCoverage(doc, inv, sourceUrl).state).toBe('mismatch');
    expect(assessCoverage(doc, inv, sourceUrl, 'en-GB').state).toBe('matched_reviewed_reference');
  });
  it('strictly parses and preserves a valid review attestation without treating it as authentication', () => {
    expect(parseSourceContract(contract(reference())).completenessInventory).toEqual(reference());
    expect(parseCoverageInventory(reference())).toEqual(reference());
    expect(parseCoverageInventory(reference()).reference.method).toBe('manual_reference');
  });
  it('rejects mutated scope, hashes, counts, duplicate groups, unknown fields and oversized manifests', () => {
    const mutations: Array<(r: ReviewedCoverageInventory) => void> = [
      r => { r.scope.referenceVersion = 'changed'; }, r => { r.scopeId = '0'.repeat(64); },
      r => { r.inventorySha256 = '0'.repeat(64); }, r => { r.units[0].occurrences = 0; },
      r => { r.units.push({ ...r.units[0] }); }, r => { r.units[0].section = ['x'.repeat(1001)]; },
      r => { r.units = Array(10001).fill(r.units[0]); }, r => { (r as unknown as Record<string, unknown>).execute = true; },
    ];
    for (const mutate of mutations) {
      const inv = reference(); mutate(inv); expect(() => parseCoverageInventory(inv)).toThrow();
      expect(assessCoverage(structureDocument(fullText), inv, sourceUrl, 'en')).toMatchObject({ state: 'mismatch', reasons: ['completeness_inventory_invalid'] });
    }
  });
  it('rejects contract/reference cross-scope binding and no-contract publication', () => {
    expect(() => parseSourceContract({ ...contract(reference()), language: 'it' })).toThrow('completeness_contract_scope_mismatch');
    const a = assessDocument(structureDocument(fullText), null, sourceUrl, 'en'); expect(a.eligible).toBe(false); expect(publicationCoverageSatisfied(a)).toBe(false);
  });
});
