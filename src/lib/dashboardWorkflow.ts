export const DASHBOARD_WORKFLOW_SCHEMA = 'policywatcher.dashboard.workflow.v1' as const;

export type DashboardWorkflowLanguage = 'en' | 'it';
export type DashboardTodayItemKind = 'source-qa' | 'change' | 'civic' | 'orientation';

export interface DashboardWorkflowChangeInput {
  id: string;
  createdAt: string;
  overallRisk: string;
  overallScore: number;
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
  suspendedSources: number;
  lang: DashboardWorkflowLanguage;
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

  if (suspendedSources > 0) {
    items.push({
      schema: DASHBOARD_WORKFLOW_SCHEMA,
      id: 'source-quality',
      kind: 'source-qa',
      eyebrow: isIt ? 'Stato QA' : 'QA status',
      title: isIt ? 'Una verifica fonti richiede attenzione' : 'One source-quality check needs attention',
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
    .slice(0, suspendedSources > 0 ? 1 : 2);

  for (const [index, change] of rankedChanges.entries()) {
    items.push({
      schema: DASHBOARD_WORKFLOW_SCHEMA,
      id: `change-${change.id}`,
      kind: 'change',
      eyebrow: isIt ? 'Cambiamento verificato' : 'Verified change',
      title: `${change.company} · ${change.policy}`,
      description: isIt
        ? `${change.overallRisk} · ${change.overallScore}/10. Apri l’evidenza prima di usare il segnale.`
        : `${change.overallRisk} · ${change.overallScore}/10. Open the evidence before using the signal.`,
      href: `/change/${encodeURIComponent(change.id)}`,
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
    href: '/associazioni',
    priority: 3,
  });

  if (items.length === 1) {
    items.unshift({
      schema: DASHBOARD_WORKFLOW_SCHEMA,
      id: 'orientation',
      kind: 'orientation',
      eyebrow: isIt ? 'Orientamento' : 'Orientation',
      title: isIt ? 'Il registro non espone nuove priorità' : 'The registry has no new priorities',
      description: isIt
        ? 'Continua dal workspace attivo oppure esplora il catalogo pubblico.'
        : 'Continue from the active workspace or explore the public catalog.',
      href: '#dashboard-workspace',
      priority: 2,
    });
  }

  return items.slice(0, 3);
}
