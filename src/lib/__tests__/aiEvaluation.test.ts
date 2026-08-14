import { describe, expect, it } from 'vitest';
import goldenSetJson from '../../../evals/policy-analysis/golden-set.v1.json';
import {
  evaluateRetrieval,
  rankBm25,
  requireLoopbackAdapterUrl,
  runBaselineRetrieval,
  validateGoldenSet,
  type GoldenSet,
} from '@/lib/aiEvaluation';

describe('AI golden-set evaluation', () => {
  it('validates the frozen synthetic golden set', () => {
    expect(() => validateGoldenSet(goldenSetJson)).not.toThrow();
  });

  it('ranks an exact evidence clause above boilerplate', () => {
    const ranked = rankBm25('AI training opt out', [
      { id: 'boilerplate', text: 'privacy terms contact careers' },
      { id: 'evidence', text: 'Users can opt out of AI training in data controls.' },
    ]);
    expect(ranked[0].id).toBe('evidence');
  });

  it('produces deterministic baseline metrics and abstains on empty evidence', () => {
    const set = goldenSetJson as GoldenSet;
    const results = runBaselineRetrieval(set);
    const metrics = evaluateRetrieval(set.retrievalCases, results);
    expect(metrics.cases).toBe(set.retrievalCases.length);
    expect(metrics.hitAt3).toBeGreaterThanOrEqual(0.75);
    expect(results.find((result) => result.caseId === 'deletion-unanswerable')?.predictedAnswerable).toBe(false);
  });

  it('keeps golden-set adapter traffic on an explicit loopback boundary', () => {
    expect(requireLoopbackAdapterUrl('http://127.0.0.1:8101/embed#fragment', 'ADAPTER_URL')).toBe(
      'http://127.0.0.1:8101/embed',
    );
    expect(requireLoopbackAdapterUrl('http://[::1]:8102/rerank', 'ADAPTER_URL')).toBe(
      'http://[::1]:8102/rerank',
    );
    expect(() => requireLoopbackAdapterUrl('https://adapter.example/upload', 'ADAPTER_URL')).toThrow(
      /must target localhost/,
    );
    expect(() => requireLoopbackAdapterUrl('http://user:secret@localhost:8101/embed', 'ADAPTER_URL')).toThrow(
      /must not contain URL credentials/,
    );
  });
});
