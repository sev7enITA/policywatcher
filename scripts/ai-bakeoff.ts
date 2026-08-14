import { mkdir, writeFile } from 'fs/promises';
import { dirname, resolve } from 'path';
import frozenGoldenSet from '../evals/policy-analysis/golden-set.v1.json';
import { analyzePolicyChange } from '../src/lib/gemini';
import { classifyAiTelemetryError } from '../src/lib/aiTelemetry';
import { runAdapterRetrieval } from '../src/lib/aiRetrievalAdapter';
import {
  BASELINE_RETRIEVAL_ID,
  evaluateExtraction,
  evaluateRetrieval,
  passesGates,
  requireLoopbackAdapterUrl,
  runBaselineRetrieval,
  validateGoldenSet,
  type ExtractionCaseResult,
  type GoldenSet,
} from '../src/lib/aiEvaluation';

const ROOT = resolve(import.meta.dirname, '..');
const DEFAULT_OUTPUT = resolve(ROOT, 'artifacts/evals/ai-bakeoff-latest.json');
const PROVIDERS = ['baseline', 'qwen3', 'bge-m3', 'gemini-3.5', 'gemini-3.7'] as const;
type Provider = (typeof PROVIDERS)[number];

function argument(name: string): string | null {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length) || null;
}

function selectedProviders(): Provider[] {
  const requested = (argument('providers') || 'baseline').split(',').map((value) => value.trim()).filter(Boolean);
  const unknown = requested.filter((value) => !PROVIDERS.includes(value as Provider));
  if (unknown.length) throw new Error(`Unknown providers: ${unknown.join(', ')}`);
  return requested as Provider[];
}

function numberFromEnvironment(name: string, fallback: number): number {
  const parsed = Number(process.env[name]);
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function runGeminiExtraction(
  set: GoldenSet,
  modelId: string,
  escalationOnly: boolean,
): Promise<{ cases: GoldenSet['extractionCases']; results: ExtractionCaseResult[] }> {
  if (!process.env.GEMINI_API_KEY) throw new Error(`GEMINI_API_KEY is required for ${modelId}.`);
  const cases = escalationOnly ? set.extractionCases.filter((item) => item.escalationEligible) : set.extractionCases;
  const results: ExtractionCaseResult[] = [];
  for (const item of cases) {
    try {
      const analysis = await analyzePolicyChange(
        item.companyName,
        item.policyName,
        item.oldText,
        item.newText,
        {
          modelChain: [modelId],
          telemetryOperation: escalationOnly ? 'golden-set-escalation' : 'golden-set-extraction',
        },
      );
      results.push({ caseId: item.id, analysis });
    } catch (error) {
      results.push({ caseId: item.id, analysis: null, errorCode: classifyAiTelemetryError(error).errorCode });
    }
  }
  return { cases, results };
}

async function main() {
  if (argument('golden-set')) {
    throw new Error('Custom golden-set paths are disabled. Version and review the frozen repository fixture instead.');
  }
  const outputPath = resolve(argument('output') || DEFAULT_OUTPUT);
  const set: unknown = frozenGoldenSet;
  validateGoldenSet(set);
  const providers = selectedProviders();

  if (process.argv.includes('--validate-only')) {
    console.log(JSON.stringify({ valid: true, version: set.version, retrievalCases: set.retrievalCases.length, extractionCases: set.extractionCases.length }, null, 2));
    return;
  }

  const report: Record<string, unknown> = {
    schemaVersion: 'policywatcher-bakeoff.v1',
    generatedAt: new Date().toISOString(),
    goldenSet: { version: set.version, frozenAt: set.frozenAt, status: set.status, boundary: set.boundary },
    evidenceFirstBoundary: 'No challenger is promoted automatically. Results must pass frozen gates and human evidence review; raw policy content is not written to this report.',
    results: {},
  };
  const resultRecord = report.results as Record<string, unknown>;

  if (providers.includes('baseline')) {
    const startedAt = performance.now();
    const results = runBaselineRetrieval(set);
    const metrics = evaluateRetrieval(set.retrievalCases, results);
    resultRecord.baseline = {
      adapter: BASELINE_RETRIEVAL_ID,
      metrics,
      passesFrozenGates: passesGates(metrics as unknown as Record<string, number>, set.gates.retrieval),
      durationMs: Math.round(performance.now() - startedAt),
      cases: results,
    };
  }

  if (providers.includes('qwen3')) {
    const startedAt = performance.now();
    const configuredEmbeddingUrl = process.env.QWEN3_EMBEDDING_URL;
    const configuredRerankerUrl = process.env.QWEN3_RERANKER_URL;
    if (!configuredEmbeddingUrl || !configuredRerankerUrl) throw new Error('QWEN3_EMBEDDING_URL and QWEN3_RERANKER_URL are required for qwen3.');
    const embeddingUrl = requireLoopbackAdapterUrl(configuredEmbeddingUrl, 'QWEN3_EMBEDDING_URL');
    const rerankerUrl = requireLoopbackAdapterUrl(configuredRerankerUrl, 'QWEN3_RERANKER_URL');
    const results = await runAdapterRetrieval(set.retrievalCases, {
      name: 'qwen3',
      embeddingModel: process.env.QWEN3_EMBEDDING_MODEL || 'Qwen/Qwen3-Embedding-0.6B',
      embeddingUrl,
      rerankerModel: process.env.QWEN3_RERANKER_MODEL || process.env.QWEN3_RETRIEVAL_MODEL || 'Qwen/Qwen3-Reranker-0.6B',
      rerankerUrl,
      rerankCandidateCount: 2,
      threshold: numberFromEnvironment('QWEN3_ABSTENTION_THRESHOLD', 0.35),
    });
    const metrics = evaluateRetrieval(set.retrievalCases, results);
    resultRecord.qwen3 = {
      embeddingModel: process.env.QWEN3_EMBEDDING_MODEL || 'Qwen/Qwen3-Embedding-0.6B',
      rerankerModel: process.env.QWEN3_RERANKER_MODEL || process.env.QWEN3_RETRIEVAL_MODEL || 'Qwen/Qwen3-Reranker-0.6B',
      metrics,
      passesFrozenGates: passesGates(metrics as unknown as Record<string, number>, set.gates.retrieval),
      durationMs: Math.round(performance.now() - startedAt),
      cases: results,
    };
  }

  if (providers.includes('bge-m3')) {
    const startedAt = performance.now();
    const configuredEmbeddingUrl = process.env.BGE_M3_EMBEDDING_URL;
    if (!configuredEmbeddingUrl) throw new Error('BGE_M3_EMBEDDING_URL is required for bge-m3.');
    const embeddingUrl = requireLoopbackAdapterUrl(configuredEmbeddingUrl, 'BGE_M3_EMBEDDING_URL');
    const configuredRerankerUrl = process.env.BGE_M3_RERANKER_URL;
    const results = await runAdapterRetrieval(set.retrievalCases, {
      name: 'bge-m3', embeddingModel: process.env.BGE_M3_MODEL || 'BAAI/bge-m3', embeddingUrl,
      rerankerUrl: configuredRerankerUrl
        ? requireLoopbackAdapterUrl(configuredRerankerUrl, 'BGE_M3_RERANKER_URL')
        : undefined,
      rerankerModel: configuredRerankerUrl
        ? process.env.BGE_M3_RERANKER_MODEL || 'BAAI/bge-reranker-v2-m3'
        : undefined,
      threshold: numberFromEnvironment('BGE_M3_ABSTENTION_THRESHOLD', 0.35),
    });
    const metrics = evaluateRetrieval(set.retrievalCases, results);
    resultRecord['bge-m3'] = { model: process.env.BGE_M3_MODEL || 'BAAI/bge-m3', metrics, passesFrozenGates: passesGates(metrics as unknown as Record<string, number>, set.gates.retrieval), durationMs: Math.round(performance.now() - startedAt), cases: results };
  }

  if (providers.includes('gemini-3.5')) {
    const startedAt = performance.now();
    const run = await runGeminiExtraction(set, 'gemini-3.5-flash-lite', false);
    const metrics = evaluateExtraction(run.cases, run.results);
    resultRecord['gemini-3.5'] = { model: 'gemini-3.5-flash-lite', scope: 'all-extraction-cases', metrics, passesFrozenGates: passesGates(metrics as unknown as Record<string, number>, set.gates.extraction), durationMs: Math.round(performance.now() - startedAt), cases: run.results.map(({ caseId, errorCode }) => ({ caseId, errorCode })) };
  }

  if (providers.includes('gemini-3.7')) {
    const startedAt = performance.now();
    const run = await runGeminiExtraction(set, 'gemini-3.7-flash', true);
    const metrics = evaluateExtraction(run.cases, run.results);
    resultRecord['gemini-3.7'] = { model: 'gemini-3.7-flash', scope: 'escalation-eligible-cases-only', metrics, passesFrozenGates: passesGates(metrics as unknown as Record<string, number>, set.gates.extraction), durationMs: Math.round(performance.now() - startedAt), cases: run.results.map(({ caseId, errorCode }) => ({ caseId, errorCode })) };
  }

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ output: outputPath, providers, goldenSet: set.version }, null, 2));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
