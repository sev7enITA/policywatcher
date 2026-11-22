import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { buildPublicInsight, type PublicInsightInput } from '@/lib/policyAsCode';

const NOW = new Date('2026-11-22T12:00:00.000Z');
const sha = (value: string) => createHash('sha256').update(value).digest('hex');
export function fixture(): PublicInsightInput {
  return {
    id: '11111111-1111-4111-8111-111111111111', publicEvidence: true,
    publicPublishedAt: '2026-11-22T11:00:00.000Z', createdAt: '2026-11-22T10:30:00.000Z',
    tldrEn: 'Synthetic retention change requiring review.', aiSummaryEn: 'Synthetic summary.',
    riskReasonsJson: JSON.stringify([{ textEn: 'Synthetic retention change.', evidenceSide: 'new',
      evidenceQuote: 'We retain test records for 30 days.', relatedKpi: 'kpiDataRetention' }]),
    oldSnapshot: { version: 1, text: 'We retain test records for 90 days.', publicEvidence: true,
      createdAt: '2026-11-21T10:00:00.000Z' },
    newSnapshot: { version: 2, text: 'Synthetic 🧪. We retain test records for 30 days.', publicEvidence: true,
      createdAt: '2026-11-22T10:00:00.000Z' },
    policy: { id: '22222222-2222-4222-8222-222222222222',
      url: 'https://user:password@example.com/policy?privateToken=secret#retention', jurisdiction: 'EU',
      ingestionMethod: 'Direct Scrape', dataStatus: 'Available' },
  };
}

describe('machine-readable public insights', () => {
  it('anchors exact retained text using UTF-16 and preserves unknown qualification', () => {
    const input = fixture();
    const result = buildPublicInsight(input, NOW)!;
    expect(result.source.publicUrl).toBe('https://example.com/policy');
    expect(result.source.scopeId).toBe(`policywatcher:policy:${input.policy.id}`);
    expect(result.times.observedAt).toBe('2026-11-22T10:00:00.000Z');
    expect(result.snapshots.after.textSha256).toBe(sha(input.newSnapshot.text));
    expect(result.claims[0].category).toBe('retention');
    expect(result.claims[0].value.type).toBe('text');
    const span = result.claims[0].evidence[0];
    expect(span.start).toBe(14); // Emoji occupies two UTF-16 code units.
    expect(input.newSnapshot.text.slice(span.start, span.end)).toBe(span.quote);
    expect(span.quoteSha256).toBe(sha(span.quote));
    expect(result.quality.completeness).toBe('unqualified');
    expect(result.review).toEqual({ status: 'required', approved: false });
    expect(result.decision).toEqual({ state: 'indeterminate', executionAuthorized: false });
    expect(JSON.stringify(result)).not.toContain('privateToken');
    expect(result.contentDigest).toBe(buildPublicInsight(input, NOW)!.contentDigest);
  });

  it.each(['kpiDataCollection', 'kpiAiTrainingOptOut'])('maps exact %s to data-use without inferring typed legal rules', (kpi) => {
    const input = fixture();
    input.riskReasonsJson = JSON.stringify([{ textEn: 'A draft screening interpretation.', relatedKpi: kpi }]);
    expect(buildPublicInsight(input, NOW)!.claims[0].category).toBe('data-use');
  });

  it.each([
    ['change-private', (i: PublicInsightInput) => { i.publicEvidence = false; }],
    ['snapshot-private', (i: PublicInsightInput) => { i.newSnapshot.publicEvidence = false; }],
    ['seeded', (i: PublicInsightInput) => { i.policy.ingestionMethod = ' Seeded '; }],
    ['held', (i: PublicInsightInput) => { i.policy.dataStatus = 'Needs Review'; }],
    ['not-published', (i: PublicInsightInput) => { i.publicPublishedAt = null; }],
    ['future', (i: PublicInsightInput) => { i.publicPublishedAt = '2026-11-23T11:00:00Z'; }],
    ['bad-date', (i: PublicInsightInput) => { i.publicPublishedAt = 'not-a-date'; }],
    ['non-http', (i: PublicInsightInput) => { i.policy.url = 'file:///private/source'; }],
  ] as const)('withholds %s', (_name, mutate) => {
    const input = fixture(); mutate(input);
    expect(buildPublicInsight(input, NOW)).toBeNull();
  });

  it('keeps legacy evidence unanchored and rejects ambiguous or invented citations', () => {
    const input = fixture();
    input.newSnapshot.text = 'Repeated. Repeated.';
    input.riskReasonsJson = JSON.stringify([
      { textEn: 'Ambiguous screening.', evidenceSide: 'new', evidenceQuote: 'Repeated.' },
      { textEn: 'Unsupported screening.', evidenceSide: 'new', evidenceQuote: 'Invented.' },
    ]);
    const result = buildPublicInsight(input, NOW)!;
    expect(result.claims.every(claim => claim.evidence.length === 0)).toBe(true);
    expect(result.warnings).toEqual(expect.arrayContaining(['quote_ambiguous', 'quote_rejected', 'legacy_unanchored']));
    expect(result.snapshots.after.textSha256).toBe(sha(input.newSnapshot.text));
  });

  it('never publishes the private predecessor or reasons explicitly tied to it', () => {
    const input = fixture();
    input.oldSnapshot!.publicEvidence = false;
    input.oldSnapshot!.text = 'PRIVATE_BEFORE_CANARY';
    input.riskReasonsJson = JSON.stringify([{ textEn: 'PRIVATE_REASON_CANARY', evidenceSide: 'old', evidenceQuote: 'PRIVATE_BEFORE_CANARY' }]);
    const result = buildPublicInsight(input, NOW)!;
    expect(result.snapshots.before).toBeNull();
    expect(JSON.stringify(result)).not.toContain('PRIVATE_');
    expect(result.warnings).toContain('private_before_omitted');
  });
});
