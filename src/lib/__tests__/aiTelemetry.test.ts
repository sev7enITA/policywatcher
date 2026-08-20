import { describe, expect, it } from 'vitest';
import {
  AI_TELEMETRY_PRIVACY_BOUNDARY,
  AI_TELEMETRY_SEMCONV_SCHEMA_URL,
  AI_TELEMETRY_SEMCONV_SOURCE_URL,
  buildAiTelemetrySummary,
  buildAiTelemetrySemanticProjection,
  classifyAiTelemetryError,
  type AiTelemetryRow,
} from '@/lib/aiTelemetry';

describe('AI telemetry', () => {
  it('classifies only allowlisted error buckets', () => {
    expect(classifyAiTelemetryError(new Error('429 RESOURCE_EXHAUSTED'))).toEqual({
      outcome: 'transient-error', errorCode: 'rate_limited',
    });
    const invalid = new SyntaxError('private response text');
    expect(classifyAiTelemetryError(invalid)).toEqual({
      outcome: 'structured-output-error', errorCode: 'invalid_structured_output',
    });
    expect(classifyAiTelemetryError(new Error('secret provider detail'))).toEqual({
      outcome: 'provider-error', errorCode: 'provider_error',
    });
    const reset = new TypeError('fetch failed', { cause: Object.assign(new Error('socket reset'), { code: 'ECONNRESET' }) });
    expect(classifyAiTelemetryError(reset)).toEqual({
      outcome: 'transient-error', errorCode: 'network_error',
    });
  });

  it('aggregates model and fallback rates without content fields', () => {
    const rows: AiTelemetryRow[] = [
      {
        traceId: 'trace-a', operation: 'policy-analysis', modelId: 'primary', attempt: 0,
        fallbackUsed: false, outcome: 'structured-output-error', errorCode: 'invalid_structured_output',
        durationMs: 100, inputChars: 1_000, outputChars: 200, promptVersion: 'p1', schemaVersion: 's1',
        createdAt: '2026-08-13T12:00:00.000Z',
      },
      {
        traceId: 'trace-a', operation: 'policy-analysis', modelId: 'fallback', attempt: 1,
        fallbackUsed: true, outcome: 'success', durationMs: 300, inputChars: 1_000, outputChars: 400,
        promptTokenCount: 100, outputTokenCount: 50, totalTokenCount: 150,
        promptVersion: 'p1', schemaVersion: 's1', createdAt: '2026-08-13T12:00:01.000Z',
      },
    ];

    const summary = buildAiTelemetrySummary(rows, '2026-08-14T12:00:00.000Z');
    expect(summary).toMatchObject({ attempts: 2, traces: 1, successes: 1, successRate: 50, fallbackRate: 50 });
    expect(summary.models.find((model) => model.modelId === 'fallback')).toMatchObject({
      attempts: 1, successes: 1, averageTotalTokens: 150,
    });
    expect(AI_TELEMETRY_PRIVACY_BOUNDARY).toContain('never persisted');
  });

  it('projects privacy-safe OpenTelemetry GenAI attributes without content', () => {
    const projection = buildAiTelemetrySemanticProjection({
      traceId: 'trace-safe', operation: 'golden-set-extraction', modelId: 'gemini-3.5-flash-lite',
      attempt: 0, outcome: 'success', durationMs: 42, inputChars: 500, outputChars: 200,
      promptTokenCount: 100, outputTokenCount: 40, promptVersion: 'p1', schemaVersion: 's1',
    });
    expect(AI_TELEMETRY_SEMCONV_SCHEMA_URL).toBeNull();
    expect(projection.schemaUrl).toBeNull();
    expect(projection.conventionsSource).toBe(AI_TELEMETRY_SEMCONV_SOURCE_URL);
    expect(projection.attributes).toMatchObject({
      'gen_ai.operation.name': 'generate_content',
      'gen_ai.provider.name': 'gcp.gen_ai',
      'gen_ai.request.model': 'gemini-3.5-flash-lite',
      'gen_ai.response.model': 'gemini-3.5-flash-lite',
      'gen_ai.usage.input_tokens': 100,
      'gen_ai.usage.output_tokens': 40,
    });
    expect(JSON.stringify(projection)).not.toContain('trace-safe');
  });
});
