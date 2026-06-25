'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Database,
  Building2,
  FileText,
  ExternalLink,
  Globe,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react';
import styles from '../admin.module.css';

/* ---------- Types ---------- */

interface PolicyData {
  id: string;
  name: string;
  type: string;
  url: string;
  jurisdiction: string | null;
  currentHash: string | null;
  updatedAt: string;
  _count: {
    changes: number;
    snapshots: number;
  };
}

interface CompanyData {
  id: string;
  name: string;
  slug: string;
  industry: string;
  website: string;
  logo: string | null;
  policies: PolicyData[];
  _count: {
    policies: number;
  };
}

/* ---------- Helpers ---------- */

const TYPE_BADGE_MAP: Record<string, string> = {
  privacy: 'badgePrivacy',
  terms: 'badgeTerms',
  ai: 'badgeAi',
  aup: 'badgeAup',
};

function typeBadgeClass(type: string): string {
  return TYPE_BADGE_MAP[type.toLowerCase()] || 'badgeDefault';
}

function truncateUrl(url: string, maxLen = 40): string {
  try {
    const u = new URL(url);
    const path = u.pathname + u.search;
    const display = u.hostname + path;
    return display.length > maxLen ? display.slice(0, maxLen) + '...' : display;
  } catch {
    return url.length > maxLen ? url.slice(0, maxLen) + '...' : url;
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/* ---------- Component ---------- */

export default function DatabaseInspectorPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  /* Fetch companies on mount */
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/companies', {
          credentials: 'include',
        });

        if (res.status === 401) {
          router.push('/admin/login');
          return;
        }

        if (!res.ok) {
          throw new Error(`Server responded with ${res.status}`);
        }

        const data = await res.json();
        setCompanies(data.companies ?? []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load companies. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router]);

  /* Derived stats */
  const stats = useMemo(() => {
    let totalPolicies = 0;
    let totalChanges = 0;

    for (const c of companies) {
      totalPolicies += c._count.policies;
      for (const p of c.policies) {
        totalChanges += p._count.changes;
      }
    }

    return {
      companies: companies.length,
      policies: totalPolicies,
      changes: totalChanges,
    };
  }, [companies]);

  /* Filtered companies */
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return companies;
    const q = searchQuery.toLowerCase();
    return companies.filter((c) => c.name.toLowerCase().includes(q));
  }, [companies, searchQuery]);

  /* Toggle expand */
  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  /* Loading state */
  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingSpinner} />
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          <span className={styles.pageTitleIcon}>
            <Database size={20} />
          </span>
          Database Inspector
        </h1>
        <p className={styles.pageSubtitle}>
          Browse all monitored companies and policies
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className={styles.errorBanner}>
          <Database size={16} />
          {error}
        </div>
      )}

      {/* Stats Row */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={`${styles.statIconWrap} ${styles.statIconPrimary}`}>
            <Building2 size={20} />
          </div>
          <div>
            <div className={styles.statValue}>{stats.companies}</div>
            <div className={styles.statLabel}>Companies</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIconWrap} ${styles.statIconSecondary}`}>
            <FileText size={20} />
          </div>
          <div>
            <div className={styles.statValue}>{stats.policies}</div>
            <div className={styles.statLabel}>Policies</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIconWrap} ${styles.statIconWarning}`}>
            <Globe size={20} />
          </div>
          <div>
            <div className={styles.statValue}>{stats.changes}</div>
            <div className={styles.statLabel}>Total Changes</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className={styles.searchBar}>
        <Search size={16} className={styles.searchIcon} />
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search companies by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Companies Table */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Industry</th>
              <th>Policies</th>
              <th>Website</th>
              <th style={{ width: 40 }} />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className={styles.emptyState}>
                    <div className={styles.emptyStateIcon}>
                      <Building2 size={40} />
                    </div>
                    <div className={styles.emptyStateText}>
                      {searchQuery
                        ? 'No companies match your search.'
                        : 'No companies found in the database.'}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((company) => {
                const isExpanded = expandedIds.has(company.id);
                return (
                  <CompanyRow
                    key={company.id}
                    company={company}
                    isExpanded={isExpanded}
                    onToggle={() => toggleExpand(company.id)}
                  />
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- Company Row ---------- */

function CompanyRow({
  company,
  isExpanded,
  onToggle,
}: {
  company: CompanyData;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        className={`${styles.companyRow} ${isExpanded ? styles.companyRowExpanded : ''}`}
        onClick={onToggle}
      >
        <td>
          <div className={styles.companyName}>
            <Building2 size={16} />
            {company.name}
          </div>
        </td>
        <td>
          <span className={`${styles.badge} ${styles.badgeIndustry}`}>
            {company.industry}
          </span>
        </td>
        <td>{company._count.policies}</td>
        <td>
          <a
            href={company.website}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.externalLink}
            onClick={(e) => e.stopPropagation()}
          >
            {truncateUrl(company.website, 30)}
            <ExternalLink size={13} />
          </a>
        </td>
        <td>
          <span className={styles.expandIcon}>
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        </td>
      </tr>

      {isExpanded && (
        <tr className={styles.policySection}>
          <td colSpan={5} style={{ padding: 0 }}>
            <PolicySubTable policies={company.policies} />
          </td>
        </tr>
      )}
    </>
  );
}

/* ---------- Policy Sub-Table ---------- */

function PolicySubTable({ policies }: { policies: PolicyData[] }) {
  if (policies.length === 0) {
    return (
      <div className={styles.noPolicies}>
        <FileText size={16} style={{ marginRight: 6, opacity: 0.5 }} />
        No policies tracked for this company.
      </div>
    );
  }

  return (
    <div className={styles.policySectionInner}>
      <div className={styles.policySectionTitle}>
        <FileText size={14} />
        Tracked Policies ({policies.length})
      </div>
      <div className={styles.policyTableWrap}>
        <table className={styles.policyTable}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>URL</th>
              <th>Jurisdiction</th>
              <th>Changes</th>
              <th>Snapshots</th>
              <th>Last Updated</th>
              <th>Wayback</th>
            </tr>
          </thead>
          <tbody>
            {policies.map((policy) => {
              const badgeClass = typeBadgeClass(policy.type);
              const waybackUrl = `https://web.archive.org/web/*/${encodeURIComponent(policy.url)}`;

              return (
                <tr key={policy.id}>
                  <td style={{ fontWeight: 500, color: 'var(--text-main)' }}>
                    {policy.name}
                  </td>
                  <td>
                    <span className={`${styles.badge} ${styles[badgeClass]}`}>
                      {policy.type}
                    </span>
                  </td>
                  <td>
                    <a
                      href={policy.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.externalLink}
                      title={policy.url}
                    >
                      <span className={styles.truncatedUrl}>
                        {truncateUrl(policy.url)}
                      </span>
                      <ExternalLink size={12} />
                    </a>
                  </td>
                  <td>
                    {policy.jurisdiction ? (
                      <span className={`${styles.badge} ${styles.badgeDefault}`}>
                        {policy.jurisdiction}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-dark)', fontSize: '0.82rem' }}>
                        N/A
                      </span>
                    )}
                  </td>
                  <td className={styles.monoText}>
                    {policy._count.changes}
                  </td>
                  <td className={styles.monoText}>
                    {policy._count.snapshots}
                  </td>
                  <td>{formatDate(policy.updatedAt)}</td>
                  <td>
                    <a
                      href={waybackUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.externalLink}
                      title="View on Wayback Machine"
                    >
                      <Globe size={14} />
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
