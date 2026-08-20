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
import {
  MAX_RENDERER_PACKAGE_BYTES,
  formatRendererPackageBytes,
  inferRendererVersionFromFilename,
  isValidRendererPackageFilename,
  isValidRendererVersion,
} from '@/lib/vpsPackageContract';
import styles from '../admin.module.css';

type ServiceStatus = 'online' | 'offline' | 'misconfigured' | 'degraded';

interface RendererHealth {
  ok?: boolean;
  active?: number;
  uptimeSeconds?: number;
  capacity?: number;
  maxConcurrency?: number;
  navTimeoutMs?: number;
  service?: string;
  version?: string;
  state?: string;
  secretRotation?: string;
  targetAllowlistCount?: number;
  subresourceAllowlistCount?: number;
  browserVersionMajor?: string;
  userAgentMode?: string;
}

interface AgentHealth {
  ok?: boolean;
  service?: string;
  agentVersion?: string;
  state?: string;
  locked?: { operation: string; startedAt: string; operationId?: string; version?: string } | null;
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
  lastOperation?: {
    type?: string;
    status?: string;
    version?: string;
    operationId?: string;
    error?: string;
    completedAt?: string;
  } | null;
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
  uploaded?: Record<string, unknown>;
  accepted?: boolean;
  bytes?: number;
  stage?: string;
  error?: string | null;
}

type DeploymentPhase = 'idle' | 'hashing' | 'ready' | 'uploading' | 'deploying' | 'complete' | 'failed';

const RELEASE_STEPS = [
  { label: 'Select package', detail: 'Bounded archive' },
  { label: 'Verify locally', detail: 'SHA-256 in browser' },
  { label: 'Upload securely', detail: 'Authenticated control plane' },
  { label: 'Deploy & prove', detail: 'Install, switch, smoke' },
] as const;

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

function operationStatusLabel(status?: string): string {
  if (!status) return 'Unknown';
  return status.replaceAll('_', ' ').replace(/^./, (character) => character.toUpperCase());
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

function versionAtLeast(value: string | undefined, minimum: [number, number, number]): boolean {
  if (!value) return false;
  const parsed = value.split('.').map((part) => Number.parseInt(part, 10));
  return minimum.every((part, index) => {
    const observed = parsed[index] || 0;
    const previousEqual = minimum.slice(0, index).every((previous, previousIndex) => (parsed[previousIndex] || 0) === previous);
    return !previousEqual || observed >= part;
  });
}

async function sha256File(file: File): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Unable to read the selected package.'));
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string' || !result.includes(',')) {
        reject(new Error('Unable to encode the selected package.'));
        return;
      }
      resolve(result.slice(result.indexOf(',') + 1));
    };
    reader.readAsDataURL(file);
  });
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

export default function VpsServicesPage() {
  const [payload, setPayload] = useState<VpsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [operationLoading, setOperationLoading] = useState<string | null>(null);
  const [smokeResult, setSmokeResult] = useState<SmokeResult | null>(null);
  const [agentOperation, setAgentOperation] = useState<OperationResponse | null>(null);
  const [agentLogs, setAgentLogs] = useState<string[]>([]);
  const [packageFile, setPackageFile] = useState<File | null>(null);
  const [updateVersion, setUpdateVersion] = useState('');
  const [updateSha256, setUpdateSha256] = useState('');
  const [deploymentPhase, setDeploymentPhase] = useState<DeploymentPhase>('idle');
  const [deploymentFailureStep, setDeploymentFailureStep] = useState<number | null>(null);
  const [deploymentMessage, setDeploymentMessage] = useState('Select a packaged Renderer release ZIP to begin.');
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
  const managedUploadSupported = versionAtLeast(agentHealth?.agentVersion, [0, 2, 0]);
  const activeRendererVersion = agentHealth?.renderer?.current?.version || 'Unknown';
  const agentBusy = Boolean(agentHealth?.locked);
  const deploymentPhaseLabel = {
    idle: 'Awaiting package',
    hashing: 'Local verification',
    ready: 'Ready to deploy',
    uploading: 'Secure upload',
    deploying: 'Agent deployment',
    complete: 'Renderer active',
    failed: 'Attention required',
  }[deploymentPhase];

  const releaseStepState = useCallback((index: number): 'complete' | 'current' | 'pending' | 'failed' => {
    const activeIndex = deploymentPhase === 'failed' && deploymentFailureStep !== null
      ? deploymentFailureStep
      : deploymentPhase === 'idle'
      ? 0
      : deploymentPhase === 'hashing'
        ? 1
        : deploymentPhase === 'ready' || deploymentPhase === 'uploading'
          ? 2
          : 3;
    if (deploymentPhase === 'complete') return 'complete';
    if (deploymentPhase === 'failed' && index === activeIndex) return 'failed';
    if (index < activeIndex) return 'complete';
    if (index === activeIndex) return 'current';
    return 'pending';
  }, [deploymentFailureStep, deploymentPhase]);

  const releaseBlockedReason = !managedUploadSupported
    ? 'Install VPS Operations Agent 0.2.0 or newer before using managed uploads.'
    : agentBusy
      ? `Agent busy with ${agentHealth?.locked?.operation || 'another operation'}. Wait for it to finish before starting a release.`
      : !packageFile
        ? 'Select a Renderer release archive to enable deployment.'
        : deploymentPhase === 'hashing'
          ? 'Local package verification is still running.'
          : !updateSha256
            ? 'A verified SHA-256 is required.'
            : !isValidRendererVersion(updateVersion.trim())
              ? 'Confirm a valid target version.'
              : null;

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
    { label: 'Active Renderer release detected', ok: Boolean(agentHealth?.renderer?.current?.ok) },
    { label: 'Managed package upload supported', ok: managedUploadSupported },
    { label: 'No mutating operation lock', ok: !agentHealth?.locked },
  ], [payload, agent, agentHealth, managedUploadSupported]);

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

  async function selectRendererPackage(file: File | null) {
    setAlert(null);
    setAgentOperation(null);
    setPackageFile(null);
    setUpdateSha256('');
    setDeploymentPhase('idle');
    setDeploymentFailureStep(null);
    setDeploymentMessage('Select a packaged Renderer release ZIP to begin.');
    if (!file) return;
    if (!isValidRendererPackageFilename(file.name)) {
      setAlert('Select a .zip Renderer package with a safe filename.');
      return;
    }
    if (file.size <= 0 || file.size > MAX_RENDERER_PACKAGE_BYTES) {
      setAlert(`Renderer packages must be between 1 byte and ${formatRendererPackageBytes(MAX_RENDERER_PACKAGE_BYTES)}.`);
      return;
    }

    setPackageFile(file);
    setDeploymentPhase('hashing');
    setDeploymentMessage('Computing SHA-256 locally. The package has not been uploaded yet.');
    try {
      const checksum = await sha256File(file);
      const inferredVersion = inferRendererVersionFromFilename(file.name);
      setUpdateSha256(checksum);
      if (inferredVersion) setUpdateVersion(inferredVersion);
      setDeploymentPhase('ready');
      setDeploymentMessage('Package ready. Review the inferred version and start the managed deployment.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to inspect the selected package.';
      setDeploymentPhase('failed');
      setDeploymentFailureStep(1);
      setDeploymentMessage(`Local verification failed. ${message}`);
      setAlert(message);
    }
  }

  async function monitorManagedUpdate(version: string, operationId?: string) {
    const deadline = Date.now() + 8 * 60_000;
    while (Date.now() < deadline) {
      await wait(2_000);
      const nextPayload = await requestServices();
      setPayload(nextPayload);
      const nextAgent = nextPayload.services.find((service) => service.id === 'agent');
      const health = isAgentHealth(nextAgent?.health ?? null) ? nextAgent?.health as AgentHealth : null;
      const lockMatches = health?.locked?.operation === 'update'
        && (!operationId || !health.locked.operationId || health.locked.operationId === operationId);
      if (lockMatches) {
        setDeploymentPhase('deploying');
        setDeploymentMessage(`Agent is installing Renderer ${version}, switching the active release and running the smoke test.`);
        continue;
      }

      const last = health?.lastOperation;
      const operationMatches = last?.type === 'update'
        && last.version === version
        && (!operationId || !last.operationId || last.operationId === operationId);
      if (operationMatches && last?.status === 'ok') {
        setDeploymentPhase('complete');
        setDeploymentMessage(`Renderer ${version} is active and the post-deploy smoke test passed.`);
        return;
      }
      if (operationMatches && ['rolled_back', 'rollback_failed'].includes(last?.status || '')) {
        throw new Error(
          last?.status === 'rolled_back'
            ? `Renderer ${version} failed verification and the Agent restored the previous release.`
            : `Renderer ${version} failed and automatic rollback requires manual intervention.`,
        );
      }
      if (!health?.locked && health?.renderer?.current?.version === version) {
        setDeploymentPhase('complete');
        setDeploymentMessage(`Renderer ${version} is active. Refresh logs to inspect the operation ledger.`);
        return;
      }
    }
    throw new Error('The update is still running or status could not be confirmed within eight minutes. Check Agent State and operation logs before retrying.');
  }

  async function runManagedUpdate() {
    const version = updateVersion.trim();
    if (!packageFile || !updateSha256) {
      setAlert('Select and verify a Renderer package first.');
      return;
    }
    if (!isValidRendererVersion(version)) {
      setAlert('Enter a valid Renderer version using letters, numbers, dots, underscores or hyphens.');
      return;
    }
    if (!managedUploadSupported) {
      setAlert('VPS Operations Agent 0.2.0 or newer is required for managed package uploads.');
      return;
    }

    setAlert(null);
    setAgentOperation(null);
    setOperationLoading('upload-and-update');
    setDeploymentPhase('uploading');
    setDeploymentFailureStep(null);
    setDeploymentMessage('Uploading the package through the authenticated Hostinger control plane.');
    let currentFailureStep = 2;
    try {
      const [contentBase64, checksum] = await Promise.all([
        fileToBase64(packageFile),
        sha256File(packageFile),
      ]);
      if (checksum !== updateSha256) throw new Error('The selected package changed after verification. Select it again.');

      const res = await fetch('/api/admin/vps-services', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: 'agent',
          action: 'upload-and-update',
          version,
          filename: packageFile.name,
          sha256: checksum,
          contentBase64,
        }),
      });
      const data = await res.json() as OperationResponse;
      setAgentOperation(data);
      if (!res.ok || data.ok === false) {
        currentFailureStep = data.stage === 'deployment' ? 3 : 2;
        throw new Error(data.error || `Managed deployment failed during ${data.stage || 'request validation'}.`);
      }

      const operationId = typeof data.result?.operationId === 'string' ? data.result.operationId : undefined;
      currentFailureStep = 3;
      setDeploymentPhase('deploying');
      setDeploymentMessage(`Package staged. Agent accepted the Renderer ${version} deployment.`);
      await monitorManagedUpdate(version, operationId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to complete the managed Renderer deployment.';
      setDeploymentPhase('failed');
      setDeploymentFailureStep(currentFailureStep);
      setDeploymentMessage(message);
      setAlert(message);
    } finally {
      setOperationLoading(null);
      await fetchServices();
    }
  }

  if (loading) {
    return (
      <div className={styles.serviceLoadingScreen} role="status" aria-live="polite">
        <div className={styles.loadingSpinner} />
        <div>
          <strong>Loading VPS control plane</strong>
          <span>Checking Renderer and Operations Agent readiness…</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.servicePage}>
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
            <div className={styles.serviceMetric}><span>Capacity</span><strong>{(renderer?.health as RendererHealth | null)?.capacity ?? (renderer?.health as RendererHealth | null)?.maxConcurrency ?? 'N/A'}</strong></div>
            <div className={styles.serviceMetric}><span>HTTP status</span><strong>{renderer?.httpStatus ?? 'N/A'}</strong></div>
            <div className={styles.serviceMetric}><span>Uptime</span><strong>{formatDuration((renderer?.health as RendererHealth | null)?.uptimeSeconds)}</strong></div>
            <div className={styles.serviceMetric}><span>Secret rotation</span><strong>{(renderer?.health as RendererHealth | null)?.secretRotation ?? 'N/A'}</strong></div>
            <div className={styles.serviceMetric}><span>Allowed targets</span><strong>{(renderer?.health as RendererHealth | null)?.targetAllowlistCount ?? 'N/A'}</strong></div>
            <div className={styles.serviceMetric}><span>Chromium major</span><strong>{(renderer?.health as RendererHealth | null)?.browserVersionMajor ?? 'N/A'}</strong></div>
            <div className={styles.serviceMetric}><span>User-Agent mode</span><strong>{(renderer?.health as RendererHealth | null)?.userAgentMode ?? 'N/A'}</strong></div>
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

      <div className={`${styles.serviceHero} ${styles.serviceAgentHero}`}>
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

      <div className={`${styles.serviceGrid} ${styles.serviceReleaseGrid}`}>
        <section className={`${styles.card} ${styles.serviceReleaseCard}`} aria-labelledby="managed-renderer-release-title">
          <div className={styles.serviceReleaseHeader}>
            <div>
              <span className={styles.serviceEyebrow}>End-to-end control plane</span>
              <h2 id="managed-renderer-release-title"><UploadCloud size={18} />Managed Renderer Release</h2>
              <p>Select one package and follow the same evidence trail until the new Renderer is active.</p>
            </div>
            <span
              className={`${styles.serviceReleaseState} ${deploymentPhase === 'complete' ? styles.serviceDeploymentComplete : deploymentPhase === 'failed' ? styles.serviceDeploymentFailed : ''}`}
            >
              {deploymentPhase === 'hashing' || deploymentPhase === 'uploading' || deploymentPhase === 'deploying'
                ? <Loader size={14} className={styles.spinIcon} />
                : deploymentPhase === 'complete'
                  ? <CheckCircle2 size={14} />
                  : deploymentPhase === 'failed'
                    ? <AlertTriangle size={14} />
                    : <Clock size={14} />}
              {deploymentPhaseLabel}
            </span>
          </div>

          <ol className={styles.serviceReleaseRail} aria-label="Managed release progress">
            {RELEASE_STEPS.map((step, index) => {
              const state = releaseStepState(index);
              return (
                <li key={step.label} data-state={state} aria-current={state === 'current' ? 'step' : undefined}>
                  <span className={styles.serviceReleaseStepMarker} aria-hidden="true">
                    {state === 'complete' ? <CheckCircle2 size={15} /> : state === 'failed' ? <XCircle size={15} /> : index + 1}
                  </span>
                  <span>
                    <strong>{step.label}</strong>
                    <small>{step.detail}</small>
                  </span>
                </li>
              );
            })}
          </ol>

          {isAdmin ? (
            <div className={styles.serviceForm}>
              <label className={styles.serviceFilePicker} htmlFor="renderer-package">
                <span className={styles.serviceFilePickerIcon}><UploadCloud size={20} /></span>
                <span className={styles.serviceFilePickerCopy}>
                  <strong>{packageFile ? 'Replace Renderer package' : 'Choose Renderer package'}</strong>
                  <small>ZIP only · maximum {formatRendererPackageBytes(MAX_RENDERER_PACKAGE_BYTES)} compressed / 64 MiB declared extracted</small>
                </span>
                <input
                  id="renderer-package"
                  type="file"
                  accept=".zip,application/zip"
                  onChange={(event) => void selectRendererPackage(event.target.files?.[0] || null)}
                  disabled={Boolean(operationLoading)}
                />
              </label>

              {packageFile && (
                <div className={styles.servicePackageMeta}>
                  <PackageCheck size={16} />
                  <span><strong>{packageFile.name}</strong><small>Selected package · identity retained through deployment</small></span>
                  <strong>{formatRendererPackageBytes(packageFile.size)}</strong>
                </div>
              )}

              <div className={styles.serviceReleaseFields}>
                <label htmlFor="renderer-target-version">
                  <span>Target version</span>
                  <input
                    id="renderer-target-version"
                    value={updateVersion}
                    onChange={(event) => setUpdateVersion(event.target.value)}
                    placeholder="e.g. 1.2.0"
                    disabled={Boolean(operationLoading)}
                    autoComplete="off"
                  />
                </label>
                <label htmlFor="renderer-package-sha256">
                  <span>Browser-computed SHA-256</span>
                  <input id="renderer-package-sha256" value={updateSha256} readOnly placeholder="Computed after package selection" />
                </label>
              </div>

              <dl className={styles.serviceReleaseEvidence}>
                <div>
                  <dt>Active now</dt>
                  <dd>{activeRendererVersion}</dd>
                </div>
                <div>
                  <dt>Proposed target</dt>
                  <dd>{updateVersion.trim() || 'Awaiting package'}</dd>
                </div>
                <div>
                  <dt>Package size</dt>
                  <dd>{packageFile ? formatRendererPackageBytes(packageFile.size) : `≤ ${formatRendererPackageBytes(MAX_RENDERER_PACKAGE_BYTES)}`}</dd>
                </div>
              </dl>

              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary} ${styles.serviceReleaseAction}`}
                onClick={() => void runManagedUpdate()}
                disabled={Boolean(operationLoading) || Boolean(releaseBlockedReason)}
                aria-describedby={releaseBlockedReason && !operationLoading
                  ? 'managed-release-help managed-release-progress'
                  : 'managed-release-progress'}
              >
                {operationLoading === 'upload-and-update' || deploymentPhase === 'hashing'
                  ? <Loader size={16} className={styles.spinIcon} />
                  : <UploadCloud size={16} />}
                {operationLoading === 'upload-and-update'
                  ? 'Deploying through Agent...'
                  : deploymentPhase === 'hashing'
                    ? 'Verifying package...'
                    : 'Upload, verify and deploy'}
              </button>
              {releaseBlockedReason && !operationLoading && (
                <p id="managed-release-help" className={styles.serviceActionHint}><ShieldCheck size={14} />{releaseBlockedReason}</p>
              )}
              <div
                id="managed-release-progress"
                className={`${styles.serviceDeploymentProgress} ${deploymentPhase === 'failed' ? styles.serviceDeploymentFailed : deploymentPhase === 'complete' ? styles.serviceDeploymentComplete : ''}`}
                aria-live="polite"
                aria-atomic="true"
                role="status"
              >
                <span className={styles.serviceDeploymentIcon}>
                  {deploymentPhase === 'hashing' || deploymentPhase === 'uploading' || deploymentPhase === 'deploying'
                    ? <Loader size={17} className={styles.spinIcon} />
                    : deploymentPhase === 'complete'
                      ? <CheckCircle2 size={17} />
                      : deploymentPhase === 'failed'
                        ? <AlertTriangle size={17} />
                        : <Clock size={17} />}
                </span>
                <span><strong>{deploymentPhaseLabel}</strong><small>{deploymentMessage}</small></span>
              </div>
            </div>
          ) : (
            <div className={styles.serviceReadOnlyPanel}>
              <ShieldCheck size={18} />
              <div>
                <strong>Read-only release evidence</strong>
                 <p>Auditor access exposes the active version, Agent state and configuration gates. Package deployment controls are not rendered. Package selection is unavailable.</p>
              </div>
            </div>
          )}
          <p className={styles.serviceBoundaryNote}>
            <ShieldCheck size={14} />
            The package is hashed in this browser, uploaded through the authenticated Hostinger API, revalidated by the Agent and deployed asynchronously. Secrets remain server-side; no package URL or shell command is accepted.
          </p>
        </section>

        <section className={`${styles.card} ${styles.serviceRecoveryCard}`}>
          <h2 className={styles.cardTitle}><Archive size={16} />Recovery Actions</h2>
          <p className={styles.serviceRecoveryIntro}>Secondary controls for verification, restore points and controlled recovery.</p>
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
          {agentHealth?.lastOperation && (
            <dl className={styles.serviceLastOperation}>
              <div><dt>Last operation</dt><dd>{agentHealth.lastOperation.type || 'Unknown'}</dd></div>
              <div><dt>Result</dt><dd>{operationStatusLabel(agentHealth.lastOperation.status)}</dd></div>
              {agentHealth.lastOperation.version && <div><dt>Version</dt><dd>{agentHealth.lastOperation.version}</dd></div>}
              {agentHealth.lastOperation.error && <div><dt>Detail</dt><dd>{operationStatusLabel(agentHealth.lastOperation.error)}</dd></div>}
              <div><dt>Completed</dt><dd>{formatDate(agentHealth.lastOperation.completedAt)}</dd></div>
            </dl>
          )}
        </section>
      </div>

      <section className={`${styles.card} ${styles.serviceLedgerCard}`}>
        <div className={styles.serviceLedgerHeader}>
          <div>
            <h2 className={styles.cardTitle}><TerminalSquare size={16} />Agent Operation Ledger</h2>
            <p>Latest bounded Agent evidence · maximum 200 lines / 64 KB</p>
          </div>
          {isAdmin && (
            <button type="button" className={`${styles.btn} ${styles.btnInline}`} onClick={() => postAction('agent', 'logs')} disabled={Boolean(operationLoading)}>
              {operationLoading === 'logs' ? <Loader size={16} className={styles.spinIcon} /> : <RefreshCw size={16} />}
              Refresh ledger
            </button>
          )}
        </div>
        {agentLogs.length > 0 ? (
          <pre className={styles.serviceLogBox}>{agentLogs.join('\n')}</pre>
        ) : (
          <p className={styles.serviceEmptyText}>No agent logs loaded. Logs are capped by the agent to 200 lines and 64 KB.</p>
        )}
      </section>
    </div>
  );
}
