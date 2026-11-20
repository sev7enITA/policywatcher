import { describe, expect, it } from 'vitest';
import { clauseAudience, editedSentences } from '../../../shared/clauseAudience';
import { comparisonPair } from '../publicComparison';
import { comparisonPath } from '../../../shared/comparisonLink';

describe('audience evidence and pinned comparisons', () => {
  it('keeps the document heading and adjacent clauses out of a regional edit', () => {
    const text = 'EU residents. Ads for UK users have changed. Other terms.';
    const offset = text.indexOf('UK');
    const clause = editedSentences({ text, start: 0, changedStart: offset, changedEnd: offset + 2 });
    expect(clauseAudience(clause, 'it')).toBe('Destinatari citati nel testo · “UK users”');
    expect(clauseAudience('This does not apply to UK users.', 'en')).toBe('Applicability needs verification');
    expect(clauseAudience('Data transfers to Italy', 'it')).toBe('Applicabilità da verificare');
    expect(editedSentences({ text, start: 0, changedStart: offset, changedEnd: offset })).toBe('');
  });
  it('requires two public texts from the same policy and binds the link to both versions', () => {
    const a = { policyId: 'p', publicEvidence: true, text: 'first' };
    const b = { ...a, text: 'second' };
    const pair = comparisonPair('p', a, b)!;
    expect(comparisonPath('change', pair, 'it')).toContain(`before=${pair.before}&after=${pair.after}&lang=it`);
    expect(comparisonPair('p', null, b)).toBeNull();
    expect(comparisonPair('p', a, { ...b, publicEvidence: false })).toBeNull();
    expect(comparisonPair('p', { ...a, policyId: 'other' }, b)).toBeNull();
    expect(comparisonPair('p', b, a)).not.toEqual(pair);
  });
});
