import { describe, expect, it } from 'vitest';
import {
  ADMIN_DASHBOARD_BASELINE_MIN_SAMPLE,
  aggregateAdminDashboardTelemetry,
  buildUnavailableDashboardTelemetry,
  deriveDashboardStateMetrics,
  isCanonicalPriorityDestination,
  parseAdminDashboardTelemetryInput,
} from '@/lib/adminDashboardTelemetry';

const visitId = 'e0d8d3af-37f2-4f3f-8d65-635e505bc047';
const checkedAt = '2026-08-01T12:00:00.000Z';

describe('admin dashboard telemetry contract', () => {
  it('accepts only allowlisted bounded event shapes and canonical destinations', () => {
    expect(parseAdminDashboardTelemetryInput({
      eventType: 'first-action-elapsed', visitId, numericValue: 1200, viewportClass: 'desktop',
    })).toMatchObject({ priorityId: null, destination: null, numericValue: 1200 });
    expect(parseAdminDashboardTelemetryInput({
      eventType: 'action-center-cta-attempt', visitId, priorityId: 'scan-stale', destination: '/admin/cron', viewportClass: 'mobile',
    })).not.toBeNull();
    expect(isCanonicalPriorityDestination('scan-stale', '/admin/source-reliability')).toBe(true);
    expect(isCanonicalPriorityDestination('scan-stale', '/admin/inquiries')).toBe(false);
  });

  it('rejects privacy fields, arbitrary metadata, invalid IDs and numeric bounds', () => {
    for (const field of ['ip', 'ipAddress', 'userAgent', 'referrer', 'email', 'username', 'query', 'metadata', 'freeText']) {
      expect(parseAdminDashboardTelemetryInput({
        eventType: 'first-action-elapsed', visitId, numericValue: 50, viewportClass: 'desktop', [field]: 'private',
      })).toBeNull();
    }
    expect(parseAdminDashboardTelemetryInput({ eventType: 'first-action-elapsed', visitId: 'account-1', numericValue: 50, viewportClass: 'desktop' })).toBeNull();
    expect(parseAdminDashboardTelemetryInput({ eventType: 'first-action-elapsed', visitId, numericValue: 3_600_001, viewportClass: 'desktop' })).toBeNull();
    expect(parseAdminDashboardTelemetryInput({ eventType: 'mobile-priority-distance', visitId, numericValue: 100, viewportClass: 'desktop' })).toBeNull();
  });

  it('keeps zero sample enabled, withholds sub-threshold values and exposes bounded observations at the minimum sample', () => {
    const empty = aggregateAdminDashboardTelemetry([], checkedAt);
    expect(empty.firstActionElapsed).toMatchObject({ status: 'measurement-enabled', sample: 0, value: null });

    const subThreshold = aggregateAdminDashboardTelemetry([{
      eventType: 'first-action-elapsed', visitId, priorityId: null, destination: null,
      numericValue: 800, viewportClass: 'desktop', createdAt: checkedAt,
    }], checkedAt);
    expect(subThreshold.firstActionElapsed).toMatchObject({ status: 'baseline-pending', sample: 1, value: null });

    const rows = Array.from({ length: ADMIN_DASHBOARD_BASELINE_MIN_SAMPLE }, (_, index) => ({
      eventType: 'first-action-elapsed' as const,
      visitId: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
      priorityId: null,
      destination: null,
      numericValue: 1000 + index * 100,
      viewportClass: 'desktop' as const,
      createdAt: checkedAt,
    }));
    expect(aggregateAdminDashboardTelemetry(rows, checkedAt).firstActionElapsed).toMatchObject({
      status: 'measured', sample: 10, value: 1450,
    });
  });

  it('keeps unavailable sample and window unknown while preserving the full privacy and retention boundary', () => {
    const unavailable = buildUnavailableDashboardTelemetry(checkedAt);
    expect(unavailable.firstActionElapsed).toMatchObject({ status: 'unavailable', sample: null, windowDays: null, value: null });
    expect(unavailable.privacyBoundary).toContain('random per-visit identifier');
    expect(unavailable.privacyBoundary).toContain('No IP address, user agent, referrer, email, username, account identifier, query string, free text or arbitrary metadata');
    expect(unavailable.privacyBoundary).toContain('Retention is 90 days');
    expect(unavailable.privacyBoundary).toContain('latest 5,000');
  });

  it('matches confirmations to the same visit, priority and destination', () => {
    const rows = Array.from({ length: 10 }, (_, index) => {
      const id = `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`;
      return [{
        eventType: 'action-center-cta-attempt' as const, visitId: id, priorityId: 'scan-stale', destination: '/admin/cron', numericValue: null,
        viewportClass: 'desktop' as const, createdAt: checkedAt,
      }, ...(index < 8 ? [{
        eventType: 'canonical-route-arrival' as const, visitId: id, priorityId: 'scan-stale', destination: '/admin/cron', numericValue: null,
        viewportClass: 'desktop' as const, createdAt: checkedAt,
      }] : [])];
    }).flat();
    expect(aggregateAdminDashboardTelemetry(rows, checkedAt).confirmedActionCenterRoutes).toMatchObject({
      status: 'measured', sample: 10, value: 80,
    });
  });

  it('derives timestamp and severity counts from the current Action Center result', () => {
    const result = deriveDashboardStateMetrics({
      checkedAt,
      checkedWindow: 'bounded',
      priorities: [
        { id: 'a', severity: 'critical', severityLabel: 'Critical', title: 'A', cause: 'A', timestamp: null, timestampLabel: 'Unavailable', impact: 'A', affectedRecords: null, metricState: 'unavailable', action: { label: 'A', href: '/admin/database' } },
        { id: 'b', severity: 'high', severityLabel: 'High', title: 'B', cause: 'B', timestamp: checkedAt, timestampLabel: 'Evidence', impact: 'B', affectedRecords: 1, metricState: 'available', action: { label: 'B', href: '/admin/cron' } },
      ],
    });
    expect(result.prioritiesWithoutTimestamp).toBe(1);
    expect(result.prioritiesBySeverity).toEqual({ critical: 1, high: 1, medium: 0, unavailable: 0 });
  });
});
