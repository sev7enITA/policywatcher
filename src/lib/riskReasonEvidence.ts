import { KPI_FIELD_KEYS, type KpiField } from './metricsCatalog';

export type EvidenceSide = 'old' | 'new';

export interface StoredRiskReason {
  icon?: unknown;
  textEn?: unknown;
  textIt?: unknown;
  deltaScore?: unknown;
  evidenceQuote?: unknown;
  evidenceSide?: unknown;
  relatedKpi?: unknown;
}

export interface AnchoredRiskReason {
  icon: 'warning' | 'alert' | 'info';
  textEn: string;
  textIt: string;
  deltaScore: number;
  evidenceQuote: string | null;
  evidenceSide: EvidenceSide | null;
  relatedKpi: KpiField | null;
  anchorStatus: 'verified' | 'not-recorded' | 'rejected';
}

const KPI_FIELDS = new Set<KpiField>(KPI_FIELD_KEYS);

function cleanText(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function cleanIcon(value: unknown): AnchoredRiskReason['icon'] {
  return value === 'alert' || value === 'info' || value === 'warning' ? value : 'info';
}

function cleanDelta(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(-10, Math.min(10, value))
    : 0;
}

export function anchorRiskReasonEvidence(
  reasons: unknown,
  snapshots: { oldText?: string | null; newText: string },
): AnchoredRiskReason[] {
  if (!Array.isArray(reasons)) return [];

  return reasons.slice(0, 3).map((raw) => {
    const reason = (raw && typeof raw === 'object' ? raw : {}) as StoredRiskReason;
    const quote = cleanText(reason.evidenceQuote, 240);
    const side: EvidenceSide | null = reason.evidenceSide === 'old' || reason.evidenceSide === 'new'
      ? reason.evidenceSide
      : null;
    const relatedKpi = typeof reason.relatedKpi === 'string' && KPI_FIELDS.has(reason.relatedKpi as KpiField)
      ? reason.relatedKpi as KpiField
      : null;
    const sourceText = side === 'old' ? snapshots.oldText : side === 'new' ? snapshots.newText : null;
    const verified = Boolean(quote && sourceText && sourceText.includes(quote));
    const attempted = Boolean(quote || side);

    return {
      icon: cleanIcon(reason.icon),
      textEn: cleanText(reason.textEn, 180),
      textIt: cleanText(reason.textIt, 180),
      deltaScore: cleanDelta(reason.deltaScore),
      evidenceQuote: verified ? quote : null,
      evidenceSide: verified ? side : null,
      relatedKpi,
      anchorStatus: verified ? 'verified' : attempted ? 'rejected' : 'not-recorded',
    };
  });
}
