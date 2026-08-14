import type { PolicyAnalysisResult } from '@/lib/gemini';

export const BASELINE_RETRIEVAL_ID = 'bm25-word-v1';
export const BASELINE_ABSTENTION_THRESHOLD = 0.75;

export interface GoldenPassage { id: string; text: string }
export interface GoldenRetrievalCase {
  id: string;
  language: 'en' | 'it';
  category: string;
  query: string;
  answerable: boolean;
  passages: GoldenPassage[];
  relevantPassageIds: string[];
}
export interface GoldenExtractionCase {
  id: string;
  language: 'en' | 'it';
  category: string;
  companyName: string;
  policyName: string;
  oldText: string;
  newText: string;
  expectedRisk: 'Low' | 'Medium' | 'High';
  requiredEvidenceQuotes: string[];
  forbiddenClaims: string[];
  escalationEligible: boolean;
}
export interface GoldenSet {
  version: string;
  frozenAt: string;
  status: string;
  boundary: string;
  gates: {
    retrieval: Record<'hitAt3' | 'mrr' | 'answerabilityAccuracy' | 'abstentionF1', number>;
    extraction: Record<'schemaPassRate' | 'riskAccuracy' | 'requiredEvidenceRecall' | 'evidencePrecision', number>;
  };
  retrievalCases: GoldenRetrievalCase[];
  extractionCases: GoldenExtractionCase[];
}

export interface RankedPassage { id: string; score: number }
export interface RetrievalCaseResult {
  caseId: string;
  ranked: RankedPassage[];
  predictedAnswerable: boolean;
}
export interface RetrievalMetrics {
  cases: number;
  hitAt1: number;
  hitAt3: number;
  mrr: number;
  answerabilityAccuracy: number;
  abstentionPrecision: number;
  abstentionRecall: number;
  abstentionF1: number;
}
export interface ExtractionCaseResult {
  caseId: string;
  analysis: PolicyAnalysisResult | null;
  errorCode?: string;
}
export interface ExtractionMetrics {
  cases: number;
  completed: number;
  schemaPassRate: number;
  riskAccuracy: number;
  requiredEvidenceRecall: number;
  evidencePrecision: number;
  forbiddenClaimRate: number;
}

function tokens(text: string): string[] {
  return (text.toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu) || []).filter((token) => token.length > 1);
}

function round(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

export function validateGoldenSet(value: unknown): asserts value is GoldenSet {
  if (!value || typeof value !== 'object') throw new Error('Golden set must be an object.');
  const set = value as Partial<GoldenSet>;
  if (!set.version || !set.frozenAt || !set.boundary) throw new Error('Golden set metadata is incomplete.');
  if (!Array.isArray(set.retrievalCases) || !Array.isArray(set.extractionCases)) {
    throw new Error('Golden set case arrays are missing.');
  }
  const ids = new Set<string>();
  for (const item of [...set.retrievalCases, ...set.extractionCases]) {
    if (!item.id || ids.has(item.id)) throw new Error(`Duplicate or missing golden case id: ${item.id || 'unknown'}`);
    ids.add(item.id);
  }
  for (const item of set.retrievalCases) {
    const passageIds = new Set(item.passages.map((passage) => passage.id));
    if (item.answerable !== (item.relevantPassageIds.length > 0)) {
      throw new Error(`Answerability mismatch in ${item.id}.`);
    }
    if (item.relevantPassageIds.some((id) => !passageIds.has(id))) {
      throw new Error(`Unknown relevant passage in ${item.id}.`);
    }
  }
  for (const item of set.extractionCases) {
    const source = `${item.oldText}\n${item.newText}`;
    if (item.requiredEvidenceQuotes.some((quote) => !source.includes(quote))) {
      throw new Error(`Required evidence is not verbatim source text in ${item.id}.`);
    }
  }
}

export function rankBm25(query: string, passages: readonly GoldenPassage[]): RankedPassage[] {
  const queryTokens = tokens(query);
  const documentTokens = passages.map((passage) => tokens(passage.text));
  const averageLength = documentTokens.reduce((sum, document) => sum + document.length, 0) / Math.max(1, passages.length);
  const k1 = 1.2;
  const b = 0.75;
  return passages.map((passage, index) => {
    const document = documentTokens[index];
    const frequencies = new Map<string, number>();
    for (const token of document) frequencies.set(token, (frequencies.get(token) || 0) + 1);
    let score = 0;
    for (const token of new Set(queryTokens)) {
      const frequency = frequencies.get(token) || 0;
      if (!frequency) continue;
      const documentFrequency = documentTokens.filter((candidate) => candidate.includes(token)).length;
      const idf = Math.log(1 + (passages.length - documentFrequency + 0.5) / (documentFrequency + 0.5));
      score += idf * ((frequency * (k1 + 1)) / (frequency + k1 * (1 - b + b * document.length / Math.max(1, averageLength))));
    }
    return { id: passage.id, score: round(score) };
  }).sort((left, right) => right.score - left.score || left.id.localeCompare(right.id));
}

export function runBaselineRetrieval(set: GoldenSet): RetrievalCaseResult[] {
  return set.retrievalCases.map((item) => {
    const ranked = rankBm25(item.query, item.passages);
    return {
      caseId: item.id,
      ranked,
      predictedAnswerable: (ranked[0]?.score || 0) >= BASELINE_ABSTENTION_THRESHOLD,
    };
  });
}

export function evaluateRetrieval(
  cases: readonly GoldenRetrievalCase[],
  results: readonly RetrievalCaseResult[],
): RetrievalMetrics {
  const byId = new Map(results.map((result) => [result.caseId, result]));
  let hit1 = 0;
  let hit3 = 0;
  let reciprocalRank = 0;
  let answerabilityCorrect = 0;
  let abstainTruePositive = 0;
  let abstainFalsePositive = 0;
  let abstainFalseNegative = 0;
  let answerableCases = 0;
  for (const item of cases) {
    const result = byId.get(item.id);
    if (!result) continue;
    const relevant = new Set(item.relevantPassageIds);
    const firstRelevant = result.ranked.findIndex((passage) => relevant.has(passage.id));
    if (item.answerable) {
      answerableCases += 1;
      if (firstRelevant === 0) hit1 += 1;
      if (firstRelevant >= 0 && firstRelevant < 3) hit3 += 1;
      if (firstRelevant >= 0) reciprocalRank += 1 / (firstRelevant + 1);
    }
    if (result.predictedAnswerable === item.answerable) answerabilityCorrect += 1;
    const predictedAbstain = !result.predictedAnswerable;
    const shouldAbstain = !item.answerable;
    if (predictedAbstain && shouldAbstain) abstainTruePositive += 1;
    else if (predictedAbstain) abstainFalsePositive += 1;
    else if (shouldAbstain) abstainFalseNegative += 1;
  }
  const count = cases.length;
  const precision = abstainTruePositive / Math.max(1, abstainTruePositive + abstainFalsePositive);
  const recall = abstainTruePositive / Math.max(1, abstainTruePositive + abstainFalseNegative);
  return {
    cases: count,
    hitAt1: round(hit1 / Math.max(1, answerableCases)),
    hitAt3: round(hit3 / Math.max(1, answerableCases)),
    mrr: round(reciprocalRank / Math.max(1, answerableCases)),
    answerabilityAccuracy: round(answerabilityCorrect / Math.max(1, count)),
    abstentionPrecision: round(precision),
    abstentionRecall: round(recall),
    abstentionF1: round((2 * precision * recall) / Math.max(Number.EPSILON, precision + recall)),
  };
}

export function evaluateExtraction(
  cases: readonly GoldenExtractionCase[],
  results: readonly ExtractionCaseResult[],
): ExtractionMetrics {
  const byId = new Map(results.map((result) => [result.caseId, result]));
  let completed = 0;
  let riskCorrect = 0;
  let requiredFound = 0;
  let requiredTotal = 0;
  let evidenceSupported = 0;
  let evidenceTotal = 0;
  let forbiddenClaims = 0;
  for (const item of cases) {
    const analysis = byId.get(item.id)?.analysis;
    requiredTotal += item.requiredEvidenceQuotes.length;
    if (!analysis) continue;
    completed += 1;
    if (analysis.overallRisk === item.expectedRisk) riskCorrect += 1;
    const evidence = analysis.riskReasons.flatMap((reason) => reason.evidenceQuote ? [reason.evidenceQuote] : []);
    requiredFound += item.requiredEvidenceQuotes.filter((quote) => evidence.some((candidate) => candidate.includes(quote))).length;
    evidenceTotal += evidence.length;
    const source = `${item.oldText}\n${item.newText}`;
    evidenceSupported += evidence.filter((quote) => source.includes(quote)).length;
    const rendered = JSON.stringify(analysis).toLocaleLowerCase();
    forbiddenClaims += item.forbiddenClaims.filter((claim) => rendered.includes(claim.toLocaleLowerCase())).length;
  }
  return {
    cases: cases.length,
    completed,
    schemaPassRate: round(completed / Math.max(1, cases.length)),
    riskAccuracy: round(riskCorrect / Math.max(1, completed)),
    requiredEvidenceRecall: round(requiredFound / Math.max(1, requiredTotal)),
    evidencePrecision: round(evidenceSupported / Math.max(1, evidenceTotal)),
    forbiddenClaimRate: round(forbiddenClaims / Math.max(1, completed)),
  };
}

export function passesGates(metrics: Record<string, number>, gates: Record<string, number>): boolean {
  return Object.entries(gates).every(([key, minimum]) => typeof metrics[key] === 'number' && metrics[key] >= minimum);
}
