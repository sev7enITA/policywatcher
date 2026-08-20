import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { OperationalActionCenter } from '@/app/admin/OperationalActionCenter';
import { PublicationReadinessFunnel } from '@/app/admin/PublicationReadinessFunnel';
import type { AdminActionPriority } from '@/lib/adminActionCenter';
import type { PublicationReadinessResult, PublicationReadinessStageId } from '@/lib/publicationReadiness';

describe('rendered Auditor dashboard presentation', () => {
  it('renders every known priority and measured funnel stage through read-only verification routes', () => {
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
    const actionHtml = renderToStaticMarkup(createElement(OperationalActionCenter, {
      result: { checkedAt: '2026-08-01T10:00:00.000Z', checkedWindow: 'Bounded', priorities },
      role: 'auditor',
    }));
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
    const funnelHtml = renderToStaticMarkup(createElement(PublicationReadinessFunnel, { result: measured, role: 'auditor' }));
    stageIds.forEach((id) => expect(funnelHtml).toContain(`${id} definition`));
    expect(funnelHtml.match(/Measured/g)?.length).toBeGreaterThanOrEqual(5);
    expect(funnelHtml).not.toContain('href="/admin/cron"');
  });
});
