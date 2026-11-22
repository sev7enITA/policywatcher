import { createHash } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildPublicInsight, type PublicInsightInput } from '@/lib/policyAsCode';

const ID = '11111111-1111-4111-8111-111111111111';
const POLICY = '22222222-2222-4222-8222-222222222222';
const CANARY = 'PRIVATE-QA-CANARY-884733';
const NOW = new Date('2026-11-22T10:00:00.000Z');
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
function input(): PublicInsightInput {
  return {
    id: ID, publicEvidence: true,
    createdAt: '2026-11-21T10:00:00.000Z', publicPublishedAt: '2026-11-21T11:00:00.000Z',
    tldrEn: 'Synthetic public review summary.', aiSummaryEn: 'Synthetic public summary.',
    riskReasonsJson: JSON.stringify([{ textEn: 'Synthetic retention interpretation.',
      evidenceSide: 'new', evidenceQuote: 'Retain for 30 days.', relatedKpi: 'kpiDataRetention' }]),
    oldSnapshot: { version: 1, publicEvidence: true, createdAt: '2026-11-20T09:00:00.000Z', text: 'Retain for 90 days.' },
    newSnapshot: { version: 2, publicEvidence: true, createdAt: '2026-11-21T09:00:00.000Z', text: 'Test 🧪. Retain for 30 days.' },
    policy: { id: POLICY, url: 'https://example.org/terms', jurisdiction: 'unknown', ingestionMethod: 'Direct Scrape', dataStatus: 'Available' },
  };
}
describe('PolicyAsCode independent adversarial public boundary', () => {
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });

  it('requires publication, public current evidence and non-seeded qualified status independently of debug settings', () => {
    vi.stubEnv('ALLOW_SEEDED_PUBLIC_DATA', 'true');
    const mutations: Array<(x: PublicInsightInput) => void> = [
      x => { x.publicEvidence = false; },
      x => { x.newSnapshot.publicEvidence = false; },
      x => { x.publicPublishedAt = null; },
      x => { x.publicPublishedAt = '2026-11-23T10:00:00.000Z'; },
      x => { x.policy.ingestionMethod = ' Seeded '; },
      x => { x.policy.dataStatus = 'Needs Review'; },
      x => { x.policy.dataStatus = 'Partial'; },
      x => { x.policy.dataStatus = 'Unavailable'; },
    ];
    for (const mutate of mutations) { const x = input(); mutate(x); expect(buildPublicInsight(x, NOW)).toBeNull(); }
    expect(buildPublicInsight(input(), NOW)?.visibility).toBe('public');
  });

  it('does not export a private predecessor, its hashes or its explicitly tied interpretation', () => {
    const x = input();
    x.oldSnapshot!.publicEvidence = false;
    x.oldSnapshot!.text = CANARY;
    x.riskReasonsJson = JSON.stringify([{ textEn: CANARY, evidenceSide: 'old', evidenceQuote: CANARY }]);
    const record = buildPublicInsight(x, NOW)!;
    const serial = JSON.stringify(record);
    expect(record.snapshots.before).toBeNull();
    expect(serial).not.toContain(CANARY);
    expect(serial).not.toContain(hash(CANARY));
    expect(record.warnings).toContain('private_before_omitted');
    expect(record.claims[0].id).toBe('summary');
  });

  it('allowlists projection rather than copying private inference, reviewer, tenant or trace fields', () => {
    const x = { ...input(), tenant: CANARY, approvedBy: CANARY, analysisEvidenceJson: CANARY,
      traceId: CANARY, rawResponse: CANARY, engineClaims: [{ quote: CANARY }] };
    expect(JSON.stringify(buildPublicInsight(x, NOW))).not.toContain(CANARY);
  });

  it('redacts URL credentials and selectors without collapsing separate source identities', () => {
    const x = input(); x.policy.url = `https://${CANARY}:password@example.org/terms?token=${CANARY}#${CANARY}`;
    const first = buildPublicInsight(x, NOW)!;
    x.policy.id = '33333333-3333-4333-8333-333333333333';
    const second = buildPublicInsight(x, NOW)!;
    expect(first.source.publicUrl).toBe('https://example.org/terms');
    expect(JSON.stringify(first)).not.toContain(CANARY);
    expect(second.source.publicUrl).toBe(first.source.publicUrl);
    expect(second.source.scopeId).not.toBe(first.source.scopeId);
  });

  it('anchors UTF-16 end-exclusive spans against the exact text hash including non-BMP prefixes', () => {
    const x = input(); const record = buildPublicInsight(x, NOW)!;
    const span = record.claims[0].evidence[0];
    expect(span.start).toBe(9);
    expect(span.start).not.toBe(Array.from(x.newSnapshot.text).indexOf('R'));
    expect(span.end - span.start).toBe(span.quote.length);
    expect(x.newSnapshot.text.slice(span.start, span.end)).toBe(span.quote);
    expect(span.quoteSha256).toBe(hash(span.quote));
    expect(span.textSha256).toBe(hash(x.newSnapshot.text));
    expect(record.snapshots.after.offsetEncoding).toBe('utf-16-code-units');
  });

  it('does not split an astral character while bounding the public display statement', () => {
    const x = input();
    x.riskReasonsJson = JSON.stringify([{ textEn: 'x'.repeat(179) + '🧪' + 'tail', evidenceSide: 'new', evidenceQuote: 'Retain for 30 days.' }]);
    const record = buildPublicInsight(x, NOW)!;
    expect(record.claims[0].statement).toBe('x'.repeat(179) + '🧪');
  });

  it('does not manufacture a unique location for a repeated quote', () => {
    const x = input(); x.newSnapshot.text += ' Retain for 30 days.';
    const record = buildPublicInsight(x, NOW)!;
    expect(record.claims[0].evidence).toEqual([]);
    expect(record.warnings).toContain('quote_ambiguous');
  });

  it('rejects overlong quote intent instead of anchoring a truncated qualifying prefix', () => {
    const x = input(); const prefix = 'x'.repeat(240);
    x.newSnapshot.text = prefix;
    x.riskReasonsJson = JSON.stringify([{ textEn: 'A synthetic interpretation.', evidenceSide: 'new', evidenceQuote: prefix + ' EXCEPT NOT IN THE SOURCE' }]);
    const record = buildPublicInsight(x, NOW)!;
    expect(record.claims[0].evidence).toEqual([]);
    expect(record.warnings).toContain('quote_rejected');
  });

  it('never turns a published screening into an executable or human-approved result', () => {
    const x = input();
    const record = buildPublicInsight(x, NOW)!;
    expect(record.decision).toEqual({ state: 'indeterminate', executionAuthorized: false });
    expect(record.review).toEqual({ status: 'required', approved: false });
    expect(record.quality.completeness).toBe('unqualified');
    expect(record.quality.semanticVerification).toBe('not_verified');
    expect(buildPublicInsight(x, NOW)).toEqual(record);
  });

});
