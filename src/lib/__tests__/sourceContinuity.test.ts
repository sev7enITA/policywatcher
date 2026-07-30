import { describe, expect, it } from 'vitest';
import {
  buildSourceContinuityResponse,
  canStartSourceContinuityRequest,
  normalizeSourceContinuityChannel,
  type SourceContinuityPolicyInput,
} from '../sourceContinuity';

function policy(
  overrides: Partial<SourceContinuityPolicyInput> = {}
): SourceContinuityPolicyInput {
  return {
    id: 'policy-1',
    name: 'Privacy Policy',
    type: 'privacy',
    jurisdiction: 'EU',
    url: 'https://user:secret@policies.example.com/privacy?token=private',
    company: {
      id: 'company-1',
      name: 'Example Company',
      slug: 'example-company',
      industry: 'Technology',
    },
    snapshots: [{ publicEvidence: true }],
    checkLogs: [],
    _count: { checkLogs: 0 },
    ...overrides,
  };
}

describe('source continuity public contract', () => {
  it('allows one activation request and one request per explicit retry only', () => {
    let status: 'idle' | 'loading' | 'success' | 'error' = 'idle';
    let requests = 0;
    const attempt = (trigger: 'activation' | 'retry') => {
      if (!canStartSourceContinuityRequest(status, trigger)) return;
      requests += 1;
      status = 'loading';
    };

    attempt('activation');
    attempt('activation');
    expect(requests).toBe(1);

    status = 'error';
    attempt('activation');
    expect(requests).toBe(1);

    attempt('retry');
    attempt('retry');
    expect(requests).toBe(2);
  });

  it('collapses repeated base states and preserves one verified recovery transition', () => {
    const result = buildSourceContinuityResponse(
      [
        policy({
          checkLogs: [
            { id: 'available-2', status: 'Available', checkedAt: '2026-07-04T00:00:00Z', source: 'direct' },
            { id: 'available-1', status: 'Available', checkedAt: '2026-07-03T00:00:00Z', source: 'http2' },
            { id: 'unavailable-2', status: 'Unavailable', checkedAt: '2026-07-02T00:00:00Z', source: 'none' },
            { id: 'unavailable-1', status: 'Unavailable', checkedAt: '2026-07-01T00:00:00Z', source: 'none' },
          ],
          _count: { checkLogs: 4 },
        }),
      ],
      1,
      new Date('2026-07-05T00:00:00Z')
    );

    expect(result.events).toHaveLength(2);
    expect(result.events.map((event) => event.state)).toEqual(['recovered', 'unavailable']);
    expect(result.events[0]).toMatchObject({
      id: 'available-1',
      state: 'recovered',
      cause: 'verified_retrieval',
      isLatestTransition: true,
    });
    expect(result.recoveredCount).toBe(1);
    expect(result.currentWithheldCount).toBe(0);
  });

  it('does not label retrieval as recovered without public snapshot evidence', () => {
    const result = buildSourceContinuityResponse(
      [
        policy({
          snapshots: [],
          checkLogs: [
            { id: 'available', status: 'Reviewed', checkedAt: '2026-07-02T00:00:00Z', source: 'direct' },
            { id: 'partial', status: 'Partial', checkedAt: '2026-07-01T00:00:00Z', source: 'renderer' },
          ],
        }),
      ],
      1
    );

    expect(result.events[0]).toMatchObject({
      state: 'verified',
      hasPublicSnapshotEvidence: false,
    });
  });

  it('returns only sanitized allowlisted metadata and strips URL secrets', () => {
    const unsafeLog = {
      id: 'log-1',
      status: 'Needs Review',
      checkedAt: '2026-07-01T00:00:00Z',
      source: 'private-fetcher-v9',
      reason: 'raw private failure reason',
      finalUrl: 'https://private.example/redirect?key=secret',
      textHash: 'private-hash',
      textLength: 999,
    };
    const result = buildSourceContinuityResponse(
      [policy({ checkLogs: [unsafeLog] })],
      1
    );
    const serialized = JSON.stringify(result);

    expect(result.events[0]).toMatchObject({
      state: 'needs_review',
      cause: 'quality_review_required',
      retrievalChannel: 'other',
      policy: { sourceHost: 'policies.example.com' },
    });
    expect(serialized).not.toContain('raw private failure reason');
    expect(serialized).not.toContain('private.example');
    expect(serialized).not.toContain('private-hash');
    expect(serialized).not.toContain('token=private');
  });

  it('normalizes retrieval channels to the public allowlist', () => {
    expect(normalizeSourceContinuityChannel('Direct Scrape')).toBe('direct');
    expect(normalizeSourceContinuityChannel('HTTP-2')).toBe('http2');
    expect(normalizeSourceContinuityChannel('VPS Renderer')).toBe('renderer');
    expect(normalizeSourceContinuityChannel('Wayback Cache')).toBe('archive');
    expect(normalizeSourceContinuityChannel('Common Crawl')).toBe('commoncrawl');
    expect(normalizeSourceContinuityChannel('internal-special-fetcher')).toBe('other');
    expect(normalizeSourceContinuityChannel(null)).toBe('none');
  });

  it('exposes dated historical-reference metadata without making it eligible for change detection', () => {
    const result = buildSourceContinuityResponse([
      policy({
        snapshots: [{ publicEvidence: true, createdAt: '2026-07-20T00:00:00Z' }],
        historicalReferences: [{
          source: 'wayback',
          capturedAt: '2026-07-10T00:00:00Z',
          observedAt: '2026-07-30T00:00:00Z',
          eligibleForChangeDetection: false,
        }],
        checkLogs: [{ id: 'unavailable', status: 'Unavailable', checkedAt: '2026-07-30T00:00:00Z', source: 'none' }],
      }),
    ], 1);

    expect(result.events[0]).toMatchObject({
      currentness: 'not_verified',
      lastVerifiedEvidenceAt: '2026-07-20T00:00:00.000Z',
      historicalReference: {
        retrievalChannel: 'archive',
        capturedAt: '2026-07-10T00:00:00.000Z',
        eligibleForChangeDetection: false,
      },
    });
  });

  it('marks bounded output as truncated without exceeding per-policy log limits', () => {
    const checkLogs = Array.from({ length: 30 }, (_, index) => ({
      id: `log-${index}`,
      status: index % 2 === 0 ? 'Available' : 'Partial',
      checkedAt: new Date(Date.UTC(2026, 6, index + 1)).toISOString(),
      source: 'direct',
    }));
    const result = buildSourceContinuityResponse(
      [policy({ checkLogs, _count: { checkLogs: 30 } })],
      101
    );

    expect(result.truncated).toBe(true);
    expect(result.maxPolicies).toBe(100);
    expect(result.maxLogsPerPolicy).toBe(25);
    expect(result.events.length).toBeLessThanOrEqual(25);
  });
});
