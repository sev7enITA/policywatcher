import type { Lang, RegionImpact, RiskLevel } from '@/types';
import {
  PUBLIC_DATA_SOURCES,
  type EvidenceGate,
  type PublicDataSourceId,
} from './dataSourceRegistry';
import type { RiskTrendPoint } from './riskTrends';
import { isAssessedKpiValue } from './metricsCatalog';

export type ChartRendererId =
  | 'recharts-area'
  | 'recharts-bar'
  | 'recharts-radar'
  | 'native-svg-gauge'
  | 'native-css-heatmap';
export type ChartTransformId = 'identity';
export type ChartFormatterId =
  | 'observation-index'
  | 'score-out-of-ten'
  | 'percent-out-of-hundred'
  | 'category-label'
  | 'region-code'
  | 'risk-level'
  | 'localized-date';
export type ChartSummaryStrategy =
  | 'risk-trend-delta'
  | 'risk-profile-maximum'
  | 'risk-gauge-score'
  | 'regional-risk-coverage'
  | 'benchmark-radar-wins';

export interface LocalizedChartText {
  readonly en: string;
  readonly it: string;
}

export interface BuiltInChartRenderer {
  readonly id: ChartRendererId;
  readonly engine: 'recharts' | 'native-svg' | 'native-css';
  readonly primitive: 'AreaChart' | 'BarChart' | 'RadarChart' | 'ArcGauge' | 'RegionGrid';
}

export const BUILT_IN_CHART_RENDERERS: Readonly<Record<ChartRendererId, BuiltInChartRenderer>> =
  Object.freeze({
    'recharts-area': Object.freeze({
      id: 'recharts-area',
      engine: 'recharts',
      primitive: 'AreaChart',
    }),
    'recharts-bar': Object.freeze({
      id: 'recharts-bar',
      engine: 'recharts',
      primitive: 'BarChart',
    }),
    'recharts-radar': Object.freeze({
      id: 'recharts-radar',
      engine: 'recharts',
      primitive: 'RadarChart',
    }),
    'native-svg-gauge': Object.freeze({
      id: 'native-svg-gauge',
      engine: 'native-svg',
      primitive: 'ArcGauge',
    }),
    'native-css-heatmap': Object.freeze({
      id: 'native-css-heatmap',
      engine: 'native-css',
      primitive: 'RegionGrid',
    }),
  });

export interface ChartCopy {
  readonly title: LocalizedChartText;
  readonly description: LocalizedChartText;
  readonly noData: LocalizedChartText;
  readonly source: LocalizedChartText;
  readonly limitations: LocalizedChartText;
  readonly dataTable: LocalizedChartText;
  readonly columns: Readonly<Record<string, LocalizedChartText>>;
}

export interface ChartSpec {
  readonly id: string;
  readonly schemaVersion: 1;
  readonly renderer: ChartRendererId;
  readonly transform: ChartTransformId;
  readonly fields: {
    readonly x: string;
    readonly y: string;
    readonly series: string;
  };
  readonly axes: {
    readonly xFormatter: ChartFormatterId;
    readonly yFormatter: ChartFormatterId;
    readonly yDomain: readonly [number, number];
  };
  readonly copy: ChartCopy;
  readonly provenance: {
    readonly sourceId: PublicDataSourceId;
    readonly evidenceGate: EvidenceGate;
    readonly sourceLabel: LocalizedChartText;
    readonly limitationKeys: readonly string[];
    readonly limitationText: readonly LocalizedChartText[];
  };
  readonly accessibility: {
    readonly summaryStrategy: ChartSummaryStrategy;
    readonly dataTable: true;
    readonly reducedMotion: true;
    readonly nonColorEncodings: readonly ('position' | 'label' | 'value')[];
  };
}

export interface RiskProfilePoint {
  readonly labelEn: string;
  readonly labelIt: string;
  readonly value: number;
}

export interface BenchmarkRadarSourcePoint {
  readonly key: string;
  readonly labelEn: string;
  readonly labelIt: string;
  readonly value: number;
  readonly rawValue: string;
}

export interface BenchmarkRadarPoint extends BenchmarkRadarSourcePoint {
  readonly valueA: number | null;
  readonly valueB: number | null;
  readonly rawValueA: string;
  readonly rawValueB: string;
}

export interface ChartSpecIssue {
  code:
    | 'chart.id_invalid'
    | 'chart.renderer_not_allowed'
    | 'chart.transform_not_allowed'
    | 'chart.field_not_allowed'
    | 'chart.formatter_not_allowed'
    | 'chart.domain_invalid'
    | 'chart.source_unknown'
    | 'chart.gate_mismatch'
    | 'chart.copy_missing'
    | 'chart.provenance_incomplete'
    | 'chart.accessibility_incomplete'
    | 'chart.summary_renderer_mismatch'
    | 'chart.executable_value';
  path: string;
  message: string;
}

const ALLOWED_TRANSFORMS = new Set<ChartTransformId>(['identity']);
const ALLOWED_FIELDS = new Set([
  'sequence',
  'score',
  'policyName',
  'labelEn',
  'labelIt',
  'value',
  'region',
  'perspective',
  'riskScore',
  'key',
  'valueA',
  'valueB',
  'riskLevel',
]);
const ALLOWED_FORMATTERS = new Set<ChartFormatterId>([
  'observation-index',
  'score-out-of-ten',
  'percent-out-of-hundred',
  'category-label',
  'region-code',
  'risk-level',
  'localized-date',
]);
const RENDERER_SUMMARY_STRATEGIES: Readonly<Record<ChartRendererId, ChartSummaryStrategy>> =
  Object.freeze({
    'recharts-area': 'risk-trend-delta',
    'recharts-bar': 'risk-profile-maximum',
    'recharts-radar': 'benchmark-radar-wins',
    'native-svg-gauge': 'risk-gauge-score',
    'native-css-heatmap': 'regional-risk-coverage',
  });

const commonCopy = {
  source: Object.freeze({ en: 'Source', it: 'Fonte' }),
  limitations: Object.freeze({ en: 'Limitations', it: 'Limitazioni' }),
  dataTable: Object.freeze({ en: 'View data table', it: 'Mostra tabella dati' }),
} as const;

export function chartSpecId(name: string): string {
  return `policywatcher.chart.${name}.v1`;
}

export const RISK_TREND_CHART_SPEC: ChartSpec = Object.freeze({
  id: chartSpecId('risk-trend'),
  schemaVersion: 1,
  renderer: 'recharts-area',
  transform: 'identity',
  fields: Object.freeze({ x: 'sequence', y: 'score', series: 'policyName' }),
  axes: Object.freeze({
    xFormatter: 'observation-index',
    yFormatter: 'score-out-of-ten',
    yDomain: Object.freeze([0, 10] as const),
  }),
  copy: Object.freeze({
    ...commonCopy,
    title: Object.freeze({ en: 'Risk Score Trend', it: 'Andamento Punteggio di Rischio' }),
    description: Object.freeze({
      en: 'Chronological public policy-change observations. Each point identifies its source policy and snapshot.',
      it: 'Rilevazioni cronologiche di modifiche pubbliche. Ogni punto identifica policy e snapshot sorgente.',
    }),
    noData: Object.freeze({
      en: 'No public historical observations are available.',
      it: 'Non sono disponibili rilevazioni storiche pubbliche.',
    }),
    columns: Object.freeze({
      observation: Object.freeze({ en: 'Observation', it: 'Rilevazione' }),
      policy: Object.freeze({ en: 'Policy', it: 'Policy' }),
      snapshot: Object.freeze({ en: 'Snapshot', it: 'Snapshot' }),
      date: Object.freeze({ en: 'Date', it: 'Data' }),
      score: Object.freeze({ en: 'Score', it: 'Punteggio' }),
      risk: Object.freeze({ en: 'Risk', it: 'Rischio' }),
    }),
  }),
  provenance: Object.freeze({
    sourceId: 'riskTrends',
    evidenceGate: 'public-change',
    sourceLabel: Object.freeze({
      en: 'PolicyWatcher public risk trends API',
      it: 'API pubblica PolicyWatcher dei trend di rischio',
    }),
    limitationKeys: Object.freeze([
      'multi-policy-event-sequence',
      'ai-assisted-risk-score-not-legal-advice',
    ]),
    limitationText: Object.freeze([
      Object.freeze({
        en: 'Observation order can combine changes from multiple policies; snapshot versions remain policy-specific.',
        it: 'L’ordine delle rilevazioni può combinare più policy; le versioni snapshot restano specifiche della singola policy.',
      }),
      Object.freeze({
        en: 'Risk scores are AI-assisted indicators and are not legal advice.',
        it: 'I punteggi di rischio sono indicatori assistiti da AI e non costituiscono consulenza legale.',
      }),
    ]),
  }),
  accessibility: Object.freeze({
    summaryStrategy: 'risk-trend-delta',
    dataTable: true,
    reducedMotion: true,
    nonColorEncodings: Object.freeze(['position', 'label', 'value'] as const),
  }),
});

export const RISK_PROFILE_CHART_SPEC: ChartSpec = Object.freeze({
  id: chartSpecId('risk-profile'),
  schemaVersion: 1,
  renderer: 'recharts-bar',
  transform: 'identity',
  fields: Object.freeze({ x: 'labelEn', y: 'value', series: 'labelIt' }),
  axes: Object.freeze({
    xFormatter: 'category-label',
    yFormatter: 'percent-out-of-hundred',
    yDomain: Object.freeze([0, 100] as const),
  }),
  copy: Object.freeze({
    ...commonCopy,
    title: Object.freeze({ en: 'Active Risk Profile Vectors', it: 'Vettori di Rischio Attivi' }),
    description: Object.freeze({
      en: 'Normalized indicators derived from the latest public policy-change analysis. Higher percentages indicate higher concern.',
      it: 'Indicatori normalizzati derivati dall’ultima analisi pubblica della modifica. Percentuali maggiori indicano maggiore criticità.',
    }),
    noData: Object.freeze({
      en: 'No public risk-profile indicators are available.',
      it: 'Non sono disponibili indicatori pubblici del profilo di rischio.',
    }),
    columns: Object.freeze({
      category: Object.freeze({ en: 'Risk vector', it: 'Vettore di rischio' }),
      value: Object.freeze({ en: 'Concern', it: 'Criticità' }),
    }),
  }),
  provenance: Object.freeze({
    sourceId: 'policyDetails',
    evidenceGate: 'public-change',
    sourceLabel: Object.freeze({
      en: 'PolicyWatcher public policy detail API',
      it: 'API pubblica PolicyWatcher del dettaglio policy',
    }),
    limitationKeys: Object.freeze([
      'qualitative-indicator-normalization',
      'latest-public-change-only',
    ]),
    limitationText: Object.freeze([
      Object.freeze({
        en: 'Qualitative policy indicators are mapped to heuristic percentages for comparison; they are not measured probabilities.',
        it: 'Gli indicatori qualitativi sono mappati in percentuali euristiche per il confronto; non sono probabilità misurate.',
      }),
      Object.freeze({
        en: 'The profile represents the latest public change available for the selected policy.',
        it: 'Il profilo rappresenta l’ultima modifica pubblica disponibile per la policy selezionata.',
      }),
    ]),
  }),
  accessibility: Object.freeze({
    summaryStrategy: 'risk-profile-maximum',
    dataTable: true,
    reducedMotion: true,
    nonColorEncodings: Object.freeze(['position', 'label', 'value'] as const),
  }),
});

export const RISK_GAUGE_CHART_SPEC: ChartSpec = Object.freeze({
  id: chartSpecId('risk-gauge'),
  schemaVersion: 1,
  renderer: 'native-svg-gauge',
  transform: 'identity',
  fields: Object.freeze({ x: 'riskLevel', y: 'score', series: 'riskLevel' }),
  axes: Object.freeze({
    xFormatter: 'risk-level',
    yFormatter: 'score-out-of-ten',
    yDomain: Object.freeze([0, 10] as const),
  }),
  copy: Object.freeze({
    ...commonCopy,
    title: Object.freeze({ en: 'Current Risk Score', it: 'Punteggio di Rischio Corrente' }),
    description: Object.freeze({
      en: 'Current AI-assisted risk indicator from the latest public policy-change analysis.',
      it: 'Indicatore di rischio corrente assistito da AI dall’ultima analisi pubblica della modifica.',
    }),
    noData: Object.freeze({
      en: 'No current public risk score is available.',
      it: 'Non è disponibile un punteggio di rischio pubblico corrente.',
    }),
    columns: Object.freeze({
      score: Object.freeze({ en: 'Score', it: 'Punteggio' }),
      risk: Object.freeze({ en: 'Risk level', it: 'Livello di rischio' }),
    }),
  }),
  provenance: Object.freeze({
    sourceId: 'policyDetails',
    evidenceGate: 'public-change',
    sourceLabel: Object.freeze({
      en: 'PolicyWatcher public policy detail API',
      it: 'API pubblica PolicyWatcher del dettaglio policy',
    }),
    limitationKeys: Object.freeze([
      'latest-public-change-only',
      'ai-assisted-risk-score-not-compliance-rating',
    ]),
    limitationText: Object.freeze([
      Object.freeze({
        en: 'The gauge represents the latest public change available for the selected policy.',
        it: 'Il gauge rappresenta l’ultima modifica pubblica disponibile per la policy selezionata.',
      }),
      Object.freeze({
        en: 'The score is an AI-assisted risk indicator, not a compliance rating or legal conclusion.',
        it: 'Il punteggio è un indicatore di rischio assistito da AI, non un rating di conformità o una conclusione legale.',
      }),
    ]),
  }),
  accessibility: Object.freeze({
    summaryStrategy: 'risk-gauge-score',
    dataTable: true,
    reducedMotion: true,
    nonColorEncodings: Object.freeze(['position', 'label', 'value'] as const),
  }),
});

export const REGION_HEAT_MAP_CHART_SPEC: ChartSpec = Object.freeze({
  id: chartSpecId('region-heat-map'),
  schemaVersion: 1,
  renderer: 'native-css-heatmap',
  transform: 'identity',
  fields: Object.freeze({ x: 'region', y: 'riskScore', series: 'perspective' }),
  axes: Object.freeze({
    xFormatter: 'region-code',
    yFormatter: 'risk-level',
    yDomain: Object.freeze([0, 3] as const),
  }),
  copy: Object.freeze({
    ...commonCopy,
    title: Object.freeze({ en: 'Regional Risk Assessment', it: 'Valutazione del Rischio Regionale' }),
    description: Object.freeze({
      en: 'Risk levels by region and audience perspective from the selected public policy change.',
      it: 'Livelli di rischio per regione e prospettiva dall’analisi pubblica della modifica selezionata.',
    }),
    noData: Object.freeze({
      en: 'No assessed regional impacts are available.',
      it: 'Non sono disponibili impatti regionali valutati.',
    }),
    columns: Object.freeze({
      region: Object.freeze({ en: 'Region', it: 'Regione' }),
      perspective: Object.freeze({ en: 'Perspective', it: 'Prospettiva' }),
      risk: Object.freeze({ en: 'Risk level', it: 'Livello di rischio' }),
      analysis: Object.freeze({ en: 'Impact analysis', it: 'Analisi di impatto' }),
    }),
  }),
  provenance: Object.freeze({
    sourceId: 'policyDetails',
    evidenceGate: 'public-change',
    sourceLabel: Object.freeze({
      en: 'PolicyWatcher public regional impact assessment',
      it: 'Valutazione pubblica PolicyWatcher degli impatti regionali',
    }),
    limitationKeys: Object.freeze([
      'selected-public-change-only',
      'ai-assisted-regional-assessment',
      'missing-cells-not-low-risk',
    ]),
    limitationText: Object.freeze([
      Object.freeze({
        en: 'The matrix represents the selected public policy change, not every historical version.',
        it: 'La matrice rappresenta la modifica pubblica selezionata, non tutte le versioni storiche.',
      }),
      Object.freeze({
        en: 'Regional levels are AI-assisted screening indicators and are not legal conclusions.',
        it: 'I livelli regionali sono indicatori di screening assistiti da AI e non conclusioni legali.',
      }),
      Object.freeze({
        en: 'A missing matrix cell means not assessed; it never implies low risk.',
        it: 'Una cella mancante significa non valutata; non implica mai rischio basso.',
      }),
    ]),
  }),
  accessibility: Object.freeze({
    summaryStrategy: 'regional-risk-coverage',
    dataTable: true,
    reducedMotion: true,
    nonColorEncodings: Object.freeze(['position', 'label', 'value'] as const),
  }),
});

export const BENCHMARK_RADAR_CHART_SPEC: ChartSpec = Object.freeze({
  id: chartSpecId('benchmark-radar'),
  schemaVersion: 1,
  renderer: 'recharts-radar',
  transform: 'identity',
  fields: Object.freeze({ x: 'key', y: 'valueA', series: 'valueB' }),
  axes: Object.freeze({
    xFormatter: 'category-label',
    yFormatter: 'percent-out-of-hundred',
    yDomain: Object.freeze([0, 100] as const),
  }),
  copy: Object.freeze({
    ...commonCopy,
    title: Object.freeze({ en: 'KPI Risk Benchmark', it: 'Benchmark di Rischio KPI' }),
    description: Object.freeze({
      en: 'Normalized KPI risk comparison. Lower values indicate lower concern; exact assessments remain available in the data table.',
      it: 'Confronto normalizzato del rischio KPI. Valori inferiori indicano minore criticità; le valutazioni esatte restano disponibili nella tabella.',
    }),
    noData: Object.freeze({
      en: 'No comparable public KPI assessments are available.',
      it: 'Non sono disponibili valutazioni KPI pubbliche comparabili.',
    }),
    columns: Object.freeze({
      kpi: Object.freeze({ en: 'KPI', it: 'KPI' }),
      firstAssessment: Object.freeze({ en: 'First assessment', it: 'Prima valutazione' }),
      firstScore: Object.freeze({ en: 'First risk score', it: 'Primo punteggio di rischio' }),
      secondAssessment: Object.freeze({ en: 'Second assessment', it: 'Seconda valutazione' }),
      secondScore: Object.freeze({ en: 'Second risk score', it: 'Secondo punteggio di rischio' }),
      safer: Object.freeze({ en: 'Lower concern', it: 'Criticità inferiore' }),
    }),
  }),
  provenance: Object.freeze({
    sourceId: 'companyComparison',
    evidenceGate: 'public-change',
    sourceLabel: Object.freeze({
      en: 'PolicyWatcher public company comparison API',
      it: 'API pubblica PolicyWatcher di confronto aziende',
    }),
    limitationKeys: Object.freeze([
      'qualitative-kpi-normalization',
      'latest-public-change-per-policy',
      'industry-cohort-current-dataset',
    ]),
    limitationText: Object.freeze([
      Object.freeze({
        en: 'Categorical assessments are normalized to heuristic 0–100 risk values; they are not measured probabilities.',
        it: 'Le valutazioni categoriali sono normalizzate in valori di rischio euristici 0–100; non sono probabilità misurate.',
      }),
      Object.freeze({
        en: 'Each company profile aggregates the latest public change available for each public policy.',
        it: 'Ogni profilo aziendale aggrega l’ultima modifica pubblica disponibile per ciascuna policy pubblica.',
      }),
      Object.freeze({
        en: 'Industry averages use the currently available evidence-gated cohort and may change as coverage evolves.',
        it: 'Le medie di settore usano la coorte corrente soggetta ai gate di evidenza e possono cambiare con la copertura.',
      }),
    ]),
  }),
  accessibility: Object.freeze({
    summaryStrategy: 'benchmark-radar-wins',
    dataTable: true,
    reducedMotion: true,
    nonColorEncodings: Object.freeze(['position', 'label', 'value'] as const),
  }),
});

function containsExecutableValue(value: unknown, seen = new Set<unknown>()): boolean {
  if (typeof value === 'function') return true;
  if (!value || typeof value !== 'object' || seen.has(value)) return false;
  seen.add(value);
  return Object.values(value).some((nested) => containsExecutableValue(nested, seen));
}

function hasLocalizedText(text: LocalizedChartText): boolean {
  return Boolean(text.en.trim() && text.it.trim());
}

export function validateChartSpec(spec: ChartSpec): ChartSpecIssue[] {
  const issues: ChartSpecIssue[] = [];

  if (!/^policywatcher\.chart\.[a-z0-9-]+\.v1$/.test(spec.id)) {
    issues.push({
      code: 'chart.id_invalid',
      path: 'id',
      message: 'Chart must use a deterministic versioned PolicyWatcher id.',
    });
  }
  if (!BUILT_IN_CHART_RENDERERS[spec.renderer]) {
    issues.push({
      code: 'chart.renderer_not_allowed',
      path: 'renderer',
      message: `Renderer ${spec.renderer} is not allowlisted.`,
    });
  }
  if (!ALLOWED_TRANSFORMS.has(spec.transform)) {
    issues.push({
      code: 'chart.transform_not_allowed',
      path: 'transform',
      message: `Transform ${spec.transform} is not allowlisted.`,
    });
  }
  for (const [key, field] of Object.entries(spec.fields)) {
    if (!ALLOWED_FIELDS.has(field)) {
      issues.push({
        code: 'chart.field_not_allowed',
        path: `fields.${key}`,
        message: `Field ${field} is not allowlisted for this chart schema.`,
      });
    }
  }
  for (const [key, formatter] of [
    ['xFormatter', spec.axes.xFormatter],
    ['yFormatter', spec.axes.yFormatter],
  ] as const) {
    if (!ALLOWED_FORMATTERS.has(formatter)) {
      issues.push({
        code: 'chart.formatter_not_allowed',
        path: `axes.${key}`,
        message: `Formatter ${formatter} is not allowlisted.`,
      });
    }
  }
  const [minimum, maximum] = spec.axes.yDomain;
  if (!Number.isFinite(minimum) || !Number.isFinite(maximum) || minimum >= maximum) {
    issues.push({
      code: 'chart.domain_invalid',
      path: 'axes.yDomain',
      message: 'Y-axis domain must contain two increasing finite values.',
    });
  }
  const source = PUBLIC_DATA_SOURCES[spec.provenance.sourceId];
  if (!source) {
    issues.push({
      code: 'chart.source_unknown',
      path: 'provenance.sourceId',
      message: `Unknown chart data source ${spec.provenance.sourceId}.`,
    });
  } else if (source.evidenceGate !== spec.provenance.evidenceGate) {
    issues.push({
      code: 'chart.gate_mismatch',
      path: 'provenance.evidenceGate',
      message: 'Chart evidence gate does not match its registered data source.',
    });
  }
  for (const [key, text] of Object.entries(spec.copy)) {
    if (key === 'columns') continue;
    if (!hasLocalizedText(text as LocalizedChartText)) {
      issues.push({
        code: 'chart.copy_missing',
        path: `copy.${key}`,
        message: `Chart copy ${key} must be bilingual.`,
      });
    }
  }
  for (const [key, text] of Object.entries(spec.copy.columns)) {
    if (!hasLocalizedText(text)) {
      issues.push({
        code: 'chart.copy_missing',
        path: `copy.columns.${key}`,
        message: `Chart column copy ${key} must be bilingual.`,
      });
    }
  }
  if (
    spec.provenance.limitationKeys.length === 0 ||
    spec.provenance.limitationKeys.length !== spec.provenance.limitationText.length ||
    !hasLocalizedText(spec.provenance.sourceLabel)
  ) {
    issues.push({
      code: 'chart.provenance_incomplete',
      path: 'provenance',
      message: 'Chart provenance requires a source label and keyed limitations.',
    });
  }
  if (
    !spec.accessibility.dataTable ||
    !spec.accessibility.reducedMotion ||
    !spec.accessibility.nonColorEncodings.includes('position') ||
    !spec.accessibility.nonColorEncodings.includes('label') ||
    !spec.accessibility.nonColorEncodings.includes('value')
  ) {
    issues.push({
      code: 'chart.accessibility_incomplete',
      path: 'accessibility',
      message: 'Chart requires a data table, reduced motion, position, labels, and values.',
    });
  }
  if (RENDERER_SUMMARY_STRATEGIES[spec.renderer] !== spec.accessibility.summaryStrategy) {
    issues.push({
      code: 'chart.summary_renderer_mismatch',
      path: 'accessibility.summaryStrategy',
      message: 'Chart summary strategy must match the selected built-in renderer.',
    });
  }
  if (containsExecutableValue(spec)) {
    issues.push({
      code: 'chart.executable_value',
      path: '$',
      message: 'Chart specifications cannot contain executable values.',
    });
  }

  return issues;
}

export const BUILT_IN_CHART_SPEC_ISSUES = Object.freeze({
  riskTrend: validateChartSpec(RISK_TREND_CHART_SPEC),
  riskProfile: validateChartSpec(RISK_PROFILE_CHART_SPEC),
  riskGauge: validateChartSpec(RISK_GAUGE_CHART_SPEC),
  regionHeatMap: validateChartSpec(REGION_HEAT_MAP_CHART_SPEC),
  benchmarkRadar: validateChartSpec(BENCHMARK_RADAR_CHART_SPEC),
});
export const RISK_TREND_CHART_SPEC_ISSUES = BUILT_IN_CHART_SPEC_ISSUES.riskTrend;

for (const [name, issues] of Object.entries(BUILT_IN_CHART_SPEC_ISSUES)) {
  if (issues.length > 0) {
    throw new Error(
      `Invalid built-in ${name} chart spec: ${issues
        .map((issue) => `${issue.path}: ${issue.message}`)
        .join('; ')}`
    );
  }
}

export function localizedChartText(text: LocalizedChartText, lang: Lang): string {
  return text[lang];
}

export function summarizeRiskTrendChart(data: readonly RiskTrendPoint[], lang: Lang): string {
  if (data.length === 0) return localizedChartText(RISK_TREND_CHART_SPEC.copy.noData, lang);
  const ordered = [...data].sort((left, right) => left.sequence - right.sequence);
  const first = ordered[0].score;
  const latest = ordered[ordered.length - 1].score;
  const delta = Math.round((latest - first) * 10) / 10;
  const policies = new Set(ordered.map((point) => `${point.companyName}:${point.policyName}`)).size;
  const directionEn = delta > 0 ? 'worsening' : delta < 0 ? 'improving' : 'stable';
  const directionIt = delta > 0 ? 'in peggioramento' : delta < 0 ? 'in miglioramento' : 'stabile';
  const signedDelta = delta > 0 ? `+${delta}` : String(delta);

  return lang === 'it'
    ? `${ordered.length} rilevazioni pubbliche su ${policies} policy. Il punteggio passa da ${first} a ${latest} (${signedDelta}, ${directionIt}).`
    : `${ordered.length} public observations across ${policies} policies. The score moves from ${first} to ${latest} (${signedDelta}, ${directionEn}).`;
}

export function summarizeRiskProfileChart(
  data: readonly RiskProfilePoint[],
  lang: Lang
): string {
  const assessed = data.filter((point) => Number.isFinite(point.value));
  if (assessed.length === 0) return localizedChartText(RISK_PROFILE_CHART_SPEC.copy.noData, lang);
  const highest = assessed.reduce((current, point) => point.value > current.value ? point : current);
  const label = lang === 'it' ? highest.labelIt : highest.labelEn;
  return lang === 'it'
    ? `${assessed.length} vettori valutati. La criticità più alta è ${label} al ${highest.value}%.`
    : `${assessed.length} assessed vectors. The highest concern is ${label} at ${highest.value}%.`;
}

export function summarizeRiskGaugeChart(
  score: number,
  riskLevel: RiskLevel,
  lang: Lang
): string {
  const normalizedScore = Math.min(Math.max(Number.isFinite(score) ? score : 0, 0), 10);
  const riskLabel = lang === 'it'
    ? ({ Low: 'basso', Medium: 'medio', High: 'alto' } as const)[riskLevel]
    : riskLevel.toLowerCase();
  return lang === 'it'
    ? `Il punteggio di rischio pubblico corrente è ${normalizedScore.toFixed(1)} su 10, livello ${riskLabel}.`
    : `The current public risk score is ${normalizedScore.toFixed(1)} out of 10, ${riskLabel} risk.`;
}

export function summarizeRegionHeatMap(
  impacts: readonly RegionImpact[],
  lang: Lang
): string {
  if (impacts.length === 0) return localizedChartText(REGION_HEAT_MAP_CHART_SPEC.copy.noData, lang);
  const expectedCells = 6;
  const uniqueImpacts = [...new Map(
    impacts.map((impact) => [`${impact.region}:${impact.perspective}`, impact])
  ).values()];
  const highRisk = uniqueImpacts.filter((impact) => impact.riskLevel === 'High');
  const coverage = `${uniqueImpacts.length}/${expectedCells}`;
  if (lang === 'it') {
    return highRisk.length > 0
      ? `${coverage} combinazioni regione-prospettiva valutate; ${highRisk.length} ${highRisk.length === 1 ? 'risulta' : 'risultano'} ad alto rischio.`
      : `${coverage} combinazioni regione-prospettiva valutate; nessuna risulta ad alto rischio.`;
  }
  return highRisk.length > 0
    ? `${coverage} region-perspective combinations assessed; ${highRisk.length} ${highRisk.length === 1 ? 'is' : 'are'} high risk.`
    : `${coverage} region-perspective combinations assessed; none are high risk.`;
}

function normalizeBenchmarkValue(value: number, rawValue: string): number | null {
  if (!isAssessedKpiValue(rawValue) || !Number.isFinite(value)) return null;
  return Math.min(Math.max(value, 0), 100);
}

/** Merges benchmark profiles by stable KPI key instead of array position. */
export function mergeBenchmarkRadarData(
  first: readonly BenchmarkRadarSourcePoint[],
  second: readonly BenchmarkRadarSourcePoint[]
): BenchmarkRadarPoint[] {
  const secondByKey = new Map(second.map((point) => [point.key, point]));
  return first.flatMap((point) => {
    const comparison = secondByKey.get(point.key);
    if (!comparison) return [];
    return [{
      ...point,
      valueA: normalizeBenchmarkValue(point.value, point.rawValue),
      valueB: normalizeBenchmarkValue(comparison.value, comparison.rawValue),
      rawValueA: point.rawValue,
      rawValueB: comparison.rawValue,
    }];
  });
}

export function summarizeBenchmarkRadarChart(
  data: readonly BenchmarkRadarPoint[],
  firstName: string,
  secondName: string,
  lang: Lang
): string {
  const comparable = data.filter(
    (point): point is BenchmarkRadarPoint & { valueA: number; valueB: number } =>
      point.valueA !== null && point.valueB !== null
  );
  if (comparable.length === 0) {
    return localizedChartText(BENCHMARK_RADAR_CHART_SPEC.copy.noData, lang);
  }
  const firstWins = comparable.filter((point) => point.valueA < point.valueB).length;
  const secondWins = comparable.filter((point) => point.valueB < point.valueA).length;
  const ties = comparable.length - firstWins - secondWins;

  return lang === 'it'
    ? `${comparable.length} KPI comparabili: ${firstName} mostra criticità inferiore in ${firstWins}, ${secondName} in ${secondWins}, con ${ties} parità.`
    : `${comparable.length} comparable ${comparable.length === 1 ? 'KPI' : 'KPIs'}: ${firstName} has lower concern in ${firstWins}, ${secondName} in ${secondWins}, with ${ties} ${ties === 1 ? 'tie' : 'ties'}.`;
}
