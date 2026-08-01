import { describe, expect, it } from 'vitest';
import type { AdminActionCenterResult, AdminActionPriority } from '@/lib/adminActionCenter';
import type { AdminLiveStatusCard } from '@/lib/adminLiveStatus';
import type { PublicationReadinessResult, PublicationReadinessStageId } from '@/lib/publicationReadiness';
import {
  getAdminDashboardRolePresentation,
  presentActionCenterForRole,
  presentLiveStatusCardsForRole,
  presentPublicationReadinessForRole,
} from '@/lib/adminRolePresentation';

const priorityIds = [
  'database-unavailable',
  'database-degraded',
  'database-metrics-unavailable',
  'webhook-metric-unavailable',
  'webhook-terminal-failures',
  'scan-metric-unavailable',
  'scan-never-run',
  'scan-timestamp-unavailable',
  'scan-stale',
  'baseline-metric-unavailable',
  'public-baselines-missing',
  'remediation-metric-unavailable',
  'source-remediation-open',
  'inquiry-metric-unavailable',
  'policy-inquiries-open',
] as const;

function actionResult(): AdminActionCenterResult {
  return {
    checkedAt: '2026-08-01T10:00:00.000Z',
    checkedWindow: 'Test window',
    priorities: priorityIds.map((id): AdminActionPriority => ({
      id,
      severity: 'high',
      severityLabel: 'High',
      title: id,
      cause: 'Persisted test cause',
      timestamp: '2026-08-01T09:00:00.000Z',
      timestampLabel: 'Evidence timestamp',
      impact: 'Bounded test impact',
      affectedRecords: 1,
      metricState: 'available',
      action: { href: '/admin/cron', label: 'Canonical admin action' },
    })),
  };
}

function readinessResult(): PublicationReadinessResult {
  const ids: PublicationReadinessStageId[] = ['configured', 'retrieved', 'baseline-verified', 'public', 'analysed'];
  return {
    checkedAt: '2026-08-01T10:00:00.000Z',
    available: true,
    denominator: 5,
    consistencyWarning: null,
    scopeBoundary: 'Test boundary',
    stages: ids.map((id) => ({
      id,
      label: id,
      count: 5,
      denominator: 5,
      excluded: 0,
      availability: 'measured',
      definition: 'Test definition',
      actionHref: '/admin/cron',
      actionLabel: 'Canonical admin action',
      reason: null,
      boundary: null,
    })),
  };
}

describe('admin role presentation', () => {
  it('provides explicit operational and read-only dashboard identities', () => {
    expect(getAdminDashboardRolePresentation('admin').roleLabel).toBe('Admin · operational');
    expect(getAdminDashboardRolePresentation('auditor').roleLabel).toBe('Auditor · read-only');
    expect(getAdminDashboardRolePresentation('auditor').subtitle).toContain('Read-only verification');
  });

  it('preserves every canonical Admin priority action', () => {
    const result = actionResult();
    expect(presentActionCenterForRole(result, 'admin')).toBe(result);
    expect(result.priorities.every((item) => item.action.href === '/admin/cron')).toBe(true);
  });

  it('maps every known priority to a visible Auditor verification route', () => {
    const result = actionResult();
    const presented = presentActionCenterForRole(result, 'auditor');
    expect(presented.priorities).toHaveLength(priorityIds.length);
    expect(presented.priorities.every((item) => item.action.label.startsWith('Verify'))).toBe(true);
    expect(presented.priorities.map((item) => item.action.href)).not.toContain('/admin/cron');
    expect(presented.priorities.map((item) => item.action.href)).not.toContain('/admin/inquiries');
    expect(result.priorities.every((item) => item.action.href === '/admin/cron')).toBe(true);
  });

  it('maps all funnel stages to role-safe Auditor evidence consoles', () => {
    const result = readinessResult();
    expect(presentPublicationReadinessForRole(result, 'admin')).toBe(result);
    const presented = presentPublicationReadinessForRole(result, 'auditor');
    expect(presented.stages.map((stage) => stage.actionHref)).toEqual([
      '/admin/database',
      '/admin/source-reliability',
      '/admin/source-reliability',
      '/admin/dataset-quality',
      '/admin/kpi-audit',
    ]);
    expect(presented.stages.every((stage) => stage.actionLabel.startsWith('Verify'))).toBe(true);
  });

  it('changes only Live Status action language for Auditor', () => {
    const cards = [
      ['dataset-qa', '/admin/dataset-quality'],
      ['database', '/admin/database'],
      ['webhook', '/admin/webhook-delivery'],
      ['vps', '/admin/vps-services'],
    ].map(([id, href]) => ({
      id,
      label: id,
      scope: 'Test',
      state: 'measured',
      stateLabel: 'Measured',
      checkedAt: '2026-08-01T10:00:00.000Z',
      metricAvailability: 'available',
      count: 0,
      countLabel: 'Records',
      detail: 'Measured test value',
      action: { href, label: 'Open console' },
    })) as AdminLiveStatusCard[];
    const presented = presentLiveStatusCardsForRole(cards, 'auditor');
    expect(presented.map((card) => card.action.href)).toEqual(cards.map((card) => card.action.href));
    expect(presented.every((card) => card.action.label.startsWith('Verify'))).toBe(true);
    expect(cards.every((card) => card.action.label === 'Open console')).toBe(true);
  });
});
