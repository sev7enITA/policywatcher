import { CHANGE_KIND_LABELS } from './changeClassificationCopy';
import type { ChangeKind } from './changeClassificationTypes';

export const DASHBOARD_WORKFLOW_SCHEMA = 'policywatcher.dashboard.workflow.v1' as const;

export type DashboardWorkflowLanguage = 'en' | 'it';
export type DashboardTodayItemKind = 'source-qa' | 'change' | 'civic' | 'orientation';

export interface DashboardWorkflowChangeInput {
  id: string;
  createdAt: string;
  overallRisk: string;
  overallScore: number;
  classification?: { kind: ChangeKind } | null;
  scoreDelta?: number | null;
  company: string;
  policy: string;
}

export interface DashboardTodayItem {
  schema: typeof DASHBOARD_WORKFLOW_SCHEMA;
  id: string;
  kind: DashboardTodayItemKind;
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  priority: number;
}

interface BuildDashboardTodayItemsInput {
  changes: readonly DashboardWorkflowChangeInput[];
  suspendedSources: number | null;
  lang: DashboardWorkflowLanguage;
}

export function dashboardScoreLabel(score: number, delta: number | null | undefined, lang: DashboardWorkflowLanguage) {
  const isIt = lang === 'it';
  const label = isIt ? 'Rischio stimato' : 'Estimated risk';
  let comparison = isIt ? 'confronto precedente non disponibile' : 'previous comparison unavailable';
  if (delta === 0) comparison = isIt ? 'punteggio invariato' : 'score unchanged';
  else if (typeof delta === 'number') {
    const signed = delta > 0 ? `+${delta}` : String(delta);
    comparison = isIt ? `${signed} rispetto alla valutazione precedente` : `${signed} since the previous assessment`;
  }
  return `${label} ${score}/10 · ${comparison}`;
}

function normalizedTime(value: string): number {
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function riskPriority(risk: string): number {
  if (risk.toLowerCase() === 'high') return 0;
  if (risk.toLowerCase() === 'medium') return 1;
  return 2;
}

export function buildDashboardTodayItems({
  changes,
  suspendedSources,
  lang,
}: BuildDashboardTodayItemsInput): DashboardTodayItem[] {
  const isIt = lang === 'it';
  const items: DashboardTodayItem[] = [];

  const hasSuspensions = suspendedSources !== null && suspendedSources > 0;
  if (hasSuspensions) {
    items.push({
      schema: DASHBOARD_WORKFLOW_SCHEMA,
      id: 'source-quality',
      kind: 'source-qa',
      eyebrow: isIt ? 'Stato QA' : 'QA status',
      title: isIt ? 'Fonti sospese dalla pubblicazione' : 'Sources suspended from publication',
      description: isIt
        ? `${suspendedSources} sorgenti restano fuori dall’interpretazione finché il recupero non viene verificato.`
        : `${suspendedSources} sources remain outside interpretation until retrieval is verified.`,
      href: '#source-quality',
      priority: 0,
    });
  }

  const rankedChanges = [...changes]
    .sort((left, right) => {
      const riskDelta = riskPriority(left.overallRisk) - riskPriority(right.overallRisk);
      if (riskDelta !== 0) return riskDelta;
      const scoreDelta = right.overallScore - left.overallScore;
      if (scoreDelta !== 0) return scoreDelta;
      return normalizedTime(right.createdAt) - normalizedTime(left.createdAt);
    })
    .slice(0, hasSuspensions ? 1 : 2);

  for (const [index, change] of rankedChanges.entries()) {
    items.push({
      schema: DASHBOARD_WORKFLOW_SCHEMA,
      id: `change-${change.id}`,
      kind: 'change',
      eyebrow: CHANGE_KIND_LABELS[lang][change.classification?.kind ?? 'needs_review'],
      title: `${change.company} · ${change.policy}`,
      description: dashboardScoreLabel(change.overallScore, change.scoreDelta, lang),
      href: `/change/${encodeURIComponent(change.id)}?lang=${lang}`,
      priority: index + 1,
    });
  }

  items.push({
    schema: DASHBOARD_WORKFLOW_SCHEMA,
    id: 'civic-workspace',
    kind: 'civic',
    eyebrow: isIt ? 'Percorso civico' : 'Civic workflow',
    title: isIt ? 'Apri il radar per le associazioni' : 'Open the association radar',
    description: isIt
      ? 'Imposta Paese, area regolatoria, tema e tipo di associazione sul catalogo pubblico.'
      : 'Set country, regulatory area, theme and association type on the public catalog.',
    href: isIt ? '/it/associazioni' : '/en/associations',
    priority: 3,
  });

  if (items.length === 1) {
    items.unshift({
      schema: DASHBOARD_WORKFLOW_SCHEMA,
      id: 'orientation',
      kind: 'orientation',
      eyebrow: isIt ? 'Orientamento' : 'Orientation',
      title: isIt ? 'Esplora il catalogo pubblico' : 'Explore the public catalogue',
      description: isIt
        ? 'Continua dal workspace attivo oppure esplora il catalogo pubblico.'
        : 'Continue from the active workspace or explore the public catalog.',
      href: '#dashboard-workspace',
      priority: 2,
    });
  }

  return items.slice(0, 3);
}
