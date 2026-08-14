export type AdminLiveStatusState = 'measured' | 'attention' | 'critical' | 'not-enabled' | 'unavailable';
export type AdminLiveMetricAvailability = 'available' | 'unavailable' | 'not-enabled';

export interface AdminLiveStatusCard {
  id: 'dataset-qa' | 'database' | 'webhook' | 'vps';
  label: string;
  scope: string;
  state: AdminLiveStatusState;
  stateLabel: string;
  checkedAt: string | null;
  metricAvailability: AdminLiveMetricAvailability;
  count: number | null;
  countLabel: string;
  detail: string;
  action: { href: string; label: string };
}

interface DatasetQualityPayload {
  generatedAt: string;
  summary: {
    status: 'pass' | 'warn' | 'fail';
    qualityScore: number;
    criticalIssues: number;
    warningIssues: number;
    infoIssues: number;
    openIssues: number;
    returnedIssues: number;
    maxIssuesReturned: number;
  };
}

interface VpsServicePayload {
  id: 'renderer' | 'agent';
  status: 'online' | 'offline' | 'misconfigured' | 'degraded';
  checkedAt: string;
}

interface VpsPayload {
  generatedAt: string;
  services: VpsServicePayload[];
  appRuntime: {
    agentUrlConfigured: boolean;
    agentSecretConfigured: boolean;
  };
}

interface DatabaseReadinessPayload {
  status: 'ready' | 'degraded' | 'unavailable';
  checkedAt: string;
  schema: {
    missingTables: string[];
    missingMigrations: string[];
  };
}

interface WebhookPayload {
  generatedAt: string;
  configured: boolean;
  configurationIssues: unknown[];
  metrics: {
    pending: number;
    processing: number;
    retry: number;
    failed: number;
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isFiniteCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function isTimestamp(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && !Number.isNaN(Date.parse(value));
}

function unavailableCard(
  id: AdminLiveStatusCard['id'],
  label: string,
  scope: string,
  countLabel: string,
  action: AdminLiveStatusCard['action'],
): AdminLiveStatusCard {
  return {
    id,
    label,
    scope,
    state: 'unavailable',
    stateLabel: 'Metric unavailable',
    checkedAt: null,
    metricAvailability: 'unavailable',
    count: null,
    countLabel,
    detail: 'The protected endpoint did not return a valid bounded status payload.',
    action,
  };
}

export function normalizeDatasetQaStatus(payload: unknown): AdminLiveStatusCard {
  const fallback = unavailableCard(
    'dataset-qa',
    'Dataset QA',
    'Quality-gate evaluation',
    'Detected issue occurrences',
    { href: '/admin/dataset-quality', label: 'Open Dataset QA' },
  );
  if (!isRecord(payload) || !isRecord(payload.summary) || !isTimestamp(payload.generatedAt)) return fallback;
  const summary = payload.summary;
  if (
    !['pass', 'warn', 'fail'].includes(String(summary.status))
    || !isFiniteCount(summary.criticalIssues)
    || !isFiniteCount(summary.warningIssues)
    || !isFiniteCount(summary.infoIssues)
    || !isFiniteCount(summary.openIssues)
    || !isFiniteCount(summary.returnedIssues)
    || !isFiniteCount(summary.maxIssuesReturned)
    || typeof summary.qualityScore !== 'number'
    || !Number.isFinite(summary.qualityScore)
  ) return fallback;

  const data = payload as unknown as DatasetQualityPayload;
  const occurrenceCount = data.summary.criticalIssues + data.summary.warningIssues + data.summary.infoIssues;
  const capped = data.summary.returnedIssues >= data.summary.maxIssuesReturned;
  const state = data.summary.status === 'fail' ? 'critical' : data.summary.status === 'warn' ? 'attention' : 'measured';
  return {
    ...fallback,
    state,
    stateLabel: state === 'critical' ? 'Evaluation failed' : state === 'attention' ? 'Review required' : 'Measured',
    checkedAt: data.generatedAt,
    metricAvailability: 'available',
    count: occurrenceCount,
    detail: `Quality score ${data.summary.qualityScore}; ${data.summary.openIssues} open issue${data.summary.openIssues === 1 ? '' : 's'} in the returned${capped ? ', capped' : ''} evaluation window.${state === 'measured' ? ' No exception in this evaluation.' : ''}`,
  };
}

function latestTimestamp(values: Array<string | null | undefined>): string | null {
  const valid = values.filter(isTimestamp).sort((a, b) => Date.parse(b) - Date.parse(a));
  return valid[0] || null;
}

export function normalizeVpsStatus(payload: unknown): AdminLiveStatusCard {
  const fallback = unavailableCard(
    'vps',
    'VPS services',
    'Renderer and optional operations agent',
    'Services requiring attention',
    { href: '/admin/vps-services', label: 'Open VPS services' },
  );
  if (!isRecord(payload) || !Array.isArray(payload.services) || !isRecord(payload.appRuntime)) return fallback;
  const services = payload.services;
  if (!services.every((service) => isRecord(service)
    && ['renderer', 'agent'].includes(String(service.id))
    && ['online', 'offline', 'misconfigured', 'degraded'].includes(String(service.status)))) return fallback;
  if (typeof payload.appRuntime.agentUrlConfigured !== 'boolean' || typeof payload.appRuntime.agentSecretConfigured !== 'boolean') return fallback;

  const data = payload as unknown as VpsPayload;
  const renderer = data.services.find((service) => service.id === 'renderer');
  const agent = data.services.find((service) => service.id === 'agent');
  if (!renderer || !agent) return fallback;

  const agentNotEnabled = !data.appRuntime.agentUrlConfigured && !data.appRuntime.agentSecretConfigured;
  const partialAgentConfiguration = data.appRuntime.agentUrlConfigured !== data.appRuntime.agentSecretConfigured;
  const relevant = agentNotEnabled ? [renderer] : [renderer, agent];
  const attentionCount = relevant.filter((service) => service.status !== 'online').length;
  let state: AdminLiveStatusState = 'measured';
  let stateLabel = 'Measured';
  if (relevant.some((service) => service.status === 'offline')) {
    state = 'critical';
    stateLabel = 'Service offline';
  } else if (partialAgentConfiguration || relevant.some((service) => service.status === 'degraded' || service.status === 'misconfigured')) {
    state = 'attention';
    stateLabel = 'Configuration or service attention';
  } else if (agentNotEnabled && renderer.status === 'online') {
    state = 'not-enabled';
    stateLabel = 'Agent not enabled';
  }

  return {
    ...fallback,
    state,
    stateLabel,
    checkedAt: latestTimestamp([...data.services.map((service) => service.checkedAt), data.generatedAt]),
    metricAvailability: state === 'not-enabled' ? 'not-enabled' : 'available',
    count: attentionCount,
    detail: agentNotEnabled
      ? 'Renderer status is measured; the optional operations agent is intentionally not enabled.'
      : partialAgentConfiguration
        ? 'The optional operations agent has partial configuration and requires review.'
        : attentionCount > 0
          ? `${attentionCount} configured service${attentionCount === 1 ? '' : 's'} returned a non-online state.`
          : 'Renderer and configured operations agent returned online with no service exception.',
  };
}

export function normalizeDatabaseStatus(payload: unknown): AdminLiveStatusCard {
  const fallback = unavailableCard(
    'database',
    'Database',
    'Integrity, schema and migrations',
    'Schema gaps',
    { href: '/admin/database', label: 'Open Database Readiness' },
  );
  if (!isRecord(payload) || !['ready', 'degraded', 'unavailable'].includes(String(payload.status)) || !isTimestamp(payload.checkedAt) || !isRecord(payload.schema)) return fallback;
  if (!Array.isArray(payload.schema.missingTables) || !Array.isArray(payload.schema.missingMigrations)) return fallback;
  const data = payload as unknown as DatabaseReadinessPayload;
  if (data.status === 'unavailable') {
    return {
      ...fallback,
      checkedAt: data.checkedAt,
      detail: 'Database readiness could not establish trustworthy integrity or schema counts.',
    };
  }
  const gapCount = data.schema.missingTables.length + data.schema.missingMigrations.length;
  return {
    ...fallback,
    state: data.status === 'degraded' ? 'attention' : 'measured',
    stateLabel: data.status === 'degraded' ? 'Readiness degraded' : 'Measured',
    checkedAt: data.checkedAt,
    metricAvailability: 'available',
    count: gapCount,
    detail: data.status === 'ready'
      ? 'Readiness checks returned no exception in the current integrity, schema and migration evaluation.'
      : `${gapCount} expected table or migration gap${gapCount === 1 ? '' : 's'} returned; other readiness checks may also require review.`,
  };
}

export function normalizeWebhookStatus(payload: unknown): AdminLiveStatusCard {
  const fallback = unavailableCard(
    'webhook',
    'Webhook delivery',
    'Configuration and outbox ledger',
    'Records requiring action',
    { href: '/admin/webhook-delivery', label: 'Open Webhook Delivery' },
  );
  if (!isRecord(payload) || !isTimestamp(payload.generatedAt) || typeof payload.configured !== 'boolean' || !Array.isArray(payload.configurationIssues) || !isRecord(payload.metrics)) return fallback;
  const metrics = payload.metrics;
  if (!isFiniteCount(metrics.failed) || !isFiniteCount(metrics.pending) || !isFiniteCount(metrics.retry) || !isFiniteCount(metrics.processing)) return fallback;
  const data = payload as unknown as WebhookPayload;
  const configurationAttention = !data.configured || data.configurationIssues.length > 0;
  const scheduled = data.metrics.pending + data.metrics.retry;
  const recordsRequiringAction = data.metrics.failed > 0
    ? data.metrics.failed
    : scheduled + data.metrics.processing;
  let state: AdminLiveStatusState = 'measured';
  let stateLabel = 'Measured';
  let detail = 'No exception in the returned ledger.';
  if (configurationAttention) {
    state = 'attention';
    stateLabel = 'Configuration attention';
    detail = `${data.configurationIssues.length} configuration exception${data.configurationIssues.length === 1 ? '' : 's'} returned; review deployment configuration before delivery work.`;
  } else if (data.metrics.failed > 0) {
    state = 'critical';
    stateLabel = 'Terminal failures';
    detail = `${data.metrics.failed} terminal outbox failure${data.metrics.failed === 1 ? '' : 's'} returned.`;
  } else if (scheduled > 0) {
    state = 'attention';
    stateLabel = 'Scheduled work';
    detail = `${scheduled} pending or retry record${scheduled === 1 ? '' : 's'} returned.`;
  } else if (data.metrics.processing > 0) {
    state = 'attention';
    stateLabel = 'Processing';
    detail = `${data.metrics.processing} record${data.metrics.processing === 1 ? '' : 's'} currently processing.`;
  }
  return {
    ...fallback,
    state,
    stateLabel,
    checkedAt: data.generatedAt,
    metricAvailability: 'available',
    count: recordsRequiringAction,
    detail,
  };
}

export const ADMIN_LIVE_STATUS_ENDPOINTS = [
  { id: 'dataset-qa', endpoint: '/api/admin/dataset-quality', normalize: normalizeDatasetQaStatus },
  { id: 'database', endpoint: '/api/admin/database-readiness', normalize: normalizeDatabaseStatus },
  { id: 'webhook', endpoint: '/api/admin/webhook-delivery', normalize: normalizeWebhookStatus },
  { id: 'vps', endpoint: '/api/admin/vps-services', normalize: normalizeVpsStatus },
] as const;

export function buildUnavailableLiveStatusCards(): AdminLiveStatusCard[] {
  return ADMIN_LIVE_STATUS_ENDPOINTS.map(({ normalize }) => normalize(null));
}
