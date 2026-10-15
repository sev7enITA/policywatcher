import { describe, expect, it } from 'vitest';
import { buildPolicyAnalysisManifest, buildPolicyAnalysisPrompt, analysisDigest } from '../policyAnalysisManifest';
import { publicAnalysisLineage } from '../publicAnalysisLineage';

function fixture() {
  const oldText = 'Old source text'; const newText = 'New source text';
  const manifest = buildPolicyAnalysisManifest({
    traceId: 'trace', context: { companyName: 'Fixture', policyName: 'Privacy' }, oldText, newText,
    request: { model: 'fixture-model', contents: buildPolicyAnalysisPrompt('Fixture', 'Privacy', oldText, newText), config: { systemInstruction: 'private instruction' } },
    rawResponse: '{"private":"response"}', normalizedResponse: {}, promptVersion: 'test', schemaVersion: 'test', attempt: 0,
  });
  return { evidenceJson: JSON.stringify({ contractVersion: '1.1.0', inference: manifest }), requestHash: manifest.requestSha256, traceId: 'trace',
    oldSnapshot: { text: oldText, hash: analysisDigest(oldText), publicEvidence: true },
    newSnapshot: { text: newText, hash: analysisDigest(newText), publicEvidence: true } };
}
describe('public analysis lineage', () => {
  it('verifies replayable evidence without publishing private request or response text', () => {
    const result = publicAnalysisLineage(fixture());
    expect(result).toMatchObject({ status: 'verified', inputCoverage: 'complete', semanticCoverage: 'not_measured' });
    expect(JSON.stringify(result)).not.toMatch(/private instruction|private.*response|Old source text|New source text/);
  });
  it('keeps legacy and malformed provenance explicit', () => {
    expect(publicAnalysisLineage({ ...fixture(), evidenceJson: null }).status).toBe('not_recorded');
    expect(publicAnalysisLineage({ ...fixture(), evidenceJson: '{' }).status).toBe('unverifiable');
  });
  it('detects altered snapshots, request hashes and trace linkage', () => {
    const f = fixture();
    expect(publicAnalysisLineage({ ...f, requestHash: 'tampered' }).status).toBe('mismatch');
    expect(publicAnalysisLineage({ ...f, traceId: 'other' }).status).toBe('mismatch');
    expect(publicAnalysisLineage({ ...f, newSnapshot: { ...f.newSnapshot, text: 'altered' } }).status).toBe('mismatch');
  });
  it('withholds lineage derived from a private old snapshot', () => {
    const f = fixture();
    expect(publicAnalysisLineage({ ...f, oldSnapshot: { ...f.oldSnapshot, publicEvidence: false } })).toMatchObject({ status: 'unverifiable', inputCoverage: 'unknown' });
  });
});
