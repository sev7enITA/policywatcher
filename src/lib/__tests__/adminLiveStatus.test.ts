import { describe, expect, it } from 'vitest';
import {
  normalizeDatabaseStatus,
  normalizeDatasetQaStatus,
  normalizeVpsStatus,
  normalizeWebhookStatus,
} from '@/lib/adminLiveStatus';

const now = '2026-07-31T10:00:00.000Z';

function dataset(status: 'pass' | 'warn' | 'fail') {
  return {
    generatedAt: now,
    summary: {
      status,
      qualityScore: 87,
      criticalIssues: 1,
      warningIssues: 2,
      infoIssues: 3,
      openIssues: 4,
      returnedIssues: 6,
      maxIssuesReturned: 250,
    },
  };
}

function webhook(overrides: Record<string, unknown> = {}) {
  return {
    generatedAt: now,
    configured: true,
    configurationIssues: [],
    metrics: { failed: 0, pending: 0, retry: 0, processing: 0 },
    ...overrides,
  };
}

describe('admin live status normalization', () => {
  it.each([
    ['pass', 'measured'],
    ['warn', 'attention'],
    ['fail', 'critical'],
  ] as const)('maps Dataset QA %s to %s', (status, expected) => {
    const card = normalizeDatasetQaStatus(dataset(status));
    expect(card.state).toBe(expected);
    expect(card.countLabel).toBe('Detected issue occurrences');
    expect(card.count).toBe(6);
    expect(card.metricAvailability).toBe('available');
  });

  it('distinguishes a measured zero from an unavailable Dataset QA count', () => {
    const empty = dataset('pass');
    empty.summary.criticalIssues = 0;
    empty.summary.warningIssues = 0;
    empty.summary.infoIssues = 0;
    expect(normalizeDatasetQaStatus(empty).count).toBe(0);
    const unavailable = normalizeDatasetQaStatus({ error: 'private detail' });
    expect(unavailable.state).toBe('unavailable');
    expect(unavailable.count).toBeNull();
    expect(unavailable.detail).not.toContain('private detail');
  });

  it('treats an intentionally absent optional agent as neutral not-enabled', () => {
    const card = normalizeVpsStatus({
      generatedAt: now,
      services: [
        { id: 'renderer', status: 'online', checkedAt: now },
        { id: 'agent', status: 'misconfigured', checkedAt: now },
      ],
      appRuntime: { agentUrlConfigured: false, agentSecretConfigured: false },
    });
    expect(card.state).toBe('not-enabled');
    expect(card.metricAvailability).toBe('not-enabled');
    expect(card.count).toBe(0);
    expect(card.countLabel).toBe('Services requiring attention');
  });

  it.each([
    ['offline', 'critical'],
    ['degraded', 'attention'],
    ['misconfigured', 'attention'],
  ] as const)('maps renderer %s to %s', (status, expected) => {
    const card = normalizeVpsStatus({
      generatedAt: now,
      services: [
        { id: 'renderer', status, checkedAt: now },
        { id: 'agent', status: 'online', checkedAt: now },
      ],
      appRuntime: { agentUrlConfigured: true, agentSecretConfigured: true },
    });
    expect(card.state).toBe(expected);
    expect(card.count).toBe(1);
  });

  it('returns attention for partial optional-agent configuration', () => {
    const card = normalizeVpsStatus({
      generatedAt: now,
      services: [
        { id: 'renderer', status: 'online', checkedAt: now },
        { id: 'agent', status: 'misconfigured', checkedAt: now },
      ],
      appRuntime: { agentUrlConfigured: true, agentSecretConfigured: false },
    });
    expect(card.state).toBe('attention');
    expect(card.count).toBe(1);
  });

  it('maps ready and degraded database reports with exact schema-gap counts', () => {
    const ready = normalizeDatabaseStatus({ status: 'ready', checkedAt: now, schema: { missingTables: [], missingMigrations: [] } });
    const degraded = normalizeDatabaseStatus({ status: 'degraded', checkedAt: now, schema: { missingTables: ['Policy'], missingMigrations: ['migration'] } });
    expect(ready).toMatchObject({ state: 'measured', count: 0, countLabel: 'Schema gaps' });
    expect(degraded).toMatchObject({ state: 'attention', count: 2, countLabel: 'Schema gaps' });
  });

  it('keeps database counts null when readiness is unavailable', () => {
    const card = normalizeDatabaseStatus({ status: 'unavailable', checkedAt: now, schema: { missingTables: ['all'], missingMigrations: ['all'] } });
    expect(card.state).toBe('unavailable');
    expect(card.metricAvailability).toBe('unavailable');
    expect(card.count).toBeNull();
  });

  it('uses webhook configuration, failure, scheduled and processing focus order', () => {
    const configuration = normalizeWebhookStatus(webhook({ configured: false, configurationIssues: [{ code: 'missing' }], metrics: { failed: 4, pending: 3, retry: 2, processing: 1 } }));
    const failed = normalizeWebhookStatus(webhook({ metrics: { failed: 4, pending: 3, retry: 2, processing: 1 } }));
    const scheduled = normalizeWebhookStatus(webhook({ metrics: { failed: 0, pending: 3, retry: 2, processing: 1 } }));
    const processing = normalizeWebhookStatus(webhook({ metrics: { failed: 0, pending: 0, retry: 0, processing: 1 } }));
    expect(configuration.stateLabel).toBe('Configuration attention');
    expect(failed).toMatchObject({ state: 'critical', count: 4 });
    expect(scheduled).toMatchObject({ state: 'attention', count: 6 });
    expect(processing).toMatchObject({ state: 'attention', count: 1 });
  });

  it('keeps a valid webhook zero measured without making an assurance claim', () => {
    const card = normalizeWebhookStatus(webhook());
    expect(card).toMatchObject({ state: 'measured', count: 0, metricAvailability: 'available' });
    expect(card.countLabel).toBe('Records requiring action');
    expect(card.detail).toContain('No exception in the returned ledger');
  });
});
