import {
  KPI_ALLOWED_VALUES,
  KPI_FIELD_KEYS,
  NOT_ASSESSED_KPI_VALUE,
  type KpiField,
} from './metricsCatalog';
import type { PolicyAnalysisResult } from './gemini';

const RISK_LEVELS = ['Low', 'Medium', 'High'] as const;
const SENTIMENTS = ['positive', 'neutral', 'negative'] as const;
const RISK_ICONS = ['warning', 'alert', 'info'] as const;
const EVIDENCE_SIDES = ['old', 'new'] as const;
const REGIONS = ['EU', 'US', 'Global'] as const;
const PERSPECTIVES = ['Individual', 'Enterprise'] as const;

export const POLICY_ANALYSIS_SCHEMA_VERSION = 'policy-analysis.schema.v1';

const AI_TRAINING_VALUES = ['Allowed', 'Not Allowed', 'Opt-out available', 'Not specified'] as const;
const AI_SCRAPING_VALUES = ['Restricted', 'Permitted', 'Not specified'] as const;
const AI_IP_VALUES = ['Company retained', 'Protected', 'Shared', 'Not specified'] as const;
const AI_RETENTION_VALUES = ['Indefinite', 'System-deleted', '30 days', '180 days', 'Not specified'] as const;

const kpiEnum = (field: KpiField): string[] => [
  ...KPI_ALLOWED_VALUES[field],
  NOT_ASSESSED_KPI_VALUE,
];

const kpiProperties = Object.fromEntries(
  KPI_FIELD_KEYS.map((field) => [field, { type: 'string', enum: kpiEnum(field) }]),
);

/**
 * JSON Schema sent to Gemini together with responseMimeType=application/json.
 * The schema constrains syntax and vocabulary at generation time; the local
 * assertion below remains the final trust boundary before persistence.
 */
export const POLICY_ANALYSIS_RESPONSE_SCHEMA = Object.freeze({
  type: 'object',
  additionalProperties: false,
  properties: {
    executiveSummaryEn: { type: 'string' },
    executiveSummaryIt: { type: 'string' },
    tldrEn: { type: 'string' },
    tldrIt: { type: 'string' },
    keyPoints: {
      type: 'array',
      minItems: 3,
      maxItems: 5,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          textEn: { type: 'string' },
          textIt: { type: 'string' },
          sentiment: { type: 'string', enum: [...SENTIMENTS] },
        },
        required: ['textEn', 'textIt', 'sentiment'],
      },
    },
    riskReasons: {
      type: 'array',
      minItems: 3,
      maxItems: 3,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          icon: { type: 'string', enum: [...RISK_ICONS] },
          textEn: { type: 'string' },
          textIt: { type: 'string' },
          deltaScore: { type: 'number', minimum: -10, maximum: 10 },
          evidenceQuote: { type: 'string' },
          evidenceSide: { type: 'string', enum: [...EVIDENCE_SIDES] },
          relatedKpi: { type: 'string', enum: [...KPI_FIELD_KEYS] },
        },
        required: ['icon', 'textEn', 'textIt', 'deltaScore'],
      },
    },
    overallRisk: { type: 'string', enum: [...RISK_LEVELS] },
    overallScore: { type: 'number', minimum: 1, maximum: 10 },
    aiTrainingOptOut: { type: 'string', enum: [...AI_TRAINING_VALUES] },
    aiDataScrapingRestricted: { type: 'string', enum: [...AI_SCRAPING_VALUES] },
    aiIpLicensing: { type: 'string', enum: [...AI_IP_VALUES] },
    aiPromptRetention: { type: 'string', enum: [...AI_RETENTION_VALUES] },
    ...kpiProperties,
    remediations: {
      type: 'array',
      minItems: 2,
      maxItems: 4,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          titleEn: { type: 'string' },
          titleIt: { type: 'string' },
          descriptionEn: { type: 'string' },
          descriptionIt: { type: 'string' },
          actionUrl: { type: 'string' },
          actionTextEn: { type: 'string' },
          actionTextIt: { type: 'string' },
        },
        required: ['titleEn', 'titleIt', 'descriptionEn', 'descriptionIt'],
      },
    },
    regionImpacts: {
      type: 'array',
      minItems: 6,
      maxItems: 6,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          region: { type: 'string', enum: [...REGIONS] },
          perspective: { type: 'string', enum: [...PERSPECTIVES] },
          impactAnalysisEn: { type: 'string' },
          impactAnalysisIt: { type: 'string' },
          riskLevel: { type: 'string', enum: [...RISK_LEVELS] },
          complianceNoteEn: { type: 'string' },
          complianceNoteIt: { type: 'string' },
        },
        required: ['region', 'perspective', 'impactAnalysisEn', 'impactAnalysisIt', 'riskLevel'],
      },
    },
  },
  required: [
    'executiveSummaryEn',
    'executiveSummaryIt',
    'tldrEn',
    'tldrIt',
    'keyPoints',
    'riskReasons',
    'overallRisk',
    'overallScore',
    'aiTrainingOptOut',
    'aiDataScrapingRestricted',
    'aiIpLicensing',
    'aiPromptRetention',
    ...KPI_FIELD_KEYS,
    'remediations',
    'regionImpacts',
  ],
});

export class GeminiStructuredOutputError extends Error {
  constructor(message: string) {
    super(`Gemini structured output rejected: ${message}`);
    this.name = 'GeminiStructuredOutputError';
  }
}

function reject(message: string): never {
  throw new GeminiStructuredOutputError(message);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function requireRecord(value: unknown, path: string): Record<string, unknown> {
  if (!isRecord(value)) reject(`${path} must be an object`);
  return value;
}

function requireString(record: Record<string, unknown>, field: string, path = field): string {
  const value = record[field];
  if (typeof value !== 'string' || !value.trim()) reject(`${path} must be a non-empty string`);
  return value;
}

function requireOptionalString(record: Record<string, unknown>, field: string, path = field): void {
  const value = record[field];
  if (value !== undefined && (typeof value !== 'string' || !value.trim())) {
    reject(`${path} must be a non-empty string when present`);
  }
}

function requireNumber(record: Record<string, unknown>, field: string, min: number, max: number): number {
  const value = record[field];
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    reject(`${field} must be a finite number between ${min} and ${max}`);
  }
  return value;
}

function requireEnum(
  record: Record<string, unknown>,
  field: string,
  allowed: readonly string[],
  path = field,
): string {
  const value = requireString(record, field, path);
  if (!allowed.includes(value)) reject(`${path} contains an unsupported value`);
  return value;
}

function requireArray(record: Record<string, unknown>, field: string, min: number, max: number): unknown[] {
  const value = record[field];
  if (!Array.isArray(value) || value.length < min || value.length > max) {
    reject(`${field} must contain between ${min} and ${max} items`);
  }
  return value;
}

function assertKeyPoints(payload: Record<string, unknown>): void {
  requireArray(payload, 'keyPoints', 3, 5).forEach((value, index) => {
    const point = requireRecord(value, `keyPoints[${index}]`);
    requireString(point, 'textEn', `keyPoints[${index}].textEn`);
    requireString(point, 'textIt', `keyPoints[${index}].textIt`);
    requireEnum(point, 'sentiment', SENTIMENTS, `keyPoints[${index}].sentiment`);
  });
}

function assertRiskReasons(payload: Record<string, unknown>): void {
  requireArray(payload, 'riskReasons', 3, 3).forEach((value, index) => {
    const reason = requireRecord(value, `riskReasons[${index}]`);
    requireEnum(reason, 'icon', RISK_ICONS, `riskReasons[${index}].icon`);
    requireString(reason, 'textEn', `riskReasons[${index}].textEn`);
    requireString(reason, 'textIt', `riskReasons[${index}].textIt`);
    requireNumber(reason, 'deltaScore', -10, 10);
    requireOptionalString(reason, 'evidenceQuote', `riskReasons[${index}].evidenceQuote`);
    requireOptionalString(reason, 'evidenceSide', `riskReasons[${index}].evidenceSide`);
    requireOptionalString(reason, 'relatedKpi', `riskReasons[${index}].relatedKpi`);

    const hasQuote = reason.evidenceQuote !== undefined;
    const hasSide = reason.evidenceSide !== undefined;
    if (hasQuote !== hasSide) reject(`riskReasons[${index}] must pair evidenceQuote with evidenceSide`);
    if (hasSide) requireEnum(reason, 'evidenceSide', EVIDENCE_SIDES, `riskReasons[${index}].evidenceSide`);
    if (reason.relatedKpi !== undefined) {
      requireEnum(reason, 'relatedKpi', KPI_FIELD_KEYS, `riskReasons[${index}].relatedKpi`);
    }
  });
}

function assertRemediations(payload: Record<string, unknown>): void {
  requireArray(payload, 'remediations', 2, 4).forEach((value, index) => {
    const remediation = requireRecord(value, `remediations[${index}]`);
    for (const field of ['titleEn', 'titleIt', 'descriptionEn', 'descriptionIt']) {
      requireString(remediation, field, `remediations[${index}].${field}`);
    }
    for (const field of ['actionUrl', 'actionTextEn', 'actionTextIt']) {
      requireOptionalString(remediation, field, `remediations[${index}].${field}`);
    }
  });
}

function assertRegionImpacts(payload: Record<string, unknown>): void {
  const combinations = new Set<string>();
  requireArray(payload, 'regionImpacts', 6, 6).forEach((value, index) => {
    const impact = requireRecord(value, `regionImpacts[${index}]`);
    const region = requireEnum(impact, 'region', REGIONS, `regionImpacts[${index}].region`);
    const perspective = requireEnum(
      impact,
      'perspective',
      PERSPECTIVES,
      `regionImpacts[${index}].perspective`,
    );
    requireString(impact, 'impactAnalysisEn', `regionImpacts[${index}].impactAnalysisEn`);
    requireString(impact, 'impactAnalysisIt', `regionImpacts[${index}].impactAnalysisIt`);
    requireEnum(impact, 'riskLevel', RISK_LEVELS, `regionImpacts[${index}].riskLevel`);
    requireOptionalString(impact, 'complianceNoteEn', `regionImpacts[${index}].complianceNoteEn`);
    requireOptionalString(impact, 'complianceNoteIt', `regionImpacts[${index}].complianceNoteIt`);
    combinations.add(`${region}:${perspective}`);
  });

  if (combinations.size !== REGIONS.length * PERSPECTIVES.length) {
    reject('regionImpacts must contain each region/perspective combination exactly once');
  }
}

/**
 * Validates model output again locally before normalization and persistence.
 * This catches semantic combinations that JSON Schema alone cannot express.
 */
export function assertPolicyAnalysisResponse(value: unknown): asserts value is PolicyAnalysisResult {
  const payload = requireRecord(value, 'response');

  for (const field of ['executiveSummaryEn', 'executiveSummaryIt', 'tldrEn', 'tldrIt']) {
    requireString(payload, field);
  }
  assertKeyPoints(payload);
  assertRiskReasons(payload);
  requireEnum(payload, 'overallRisk', RISK_LEVELS);
  requireNumber(payload, 'overallScore', 1, 10);
  requireEnum(payload, 'aiTrainingOptOut', AI_TRAINING_VALUES);
  requireEnum(payload, 'aiDataScrapingRestricted', AI_SCRAPING_VALUES);
  requireEnum(payload, 'aiIpLicensing', AI_IP_VALUES);
  requireEnum(payload, 'aiPromptRetention', AI_RETENTION_VALUES);

  for (const field of KPI_FIELD_KEYS) {
    requireEnum(payload, field, kpiEnum(field), field);
  }

  assertRemediations(payload);
  assertRegionImpacts(payload);
}
