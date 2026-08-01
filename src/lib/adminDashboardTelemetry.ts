import type { AdminActionCenterResult, AdminActionSeverity } from '@/lib/adminActionCenter';

export const ADMIN_DASHBOARD_TELEMETRY_RETENTION_DAYS = 90;
export const ADMIN_DASHBOARD_TELEMETRY_WINDOW_DAYS = 30;
export const ADMIN_DASHBOARD_BASELINE_MIN_SAMPLE = 10;
export const ADMIN_DASHBOARD_CLEANUP_BATCH = 250;

export const ADMIN_DASHBOARD_EVENT_TYPES = [
  'first-action-elapsed',
  'action-center-cta-attempt',
  'canonical-route-arrival',
  'mobile-priority-distance',
] as const;

export type AdminDashboardEventType = (typeof ADMIN_DASHBOARD_EVENT_TYPES)[number];
export type AdminDashboardViewportClass = 'mobile' | 'tablet' | 'desktop';
export type AdminDashboardMeasurementStatus =
  | 'measurement-enabled'
  | 'baseline-pending'
  | 'measured'
  | 'unavailable';

const PRIORITY_DESTINATIONS: Record<string, readonly string[]> = {
  'database-unavailable': ['/admin/database'],
  'database-degraded': ['/admin/database'],
  'database-metrics-unavailable': ['/admin/database'],
  'webhook-metric-unavailable': ['/admin/webhook-delivery'],
  'webhook-terminal-failures': ['/admin/webhook-delivery'],
  'scan-metric-unavailable': ['/admin/cron', '/admin/source-reliability'],
  'scan-never-run': ['/admin/cron', '/admin/source-reliability'],
  'scan-timestamp-unavailable': ['/admin/cron', '/admin/source-reliability'],
  'scan-stale': ['/admin/cron', '/admin/source-reliability'],
  'baseline-metric-unavailable': ['/admin/source-reliability'],
  'public-baselines-missing': ['/admin/source-reliability'],
  'remediation-metric-unavailable': ['/admin/source-reliability'],
  'source-remediation-open': ['/admin/source-reliability'],
  'inquiry-metric-unavailable': ['/admin/inquiries', '/admin/review-log'],
  'policy-inquiries-open': ['/admin/inquiries', '/admin/review-log'],
};

const ALLOWED_INPUT_KEYS = new Set([
  'eventType',
  'visitId',
  'priorityId',
  'destination',
  'numericValue',
  'viewportClass',
]);
const VIEWPORT_CLASSES = new Set<AdminDashboardViewportClass>(['mobile', 'tablet', 'desktop']);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface AdminDashboardTelemetryInput {
  eventType: AdminDashboardEventType;
  visitId: string;
  priorityId: string | null;
  destination: string | null;
  numericValue: number | null;
  viewportClass: AdminDashboardViewportClass;
}

export interface AdminDashboardTelemetryRow extends AdminDashboardTelemetryInput {
  createdAt: Date | string;
}

export interface AdminDashboardObservedMetric {
  status: AdminDashboardMeasurementStatus;
  sample: number | null;
  windowDays: number | null;
  value: number | null;
  unit: 'milliseconds' | 'percent' | 'pixels';
}

export const ADMIN_DASHBOARD_TELEMETRY_PRIVACY_BOUNDARY = 'Aggregate protected-dashboard events use a random per-visit identifier, server-derived role and allowlisted fields. No IP address, user agent, referrer, email, username, account identifier, query string, free text or arbitrary metadata is stored. Retention is 90 days.';
export const ADMIN_DASHBOARD_TELEMETRY_QUERY_BOUNDARY = 'Aggregates are limited to the latest 5,000 eligible events in the trailing window.';

export interface AdminDashboardTelemetryAggregate {
  checkedAt: string;
  windowStartedAt: string;
  minimumSample: number;
  firstActionElapsed: AdminDashboardObservedMetric;
  confirmedActionCenterRoutes: AdminDashboardObservedMetric;
  mobilePriorityDistance: AdminDashboardObservedMetric;
  privacyBoundary: string;
}

export interface AdminDashboardStateMetrics {
  checkedAt: string;
  prioritiesWithoutTimestamp: number;
  prioritiesBySeverity: Record<AdminActionSeverity, number>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isBoundedInteger(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value)
    && value >= min && value <= max;
}

export function isCanonicalPriorityDestination(priorityId: string, destination: string): boolean {
  return Boolean(PRIORITY_DESTINATIONS[priorityId]?.includes(destination));
}

export function telemetryEventKey(input: AdminDashboardTelemetryInput): string {
  return [input.eventType, input.priorityId || '-', input.destination || '-'].join(':');
}

export function parseAdminDashboardTelemetryInput(value: unknown): AdminDashboardTelemetryInput | null {
  if (!isRecord(value)) return null;
  if (Object.keys(value).some((key) => !ALLOWED_INPUT_KEYS.has(key))) return null;
  if (!ADMIN_DASHBOARD_EVENT_TYPES.includes(value.eventType as AdminDashboardEventType)) return null;
  if (typeof value.visitId !== 'string' || !UUID_PATTERN.test(value.visitId)) return null;
  if (!VIEWPORT_CLASSES.has(value.viewportClass as AdminDashboardViewportClass)) return null;

  const eventType = value.eventType as AdminDashboardEventType;
  const viewportClass = value.viewportClass as AdminDashboardViewportClass;
  if (eventType === 'first-action-elapsed' || eventType === 'mobile-priority-distance') {
    const maximum = eventType === 'first-action-elapsed' ? 3_600_000 : 10_000;
    if (!isBoundedInteger(value.numericValue, 0, maximum)) return null;
    if (value.priorityId !== undefined || value.destination !== undefined) return null;
    if (eventType === 'mobile-priority-distance' && viewportClass !== 'mobile') return null;
    return {
      eventType,
      visitId: value.visitId,
      priorityId: null,
      destination: null,
      numericValue: value.numericValue,
      viewportClass,
    };
  }

  if (typeof value.priorityId !== 'string' || typeof value.destination !== 'string') return null;
  if (value.numericValue !== undefined) return null;
  if (!isCanonicalPriorityDestination(value.priorityId, value.destination)) return null;
  return {
    eventType,
    visitId: value.visitId,
    priorityId: value.priorityId,
    destination: value.destination,
    numericValue: null,
    viewportClass,
  };
}

function observedMetric(
  sample: number,
  value: number | null,
  unit: AdminDashboardObservedMetric['unit'],
): AdminDashboardObservedMetric {
  return {
    status: sample === 0
      ? 'measurement-enabled'
      : sample < ADMIN_DASHBOARD_BASELINE_MIN_SAMPLE
        ? 'baseline-pending'
        : 'measured',
    sample,
    windowDays: ADMIN_DASHBOARD_TELEMETRY_WINDOW_DAYS,
    value: sample >= ADMIN_DASHBOARD_BASELINE_MIN_SAMPLE ? value : null,
    unit,
  };
}

export function buildUnavailableDashboardTelemetry(checkedAt = new Date().toISOString()): AdminDashboardTelemetryAggregate {
  const unavailable = (unit: AdminDashboardObservedMetric['unit']): AdminDashboardObservedMetric => ({
    status: 'unavailable', sample: null, windowDays: null, value: null, unit,
  });
  return {
    checkedAt,
    windowStartedAt: new Date(new Date(checkedAt).getTime() - ADMIN_DASHBOARD_TELEMETRY_WINDOW_DAYS * 86_400_000).toISOString(),
    minimumSample: ADMIN_DASHBOARD_BASELINE_MIN_SAMPLE,
    firstActionElapsed: unavailable('milliseconds'),
    confirmedActionCenterRoutes: unavailable('percent'),
    mobilePriorityDistance: unavailable('pixels'),
    privacyBoundary: `${ADMIN_DASHBOARD_TELEMETRY_PRIVACY_BOUNDARY} ${ADMIN_DASHBOARD_TELEMETRY_QUERY_BOUNDARY} Dashboard measurement is currently unavailable; no sample, window or zero value is inferred.`,
  };
}

export function aggregateAdminDashboardTelemetry(
  rows: readonly AdminDashboardTelemetryRow[],
  checkedAt = new Date().toISOString(),
): AdminDashboardTelemetryAggregate {
  const windowStartedAt = new Date(new Date(checkedAt).getTime() - ADMIN_DASHBOARD_TELEMETRY_WINDOW_DAYS * 86_400_000);
  const inWindow = rows.filter((row) => {
    const createdAt = new Date(row.createdAt);
    return !Number.isNaN(createdAt.getTime()) && createdAt >= windowStartedAt && createdAt <= new Date(checkedAt);
  });
  const firstActions = inWindow.filter((row) => row.eventType === 'first-action-elapsed' && row.numericValue !== null);
  const distances = inWindow.filter((row) => row.eventType === 'mobile-priority-distance' && row.numericValue !== null);
  const attempts = inWindow.filter((row) => row.eventType === 'action-center-cta-attempt');
  const arrivals = new Set(inWindow
    .filter((row) => row.eventType === 'canonical-route-arrival')
    .map((row) => `${row.visitId}:${row.priorityId}:${row.destination}`));

  const average = (items: AdminDashboardTelemetryRow[]) => items.length
    ? Math.round(items.reduce((sum, row) => sum + (row.numericValue || 0), 0) / items.length)
    : null;
  const confirmed = attempts.filter((row) => arrivals.has(`${row.visitId}:${row.priorityId}:${row.destination}`)).length;
  const confirmationRate = attempts.length ? Math.round((confirmed / attempts.length) * 1000) / 10 : null;

  return {
    checkedAt,
    windowStartedAt: windowStartedAt.toISOString(),
    minimumSample: ADMIN_DASHBOARD_BASELINE_MIN_SAMPLE,
    firstActionElapsed: observedMetric(firstActions.length, average(firstActions), 'milliseconds'),
    confirmedActionCenterRoutes: observedMetric(attempts.length, confirmationRate, 'percent'),
    mobilePriorityDistance: observedMetric(distances.length, average(distances), 'pixels'),
    privacyBoundary: `${ADMIN_DASHBOARD_TELEMETRY_PRIVACY_BOUNDARY} ${ADMIN_DASHBOARD_TELEMETRY_QUERY_BOUNDARY}`,
  };
}

export function deriveDashboardStateMetrics(result: AdminActionCenterResult): AdminDashboardStateMetrics {
  const prioritiesBySeverity: Record<AdminActionSeverity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    unavailable: 0,
  };
  for (const priority of result.priorities) prioritiesBySeverity[priority.severity] += 1;
  return {
    checkedAt: result.checkedAt,
    prioritiesWithoutTimestamp: result.priorities.filter((priority) => !priority.timestamp).length,
    prioritiesBySeverity,
  };
}
