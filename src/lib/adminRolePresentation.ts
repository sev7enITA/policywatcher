import type { AdminActionCenterResult, AdminActionPriority } from '@/lib/adminActionCenter';
import type { AdminLiveStatusCard } from '@/lib/adminLiveStatus';
import type {
  PublicationReadinessResult,
  PublicationReadinessStage,
  PublicationReadinessStageId,
} from '@/lib/publicationReadiness';

export type AdminConsoleRole = 'admin' | 'auditor';

export interface AdminDashboardRolePresentation {
  roleLabel: string;
  title: string;
  subtitle: string;
  actionCenterEyebrow: string;
  actionCenterDescription: string;
}

const AUDITOR_PRIORITY_ACTIONS: Record<string, AdminActionPriority['action']> = {
  'database-unavailable': { href: '/admin/database', label: 'Verify database evidence' },
  'database-degraded': { href: '/admin/database', label: 'Verify database evidence' },
  'database-metrics-unavailable': { href: '/admin/database', label: 'Verify database evidence' },
  'webhook-metric-unavailable': { href: '/admin/webhook-delivery', label: 'Verify webhook evidence' },
  'webhook-terminal-failures': { href: '/admin/webhook-delivery', label: 'Verify webhook evidence' },
  'scan-metric-unavailable': { href: '/admin/source-reliability', label: 'Verify scan evidence' },
  'scan-never-run': { href: '/admin/source-reliability', label: 'Verify scan evidence' },
  'scan-timestamp-unavailable': { href: '/admin/source-reliability', label: 'Verify scan evidence' },
  'scan-stale': { href: '/admin/source-reliability', label: 'Verify scan evidence' },
  'baseline-metric-unavailable': { href: '/admin/source-reliability', label: 'Verify baseline evidence' },
  'public-baselines-missing': { href: '/admin/source-reliability', label: 'Verify baseline evidence' },
  'remediation-metric-unavailable': { href: '/admin/source-reliability', label: 'Verify remediation evidence' },
  'source-remediation-open': { href: '/admin/source-reliability', label: 'Verify remediation evidence' },
  'inquiry-metric-unavailable': { href: '/admin/review-log', label: 'Verify review ledger' },
  'policy-inquiries-open': { href: '/admin/review-log', label: 'Verify review ledger' },
};

const AUDITOR_FUNNEL_ACTIONS: Record<PublicationReadinessStageId, Pick<PublicationReadinessStage, 'actionHref' | 'actionLabel'>> = {
  configured: { actionHref: '/admin/database', actionLabel: 'Verify configured evidence' },
  retrieved: { actionHref: '/admin/source-reliability', actionLabel: 'Verify retrieval evidence' },
  'baseline-verified': { actionHref: '/admin/source-reliability', actionLabel: 'Verify baseline evidence' },
  public: { actionHref: '/admin/dataset-quality', actionLabel: 'Verify publication gate' },
  analysed: { actionHref: '/admin/kpi-audit', actionLabel: 'Verify analysis evidence' },
};

const AUDITOR_LIVE_ACTION_LABELS: Record<AdminLiveStatusCard['id'], string> = {
  'dataset-qa': 'Verify Dataset QA evidence',
  database: 'Verify database evidence',
  webhook: 'Verify webhook evidence',
  vps: 'Verify VPS evidence',
};

export function getAdminDashboardRolePresentation(role: AdminConsoleRole): AdminDashboardRolePresentation {
  if (role === 'auditor') {
    return {
      roleLabel: 'Auditor · read-only',
      title: 'Evidence review dashboard',
      subtitle: 'Read-only verification of operational evidence, timestamps and metric availability',
      actionCenterEyebrow: 'Read-only evidence queue',
      actionCenterDescription: 'Priorities retain their operational evidence while actions lead only to visible verification consoles.',
    };
  }

  return {
    roleLabel: 'Admin · operational',
    title: 'Operational dashboard',
    subtitle: 'Operational triage, evidence readiness and responsible-console routing',
    actionCenterEyebrow: 'Deterministic triage queue',
    actionCenterDescription: 'Priorities are derived from available persisted operational evidence. Missing metrics remain explicit.',
  };
}

export function presentActionCenterForRole(
  result: AdminActionCenterResult,
  role: AdminConsoleRole,
): AdminActionCenterResult {
  if (role === 'admin') return result;

  return {
    ...result,
    priorities: result.priorities.map((priority) => ({
      ...priority,
      action: AUDITOR_PRIORITY_ACTIONS[priority.id] || {
        href: '/admin/review-log',
        label: 'Verify recorded evidence',
      },
    })),
  };
}

export function presentPublicationReadinessForRole(
  result: PublicationReadinessResult,
  role: AdminConsoleRole,
): PublicationReadinessResult {
  if (role === 'admin') return result;

  return {
    ...result,
    stages: result.stages.map((stage) => ({
      ...stage,
      ...AUDITOR_FUNNEL_ACTIONS[stage.id],
    })),
  };
}

export function presentLiveStatusCardsForRole(
  cards: AdminLiveStatusCard[],
  role: AdminConsoleRole,
): AdminLiveStatusCard[] {
  if (role === 'admin') return cards;

  return cards.map((card) => ({
    ...card,
    action: {
      ...card.action,
      label: AUDITOR_LIVE_ACTION_LABELS[card.id],
    },
  }));
}
