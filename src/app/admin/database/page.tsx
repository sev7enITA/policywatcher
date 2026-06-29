'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Database,
  Building2,
  FileText,
  ExternalLink,
  Globe,
  Search,
  Archive,
  AlertTriangle,
  GitCompare,
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
  privacy: 'badgePrimary',
  terms: 'badgeWarning',
  ai: 'badgeDanger',
  aup: 'badgeSecondary',
  developer: 'badgeNeutral',
};

function typeBadgeClass(type: string): string {
  return TYPE_BADGE_MAP[type.toLowerCase()] || 'badgeNeutral';
}

function truncateUrl(url: string, maxLen = 30): string {
  try {
    const u = new URL(url);
    const display = u.hostname;
    return display.length > maxLen ? display.slice(0, maxLen) + '...' : display;
  } catch {
    return url.length > maxLen ? url.slice(0, maxLen) + '...' : url;
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/* ---------- Component ---------- */

export default function DatabaseInspectorPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState('All');

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
    let totalSnapshots = 0;
    let totalChanges = 0;

    for (const c of companies) {
      totalPolicies += c._count.policies;
      for (const p of c.policies) {
        totalSnapshots += p._count.snapshots;
        totalChanges += p._count.changes;
      }
    }

    return {
      companies: companies.length,
      policies: totalPolicies,
      snapshots: totalSnapshots,
      changes: totalChanges,
    };
  }, [companies]);

  /* Get list of unique industries */
  const industriesList = useMemo(() => {
    const list = new Set<string>();
    companies.forEach((c) => {
      if (c.industry) list.add(c.industry);
    });
    return ['All', ...Array.from(list)];
  }, [companies]);

  /* Filtered companies */
  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.industry.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesIndustry = industryFilter === 'All' || c.industry === industryFilter;
      return matchesSearch && matchesIndustry;
    });
  }, [companies, searchQuery, industryFilter]);

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
      <div className={styles.pageHeader} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className={styles.pageTitle} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Database size={24} style={{ color: 'var(--primary)' }} />
            Database Inspector
          </h1>
          <p className={styles.pageSubtitle}>
            Browse, search and audit all database entities and snapshot history
          </p>
        </div>
        <span className={styles.logoVersion} style={{ fontSize: '0.78rem', padding: '4px 10px', borderRadius: '8px' }}>
          Prisma DB Connected
        </span>
      </div>

      {/* Error banner */}
      {error && (
        <div className={`${styles.alert} ${styles.alertWarning}`}>
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {/* Stats Summary Row */}
      <div className={styles.grid4} style={{ marginBottom: 24 }}>
        <div className={styles.card} style={{ marginBottom: 0 }}>
          <div className={`${styles.cardIcon} ${styles.cardIconPurple}`}>
            <Building2 size={20} />
          </div>
          <div className={styles.cardLabel}>Companies</div>
          <div className={styles.cardValue}>{stats.companies}</div>
        </div>

        <div className={styles.card} style={{ marginBottom: 0 }}>
          <div className={`${styles.cardIcon} ${styles.cardIconCyan}`}>
            <FileText size={20} />
          </div>
          <div className={styles.cardLabel}>Policies</div>
          <div className={styles.cardValue}>{stats.policies}</div>
        </div>

        <div className={styles.card} style={{ marginBottom: 0 }}>
          <div className={`${styles.cardIcon} ${styles.cardIconGreen}`}>
            <Archive size={20} />
          </div>
          <div className={styles.cardLabel}>Snapshots</div>
          <div className={styles.cardValue}>{stats.snapshots}</div>
        </div>

        <div className={styles.card} style={{ marginBottom: 0 }}>
          <div className={`${styles.cardIcon} ${styles.cardIconAmber}`}>
            <GitCompare size={20} />
          </div>
          <div className={styles.cardLabel}>Policy Changes</div>
          <div className={styles.cardValue}>{stats.changes}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className={styles.kpiFilters} style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: 24 }}>
        <div className={styles.searchBar} style={{ flex: 1, margin: 0, background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search companies by name or industry..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className={styles.kpiCategoryTabs} style={{ gap: 6 }}>
          {industriesList.map((ind) => (
            <button
              key={ind}
              onClick={() => setIndustryFilter(ind)}
              className={`${styles.kpiTab} ${industryFilter === ind ? styles.kpiTabActive : ''}`}
              style={{ fontSize: '0.78rem', padding: '5px 12px' }}
            >
              {ind}
            </button>
          ))}
        </div>
      </div>

      {/* Company Cards Grid */}
      <div className={styles.dbGrid}>
        {filteredCompanies.length === 0 ? (
          <div className={styles.card} style={{ gridColumn: '1 / -1', padding: '40px 20px', textAlign: 'center' }}>
            <Building2 size={40} style={{ margin: '0 auto 12px', color: 'var(--text-muted)' }} />
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              No companies match your filters.
            </p>
          </div>
        ) : (
          filteredCompanies.map((company) => {
            const letter = company.name.charAt(0).toUpperCase();
            return (
              <div key={company.id} className={styles.dbCompanyCard}>
                {/* Header */}
                <div className={styles.dbCompanyHeader}>
                  <div className={styles.dbLogoWrap} style={{ background: company.logo ? company.logo : 'var(--primary-glow)', color: company.logo ? '#fff' : 'var(--primary)' }}>
                    {letter}
                  </div>
                  <div className={styles.dbCompanyInfo}>
                    <h3 className={styles.dbCompanyName}>{company.name}</h3>
                    <div className={styles.dbCompanyMeta}>
                      <span className={styles.dbIndustryTag}>{company.industry}</span>
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.metaText}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 2, textDecoration: 'none' }}
                      >
                        {truncateUrl(company.website)}
                        <ExternalLink size={10} />
                      </a>
                    </div>
                  </div>
                </div>

                {/* DB Stats */}
                <div className={styles.dbStatsBadge}>
                  <div className={styles.dbStatsItem}>
                    <span>Policies:</span>
                    <span className={styles.dbStatsValue}>{company._count.policies}</span>
                  </div>
                  <div className={styles.dbStatsItem}>
                    <span>Snapshots:</span>
                    <span className={styles.dbStatsValue}>
                      {company.policies.reduce((acc, p) => acc + p._count.snapshots, 0)}
                    </span>
                  </div>
                  <div className={styles.dbStatsItem}>
                    <span>Changes:</span>
                    <span className={styles.dbStatsValue}>
                      {company.policies.reduce((acc, p) => acc + p._count.changes, 0)}
                    </span>
                  </div>
                </div>

                {/* Policies List */}
                <div className={styles.dbPolicyList}>
                  {company.policies.length === 0 ? (
                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      No policies tracked.
                    </p>
                  ) : (
                    company.policies.map((policy) => {
                      const badge = typeBadgeClass(policy.type);
                      const waybackUrl = `https://web.archive.org/web/*/${encodeURIComponent(policy.url)}`;

                      return (
                        <div key={policy.id} className={styles.dbPolicyMiniCard}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span className={styles.dbPolicyTitle}>{policy.name}</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              Checked: {formatDate(policy.updatedAt)}
                            </span>
                          </div>

                          <div className={styles.dbPolicyTags}>
                            <span className={`${styles.badge} ${styles[badge]}`} style={{ fontSize: '0.62rem', padding: '1px 6px' }}>
                              {policy.type}
                            </span>
                            {policy.jurisdiction && (
                              <span className={`${styles.badge} ${styles.badgeNeutral}`} style={{ fontSize: '0.62rem', padding: '1px 6px' }}>
                                {policy.jurisdiction}
                              </span>
                            )}
                            <a
                              href={waybackUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.metaText}
                              title="Wayback History"
                              style={{ display: 'inline-flex', padding: 4, borderRadius: 4, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
                            >
                              <Globe size={11} />
                            </a>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
