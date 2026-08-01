'use client';

/**
 * VPS Services Page
 *
 * Monitors the renderer VPS and, when configured, the separate VPS Operations
 * Agent used for fixed smoke checks, backups, verified updates and rollback.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Archive,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Loader,
  PackageCheck,
  Play,
  RefreshCw,
  RotateCcw,
  Server,
  ShieldCheck,
  TerminalSquare,
  UploadCloud,
  XCircle,
} from 'lucide-react';
import styles from '../admin.module.css';

type ServiceStatus = 'online' | 'offline' | 'misconfigured' | 'degraded';

interface RendererHealth {
  ok?: boolean;
  active?: number;
  uptimeSeconds?: number;
  maxConcurrency?: number;
  navTimeoutMs?: number;
  service?: string;
  version?: string;
}

interface AgentHealth {
  ok?: boolean;
  service?: string;
  agentVersion?: string;
  state?: string;
  locked?: { operation: string; startedAt: string } | null;
  renderer?: {
    current?: { ok?: boolean; reason?: string; path?: string; version?: string };
    health?: { ok?: boolean; httpStatus?: number | null; latencyMs?: number | null; payload?: RendererHealth | null; error?: string | null };
    serviceName?: string;
  };
  paths?: {
    rendererRoot?: string;
    current?: string;
    packages?: string;
    backups?: string;
  };
  lastOperation?: unknown;
  generatedAt?: string;
  error?: string;
}

interface VpsService {
  id: 'renderer' | 'agent';
  name: string;
  status: ServiceStatus;
  endpoint: string | null;
  configured: boolean;
  secretConfigured: boolean;
  latencyMs: number | null;
  httpStatus?: number | null;
  health: RendererHealth | AgentHealth | null;
  error: string | null;
  checkedAt: string;
}

interface VpsPayload {
  role: 'admin' | 'auditor';
  generatedAt: string;
  services: VpsService[];
  appRuntime: {
    nodeEnv: string;
    rendererUrlConfigured: boolean;
    rendererUrlValid?: boolean;
    rendererSecretConfigured: boolean;
    agentUrlConfigured: boolean;
    agentUrlValid?: boolean;
    agentSecretConfigured: boolean;
  };
}

interface SmokeResult {
  ok: boolean;
  status?: ServiceStatus;
  latencyMs?: number | null;
  httpStatus?: number | null;
  sourceUrl?: string;
  finalUrl?: string | null;
  renderedStatus?: number | null;
  htmlLength?: number;
  error?: string | null;
  testedAt?: string;
}

interface OperationResponse {
  ok?: boolean;
  serviceId?: string;
  action?: string;
  httpStatus?: number | null;
  latencyMs?: number | null;
  result?: Record<string, unknown>;
  error?: string | null;
}

function formatDate(value?: string | null): string {
  if (!value) return 'N/A';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function formatDuration(seconds?: number): string {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds)) return 'N/A';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${Math.round(seconds % 60)}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

function statusMeta(status: ServiceStatus) {
  if (status === 'online') {
    return { label: 'Online', icon: CheckCircle2, className: styles.serviceStatusOnline };
  }
  if (status === 'degraded') {
    return { label: 'Degraded', icon: AlertTriangle, className: styles.serviceStatusDegraded };
  }
  if (status === 'misconfigured') {
    return { label: 'Misconfigured', icon: AlertTriangle, className: styles.serviceStatusMisconfigured };
  }
  return { label: 'Offline', icon: XCircle, className: styles.serviceStatusOffline };
}

function isAgentHealth(value: VpsService['health']): value is AgentHealth {
  return Boolean(value && 'agentVersion' in value);
}

export default function VpsServicesPage() {
  const [payload, setPayload] = useState<VpsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [operationLoading, setOperationLoading] = useState<string | null>(null);
  const [smokeResult, setSmokeResult] = useState<SmokeResult | null>(null);
  const [agentOperation, setAgentOperation] = useState<OperationResponse | null>(null);
  const [agentLogs, setAgentLogs] = useState<string[]>([]);
  const [updateVersion, setUpdateVersion] = useState('');
  const [updateSha256, setUpdateSha256] = useState('');
  const [alert, setAlert] = useState<string | null>(null);

  const requestServices = useCallback(async (): Promise<VpsPayload> => {
    const res = await fetch('/api/admin/vps-services', {
      credentials: 'include',
      cache: 'no-store',
    });
    if (!res.ok) {
      throw new Error('Unable to load VPS service status.');
    }
    return (await res.json()) as VpsPayload;
  }, []);

  const fetchServices = useCallback(async (options?: { showRefreshing?: boolean }) => {
    if (options?.showRefreshing) {
      setAlert(null);
      setRefreshing(true);
    }
    try {
      const data = await requestServices();
      setPayload(data);
    } catch (error) {
      setAlert(error instanceof Error ? error.message : 'Unable to reach the admin VPS service endpoint.');
    } finally {
      if (options?.showRefreshing) setRefreshing(false);
      setLoading(false);
    }
  }, [requestServices]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const data = await requestServices();
        if (!cancelled) setPayload(data);
      } catch (error) {
        if (!cancelled) setAlert(error instanceof Error ? error.message : 'Unable to reach the admin VPS service endpoint.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void init();
    const id = setInterval(() => {
      void fetchServices();
    }, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [fetchServices, requestServices]);

  const renderer = payload?.services.find((service) => service.id === 'renderer') ?? null;
  const agent = payload?.services.find((service) => service.id === 'agent') ?? null;
  const rendererMeta = renderer ? statusMeta(renderer.status) : statusMeta('misconfigured');
  const agentMeta = agent ? statusMeta(agent.status) : statusMeta('misconfigured');
  const RendererStatusIcon = rendererMeta.icon;
  const AgentStatusIcon = agentMeta.icon;
  const isAdmin = payload?.role === 'admin';
  const agentHealth = isAgentHealth(agent?.health ?? null) ? agent?.health as AgentHealth : null;

  const checklist = useMemo(() => {
    const healthOk = (renderer?.health as RendererHealth | null)?.ok === true;
    return [
      { label: 'RENDERER_URL set', ok: Boolean(payload?.appRuntime.rendererUrlConfigured) },
      { label: 'RENDERER_URL valid absolute URL', ok: Boolean(payload?.appRuntime.rendererUrlValid ?? payload?.appRuntime.rendererUrlConfigured) },
      { label: 'RENDERER_SECRET configured', ok: Boolean(payload?.appRuntime.rendererSecretConfigured) },
      { label: 'Health endpoint reachable', ok: renderer?.status === 'online' || renderer?.status === 'degraded' },
      { label: 'Renderer reports ok=true', ok: healthOk },
      { label: 'Smoke render completed', ok: smokeResult?.ok === true },
    ];
  }, [payload, renderer, smokeResult]);

  const agentChecklist = useMemo(() => [
    { label: 'VPS_AGENT_URL set', ok: Boolean(payload?.appRuntime.agentUrlConfigured) },
    { label: 'VPS_AGENT_URL valid absolute URL', ok: Boolean(payload?.appRuntime.agentUrlValid ?? payload?.appRuntime.agentUrlConfigured) },
    { label: 'VPS_AGENT_SECRET configured', ok: Boolean(payload?.appRuntime.agentSecretConfigured) },
    { label: 'Agent authenticated status reachable', ok: agent?.status === 'online' || agent?.status === 'degraded' },
    { label: 'Renderer current symlink known', ok: Boolean(agentHealth?.renderer?.current?.ok) },
    { label: 'No mutating operation lock', ok: !agentHealth?.locked },
  ], [payload, agent, agentHealth]);

  async function postAction(serviceId: 'renderer' | 'agent', action: string, body?: Record<string, string>) {
    setAlert(null);
    setOperationLoading(action);
    try {
      const res = await fetch('/api/admin/vps-services', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId, action, ...(body || {}) }),
      });
      const data = await res.json() as OperationResponse;
      if (!res.ok) {
        setAlert(data.error || 'VPS operation failed.');
      }
      if (serviceId === 'renderer') {
        setSmokeResult(data.result as unknown as SmokeResult);
      } else {
        setAgentOperation(data);
        if (action === 'logs') {
          const lines = (data.result?.lines || []) as string[];
          setAgentLogs(lines);
        }
      }
      await fetchServices();
    } catch {
      setAlert('Unable to run VPS operation.');
    } finally {
      setOperationLoading(null);
    }
  }

  function runVerifiedUpdate() {
    void postAction('agent', 'update', {
      version: updateVersion.trim(),
      sha256: updateSha256.trim(),
    });
  }

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingSpinner} />
      </div>
    );
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>VPS Services</h1>
        <p className={styles.pageSubtitle}>
          {isAdmin
            ? 'Monitor and operate companion services that run outside Hostinger and support the policy ingestion pipeline.'
            : 'Read-only verification of companion-service status, configuration evidence and timestamps.'}
        </p>
      </div>

      {alert && (
        <div className={`${styles.alert} ${styles.alertWarning}`}>
          <AlertTriangle size={16} />
          {alert}
        </div>
      )}

      <div className={styles.serviceHero}>
        <div className={styles.serviceHeroMain}>
          <div className={styles.serviceHeroIcon}>
            <Server size={24} />
          </div>
          <div>
            <span className={styles.serviceEyebrow}>Primary VPS companion</span>
            <h2>Renderer VPS</h2>
            <p>
              Headless-browser retrieval used by the scraper when direct HTTP/HTTP2 fetches are not enough for script-rendered policy pages.
            </p>
          </div>
        </div>
        <div className={`${styles.serviceStatusPill} ${rendererMeta.className}`}>
          <RendererStatusIcon size={16} />
          {rendererMeta.label}
        </div>
      </div>

      <div className={styles.serviceToolbar}>
        <button type="button" className={`${styles.btn} ${styles.btnInline}`} onClick={() => fetchServices({ showRefreshing: true })} disabled={refreshing}>
          {refreshing ? <Loader size={16} className={styles.spinIcon} /> : <RefreshCw size={16} />}
          Refresh status
        </button>
        {isAdmin ? (
          <button type="button" className={`${styles.btn} ${styles.btnInline} ${styles.btnPrimary}`} onClick={() => postAction('renderer', 'smoke-render')} disabled={Boolean(operationLoading)}>
            {operationLoading === 'smoke-render' ? <Loader size={16} className={styles.spinIcon} /> : <Play size={16} />}
            Run render smoke test
          </button>
        ) : (
          <span className={styles.serviceEmptyText}>Auditor role · status refresh only</span>
        )}
      </div>

      <div className={styles.serviceGrid}>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}><Activity size={16} />Live Health</h2>
          <div className={styles.serviceMetricGrid}>
            <div className={styles.serviceMetric}><span>Endpoint</span><strong>{renderer?.endpoint || 'Not configured'}</strong></div>
            <div className={styles.serviceMetric}><span>Latency</span><strong>{typeof renderer?.latencyMs === 'number' ? `${renderer.latencyMs} ms` : 'N/A'}</strong></div>
            <div className={styles.serviceMetric}><span>Active renders</span><strong>{(renderer?.health as RendererHealth | null)?.active ?? 'N/A'}</strong></div>
            <div className={styles.serviceMetric}><span>HTTP status</span><strong>{renderer?.httpStatus ?? 'N/A'}</strong></div>
            <div className={styles.serviceMetric}><span>Uptime</span><strong>{formatDuration((renderer?.health as RendererHealth | null)?.uptimeSeconds)}</strong></div>
            <div className={styles.serviceMetric}><span>Checked</span><strong>{formatDate(renderer?.checkedAt)}</strong></div>
          </div>
          {renderer?.error && <div className={`${styles.alert} ${styles.alertWarning} ${styles.serviceInlineAlert}`}><AlertTriangle size={16} />{renderer.error}</div>}
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}><ShieldCheck size={16} />Configuration Gate</h2>
          <div className={styles.serviceChecklist}>
            {checklist.map((item) => (
              <div key={item.label} className={`${styles.serviceChecklistItem} ${item.ok ? styles.serviceChecklistOk : styles.serviceChecklistFail}`}>
                {item.ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className={styles.serviceGrid}>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}><TerminalSquare size={16} />Render Smoke Result</h2>
          {smokeResult ? (
            <div className={styles.serviceSmokePanel}>
              <div className={`${styles.serviceStatusPill} ${statusMeta(smokeResult.ok ? 'online' : 'degraded').className}`}>
                {smokeResult.ok ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                {smokeResult.ok ? 'Smoke passed' : 'Smoke failed'}
              </div>
              <div className={styles.serviceMetricGrid}>
                <div className={styles.serviceMetric}><span>Source URL</span><strong>{smokeResult.sourceUrl || 'N/A'}</strong></div>
                <div className={styles.serviceMetric}><span>Final URL</span><strong>{smokeResult.finalUrl || 'N/A'}</strong></div>
                <div className={styles.serviceMetric}><span>Latency</span><strong>{typeof smokeResult.latencyMs === 'number' ? `${smokeResult.latencyMs} ms` : 'N/A'}</strong></div>
                <div className={styles.serviceMetric}><span>HTML length</span><strong>{(smokeResult.htmlLength || 0).toLocaleString()}</strong></div>
              </div>
              {smokeResult.error && <div className={`${styles.alert} ${styles.alertWarning} ${styles.serviceInlineAlert}`}><AlertTriangle size={16} />{smokeResult.error}</div>}
            </div>
          ) : (
            <p className={styles.serviceEmptyText}>No smoke test has been run from this admin session.</p>
          )}
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}><Clock size={16} />Operating Notes</h2>
          <div className={styles.serviceNoteList}>
            <p>The direct renderer smoke test verifies bearer auth and actual DOM rendering through <code>POST /render</code>.</p>
            <p>The operations agent below is separate from the renderer and is required for managed backup, verified update and rollback.</p>
            {renderer?.endpoint && (
              <a href={`${renderer.endpoint}/healthz`} target="_blank" rel="noreferrer" className={styles.serviceExternalLink}>
                Open public health endpoint
                <ExternalLink size={14} />
              </a>
            )}
          </div>
        </section>
      </div>

      <div className={styles.serviceHero} style={{ marginTop: 24 }}>
        <div className={styles.serviceHeroMain}>
          <div className={styles.serviceHeroIcon}>
            <PackageCheck size={24} />
          </div>
          <div>
            <span className={styles.serviceEyebrow}>Operations and recovery</span>
            <h2>VPS Operations Agent</h2>
            <p>
              Separate control plane for fixed smoke checks, backups, checksum-verified local package updates, rollback and capped operation logs.
            </p>
          </div>
        </div>
        <div className={`${styles.serviceStatusPill} ${agentMeta.className}`}>
          <AgentStatusIcon size={16} />
          {agentMeta.label}
        </div>
      </div>

      <div className={styles.serviceGrid}>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}><Activity size={16} />Agent State</h2>
          <div className={styles.serviceMetricGrid}>
            <div className={styles.serviceMetric}><span>Endpoint</span><strong>{agent?.endpoint || 'Not configured'}</strong></div>
            <div className={styles.serviceMetric}><span>Agent version</span><strong>{agentHealth?.agentVersion || 'N/A'}</strong></div>
            <div className={styles.serviceMetric}><span>State</span><strong>{agentHealth?.state || 'N/A'}</strong></div>
            <div className={styles.serviceMetric}><span>Current renderer</span><strong>{agentHealth?.renderer?.current?.version || agentHealth?.renderer?.current?.reason || 'N/A'}</strong></div>
            <div className={styles.serviceMetric}><span>Lock</span><strong>{agentHealth?.locked ? `${agentHealth.locked.operation} since ${formatDate(agentHealth.locked.startedAt)}` : 'None'}</strong></div>
            <div className={styles.serviceMetric}><span>Latency</span><strong>{typeof agent?.latencyMs === 'number' ? `${agent.latencyMs} ms` : 'N/A'}</strong></div>
          </div>
          {agent?.error && <div className={`${styles.alert} ${styles.alertWarning} ${styles.serviceInlineAlert}`}><AlertTriangle size={16} />{agent.error}</div>}
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}><ShieldCheck size={16} />Agent Gate</h2>
          <div className={styles.serviceChecklist}>
            {agentChecklist.map((item) => (
              <div key={item.label} className={`${styles.serviceChecklistItem} ${item.ok ? styles.serviceChecklistOk : styles.serviceChecklistFail}`}>
                {item.ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className={styles.serviceGrid}>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}><UploadCloud size={16} />Verified Update</h2>
          {isAdmin ? (
            <div className={styles.serviceForm}>
              <label>
                <span>Target version</span>
                <input value={updateVersion} onChange={(event) => setUpdateVersion(event.target.value)} placeholder="e.g. 3.5.2" />
              </label>
              <label>
                <span>Package SHA256</span>
                <input value={updateSha256} onChange={(event) => setUpdateSha256(event.target.value)} placeholder="64-character checksum" />
              </label>
              <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={runVerifiedUpdate} disabled={Boolean(operationLoading)}>
                {operationLoading === 'update' ? <Loader size={16} className={styles.spinIcon} /> : <UploadCloud size={16} />}
                Verify and deploy local package
              </button>
            </div>
          ) : (
            <p className={styles.serviceEmptyText}>Auditor access exposes current version, service state and configuration evidence above. Package deployment controls are not rendered.</p>
          )}
          <p className={styles.serviceEmptyText}>
            The admin panel sends only version and SHA256. The agent reads from its fixed packages directory; no package URL is accepted.
          </p>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}><Archive size={16} />Recovery Actions</h2>
          {isAdmin ? (
            <div className={styles.serviceActionGrid}>
              <button type="button" className={`${styles.btn} ${styles.btnInline}`} onClick={() => postAction('agent', 'agent-smoke')} disabled={Boolean(operationLoading)}>
                {operationLoading === 'agent-smoke' ? <Loader size={16} className={styles.spinIcon} /> : <Play size={16} />}
                Agent smoke
              </button>
              <button type="button" className={`${styles.btn} ${styles.btnInline}`} onClick={() => postAction('agent', 'backup')} disabled={Boolean(operationLoading)}>
                {operationLoading === 'backup' ? <Loader size={16} className={styles.spinIcon} /> : <Archive size={16} />}
                Create backup
              </button>
              <button type="button" className={`${styles.btn} ${styles.btnInline}`} onClick={() => postAction('agent', 'rollback')} disabled={Boolean(operationLoading)}>
                {operationLoading === 'rollback' ? <Loader size={16} className={styles.spinIcon} /> : <RotateCcw size={16} />}
                Rollback previous
              </button>
              <button type="button" className={`${styles.btn} ${styles.btnInline}`} onClick={() => postAction('agent', 'logs')} disabled={Boolean(operationLoading)}>
                {operationLoading === 'logs' ? <Loader size={16} className={styles.spinIcon} /> : <FileText size={16} />}
                Load logs
              </button>
            </div>
          ) : (
            <p className={styles.serviceEmptyText}>Auditor access is read-only. Smoke, backup, rollback and log-loading operations remain administrator-only.</p>
          )}
          {agentOperation && (
            <div className={`${styles.alert} ${agentOperation.ok === false ? styles.alertWarning : styles.alertInfo} ${styles.serviceInlineAlert}`}>
              {agentOperation.ok === false ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
              {agentOperation.action}: {agentOperation.ok === false ? agentOperation.error || 'failed' : 'completed'}
            </div>
          )}
        </section>
      </div>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}><TerminalSquare size={16} />Agent Operation Ledger</h2>
        {agentLogs.length > 0 ? (
          <pre className={styles.serviceLogBox}>{agentLogs.join('\n')}</pre>
        ) : (
          <p className={styles.serviceEmptyText}>No agent logs loaded. Logs are capped by the agent to 200 lines and 64 KB.</p>
        )}
      </section>
    </div>
  );
}
