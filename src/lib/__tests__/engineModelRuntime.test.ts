import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { liveAnalysis, validateModelPair } from '../engine/claims';
import { compareDocuments, structureDocument } from '../engine/document';

const api = vi.hoisted(() => ({ countTokens: vi.fn(), generateContent: vi.fn() }));
vi.mock('@google/genai', () => ({ GoogleGenAI: class { models = api; } }));
const old = structureDocument('# Privacy\n\nRecords are kept for 30 days.');
const next = structureDocument('# Privacy\n\nRecords are kept for 60 days.');
const input = { old, next, deltas: compareDocuments(old, next).deltas };
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('GEMINI_API_KEY', 'synthetic-test-key');
  vi.stubEnv('POLICYWATCHER_ENGINE_ANALYST_MODEL', 'test-analyst-alias');
  vi.stubEnv('POLICYWATCHER_ENGINE_VERIFIER_MODEL', 'test-verifier-alias');
  api.countTokens.mockResolvedValue({ totalTokens: 100 });
  api.generateContent.mockResolvedValue({ candidates: [{ finishReason: 'STOP' }], text: '{"schema":"pw-claims-1","claims":[]}', usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 10 } });
});
afterEach(() => vi.unstubAllEnvs());
describe('Engine model identity at the SDK boundary', () => {
  it('never represents the configured alias as a resolved model identity when metadata is absent', async () => {
    const analysis = await liveAnalysis.analyze(input);
    expect(analysis.receipt.requestedModel).toBe('test-analyst-alias');
    expect(analysis.receipt.model).toBe('');
    expect(validateModelPair(analysis.receipt, { ...analysis.receipt, model: 'resolved-verifier' })).toContain('verification_model_identity_missing');
  });
  it('holds two different configured aliases that resolve to one provider model', async () => {
    api.generateContent.mockResolvedValue({ candidates: [{ finishReason: 'STOP' }], modelVersion: 'shared-resolved-model', text: '{"schema":"pw-claims-1","claims":[]}' });
    const analysis = await liveAnalysis.analyze(input);
    const verification = await liveAnalysis.verify(input, analysis.value);
    expect(analysis.receipt.requestedModel).not.toBe(verification.receipt.requestedModel);
    expect(validateModelPair(analysis.receipt, verification.receipt)).toContain('verification_model_not_independent');
  });
  it('rejects missing configuration before countTokens or generation', () => {
    vi.stubEnv('POLICYWATCHER_ENGINE_VERIFIER_MODEL', '');
    expect(() => liveAnalysis.analyze(input)).toThrow('analysis_model_configuration_required');
    expect(api.countTokens).not.toHaveBeenCalled(); expect(api.generateContent).not.toHaveBeenCalled();
  });
});

describe('r4 bounded model diagnostics', () => {
  it.each([429, 503, 504])('preserves status %s without provider text or credentials', async status => {
    api.generateContent.mockRejectedValue({ status, message: 'secret prompt or credential' });
    await expect(liveAnalysis.analyze(input)).rejects.toThrow(`model_http_${status}`);
  });
  it('routes malformed or truncated output to explicit review codes', async () => {
    api.generateContent.mockResolvedValue({ candidates: [{ finishReason: 'MAX_TOKENS' }], text: '{}' });
    await expect(liveAnalysis.analyze(input)).rejects.toThrow('analysis_output_incomplete');
    api.generateContent.mockResolvedValue({ candidates: [{ finishReason: 'STOP' }], text: '{broken' });
    await expect(liveAnalysis.analyze(input)).rejects.toThrow('analysis_output_invalid_json');
  });
  it('counts the system instruction and blocks over-budget input before generation', async () => {
    api.countTokens.mockResolvedValue({ totalTokens: 200_001 });
    await expect(liveAnalysis.analyze(input)).rejects.toThrow('analysis_context_budget_exceeded');
    expect(api.countTokens.mock.calls[0][0].config.systemInstruction).toContain('untrusted');
    expect(api.generateContent).not.toHaveBeenCalled();
  });
});
