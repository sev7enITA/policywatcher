import { describe, expect, it } from 'vitest';
import { KPI_ALLOWED_VALUES, KPI_FIELD_KEYS } from '../metricsCatalog';
import { retrieveArchivedKpiEvidence } from '../engine/archivedKpiRetrieval';
import { assessArchivedKpis } from '../engine/archivedKpiReview';
import { qualificationDigest } from '../engine/qualification';

const text = '😀 We delete records after three years.';
const sha256 = qualificationDigest(text);
const archivedText = { [sha256]: text };
const validValues = Object.fromEntries(KPI_FIELD_KEYS.map(field => [field, KPI_ALLOWED_VALUES[field][0]]));
const analysis = {
  changeId: 'change-1', snapshotId: 'snapshot-1', sha256,
  source: { version: 1, edition: 'EU', publicEvidence: true },
  values: { ...validValues, kpiDataRetention: 'Not assessed', kpiAiOutputOwnership: 'Company Claimed' },
};
const cohort = { schema: 'pw-retro-kpi-1', analyses: [analysis] };
const proposal = {
  changeId: analysis.changeId, snapshotId: analysis.snapshotId, sha256, field: 'kpiDataRetention',
  version: 1, edition: 'EU', value: 'Defined', reviewer: 'interpreter',
  quotes: [{ start: 2, end: Array.from(text).length, text: text.slice(3) }],
};
const run = (proposals: unknown[] = [], adjudications: unknown[] = []) =>
  assessArchivedKpis(cohort, archivedText, proposals, adjudications);
const decision = (proposalHash: unknown) => ({
  proposalHash, verdict: 'supported', reviewer: 'reviewer', reason: 'The retention clause pins a three-year period.',
});

describe('archived KPI qualification', () => {
  it('retains every indicator in the denominator and excludes historical labels outside the catalogue', () => {
    expect(run()).toMatchObject({
      denominator: 15, baselineAssessed: 13, baselineOutsideCatalogue: 1, baselineNotAssessed: 1,
      newlySupported: 0, minimumAdditionalForOver90: 1, over90Percent: false,
    });
  });

  it('requires strictly more than 90 percent before passing the gate', () => {
    const other = { ...analysis, changeId: 'change-2', values: { ...validValues, kpiAiBiasFairness: null } };
    const result = assessArchivedKpis({ ...cohort, analyses: [analysis, other] }, archivedText, [], []);
    expect(result).toMatchObject({ denominator: 30, assessedAfterReview: 27, minimumAdditionalForOver90: 1, over90Percent: false });
  });

  it('verifies code-point offsets and requires independent semantic review before counting once', () => {
    const pending = run([proposal]);
    expect(pending.findings[0].outcome).toBe('awaiting_review');
    expect(pending.newlySupported).toBe(0);
    const adjudication = decision(pending.findings[0].proposalHash);
    const result = run([proposal, proposal], [adjudication]);
    expect(result.findings.map(f => f.outcome)).toEqual(['supported', 'duplicate']);
    expect(result).toMatchObject({ denominator: 15, newlySupported: 1, unresolved: 1, over90Percent: true });
    expect(() => run([proposal], [{ ...adjudication, reviewer: ' Interpreter ' }])).toThrow('independent_reviewer_required');
    expect(run([proposal], [{ ...adjudication, verdict: 'uncertain' }]).newlySupported).toBe(0);
  });

  it.each([
    [{ edition: 'US' }, 'source_mismatch'],
    [{ version: 2 }, 'source_mismatch'],
    [{ snapshotId: 'snapshot-2' }, 'source_mismatch'],
    [{ sha256: '0'.repeat(64) }, 'source_mismatch'],
    [{ value: 'Not assessed' }, 'unsupported_value'],
    [{ quotes: [{ start: 3, end: text.length, text: text.slice(3) }] }, 'invalid_quote'],
    [{ quotes: [{ start: 2, end: 9, text: 'invented' }] }, 'invalid_quote'],
    [{ reviewerVerdict: 'supported' }, 'invalid_proposal'],
    [{ field: 'kpiIndependentAudit' }, 'already_assessed'],
  ])('rejects a proposal with invalid evidence or schema', (input, outcome) => {
    const result = run([{ ...proposal, ...input }]);
    expect(result.findings[0].outcome).toBe(outcome);
    expect(result.newlySupported).toBe(0);
  });

  it('requires a public snapshot and exact archived bytes', () => {
    const withheld = { ...analysis, source: { ...analysis.source, publicEvidence: false } };
    expect(assessArchivedKpis({ ...cohort, analyses: [withheld] }, archivedText, [proposal], []).findings[0].outcome).toBe('withheld_source');
    expect(assessArchivedKpis(cohort, {}, [proposal], []).findings[0].outcome).toBe('missing_archived_text');
    expect(() => assessArchivedKpis(cohort, { [sha256]: 'Changed.' }, [], [])).toThrow('archive_digest_mismatch');
  });

  it('abstains on conflicting approved values and rejects dangling or replayed decisions', () => {
    const rival = { ...proposal, value: 'Indefinite', reviewer: 'interpreter B' };
    const drafts = [proposal, rival];
    const approvals = run(drafts).findings.map(f => decision(f.proposalHash));
    const report = run(drafts, approvals);
    expect(report.cells.find(c => c.field === proposal.field)?.reason).toBe('conflicting_approvals');
    expect(report.newlySupported).toBe(0);
    expect(() => run([proposal], approvals)).toThrow('adjudication_without_valid_proposal');
    expect(() => run([proposal], [approvals[0], approvals[0]])).toThrow('invalid_or_duplicate_adjudication');
  });

  it('requires unique analyses with all 15 fields in a frozen cohort', () => {
    expect(() => assessArchivedKpis({ ...cohort, analyses: [analysis, analysis] }, {}, [], [])).toThrow('invalid_analysis');
    expect(() => assessArchivedKpis({ ...cohort, analyses: [{ ...analysis, values: {} }] }, {}, [], [])).toThrow('invalid_analysis');
  });
});

describe('archived KPI candidate retrieval', () => {
  it('finds a bilingual retention clause at replayable Unicode offsets', () => {
    const paragraph = '📝 Conserviamo i dati personali per sette anni.';
    const contents = 'A'.repeat(620) + '\n' + paragraph;
    const digest = qualificationDigest(contents);
    const source = { ...analysis, sha256: digest };
    const hidden = { ...source, changeId: 'hidden', source: { ...source.source, publicEvidence: false } };
    const report = retrieveArchivedKpiEvidence({ ...cohort, analyses: [source, hidden] }, { [digest]: contents });
    expect(report.denominator).toBe(30);
    const hit = report.candidates.find(c => c.changeId === source.changeId && c.field === 'kpiDataRetention')!;
    expect(hit).toMatchObject({ outcome: 'passages_found', edition: 'EU', version: 1, sha256: digest, snapshotId: source.snapshotId });
    const [quote] = hit.quotes;
    expect(quote.text).toContain(paragraph);
    expect(Array.from(contents).slice(quote.start, quote.end).join('')).toBe(quote.text);
    expect(report.candidates.filter(c => c.changeId === 'hidden').every(c => c.outcome === 'withheld_source' && c.quotes.length === 0)).toBe(true);
    expect(report.candidates.find(c => c.field === 'kpiAiOutputOwnership')!.outcome).toBe('no_matching_passage');
  });

  it('keeps unavailable text, unverified editions and corrupted archive material explicit', () => {
    const absent = retrieveArchivedKpiEvidence(cohort, {});
    expect(absent.candidates.every(c => c.outcome === 'missing_archived_text' && c.quotes.length === 0)).toBe(true);
    const unverified = retrieveArchivedKpiEvidence({ ...cohort, analyses: [{ ...analysis, source: null }] }, archivedText);
    expect(unverified.candidates.every(c => c.outcome === 'unverified_source' && c.quotes.length === 0)).toBe(true);
    expect(() => retrieveArchivedKpiEvidence(cohort, { [sha256]: 'changed' })).toThrow('archive_digest_mismatch');
  });
});

describe('source edition expressed by the archived introduction', () => {
  const europeanRule = 'These Terms of Use apply if you reside in the European Economic Area (EEA), Switzerland, or UK.';
  function check(body: string, edition = 'Global') {
    const digest = qualificationDigest(body);
    const row = { ...analysis, sha256: digest, source: { ...analysis.source, edition } };
    const input = { ...cohort, analyses: [row] };
    const phrase = 'We delete records after three years.';
    const start = Array.from(body.slice(0, body.indexOf(phrase))).length;
    const candidate = { ...proposal, edition, sha256: digest, quotes: [{ start, end: start + phrase.length, text: phrase }] };
    const archive = { [digest]: body };
    return { review: assessArchivedKpis(input, archive, [candidate], []), retrieval: retrieveArchivedKpiEvidence(input, archive) };
  }
  it('blocks an explicitly European edition attached to a Global record, even with a literal KPI citation', () => {
    const body = 'Updated: January 16, 2026\n\n# Europe Terms of Use\n\n' + europeanRule + '\n' + text;
    const { review, retrieval } = check(body);
    expect(review.findings[0].outcome).toBe('archived_edition_conflict');
    expect(review.cells.every(c => c.reason === 'archived_edition_conflict')).toBe(true);
    expect(review).toMatchObject({ baselineAssessed: 13, baselineAssessedOnConflictingEditions: 13, baselineAfterEditionCheck: 0,
      assessedAfterEditionCheck: 0, minimumAdditionalForOver90AfterEditionCheck: 14, over90AfterEditionCheck: false });
    expect(review.editionConflicts[0]).toMatchObject({ applicability: europeanRule });
    expect(retrieval.candidates.every(c => c.outcome === 'archived_edition_conflict' && !c.quotes.length)).toBe(true);
    expect(check(body, 'EU').review.findings[0].outcome).toBe('awaiting_review');
  });
  it.each([
    '# Global Terms of Use\n\n## Regional provisions\n' + europeanRule,
    '# Terms of Use\n\nWe operate worldwide.\n\n# Europe Terms of Use\n' + europeanRule,
    '# Europe Terms of Use\n\nThese Terms of Use apply if you reside in the EEA, UK or any other country.',
    '# Europe Terms of Use\n\n## Foreign supplements\n' + europeanRule,
  ])('keeps regional mentions and open-ended lists available for independent review', intro => {
    expect(check(intro + '\n' + text).review.findings[0].outcome).toBe('awaiting_review');
  });
});
