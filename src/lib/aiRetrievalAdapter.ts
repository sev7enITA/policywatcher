import type {
  GoldenRetrievalCase,
  RankedPassage,
  RetrievalCaseResult,
} from '@/lib/aiEvaluation';

export interface AdapterRetrievalConfiguration {
  name: string;
  embeddingModel: string;
  embeddingUrl: string;
  rerankerModel?: string;
  rerankerUrl?: string;
  rerankCandidateCount?: number;
  threshold: number;
}

export type AdapterPostJson = (url: string, body: unknown) => Promise<unknown>;

export async function postAdapterJson(url: string, body: unknown): Promise<unknown> {
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
  const indexes = new Set<number>();
  const ranked = candidates.map((candidate) => {
    const item = candidate as { index?: unknown; score?: unknown; relevance_score?: unknown };
    const score = typeof item.score === 'number' ? item.score : item.relevance_score;
    if (!Number.isInteger(item.index) || (item.index as number) < 0 || (item.index as number) >= passages.length || typeof score !== 'number') {
      throw new Error('Reranker result contains an invalid index or score.');
    }
    if (indexes.has(item.index as number)) throw new Error('Reranker result contains a duplicate index.');
    indexes.add(item.index as number);
    return { id: passages[item.index as number].id, score: Math.round(score * 10_000) / 10_000 };
  });
  return ranked.sort((left, right) => right.score - left.score || left.id.localeCompare(right.id));
}

export async function runAdapterRetrieval(
  cases: GoldenRetrievalCase[],
  configuration: AdapterRetrievalConfiguration,
  postJson: AdapterPostJson = postAdapterJson,
): Promise<RetrievalCaseResult[]> {
  const results: RetrievalCaseResult[] = [];
  for (const item of cases) {
    const response = await postJson(configuration.embeddingUrl, {
      model: configuration.embeddingModel,
      task: 'retrieval',
      texts: [item.query, ...item.passages.map((passage) => passage.text)],
    });
    const [queryEmbedding, ...documentEmbeddings] = parseEmbeddings(response);
    if (!queryEmbedding || documentEmbeddings.length !== item.passages.length) {
      throw new Error(`${configuration.name} adapter returned the wrong number of embeddings.`);
    }
    const denseRanked = item.passages.map((passage, index) => ({
      id: passage.id,
      score: Math.round(cosine(queryEmbedding, documentEmbeddings[index]) * 10_000) / 10_000,
    })).sort((left, right) => right.score - left.score || left.id.localeCompare(right.id));

    let ranked = denseRanked;
    if (configuration.rerankerUrl && configuration.rerankerModel) {
      const candidateCount = Math.max(
        1,
        Math.min(configuration.rerankCandidateCount || 2, item.passages.length),
      );
      const candidateIds = new Set(denseRanked.slice(0, candidateCount).map((passage) => passage.id));
      const candidates = item.passages.filter((passage) => candidateIds.has(passage.id));
      const reranked = parseRerank(await postJson(configuration.rerankerUrl, {
        model: configuration.rerankerModel,
        query: item.query,
        documents: candidates.map((passage) => passage.text),
        topK: candidates.length,
      }), candidates);
      const rerankedIds = new Set(reranked.map((passage) => passage.id));
      ranked = [...reranked, ...denseRanked.filter((passage) => !rerankedIds.has(passage.id))];
    }

    results.push({
      caseId: item.id,
      ranked,
      predictedAnswerable: (ranked[0]?.score || 0) >= configuration.threshold,
    });
  }
  return results;
}
