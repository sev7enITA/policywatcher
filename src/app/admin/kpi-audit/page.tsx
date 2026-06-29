'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, CheckCircle, AlertTriangle, Search } from 'lucide-react';
import styles from '../admin.module.css';

interface KpiMatrixRow {
  companyName: string;
  industry: string;
  overallScore: number;
  overallRisk: string;
  kpiValues: Record<string, string>;
  assessedCount: number;
  totalKpis: number;
}

interface KpiAuditData {
  matrix: KpiMatrixRow[];
  distribution: Record<string, Record<string, number>>;
  kpiFields: string[];
}

const KPI_LABELS: Record<string, string> = {
  kpiDataCollection: 'Data Collection',
  kpiThirdPartySharing: '3rd Party Sharing',
  kpiDataRetention: 'Data Retention',
  kpiRightToDeletion: 'Right to Delete',
  kpiCrossBorderTransfer: 'Cross-Border',
  kpiAiTrainingOptOut: 'AI Opt-Out',
  kpiAiOutputOwnership: 'AI Ownership',
  kpiAlgoTransparency: 'Algo Transparency',
  kpiAutomatedDecision: 'Auto Decisions',
  kpiAiBiasFairness: 'AI Bias',
  kpiConsentMechanism: 'Consent',
  kpiRegulatoryCompliance: 'Compliance',
  kpiBreachNotification: 'Breach Notice',
  kpiIndependentAudit: 'Audit',
  kpiContentModeration: 'Moderation',
};

const GOOD_VALUES = new Set([
  'Full',
  'Available',
  'Comprehensive',
  'Certified',
  'Within 24h',
  'Within 72h',
  'Transparent',
  'Explicit Opt-In',
  'Committed',
  'Disclosed',
  'Published',
  'Minimal',
  'User Retained',
]);

const GOOD_CONTEXTUAL: Record<string, Set<string>> = {
  kpiThirdPartySharing: new Set(['None']),
  kpiCrossBorderTransfer: new Set(['Restricted']),
};

const WARNING_VALUES = new Set([
  'Moderate',
  'Limited',
  'Defined',
  'Partial',
  'Opt-Out',
  'Mentioned',
  'Controlled',
]);

const DANGER_VALUES = new Set([
  'Extensive',
  'Broad',
  'Extended',
  'Indefinite',
  'Unrestricted',
  'Not Available',
  'Company Claimed',
  'Opaque',
  'Undisclosed',
  'Absent',
  'Implicit',
  'Unspecified',
  'Not assessed',
]);

const DANGER_CONTEXTUAL: Record<string, Set<string>> = {
  kpiIndependentAudit: new Set(['None']),
  kpiBreachNotification: new Set(['None']),
};

function getCellClass(field: string, value: string): string {
  if (!value || value === 'Not assessed') return styles.kpiCellDanger;

  if (GOOD_VALUES.has(value)) return styles.kpiCellGood;
  if (GOOD_CONTEXTUAL[field]?.has(value)) return styles.kpiCellGood;

  if (WARNING_VALUES.has(value)) return styles.kpiCellWarning;

  if (DANGER_VALUES.has(value)) return styles.kpiCellDanger;
  if (DANGER_CONTEXTUAL[field]?.has(value)) return styles.kpiCellDanger;

  return '';
}

function getRiskBadgeClass(risk: string): string {
  switch (risk) {
    case 'High':
      return styles.riskBadgeHigh;
    case 'Medium':
      return styles.riskBadgeMedium;
    case 'Low':
      return styles.riskBadgeLow;
    default:
      return '';
  }
}

export default function KpiAuditPage() {
  const router = useRouter();
  const [data, setData] = useState<KpiAuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/admin/kpi-audit', {
          credentials: 'include',
        });

        if (res.status === 401 || res.status === 403) {
          router.push('/admin/login');
          return;
        }

        if (!res.ok) {
          throw new Error(`Server returned ${res.status}`);
        }

        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load KPI audit data'
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [router]);

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingSpinner} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.pageContainer}>
        <div className={`${styles.alert} ${styles.alertWarning}`}>
          <AlertTriangle size={16} />
          {error}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const sortedMatrix = [...data.matrix].sort((a, b) =>
    a.companyName.localeCompare(b.companyName)
  );

  const fields = data.kpiFields.length > 0
    ? data.kpiFields
    : Object.keys(KPI_LABELS);

  const fullCoverageCount = sortedMatrix.filter(
    (row) => row.assessedCount === row.totalKpis
  ).length;

  return (
    <KpiDashboardInner
      matrix={sortedMatrix}
      fields={fields}
      fullCoverageCount={fullCoverageCount}
    />
  );
}

/* ---------- Redesigned Dashboard Component ---------- */

interface KpiDashboardInnerProps {
  matrix: KpiMatrixRow[];
  fields: string[];
  fullCoverageCount: number;
}

type KpiCategory = 'all' | 'privacy' | 'ai' | 'ethics';

const CATEGORY_MAP: Record<KpiCategory, { label: string; fields: string[] }> = {
  all: {
    label: 'All KPIs',
    fields: [
      'kpiDataCollection', 'kpiThirdPartySharing', 'kpiDataRetention', 'kpiRightToDeletion', 'kpiCrossBorderTransfer',
      'kpiAiTrainingOptOut', 'kpiAiOutputOwnership', 'kpiAlgoTransparency', 'kpiAutomatedDecision', 'kpiAiBiasFairness',
      'kpiConsentMechanism', 'kpiRegulatoryCompliance', 'kpiBreachNotification', 'kpiIndependentAudit', 'kpiContentModeration'
    ]
  },
  privacy: {
    label: 'Privacy & Data Protection',
    fields: ['kpiDataCollection', 'kpiThirdPartySharing', 'kpiDataRetention', 'kpiRightToDeletion', 'kpiCrossBorderTransfer']
  },
  ai: {
    label: 'AI Governance',
    fields: ['kpiAiTrainingOptOut', 'kpiAiOutputOwnership', 'kpiAlgoTransparency', 'kpiAutomatedDecision', 'kpiAiBiasFairness']
  },
  ethics: {
    label: 'Ethics & Corporate Governance',
    fields: ['kpiConsentMechanism', 'kpiRegulatoryCompliance', 'kpiBreachNotification', 'kpiIndependentAudit', 'kpiContentModeration']
  }
};

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  PieChart,
  Pie,
  Legend,
} from 'recharts';

function KpiDashboardInner({
  matrix,
  fields,
  fullCoverageCount,
}: KpiDashboardInnerProps) {
  const [activeCategory, setActiveCategory] = useState<KpiCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Filtered matrix rows based on search
  const filteredMatrix = useMemo(() => {
    return matrix.filter((row) =>
      row.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.industry.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [matrix, searchQuery]);

  // 2. Active fields columns based on category tab
  const activeFields = useMemo(() => {
    const categoryFields = CATEGORY_MAP[activeCategory].fields;
    return fields.filter((f) => categoryFields.includes(f));
  }, [fields, activeCategory]);

  // 3. Chart Data: Compliance Scores (Bar Chart)
  const scoreChartData = useMemo(() => {
    return filteredMatrix.map((row) => {
      let color = '#10b981'; // low risk
      if (row.overallRisk === 'High') color = '#f43f5e';
      else if (row.overallRisk === 'Medium') color = '#f59e0b';

      return {
        name: row.companyName,
        score: row.overallScore,
        fill: color
      };
    }).sort((a, b) => b.score - a.score);
  }, [filteredMatrix]);

  // 4. Chart Data: Total KPI Statuses across the matrix (Pie Chart)
  const statusDistributionData = useMemo(() => {
    let good = 0;
    let warning = 0;
    let danger = 0;

    filteredMatrix.forEach((row) => {
      activeFields.forEach((field) => {
        const val = row.kpiValues[field] || 'Not assessed';
        const cellClass = getCellClass(field, val);
        if (cellClass === styles.kpiCellGood) good++;
        else if (cellClass === styles.kpiCellWarning) warning++;
        else danger++;
      });
    });

    return [
      { name: 'Compliant / Good', value: good, color: '#10b981' },
      { name: 'Moderate Risk', value: warning, color: '#f59e0b' },
      { name: 'Non-Compliant / Opaque', value: danger, color: '#f43f5e' },
    ].filter(item => item.value > 0);
  }, [filteredMatrix, activeFields]);

  return (
    <div className={styles.pageContainer}>
      {/* Page Header */}
      <div className={styles.pageHeader} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className={styles.pageHeaderText}>
          <h1 className={styles.pageTitle} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BarChart3 size={24} style={{ color: 'var(--primary)' }} />
            KPI Audit Dashboard
          </h1>
          <p className={styles.pageSubtitle}>
            Cross-company KPI matrix audit with compliance distribution and risk ranking
          </p>
        </div>
        <span className={styles.logoVersion} style={{ fontSize: '0.78rem', padding: '4px 10px', borderRadius: '8px' }}>
          Compliance v3.0.0
        </span>
      </div>

      {/* Analytics Charts Grid */}
      <div className={styles.kpiChartGrid}>
        {/* Bar Chart: Compliance Scores */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartCardTitle}>Company Score Rankings</h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Score scale: 1 - 10</span>
          </div>
          <div className={styles.chartContainer}>
            {scoreChartData.length === 0 ? (
              <div className={styles.emptyState}>No data to chart.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreChartData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border-subtle)" />
                  <XAxis type="number" domain={[0, 10]} stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                  <YAxis type="category" dataKey="name" stroke="var(--text-muted)" fontSize={10} tickLine={false} width={60} />
                  <ChartTooltip
                    contentStyle={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: 'var(--text-main)',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Pie Chart: Status Breakdown */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartCardTitle}>KPI Assessment Distribution</h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Currently selected columns</span>
          </div>
          <div className={styles.chartContainer}>
            {statusDistributionData.length === 0 ? (
              <div className={styles.emptyState}>No data to chart.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    contentStyle={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: 'var(--text-main)',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => <span style={{ color: 'var(--text-body)', fontSize: '10px' }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* KPI Controls Bar */}
      <div className={styles.kpiFilters} style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        {/* Search */}
        <div className={styles.searchBar} style={{ flex: 1, margin: 0, background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Filter by company name or industry..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Categories Tab selector */}
        <div className={styles.kpiCategoryTabs}>
          {(Object.keys(CATEGORY_MAP) as KpiCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`${styles.kpiTab} ${activeCategory === cat ? styles.kpiTabActive : ''}`}
            >
              {CATEGORY_MAP[cat].label}
            </button>
          ))}
        </div>
      </div>

      {/* Matrix Table */}
      <div className={styles.kpiMatrixWrapper} style={{ marginTop: 20 }}>
        <div className={styles.kpiMatrixScroll}>
          <table className={styles.kpiMatrixTable}>
            <thead>
              <tr>
                <th className={styles.kpiMatrixStickyCol}>Company</th>
                {activeFields.map((field) => (
                  <th key={field} className={styles.kpiMatrixColHeader}>
                    {KPI_LABELS[field] || field}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredMatrix.length === 0 ? (
                <tr>
                  <td colSpan={activeFields.length + 1} className={styles.emptyState}>
                    No audit records match your filters.
                  </td>
                </tr>
              ) : (
                filteredMatrix.map((row) => (
                  <tr key={row.companyName} className={styles.kpiMatrixRow}>
                    <td className={styles.kpiMatrixStickyCol}>
                      <div className={styles.kpiCompanyCell}>
                        <span className={styles.kpiCompanyName}>
                          {row.companyName}
                        </span>
                        <span
                          className={`${styles.kpiRiskBadge} ${getRiskBadgeClass(row.overallRisk)}`}
                        >
                          {row.overallScore}
                        </span>
                      </div>
                    </td>
                    {activeFields.map((field) => {
                      const value = row.kpiValues[field] || 'Not assessed';
                      const cellClass = getCellClass(field, value);
                      return (
                        <td
                          key={field}
                          className={`${styles.kpiCell} ${cellClass}`}
                        >
                          {value}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.kpiCoverageSummary}>
        <CheckCircle size={18} />
        <span>
          <strong>{fullCoverageCount}</strong> of{' '}
          <strong>{matrix.length}</strong> companies have full coverage
          ({fields.length}/{fields.length} KPIs assessed)
        </span>
      </div>
    </div>
  );
}
