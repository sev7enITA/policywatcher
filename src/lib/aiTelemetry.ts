import { db } from '@/lib/db';

export const AI_TELEMETRY_RETENTION_DAYS = 90;
export const AI_TELEMETRY_WINDOW_DAYS = 30;
export const AI_TELEMETRY_QUERY_LIMIT = 5_000;
export const AI_ANALYSIS_PROMPT_VERSION = 'policy-analysis.v2';
export const AI_CHAT_PROMPT_VERSION = 'policy-chat.v1';

export type AiTelemetryOperation =
  | 'policy-analysis'
  | 'policy-chat'
  | 'golden-set-extraction'
  | 'golden-set-escalation';

export type AiTelemetryOutcome =
  | 'success'
  | 'transient-error'
  | 'structured-output-error'
  | 'provider-error';

export interface AiTelemetryEvent {
  traceId: string;
  operation: AiTelemetryOperation;
  modelId: string;
  attempt: number;
  outcome: AiTelemetryOutcome;
  errorCode?: string | null;
  durationMs: number;
  inputChars: number;
  outputChars?: number | null;
  promptTokenCount?: number | null;
  outputTokenCount?: number | null;
  totalTokenCount?: number | null;
  schemaVersion?: string | null;
  promptVersion: string;
}

export interface AiTelemetryRow extends AiTelemetryEvent {
  fallbackUsed: boolean;
  createdAt: Date | string;
}

export interface AiTelemetryModelSummary {
  modelId: string;
  attempts: number;
  successes: number;
  successRate: number;
  structuredOutputFailures: number;
  transientFailures: number;
  fallbackAttempts: number;
  averageDurationMs: number;
  averageTotalTokens: number | null;
}

export interface AiTelemetrySummary {
  checkedAt: string;
  windowStartedAt: string;
  windowDays: number;
  attempts: number;
  traces: number;
  successes: number;
  successRate: number | null;
  fallbackRate: number | null;
  structuredOutputFailureRate: number | null;
  models: AiTelemetryModelSummary[];
  privacyBoundary: string;
}

export const AI_TELEMETRY_PRIVACY_BOUNDARY =
  'Stores model, operation, outcome, latency, character counts, token counts and schema/prompt versions only. Policy text, prompts, responses, company names, policy names, user questions, URLs, IP addresses and provider error messages are never persisted. Retention is 90 days.';

function roundRate(numerator: number, denominator: number): number {
  return denominator ? Math.round((numerator / denominator) * 1_000) / 10 : 0;
}

function average(values: number[]): number {
  return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
}

export function classifyAiTelemetryError(error: unknown): {
  outcome: Exclude<AiTelemetryOutcome, 'success'>;
  errorCode: string;
} {
  const name = error instanceof Error ? error.name : '';
  const message = error instanceof Error ? error.message : String(error);
  if (name === 'GeminiStructuredOutputError' || name === 'SyntaxError') {
    return { outcome: 'structured-output-error', errorCode: 'invalid_structured_output' };
  }
  if (/429|RESOURCE_EXHAUSTED|rate.?limit/i.test(message)) {
    return { outcome: 'transient-error', errorCode: 'rate_limited' };
  }
  if (/503|UNAVAILABLE|overloaded|high demand/i.test(message)) {
    return { outcome: 'transient-error', errorCode: 'provider_unavailable' };
  }
  if (/timeout|timed out|ETIMEDOUT/i.test(message)) {
    return { outcome: 'transient-error', errorCode: 'timeout' };
  }
  return { outcome: 'provider-error', errorCode: 'provider_error' };
}

export function buildAiTelemetrySummary(
  rows: readonly AiTelemetryRow[],
  checkedAt = new Date().toISOString(),
): AiTelemetrySummary {
  const windowStarted = new Date(new Date(checkedAt).getTime() - AI_TELEMETRY_WINDOW_DAYS * 86_400_000);
  const eligible = rows.filter((row) => {
    const createdAt = new Date(row.createdAt);
    return !Number.isNaN(createdAt.getTime()) && createdAt >= windowStarted && createdAt <= new Date(checkedAt);
  });
  const successes = eligible.filter((row) => row.outcome === 'success').length;
  const fallbacks = eligible.filter((row) => row.fallbackUsed).length;
  const structuredFailures = eligible.filter((row) => row.outcome === 'structured-output-error').length;
  const models = [...new Set(eligible.map((row) => row.modelId))].sort().map((modelId) => {
    const attempts = eligible.filter((row) => row.modelId === modelId);
    const modelSuccesses = attempts.filter((row) => row.outcome === 'success').length;
    const tokenValues = attempts
      .map((row) => row.totalTokenCount)
      .filter((value): value is number => typeof value === 'number');
    return {
      modelId,
      attempts: attempts.length,
      successes: modelSuccesses,
      successRate: roundRate(modelSuccesses, attempts.length),
      structuredOutputFailures: attempts.filter((row) => row.outcome === 'structured-output-error').length,
      transientFailures: attempts.filter((row) => row.outcome === 'transient-error').length,
      fallbackAttempts: attempts.filter((row) => row.fallbackUsed).length,
      averageDurationMs: average(attempts.map((row) => row.durationMs)),
      averageTotalTokens: tokenValues.length ? average(tokenValues) : null,
    };
  });

  return {
    checkedAt,
    windowStartedAt: windowStarted.toISOString(),
    windowDays: AI_TELEMETRY_WINDOW_DAYS,
    attempts: eligible.length,
    traces: new Set(eligible.map((row) => row.traceId)).size,
    successes,
    successRate: eligible.length ? roundRate(successes, eligible.length) : null,
    fallbackRate: eligible.length ? roundRate(fallbacks, eligible.length) : null,
    structuredOutputFailureRate: eligible.length ? roundRate(structuredFailures, eligible.length) : null,
    models,
    privacyBoundary: AI_TELEMETRY_PRIVACY_BOUNDARY,
  };
}

export async function recordAiTelemetry(event: AiTelemetryEvent): Promise<void> {
  if (process.env.NODE_ENV === 'test' || process.env.AI_TELEMETRY_DISABLED === 'true') return;
  try {
    await db.aiModelInvocation.create({
      data: {
        traceId: event.traceId,
        operation: event.operation,
        provider: 'google',
        modelId: event.modelId,
        attempt: event.attempt,
        fallbackUsed: event.attempt > 0,
        outcome: event.outcome,
        errorCode: event.errorCode || null,
        durationMs: Math.max(0, Math.round(event.durationMs)),
        inputChars: Math.max(0, Math.round(event.inputChars)),
        outputChars: event.outputChars == null ? null : Math.max(0, Math.round(event.outputChars)),
        promptTokenCount: event.promptTokenCount == null ? null : Math.max(0, Math.round(event.promptTokenCount)),
        outputTokenCount: event.outputTokenCount == null ? null : Math.max(0, Math.round(event.outputTokenCount)),
        totalTokenCount: event.totalTokenCount == null ? null : Math.max(0, Math.round(event.totalTokenCount)),
        schemaVersion: event.schemaVersion || null,
        promptVersion: event.promptVersion,
      },
    });

    if (event.attempt === 0) {
      const cutoff = new Date(Date.now() - AI_TELEMETRY_RETENTION_DAYS * 86_400_000);
      await db.aiModelInvocation.deleteMany({ where: { createdAt: { lt: cutoff } } });
    }
  } catch (error) {
    // Telemetry is deliberately fail-open: evidence ingestion must never be
    // blocked by an observability write or a database rolling upgrade.
    console.warn('[AI Telemetry] Event was not persisted:', error instanceof Error ? error.name : 'unknown_error');
  }
}

export async function getAiTelemetrySummary(now = new Date()): Promise<AiTelemetrySummary> {
  const windowStartedAt = new Date(now.getTime() - AI_TELEMETRY_WINDOW_DAYS * 86_400_000);
  const rows = await db.aiModelInvocation.findMany({
    where: { createdAt: { gte: windowStartedAt, lte: now } },
    orderBy: { createdAt: 'desc' },
    take: AI_TELEMETRY_QUERY_LIMIT,
  });
  return buildAiTelemetrySummary(rows.map((row) => ({
    ...row,
    operation: row.operation as AiTelemetryOperation,
    outcome: row.outcome as AiTelemetryOutcome,
  })), now.toISOString());
}
