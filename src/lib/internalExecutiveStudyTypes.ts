export type InternalStudyScenario = 'low' | 'base' | 'high';

export interface InternalStudyRow {
  readonly [key: string]: string | number;
}

export interface InternalStudySource {
  readonly id: string;
  readonly label: string;
  readonly href?: string;
  readonly path?: string;
}

export interface InternalStudyChapter {
  readonly id: string;
  readonly body: string;
}

export interface InternalStudyCardCopy {
  readonly label: string;
  readonly title: string;
  readonly body: string;
  readonly bullets?: readonly string[];
  readonly kind?: 'Observed' | 'Directional' | 'Modeled' | 'Proposed';
  readonly value?: string;
}

export interface InternalStudyPayload {
  readonly version: 1;
  readonly researchCutoff: string;
  readonly datasets: Readonly<Record<string, readonly InternalStudyRow[]>>;
  readonly sources: readonly InternalStudySource[];
  readonly chapters: readonly InternalStudyChapter[];
  readonly copy: {
    readonly strings: Readonly<Record<string, string>>;
    readonly scenarioInterpretation: Readonly<Record<InternalStudyScenario, string>>;
    readonly recommendationItems: readonly InternalStudyCardCopy[];
    readonly thesisItems: readonly InternalStudyCardCopy[];
    readonly businessColumns: readonly InternalStudyCardCopy[];
    readonly readinessCards: readonly InternalStudyCardCopy[];
    readonly methodologyItems: readonly InternalStudyCardCopy[];
  };
}

export function parseInternalStudyScenario(value: string | null | undefined): InternalStudyScenario {
  const normalized = value?.trim().toLowerCase();
  return normalized === 'low' || normalized === 'high' ? normalized : 'base';
}

export function formatInternalStudyCurrencyMillions(value: number): string {
  if (value >= 1000) {
    return `EUR ${(value / 1000).toFixed(3).replace(/0+$/, '').replace(/\.$/, '')}bn`;
  }
  return `EUR ${value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')}m`;
}

const marketScenarioLabels: Record<InternalStudyScenario, string> = {
  low: 'low',
  base: 'base',
  high: 'high',
};

const financialScenarioLabels: Record<InternalStudyScenario, string> = {
  low: 'downside',
  base: 'base',
  high: 'upside',
};

export interface InternalStudyMarketSelection {
  readonly rows: readonly InternalStudyRow[];
  readonly tam?: InternalStudyRow;
  readonly sam?: InternalStudyRow;
  readonly som?: InternalStudyRow;
}

export function selectInternalStudyMarketScenario(
  rows: readonly InternalStudyRow[],
  scenario: InternalStudyScenario,
): InternalStudyMarketSelection {
  const selected = rows.filter(
    (row) => String(row.scenario).trim().toLowerCase() === marketScenarioLabels[scenario],
  );
  return {
    rows: selected,
    tam: selected.find((row) => String(row.scope).toUpperCase().includes('TAM')),
    sam: selected.find((row) => String(row.scope).toUpperCase().includes('SAM')),
    som: selected.find((row) => String(row.scope).toUpperCase().includes('SOM')),
  };
}

export function selectInternalStudyFinancialScenario(
  rows: readonly InternalStudyRow[],
  scenario: InternalStudyScenario,
): InternalStudyRow | undefined {
  return rows.find(
    (row) => String(row.scenario).trim().toLowerCase() === financialScenarioLabels[scenario],
  );
}
