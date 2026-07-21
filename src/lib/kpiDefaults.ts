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

export const NOT_ASSESSED_KPI_FIELDS = {
  kpiDataCollection: 'Not assessed',
  kpiThirdPartySharing: 'Not assessed',
  kpiDataRetention: 'Not assessed',
  kpiRightToDeletion: 'Not assessed',
  kpiCrossBorderTransfer: 'Not assessed',
  kpiAiTrainingOptOut: 'Not assessed',
  kpiAiOutputOwnership: 'Not assessed',
  kpiAlgoTransparency: 'Not assessed',
  kpiAutomatedDecision: 'Not assessed',
  kpiAiBiasFairness: 'Not assessed',
  kpiConsentMechanism: 'Not assessed',
  kpiRegulatoryCompliance: 'Not assessed',
  kpiBreachNotification: 'Not assessed',
  kpiIndependentAudit: 'Not assessed',
  kpiContentModeration: 'Not assessed',
} satisfies Record<KpiField, string>;

export const KPI_ALLOWED_VALUES: Record<KpiField, readonly string[]> = {
  kpiDataCollection: ['Minimal', 'Moderate', 'Extensive'],
  kpiThirdPartySharing: ['Restricted', 'Limited', 'Broad'],
  kpiDataRetention: ['Defined', 'Extended', 'Indefinite'],
  kpiRightToDeletion: ['Full', 'Partial', 'Not Available'],
  kpiCrossBorderTransfer: ['Restricted', 'Controlled', 'Unrestricted'],
  kpiAiTrainingOptOut: ['Available', 'Opt-Out', 'Not Available'],
  kpiAiOutputOwnership: ['User Retained', 'Shared', 'Company Retained'],
  kpiAlgoTransparency: ['Published', 'Mentioned', 'Opaque'],
  kpiAutomatedDecision: ['Transparent', 'Partial', 'Opaque'],
  kpiAiBiasFairness: ['Committed', 'Mentioned', 'Absent'],
  kpiConsentMechanism: ['Explicit Opt-In', 'Opt-Out', 'Implicit'],
  kpiRegulatoryCompliance: ['Comprehensive', 'Partial', 'Minimal'],
  kpiBreachNotification: ['Within 24h', 'Within 72h', 'Unspecified'],
  kpiIndependentAudit: ['Certified', 'Mentioned', 'Absent'],
  kpiContentModeration: ['Transparent', 'Partial', 'Opaque'],
};

function normalizeCaseInsensitive(value: string, allowed: readonly string[]): string | null {
  const normalized = value.trim().toLowerCase();
  return allowed.find((candidate) => candidate.toLowerCase() === normalized) || null;
}

export function normalizeKpiFields(
  values: Partial<Record<KpiField, string | null | undefined>>
): Record<KpiField, string> {
  const normalized = { ...NOT_ASSESSED_KPI_FIELDS };

  for (const field of KPI_FIELD_KEYS) {
    const value = values[field];
    if (!value) continue;

    const allowedValue = normalizeCaseInsensitive(value, KPI_ALLOWED_VALUES[field]);
    if (allowedValue) {
      normalized[field] = allowedValue;
    }
  }

  return normalized;
}
