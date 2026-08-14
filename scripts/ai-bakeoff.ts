import { mkdir, readFile, writeFile } from 'fs/promises';
import { dirname, resolve } from 'path';
import { analyzePolicyChange } from '../src/lib/gemini';
import { classifyAiTelemetryError } from '../src/lib/aiTelemetry';
import {
  BASELINE_RETRIEVAL_ID,
  evaluateExtraction,
  evaluateRetrieval,
  passesGates,
  runBaselineRetrieval,
  validateGoldenSet,
  type ExtractionCaseResult,
  type GoldenRetrievalCase,
  type GoldenSet,
  type RankedPassage,
  type RetrievalCaseResult,
} from '../src/lib/aiEvaluation';

const ROOT = resolve(import.meta.dirname, '..');
const DEFAULT_GOLDEN_SET = resolve(ROOT, 'evals/policy-analysis/golden-set.v1.json');
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

async function postJson(url: string, body: unknown): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Adapter returned HTTP ${response.status}.`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function parseEmbeddings(value: unknown): number[][] {
  const record = value as { embeddings?: unknown; data?: Array<{ embedding?: unknown }> };
  const embeddings = Array.isArray(record?.embeddings)
    ? record.embeddings
    : Array.isArray(record?.data)
      ? record.data.map((item) => item.embedding)
      : null;
  if (!embeddings || embeddings.some((embedding) => !Array.isArray(embedding) || embedding.some((item) => typeof item !== 'number'))) {
    throw new Error('Embedding adapter response does not match the documented contract.');
  }
  return embeddings as number[][];
}

function cosine(left: number[], right: number[]): number {
  if (left.length !== right.length || left.length === 0) throw new Error('Embedding dimensions do not match.');
  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;
  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftNorm += left[index] ** 2;
    rightNorm += right[index] ** 2;
  }
  return dot / Math.max(Number.EPSILON, Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
}

function parseRerank(value: unknown, passages: GoldenRetrievalCase['passages']): RankedPassage[] {
  const record = value as { results?: unknown; data?: unknown };
  const candidates = Array.isArray(record?.results) ? record.results : Array.isArray(record?.data) ? record.data : null;
  if (!candidates) throw new Error('Reranker response does not match the documented contract.');
  const ranked = candidates.map((candidate) => {
    const item = candidate as { index?: unknown; score?: unknown; relevance_score?: unknown };
    const score = typeof item.score === 'number' ? item.score : item.relevance_score;
    if (!Number.isInteger(item.index) || (item.index as number) < 0 || (item.index as number) >= passages.length || typeof score !== 'number') {
      throw new Error('Reranker result contains an invalid index or score.');
    }
    return { id: passages[item.index as number].id, score: Math.round(score * 10_000) / 10_000 };
  });
  return ranked.sort((left, right) => right.score - left.score || left.id.localeCompare(right.id));
}

async function runAdapterRetrieval(
  cases: GoldenRetrievalCase[],
  configuration: { name: string; model: string; embeddingUrl: string; rerankerUrl?: string; threshold: number },
): Promise<RetrievalCaseResult[]> {
  const results: RetrievalCaseResult[] = [];
  for (const item of cases) {
    let ranked: RankedPassage[];
    if (configuration.rerankerUrl) {
      const response = await postJson(configuration.rerankerUrl, {
        model: configuration.model,
        query: item.query,
        documents: item.passages.map((passage) => passage.text),
        topK: item.passages.length,
      });
      ranked = parseRerank(response, item.passages);
    } else {
      const response = await postJson(configuration.embeddingUrl, {
        model: configuration.model,
        task: 'retrieval',
        texts: [item.query, ...item.passages.map((passage) => passage.text)],
      });
      const [queryEmbedding, ...documentEmbeddings] = parseEmbeddings(response);
      if (!queryEmbedding || documentEmbeddings.length !== item.passages.length) {
        throw new Error(`${configuration.name} adapter returned the wrong number of embeddings.`);
      }
      ranked = item.passages.map((passage, index) => ({
        id: passage.id,
        score: Math.round(cosine(queryEmbedding, documentEmbeddings[index]) * 10_000) / 10_000,
      })).sort((left, right) => right.score - left.score || left.id.localeCompare(right.id));
    }
    results.push({
      caseId: item.id,
      ranked,
      predictedAnswerable: (ranked[0]?.score || 0) >= configuration.threshold,
    });
  }
  return results;
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
  const sourcePath = resolve(argument('golden-set') || DEFAULT_GOLDEN_SET);
  const outputPath = resolve(argument('output') || DEFAULT_OUTPUT);
  const set = JSON.parse(await readFile(sourcePath, 'utf8')) as unknown;
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
    const results = runBaselineRetrieval(set);
    const metrics = evaluateRetrieval(set.retrievalCases, results);
    resultRecord.baseline = {
      adapter: BASELINE_RETRIEVAL_ID,
      metrics,
      passesFrozenGates: passesGates(metrics as unknown as Record<string, number>, set.gates.retrieval),
      cases: results,
    };
  }

  if (providers.includes('qwen3')) {
    const embeddingUrl = process.env.QWEN3_EMBEDDING_URL;
    const rerankerUrl = process.env.QWEN3_RERANKER_URL;
    if (!embeddingUrl || !rerankerUrl) throw new Error('QWEN3_EMBEDDING_URL and QWEN3_RERANKER_URL are required for qwen3.');
    const results = await runAdapterRetrieval(set.retrievalCases, {
      name: 'qwen3', model: process.env.QWEN3_RETRIEVAL_MODEL || 'Qwen3-Reranker-0.6B',
      embeddingUrl, rerankerUrl, threshold: numberFromEnvironment('QWEN3_ABSTENTION_THRESHOLD', 0.35),
    });
    const metrics = evaluateRetrieval(set.retrievalCases, results);
    resultRecord.qwen3 = { metrics, passesFrozenGates: passesGates(metrics as unknown as Record<string, number>, set.gates.retrieval), cases: results };
  }

  if (providers.includes('bge-m3')) {
    const embeddingUrl = process.env.BGE_M3_EMBEDDING_URL;
    if (!embeddingUrl) throw new Error('BGE_M3_EMBEDDING_URL is required for bge-m3.');
    const results = await runAdapterRetrieval(set.retrievalCases, {
      name: 'bge-m3', model: process.env.BGE_M3_MODEL || 'BAAI/bge-m3', embeddingUrl,
      rerankerUrl: process.env.BGE_M3_RERANKER_URL,
      threshold: numberFromEnvironment('BGE_M3_ABSTENTION_THRESHOLD', 0.35),
    });
    const metrics = evaluateRetrieval(set.retrievalCases, results);
    resultRecord['bge-m3'] = { metrics, passesFrozenGates: passesGates(metrics as unknown as Record<string, number>, set.gates.retrieval), cases: results };
  }

  if (providers.includes('gemini-3.5')) {
    const run = await runGeminiExtraction(set, 'gemini-3.5-flash-lite', false);
    const metrics = evaluateExtraction(run.cases, run.results);
    resultRecord['gemini-3.5'] = { model: 'gemini-3.5-flash-lite', scope: 'all-extraction-cases', metrics, passesFrozenGates: passesGates(metrics as unknown as Record<string, number>, set.gates.extraction), cases: run.results.map(({ caseId, errorCode }) => ({ caseId, errorCode })) };
  }

  if (providers.includes('gemini-3.7')) {
    const run = await runGeminiExtraction(set, 'gemini-3.7-flash', true);
    const metrics = evaluateExtraction(run.cases, run.results);
    resultRecord['gemini-3.7'] = { model: 'gemini-3.7-flash', scope: 'escalation-eligible-cases-only', metrics, passesFrozenGates: passesGates(metrics as unknown as Record<string, number>, set.gates.extraction), cases: run.results.map(({ caseId, errorCode }) => ({ caseId, errorCode })) };
  }

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ output: outputPath, providers, goldenSet: set.version }, null, 2));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
