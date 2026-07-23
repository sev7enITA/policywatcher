'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ExternalLink,
  FileSearch,
  Play,
  RefreshCw,
  Search,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import styles from '@/app/admin/admin.module.css';
import { getDiscoveryUiState } from '@/lib/adminDiscoveryState';

export interface PolicyDiscoveryCandidate {
  id: string;
  name: string;
  type: string;
  url: string;
  jurisdiction: string;
  confidence: number;
  discoverySource: string;
  retrievalSource: string;
  reason: string;
  status: 'Proposed' | 'Approved' | 'Rejected';
}

export interface PolicyDiscoveryJob {
  status: 'running' | 'completed' | 'failed';
  startedAt?: string;
  completedAt?: string | null;
  candidateCount: number;
  error: string | null;
}

interface PolicyDiscoveryWorkspaceProps {
  companyId: string;
  companyName: string;
  policyCount: number;
  isAdmin: boolean;
  onPoliciesChanged: () => void | Promise<void>;
  onRunFirstScan?: () => void | Promise<void>;
  onWorkflowStateChange?: (active: boolean) => void;
  hasEstablishedBaseline?: boolean;
  scanRunning?: boolean;
  compact?: boolean;
}

type StageState = 'upcoming' | 'current' | 'complete';

export function PolicyDiscoveryWorkspace({
  companyId,
  companyName,
  policyCount,
  isAdmin,
  onPoliciesChanged,
  onRunFirstScan,
  onWorkflowStateChange,
  hasEstablishedBaseline = false,
  scanRunning = false,
  compact = false,
}: PolicyDiscoveryWorkspaceProps) {
  const [candidates, setCandidates] = useState<PolicyDiscoveryCandidate[]>([]);
  const [job, setJob] = useState<PolicyDiscoveryJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [firstScanLaunched, setFirstScanLaunched] = useState(false);
  const requestVersionRef = useRef(0);

  const loadDiscovery = useCallback(async (signal?: AbortSignal) => {
    const requestVersion = ++requestVersionRef.current;
    try {
      const response = await fetch(
        `/api/admin/policy-discovery?companyId=${encodeURIComponent(companyId)}`,
        { credentials: 'include', signal }
      );
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || 'Unable to load discovery status.');
      }
      if (signal?.aborted || requestVersion !== requestVersionRef.current) return;
      const nextCandidates = data?.candidates || [];
      const nextJob = data?.job || null;
      setCandidates(nextCandidates);
      setJob(nextJob);
      onWorkflowStateChange?.(getDiscoveryUiState({
        policyCount,
        candidateCount: nextCandidates.length,
        hasJobState: Boolean(nextJob),
        hasEstablishedBaseline,
        firstScanLaunched,
      }).onboardingActive);
      setError('');
    } catch (loadError) {
      if (signal?.aborted || requestVersion !== requestVersionRef.current) return;
      setError(loadError instanceof Error ? loadError.message : 'Unable to load discovery status.');
    } finally {
      if (!signal?.aborted && requestVersion === requestVersionRef.current) setLoading(false);
    }
  }, [companyId, firstScanLaunched, hasEstablishedBaseline, onWorkflowStateChange, policyCount]);

  useEffect(() => {
    requestVersionRef.current += 1;
    const controller = new AbortController();
    queueMicrotask(() => void loadDiscovery(controller.signal));
    return () => {
      requestVersionRef.current += 1;
      controller.abort();
    };
  }, [companyId, loadDiscovery]);

  useEffect(() => {
    if (job?.status !== 'running') return;
    let controller: AbortController | null = null;
    const timer = window.setInterval(() => {
      controller?.abort();
      controller = new AbortController();
      void loadDiscovery(controller.signal);
    }, 2_500);
    return () => {
      window.clearInterval(timer);
      controller?.abort();
    };
  }, [job?.status, loadDiscovery]);

  const proposedCount = candidates.filter((candidate) => candidate.status === 'Proposed').length;
  const approvedCount = candidates.filter((candidate) => candidate.status === 'Approved').length;
  const uiState = getDiscoveryUiState({
    policyCount,
    candidateCount: candidates.length,
    hasJobState: Boolean(job),
    hasEstablishedBaseline,
    firstScanLaunched,
  });

  const stages = useMemo((): { label: string; detail: string; state: StageState }[] => {
    const discoveryComplete = candidates.length > 0 || job?.status === 'completed' || policyCount > 0;
    const reviewComplete = policyCount > 0 || approvedCount > 0;
    return [
      {
        label: 'Discover sources',
        detail: job?.status === 'running' ? 'Searching official sources now' : discoveryComplete ? 'Source search completed' : 'Search official policy locations',
        state: discoveryComplete ? 'complete' : 'current',
      },
      {
        label: 'Human review',
        detail: reviewComplete ? 'At least one source approved' : proposedCount > 0 ? `${proposedCount} ${proposedCount === 1 ? 'candidate' : 'candidates'} awaiting a decision` : 'Approve or reject every source',
        state: reviewComplete ? 'complete' : discoveryComplete ? 'current' : 'upcoming',
      },
      {
        label: 'First monitoring scan',
        detail: policyCount > 0 ? 'Ready to establish the baseline' : 'Available after one approval',
        state: policyCount > 0 ? 'current' : 'upcoming',
      },
    ];
  }, [approvedCount, candidates.length, job?.status, policyCount, proposedCount]);

  const startDiscovery = async () => {
    setError('');
    setActionId('discovery');
    setJob({ status: 'running', startedAt: new Date().toISOString(), candidateCount: 0, error: null });
    try {
      const response = await fetch('/api/admin/policy-discovery', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok && response.status !== 409) {
        throw new Error(data?.error || 'Unable to start policy discovery.');
      }
      setJob(data?.job || { status: 'running', startedAt: new Date().toISOString(), candidateCount: 0, error: null });
      await loadDiscovery();
    } catch (startError) {
      setJob((current) => current?.status === 'running' ? null : current);
      setError(startError instanceof Error ? startError.message : 'Unable to start policy discovery.');
    } finally {
      setActionId(null);
    }
  };

  const reviewCandidate = async (
    candidate: PolicyDiscoveryCandidate,
    decision: 'approve' | 'reject'
  ) => {
    setError('');
    setActionId(`${candidate.id}:${decision}`);
    try {
      const response = await fetch('/api/admin/policy-discovery', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId: candidate.id, decision }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || `Unable to ${decision} candidate.`);
      await loadDiscovery();
      await onPoliciesChanged();
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'Unable to save the review decision.');
    } finally {
      setActionId(null);
    }
  };

  const runFirstScan = async () => {
    setError('');
    try {
      await onRunFirstScan?.();
      setFirstScanLaunched(true);
      onWorkflowStateChange?.(false);
    } catch (scanError) {
      onWorkflowStateChange?.(true);
      setError(scanError instanceof Error ? scanError.message : 'Unable to start the first monitoring scan.');
    }
  };

  if (!loading && !uiState.showWorkspace) return null;

  return (
    <section className={`${styles.discoveryWorkspace} ${compact ? styles.discoveryWorkspaceCompact : ''}`} aria-labelledby={`discovery-title-${companyId}`}>
      <header className={styles.discoveryHeader}>
        <div className={styles.discoveryHeading}>
          <span className={styles.discoveryIcon}><FileSearch size={19} aria-hidden="true" /></span>
          <div>
            <span className={styles.discoveryEyebrow}>Discovery workspace</span>
            <h3 id={`discovery-title-${companyId}`}>{companyName} policy onboarding</h3>
            <p>Find official sources, make a human decision, then establish the first monitored baseline, all here.</p>
          </div>
        </div>
        {isAdmin && job?.status !== 'running' && policyCount === 0 && (
          <button type="button" className={`${styles.btn} ${styles.btnSecondary} ${styles.btnInline}`} onClick={() => void startDiscovery()} disabled={actionId === 'discovery'}>
            <Search size={15} aria-hidden="true" />
            {job?.status === 'failed' ? 'Retry discovery' : candidates.length > 0 ? 'Discover again' : 'Discover policies'}
          </button>
        )}
      </header>

      <ol className={styles.discoveryRail} aria-label="Policy onboarding progress">
        {stages.map((stage, index) => (
          <li key={stage.label} className={`${styles.discoveryStage} ${styles[`discoveryStage_${stage.state}`]}`} aria-current={stage.state === 'current' ? 'step' : undefined}>
            <span className={styles.discoveryStageMarker}>{stage.state === 'complete' ? <Check size={15} aria-hidden="true" /> : index + 1}</span>
            <span><strong>{index + 1} {stage.label}</strong><small>{stage.detail}</small></span>
          </li>
        ))}
      </ol>

      {loading && (
        <div className={styles.discoveryLoading} role="status">
          <RefreshCw size={16} className={styles.spinIcon} aria-hidden="true" /> Loading saved discovery status…
        </div>
      )}

      {job?.status === 'running' && (
        <div className={styles.discoveryProgress} role="status" aria-live="polite">
          <RefreshCw size={18} className={styles.spinIcon} aria-hidden="true" />
          <div><strong>Discovery is running</strong><span>This can take several minutes. Results will appear here automatically while the five retrieval levels check the company site, legal hubs, robots.txt, sitemaps, VPS renderer, Wayback and Common Crawl.</span></div>
        </div>
      )}

      {(error || job?.status === 'failed') && (
        <div className={`${styles.alert} ${styles.alertDanger} ${styles.discoveryAlert}`} role="alert">
          <AlertTriangle size={16} aria-hidden="true" />
          <div><strong>Discovery could not complete.</strong><span>{error || job?.error || 'The service did not return a usable result.'} Retry, or use Company Manager for manual fallback.</span></div>
          {isAdmin && <button type="button" className={`${styles.btn} ${styles.btnSecondary} ${styles.btnInline}`} onClick={() => void startDiscovery()}>Retry</button>}
          <Link href={`/admin/companies#company-${companyId}`} className={styles.discoveryFallbackLink}>Open Company Manager</Link>
        </div>
      )}

      {!loading && job?.status === 'completed' && candidates.length === 0 && (
        <div className={styles.discoveryEmpty}>
          <FileSearch size={22} aria-hidden="true" />
          <div><strong>No verified policy sources were found.</strong><span>Retry the search, or open Company Manager to add a confirmed official source manually.</span></div>
          <Link href={`/admin/companies#company-${companyId}`}>Open manual fallback</Link>
        </div>
      )}

      {candidates.length > 0 && (
        <div className={styles.discoveryCandidates}>
          <div className={styles.discoveryCandidateSummary}>
            <span><ShieldCheck size={15} aria-hidden="true" /> {candidates.length} discovered {candidates.length === 1 ? 'source' : 'sources'}</span>
            <span>{proposedCount} awaiting review · {approvedCount} approved</span>
          </div>
          {candidates.map((candidate) => (
            <article key={candidate.id} className={styles.discoveryCandidate}>
              <div className={styles.discoveryCandidateMain}>
                <div className={styles.discoveryCandidateTitleRow}>
                  <h4>{candidate.name}</h4>
                  <span className={`${styles.badge} ${styles.badgeSecondary}`}>{candidate.type}</span>
                  <span className={`${styles.badge} ${styles.badgePrimary}`}>{candidate.jurisdiction}</span>
                  <span className={`${styles.badge} ${styles.badgeNeutral}`}>{candidate.confidence}% confidence</span>
                  <span className={`${styles.badge} ${candidate.status === 'Approved' ? styles.badgeSuccess : candidate.status === 'Rejected' ? styles.badgeError : styles.badgeWarning}`}>{candidate.status}</span>
                </div>
                <a href={candidate.url} target="_blank" rel="noopener noreferrer" className={styles.discoveryCandidateUrl}>
                  {candidate.url}<ExternalLink size={12} aria-hidden="true" />
                </a>
                <p>{candidate.reason}</p>
                <dl className={styles.discoveryEvidenceMeta}>
                  <div><dt>Retrieved by</dt><dd>{candidate.retrievalSource}</dd></div>
                  <div><dt>Found via</dt><dd>{candidate.discoverySource}</dd></div>
                </dl>
              </div>
              {isAdmin && candidate.status === 'Proposed' && (
                <div className={styles.discoveryCandidateActions}>
                  <button type="button" className={`${styles.btn} ${styles.btnSmall} ${styles.btnPrimary}`} onClick={() => void reviewCandidate(candidate, 'approve')} disabled={actionId?.startsWith(candidate.id)}>
                    <CheckCircle2 size={14} aria-hidden="true" /> Approve source
                  </button>
                  <button type="button" className={`${styles.btn} ${styles.btnSmall} ${styles.btnDangerOutline}`} onClick={() => void reviewCandidate(candidate, 'reject')} disabled={actionId?.startsWith(candidate.id)}>
                    <XCircle size={14} aria-hidden="true" /> Reject source
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {uiState.showFirstScanAction && onRunFirstScan && (
        <div className={styles.discoveryNextAction}>
          <div><CheckCircle2 size={20} aria-hidden="true" /><span><strong>Human review complete</strong><small>{policyCount} approved {policyCount === 1 ? 'policy is' : 'policies are'} ready for monitoring.</small></span></div>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary} ${styles.btnInline}`} onClick={() => void runFirstScan()} disabled={scanRunning}>
            {scanRunning ? <RefreshCw size={16} className={styles.spinIcon} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
            {scanRunning ? 'Starting scan…' : 'Run first monitoring scan'}
          </button>
        </div>
      )}
    </section>
  );
}
