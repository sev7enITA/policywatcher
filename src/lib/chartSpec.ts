import type { Lang } from '@/types';
import {
  PUBLIC_DATA_SOURCES,
  type EvidenceGate,
  type PublicDataSourceId,
} from './dataSourceRegistry';
import type { RiskTrendPoint } from './riskTrends';

export type ChartRendererId = 'recharts-area';
export type ChartTransformId = 'identity';
export type ChartFormatterId = 'observation-index' | 'score-out-of-ten' | 'localized-date';

export interface LocalizedChartText {
  readonly en: string;
  readonly it: string;
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
  readonly copy: {
    readonly title: LocalizedChartText;
    readonly description: LocalizedChartText;
    readonly score: LocalizedChartText;
    readonly observation: LocalizedChartText;
    readonly snapshot: LocalizedChartText;
    readonly date: LocalizedChartText;
    readonly policy: LocalizedChartText;
    readonly risk: LocalizedChartText;
    readonly noData: LocalizedChartText;
    readonly source: LocalizedChartText;
    readonly limitations: LocalizedChartText;
    readonly dataTable: LocalizedChartText;
  };
  readonly provenance: {
    readonly sourceId: PublicDataSourceId;
    readonly evidenceGate: EvidenceGate;
    readonly sourceLabel: LocalizedChartText;
    readonly limitationKeys: readonly string[];
    readonly limitationText: readonly LocalizedChartText[];
  };
  readonly accessibility: {
    readonly summaryStrategy: 'risk-trend-delta';
    readonly dataTable: true;
    readonly reducedMotion: true;
    readonly nonColorEncodings: readonly ('position' | 'label')[];
  };
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
    | 'chart.accessibility_incomplete'
    | 'chart.executable_value';
  path: string;
  message: string;
}

const ALLOWED_RENDERERS = new Set<ChartRendererId>(['recharts-area']);
const ALLOWED_TRANSFORMS = new Set<ChartTransformId>(['identity']);
const ALLOWED_FIELDS = new Set(['sequence', 'score', 'policyName']);
const ALLOWED_FORMATTERS = new Set<ChartFormatterId>([
  'observation-index',
  'score-out-of-ten',
  'localized-date',
]);

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
    title: Object.freeze({ en: 'Risk Score Trend', it: 'Andamento Punteggio di Rischio' }),
    description: Object.freeze({
      en: 'Chronological public policy-change observations. Each point identifies its source policy and snapshot.',
      it: 'Rilevazioni cronologiche di modifiche pubbliche. Ogni punto identifica policy e snapshot sorgente.',
    }),
    score: Object.freeze({ en: 'Score', it: 'Punteggio' }),
    observation: Object.freeze({ en: 'Observation', it: 'Rilevazione' }),
    snapshot: Object.freeze({ en: 'Snapshot', it: 'Snapshot' }),
    date: Object.freeze({ en: 'Date', it: 'Data' }),
    policy: Object.freeze({ en: 'Policy', it: 'Policy' }),
    risk: Object.freeze({ en: 'Risk', it: 'Rischio' }),
    noData: Object.freeze({
      en: 'No public historical observations are available.',
      it: 'Non sono disponibili rilevazioni storiche pubbliche.',
    }),
    source: Object.freeze({ en: 'Source', it: 'Fonte' }),
    limitations: Object.freeze({ en: 'Limitations', it: 'Limitazioni' }),
    dataTable: Object.freeze({ en: 'View data table', it: 'Mostra tabella dati' }),
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
    nonColorEncodings: Object.freeze(['position', 'label'] as const),
  }),
});

function containsExecutableValue(value: unknown, seen = new Set<unknown>()): boolean {
  if (typeof value === 'function') return true;
  if (!value || typeof value !== 'object' || seen.has(value)) return false;
  seen.add(value);
  return Object.values(value).some((nested) => containsExecutableValue(nested, seen));
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
  if (!ALLOWED_RENDERERS.has(spec.renderer)) {
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
    if (!text.en.trim() || !text.it.trim()) {
      issues.push({
        code: 'chart.copy_missing',
        path: `copy.${key}`,
        message: `Chart copy ${key} must be bilingual.`,
      });
    }
  }
  if (
    !spec.accessibility.dataTable ||
    !spec.accessibility.reducedMotion ||
    !spec.accessibility.nonColorEncodings.includes('position') ||
    !spec.accessibility.nonColorEncodings.includes('label')
  ) {
    issues.push({
      code: 'chart.accessibility_incomplete',
      path: 'accessibility',
      message: 'Chart requires a data table, reduced motion, position, and labels.',
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

export const RISK_TREND_CHART_SPEC_ISSUES = validateChartSpec(RISK_TREND_CHART_SPEC);

if (RISK_TREND_CHART_SPEC_ISSUES.length > 0) {
  throw new Error(
    `Invalid built-in risk trend chart spec: ${RISK_TREND_CHART_SPEC_ISSUES
      .map((issue) => `${issue.path}: ${issue.message}`)
      .join('; ')}`
  );
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
