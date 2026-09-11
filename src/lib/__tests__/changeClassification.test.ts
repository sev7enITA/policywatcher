import { describe, expect, it } from 'vitest';
import { classifyPolicyChange, normalizePresentation, withChangeClassification } from '../changeClassification';
import { shouldNotifyChange } from '../changeClassificationTypes';

const snapshot = (text: string, version = 1) => ({ policyId: 'policy-a', text, version, publicEvidence: true });
const compare = (old: string, next: string, reasons: unknown = []) => classifyPolicyChange({
  policyId: 'policy-a', oldSnapshot: snapshot(old), newSnapshot: snapshot(next, 2), riskReasonsJson: JSON.stringify(reasons),
});
const quote = 'We may share age group information with third-party apps.';
const reason = { evidenceQuote: quote, evidenceSide: 'new', relatedKpi: 'kpiThirdPartySharing', textEn: 'Sharing expanded' };

describe('evidence-based change classification', () => {
  it('uses text equality rather than a reported hash or AI summary', () => {
    expect(compare('Same policy.', 'Same policy.', [{ textEn: 'New high risk!' }])).toMatchObject({ kind: 'unchanged', compared: true, totalHunks: 0, impact: 'not_assessed' });
    expect(compare('We retain data for 30 days.', 'We retain data for 90 days.', [{ textEn: 'No change detected' }]).kind).toBe('needs_review');
  });

  it.each([
    ['We retain data.\n\nYou can delete it.', 'We retain data. You can delete it.'],
    ["Your organization's data.", 'Your organization’s data.'],
    ['“Your data” stays here.', '"Your data" stays here.'],
    ['Caf\u0065\u0301 data.', 'Café data.'],
  ])('recognizes bounded presentation normalization', (old, next) => {
    const result = compare(old, next);
    expect(result.kind).toBe('editorial');
    expect(result.oldHash).not.toBe(result.newHash);
    expect(shouldNotifyChange(result)).toBe(false);
  });

  it.each([
    ['We may sell data.', 'We may not sell data.'],
    ['Cost: $10.00.', 'Cost: $1000.'],
    ['Contact old@example.com.', 'Contact new@example.com.'],
    ['Contact [email protected].', 'Contact privacy@example.com.'],
    ['The Company may decide.', 'The company may decide.'],
    ['We retain data for 30 days.', 'We retain data for 90 days.'],
    ['Use data-sets.', 'Use datasets.'],
  ])('does not suppress potentially meaningful edits as typography', (old, next) => {
    expect(normalizePresentation(old)).not.toBe(normalizePresentation(next));
    expect(compare(old, next).kind).toBe('needs_review');
    expect(shouldNotifyChange(compare(old, next))).toBe(true);
  });

  it('requires a changed, exact clause anchored to a known KPI for a potential substantive signal', () => {
    const old = 'We protect account data. '.repeat(10);
    const result = compare(old, `${old}${quote}`, [reason]);
    expect(result).toMatchObject({ kind: 'substantive', reason: 'changed_clause_anchor', impact: 'not_assessed', oldVersion: 1, newVersion: 2 });
    expect(result.evidence[0].anchoredQuote?.text).toBe(quote);
    expect(shouldNotifyChange(result)).toBe(true);
  });

  it('supports deleted clauses with exact old-side evidence', () => {
    const context = 'We protect account data. '.repeat(10);
    expect(compare(`${context}${quote}`, context, [{ ...reason, evidenceSide: 'old' }]).kind).toBe('substantive');
  });

  it('rejects unchanged, fabricated, oversized and incomplete AI anchors', () => {
    const prefix = 'Contact [email protected]. ';
    const old = prefix + quote;
    const next = 'Contact privacy@example.com. ' + quote;
    expect(compare(old, next, [reason]).kind).toBe('needs_review');
    for (const invalid of [
      { ...reason, evidenceQuote: quote + ' Fabricated text.' },
      { ...reason, evidenceQuote: 'a'.repeat(241) },
      { ...reason, evidenceSide: 'unknown' },
      { ...reason, relatedKpi: 'made-up-kpi' },
      { evidenceQuote: quote },
    ]) expect(compare('Some existing policy text. '.repeat(8), 'Some existing policy text. '.repeat(8) + quote, [invalid]).kind).toBe('needs_review');
  });

  it('cannot elevate typographic quote edits using static AI evidence', () => {
    const oldQuote = 'We may share the organization’s account information.';
    const newQuote = oldQuote.replace('’', "'");
    expect(compare(`${oldQuote} Fee: 30.`, `${newQuote} Fee: 40.`, [{ ...reason, evidenceQuote: newQuote }]).kind).toBe('needs_review');
  });

  it('keeps missing, private, cross-policy and empty snapshot pairs unverified without excerpts', () => {
    for (const input of [
      { newSnapshot: snapshot(quote) },
      { oldSnapshot: { ...snapshot('private'), publicEvidence: false }, newSnapshot: snapshot(quote) },
      { oldSnapshot: snapshot('private'), newSnapshot: { ...snapshot(quote), policyId: 'policy-b' } },
      { policyId: 'wrong-policy', oldSnapshot: snapshot('private'), newSnapshot: snapshot(quote) },
      { oldSnapshot: snapshot(''), newSnapshot: snapshot(quote) },
    ]) expect(classifyPolicyChange(input)).toMatchObject({ kind: 'needs_review', reason: 'missing_public_pair', compared: false, oldHash: null, newHash: null, evidence: [] });
  });

  it('returns bounded exact excerpts with valid offsets for additions and removals', () => {
    const old = 'First unchanged sentence. We retain data for 30 days. Last unchanged sentence.';
    const next = old.replace('30', '365');
    const result = compare(old, next);
    for (const hunk of result.evidence) {
      for (const [text, ex] of [[old, hunk.before], [next, hunk.after]] as const) {
        expect(ex.text).toBe(text.slice(ex.start, ex.end));
        expect(ex.text.length).toBeLessThanOrEqual(640);
        expect(ex.changedStart).toBeGreaterThanOrEqual(ex.start);
        expect(ex.changedEnd).toBeLessThanOrEqual(ex.end);
      }
    }
    expect(result.evidence[0].before.text).toContain('30');
    expect(result.evidence[0].after.text).toContain('365');
    expect(result.evidence.length).toBeLessThanOrEqual(4);
  });

  it('bounds huge inputs and treats broad replacements as unverified', () => {
    expect(compare('x'.repeat(500_001), 'y').reason).toBe('comparison_limit');
    expect(compare('Old policy.', quote, [reason]).kind).toBe('needs_review');
  });

  it('does not expose full texts in list payloads or permit cache mutation', () => {
    const input = { id: 'change', oldSnapshot: snapshot('old text'), newSnapshot: snapshot('new text', 2) };
    const output = withChangeClassification(input);
    expect(output).not.toHaveProperty('oldSnapshot');
    expect(output).not.toHaveProperty('newSnapshot');
    expect(output.id).toBe('change');
    output.classification.kind = 'unchanged';
    expect(classifyPolicyChange(input).kind).toBe('needs_review');
  });

  it('retains legacy cases for notification review', () => {
    expect(shouldNotifyChange()).toBe(true);
    expect(shouldNotifyChange({ kind: 'unchanged' })).toBe(false);
  });
});
