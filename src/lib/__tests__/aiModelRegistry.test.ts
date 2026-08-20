import { describe, expect, it } from 'vitest';
import {
  AI_MODEL_REGISTRY,
  canPromoteAiModel,
  getAiModelCandidate,
  validateAiModelRegistry,
} from '@/lib/aiModelRegistry';

describe('AI model registry', () => {
  it('keeps promotion human-approved and restricted to observed passing candidates', () => {
    expect(() => validateAiModelRegistry(AI_MODEL_REGISTRY)).not.toThrow();
    expect(AI_MODEL_REGISTRY.promotionPolicy.automaticPromotion).toBe(false);
    expect(AI_MODEL_REGISTRY.candidates.filter(canPromoteAiModel).map((candidate) => candidate.id)).toEqual([
      'baseline-bm25',
      'gemini-3-5-flash-lite',
    ]);
  });

  it('keeps unavailable, unscored and architecture-only candidates out of promotion', () => {
    expect(canPromoteAiModel(getAiModelCandidate('gemini-3-7-flash')!)).toBe(false);
    expect(canPromoteAiModel(getAiModelCandidate('qwen3-embedding-reranker')!)).toBe(false);
    expect(AI_MODEL_REGISTRY.candidates.filter((candidate) => candidate.status === 'research-only').map((candidate) => candidate.id)).toEqual([
      'ragflow',
      'lightrag',
      'kimi-k3',
      'graphrag',
    ]);
  });

  it('rejects qualified candidates without observed passing evidence', () => {
    const invalid = structuredClone(AI_MODEL_REGISTRY) as unknown as { candidates: Array<{ id: string; evaluation: { cases: number } }> };
    invalid.candidates[0].evaluation.cases = 0;
    expect(() => validateAiModelRegistry(invalid)).toThrow(/lacks observed passing evidence/);
  });
});
