import { diffWordsWithSpace } from 'diff';
import { describe, expect, it } from 'vitest';
import { classifyPolicyChange, requireCompleteComparison } from '../changeClassification';
import { buildVerifiedPolicyDiff, compareSnapshotText, type ChangeHunk } from '../policyChangeHunks';
import { shouldNotifyChange } from '../changeClassificationTypes';
import { reconcilePolicyActionReceipts } from '../policyActionCompletion';

function pair(oldText: string, newText: string, evidenceQuote?: string) {
  return {
    policyId: 'policy',
    oldSnapshot: { text: oldText, publicEvidence: true, policyId: 'policy', version: 5 },
    newSnapshot: { text: newText, publicEvidence: true, policyId: 'policy', version: 6 },
    riskReasonsJson: evidenceQuote && JSON.stringify([{ evidenceQuote, evidenceSide: 'new', relatedKpi: 'kpiDataRetention' }]),
  };
}

function expectExactAlignment(oldText: string, newText: string, hunks: ChangeHunk[]) {
  let oldEnd = 0;
  let newEnd = 0;
  for (const hunk of hunks) {
    expect(hunk.oldStart).toBeGreaterThanOrEqual(oldEnd);
    expect(hunk.newStart).toBeGreaterThanOrEqual(newEnd);
    expect(oldText.slice(oldEnd, hunk.oldStart)).toBe(newText.slice(newEnd, hunk.newStart));
    expect(oldText.slice(hunk.oldStart, hunk.oldEnd)).not.toBe(newText.slice(hunk.newStart, hunk.newEnd));
    oldEnd = hunk.oldEnd;
    newEnd = hunk.newEnd;
  }
  expect(oldText.slice(oldEnd)).toBe(newText.slice(newEnd));
}

describe('bounded comparison recovery', () => {
  it('aligns scattered changes after the whole-document word diff reaches its limit', () => {
    const documents = ['earlier', 'revised'].map(label => Array.from({ length: 300 }, (_, i) =>
      `Identical heading ${i}.\r\nRetention period for section ${i} uses the ${label} schedule.\r\n`).join(''));
    const [before, after] = documents;
    expect(diffWordsWithSpace(before, after, { maxEditLength: 512 })).toBeUndefined();
    const hunks = compareSnapshotText(before, after);
    expect(hunks).toHaveLength(300);
    expect(hunks.every(hunk => hunk.precision === undefined)).toBe(true);
    expectExactAlignment(before, after, hunks);
    const result = classifyPolicyChange(pair(before, after));
    expect(result).toMatchObject({ compared: true, comparisonStatus: 'complete', oldVersion: 5, newVersion: 6, totalHunks: 300, kind: 'needs_review' });
    const stored = JSON.parse(buildVerifiedPolicyDiff(before, after)) as { value: string; added?: boolean; removed?: boolean }[];
    expect(stored.filter(p => !p.added).map(p => p.value).join('')).toBe(before);
    expect(stored.filter(p => !p.removed).map(p => p.value).join('')).toBe(after);
    expect(result.evidence[0].before.text).toBe(before.slice(result.evidence[0].before.start, result.evidence[0].before.end));
    expect(result.evidence[0].after.text).toBe(after.slice(result.evidence[0].after.start, result.evidence[0].after.end));
  });

  it('preserves a broad replacement as evidence without anchoring a claimed clause to it', () => {
    const before = 'Terms\n' + 'before content '.repeat(1800) + '\nContact';
    const after = 'Terms\n' + 'new purpose and retention schedule '.repeat(960) + '\nContact';
    const hunks = compareSnapshotText(before, after);
    expect(hunks).toHaveLength(1);
    expect(hunks[0]).toMatchObject({ oldStart: 6, newStart: 6, precision: 'block' });
    expectExactAlignment(before, after, hunks);
    const result = classifyPolicyChange(pair(before, after, 'new purpose and retention schedule'));
    expect(result).toMatchObject({ compared: true, comparisonStatus: 'partial', blockHunks: 1, reason: 'unverified_meaning' });
    expect(shouldNotifyChange(result)).toBe(false);
    expect(() => requireCompleteComparison(result)).toThrow('comparison_incomplete:unresolved_blocks:1');
    expect(result.evidence[0].precision).toBe('block');
    expect(result.evidence[0].anchoredQuote).toBeUndefined();
  });

  it('keeps matching edges when line alignment cannot resolve a rewrite', () => {
    const before = 'Same heading\n' + 'old material\n'.repeat(1800) + 'Same closing text\n';
    const after = 'Same heading\n' + 'new language\n'.repeat(1800) + 'Same closing text\n';
    const hunks = compareSnapshotText(before, after);
    expect(hunks).toHaveLength(1);
    expect(hunks[0]).toMatchObject({ oldStart: 13, newStart: 13, precision: 'block' });
    expectExactAlignment(before, after, hunks);
    expect(() => buildVerifiedPolicyDiff(before, after)).toThrow('comparison_incomplete:full_diff_edit_limit');
  });

  it('handles documents beyond the previous length limit and preserves the public-pair gate', () => {
    const common = 'Una sezione invariata con caratteri Unicode, incluso 🧾.\n'.repeat(11_000);
    const input = pair(common + 'Thirty days.', common + 'Sixty days.');
    expect(input.oldSnapshot.text.length).toBeGreaterThan(500_000);
    expect(classifyPolicyChange(input)).toMatchObject({ compared: true, totalHunks: 1 });
    const privatePair = { ...input, oldSnapshot: { ...input.oldSnapshot, publicEvidence: false } };
    const incomplete = classifyPolicyChange(privatePair);
    expect(incomplete).toMatchObject({ compared: false, comparisonStatus: 'incomplete', reason: 'missing_public_pair', evidence: [] });
    expect(shouldNotifyChange(incomplete)).toBe(false);
  });
});

describe('durable action receipts', () => {
  it('fails receipt reconciliation even if the number of rows matches the plan', () => {
    expect(reconcilePolicyActionReceipts(['a', 'b', 'c'], [
      { policyId: 'a' }, { policyId: 'a' }, { policyId: 'd' },
    ])).toMatchObject({ complete: false, missing: ['b', 'c'], duplicate: ['a'], unexpected: ['d'] });
    expect(reconcilePolicyActionReceipts(['a', 'b'], [{ policyId: 'b' }, { policyId: 'a' }]).complete).toBe(true);
  });
});
