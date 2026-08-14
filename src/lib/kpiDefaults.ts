import {
  KPI_ALLOWED_VALUES,
  KPI_FIELD_KEYS,
  NOT_ASSESSED_KPI_VALUE,
  type KpiField,
} from './metricsCatalog';

export { KPI_ALLOWED_VALUES, KPI_FIELD_KEYS } from './metricsCatalog';
export type { KpiField } from './metricsCatalog';

export const NOT_ASSESSED_KPI_FIELDS = {
  kpiDataCollection: NOT_ASSESSED_KPI_VALUE,
  kpiThirdPartySharing: NOT_ASSESSED_KPI_VALUE,
  kpiDataRetention: NOT_ASSESSED_KPI_VALUE,
  kpiRightToDeletion: NOT_ASSESSED_KPI_VALUE,
  kpiCrossBorderTransfer: NOT_ASSESSED_KPI_VALUE,
  kpiAiTrainingOptOut: NOT_ASSESSED_KPI_VALUE,
  kpiAiOutputOwnership: NOT_ASSESSED_KPI_VALUE,
  kpiAlgoTransparency: NOT_ASSESSED_KPI_VALUE,
  kpiAutomatedDecision: NOT_ASSESSED_KPI_VALUE,
  kpiAiBiasFairness: NOT_ASSESSED_KPI_VALUE,
  kpiConsentMechanism: NOT_ASSESSED_KPI_VALUE,
  kpiRegulatoryCompliance: NOT_ASSESSED_KPI_VALUE,
  kpiBreachNotification: NOT_ASSESSED_KPI_VALUE,
  kpiIndependentAudit: NOT_ASSESSED_KPI_VALUE,
  kpiContentModeration: NOT_ASSESSED_KPI_VALUE,
} satisfies Record<KpiField, string>;

function normalizeCaseInsensitive(value: string, allowed: readonly string[]): string | null {
  const normalized = value.trim().toLowerCase();
  return allowed.find((candidate) => candidate.toLowerCase() === normalized) || null;
}

export function normalizeKpiFields(
  values: Partial<Record<KpiField, string | null | undefined>>
): Record<KpiField, string> {
  const normalized: Record<KpiField, string> = { ...NOT_ASSESSED_KPI_FIELDS };

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
