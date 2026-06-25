'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, CheckCircle, AlertTriangle } from 'lucide-react';
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
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderText}>
          <h1 className={styles.pageTitle}>
            <BarChart3 size={24} />
            KPI Audit
          </h1>
          <p className={styles.pageSubtitle}>
            Cross-company KPI matrix with value distribution
          </p>
        </div>
      </div>

      <div className={styles.kpiMatrixWrapper}>
        <div className={styles.kpiMatrixScroll}>
          <table className={styles.kpiMatrixTable}>
            <thead>
              <tr>
                <th className={styles.kpiMatrixStickyCol}>Company</th>
                {fields.map((field) => (
                  <th key={field} className={styles.kpiMatrixColHeader}>
                    {KPI_LABELS[field] || field}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedMatrix.map((row) => (
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
                  {fields.map((field) => {
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.kpiCoverageSummary}>
        <CheckCircle size={18} />
        <span>
          <strong>{fullCoverageCount}</strong> of{' '}
          <strong>{sortedMatrix.length}</strong> companies have full coverage
          ({fields.length}/{fields.length} KPIs assessed)
        </span>
      </div>
    </div>
  );
}
