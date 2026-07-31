'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  CheckCircle2,
  CircleDot,
  Clock3,
  KeyRound,
  ListFilter,
  LockKeyhole,
  Play,
  RadioTower,
  RefreshCw,
  RotateCcw,
  Search,
  ServerCog,
  ShieldCheck,
  Webhook,
  XCircle,
} from 'lucide-react';
import adminStyles from '../admin.module.css';
import styles from './webhook-delivery.module.css';

type DeliveryStatus = 'pending' | 'processing' | 'retry' | 'delivered' | 'failed';
type Role = 'admin' | 'auditor';
type StatusView = 'all' | 'action' | 'scheduled' | 'delivered';

interface WebhookDeliveryData {
  generatedAt: string;
  role: Role;
  configured: boolean;
  configurationIssues: Array<{ code: string; detail: string }>;
  endpoints: Array<{
    id: string;
    origin: string;
    active: boolean;
    startAt: string;
    locale: 'en' | 'it';
  }>;
  metrics: Record<'total' | 'pending' | 'processing' | 'retry' | 'delivered' | 'failed', number>;
  recentDeliveries: Array<{
    id: string;
    endpointId: string;
    eventId: string;
    changeId: string;
    status: DeliveryStatus;
    attemptCount: number;
    nextAttemptAt: string | null;
    lastAttemptAt: string | null;
    lastStatusCode: number | null;
    lastErrorCode: string | null;
    deliveredAt: string | null;
    createdAt: string;
  }>;
  boundary: string;
}

interface ActionPayload {
  [key: string]: unknown;
  error?: string;
  message?: string;
  summary?: Record<string, unknown>;
  delivery?: { id?: string; status?: string };
}

const METRICS: Array<{
  key: keyof WebhookDeliveryData['metrics'];
  label: string;
  detail: string;
  tone: string;
}> = [
  { key: 'total', label: 'Total', detail: 'Outbox records', tone: styles.metricNeutral },
  { key: 'pending', label: 'Pending', detail: 'Awaiting a cycle', tone: styles.metricPending },
  { key: 'processing', label: 'Processing', detail: 'Claimed by a cycle', tone: styles.metricProcessing },
  { key: 'retry', label: 'Retry', detail: 'Scheduled attempts', tone: styles.metricRetry },
  { key: 'delivered', label: 'Delivered', detail: 'Recorded 2xx attempts', tone: styles.metricDelivered },
  { key: 'failed', label: 'Failed', detail: 'Terminal outbox state', tone: styles.metricFailed },
];

const STATUS_VIEWS: Array<{ key: StatusView; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'action', label: 'Needs action' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'delivered', label: 'Delivered' },
];

interface OperationalFocus {
  tone: 'configuration' | 'failure' | 'scheduled' | 'processing' | 'clear';
  label: string;
  title: string;
  detail: string;
  action: 'configuration' | 'action' | 'scheduled' | 'refresh' | 'all';
  actionLabel: string;
}

function getOperationalFocus(data: WebhookDeliveryData): OperationalFocus {
  if (!data.configured || data.configurationIssues.length > 0) {
    const configurationDetail = data.configurationIssues.length > 0
      ? `${data.configurationIssues.length} configuration exception${data.configurationIssues.length === 1 ? '' : 's'} returned. Resolve configuration before starting a delivery cycle.`
      : 'No active deployment configuration was returned. Complete configuration before starting a delivery cycle.';
    return {
      tone: 'configuration',
      label: 'Configuration attention',
      title: 'Correct the deployment configuration',
      detail: configurationDetail,
      action: 'configuration',
      actionLabel: 'Review configuration',
    };
  }
  if (data.metrics.failed > 0) {
    return {
      tone: 'failure',
      label: 'Receiver attention',
      title: 'Inspect the receiver or configuration before retrying',
      detail: `${data.metrics.failed} terminal failure${data.metrics.failed === 1 ? '' : 's'} returned in the outbox inventory. Open the failed view before scheduling a retry.`,
      action: 'action',
      actionLabel: 'View failed deliveries',
    };
  }
  if (data.metrics.pending > 0 || data.metrics.retry > 0) {
    const scheduledCount = data.metrics.pending + data.metrics.retry;
    return {
      tone: 'scheduled',
      label: 'Scheduled work',
      title: 'Run one bounded delivery cycle',
      detail: `${scheduledCount} pending or retry record${scheduledCount === 1 ? '' : 's'} returned. An administrator can start one bounded cycle; auditors remain read-only.`,
      action: 'scheduled',
      actionLabel: 'View scheduled work',
    };
  }
  if (data.metrics.processing > 0) {
    return {
      tone: 'processing',
      label: 'Cycle in progress',
      title: 'Wait for processing, then refresh the evidence',
      detail: `${data.metrics.processing} record${data.metrics.processing === 1 ? '' : 's'} currently processing. Refresh the returned state instead of starting duplicate work.`,
      action: 'refresh',
      actionLabel: 'Refresh state',
    };
  }
  return {
    tone: 'clear',
    label: 'No returned exception',
    title: 'No delivery exception in the returned ledger',
    detail: 'The current operational window contains no configuration, terminal failure or scheduled-work exception.',
    action: 'all',
    actionLabel: 'View delivery ledger',
  };
}

function isAttentionMetric(key: keyof WebhookDeliveryData['metrics'], value: number): boolean {
  return value > 0 && ['pending', 'processing', 'retry', 'failed'].includes(key);
}

function formatTimestamp(value: string | null): string {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Invalid timestamp';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
  }).format(date);
}

function statusClass(status: DeliveryStatus): string {
  if (status === 'delivered') return `${styles.statusBadge} ${styles.statusDelivered}`;
  if (status === 'failed') return `${styles.statusBadge} ${styles.statusFailed}`;
  if (status === 'processing') return `${styles.statusBadge} ${styles.statusProcessing}`;
  return `${styles.statusBadge} ${styles.statusWaiting}`;
}

function statusIcon(status: DeliveryStatus) {
  if (status === 'delivered') return <CheckCircle2 size={14} aria-hidden="true" />;
  if (status === 'failed') return <XCircle size={14} aria-hidden="true" />;
  if (status === 'processing') return <RadioTower size={14} aria-hidden="true" />;
  return <Clock3 size={14} aria-hidden="true" />;
}

function describeSummary(payload: ActionPayload, fallback: string): string {
  if (payload.message) return payload.message;
  if (payload.delivery?.status) return `${fallback} State: ${payload.delivery.status}.`;

  const summary = payload.summary || payload;
  const entries = Object.entries(summary)
    .filter(([key]) => !['error', 'message', 'boundary', 'configurationIssues'].includes(key))
    .filter(([, value]) => typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')
    .slice(0, 6)
    .map(([key, value]) => `${key.replace(/([A-Z])/g, ' $1').toLowerCase()}: ${String(value)}`);
  return entries.length > 0 ? `${fallback} ${entries.join('; ')}.` : fallback;
}

async function readPayload(response: Response): Promise<ActionPayload> {
  return response.json().catch(() => ({})) as Promise<ActionPayload>;
}

export default function WebhookDeliveryPage() {
  const [data, setData] = useState<WebhookDeliveryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [outcome, setOutcome] = useState('Loading webhook delivery state.');
  const [cyclePending, setCyclePending] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [statusView, setStatusView] = useState<StatusView>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/webhook-delivery', {
        credentials: 'include',
        cache: 'no-store',
      });
      const payload = await response.json().catch(() => null) as WebhookDeliveryData | { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload && 'error' in payload ? payload.error || 'Unable to load webhook delivery state.' : 'Unable to load webhook delivery state.');
      }
      setData(payload as WebhookDeliveryData);
      setOutcome('Webhook delivery state loaded.');
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Unable to load webhook delivery state.';
      setError(message);
      setOutcome(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function runCycle() {
    setCyclePending(true);
    setError('');
    setOutcome('Running one bounded delivery cycle.');
    try {
      const response = await fetch('/api/admin/webhook-delivery', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const payload = await readPayload(response);
      if (!response.ok) throw new Error(payload.error || 'The bounded cycle could not run.');
      const summary = describeSummary(payload, 'Bounded delivery cycle completed.');
      await load();
      setOutcome(summary);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'The bounded cycle could not run.';
      setError(message);
      setOutcome(message);
    } finally {
      setCyclePending(false);
    }
  }

  async function retryDelivery(deliveryId: string) {
    setRetryingId(deliveryId);
    setError('');
    setOutcome(`Scheduling retry for delivery ${deliveryId}.`);
    try {
      const response = await fetch('/api/admin/webhook-delivery', {
        method: 'PATCH',
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryId, action: 'retry' }),
      });
      const payload = await readPayload(response);
      if (!response.ok) throw new Error(payload.error || 'The delivery could not be scheduled for retry.');
      const summary = describeSummary(payload, `Delivery ${deliveryId} scheduled for retry.`);
      await load();
      setOutcome(summary);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'The delivery could not be scheduled for retry.';
      setError(message);
      setOutcome(message);
    } finally {
      setRetryingId(null);
    }
  }

  const operationalFocus = data ? getOperationalFocus(data) : null;
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredDeliveries = useMemo(() => {
    if (!data) return [];
    return data.recentDeliveries.filter((delivery) => {
      const matchesStatus = statusView === 'all'
        || (statusView === 'action' && delivery.status === 'failed')
        || (statusView === 'scheduled' && ['pending', 'retry', 'processing'].includes(delivery.status))
        || (statusView === 'delivered' && delivery.status === 'delivered');
      const matchesSearch = normalizedQuery.length === 0
        || [delivery.endpointId, delivery.eventId, delivery.changeId]
          .some((identifier) => identifier.toLowerCase().includes(normalizedQuery));
      return matchesStatus && matchesSearch;
    });
  }, [data, normalizedQuery, statusView]);

  function resetLedgerFilters() {
    setStatusView('all');
    setSearchQuery('');
  }

  function scrollToSection(sectionId: string) {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function followOperationalFocus() {
    if (!operationalFocus) return;
    if (operationalFocus.action === 'configuration') {
      scrollToSection('configuration-heading');
      return;
    }
    if (operationalFocus.action === 'refresh') {
      void load();
      return;
    }
    const nextView: StatusView = operationalFocus.action;
    setStatusView(nextView);
    setSearchQuery('');
    window.setTimeout(() => scrollToSection('delivery-ledger-heading'), 0);
  }

  if (loading && !data) {
    return (
      <div className={styles.initialState} role="status">
        <RefreshCw className={styles.spinning} size={24} aria-hidden="true" />
        <div><strong>Loading webhook delivery</strong><span>Reading configured destinations and persisted outbox state.</span></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={adminStyles.pageContainer}>
        <header className={adminStyles.pageHeader}>
          <h1 className={adminStyles.pageTitle}>Webhook Delivery</h1>
          <p className={adminStyles.pageSubtitle}>Configured destinations, signed attempts and bounded retry state.</p>
        </header>
        <section className={styles.errorState} role="alert">
          <AlertTriangle size={24} aria-hidden="true" />
          <div><h2>Delivery state unavailable</h2><p>{error}</p></div>
          <button type="button" className={`${adminStyles.btn} ${adminStyles.btnSecondary} ${adminStyles.btnInline}`} onClick={() => void load()} disabled={loading}>
            <RefreshCw size={16} aria-hidden="true" /> Try again
          </button>
        </section>
        <p className={styles.srOnly} aria-live="polite">{outcome}</p>
      </div>
    );
  }

  return (
    <div className={adminStyles.pageContainer}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={adminStyles.pageTitle}>Webhook Delivery</h1>
          <p className={adminStyles.pageSubtitle}>Configured destinations, signed attempts and bounded retry state.</p>
        </div>
        <div className={styles.headerActions}>
          {data.role === 'admin' && (
            <button
              type="button"
              className={`${adminStyles.btn} ${adminStyles.btnPrimary} ${adminStyles.btnInline}`}
              onClick={() => void runCycle()}
              disabled={cyclePending || loading}
            >
              {cyclePending ? <RefreshCw className={styles.spinning} size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
              {cyclePending ? 'Running cycle' : 'Run bounded cycle'}
            </button>
          )}
          <button
            type="button"
            className={`${adminStyles.btn} ${adminStyles.btnSecondary} ${adminStyles.btnInline}`}
            onClick={() => void load()}
            disabled={loading || cyclePending || retryingId !== null}
          >
            <RefreshCw className={loading ? styles.spinning : undefined} size={16} aria-hidden="true" />
            {loading ? 'Refreshing' : 'Refresh'}
          </button>
        </div>
      </header>

      <p className={styles.srOnly} aria-live="polite" aria-atomic="true">{outcome}</p>

      {error && (
        <div className={`${adminStyles.alert} ${adminStyles.alertWarning}`} role="alert">
          <AlertTriangle size={18} aria-hidden="true" /> {error}
        </div>
      )}

      <aside className={styles.boundaryAlert} aria-label="Webhook delivery boundary">
        <ShieldCheck size={19} aria-hidden="true" />
        <div><strong>Operating boundary</strong><p>{data.boundary}</p></div>
      </aside>

      {operationalFocus && (
        <section
          className={`${styles.operationalFocus} ${styles[`focus_${operationalFocus.tone}`]}`}
          aria-labelledby="operational-focus-heading"
        >
          <div className={styles.focusMarker} aria-hidden="true"><ListFilter size={19} /></div>
          <div className={styles.focusCopy}>
            <span>{operationalFocus.label}</span>
            <h2 id="operational-focus-heading">{operationalFocus.title}</h2>
            <p>{operationalFocus.detail}</p>
            <small>Recommendation based on the returned operational window. It is not an SLA or an exhaustive health determination.</small>
          </div>
          <button type="button" className={styles.focusAction} onClick={followOperationalFocus} disabled={loading}>
            {operationalFocus.actionLabel}<ArrowRight size={16} aria-hidden="true" />
          </button>
        </section>
      )}

      <section className={styles.stateRail} aria-label="Webhook delivery state path">
        <span className={styles.railLabel}>Evidence path for the recommended action</span>
        <div className={styles.railStep}>
          <CircleDot size={18} aria-hidden="true" />
          <span>01</span>
          <strong>Public event</strong>
          <small>Eligible published change</small>
        </div>
        <ArrowRight className={styles.horizontalArrow} size={19} aria-hidden="true" />
        <ArrowDown className={styles.verticalArrow} size={19} aria-hidden="true" />
        <div className={`${styles.railStep} ${styles.railStepSigned}`}>
          <KeyRound size={18} aria-hidden="true" />
          <span>02</span>
          <strong>Signed outbox</strong>
          <small>Persistent bounded attempt</small>
        </div>
        <ArrowRight className={styles.horizontalArrow} size={19} aria-hidden="true" />
        <ArrowDown className={styles.verticalArrow} size={19} aria-hidden="true" />
        <div className={styles.railStep}>
          <RadioTower size={18} aria-hidden="true" />
          <span>03</span>
          <strong>Receiver response</strong>
          <small>HTTP outcome recorded</small>
        </div>
        <div className={`${styles.railConfiguration} ${data.configured ? styles.isConfigured : styles.isUnconfigured}`}>
          {data.configured ? <CheckCircle2 size={17} aria-hidden="true" /> : <AlertTriangle size={17} aria-hidden="true" />}
          {data.configured ? 'Pilot configured' : 'Configuration incomplete'}
        </div>
      </section>

      <section className={styles.configurationPanel} aria-labelledby="configuration-heading">
        <header className={styles.sectionHeader}>
          <div>
            <span className={styles.eyebrow}>Deployment configuration</span>
            <h2 id="configuration-heading"><ServerCog size={19} aria-hidden="true" /> Configuration status</h2>
          </div>
          <span className={`${styles.configurationBadge} ${data.configured ? styles.isConfigured : styles.isUnconfigured}`}>
            {data.configured ? <CheckCircle2 size={15} aria-hidden="true" /> : <AlertTriangle size={15} aria-hidden="true" />}
            {data.configured ? 'Configured' : 'Not configured'}
          </span>
        </header>

        {data.endpoints.length > 0 ? (
          <div className={styles.endpointList} aria-label="Configured endpoint origins">
            {data.endpoints.map((endpoint) => (
              <article className={styles.endpointRow} key={endpoint.id}>
                <div className={styles.endpointIdentity}>
                  <Webhook size={18} aria-hidden="true" />
                  <div><code>{endpoint.id}</code><strong>{endpoint.origin}</strong></div>
                </div>
                <dl className={styles.endpointFacts}>
                  <div><dt>Activation</dt><dd><time dateTime={endpoint.startAt}>{formatTimestamp(endpoint.startAt)}</time></dd></div>
                  <div><dt>Locale</dt><dd><code>{endpoint.locale}</code></dd></div>
                  <div><dt>State</dt><dd><span className={endpoint.active ? styles.activeState : styles.inactiveState}>{endpoint.active ? 'Active' : 'Inactive'}</span></dd></div>
                </dl>
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <Webhook size={20} aria-hidden="true" />
            <div><strong>No destination origin is configured</strong><p>Add the deployment environment configuration before running a bounded cycle.</p></div>
          </div>
        )}

        {data.configurationIssues.length > 0 && (
          <div className={styles.issueList} aria-labelledby="configuration-issues-heading">
            <h3 id="configuration-issues-heading">Configuration issues</h3>
            <ul>
              {data.configurationIssues.map((issue) => (
                <li key={`${issue.code}-${issue.detail}`}><code>{issue.code}</code><span>{issue.detail}</span></li>
              ))}
            </ul>
          </div>
        )}

        <p className={styles.securityNote}><LockKeyhole size={16} aria-hidden="true" /> Paths, query strings and secrets are never returned by this API.</p>
      </section>

      <section aria-labelledby="outbox-metrics-heading">
        <div className={styles.sectionLead}>
          <div><span className={styles.eyebrow}>Persistent state</span><h2 id="outbox-metrics-heading">Outbox counts</h2></div>
          <p>Record counts only. They are not SLA, availability or success-rate measures.</p>
        </div>
        <dl className={styles.metricGrid}>
          {METRICS.map((metric) => (
            <div className={`${styles.metricCard} ${metric.tone} ${isAttentionMetric(metric.key, data.metrics[metric.key]) ? styles.metricAttention : ''}`} key={metric.key}>
              <dt>{metric.label}</dt>
              <dd>{data.metrics[metric.key]}</dd>
              <span>{metric.detail}</span>
            </div>
          ))}
        </dl>
      </section>

      <section className={styles.ledgerPanel} aria-labelledby="delivery-ledger-heading">
        <div className={styles.sectionLead}>
          <div><span className={styles.eyebrow}>Attempt evidence</span><h2 id="delivery-ledger-heading">Delivery ledger</h2></div>
          <p>Generated <time dateTime={data.generatedAt}>{formatTimestamp(data.generatedAt)}</time></p>
        </div>
        {data.recentDeliveries.length > 0 && (
          <div className={styles.ledgerToolbar} aria-label="Delivery ledger filters">
            <div className={styles.statusViews} role="group" aria-label="Filter deliveries by status">
              {STATUS_VIEWS.map((view) => (
                <button
                  key={view.key}
                  type="button"
                  className={statusView === view.key ? styles.statusViewActive : undefined}
                  aria-pressed={statusView === view.key}
                  onClick={() => setStatusView(view.key)}
                >
                  {view.label}
                </button>
              ))}
            </div>
            <label className={styles.ledgerSearch}>
              <span>Search identifiers</span>
              <span className={styles.searchField}><Search size={16} aria-hidden="true" /><input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Endpoint, event or change ID" /></span>
            </label>
            <div className={styles.filterSummary} aria-live="polite">
              <strong>{filteredDeliveries.length}</strong> of {data.recentDeliveries.length} records
              <button type="button" onClick={resetLedgerFilters} disabled={statusView === 'all' && normalizedQuery.length === 0}>Reset</button>
            </div>
          </div>
        )}
        {data.recentDeliveries.length > 0 ? (
          filteredDeliveries.length > 0 ? (
            <div className={styles.ledgerWrap} role="region" aria-label="Filtered webhook delivery records" tabIndex={0}>
              <table className={styles.ledger}>
                <caption className={styles.srOnly}>Filtered persistent webhook delivery records and retry actions</caption>
                <thead>
                  <tr><th>Endpoint / event</th><th>State</th><th>Attempts</th><th>Last response</th><th>Next attempt</th><th>Delivered</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {filteredDeliveries.map((delivery) => (
                  <tr key={delivery.id}>
                    <td data-label="Endpoint / event">
                      <code>{delivery.endpointId}</code>
                      <span className={styles.eventId}>Event <code>{delivery.eventId}</code></span>
                      <span className={styles.eventId}>Change <code>{delivery.changeId}</code></span>
                    </td>
                    <td data-label="State"><span className={statusClass(delivery.status)}>{statusIcon(delivery.status)} {delivery.status}</span></td>
                    <td data-label="Attempts"><strong className={styles.attemptCount}>{delivery.attemptCount}</strong><span className={styles.secondaryTimestamp}>Last: {formatTimestamp(delivery.lastAttemptAt)}</span></td>
                    <td data-label="Last response">
                      {delivery.lastStatusCode !== null ? <code>HTTP {delivery.lastStatusCode}</code> : <span>Not available</span>}
                      {delivery.lastErrorCode && <span className={styles.errorCode}>{delivery.lastErrorCode}</span>}
                    </td>
                    <td data-label="Next attempt"><time dateTime={delivery.nextAttemptAt || undefined}>{formatTimestamp(delivery.nextAttemptAt)}</time></td>
                    <td data-label="Delivered"><time dateTime={delivery.deliveredAt || undefined}>{formatTimestamp(delivery.deliveredAt)}</time></td>
                    <td data-label="Action">
                      {delivery.status === 'failed' && data.role === 'admin' ? (
                        <button
                          type="button"
                          className={styles.retryButton}
                          onClick={() => void retryDelivery(delivery.id)}
                          disabled={retryingId === delivery.id || cyclePending || loading}
                          aria-label={`Retry delivery ${delivery.id}`}
                        >
                          <RotateCcw className={retryingId === delivery.id ? styles.spinning : undefined} size={15} aria-hidden="true" />
                          {retryingId === delivery.id ? 'Scheduling' : 'Retry'}
                        </button>
                      ) : <span className={styles.noAction}>{data.role === 'auditor' ? 'Read only' : 'None'}</span>}
                    </td>
                  </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={`${styles.emptyState} ${styles.filteredEmptyState}`}>
              <Search size={20} aria-hidden="true" />
              <div><strong>No records match the current filters</strong><p>Change the status view or identifier search to inspect another part of the returned ledger.</p></div>
              <button type="button" className={styles.resetEmptyButton} onClick={resetLedgerFilters}>Reset filters</button>
            </div>
          )
        ) : (
          <div className={styles.emptyState}>
            <Clock3 size={20} aria-hidden="true" />
            <div><strong>No outbox record is available</strong><p>{data.role === 'admin' ? 'Run one bounded cycle after configuration to create eligible records.' : 'An administrator can run a bounded cycle after deployment configuration.'}</p></div>
          </div>
        )}
      </section>

      <div className={styles.protocolGrid}>
        <section className={styles.protocolPanel} aria-labelledby="operating-protocol-heading">
          <span className={styles.eyebrow}>Operator sequence</span>
          <h2 id="operating-protocol-heading">Operating protocol</h2>
          <ol>
            <li><span>01</span><div><strong>Configure deployment</strong><p>Provide destinations and signing material through the deployment environment.</p></div></li>
            <li><span>02</span><div><strong>Run bounded cycle</strong><p>An administrator explicitly starts one enqueue-and-delivery cycle.</p></div></li>
            <li><span>03</span><div><strong>Inspect attempt</strong><p>Review outbox state, HTTP status and structured error code.</p></div></li>
            <li><span>04</span><div><strong>Remediate receiver or configuration</strong><p>Correct the external receiver or deployment configuration before retrying.</p></div></li>
          </ol>
        </section>

        <aside className={styles.limitationPanel} aria-labelledby="limitations-heading">
          <AlertTriangle size={20} aria-hidden="true" />
          <div>
            <span className={styles.eyebrow}>Exact scope</span>
            <h2 id="limitations-heading">Pilot limitations</h2>
            <p>This is a deployment-controlled pilot. It does not provide public endpoint registration, tenant self-service, automatic key rotation, guaranteed delivery or an SLA.</p>
            <p>The browser never contacts a destination. Every operator action is sent only to the protected PolicyWatcher admin API.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
