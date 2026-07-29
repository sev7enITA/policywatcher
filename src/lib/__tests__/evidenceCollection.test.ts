import { describe, expect, it } from 'vitest';
import { buildEvidencePacket, type EvidencePacketInput } from '@/lib/evidencePacket';
import {
  EVIDENCE_COLLECTION_BOUNDARY,
  EVIDENCE_HANDOFF_BOUNDARY,
  buildEvidenceCollection,
  buildEvidenceHandoff,
  csvCell,
  escapeMarkdownText,
  evidenceCollectionToCsv,
  evidenceCollectionToMarkdown,
  parseEvidenceCollectionQuery,
} from '@/lib/evidenceCollection';
import { pressKitSchemas } from '@/lib/pressKitSchemas';

const ID_A = '11111111-1111-4111-8111-111111111111';
const ID_B = '22222222-2222-4222-8222-222222222222';

function makePacket(changeId: string, companyName: string, summary = 'Recorded public policy change.') {
  return buildEvidencePacket({
    change: {
      id: changeId,
      publicEvidence: true,
      createdAt: changeId === ID_A ? '2026-07-28T08:00:00.000Z' : '2026-07-29T08:00:00.000Z',
      overallRisk: 'Medium',
      overallScore: 5,
      tldrEn: summary,
      aiSummaryEn: summary,
      keyPointsJson: '[]',
      riskReasonsJson: '[]',
      oldSnapshot: null,
      newSnapshot: {
        version: 2,
        hash: changeId === ID_A ? 'a'.repeat(64) : 'b'.repeat(64),
        text: 'Public policy text.',
        publicEvidence: true,
        createdAt: '2026-07-29T07:30:00.000Z',
      },
      regionImpacts: [],
    },
    previousChange: null,
    policy: {
      id: `policy-${changeId}`,
      name: 'Privacy Policy',
      type: 'privacy',
      jurisdiction: 'EU',
      url: 'https://example.com/privacy?tracking=1',
      dataStatus: 'Available',
      ingestionMethod: 'Direct Scrape',
      company: { id: `company-${changeId}`, name: companyName, slug: companyName.toLowerCase(), industry: 'Technology' },
      checkLogs: [{ status: 'Available', checkedAt: '2026-07-29T07:40:00.000Z', source: 'direct' }],
    },
  } satisfies EvidencePacketInput);
}

describe('shareable evidence collections', () => {
  it('parses one strict query, canonicalizes IDs and rejects unsupported input', () => {
    const parsed = parseEvidenceCollectionQuery(new URLSearchParams({
      changes: `${ID_B},${ID_A},${ID_B}`,
      format: 'markdown',
    }));
    expect(parsed).toEqual({ ok: true, changeIds: [ID_A, ID_B], format: 'markdown' });

    expect(parseEvidenceCollectionQuery(new URLSearchParams(`changes=${ID_A}&scope=all`))).toMatchObject({ ok: false });
    expect(parseEvidenceCollectionQuery(new URLSearchParams(`changes=${ID_A}&changes=${ID_B}`))).toMatchObject({ ok: false });
    expect(parseEvidenceCollectionQuery(new URLSearchParams('changes=not-a-uuid'))).toMatchObject({ ok: false });
    expect(parseEvidenceCollectionQuery(new URLSearchParams(`changes=${ID_A}&format=`))).toMatchObject({ ok: false });
    expect(parseEvidenceCollectionQuery(new URLSearchParams(`changes=${ID_A}&format=handoff`))).toEqual({
      ok: true,
      changeIds: [ID_A],
      format: 'handoff',
    });
    expect(parseEvidenceCollectionQuery(new URLSearchParams(`changes=${Array(13).fill(ID_A).join(',')}`))).toMatchObject({ ok: false });
  });

  it('builds a deterministic, exact-change collection with per-record provenance', () => {
    const a = makePacket(ID_A, 'Alpha');
    const b = makePacket(ID_B, 'Beta');
    const first = buildEvidenceCollection([b, a]);
    const second = buildEvidenceCollection([a, b]);

    expect(first.selection.changeIds).toEqual([ID_A, ID_B]);
    expect(first.selection).toMatchObject({ count: 2, limit: 12, companyCount: 2, jurisdictionCount: 1 });
    expect(first.records[0].evidencePacketDigest).toBe(a.contentDigest);
    expect(first.records[0].links.evidence).toContain(ID_A);
    expect(first.contentDigest).toBe(second.contentDigest);
    expect(first.collectionId).toBe(second.collectionId);
    expect(first.boundary).toBe(EVIDENCE_COLLECTION_BOUNDARY);
    expect(first.schema).toBe(pressKitSchemas['evidence-collection'].$id);
  });

  it('escapes Markdown and neutralizes spreadsheet formula cells', () => {
    const collection = buildEvidenceCollection([
      makePacket(ID_A, '# Alpha | Review', '=HYPERLINK("https://invalid")'),
    ]);
    const markdown = evidenceCollectionToMarkdown(collection);
    expect(markdown).toContain('\\# Alpha \\| Review');
    expect(markdown).not.toContain('\n# Alpha | Review');

    const csv = evidenceCollectionToCsv(collection);
    expect(csv).toContain("'=HYPERLINK");
    expect(csv).toContain('\r\n');
    expect(csvCell('+cmd')).toBe('"\'+cmd"');
    expect(escapeMarkdownText('a|b\n# c')).toBe('a\\|b \\# c');
  });

  it('builds a deterministic vendor-neutral collaboration handoff', () => {
    const collection = buildEvidenceCollection([
      makePacket(ID_B, 'Beta'),
      makePacket(ID_A, 'Alpha'),
    ]);
    const first = buildEvidenceHandoff(collection);
    const second = buildEvidenceHandoff(collection);

    expect(first.schema).toBe(pressKitSchemas['evidence-handoff'].$id);
    expect(first.handoffId).toBe(second.handoffId);
    expect(first.contentDigest).toBe(second.contentDigest);
    expect(first.collection).toEqual({
      id: collection.collectionId,
      contentDigest: collection.contentDigest,
      selectedRecords: 2,
    });
    expect(first.workItems.map((item) => item.context.changeId)).toEqual([ID_A, ID_B]);
    expect(first.workItems[0]).toMatchObject({
      type: 'evidence-review',
      state: 'ready-for-human-triage',
      title: 'Alpha: Privacy Policy',
    });
    expect(first.workItems[0].acceptanceCriteria.join(' ')).toContain('Evidence Packet');
    expect(first.boundary).toBe(EVIDENCE_HANDOFF_BOUNDARY);
    expect(JSON.stringify(first)).not.toMatch(/assignee|dueDate|deliveryConfirmation|vendorRecordId/i);
  });

  it('refuses empty, oversized or withheld packet collections', () => {
    expect(() => buildEvidenceCollection([])).toThrow();
    const withheld = makePacket(ID_A, 'Alpha');
    const input = { ...withheld, publicationGate: 'withheld' as const };
    expect(() => buildEvidenceCollection([input])).toThrow('published packets only');
  });
});
