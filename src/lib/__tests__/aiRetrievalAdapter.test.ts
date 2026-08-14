import { describe, expect, it, vi } from 'vitest';
import { runAdapterRetrieval } from '../aiRetrievalAdapter';
import type { GoldenRetrievalCase } from '../aiEvaluation';

const retrievalCase: GoldenRetrievalCase = {
  id: 'two-stage',
  language: 'en',
  category: 'test',
  query: 'retention period',
  answerable: true,
  passages: [
    { id: 'dense-first', text: 'Data is retained.' },
    { id: 'reranker-first', text: 'The retention period is thirty days.' },
    { id: 'irrelevant', text: 'Contact support.' },
  ],
  relevantPassageIds: ['reranker-first'],
};

describe('runAdapterRetrieval', () => {
  it('uses Qwen embeddings for candidate retrieval before reranking', async () => {
    const postJson = vi.fn(async (url: string, body: unknown) => {
      if (url.endsWith('/embed')) {
        return { embeddings: [[1, 0], [0.99, 0.01], [0.9, 0.1], [0, 1]] };
      }
      expect(body).toMatchObject({
        model: 'Qwen/Qwen3-Reranker-0.6B',
        documents: ['Data is retained.', 'The retention period is thirty days.'],
      });
      return { results: [{ index: 1, score: 0.95 }, { index: 0, score: 0.7 }] };
    });

    const [result] = await runAdapterRetrieval([retrievalCase], {
      name: 'qwen3',
      embeddingModel: 'Qwen/Qwen3-Embedding-0.6B',
      embeddingUrl: 'http://127.0.0.1:8101/embed',
      rerankerModel: 'Qwen/Qwen3-Reranker-0.6B',
      rerankerUrl: 'http://127.0.0.1:8101/rerank',
      rerankCandidateCount: 2,
      threshold: 0.35,
    }, postJson);

    expect(postJson).toHaveBeenCalledTimes(2);
    expect(postJson.mock.calls[0][1]).toMatchObject({ model: 'Qwen/Qwen3-Embedding-0.6B' });
    expect(result.ranked.map((passage) => passage.id)).toEqual([
      'reranker-first',
      'dense-first',
      'irrelevant',
    ]);
  });
});
