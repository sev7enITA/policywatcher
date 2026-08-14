import { describe, expect, it } from 'vitest';
import { buildEvidencePacket, EVIDENCE_PACKET_BOUNDARY } from '@/lib/evidencePacket';
import { buildGovernanceMappings, GOVERNANCE_MAPPING_BOUNDARY } from '@/lib/governanceFrameworks';
import { anchorRiskReasonEvidence } from '@/lib/riskReasonEvidence';
import { pressKitSchemas } from '@/lib/pressKitSchemas';

function makeInput() {
  return {
    change: {
      id: '11111111-1111-4111-8111-111111111111',
      publicEvidence: true,
      createdAt: '2026-07-29T08:00:00.000Z',
      overallRisk: 'High',
      overallScore: 8,
      tldrEn: 'The policy adds a 180-day retention period.',
      aiSummaryEn: 'Summary.',
      keyPointsJson: '[]',
      riskReasonsJson: JSON.stringify([
        {
          icon: 'warning',
          textEn: 'Retention period increased',
          textIt: 'Periodo di conservazione aumentato',
          deltaScore: 2,
          evidenceQuote: 'We retain prompts for 180 days.',
          evidenceSide: 'new',
          relatedKpi: 'kpiDataRetention',
        },
        {
          icon: 'alert',
          textEn: 'Unverified model statement',
          textIt: 'Affermazione non verificata',
          deltaScore: 1,
          evidenceQuote: 'This sentence is not in the snapshot.',
          evidenceSide: 'new',
        },
      ]),
      oldSnapshot: {
        version: 1,
        hash: 'a'.repeat(64),
        text: 'We retain prompts for 30 days.',
        publicEvidence: true,
        createdAt: '2026-07-01T00:00:00.000Z',
      },
      newSnapshot: {
        version: 2,
        hash: 'b'.repeat(64),
        text: 'Policy text. We retain prompts for 180 days. End.',
        publicEvidence: true,
        createdAt: '2026-07-29T07:30:00.000Z',
      },
      regionImpacts: [],
      kpiDataRetention: 'Extended',
      kpiAlgoTransparency: 'Mentioned',
      kpiAutomatedDecision: 'Partial',
      kpiAiBiasFairness: 'Mentioned',
      kpiIndependentAudit: 'Mentioned',
      kpiRegulatoryCompliance: 'Partial',
      kpiContentModeration: 'Partial',
      kpiConsentMechanism: 'Opt-Out',
    },
    previousChange: {
      id: '22222222-2222-4222-8222-222222222222',
      overallScore: 5,
      overallRisk: 'Medium',
      createdAt: '2026-07-01T00:00:00.000Z',
    },
    policy: {
      id: '33333333-3333-4333-8333-333333333333',
      name: 'Privacy Policy',
      type: 'Privacy Policy',
      jurisdiction: 'EU',
      url: 'https://example.com/privacy?tracking=1#notice',
      dataStatus: 'Available',
      ingestionMethod: 'Direct Scrape',
      company: { id: 'company-1', name: 'Example', slug: 'example', industry: 'Technology' },
      checkLogs: [{ status: 'Available', checkedAt: '2026-07-29T07:40:00.000Z', source: 'direct' }],
    },
  };
}

describe('evidence packets', () => {
  it('accepts only exact source passages and rejects unmatched model quotes', () => {
    const reasons = anchorRiskReasonEvidence(
      JSON.parse(makeInput().change.riskReasonsJson),
      { oldText: makeInput().change.oldSnapshot.text, newText: makeInput().change.newSnapshot.text },
    );
    expect(reasons[0]).toMatchObject({ anchorStatus: 'verified', evidenceSide: 'new' });
    expect(reasons[0].evidenceQuote).toBe('We retain prompts for 180 days.');
    expect(reasons[1]).toMatchObject({ anchorStatus: 'rejected', evidenceQuote: null, evidenceSide: null });
  });

  it('builds deterministic change-bound source, score, governance and report evidence', () => {
    const first = buildEvidencePacket(makeInput());
    const second = buildEvidencePacket(makeInput());

    expect(first.changeId).toBe('11111111-1111-4111-8111-111111111111');
    expect(first.publicationGate).toBe('published');
    expect(first.policy.sourceUrl).toBe('https://example.com/privacy');
    expect(first.snapshots.current.sha256).toBe('b'.repeat(64));
    expect(first.assessment.scoreDelta).toBe(3);
    expect(first.assessment.direction).toBe('higher');
    expect(first.governance.mappings.every((mapping) => mapping.status === 'mapped')).toBe(true);
    expect(first.humanReviewQuestions).toHaveLength(4);
    expect(first.contentDigest).toBe(second.contentDigest);
    expect(first.boundary).toBe(EVIDENCE_PACKET_BOUNDARY);
    expect(first.schema).toBe(pressKitSchemas['evidence-packet'].$id);
  });

  it('maps review relevance without producing compliance verdicts', () => {
    const mappings = buildGovernanceMappings({ kpiAutomatedDecision: 'Partial' });
    expect(mappings.some((mapping) => mapping.status === 'mapped')).toBe(true);
    expect(mappings.some((mapping) => mapping.status === 'not-assessed')).toBe(true);
    const serialized = JSON.stringify({ mappings, boundary: GOVERNANCE_MAPPING_BOUNDARY }).toLowerCase();
    expect(serialized).not.toContain('compliant');
    expect(serialized).not.toContain('non-compliant');
    expect(GOVERNANCE_MAPPING_BOUNDARY).toContain('not legal interpretations');
  });

  it('withholds packets that do not satisfy the public evidence gate', () => {
    const input = makeInput();
    input.change.newSnapshot.publicEvidence = false;
    expect(buildEvidencePacket(input).publicationGate).toBe('withheld');
  });
});
