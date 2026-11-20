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
    const a = { policyId: 'p', version: 1, publicEvidence: true, text: 'first' };
    const b = { ...a, version: 2, text: 'second' };
    const pair = comparisonPair('p', a, b)!;
    expect(comparisonPath('change', pair, 'it')).toContain(`before=${pair.before}&after=${pair.after}&from=1&to=2&lang=it`);
    expect(comparisonPair('p', a, { ...b, version: 3 })).not.toEqual(pair);
    expect(comparisonPair('p', null, b)).toBeNull();
    expect(comparisonPair('p', a, { ...b, publicEvidence: false })).toBeNull();
    expect(comparisonPair('p', { ...a, policyId: 'other' }, b)).toBeNull();
    expect(comparisonPair('p', b, a)).not.toEqual(pair);
  });
});
