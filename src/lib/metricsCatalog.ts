export const KPI_FIELD_KEYS = [
  'kpiDataCollection',
  'kpiThirdPartySharing',
  'kpiDataRetention',
  'kpiRightToDeletion',
  'kpiCrossBorderTransfer',
  'kpiAiTrainingOptOut',
  'kpiAiOutputOwnership',
  'kpiAlgoTransparency',
  'kpiAutomatedDecision',
  'kpiAiBiasFairness',
  'kpiConsentMechanism',
  'kpiRegulatoryCompliance',
  'kpiBreachNotification',
  'kpiIndependentAudit',
  'kpiContentModeration',
] as const;

export type KpiField = (typeof KPI_FIELD_KEYS)[number];
export type KpiCategory = 'privacy' | 'ai-governance' | 'ethics-governance';
export type KpiConcernLevel = 'lower' | 'moderate' | 'higher' | 'pending';

export const NOT_ASSESSED_KPI_VALUE = 'Not assessed' as const;

interface KpiMetricDefinition {
  category: KpiCategory;
  label: { en: string; it: string };
  lower: readonly string[];
  moderate: readonly string[];
  higher: readonly string[];
}

/**
 * Canonical KPI vocabulary and field-specific concern semantics.
 *
 * Every consumer (AI normalization, audit, matrix, charts, and export) should
 * use this catalog rather than assigning generic weights to display strings.
 */
export const KPI_METRICS: Readonly<Record<KpiField, KpiMetricDefinition>> = {
  kpiDataCollection: {
    category: 'privacy',
    label: { en: 'Data collection', it: 'Raccolta dati' },
    lower: ['Minimal'], moderate: ['Moderate'], higher: ['Extensive'],
  },
  kpiThirdPartySharing: {
    category: 'privacy',
    label: { en: 'Third-party sharing', it: 'Condivisione con terzi' },
    lower: ['Restricted'], moderate: ['Limited'], higher: ['Broad'],
  },
  kpiDataRetention: {
    category: 'privacy',
    label: { en: 'Data retention', it: 'Conservazione dati' },
    lower: ['Defined'], moderate: ['Extended'], higher: ['Indefinite'],
  },
  kpiRightToDeletion: {
    category: 'privacy',
    label: { en: 'Right to deletion', it: 'Diritto alla cancellazione' },
    lower: ['Full'], moderate: ['Partial'], higher: ['Not Available'],
  },
  kpiCrossBorderTransfer: {
    category: 'privacy',
    label: { en: 'Cross-border transfer', it: 'Trasferimenti internazionali' },
    lower: ['Restricted'], moderate: ['Controlled'], higher: ['Unrestricted'],
  },
  kpiAiTrainingOptOut: {
    category: 'ai-governance',
    label: { en: 'AI training opt-out', it: 'Opt-out addestramento AI' },
    lower: ['Available'], moderate: ['Opt-Out'], higher: ['Not Available'],
  },
  kpiAiOutputOwnership: {
    category: 'ai-governance',
    label: { en: 'AI output ownership', it: 'Titolarita output AI' },
    lower: ['User Retained'], moderate: ['Shared'], higher: ['Company Retained'],
  },
  kpiAlgoTransparency: {
    category: 'ai-governance',
    label: { en: 'Algorithmic transparency', it: 'Trasparenza algoritmica' },
    lower: ['Published'], moderate: ['Mentioned'], higher: ['Opaque'],
  },
  kpiAutomatedDecision: {
    category: 'ai-governance',
    label: { en: 'Automated decisions', it: 'Decisioni automatizzate' },
    lower: ['Transparent'], moderate: ['Partial'], higher: ['Opaque'],
  },
  kpiAiBiasFairness: {
    category: 'ai-governance',
    label: { en: 'AI bias and fairness', it: 'Bias ed equita AI' },
    lower: ['Committed'], moderate: ['Mentioned'], higher: ['Absent'],
  },
  kpiConsentMechanism: {
    category: 'ethics-governance',
    label: { en: 'Consent mechanism', it: 'Meccanismo di consenso' },
    lower: ['Explicit Opt-In'], moderate: ['Opt-Out'], higher: ['Implicit'],
  },
  kpiRegulatoryCompliance: {
    category: 'ethics-governance',
    label: { en: 'Regulatory compliance', it: 'Conformita normativa' },
    lower: ['Comprehensive'], moderate: ['Partial'], higher: ['Minimal'],
  },
  kpiBreachNotification: {
    category: 'ethics-governance',
    label: { en: 'Breach notification', it: 'Notifica violazioni' },
    lower: ['Within 24h', 'Within 72h'], moderate: [], higher: ['Unspecified'],
  },
  kpiIndependentAudit: {
    category: 'ethics-governance',
    label: { en: 'Independent audit', it: 'Audit indipendente' },
    lower: ['Certified'], moderate: ['Mentioned'], higher: ['Absent'],
  },
  kpiContentModeration: {
    category: 'ethics-governance',
    label: { en: 'Content moderation', it: 'Moderazione contenuti' },
    lower: ['Transparent'], moderate: ['Partial'], higher: ['Opaque'],
  },
};

export const KPI_ALLOWED_VALUES = Object.fromEntries(
  KPI_FIELD_KEYS.map((field) => {
    const metric = KPI_METRICS[field];
    return [field, [...metric.lower, ...metric.moderate, ...metric.higher]];
  })
) as unknown as Record<KpiField, readonly string[]>;

export function isAssessedKpiValue(value: string | null | undefined): value is string {
  return Boolean(value?.trim() && value.trim().toLowerCase() !== NOT_ASSESSED_KPI_VALUE.toLowerCase());
}

export function getKpiConcernLevel(field: KpiField, value: string): KpiConcernLevel {
  if (!isAssessedKpiValue(value)) return 'pending';
  const metric = KPI_METRICS[field];
  if (metric.lower.includes(value)) return 'lower';
  if (metric.moderate.includes(value)) return 'moderate';
  return 'higher';
}

export function getKpiConcernRank(field: KpiField, value: string): number {
  const level = getKpiConcernLevel(field, value);
  return level === 'higher' ? 3 : level === 'moderate' ? 2 : level === 'lower' ? 1 : 0;
}

export function getMoreConcerningKpiValue(field: KpiField, current: string, candidate: string): string {
  if (!isAssessedKpiValue(current)) return candidate || NOT_ASSESSED_KPI_VALUE;
  if (!isAssessedKpiValue(candidate)) return current;
  return getKpiConcernRank(field, current) >= getKpiConcernRank(field, candidate) ? current : candidate;
}
