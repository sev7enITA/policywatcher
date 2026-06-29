'use client';

/**
 * Timeline — /timeline
 *
 * The public "git log of tech policy": a chronological, filterable view
 * of ALL policy changes across ALL monitored companies.
 *
 * Fetches from /api/changes (paginated, filtered). Supports:
 *  - Free-text search (q)
 *  - Industry dropdown
 *  - Risk level toggles
 *  - KPI filter (grouped by category)
 *  - Date range (from/to)
 *  - "Load More" pagination
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  Search,
  Clock,
  ArrowRight,
  Filter,
  XCircle,
  Shield,
  Building2,
  TrendingUp,
} from 'lucide-react';
import styles from './timeline.module.css';
import {
  IconKpiAi,
  IconKpiLegal,
  IconKpiPrivacy,
  IconShieldScan,
} from '@/components/icons/PolicyWatcherIcons';

/* ---------- Types ---------- */
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

/* ---------- Constants ---------- */
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

/* ---------- Component ---------- */
export default function TimelinePage() {
  const [changes, setChanges] = useState<TimelineChange[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Filters
  const [query, setQuery] = useState('');
  const [industry, setIndustry] = useState('');
  const [risk, setRisk] = useState('');
  const [kpi, setKpi] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasFilters = !!(query || industry || risk || kpi || fromDate || toDate);
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

  /* ---------- Fetch ---------- */
  const fetchChanges = useCallback(
    async (pageNum: number, append = false) => {
      if (!append) setLoading(true);
      else setLoadingMore(true);

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

        const res = await fetch(`/api/changes?${params.toString()}`);
        const data: ApiResponse = await res.json();

        if (append) {
          setChanges((prev) => [...prev, ...data.changes]);
        } else {
          setChanges(data.changes);
        }
        setTotal(data.total);
        setPage(data.page);
        setTotalPages(data.totalPages);
      } catch {
        console.error('Failed to fetch timeline');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [query, industry, risk, kpi, fromDate, toDate]
  );

  // Initial load + filter changes
  useEffect(() => {
    queueMicrotask(() => {
      void fetchChanges(1, false);
    });
  }, [fetchChanges]);

  // Debounced search
  const handleSearchChange = (value: string) => {
    setQuery(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      // fetchChanges triggered via useEffect above
    }, 350);
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
    if (page < totalPages && !loadingMore) {
      fetchChanges(page + 1, true);
    }
  };

  /* ---------- Render ---------- */
  return (
    <>
      {/* Hero */}
      <div className={styles.hero}>
        <h1 className={styles.heroTitle}>Policy Change Archive</h1>
        <p className={styles.heroSub}>
          Every policy change, every company, on a single timeline.
          The public record of how tech companies rewrite the rules.
        </p>
        <div className={styles.heroStats}>
          <div className={styles.heroStat}>
            <span className={styles.heroStatNum}>{total}</span>
            <span className={styles.heroStatLabel}>Changes Tracked</span>
          </div>
          <div className={styles.heroStat}>
            <span className={styles.heroStatNum}>
              {new Set(changes.map((c) => c.policy.company.id)).size || '—'}
            </span>
            <span className={styles.heroStatLabel}>Companies</span>
          </div>
          <div className={styles.heroStat}>
            <span className={styles.heroStatNum}>
              {new Set(changes.map((c) => c.policy.jurisdiction)).size || '—'}
            </span>
            <span className={styles.heroStatLabel}>Jurisdictions</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className={styles.filterBar}>
        <div className={styles.filterInner}>
          {/* Search */}
          <div className={styles.searchWrap}>
            <Search size={14} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search changes... (e.g. biometric, data retention, GDPR)"
              value={query}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>

          {/* Industry */}
          <select
            className={styles.filterSelect}
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
          >
            {INDUSTRIES.map((i) => (
              <option key={i.value} value={i.value}>
                {i.label}
              </option>
            ))}
          </select>

          {/* KPI */}
          <div className={styles.kpiSelectWrap}>
            <span className={styles.kpiSelectIcon}>{renderKpiIcon(selectedKpi.category)}</span>
            <select
              className={`${styles.filterSelect} ${styles.kpiSelect}`}
              value={kpi}
              onChange={(e) => setKpi(e.target.value)}
              aria-label="KPI filter"
            >
              {KPI_OPTIONS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
          </div>

          {/* Risk toggles */}
          <div className={styles.riskToggles}>
            {RISKS.map((r) => (
              <button
                key={r}
                className={risk === r ? styles.riskToggleActive : styles.riskToggle}
                data-risk={r}
                onClick={() => setRisk(risk === r ? '' : r)}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Date from */}
          <input
            type="date"
            className={styles.filterSelect}
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            title="From date"
          />
          <input
            type="date"
            className={styles.filterSelect}
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            title="To date"
          />

          {/* Clear */}
          {hasFilters && (
            <button className={styles.clearBtn} onClick={clearFilters}>
              <XCircle size={12} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Active filters info */}
      {hasFilters && !loading && (
        <div className={styles.activeFilters}>
          <Filter size={13} />
          <span className={styles.filterCount}>
            {total} result{total !== 1 ? 's' : ''}
          </span>
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

      {/* Timeline */}
      <div className={styles.timelineWrap}>
        {loading ? (
          /* Loading skeletons */
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.timelineItem} style={{ animationDelay: `${i * 0.08}s` }}>
              <div className={styles.skeleton} />
            </div>
          ))
        ) : changes.length === 0 ? (
          /* Empty state */
          <div className={styles.emptyState}>
            <Shield size={48} className={styles.emptyIcon} />
            <h3 className={styles.emptyTitle}>No changes found</h3>
            <p className={styles.emptyText}>
              {hasFilters
                ? 'Try adjusting your filters or search query.'
                : 'No policy changes have been recorded yet.'}
            </p>
          </div>
        ) : (
          <>
            {changes.map((change, index) => {
              const company = change.policy.company;
              const logoColor = company.logo || '#6366f1';
              const initials = company.name
                .split(/\s+/)
                .map((w) => w[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);
              const tldr =
                change.tldrEn ||
                change.aiSummaryEn?.substring(0, 180) ||
                'Policy change detected.';
              const date = new Date(change.createdAt)
                .toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                });

              return (
                <div
                  key={change.id}
                  className={styles.timelineItem}
                  style={{ animationDelay: `${index * 0.06}s` }}
                >
                  <div className={styles.timelineDot} data-risk={change.overallRisk} />

                  <Link href={`/change/${change.id}`} className={styles.timelineCard}>
                    <div className={styles.cardHeader}>
                      <div
                        className={styles.cardLogo}
                        style={{ background: logoColor }}
                      >
                        {initials}
                      </div>
                      <div>
                        <div className={styles.cardCompany}>{company.name}</div>
                        <div className={styles.cardPolicy}>
                          {change.policy.name} · {change.policy.type}
                        </div>
                      </div>
                    </div>

                    <div className={styles.cardMeta}>
                      <span className={styles.cardDate}>
                        <Clock size={11} />
                        {date}
                      </span>
                      <span className={styles.cardRiskPill} data-risk={change.overallRisk}>
                        {change.overallRisk}
                      </span>
                      <span className={styles.cardScore} data-risk={change.overallRisk}>
                        {change.overallScore}/10
                      </span>
                      <span className={styles.cardIndustry}>{company.industry}</span>
                    </div>

                    <p className={styles.cardTldr}>{tldr}</p>

                    <div className={styles.cardArrow}>
                      <TrendingUp size={12} />
                      View full analysis
                      <ArrowRight size={12} />
                    </div>
                  </Link>
                </div>
              );
            })}

            {/* Load More */}
            {page < totalPages && (
              <div className={styles.loadMore}>
                <button
                  className={styles.loadMoreBtn}
                  onClick={loadMore}
                  disabled={loadingMore}
                >
                  <Building2 size={14} />
                  {loadingMore ? 'Loading...' : `Load More (${total - changes.length} remaining)`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
