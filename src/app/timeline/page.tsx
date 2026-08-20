'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  Database,
  Filter,
  History,
  MapPin,
  Network,
  RefreshCw,
  Search,
  Server,
  Shield,
  ShieldCheck,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import Footer from '@/components/Footer';
import PublicHeader from '@/components/PublicHeader';
import {
  IconKpiAi,
  IconKpiLegal,
  IconKpiPrivacy,
  IconShieldScan,
} from '@/components/icons/PolicyWatcherIcons';
import { loadPublicDataSource } from '@/lib/dataSourceRegistry';
import type {
  SourceContinuityEvent,
  SourceContinuityResponse,
  SourceContinuityRequestStatus,
  SourceContinuityRequestTrigger,
  SourceContinuityState,
} from '@/lib/sourceContinuity';
import { canStartSourceContinuityRequest } from '@/lib/sourceContinuity';
import styles from './timeline.module.css';

interface TimelineChange {
  id: string;
  overallRisk: string;
  overallScore: number;
  tldrEn: string | null;
  tldrIt: string | null;
  aiSummaryEn: string | null;
  aiSummaryIt: string | null;
  createdAt: string;
  policy: {
    id: string;
    name: string;
    type: string;
    jurisdiction: string;
    company: {
      id: string;
      name: string;
      industry: string;
      logo: string | null;
      slug: string;
    };
  };
}

interface ApiResponse {
  changes: TimelineChange[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

type KpiCategory = 'all' | 'privacy' | 'ai' | 'legal';
type TimelineView = 'policy-changes' | 'source-continuity';

const INDUSTRIES = [
  { value: '', label: 'All Industries' },
  { value: 'Tech Giant', label: 'Tech Giant' },
  { value: 'FinTech', label: 'FinTech' },
  { value: 'Social Media', label: 'Social Media' },
  { value: 'E-Commerce', label: 'E-Commerce' },
  { value: 'AI Provider', label: 'AI Provider' },
  { value: 'Cloud/SaaS', label: 'Cloud/SaaS' },
];

const KPI_OPTIONS: Array<{ value: string; label: string; category: KpiCategory }> = [
  { value: '', label: 'All KPIs', category: 'all' },
  { value: 'kpiDataCollection', label: 'Data Collection', category: 'privacy' },
  { value: 'kpiThirdPartySharing', label: 'Third-Party Sharing', category: 'privacy' },
  { value: 'kpiDataRetention', label: 'Data Retention', category: 'privacy' },
  { value: 'kpiRightToDeletion', label: 'Right to Deletion', category: 'privacy' },
  { value: 'kpiCrossBorderTransfer', label: 'Cross-Border Transfer', category: 'privacy' },
  { value: 'kpiAiTrainingOptOut', label: 'AI Training Opt-Out', category: 'ai' },
  { value: 'kpiAiOutputOwnership', label: 'AI Output Ownership', category: 'ai' },
  { value: 'kpiAlgoTransparency', label: 'Algo Transparency', category: 'ai' },
  { value: 'kpiAutomatedDecision', label: 'Automated Decisions', category: 'ai' },
  { value: 'kpiAiBiasFairness', label: 'AI Bias & Fairness', category: 'ai' },
  { value: 'kpiConsentMechanism', label: 'Consent Mechanism', category: 'legal' },
  { value: 'kpiRegulatoryCompliance', label: 'Regulatory Compliance', category: 'legal' },
  { value: 'kpiBreachNotification', label: 'Breach Notification', category: 'legal' },
  { value: 'kpiIndependentAudit', label: 'Independent Audit', category: 'legal' },
  { value: 'kpiContentModeration', label: 'Content Moderation', category: 'legal' },
];

const RISKS = ['High', 'Medium', 'Low'] as const;
const PAGE_SIZE = 12;
const CONTINUITY_BATCH_SIZE = 12;

const CONTINUITY_STATE_OPTIONS: Array<{ value: '' | SourceContinuityState; label: string }> = [
  { value: '', label: 'All recorded states' },
  { value: 'verified', label: 'Verified retrieval' },
  { value: 'recovered', label: 'Verified recovery' },
  { value: 'partial', label: 'Partial retrieval' },
  { value: 'unavailable', label: 'Unavailable' },
  { value: 'needs_review', label: 'Needs review' },
  { value: 'baseline_pending', label: 'Baseline pending' },
];

const STATE_LABELS: Record<SourceContinuityState, string> = {
  verified: 'Verified retrieval',
  recovered: 'Verified recovery',
  partial: 'Partial retrieval',
  unavailable: 'Unavailable',
  needs_review: 'Needs review',
  baseline_pending: 'Baseline pending',
};

const CAUSE_LABELS: Record<SourceContinuityEvent['cause'], string> = {
  verified_retrieval: 'Verified retrieval',
  incomplete_retrieval: 'Incomplete retrieval',
  retrieval_unavailable: 'Retrieval unavailable',
  quality_review_required: 'Quality review required',
  baseline_verification_pending: 'Baseline verification pending',
};

function formatEventDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

function ContinuityStateIcon({ state }: { state: SourceContinuityState }) {
  if (state === 'verified' || state === 'recovered') return <CheckCircle2 size={16} />;
  if (state === 'unavailable') return <AlertTriangle size={16} />;
  if (state === 'partial' || state === 'baseline_pending') return <Clock size={16} />;
  return <ShieldCheck size={16} />;
}

export default function TimelinePage() {
  const [activeView, setActiveView] = useState<TimelineView>('policy-changes');
  const [changes, setChanges] = useState<TimelineChange[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [changesError, setChangesError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [industry, setIndustry] = useState('');
  const [risk, setRisk] = useState('');
  const [kpi, setKpi] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [continuity, setContinuity] = useState<SourceContinuityResponse | null>(null);
  const [continuityStatus, setContinuityStatus] = useState<SourceContinuityRequestStatus>('idle');
  const [continuityError, setContinuityError] = useState<string | null>(null);
  const [continuityQuery, setContinuityQuery] = useState('');
  const [continuityState, setContinuityState] = useState<'' | SourceContinuityState>('');
  const [visibleContinuityCount, setVisibleContinuityCount] = useState(CONTINUITY_BATCH_SIZE);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const continuityStatusRef = useRef<SourceContinuityRequestStatus>('idle');
  const continuityMountedRef = useRef(true);
  const hasFilters = Boolean(query || industry || risk || kpi || fromDate || toDate);
  const selectedKpi = KPI_OPTIONS.find((option) => option.value === kpi) || KPI_OPTIONS[0];

  const renderKpiIcon = (category: KpiCategory, size = 15) => {
    switch (category) {
      case 'privacy':
        return <IconKpiPrivacy size={size} color="#0f766e" />;
      case 'ai':
        return <IconKpiAi size={size} color="#6366f1" />;
      case 'legal':
        return <IconKpiLegal size={size} color="#92400e" />;
      default:
        return <IconShieldScan size={size} color="#64748b" />;
    }
  };

  const fetchChanges = useCallback(
    async (pageNum: number, append = false) => {
      if (!append) setLoading(true);
      else setLoadingMore(true);
      setChangesError(null);

      try {
        const params = new URLSearchParams();
        params.set('page', String(pageNum));
        params.set('pageSize', String(PAGE_SIZE));
        if (query.length >= 3) params.set('q', query);
        if (industry) params.set('industry', industry);
        if (risk) params.set('risk', risk);
        if (kpi) params.set('kpi', kpi);
        if (fromDate) params.set('from', fromDate);
        if (toDate) params.set('to', toDate);

        const response = await fetch(`/api/changes?${params.toString()}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data: ApiResponse = await response.json();

        setChanges((previous) => (append ? [...previous, ...data.changes] : data.changes));
        setTotal(data.total);
        setPage(data.page);
        setTotalPages(data.totalPages);
      } catch {
        setChangesError('The policy-change archive is temporarily unavailable. Please try again.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [query, industry, risk, kpi, fromDate, toDate]
  );

  const fetchContinuity = useCallback(async (trigger: SourceContinuityRequestTrigger) => {
    if (!canStartSourceContinuityRequest(continuityStatusRef.current, trigger)) return;
    continuityStatusRef.current = 'loading';
    setContinuityStatus('loading');
    setContinuityError(null);
    try {
      const result = await loadPublicDataSource<SourceContinuityResponse>('sourceContinuity');
      if (!continuityMountedRef.current) return;
      setContinuity(result.data);
      continuityStatusRef.current = 'success';
      setContinuityStatus('success');
    } catch {
      if (!continuityMountedRef.current) return;
      continuityStatusRef.current = 'error';
      setContinuityStatus('error');
      setContinuityError('The source-continuity ledger is temporarily unavailable. Please try again.');
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchChanges(1, false);
    });
  }, [fetchChanges]);

  useEffect(() => {
    if (activeView !== 'source-continuity' || continuityStatusRef.current !== 'idle') return;
    void fetchContinuity('activation');
  }, [activeView, fetchContinuity]);

  useEffect(() => {
    continuityMountedRef.current = true;
    return () => {
      continuityMountedRef.current = false;
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, []);

  const filteredContinuityEvents = useMemo(() => {
    if (!continuity) return [];
    const needle = continuityQuery.trim().toLowerCase();
    return continuity.events.filter((event) => {
      if (continuityState && event.state !== continuityState) return false;
      if (!needle) return true;
      return [
        event.company.name,
        event.company.industry,
        event.policy.name,
        event.policy.type,
        event.policy.jurisdiction,
        event.policy.sourceHost,
        event.state,
        event.cause,
        event.retrievalChannel,
      ].some((value) => value?.toLowerCase().includes(needle));
    });
  }, [continuity, continuityQuery, continuityState]);

  const visibleContinuityEvents = filteredContinuityEvents.slice(0, visibleContinuityCount);
  const remainingContinuityEvents = Math.max(
    0,
    filteredContinuityEvents.length - visibleContinuityEvents.length
  );

  const handleSearchChange = (value: string) => {
    setQuery(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => undefined, 350);
  };

  const clearFilters = () => {
    setQuery('');
    setIndustry('');
    setRisk('');
    setKpi('');
    setFromDate('');
    setToDate('');
  };

  const loadMore = () => {
    if (page < totalPages && !loadingMore) void fetchChanges(page + 1, true);
  };

  const handleViewKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const nextView: TimelineView =
      event.key === 'ArrowRight' || event.key === 'End'
        ? 'source-continuity'
        : 'policy-changes';
    setActiveView(nextView);
    document.getElementById(`${nextView}-tab`)?.focus();
  };

  const continuityHasFilters = Boolean(continuityQuery || continuityState);
  const heroStats = activeView === 'policy-changes'
    ? [
        { value: total, label: 'Changes tracked' },
        {
          value: new Set(changes.map((change) => change.policy.company.id)).size || 'N/A',
          label: 'Companies',
        },
        {
          value: new Set(changes.map((change) => change.policy.jurisdiction)).size || 'N/A',
          label: 'Jurisdictions',
        },
      ]
    : [
        { value: continuity?.eventCount ?? 'Pending', label: 'Recorded transitions' },
        { value: continuity?.sourceCount ?? 'Pending', label: 'Affected sources' },
        { value: continuity?.recoveredCount ?? 'Pending', label: 'Verified recoveries' },
      ];

  return (
    <>
      <PublicHeader current="timeline" />
      <header className={styles.hero}>
        <h1 className={styles.heroTitle}>Policy Evidence Timeline</h1>
        <p className={styles.heroSub}>
          Inspect two separate public records: what a provider changed, and whether PolicyWatcher
          could verify the configured source. A source interruption is not a provider-policy finding.
        </p>
        <div className={styles.heroStats} aria-live="polite">
          {heroStats.map((stat) => (
            <div className={styles.heroStat} key={stat.label}>
              <span className={styles.heroStatNum}>{stat.value}</span>
              <span className={styles.heroStatLabel}>{stat.label}</span>
            </div>
          ))}
        </div>
      </header>

      <nav className={styles.viewSwitcherShell} aria-label="Timeline record type">
        <div
          className={styles.viewSwitcher}
          role="tablist"
          aria-label="Choose timeline record"
          onKeyDown={handleViewKeyDown}
        >
          <button
            type="button"
            id="policy-changes-tab"
            role="tab"
            aria-selected={activeView === 'policy-changes'}
            aria-controls="policy-changes-panel"
            tabIndex={activeView === 'policy-changes' ? 0 : -1}
            className={styles.viewTab}
            data-active={activeView === 'policy-changes'}
            onClick={() => setActiveView('policy-changes')}
          >
            <History size={17} />
            Policy changes
          </button>
          <button
            type="button"
            id="source-continuity-tab"
            role="tab"
            aria-selected={activeView === 'source-continuity'}
            aria-controls="source-continuity-panel"
            tabIndex={activeView === 'source-continuity' ? 0 : -1}
            className={styles.viewTab}
            data-active={activeView === 'source-continuity'}
            onClick={() => setActiveView('source-continuity')}
          >
            <Database size={17} />
            Source continuity
          </button>
        </div>
      </nav>

      {activeView === 'policy-changes' ? (
        <main id="policy-changes-panel" role="tabpanel" aria-labelledby="policy-changes-tab">
          <div className={styles.filterBar}>
            <div className={styles.filterInner}>
              <div className={styles.searchWrap}>
                <Search size={14} className={styles.searchIcon} />
                <input
                  type="search"
                  className={styles.searchInput}
                  placeholder="Search changes... (e.g. biometric, data retention, GDPR)"
                  value={query}
                  onChange={(event) => handleSearchChange(event.target.value)}
                  aria-label="Search policy changes"
                />
              </div>

              <select
                className={styles.filterSelect}
                value={industry}
                onChange={(event) => setIndustry(event.target.value)}
                aria-label="Industry filter"
              >
                {INDUSTRIES.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>

              <div className={styles.kpiSelectWrap}>
                <span className={styles.kpiSelectIcon}>{renderKpiIcon(selectedKpi.category)}</span>
                <select
                  className={`${styles.filterSelect} ${styles.kpiSelect}`}
                  value={kpi}
                  onChange={(event) => setKpi(event.target.value)}
                  aria-label="KPI filter"
                >
                  {KPI_OPTIONS.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </div>

              <div className={styles.riskToggles} aria-label="Risk filter">
                {RISKS.map((item) => (
                  <button
                    type="button"
                    key={item}
                    className={risk === item ? styles.riskToggleActive : styles.riskToggle}
                    data-risk={item}
                    aria-pressed={risk === item}
                    onClick={() => setRisk(risk === item ? '' : item)}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <input
                type="date"
                className={styles.filterSelect}
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                aria-label="From date"
              />
              <input
                type="date"
                className={styles.filterSelect}
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
                aria-label="To date"
              />

              {hasFilters && (
                <button type="button" className={styles.clearBtn} onClick={clearFilters}>
                  <XCircle size={12} /> Clear
                </button>
              )}
            </div>
          </div>

          {hasFilters && !loading && (
            <div className={styles.activeFilters}>
              <Filter size={13} />
              <span className={styles.filterCount}>{total} result{total !== 1 ? 's' : ''}</span>
              {query && <span className={styles.filterChip}>&quot;{query}&quot;</span>}
              {industry && <span className={styles.filterChip}>{industry}</span>}
              {risk && <span className={styles.filterChip}>{risk} Risk</span>}
              {kpi && (
                <span className={`${styles.filterChip} ${styles.kpiFilterChip}`}>
                  {renderKpiIcon(selectedKpi.category, 14)}
                  {selectedKpi.label || kpi}
                </span>
              )}
            </div>
          )}

          <div className={styles.timelineWrap}>
            {loading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className={styles.timelineItem} style={{ animationDelay: `${index * 0.08}s` }}>
                  <div className={styles.skeleton} />
                </div>
              ))
            ) : changesError ? (
              <div className={styles.emptyState} role="alert">
                <AlertTriangle size={44} className={styles.emptyIcon} />
                <h2 className={styles.emptyTitle}>Archive unavailable</h2>
                <p className={styles.emptyText}>{changesError}</p>
                <button type="button" className={styles.retryButton} onClick={() => void fetchChanges(1)}>
                  <RefreshCw size={14} /> Retry
                </button>
              </div>
            ) : changes.length === 0 ? (
              <div className={styles.emptyState}>
                <Shield size={48} className={styles.emptyIcon} />
                <h2 className={styles.emptyTitle}>No evidence-gated changes available</h2>
                <p className={styles.emptyText}>
                  {hasFilters
                    ? 'Try adjusting your filters or search query.'
                    : 'Sources that have not passed the publication gate do not expose policy-change analysis.'}
                </p>
              </div>
            ) : (
              <>
                {changes.map((change, index) => {
                  const company = change.policy.company;
                  const initials = company.name.split(/\s+/).map((word) => word[0]).join('').toUpperCase().slice(0, 2);
                  const tldr = change.tldrEn || change.aiSummaryEn?.substring(0, 180) || 'Policy change detected.';
                  const date = new Date(change.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'short', day: 'numeric',
                  });

                  return (
                    <article
                      key={change.id}
                      className={styles.timelineItem}
                      style={{ animationDelay: `${index * 0.06}s` }}
                    >
                      <div className={styles.timelineDot} data-risk={change.overallRisk} />
                      <Link href={`/change/${change.id}`} className={styles.timelineCard}>
                        <div className={styles.cardHeader}>
                          <div className={styles.cardLogo} style={{ background: company.logo || '#6366f1' }}>
                            {initials}
                          </div>
                          <div>
                            <div className={styles.cardCompany}>{company.name}</div>
                            <div className={styles.cardPolicy}>{change.policy.name} / {change.policy.type}</div>
                          </div>
                        </div>
                        <div className={styles.cardMeta}>
                          <span className={styles.cardDate}><Clock size={11} />{date}</span>
                          <span className={styles.cardRiskPill} data-risk={change.overallRisk}>{change.overallRisk}</span>
                          <span className={styles.cardScore} data-risk={change.overallRisk}>{change.overallScore}/10</span>
                          <span className={styles.cardIndustry}>{company.industry}</span>
                        </div>
                        <p className={styles.cardTldr}>{tldr}</p>
                        <div className={styles.cardArrow}>
                          <TrendingUp size={12} /> View full analysis <ArrowRight size={12} />
                        </div>
                      </Link>
                    </article>
                  );
                })}

                {page < totalPages && (
                  <div className={styles.loadMore}>
                    <button type="button" className={styles.loadMoreBtn} onClick={loadMore} disabled={loadingMore}>
                      <Building2 size={14} />
                      {loadingMore ? 'Loading...' : `Load More (${total - changes.length} remaining)`}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      ) : (
        <main
          id="source-continuity-panel"
          role="tabpanel"
          aria-labelledby="source-continuity-tab"
          className={styles.continuityMain}
        >
          <section className={styles.evidenceBoundary} aria-labelledby="continuity-boundary-title">
            <ShieldCheck size={22} aria-hidden="true" />
            <div>
              <h2 id="continuity-boundary-title">Evidence boundaries</h2>
              <p>
                {continuity?.limitationEn || 'This operational ledger reports source retrieval and publication state. It does not assess a provider policy, service, legality or compliance.'}
              </p>
              {continuity && continuity.currentWithheldCount > 0 && (
                <span>{continuity.currentWithheldCount} source{continuity.currentWithheldCount === 1 ? '' : 's'} currently end in a withheld state.</span>
              )}
            </div>
          </section>

          <section className={styles.continuityControls} aria-label="Source continuity filters">
            <div className={styles.continuitySearch}>
              <Search size={16} aria-hidden="true" />
              <input
                type="search"
                value={continuityQuery}
                onChange={(event) => {
                  setContinuityQuery(event.target.value);
                  setVisibleContinuityCount(CONTINUITY_BATCH_SIZE);
                }}
                placeholder="Search company, policy, host or jurisdiction"
                aria-label="Search source continuity"
              />
            </div>
            <select
              value={continuityState}
              onChange={(event) => {
                setContinuityState(event.target.value as '' | SourceContinuityState);
                setVisibleContinuityCount(CONTINUITY_BATCH_SIZE);
              }}
              aria-label="Recorded state filter"
            >
              {CONTINUITY_STATE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            {continuityHasFilters && (
              <button
                type="button"
                className={styles.clearContinuity}
                onClick={() => {
                  setContinuityQuery('');
                  setContinuityState('');
                  setVisibleContinuityCount(CONTINUITY_BATCH_SIZE);
                }}
              >
                <XCircle size={14} /> Clear
              </button>
            )}
          </section>

          <div className={styles.continuityResultLine} role="status" aria-live="polite">
            {continuityStatus === 'loading' && 'Loading sanitized continuity metadata'}
            {continuityStatus === 'error' && 'Source continuity is temporarily unavailable.'}
            {continuityStatus === 'success' && continuity &&
              `${filteredContinuityEvents.length} of ${continuity.eventCount} recorded transitions`}
            {continuityStatus === 'idle' && 'Source continuity has not been requested yet.'}
          </div>

          <section className={styles.continuityLedger} aria-label="Source continuity ledger">
            {continuityStatus === 'loading' ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div className={styles.continuitySkeleton} key={index} />
              ))
            ) : continuityError ? (
              <div className={styles.continuityStatePanel} role="alert">
                <AlertTriangle size={34} />
                <h2>Ledger unavailable</h2>
                <p>{continuityError}</p>
                <button type="button" className={styles.retryButton} onClick={() => void fetchContinuity('retry')}>
                  <RefreshCw size={14} /> Retry
                </button>
              </div>
            ) : filteredContinuityEvents.length === 0 ? (
              <div className={styles.continuityStatePanel}>
                <Database size={34} />
                <h2>No matching continuity transitions</h2>
                <p>
                  {continuityHasFilters
                    ? 'Adjust the search or state filter. No hidden evidence is opened by this view.'
                    : 'No qualified source-state transition is currently available in the bounded public record.'}
                </p>
              </div>
            ) : (
              <>
              {visibleContinuityEvents.map((event) => (
                <article className={styles.continuityCard} data-state={event.state} key={event.id}>
                  <div className={styles.continuityCardLead}>
                    <div className={styles.continuityIdentity}>
                      <span className={styles.continuityCompany}>{event.company.name}</span>
                      <h2>{event.policy.name}</h2>
                      <span className={styles.continuityType}>{event.policy.type}</span>
                    </div>
                    <div className={styles.continuityStateBadge} data-state={event.state}>
                      <ContinuityStateIcon state={event.state} />
                      {STATE_LABELS[event.state]}
                    </div>
                  </div>

                  <div className={styles.continuityMeta}>
                    <span><Clock size={14} />{formatEventDate(event.checkedAt)}</span>
                    <span><Server size={14} />{event.policy.sourceHost || 'Configured host unavailable'}</span>
                    <span><MapPin size={14} />{event.policy.jurisdiction}</span>
                    <span><Network size={14} />{event.retrievalChannel}</span>
                  </div>

                  <div className={styles.continuityCardFoot}>
                    <div>
                      <span className={styles.metaLabel}>Standardized cause</span>
                      <strong>{CAUSE_LABELS[event.cause]}</strong>
                    </div>
                    <div>
                      <span className={styles.metaLabel}>Public snapshot evidence</span>
                      <strong>{event.hasPublicSnapshotEvidence ? 'Available separately' : 'Not exposed'}</strong>
                    </div>
                    <div>
                      <span className={styles.metaLabel}>Evidence currentness</span>
                      <strong>{event.currentness === 'verified' ? 'Verified at this transition' : 'Current source not verified'}</strong>
                    </div>
                    {event.lastVerifiedEvidenceAt && (
                      <div>
                        <span className={styles.metaLabel}>Last verified evidence</span>
                        <strong>{formatEventDate(event.lastVerifiedEvidenceAt)}</strong>
                      </div>
                    )}
                    {event.historicalReference && (
                      <div>
                        <span className={styles.metaLabel}>Historical reference only</span>
                        <strong>
                          {event.historicalReference.retrievalChannel} · {formatEventDate(event.historicalReference.capturedAt)} · excluded from change detection
                        </strong>
                      </div>
                    )}
                    {event.isLatestTransition && (
                      <span className={styles.latestMarker}><History size={13} />Current recorded transition</span>
                    )}
                  </div>
                </article>
              ))}
              {remainingContinuityEvents > 0 && (
                <button
                  type="button"
                  className={styles.showMoreContinuity}
                  onClick={() => setVisibleContinuityCount((count) => count + CONTINUITY_BATCH_SIZE)}
                >
                  <Database size={15} />
                  Show {Math.min(CONTINUITY_BATCH_SIZE, remainingContinuityEvents)} more
                  <span>{remainingContinuityEvents} remaining</span>
                </button>
              )}
              </>
            )}
          </section>

          {continuity?.truncated && (
            <aside className={styles.coverageNote}>
              <Database size={18} />
              <p>
                Coverage is bounded to {continuity.maxPolicies} policies and the {continuity.maxLogsPerPolicy} most recent checks per policy. Older records may exist outside this response.
              </p>
            </aside>
          )}
        </main>
      )}
      <Footer lang="en" variant="compact" />
    </>
  );
}
