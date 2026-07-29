import { createHash } from 'node:crypto';
import {
  GOVERNANCE_MAPPING_BOUNDARY,
  GOVERNANCE_MAPPING_VERSION,
  buildGovernanceMappings,
} from './governanceFrameworks';
import { KPI_FIELD_KEYS, type KpiField } from './metricsCatalog';
import { anchorRiskReasonEvidence } from './riskReasonEvidence';
import { normalizeSourceContinuityChannel } from './sourceContinuity';

export const EVIDENCE_PACKET_SCHEMA_VERSION = '1.0.0' as const;
export const EVIDENCE_PACKET_BOUNDARY =
  'This packet records PolicyWatcher evidence and AI-assisted screening for one public change. It is not legal advice, a compliance verdict, a certification, or proof that the external source remains unchanged.';

interface SnapshotInput {
  version: number;
  hash: string;
  text: string;
  publicEvidence: boolean;
  createdAt: Date | string;
}

interface RegionImpactInput {
  region: string;
  perspective: string;
  riskLevel: string;
  impactAnalysisEn: string;
  complianceNoteEn?: string | null;
}

interface EvidenceChangeInput extends Partial<Record<KpiField, string | null>> {
  id: string;
  publicEvidence: boolean;
  createdAt: Date | string;
  overallRisk: string;
  overallScore: number;
  tldrEn?: string | null;
  aiSummaryEn: string;
  keyPointsJson?: string | null;
  riskReasonsJson?: string | null;
  oldSnapshot?: SnapshotInput | null;
  newSnapshot: SnapshotInput;
  regionImpacts: RegionImpactInput[];
}

export interface EvidencePacketInput {
  change: EvidenceChangeInput;
  previousChange?: { id: string; overallScore: number; overallRisk: string; createdAt: Date | string } | null;
  policy: {
    id: string;
    name: string;
    type: string;
    jurisdiction: string;
    url: string;
    dataStatus: string;
    ingestionMethod: string;
    company: { id: string; name: string; slug: string; industry: string };
    checkLogs: Array<{ status: string; checkedAt: Date | string; source: string | null }>;
  };
}

function iso(value: Date | string): string {
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toISOString();
}

function safePublicUrl(value: string): string {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return '';
    url.username = '';
    url.password = '';
    url.search = '';
    url.hash = '';
    return url.toString();
  } catch {
    return '';
  }
}

function parseJsonArray(value: string | null | undefined): unknown[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function scoreDirection(delta: number | null): 'higher' | 'lower' | 'unchanged' | 'baseline' {
  if (delta === null) return 'baseline';
  if (delta > 0) return 'higher';
  if (delta < 0) return 'lower';
  return 'unchanged';
}

function sortedRegionImpacts(regionImpacts: RegionImpactInput[]): RegionImpactInput[] {
  return [...regionImpacts].sort((left, right) =>
    `${left.region}\u0000${left.perspective}`.localeCompare(`${right.region}\u0000${right.perspective}`),
  );
}

function publicationState(input: EvidencePacketInput): 'published' | 'withheld' {
  const allowedStatus = input.policy.dataStatus === 'Available' || input.policy.dataStatus === 'Reviewed';
  return input.change.publicEvidence
    && input.change.newSnapshot.publicEvidence
    && input.policy.ingestionMethod !== 'Seeded'
    && allowedStatus
    ? 'published'
    : 'withheld';
}

function humanReviewQuestions(input: EvidencePacketInput): string[] {
  return [
    `Does the original ${input.policy.name} source still match the recorded public snapshot version ${input.change.newSnapshot.version}?`,
    'Do the cited source passages support each displayed reason, KPI value and regional note?',
    'Which advisory framework topics require specialist legal, risk or governance review for this use case?',
    'Has a later public change superseded this packet before it is reused in a decision or publication?',
  ];
}

export function buildEvidencePacket(input: EvidencePacketInput) {
  const latestCheck = input.policy.checkLogs[0] ?? null;
  const previousScore = input.previousChange?.overallScore ?? null;
  const delta = previousScore === null ? null : input.change.overallScore - previousScore;
  const rawReasons = parseJsonArray(input.change.riskReasonsJson);
  const scoreReasons = anchorRiskReasonEvidence(rawReasons, {
    oldText: input.change.oldSnapshot?.publicEvidence ? input.change.oldSnapshot.text : null,
    newText: input.change.newSnapshot.text,
  });
  const kpiValues = Object.fromEntries(
    KPI_FIELD_KEYS.map((field) => [field, input.change[field] ?? 'Not assessed']),
  ) as Record<KpiField, string>;
  const governanceMappings = buildGovernanceMappings(kpiValues);
  const state = publicationState(input);

  const packet = {
    schema: 'https://policywatcher.online/schemas/evidence-packet/v1',
    schemaVersion: EVIDENCE_PACKET_SCHEMA_VERSION,
    mappingVersion: GOVERNANCE_MAPPING_VERSION,
    changeId: input.change.id,
    screeningDate: iso(input.change.createdAt),
    publicationGate: state,
    company: input.policy.company,
    policy: {
      id: input.policy.id,
      name: input.policy.name,
      type: input.policy.type,
      jurisdiction: input.policy.jurisdiction,
      sourceUrl: safePublicUrl(input.policy.url),
    },
    sourceConfidence: {
      state: latestCheck
        ? latestCheck.status === 'Available' || latestCheck.status === 'Reviewed'
          ? 'verified-retrieval'
          : 'review-required'
        : 'not-recorded',
      lastCheckedAt: latestCheck ? iso(latestCheck.checkedAt) : null,
      retrievalChannel: latestCheck ? normalizeSourceContinuityChannel(latestCheck.source) : 'none',
      dataStatus: input.policy.dataStatus,
      publicSnapshotEvidence: input.change.newSnapshot.publicEvidence,
      limitation: 'Source confidence describes recorded retrieval and publication state. It does not rate the provider policy or certify source authenticity.',
    },
    snapshots: {
      old: input.change.oldSnapshot?.publicEvidence
        ? {
            version: input.change.oldSnapshot.version,
            sha256: input.change.oldSnapshot.hash,
            capturedAt: iso(input.change.oldSnapshot.createdAt),
          }
        : null,
      current: {
        version: input.change.newSnapshot.version,
        sha256: input.change.newSnapshot.hash,
        capturedAt: iso(input.change.newSnapshot.createdAt),
      },
    },
    assessment: {
      summary: input.change.tldrEn || input.change.aiSummaryEn,
      overallRisk: input.change.overallRisk,
      overallScore: input.change.overallScore,
      previousPublicChange: input.previousChange
        ? {
            id: input.previousChange.id,
            overallRisk: input.previousChange.overallRisk,
            overallScore: input.previousChange.overallScore,
            screeningDate: iso(input.previousChange.createdAt),
          }
        : null,
      scoreDelta: delta,
      direction: scoreDirection(delta),
      reasons: scoreReasons,
      keyPoints: parseJsonArray(input.change.keyPointsJson),
      regionImpacts: sortedRegionImpacts(input.change.regionImpacts),
      explanationBoundary: 'Score reasons and deltaScore values are stored AI-assisted screening outputs. Verified anchors confirm only that the quoted passage occurs in the named snapshot; they do not prove the interpretation.',
    },
    governance: {
      boundary: GOVERNANCE_MAPPING_BOUNDARY,
      mappings: governanceMappings,
    },
    humanReviewQuestions: humanReviewQuestions(input),
    methodologyUrl: 'https://policywatcher.online/methodology/confidence',
    changeUrl: `https://policywatcher.online/change/${input.change.id}`,
    boundary: EVIDENCE_PACKET_BOUNDARY,
  } as const;

  const contentDigest = createHash('sha256').update(JSON.stringify(packet)).digest('hex');
  return { ...packet, contentDigest } as const;
}

export type EvidencePacket = ReturnType<typeof buildEvidencePacket>;
