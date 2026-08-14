import { createHash } from 'node:crypto';
import type { EvidencePacket } from './evidencePacket';

export const EVIDENCE_COLLECTION_SCHEMA_VERSION = '1.0.0' as const;
export const EVIDENCE_COLLECTION_MAX_CHANGES = 12 as const;
export const EVIDENCE_COLLECTION_BOUNDARY =
  'This collection groups selected public PolicyWatcher evidence records. It is not exhaustive market coverage, persistent team collaboration, legal advice, a compliance assessment or proof that an external source remains unchanged.';

export type EvidenceCollectionFormat = 'json' | 'markdown' | 'csv' | 'handoff';

export type EvidenceCollectionQueryResult =
  | { ok: true; changeIds: string[]; format: EvidenceCollectionFormat }
  | { ok: false; error: string };

const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const QUERY_KEYS = new Set(['changes', 'format']);

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function parseEvidenceCollectionQuery(searchParams: URLSearchParams): EvidenceCollectionQueryResult {
  if ([...searchParams.keys()].some((key) => !QUERY_KEYS.has(key))) {
    return { ok: false, error: 'Only changes and format parameters are supported.' };
  }

  const changeValues = searchParams.getAll('changes');
  const formatValues = searchParams.getAll('format');
  if (changeValues.length !== 1 || formatValues.length > 1) {
    return { ok: false, error: 'Provide one changes parameter and at most one format parameter.' };
  }

  if (changeValues[0].length > 500) {
    return { ok: false, error: `A collection can contain at most ${EVIDENCE_COLLECTION_MAX_CHANGES} changes.` };
  }

  const rawIds = changeValues[0].split(',').map((value) => value.trim());
  if (rawIds.length === 0 || rawIds.some((value) => !value)) {
    return { ok: false, error: 'At least one complete change ID is required.' };
  }
  if (rawIds.length > EVIDENCE_COLLECTION_MAX_CHANGES) {
    return { ok: false, error: `A collection can contain at most ${EVIDENCE_COLLECTION_MAX_CHANGES} changes.` };
  }
  if (rawIds.some((value) => !UUID_V4_RE.test(value))) {
    return { ok: false, error: 'Every change ID must be a canonical UUID v4 value.' };
  }

  const format = formatValues.length === 0 ? 'json' : formatValues[0];
  if (format !== 'json' && format !== 'markdown' && format !== 'csv' && format !== 'handoff') {
    return { ok: false, error: 'Only format=json, format=markdown, format=csv or format=handoff is supported.' };
  }

  return {
    ok: true,
    changeIds: [...new Set(rawIds.map((value) => value.toLowerCase()))].sort(),
    format,
  };
}

export function buildEvidenceCollection(packets: readonly EvidencePacket[]) {
  if (packets.length === 0 || packets.length > EVIDENCE_COLLECTION_MAX_CHANGES) {
    throw new Error(`Evidence collections require 1-${EVIDENCE_COLLECTION_MAX_CHANGES} packets.`);
  }
  if (packets.some((packet) => packet.publicationGate !== 'published')) {
    throw new Error('Evidence collections can include published packets only.');
  }

  const sortedPackets = [...packets].sort((left, right) => left.changeId.localeCompare(right.changeId));
  const records = sortedPackets.map((packet) => ({
    changeId: packet.changeId,
    screeningDate: packet.screeningDate,
    company: packet.company,
    policy: packet.policy,
    sourceConfidence: {
      state: packet.sourceConfidence.state,
      lastCheckedAt: packet.sourceConfidence.lastCheckedAt,
      retrievalChannel: packet.sourceConfidence.retrievalChannel,
      limitation: packet.sourceConfidence.limitation,
    },
    currentSnapshot: packet.snapshots.current,
    assessment: {
      summary: packet.assessment.summary,
      overallRisk: packet.assessment.overallRisk,
      overallScore: packet.assessment.overallScore,
      scoreDelta: packet.assessment.scoreDelta,
      direction: packet.assessment.direction,
      reasons: packet.assessment.reasons,
      explanationBoundary: packet.assessment.explanationBoundary,
    },
    governance: {
      mappedFrameworks: packet.governance.mappings
        .filter((mapping) => mapping.status === 'mapped')
        .map((mapping) => ({
          id: mapping.framework.id,
          name: mapping.framework.shortName,
          referenceVersion: mapping.framework.referenceVersion,
          referenceUrl: mapping.framework.referenceUrl,
          reviewQuestion: mapping.framework.reviewQuestion,
        })),
      boundary: packet.governance.boundary,
    },
    reviewQuestions: packet.humanReviewQuestions,
    links: {
      change: packet.changeUrl,
      evidence: `https://policywatcher.online/evidence/${packet.changeId}`,
      json: `https://policywatcher.online/api/evidence-packet/${packet.changeId}?format=json`,
      pdf: `https://policywatcher.online/api/evidence-packet/${packet.changeId}?format=pdf`,
    },
    evidencePacketDigest: packet.contentDigest,
    boundary: packet.boundary,
  }));

  const asOf = records.map((record) => record.screeningDate).sort().at(-1) as string;
  const companyCount = new Set(records.map((record) => record.company.id)).size;
  const jurisdictionCount = new Set(records.map((record) => record.policy.jurisdiction)).size;
  const core = {
    schema: 'https://policywatcher.online/schemas/evidence-collection/v1',
    schemaVersion: EVIDENCE_COLLECTION_SCHEMA_VERSION,
    asOf,
    selection: {
      count: records.length,
      limit: EVIDENCE_COLLECTION_MAX_CHANGES,
      companyCount,
      jurisdictionCount,
      changeIds: records.map((record) => record.changeId),
    },
    records,
    reviewChecklist: [
      'Confirm that each selected record is relevant to the intended review scope.',
      'Open the provider source and exact Evidence Packet before relying on a summary.',
      'Keep record-level limitations and advisory framework boundaries attached when reusing the bundle.',
      'Check whether a later public change supersedes any selected record.',
    ],
    boundary: EVIDENCE_COLLECTION_BOUNDARY,
  } as const;
  const contentDigest = sha256(JSON.stringify(core));

  return {
    ...core,
    collectionId: `pwc_${contentDigest.slice(0, 16)}`,
    contentDigest,
  } as const;
}

export type EvidenceCollection = ReturnType<typeof buildEvidenceCollection>;

export const EVIDENCE_HANDOFF_SCHEMA_VERSION = '1.0.0' as const;
export const EVIDENCE_HANDOFF_BOUNDARY =
  'This handoff is a vendor-neutral review aid derived from selected public evidence. It does not create assignments, due dates, access controls, third-party records, legal conclusions or delivery confirmation.';

export function buildEvidenceHandoff(collection: EvidenceCollection) {
  const workItems = collection.records.map((record, index) => ({
    id: `pwi_${sha256(`${collection.collectionId}:${record.changeId}`).slice(0, 16)}`,
    sequence: index + 1,
    type: 'evidence-review',
    state: 'ready-for-human-triage',
    title: `${record.company.name}: ${record.policy.name}`,
    summary: record.assessment.summary,
    context: {
      changeId: record.changeId,
      company: record.company.name,
      policy: record.policy.name,
      jurisdiction: record.policy.jurisdiction,
      screeningDate: record.screeningDate,
    },
    attentionSignal: {
      overallRisk: record.assessment.overallRisk,
      overallScore: record.assessment.overallScore,
      direction: record.assessment.direction,
      boundary: record.assessment.explanationBoundary,
    },
    acceptanceCriteria: [
      'Open the exact Evidence Packet and provider source.',
      ...record.reviewQuestions,
      'Record the reviewer conclusion in the receiving system without changing the attached evidence digest.',
    ],
    evidence: {
      sourceUrl: record.policy.sourceUrl,
      changeUrl: record.links.change,
      evidenceUrl: record.links.evidence,
      evidencePacketDigest: record.evidencePacketDigest,
      currentSnapshotSha256: record.currentSnapshot.sha256,
    },
    boundaries: [record.boundary, record.governance.boundary],
  }));

  const core = {
    schema: 'https://policywatcher.online/schemas/evidence-handoff/v1',
    schemaVersion: EVIDENCE_HANDOFF_SCHEMA_VERSION,
    asOf: collection.asOf,
    handoffType: 'vendor-neutral-human-review',
    collection: {
      id: collection.collectionId,
      contentDigest: collection.contentDigest,
      selectedRecords: collection.selection.count,
    },
    workItems,
    receivingSystemInstructions: [
      'Create records only after an authorized person reviews this manifest.',
      'Preserve PolicyWatcher change IDs, evidence links and digests in the receiving record.',
      'Keep ownership, access control, due dates, retention and workflow status in the receiving system.',
      'Reopen the source and Evidence Packet before relying on a stored summary.',
    ],
    boundary: EVIDENCE_HANDOFF_BOUNDARY,
  } as const;
  const contentDigest = sha256(JSON.stringify(core));

  return {
    ...core,
    handoffId: `pwh_${contentDigest.slice(0, 16)}`,
    contentDigest,
  } as const;
}

export type EvidenceHandoff = ReturnType<typeof buildEvidenceHandoff>;

export function escapeMarkdownText(value: unknown): string {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/([\[\]_*`#<>|])/g, '\\$1')
    .replace(/\r?\n/g, ' ')
    .trim();
}

export function escapeMarkdownLinkLabel(value: unknown): string {
  return String(value ?? '')
    .replace(/([\\[\]_*`#<>|()])/g, '\\$1')
    .replace(/\r?\n/g, ' ')
    .trim();
}

export function evidenceCollectionToMarkdown(collection: EvidenceCollection): string {
  const lines = [
    '# PolicyWatcher Evidence Collection',
    '',
    `- Collection ID: \`${collection.collectionId}\``,
    `- Content digest: \`${collection.contentDigest}\``,
    `- Evidence as of: ${escapeMarkdownText(collection.asOf)}`,
    `- Selected records: ${collection.selection.count}`,
    '',
    `> ${escapeMarkdownText(collection.boundary)}`,
    '',
    '## Selected evidence',
    '',
  ];

  for (const [index, record] of collection.records.entries()) {
    lines.push(
      `### ${index + 1}. ${escapeMarkdownText(record.company.name)} - ${escapeMarkdownText(record.policy.name)}`,
      '',
      `- Change ID: \`${record.changeId}\``,
      `- Screening date: ${escapeMarkdownText(record.screeningDate)}`,
      `- Jurisdiction: ${escapeMarkdownText(record.policy.jurisdiction)}`,
      `- Screening result: ${escapeMarkdownText(record.assessment.overallRisk)} · ${record.assessment.overallScore}/10`,
      `- Evidence Packet digest: \`${record.evidencePacketDigest}\``,
      `- [Open Evidence Packet](${record.links.evidence})`,
      `- [Open provider source](${record.policy.sourceUrl})`,
      '',
      escapeMarkdownText(record.assessment.summary),
      '',
      '**Review questions**',
      '',
      ...record.reviewQuestions.map((question) => `- ${escapeMarkdownText(question)}`),
      '',
      `Boundary: ${escapeMarkdownText(record.boundary)}`,
      '',
    );
  }

  lines.push('## Collection review checklist', '', ...collection.reviewChecklist.map((item) => `- ${escapeMarkdownLinkLabel(item)}`), '');
  return `${lines.join('\n').trim()}\n`;
}

function neutralizeSpreadsheetFormula(value: string): string {
  return /^[\s]*[=+\-@]/.test(value) ? `'${value}` : value;
}

export function csvCell(value: unknown): string {
  const normalized = neutralizeSpreadsheetFormula(String(value ?? '').replace(/\r?\n/g, ' ').trim());
  return `"${normalized.replace(/"/g, '""')}"`;
}

export function evidenceCollectionToCsv(collection: EvidenceCollection): string {
  const headers = [
    'change_id', 'screening_date', 'company', 'policy', 'jurisdiction', 'overall_risk',
    'overall_score', 'score_delta', 'source_state', 'current_snapshot_sha256',
    'evidence_packet_sha256', 'source_url', 'evidence_url', 'summary', 'boundary',
  ];
  const rows = collection.records.map((record) => [
    record.changeId,
    record.screeningDate,
    record.company.name,
    record.policy.name,
    record.policy.jurisdiction,
    record.assessment.overallRisk,
    record.assessment.overallScore,
    record.assessment.scoreDelta ?? '',
    record.sourceConfidence.state,
    record.currentSnapshot.sha256,
    record.evidencePacketDigest,
    record.policy.sourceUrl,
    record.links.evidence,
    record.assessment.summary,
    record.boundary,
  ]);
  return `\uFEFF${[headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')}\r\n`;
}
