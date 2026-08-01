import { describe, expect, it } from 'vitest';
import {
  ADMIN_ACTION_CENTER_LIMIT,
  buildAdminActionCenter,
  buildUnavailableAdminActionCenter,
  type AdminActionCenterInput,
} from '../adminActionCenter';

const CHECKED_AT = '2026-07-31T12:00:00.000Z';

function healthyInput(overrides: Partial<AdminActionCenterInput> = {}): AdminActionCenterInput {
  return {
    checkedAt: CHECKED_AT,
    database: {
      available: true,
      status: 'ready',
      checkedAt: CHECKED_AT,
      missingTableCount: 0,
      missingMigrationCount: 0,
      diagnosticCode: null,
    },
    scan: { available: true, latestStartedAt: '2026-07-31T06:00:00.000Z' },
    baselines: {
      available: true,
      configuredPolicies: 12,
      verifiedPublicPolicies: 12,
      observedAt: CHECKED_AT,
    },
    remediation: {
      available: true,
      openCount: 0,
      latestDetectedAt: null,
      latestReasonCode: null,
    },
    webhook: {
      available: true,
      terminalFailureCount: 0,
      latestFailureAt: null,
      latestErrorCode: null,
    },
    inquiries: { available: true, openCount: 0, latestCreatedAt: null },
    ...overrides,
  };
}

describe('admin operational action center', () => {
  it('returns a bounded deterministic ranking of at most five priorities', () => {
    const result = buildAdminActionCenter(healthyInput({
      database: {
        available: true,
        status: 'degraded',
        checkedAt: CHECKED_AT,
        missingTableCount: 1,
        missingMigrationCount: 1,
        diagnosticCode: null,
      },
      scan: { available: true, latestStartedAt: null },
      baselines: { available: true, configuredPolicies: 12, verifiedPublicPolicies: 2, observedAt: CHECKED_AT },
      remediation: { available: true, openCount: 3, latestDetectedAt: CHECKED_AT, latestReasonCode: 'robots_blocked' },
      webhook: { available: true, terminalFailureCount: 2, latestFailureAt: CHECKED_AT, latestErrorCode: 'HTTP_410' },
      inquiries: { available: true, openCount: 4, latestCreatedAt: CHECKED_AT },
    }));

    expect(result.priorities).toHaveLength(ADMIN_ACTION_CENTER_LIMIT);
    expect(result.priorities.map((item) => item.id)).toEqual([
      'database-degraded',
      'webhook-terminal-failures',
      'scan-never-run',
      'public-baselines-missing',
      'source-remediation-open',
    ]);
    expect(buildAdminActionCenter(healthyInput({
      database: { available: true, status: 'degraded', checkedAt: CHECKED_AT, missingTableCount: 1, missingMigrationCount: 1, diagnosticCode: null },
      scan: { available: true, latestStartedAt: null },
      baselines: { available: true, configuredPolicies: 12, verifiedPublicPolicies: 2, observedAt: CHECKED_AT },
      remediation: { available: true, openCount: 3, latestDetectedAt: CHECKED_AT, latestReasonCode: 'robots_blocked' },
      webhook: { available: true, terminalFailureCount: 2, latestFailureAt: CHECKED_AT, latestErrorCode: 'HTTP_410' },
      inquiries: { available: true, openCount: 4, latestCreatedAt: CHECKED_AT },
    }))).toEqual(result);
  });

  it('emits unavailable priorities instead of converting missing metrics to zero', () => {
    const result = buildAdminActionCenter(healthyInput({
      webhook: { available: false, terminalFailureCount: null, latestFailureAt: null, latestErrorCode: null },
    }));

    expect(result.priorities).toEqual([
      expect.objectContaining({
        id: 'webhook-metric-unavailable',
        severityLabel: 'Unavailable',
        affectedRecords: null,
        metricState: 'unavailable',
        timestamp: null,
      }),
    ]);
  });

  it('never interprets a scan that has never run as a healthy state', () => {
    const result = buildAdminActionCenter(healthyInput({
      scan: { available: true, latestStartedAt: null },
    }));

    expect(result.priorities[0]).toMatchObject({
      id: 'scan-never-run',
      timestamp: null,
      timestampLabel: 'Timestamp unavailable',
    });
  });

  it('marks a persisted scan stale only after the documented threshold', () => {
    const stale = buildAdminActionCenter(healthyInput({
      scan: { available: true, latestStartedAt: '2026-07-30T05:59:59.000Z' },
    }));
    const current = buildAdminActionCenter(healthyInput({
      scan: { available: true, latestStartedAt: '2026-07-30T06:00:00.000Z' },
    }));

    expect(stale.priorities[0]?.id).toBe('scan-stale');
    expect(current.priorities).toHaveLength(0);
  });

  it('returns a bounded neutral result only when all supplied metrics are available and clear', () => {
    const result = buildAdminActionCenter(healthyInput());

    expect(result.priorities).toEqual([]);
    expect(result.checkedWindow).toContain('30 hours');
  });

  it('normalizes timestamps and exposes exactly one action destination per priority', () => {
    const result = buildAdminActionCenter(healthyInput({
      inquiries: { available: true, openCount: 1, latestCreatedAt: '2026-07-31T08:00:00+02:00' },
    }));

    expect(result.priorities[0].timestamp).toBe('2026-07-31T06:00:00.000Z');
    expect(Object.keys(result.priorities[0].action).sort()).toEqual(['href', 'label']);
    expect(result.priorities[0].action.href).toBe('/admin/inquiries');
  });

  it('returns a sanitized database priority when the core query fails', () => {
    const result = buildUnavailableAdminActionCenter(CHECKED_AT);

    expect(result.priorities).toHaveLength(1);
    expect(result.priorities[0]).toMatchObject({
      id: 'database-metrics-unavailable',
      metricState: 'unavailable',
      action: { href: '/admin/database' },
    });
    expect(JSON.stringify(result)).not.toContain('/home/');
  });
});
