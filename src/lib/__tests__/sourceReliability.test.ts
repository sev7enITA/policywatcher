import { describe, expect, it } from 'vitest';
import {
  buildAcquisitionKey,
  classifyRetrievalCause,
  emptyRetrievalMetrics,
  recordRetrievalDiagnostics,
  sanitizeAcquisitionUrlForLog,
  terminalRetrievalCause,
} from '../sourceReliability';

describe('source reliability acquisition keys', () => {
  it('normalizes host, default port, query order and trailing slash without dropping meaningful fragments', () => {
    expect(buildAcquisitionKey('https://WWW.Example.com:443/legal/?b=2&a=1#privacy')).toBe(
      'https://example.com/legal?a=1&b=2#privacy'
    );
  });

  it('keeps distinct fragment-scoped policy sections separate', () => {
    expect(buildAcquisitionKey('https://example.com/legal#privacy')).not.toBe(
      buildAcquisitionKey('https://example.com/legal#terms')
    );
  });

  it('drops non-semantic tracking parameters while preserving policy selectors', () => {
    expect(buildAcquisitionKey('https://example.com/legal?nodeId=42&utm_source=newsletter&fbclid=secret')).toBe(
      'https://example.com/legal?nodeId=42'
    );
  });

  it('does not merge regional policy paths that represent different sources', () => {
    expect(buildAcquisitionKey('https://www.revolut.com/legal/privacy')).not.toBe(
      buildAcquisitionKey('https://www.revolut.com/en-GB/legal/privacy')
    );
  });

  it('removes credentials, query values and fragments from log-safe labels', () => {
    expect(sanitizeAcquisitionUrlForLog('https://user:password@example.com/legal/privacy?token=secret#section')).toBe(
      'https://example.com/legal/privacy'
    );
  });
});

describe('source reliability diagnostics', () => {
  it('prioritizes HTTP access and upstream state over generic short-content labels', () => {
    expect(classifyRetrievalCause({ status: 'rejected', httpStatus: 403, reason: 'content_too_short' })).toBe('access_blocked');
    expect(classifyRetrievalCause({ status: 'rejected', httpStatus: 503, reason: 'content_too_short' })).toBe('upstream_unavailable');
  });

  it('classifies terminal state from structured attempts rather than substring matching', () => {
    expect(terminalRetrievalCause([
      { source: 'direct', status: 'failed', httpStatus: 403, reason: 'HTTP 403' },
      { source: 'wayback', status: 'failed', reason: 'wayback_only_stale_snapshots' },
    ])).toBe('access_blocked');
  });

  it('counts unique retrieval metrics and degraded dependencies', () => {
    const metrics = emptyRetrievalMetrics(2, 1);
    recordRetrievalDiagnostics(metrics, [
      { source: 'direct', status: 'failed', httpStatus: 403, durationMs: 20 },
      { source: 'rendered', status: 'failed', httpStatus: 503, durationMs: 100 },
    ], 'unavailable', 'none');
    metrics.deduplicatedRetrievals += 1;

    expect(metrics).toMatchObject({
      policyRecords: 2,
      uniqueSources: 1,
      networkRetrievals: 1,
      deduplicatedRetrievals: 1,
      uniqueUnavailableSources: 1,
      retrievalAttempts: 2,
      degradedDependencies: ['rendered'],
    });
  });

  it('does not count a partial extraction as an available unique source', () => {
    const metrics = emptyRetrievalMetrics(1, 1);
    recordRetrievalDiagnostics(metrics, [
      { source: 'direct', status: 'partial', reason: 'partial_retrieval', durationMs: 30 },
    ], 'partial', 'direct');

    expect(metrics.uniqueAvailableSources).toBe(0);
    expect(metrics.uniqueUnavailableSources).toBe(1);
  });
});
