'use client';

/**
 * Cron Manager Page
 *
 * @file src/app/admin/cron/page.tsx
 *
 * Displays the current cron status (running / idle), allows admins to
 * trigger a full policy scan, and shows LIVE PROGRESS with a scrolling
 * log of each policy as it's processed.
 */

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  Play,
  Square,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Clock,
  Terminal,
  Building2,
  Plus,
} from 'lucide-react';
import styles from '../admin.module.css';
import { PolicyDiscoveryWorkspace } from '@/components/admin/PolicyDiscoveryWorkspace';
import { getBatchLimitSummary } from '@/lib/adminBatchSummary';
import { getCronTargetControlState } from '@/lib/adminDiscoveryState';
import {
  IconEvidenceAccepted,
  IconScanPulse,
  IconSourceAttention,
  IconSourceFailed,
} from '@/components/icons/PolicyWatcherIcons';

/* ---------- Types ---------- */

interface DetailEntry {
  company: string;
  policy: string;
  status: string;
  source?: string;
  runtime?: 'app' | 'vps' | 'archive' | 'none';
  transportLabel?: string;
  diagnostics?: StrategyDiagnostic[];
}

interface StrategyDiagnostic {
  source: string;
  status: 'ok' | 'partial' | 'failed' | 'skipped' | 'rejected';
  reason?: string;
  httpStatus?: number;
  finalUrl?: string;
}

interface LastResult {
  checked?: number;
  selected?: number;
  changed?: number;
  rebaselined?: number;
  partial?: number;
  errors?: number;
  unavailable?: number;
  invalid?: number;
  details?: DetailEntry[];
  error?: string;
}

interface CronStatus {
  isRunning: boolean;
  startedAt: string | null;
  lastCompletedAt: string | null;
  lastResult: LastResult | null;
  lastError: string | null;
  progressTotal: number;
  progressCurrent: number;
  progressLog: string[];
  progressActivity: string;
}

interface CompanyBaselinePolicy {
  id: string;
  dataStatus?: string | null;
  lastCheckDate?: string | null;
  lastSuccessfulCheckDate?: string | null;
}

interface CompanyBaseline {
  id: string;
  name: string;
  slug: string;
  industry: string;
  policies: CompanyBaselinePolicy[];
}

type CompanyScanState = 'selected' | 'verified' | 'attention' | 'pending' | 'empty';
type LogLineTone = 'success' | 'warning' | 'error' | 'progress' | 'neutral';

const legacyDashRe = new RegExp(
  `[${String.fromCodePoint(0x2013)}${String.fromCodePoint(0x2014)}${String.fromCodePoint(0x2212)}]`,
  'g'
);
const legacyMiddleDotRe = new RegExp(String.fromCodePoint(0x00b7), 'g');
const legacyOkRe = new RegExp(
  `[${String.fromCodePoint(0x2713)}${String.fromCodePoint(0x2705)}]`,
  'g'
);
const legacyWarningRe = new RegExp(
  `${String.fromCodePoint(0x26a0)}${String.fromCodePoint(0xfe0f)}?`,
  'g'
);
const legacyErrorRe = new RegExp(
  `[${String.fromCodePoint(0x2717)}${String.fromCodePoint(0x274c)}]`,
  'g'
);
const legacyBlockedRe = new RegExp(String.fromCodePoint(0x2298), 'g');
const legacyExternalRe = new RegExp(String.fromCodePoint(0x2197), 'g');
const legacyCommandRe = new RegExp(String.fromCodePoint(0x2318), 'g');

/* ---------- Helpers ---------- */

function formatTimestamp(iso: string | null | undefined): string {
  if (!iso) return 'N/A';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function badgeClass(status: string): string {
  const s = status.toLowerCase();
  if (s === 'changed' || s === 'error' || s === 'invalid') return styles.badgeError;
  if (s === 'unavailable' || s === 'partial') return styles.badgeWarning;
  if (s === 'unchanged' || s === 'ok' || s === 'rebaselined') return styles.badgeSuccess;
  return styles.badgeNeutral;
}

function normalizeRuntime(detail: DetailEntry): 'app' | 'vps' | 'archive' | 'none' {
  if (detail.runtime) return detail.runtime;
  const source = (detail.source || '').toLowerCase();
  if (source === 'rendered') return 'vps';
  if (source === 'wayback' || source === 'commoncrawl' || source === 'cache') return 'archive';
  if (source === 'direct' || source === 'http2') return 'app';
  return 'none';
}

function runtimeLabel(runtime: 'app' | 'vps' | 'archive' | 'none'): string {
  const labels = {
    app: 'Hostinger app',
    vps: 'VPS renderer',
    archive: 'Archive fallback',
    none: 'No valid source',
  };
  return labels[runtime];
}

function runtimeClass(runtime: 'app' | 'vps' | 'archive' | 'none'): string {
  if (runtime === 'vps') return styles.badgePrimary;
  if (runtime === 'archive') return styles.badgeWarning;
  if (runtime === 'app') return styles.badgeSuccess;
  return styles.badgeNeutral;
}

function defaultTransportLabel(detail: DetailEntry): string {
  if (detail.transportLabel) return detail.transportLabel;
  const source = (detail.source || '').toLowerCase();
  const labels: Record<string, string> = {
    direct: 'Hostinger direct fetch',
    http2: 'Hostinger HTTP/2 fetch',
    rendered: 'VPS renderer',
    wayback: 'Wayback archive fallback',
    commoncrawl: 'Common Crawl archive fallback',
    cache: 'Web cache fallback',
    none: 'No retrieval source',
  };
  return labels[source] || 'Not recorded';
}

function strategyLabel(source: string): string {
  const labels: Record<string, string> = {
    direct: 'Direct',
    http2: 'HTTP/2',
    rendered: 'Renderer',
    wayback: 'Wayback',
    commoncrawl: 'Common Crawl',
  };
  return labels[source] || source || 'Unknown';
}

function strategyOutcomeClass(status: StrategyDiagnostic['status']): string {
  if (status === 'ok') return styles.strategyOk;
  if (status === 'partial') return styles.strategyPartial;
  if (status === 'skipped') return styles.strategySkipped;
  if (status === 'rejected') return styles.strategyRejected;
  return styles.strategyFailed;
}

function formatStrategyReason(reason?: string): string {
  if (!reason) return 'No reason recorded';
  return reason.length > 80 ? `${reason.slice(0, 77)}...` : reason;
}

function formatEscalation(
  diagnostic: StrategyDiagnostic,
  index: number,
  diagnostics: StrategyDiagnostic[]
): string {
  if (diagnostic.status === 'ok') return 'Accepted evidence';
  if (diagnostic.status === 'partial') return 'Incomplete capture; suspended pending review';
  const next = diagnostics[index + 1]?.source;
  if (!next) return 'No further fallback';
  return `Escalated to ${strategyLabel(next)}`;
}

const TRANSPORT_LEGEND = [
  {
    runtime: 'app' as const,
    title: 'Hostinger app',
    body: '[direct] and [http2] run inside the Next.js app process.',
  },
  {
    runtime: 'vps' as const,
    title: 'VPS renderer',
    body: '[rendered] calls the external Playwright renderer service.',
  },
  {
    runtime: 'archive' as const,
    title: 'Archive fallback',
    body: '[wayback] and [commoncrawl] are archive recovery paths.',
  },
  {
    runtime: 'none' as const,
    title: 'No valid source',
    body: 'The configured source could not produce usable policy text.',
  },
];

function normalizeCompanyStatus(value?: string | null): string {
  return (value || 'Configured').toLowerCase();
}

function companyScanState(company: CompanyBaseline, selectedSlug: string): CompanyScanState {
  if (selectedSlug && company.slug === selectedSlug) return 'selected';
  if (company.policies.length === 0) return 'empty';

  const statuses = company.policies.map((policy) => normalizeCompanyStatus(policy.dataStatus));
  const hasAttention = statuses.some((status) =>
    ['partial', 'needs review', 'unavailable'].includes(status)
  );
  if (hasAttention) return 'attention';

  const hasPending = statuses.some((status) => status === 'configured');
  if (hasPending) return 'pending';

  return 'verified';
}

function companyStateLabel(state: CompanyScanState): string {
  const labels: Record<CompanyScanState, string> = {
    selected: 'Selected',
    verified: 'Verified',
    attention: 'Review',
    pending: 'Pending',
    empty: 'No policies',
  };
  return labels[state];
}

/* ---------- Log Line Rendering ---------- */
function sanitizeLogLine(line: string): string {
  return line
    .replace(legacyDashRe, '-')
    .replace(legacyMiddleDotRe, '/')
    .replace(legacyOkRe, '[OK]')
    .replace(legacyWarningRe, '[ATTENTION]')
    .replace(legacyErrorRe, '[ERROR]')
    .replace(legacyBlockedRe, '[BLOCKED]')
    .replace(legacyExternalRe, 'external link')
    .replace(legacyCommandRe, 'Cmd')
    .replace(/\s{2,}/g, ' ');
}

function getLogLineTone(line: string): LogLineTone {
  const normalized = sanitizeLogLine(line).toLowerCase();
  if (normalized.includes('error') || normalized.includes('failed')) return 'error';
  if (
    normalized.includes('changed') ||
    normalized.includes('attention') ||
    normalized.includes('partial') ||
    normalized.includes('unavailable') ||
    normalized.includes('temporarily suspended') ||
    normalized.includes('needs review')
  ) {
    return 'warning';
  }
  if (
    normalized.includes('re-baselined') ||
    normalized.includes('scan complete') ||
    normalized.includes('[ok]') ||
    normalized.includes('accepted evidence')
  ) {
    return 'success';
  }
  if (
    normalized.includes('starting') ||
    normalized.includes('scraping') ||
    normalized.includes('polite delay') ||
    normalized.includes('initializing')
  ) {
    return 'progress';
  }
  return 'neutral';
}

function logToneClass(tone: LogLineTone): string {
  const classes: Record<LogLineTone, string> = {
    success: styles.logLineSuccess,
    warning: styles.logLineWarning,
    error: styles.logLineError,
    progress: styles.logLineProgress,
    neutral: styles.logLineNeutral,
  };
  return classes[tone];
}

function LogLineIcon({ tone }: { tone: LogLineTone }) {
  if (tone === 'success') {
    return <IconEvidenceAccepted size={14} color="#10b981" className={styles.logLineIcon} />;
  }
  if (tone === 'warning') {
    return <IconSourceAttention size={14} color="#f59e0b" className={styles.logLineIcon} />;
  }
  if (tone === 'error') {
    return <IconSourceFailed size={14} color="#ef4444" className={styles.logLineIcon} />;
  }
  return <IconScanPulse size={14} color="#6366f1" className={styles.logLineIcon} />;
}

/* ---------- Component ---------- */

export default function CronManagerPage() {
  const [status, setStatus] = useState<CronStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [companyBaseline, setCompanyBaseline] = useState<CompanyBaseline[]>([]);
  const [baselineLoading, setBaselineLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');
  const [batchLimit, setBatchLimit] = useState('5');
  const [companySlug, setCompanySlug] = useState('');
  const [selectedOnboardingActive, setSelectedOnboardingActive] = useState<boolean | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logEndRef = useRef<HTMLDivElement | null>(null);

  /* Fetch status from the API */
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/cron-status', {
        credentials: 'include',
      });
      if (!res.ok) return;
      const data: CronStatus = await res.json();
      setStatus(data);

      // Stop polling once the scan is no longer running
      if (!data.isRunning && pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    } catch {
      // Silently ignore fetch errors during polling
    }
  }, []);

  const fetchCompanyBaseline = useCallback(async () => {
    setBaselineLoading(true);
    try {
      const res = await fetch('/api/admin/companies', {
        credentials: 'include',
      });
      if (!res.ok) return;
      const data = await res.json();
      setCompanyBaseline(data.companies || []);
    } catch {
      // Keep scan controls usable even if the registry preview cannot load.
    } finally {
      setBaselineLoading(false);
    }
  }, []);

  /* Initial fetch on mount */
  useEffect(() => {
    let cancelled = false;

    async function init() {
      await Promise.all([fetchStatus(), fetchCompanyBaseline()]);
      if (!cancelled) setLoading(false);
    }

    init();
    return () => {
      cancelled = true;
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [fetchStatus, fetchCompanyBaseline]);

  /* Auto-scroll log to bottom */
  useEffect(() => {
    if (logEndRef.current && status?.isRunning) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [status?.progressLog?.length, status?.isRunning]);

  /* Start polling every 2 seconds (faster for live progress) */
  function startPolling() {
    if (pollingRef.current) return;
    pollingRef.current = setInterval(fetchStatus, 2000);
  }

  /* Trigger a full scan */
  async function handleRunScan() {
    setAlertMsg('');
    if (selectedTargetCompany && selectedTargetCompany.policies.length === 0) return;
    setTriggering(true);

    try {
      const res = await fetch('/api/admin/cron-status', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          limit: batchLimit.trim() ? Number(batchLimit) : undefined,
          companySlug: companySlug.trim() || undefined,
        }),
      });

      if (res.status === 409) {
        setAlertMsg('A scan is already running. Please wait for it to finish.');
        setTriggering(false);
        return;
      }

      if (!res.ok) {
        setAlertMsg('Failed to start the scan. Please try again.');
        setTriggering(false);
        return;
      }

      // Refresh status and begin polling
      await fetchStatus();
      startPolling();
    } catch {
      setAlertMsg('Unable to reach the server. Please try again later.');
    } finally {
      setTriggering(false);
    }
  }

  /* ---------- Render ---------- */

  const sortedCompanyBaseline = useMemo(
    () => [...companyBaseline].sort((a, b) => a.name.localeCompare(b.name)),
    [companyBaseline]
  );
  const selectedTargetCompany = companySlug.trim()
    ? companyBaseline.find((company) => company.slug === companySlug.trim().toLowerCase()) || null
    : null;
  const parsedBatchLimit = Math.max(1, Math.min(50, Number.parseInt(batchLimit, 10) || 1));
  const batchSummary = getBatchLimitSummary({
    limit: parsedBatchLimit,
    targetName: selectedTargetCompany?.name,
    availablePolicyCount: selectedTargetCompany?.policies.length,
  });
  const selectedTargetControls = selectedTargetCompany
    ? getCronTargetControlState(
        selectedTargetCompany.policies.length,
        selectedOnboardingActive === true
      )
    : null;

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingSpinner} />
      </div>
    );
  }

  const isRunning = status?.isRunning ?? false;
  const lastResult = status?.lastResult ?? null;
  const details = lastResult?.details ?? [];
  const progressTotal = status?.progressTotal ?? 0;
  const progressCurrent = status?.progressCurrent ?? 0;
  const progressLog = status?.progressLog ?? [];
  const progressActivity = status?.progressActivity ?? '';
  const progressPercent = progressTotal > 0 ? Math.round((progressCurrent / progressTotal) * 100) : 0;
  const runtimeCounts = details.reduce<Record<'app' | 'vps' | 'archive' | 'none', number>>(
    (acc, detail) => {
      acc[normalizeRuntime(detail)] += 1;
      return acc;
    },
    { app: 0, vps: 0, archive: 0, none: 0 }
  );

  return (
    <div>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Cron Manager</h1>
        <p className={styles.pageSubtitle}>
          Monitor and trigger policy scans. Limited batches process the least-recently checked sources first.
        </p>
      </div>

      {/* Alert */}
      {alertMsg && (
        <div className={`${styles.alert} ${styles.alertWarning}`}>
          <AlertTriangle size={16} />
          {alertMsg}
        </div>
      )}

      {/* Status Card */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>
          <RefreshCw size={16} />
          Scan Status
        </h2>

        <div className={styles.statusRow}>
          {/* Running / Idle */}
          <div className={styles.statusItem}>
            <span className={styles.statusLabel}>Status</span>
            <span
              className={`${styles.statusDot} ${
                isRunning ? styles.statusDotRunning : styles.statusDotIdle
              }`}
            />
            <span
              className={`${styles.statusText} ${
                isRunning ? styles.statusTextRunning : styles.statusTextIdle
              }`}
            >
              {isRunning ? 'Running' : 'Idle'}
            </span>
          </div>

          {/* Started at */}
          {isRunning && status?.startedAt && (
            <div className={styles.statusItem}>
              <Play size={14} />
              <span className={styles.statusLabel}>Started</span>
              <span>{formatTimestamp(status.startedAt)}</span>
            </div>
          )}

          {/* Last completed */}
          <div className={styles.statusItem}>
            <Clock size={14} />
            <span className={styles.statusLabel}>Last completed</span>
            <span>{formatTimestamp(status?.lastCompletedAt)}</span>
          </div>
        </div>

        {/* Progress bar with percentage (while running) */}
        {isRunning && progressTotal > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.78rem',
              color: '#94a3b8',
              marginBottom: 6,
            }}>
              <span>Scanning policies...</span>
              <span style={{ fontWeight: 700, color: '#6366f1' }}>
                {progressCurrent}/{progressTotal} ({progressPercent}%)
              </span>
            </div>
            <div style={{
              background: '#1e293b',
              borderRadius: 8,
              height: 8,
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${progressPercent}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                borderRadius: 8,
                transition: 'width 0.5s ease',
              }} />
            </div>
          </div>
        )}

        {/* Indeterminate progress (before total is known) */}
        {isRunning && progressTotal === 0 && (
          <div className={styles.progressBar}>
            <div className={styles.progressIndeterminate} />
          </div>
        )}
      </div>

      {/* Run Scan Controls */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>
          <Play size={16} />
          Scan Batch Controls
        </h2>
        <div className={styles.scanControlGrid}>
          <label className={styles.scanControlField}>
            <span className={styles.statusLabel}>Maximum policies this run</span>
            <input
              className={styles.input}
              type="number"
              min="1"
              max="50"
              value={batchLimit}
              onChange={(event) => setBatchLimit(event.target.value)}
              placeholder="5"
              disabled={Boolean(selectedTargetCompany && selectedTargetCompany.policies.length === 0)}
              aria-describedby="batch-limit-help"
            />
            <span id="batch-limit-help" className={styles.scanControlHelp}>{batchSummary}</span>
          </label>
          <div className={styles.selectedTargetSummary}>
            <span className={styles.statusLabel}>Selected target</span>
            <strong>{selectedTargetCompany?.name || 'All companies'}</strong>
            <span>{selectedTargetCompany ? `${selectedTargetCompany.policies.length} approved ${selectedTargetCompany.policies.length === 1 ? 'policy document' : 'policy documents'}` : `${companyBaseline.reduce((sum, company) => sum + company.policies.length, 0)} policy documents across the inventory`}</span>
          </div>
        </div>

        <div className={styles.targetRegistryPanel}>
          <div className={styles.targetRegistryHeader}>
            <div className={styles.targetRegistryTitle}>
              <Building2 size={16} />
              <div>
                <span className={styles.statusLabel}>Company baseline</span>
                <p className={styles.metaText}>
                  With a maximum of {parsedBatchLimit}, each run selects up to {parsedBatchLimit} least-recently checked matching policy {parsedBatchLimit === 1 ? 'document' : 'documents'}.
                  Select one company for a targeted run, or All companies to advance across the whole inventory.
                </p>
              </div>
            </div>
            <a
              className={`${styles.btn} ${styles.btnSecondary} ${styles.btnInline} ${styles.targetRegistryAction}`}
              href="/admin/companies"
            >
              <Plus size={14} />
              Add company or policy
            </a>
          </div>

          {baselineLoading ? (
            <p className={styles.targetRegistryEmpty}>Loading company baseline...</p>
          ) : (
            <div className={styles.companyTargetGrid}>
              <button
                type="button"
                className={`${styles.companyTargetCard} ${
                  !companySlug ? styles.companyTargetSelected : ''
                }`}
                onClick={() => {
                  setCompanySlug('');
                  setSelectedOnboardingActive(null);
                }}
                disabled={triggering || isRunning}
              >
                <span
                  className={`${styles.companyTargetDiamond} ${styles.companyTargetDiamondSelected}`}
                />
                <span className={styles.companyTargetName}>All companies</span>
                <span className={styles.companyTargetMeta}>
                  {sortedCompanyBaseline.length} companies in inventory
                </span>
              </button>

              {sortedCompanyBaseline.map((company) => {
                const state = companyScanState(company, companySlug);
                const verifiedCount = company.policies.filter((policy) =>
                  ['available', 'reviewed'].includes(normalizeCompanyStatus(policy.dataStatus))
                ).length;
                const attentionCount = company.policies.filter((policy) =>
                  ['partial', 'needs review', 'unavailable'].includes(
                    normalizeCompanyStatus(policy.dataStatus)
                  )
                ).length;

                return (
                  <button
                    key={company.id}
                    type="button"
                    className={`${styles.companyTargetCard} ${
                      state === 'selected' ? styles.companyTargetSelected : ''
                    }`}
                    onClick={() => {
                      setCompanySlug(company.slug);
                      setSelectedOnboardingActive(company.policies.length === 0);
                    }}
                    disabled={triggering || isRunning}
                    title={`${company.name}: ${company.policies.length} monitored policies`}
                  >
                    <span
                      className={`${styles.companyTargetDiamond} ${
                        styles[`companyTargetDiamond_${state}`]
                      }`}
                    />
                    <span className={styles.companyTargetName}>{company.name}</span>
                    <span className={styles.companyTargetMeta}>
                      {company.slug} / {company.policies.length} policies / {companyStateLabel(state)}
                    </span>
                    {attentionCount > 0 && (
                      <span className={`${styles.badge} ${styles.badgeWarning}`}>
                        {attentionCount} review
                      </span>
                    )}
                    {attentionCount === 0 && verifiedCount > 0 && state !== 'pending' && (
                      <span className={`${styles.badge} ${styles.badgeSuccess}`}>
                        {verifiedCount} verified
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          <p className={styles.targetRegistryFootnote}>
            New companies enter automatic policy discovery first. Administrators review and approve the
            verified sources; Cron then establishes the first monitored baseline. Unapproved evidence remains non-public.
          </p>
        </div>

        {selectedTargetCompany && selectedTargetControls?.mountDiscoveryWorkspace && (
          <PolicyDiscoveryWorkspace
            key={selectedTargetCompany.id}
            companyId={selectedTargetCompany.id}
            companyName={selectedTargetCompany.name}
            policyCount={selectedTargetCompany.policies.length}
            isAdmin
            onPoliciesChanged={fetchCompanyBaseline}
            onRunFirstScan={handleRunScan}
            onWorkflowStateChange={setSelectedOnboardingActive}
            scanRunning={triggering || isRunning}
          />
        )}

        {(!selectedTargetCompany || selectedTargetControls?.showNormalScanAction) && (
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={handleRunScan}
            disabled={triggering || isRunning}
          >
            {isRunning ? (
              <><Square size={16} /> Scan in progress...</>
            ) : triggering ? (
              <><RefreshCw size={16} className={styles.spinIcon} /> Starting scan...</>
            ) : (
              <><Play size={16} /> Run monitoring scan</>
            )}
          </button>
        )}
      </div>

      {/* ============ LIVE LOG (while running or just finished) ============ */}
      {(isRunning || progressLog.length > 0) && (
        <div className={styles.card} style={{ marginBottom: 24 }}>
          <h2 className={styles.cardTitle}>
            <Terminal size={16} />
            Live Scan Log
            {isRunning && (
              <span style={{
                marginLeft: 8,
                fontSize: '0.7rem',
                color: '#6366f1',
                fontWeight: 400,
              }}>
                polling every 2s
              </span>
            )}
          </h2>

          <div className={styles.cronTransportLegend}>
            {TRANSPORT_LEGEND.map((item) => (
              <div key={item.runtime} className={styles.cronTransportCard}>
                <span className={`${styles.badge} ${runtimeClass(item.runtime)}`}>
                  {item.title}
                </span>
                <p>{item.body}</p>
              </div>
            ))}
          </div>

          {/* Log console */}
          <div style={{
            background: '#0a0e1a',
            borderRadius: 10,
            padding: '14px 16px',
            maxHeight: 400,
            overflowY: 'auto',
            fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
            fontSize: '0.72rem',
            lineHeight: 1.8,
            border: '1px solid rgba(99, 102, 241, 0.15)',
          }}>
            {progressLog.map((line, i) => {
              const sanitizedLine = sanitizeLogLine(line);
              const tone = getLogLineTone(sanitizedLine);
              return (
              <div key={i} className={`${styles.logLine} ${logToneClass(tone)}`}>
                <span style={{ color: '#475569', userSelect: 'none' }}>
                  {String(i + 1).padStart(3, ' ')}
                </span>
                <LogLineIcon tone={tone} />
                <span>{sanitizedLine}</span>
              </div>
              );
            })}

            {/* Current activity (blinking) */}
            {isRunning && progressActivity && (
              <div className={`${styles.logLine} ${styles.logLineProgress}`}>
                <span style={{ color: '#475569', userSelect: 'none' }}>
                  {String(progressLog.length + 1).padStart(3, ' ')}
                </span>
                <IconScanPulse size={14} color="#6366f1" className={`${styles.logLineIcon} ${styles.logLineIconSpin}`} />
                <span>{sanitizeLogLine(progressActivity)}</span>
              </div>
            )}

            <div ref={logEndRef} />
          </div>
        </div>
      )}

      {/* ============ LAST RESULT SUMMARY ============ */}
      {lastResult && !lastResult.error && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>
            <CheckCircle size={16} />
            Last Scan Result
          </h2>

          {/* Summary Stats */}
          <div className={styles.statGrid}>
            <div className={styles.statBox}>
              <div className={styles.statValue}>
                {lastResult.checked ?? 0}
              </div>
              <div className={styles.statLabel}>Checked</div>
            </div>
            <div className={styles.statBox}>
              <div className={styles.statValue}>
                {lastResult.changed ?? 0}
              </div>
              <div className={styles.statLabel}>Changed</div>
            </div>
            <div className={styles.statBox}>
              <div className={styles.statValue}>
                {lastResult.rebaselined ?? 0}
              </div>
              <div className={styles.statLabel}>Re-baselined</div>
            </div>
            <div className={styles.statBox}>
              <div className={styles.statValue}>
                {lastResult.partial ?? 0}
              </div>
              <div className={styles.statLabel}>Partial</div>
            </div>
            <div className={styles.statBox}>
              <div className={styles.statValue}>
                {lastResult.errors ?? 0}
              </div>
              <div className={styles.statLabel}>Errors</div>
            </div>
            <div className={styles.statBox}>
              <div className={styles.statValue}>
                {lastResult.unavailable ?? 0}
              </div>
              <div className={styles.statLabel}>Unavailable</div>
            </div>
            <div className={styles.statBox}>
              <div className={styles.statValue}>
                {lastResult.invalid ?? 0}
              </div>
              <div className={styles.statLabel}>Invalid</div>
            </div>
          </div>

          <div className={styles.cronRuntimeGrid}>
            {TRANSPORT_LEGEND.map((item) => (
              <div key={item.runtime} className={styles.serviceMetric}>
                <span>{item.title}</span>
                <strong>{runtimeCounts[item.runtime]}</strong>
              </div>
            ))}
          </div>

          {/* Details Table */}
          {details.length > 0 && (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Policy</th>
                    <th>Status</th>
                    <th>Runtime</th>
                    <th>Retrieval path</th>
                    <th>Strategy evidence</th>
                  </tr>
                </thead>
                <tbody>
                  {details.map((d, i) => {
                    const runtime = normalizeRuntime(d);
                    return (
                      <tr key={`${d.company}-${d.policy}-${i}`}>
                        <td>{d.company}</td>
                        <td>{d.policy}</td>
                        <td>
                          <span
                            className={`${styles.badge} ${badgeClass(d.status)}`}
                          >
                            {d.status}
                          </span>
                        </td>
                        <td>
                          <span className={`${styles.badge} ${runtimeClass(runtime)}`}>
                            {runtimeLabel(runtime)}
                          </span>
                        </td>
                        <td>{defaultTransportLabel(d)}</td>
                        <td>
                          {d.diagnostics?.length ? (
                            <div className={styles.strategyStack}>
                              {d.diagnostics.map((diagnostic, diagnosticIndex) => (
                                <div
                                  key={`${d.company}-${d.policy}-${diagnostic.source}-${diagnosticIndex}`}
                                  className={styles.strategyItem}
                                >
                                  <div className={styles.strategyHead}>
                                    <span className={styles.strategyName}>
                                      {diagnosticIndex + 1}/5 {strategyLabel(diagnostic.source)}
                                    </span>
                                    <span className={`${styles.strategyOutcome} ${strategyOutcomeClass(diagnostic.status)}`}>
                                      {diagnostic.status}
                                    </span>
                                  </div>
                                  <div className={styles.strategyReason}>
                                    {typeof diagnostic.httpStatus === 'number' && diagnostic.httpStatus > 0
                                      ? `HTTP ${diagnostic.httpStatus} / `
                                      : ''}
                                    {formatStrategyReason(diagnostic.reason)}
                                  </div>
                                  <div className={styles.strategyEscalation}>
                                    {formatEscalation(diagnostic, diagnosticIndex, d.diagnostics || [])}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className={styles.metaText}>No strategy diagnostics recorded.</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {details.length === 0 && (
            <p className={styles.emptyState}>
              No per-policy details available for this scan.
            </p>
          )}
        </div>
      )}

      {/* Error result */}
      {lastResult?.error && (
        <div className={`${styles.alert} ${styles.alertWarning}`}>
          <AlertTriangle size={16} />
          Last scan ended with an error: {lastResult.error}
        </div>
      )}

      {/* No results yet */}
      {!lastResult && !isRunning && (
        <div className={styles.card}>
          <p className={styles.emptyState}>
            {selectedTargetCompany && selectedTargetControls?.mountDiscoveryWorkspace
              ? `No monitoring scan exists for ${selectedTargetCompany.name} yet. Complete discovery and approve at least one source above before establishing the first baseline.`
              : 'No scan results yet. Click "Run monitoring scan" to start.'}
          </p>
        </div>
      )}

      {/* Spin keyframe (inline for the Loader icon) */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
