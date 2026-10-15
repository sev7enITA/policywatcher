import { describe, expect, it } from 'vitest';
import { analysisDigest, assertCompleteAnalysisInput, buildPolicyAnalysisManifest, buildPolicyAnalysisPrompt, verifyPolicyAnalysisManifest, MAX_ANALYSIS_DOCUMENT_CHARS } from '../policyAnalysisManifest';

describe('complete analysis input and request manifest', () => {
  const input = {
    traceId: 'trace', context: { companyName: 'Fixture', policyName: 'Privacy' }, oldText: 'old', newText: 'new 😀',
    request: { model: 'model-a', contents: buildPolicyAnalysisPrompt('Fixture', 'Privacy', 'old', 'new 😀'), config: { systemInstruction: 'system', temperature: 0.1 } },
    rawResponse: '{"result":1}', normalizedResponse: { result: 1 },
    promptVersion: 'p1', schemaVersion: 's1', attempt: 0,
  };

  it('distinguishes prompt, system instruction, old document, model and response changes', () => {
    const manifest = buildPolicyAnalysisManifest(input);
    expect(manifest.requestSha256).toBe(analysisDigest(JSON.stringify(input.request)));
    for (const request of [
      { ...input.request, contents: 'other prompt' },
      { ...input.request, model: 'model-b' },
      { ...input.request, config: { ...input.request.config, systemInstruction: 'other system' } },
      { ...input.request, config: { ...input.request.config, temperature: 0.2 } },
    ]) expect(buildPolicyAnalysisManifest({ ...input, request }).requestSha256).not.toBe(manifest.requestSha256);
    expect(buildPolicyAnalysisManifest({ ...input, oldText: 'older' }).oldDocument.sha256).not.toBe(manifest.oldDocument.sha256);
    expect(buildPolicyAnalysisManifest({ ...input, rawResponse: 'changed' }).rawResponseSha256).not.toBe(manifest.rawResponseSha256);
  });

  it('records exact UTF-16 ranges separately from UTF-8 bytes and does not assert semantic coverage', () => {
    const manifest = buildPolicyAnalysisManifest(input);
    expect(manifest.newDocument.includedRanges).toEqual([[0, 6]]);
    expect(manifest.newDocument.byteLength).toBe(8);
    expect(manifest.newDocument.excludedRanges).toEqual([]);
    expect(manifest.semanticCoverage).toBe('not_measured');
    expect(JSON.stringify(manifest)).not.toContain('apiKey');
  });

  it('rejects over-limit and empty input rather than truncating it', () => {
    expect(() => assertCompleteAnalysisInput('', 'x'.repeat(MAX_ANALYSIS_DOCUMENT_CHARS))).not.toThrow();
    expect(() => assertCompleteAnalysisInput('', 'x'.repeat(MAX_ANALYSIS_DOCUMENT_CHARS + 1))).toThrow('coverage_incomplete');
    expect(() => assertCompleteAnalysisInput('x'.repeat(MAX_ANALYSIS_DOCUMENT_CHARS + 1), 'new')).toThrow('analysis_input_limit:old');
    expect(() => assertCompleteAnalysisInput('', '  ')).toThrow('analysis_input_empty');
  });

  it('includes changes after 22000 characters and the tail of a long baseline', () => {
    const prefix = 'Unchanged policy text. '.repeat(3000);
    const oldText = `${prefix}OLD_FINAL_CLAUSE`;
    const newText = `${prefix}NEW_FINAL_CLAUSE`;
    const prompt = buildPolicyAnalysisPrompt('Fixture', 'Privacy', oldText, newText);
    expect(prompt).toContain(oldText);
    expect(prompt).toContain(newText);
    expect(buildPolicyAnalysisPrompt('Fixture', 'Privacy', '', newText)).toContain(newText);
  });

  it('reconstructs an exact request and detects tampered evidence', () => {
    const manifest = buildPolicyAnalysisManifest(input);
    expect(verifyPolicyAnalysisManifest(manifest, input.oldText, input.newText)).toEqual({ valid: true, issues: [] });
    expect(verifyPolicyAnalysisManifest(manifest, 'tampered', input.newText).valid).toBe(false);
    expect(verifyPolicyAnalysisManifest({ ...manifest, rawResponse: 'tampered' }, input.oldText, input.newText).issues).toContain('response_hash');
    expect(verifyPolicyAnalysisManifest({ ...manifest, systemInstruction: 'tampered' }, input.oldText, input.newText).issues).toContain('request_hash');
  });
});
