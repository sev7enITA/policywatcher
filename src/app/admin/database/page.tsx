'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
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
  CheckCircle2,
  CircleAlert,
  HardDrive,
  Layers3,
  RefreshCw,
  ShieldCheck,
  Settings,
} from 'lucide-react';
import styles from '../admin.module.css';
import { buildWaybackSearchUrl } from '@/lib/wayback';
import { DatabaseRecoveryTools } from './DatabaseRecoveryTools';
import type { EnvironmentReadinessReport } from '@/lib/databaseReadiness';

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

type ReadinessStatus = 'ready' | 'degraded' | 'unavailable';

interface DatabaseReadiness {
  status: ReadinessStatus;
  checkedAt: string;
  database: {
    configured: boolean;
    filePath: string | null;
    directoryPath: string | null;
    directoryExists: boolean;
    directoryWritable: boolean;
    fileExists: boolean;
    fileReadable: boolean;
    fileWritable: boolean;
    fileSizeBytes: number;
  };
  integrity: {
    quickCheck: string;
    journalMode: string;
    foreignKeysEnabled: boolean;
    pageCount: number | null;
    freePageCount: number | null;
  };
  schema: {
    expectedTableCount: number;
    presentTableCount: number;
    missingTables: string[];
    expectedMigrationCount: number;
    appliedMigrationCount: number;
    missingMigrations: string[];
    migrationLedgerAvailable: boolean;
    lastAppliedMigration: string | null;
    lastAppliedAt: string | null;
  };
  environment: EnvironmentReadinessReport;
  diagnosticCode: string | null;
  role: 'admin' | 'auditor';
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

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / (1024 ** unitIndex);
  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

/* ---------- Component ---------- */

export default function DatabaseInspectorPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [readiness, setReadiness] = useState<DatabaseReadiness | null>(null);
  const [readinessError, setReadinessError] = useState('');
  const [role, setRole] = useState<'admin' | 'auditor'>('auditor');
  const [searchQuery, setSearchQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState('All');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    setReadinessError('');

    const [companiesResult, readinessResult] = await Promise.allSettled([
      fetch('/api/admin/companies', { credentials: 'include', cache: 'no-store' }),
      fetch('/api/admin/database-readiness', { credentials: 'include', cache: 'no-store' }),
    ]);

    try {
      if (companiesResult.status === 'rejected') throw companiesResult.reason;
      if (companiesResult.value.status === 401) {
        router.push('/admin/login');
        return;
      }
      if (!companiesResult.value.ok) {
        throw new Error(`Inventory endpoint responded with ${companiesResult.value.status}`);
      }
      const data = await companiesResult.value.json() as { companies?: CompanyData[]; role?: 'admin' | 'auditor' };
      setCompanies(data.companies ?? []);
      if (data.role) setRole(data.role);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load the evidence inventory.');
    }

    try {
      if (readinessResult.status === 'rejected') throw readinessResult.reason;
      if (readinessResult.value.status === 401) {
        router.push('/admin/login');
        return;
      }
      const data = await readinessResult.value.json() as DatabaseReadiness | { error?: string };
      if (!('status' in data)) {
        throw new Error(data.error || `Readiness endpoint responded with ${readinessResult.value.status}`);
      }
      setReadiness(data);
      setRole(data.role);
    } catch (err) {
      setReadinessError(err instanceof Error ? err.message : 'Database readiness could not be evaluated.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

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

  const readinessLabel = readiness?.status === 'ready'
    ? 'Database ready'
    : readiness?.status === 'degraded'
      ? 'Database degraded'
      : 'Database unavailable';
  const ReadinessIcon = readiness?.status === 'ready' ? CheckCircle2 : CircleAlert;

  return (
    <div>
      {/* Page Header */}
      <div className={`${styles.pageHeader} ${styles.databasePageHeader}`}>
        <div>
          <h1 className={styles.pageTitle} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Database size={24} style={{ color: 'var(--primary)' }} />
            Database Inspector
          </h1>
          <p className={styles.pageSubtitle}>
            Browse, search and audit all database entities and snapshot history
          </p>
        </div>
        <div className={styles.databaseHeaderActions}>
          <span className={`${styles.databaseReadinessBadge} ${styles[`databaseReadinessBadge_${readiness?.status || 'unavailable'}`]}`}>
            <ReadinessIcon size={14} />
            {readinessLabel}
          </span>
          <button type="button" className={styles.databaseRefreshButton} onClick={() => void load()}>
            <RefreshCw size={14} />
            Recheck
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className={`${styles.alert} ${styles.alertWarning}`}>
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      <section className={styles.databaseReadinessPanel} aria-labelledby="database-readiness-title">
        <header className={styles.databaseReadinessHeader}>
          <div>
            <span>Read-only production check</span>
            <h2 id="database-readiness-title"><ShieldCheck size={19} /> Database readiness</h2>
            <p>Integrity, schema contract and migration ledger are checked without changing stored evidence.</p>
          </div>
          {readiness && <time dateTime={readiness.checkedAt}>Checked {new Date(readiness.checkedAt).toLocaleString()}</time>}
        </header>

        {readinessError && (
          <div className={`${styles.alert} ${styles.alertWarning}`}>
            <AlertTriangle size={16} />
            {readinessError}
          </div>
        )}

        {readiness && (
          <>
            <div className={styles.databaseReadinessGrid}>
              <article>
                <ShieldCheck size={18} />
                <span>SQLite integrity</span>
                <strong>{readiness.integrity.quickCheck === 'ok' ? 'Passed' : readiness.integrity.quickCheck}</strong>
                <small>PRAGMA quick_check(1)</small>
              </article>
              <article>
                <Layers3 size={18} />
                <span>Schema tables</span>
                <strong>{readiness.schema.presentTableCount} / {readiness.schema.expectedTableCount}</strong>
                <small>{readiness.schema.missingTables.length === 0 ? 'Current contract present' : `${readiness.schema.missingTables.length} missing`}</small>
              </article>
              <article>
                <GitCompare size={18} />
                <span>Applied migrations</span>
                <strong>{readiness.schema.appliedMigrationCount} / {readiness.schema.expectedMigrationCount}</strong>
                <small>{readiness.schema.migrationLedgerAvailable ? 'Prisma ledger available' : 'Ledger unavailable'}</small>
              </article>
              <article>
                <HardDrive size={18} />
                <span>SQLite file access</span>
                <strong>{readiness.database.fileReadable ? 'R' : '-'}{readiness.database.fileWritable ? 'W' : '-'}</strong>
                <small>{formatBytes(readiness.database.fileSizeBytes)} · {readiness.integrity.journalMode} journal</small>
              </article>
            </div>

            {(readiness.schema.missingTables.length > 0 || readiness.schema.missingMigrations.length > 0 || readiness.diagnosticCode) && (
              <div className={styles.databaseReadinessFindings}>
                <strong><AlertTriangle size={15} /> Action required</strong>
                {readiness.diagnosticCode && <p>Diagnostic code: <code>{readiness.diagnosticCode}</code></p>}
                {readiness.schema.missingTables.length > 0 && <p>Missing tables: {readiness.schema.missingTables.join(', ')}</p>}
                {readiness.schema.missingMigrations.length > 0 && <p>Missing migrations: {readiness.schema.missingMigrations.join(', ')}</p>}
                <p>Redeploy the verified Hostinger package or run <code>bash scripts/hostinger-init-db.sh</code> from <code>.builds/last-source</code>. Do not reset or replace the production database.</p>
              </div>
            )}

            <dl className={styles.databaseReadinessMeta}>
              <div><dt>Foreign keys</dt><dd>{readiness.integrity.foreignKeysEnabled ? 'Enabled for this connection' : 'Not reported as enabled'}</dd></div>
              <div><dt>Pages</dt><dd>{readiness.integrity.pageCount ?? 'n/a'} total · {readiness.integrity.freePageCount ?? 'n/a'} free</dd></div>
              <div><dt>Last migration</dt><dd>{readiness.schema.lastAppliedMigration || 'Not available'}</dd></div>
              <div><dt>Migration time</dt><dd>{readiness.schema.lastAppliedAt ? new Date(readiness.schema.lastAppliedAt).toLocaleString() : 'Not available'}</dd></div>
            </dl>
          </>
        )}
      </section>

      <section id="environment-readiness" className={styles.environmentReadinessPanel} aria-labelledby="environment-readiness-title">
        <header className={styles.environmentReadinessHeader}>
          <div>
            <span>Presence-only contract</span>
            <h2 id="environment-readiness-title"><Settings size={19} /> Environment readiness</h2>
            <p>Only the presence of the six deployment variables is reported. Secret values are never returned.</p>
          </div>
          {readiness?.environment && <strong>{readiness.environment.configuredCount} / {readiness.environment.expectedCount} configured</strong>}
        </header>
        {readiness?.environment ? (
          <>
            <dl className={styles.environmentReadinessList}>
              {readiness.environment.variables.map((variable) => (
                <div key={variable.name} data-state={variable.status === 'SET' ? 'set' : 'missing'}>
                  <dt><code>{variable.name}</code></dt>
                  <dd>{variable.status}</dd>
                </div>
              ))}
            </dl>
            <p className={styles.environmentReadinessBoundary}><ShieldCheck size={15} />{readiness.environment.boundary}</p>
          </>
        ) : (
          <p className={styles.environmentReadinessBoundary}><CircleAlert size={15} />Environment presence is unavailable with the current readiness response.</p>
        )}
      </section>

      <DatabaseRecoveryTools role={role} />

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
                      const waybackUrl = buildWaybackSearchUrl(policy.url);

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
                              title="Wayback search for this configured source"
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
