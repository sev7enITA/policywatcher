import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { KPI_FIELD_KEYS, NOT_ASSESSED_KPI_VALUE } from '@/lib/metricsCatalog';

const mocks = vi.hoisted(() => ({
  generateContent: vi.fn(),
}));

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = { generateContent: mocks.generateContent };
  },
}));

import { analyzePolicyChange, GEMINI_MODEL_CHAIN } from '@/lib/gemini';
import {
  GeminiStructuredOutputError,
  POLICY_ANALYSIS_SCHEMA_VERSION,
  POLICY_ANALYSIS_RESPONSE_SCHEMA,
  assertPolicyAnalysisResponse,
} from '@/lib/geminiPolicySchema';

function validPolicyAnalysis() {
  const kpis = Object.fromEntries(
    KPI_FIELD_KEYS.map((field) => [field, NOT_ASSESSED_KPI_VALUE]),
  );

  return {
    executiveSummaryEn: 'The policy introduces a bounded change.',
    executiveSummaryIt: 'La policy introduce una modifica circoscritta.',
    tldrEn: 'A bounded policy change requires review.',
    tldrIt: 'Una modifica circoscritta richiede revisione.',
    keyPoints: [
      { textEn: 'Collection changed.', textIt: 'La raccolta è cambiata.', sentiment: 'negative' },
      { textEn: 'Deletion remains available.', textIt: 'La cancellazione resta disponibile.', sentiment: 'positive' },
      { textEn: 'Retention is unchanged.', textIt: 'La conservazione è invariata.', sentiment: 'neutral' },
    ],
    riskReasons: [
      { icon: 'warning', textEn: 'Collection scope changed', textIt: 'Ambito raccolta modificato', deltaScore: 2 },
      { icon: 'info', textEn: 'Deletion remains available', textIt: 'Cancellazione ancora disponibile', deltaScore: -1 },
      { icon: 'info', textEn: 'Retention is unchanged', textIt: 'Conservazione invariata', deltaScore: 0 },
    ],
    overallRisk: 'Medium',
    overallScore: 5,
    aiTrainingOptOut: 'Not specified',
    aiDataScrapingRestricted: 'Not specified',
    aiIpLicensing: 'Not specified',
    aiPromptRetention: 'Not specified',
    ...kpis,
    remediations: [
      {
        titleEn: 'Review collection settings',
        titleIt: 'Rivedi le impostazioni di raccolta',
        descriptionEn: 'Confirm whether the new collection applies to the account.',
        descriptionIt: 'Verifica se la nuova raccolta si applica all’account.',
      },
      {
        titleEn: 'Keep a copy',
        titleIt: 'Conserva una copia',
        descriptionEn: 'Save the reviewed policy version.',
        descriptionIt: 'Salva la versione della policy revisionata.',
      },
    ],
    regionImpacts: (['EU', 'US', 'Global'] as const).flatMap((region) =>
      (['Individual', 'Enterprise'] as const).map((perspective) => ({
        region,
        perspective,
        impactAnalysisEn: `${region} ${perspective} impact requires review.`,
        impactAnalysisIt: `L’impatto ${region} ${perspective} richiede revisione.`,
        riskLevel: 'Medium',
      })),
    ),
  };
}

describe('Gemini supported models and structured output', () => {
  beforeEach(() => {
    vi.stubEnv('GEMINI_API_KEY', 'test-key');
    vi.stubEnv('ALLOW_DEMO_AI_FALLBACK', 'false');
    mocks.generateContent.mockReset();
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('keeps the evaluated primary and replaces the shutdown fallback', () => {
    expect(GEMINI_MODEL_CHAIN).toEqual(['gemini-2.5-flash', 'gemini-3.5-flash-lite']);
    expect(GEMINI_MODEL_CHAIN.join(' ')).not.toContain('gemini-2.0');
  });

  it('sends the provider-side JSON Schema on every analysis request', async () => {
    mocks.generateContent.mockResolvedValue({ text: JSON.stringify(validPolicyAnalysis()) });

    const result = await analyzePolicyChange('Example', 'Privacy', '', 'New policy text');

    expect(result.overallRisk).toBe('Medium');
    expect(mocks.generateContent).toHaveBeenCalledWith(expect.objectContaining({
      model: 'gemini-2.5-flash',
      config: expect.objectContaining({
        responseMimeType: 'application/json',
        responseJsonSchema: POLICY_ANALYSIS_RESPONSE_SCHEMA,
      }),
    }));
  });

  it('keeps the provider schema structural and the strict semantic gate local', () => {
    const serialized = JSON.stringify(POLICY_ANALYSIS_RESPONSE_SCHEMA);

    expect(POLICY_ANALYSIS_SCHEMA_VERSION).toBe('policy-analysis.schema.v2');
    expect(serialized).not.toContain('"enum"');
    expect(serialized).not.toContain('"minItems"');
    expect(serialized).not.toContain('"maxItems"');
    expect(serialized).not.toContain('"minimum"');
    expect(serialized).not.toContain('"maximum"');
    expect(() => assertPolicyAnalysisResponse({})).toThrow(GeminiStructuredOutputError);
  });

  it('uses the supported fallback after a transient primary failure', async () => {
    mocks.generateContent
      .mockRejectedValueOnce(new Error('429 RESOURCE_EXHAUSTED'))
      .mockResolvedValueOnce({ text: JSON.stringify(validPolicyAnalysis()) });

    await analyzePolicyChange('Example', 'Privacy', '', 'New policy text');

    expect(mocks.generateContent).toHaveBeenCalledTimes(2);
    expect(mocks.generateContent.mock.calls.map(([request]) => request.model)).toEqual([
      'gemini-2.5-flash',
      'gemini-3.5-flash-lite',
    ]);
  });

  it('uses the supported fallback after a transient network reset', async () => {
    mocks.generateContent
      .mockRejectedValueOnce(new TypeError('fetch failed', {
        cause: Object.assign(new Error('socket reset'), { code: 'ECONNRESET' }),
      }))
      .mockResolvedValueOnce({ text: JSON.stringify(validPolicyAnalysis()) });

    await analyzePolicyChange('Example', 'Privacy', '', 'New policy text');

    expect(mocks.generateContent.mock.calls.map(([request]) => request.model)).toEqual([
      'gemini-2.5-flash',
      'gemini-3.5-flash-lite',
    ]);
  });

  it('falls back when the primary returns semantically invalid structured output', async () => {
    const invalid = validPolicyAnalysis();
    invalid.regionImpacts[5] = { ...invalid.regionImpacts[0] };
    mocks.generateContent
      .mockResolvedValueOnce({ text: JSON.stringify(invalid) })
      .mockResolvedValueOnce({ text: JSON.stringify(validPolicyAnalysis()) });

    const result = await analyzePolicyChange('Example', 'Privacy', '', 'New policy text');

    expect(result.regionImpacts).toHaveLength(6);
    expect(mocks.generateContent).toHaveBeenCalledTimes(2);
  });

  it('rejects incomplete evidence anchors before persistence', () => {
    const invalid = validPolicyAnalysis();
    invalid.riskReasons[0] = {
      ...invalid.riskReasons[0],
      evidenceQuote: 'Exact quote without a side',
    } as typeof invalid.riskReasons[number];

    expect(() => assertPolicyAnalysisResponse(invalid)).toThrow(GeminiStructuredOutputError);
  });
});
