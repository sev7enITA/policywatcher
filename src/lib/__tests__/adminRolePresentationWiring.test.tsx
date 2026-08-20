import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { OperationalActionCenter } from '@/app/admin/OperationalActionCenter';
import { PublicationReadinessFunnel } from '@/app/admin/PublicationReadinessFunnel';
import { DatabaseRecoveryTools } from '@/app/admin/database/DatabaseRecoveryTools';
import { buildUnavailableAdminActionCenter } from '@/lib/adminActionCenter';
import { buildUnavailablePublicationReadiness } from '@/lib/publicationReadiness';
import type { AdminActionPriority } from '@/lib/adminActionCenter';
import type { PublicationReadinessResult, PublicationReadinessStageId } from '@/lib/publicationReadiness';

describe('role-specific admin dashboard wiring', () => {
  it('renders Auditor Action Center verification without Admin-only destinations', () => {
    const html = renderToStaticMarkup(
      <OperationalActionCenter
        result={{
          ...buildUnavailableAdminActionCenter('2026-08-01T10:00:00.000Z'),
          priorities: [{
            ...buildUnavailableAdminActionCenter('2026-08-01T10:00:00.000Z').priorities[0],
            id: 'policy-inquiries-open',
            action: { href: '/admin/inquiries', label: 'Open Policy Inquiries' },
          }],
        }}
        role="auditor"
      />,
    );
    expect(html).toContain('Verify review ledger');
    expect(html).toContain('href="/admin/review-log"');
    expect(html).not.toContain('/admin/inquiries');
    expect(html).not.toContain('/admin/cron');
  });

  it('renders unavailable funnel action as Auditor verification language', () => {
    const html = renderToStaticMarkup(
      <PublicationReadinessFunnel
        result={buildUnavailablePublicationReadiness('2026-08-01T10:00:00.000Z')}
        role="auditor"
      />,
    );
    expect(html).toContain('Verify database evidence');
    expect(html).not.toContain('Open Database Readiness');
  });

  it('renders every known Auditor priority and every measured funnel stage through verification routes', () => {
    const priorityIds = [
      'database-unavailable', 'database-degraded', 'database-metrics-unavailable',
      'webhook-metric-unavailable', 'webhook-terminal-failures', 'scan-metric-unavailable',
      'scan-never-run', 'scan-timestamp-unavailable', 'scan-stale', 'baseline-metric-unavailable',
      'public-baselines-missing', 'remediation-metric-unavailable', 'source-remediation-open',
      'inquiry-metric-unavailable', 'policy-inquiries-open',
    ];
    const priorities = priorityIds.map((id): AdminActionPriority => ({
      id, severity: 'high', severityLabel: 'High', title: id, cause: 'Evidence cause',
      timestamp: '2026-08-01T09:00:00.000Z', timestampLabel: 'Evidence timestamp',
      impact: 'Evidence impact', affectedRecords: 1, metricState: 'available',
      action: { href: '/admin/cron', label: 'Admin action' },
    }));
    const actionHtml = renderToStaticMarkup(<OperationalActionCenter result={{ checkedAt: '2026-08-01T10:00:00.000Z', checkedWindow: 'Bounded', priorities }} role="auditor" />);
    priorityIds.forEach((id) => expect(actionHtml).toContain(id));
    expect(actionHtml).not.toContain('href="/admin/cron"');
    expect(actionHtml).not.toContain('href="/admin/inquiries"');

    const stageIds: PublicationReadinessStageId[] = ['configured', 'retrieved', 'baseline-verified', 'public', 'analysed'];
    const measured: PublicationReadinessResult = {
      checkedAt: '2026-08-01T10:00:00.000Z', available: true, denominator: 5,
      latestCapture: { capturedAt: null, availability: 'measured', definition: 'Test capture', reason: null },
      consistencyWarning: null, scopeBoundary: 'Bounded',
      stages: stageIds.map((id) => ({ id, label: id, count: 5, denominator: 5, excluded: 0, availability: 'measured', definition: `${id} definition`, actionHref: '/admin/cron', actionLabel: 'Admin action', reason: null, boundary: null })),
    };
    const funnelHtml = renderToStaticMarkup(<PublicationReadinessFunnel result={measured} role="auditor" />);
    stageIds.forEach((id) => expect(funnelHtml).toContain(`${id} definition`));
    expect(funnelHtml.match(/Measured/g)?.length).toBeGreaterThanOrEqual(5);
    expect(funnelHtml).not.toContain('href="/admin/cron"');
  });

  it('does not render Database Recovery mutation forms for Auditor', () => {
    const html = renderToStaticMarkup(<DatabaseRecoveryTools role="auditor" />);
    expect(html).toContain('Auditor access is read-only');
    expect(html).not.toContain('<form');
    expect(html).not.toContain('type="password"');
  });

  it('does not render inert VPS mutation controls in the Auditor branch', () => {
    const source = readFileSync('src/app/admin/vps-services/page.tsx', 'utf8');
    expect(source).toContain('{isAdmin ? (');
    expect(source).toContain('Package deployment controls are not rendered.');
    expect(source).toContain('Smoke, backup, rollback and log-loading operations remain administrator-only.');
    expect(source).not.toContain('disabled={!isAdmin');
  });

  it('passes the authenticated metrics role through every dashboard module', () => {
    const page = readFileSync('src/app/admin/page.tsx', 'utf8');
    expect(page).toContain('<DashboardHeader role={metrics.role} />');
    expect(page).toContain('<OperationalActionCenter result={metrics.actionCenter} role={metrics.role} />');
    expect(page).toContain('<LiveStatusCards role={metrics.role} />');
    expect(page).toContain('<PublicationReadinessFunnel result={metrics.publicationReadiness} role={metrics.role} />');
  });
});
