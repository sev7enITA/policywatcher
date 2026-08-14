import { describe, expect, it } from 'vitest';
import { buildCompanyKpiAuditRow, getKpiConcernLevel } from '../kpiAudit';

describe('buildCompanyKpiAuditRow', () => {
  it('combines the latest supported KPI evidence across company policies', () => {
    const row = buildCompanyKpiAuditRow({
      companyId: 'company-1',
      companyName: 'Example',
      industry: 'Cloud/SaaS',
      changes: [
        {
          id: 'terms-new',
          policyName: 'Terms',
          overallScore: 7,
          overallRisk: 'High',
          createdAt: '2026-07-21T12:00:00.000Z',
          kpiDataCollection: 'Not assessed',
          kpiAiOutputOwnership: 'Shared',
        },
        {
          id: 'privacy-old',
          policyName: 'Privacy',
          overallScore: 4,
          overallRisk: 'Medium',
          createdAt: '2026-07-20T12:00:00.000Z',
          kpiDataCollection: 'Moderate',
          kpiAiOutputOwnership: 'Not assessed',
        },
      ],
    });

    expect(row.overallScore).toBe(7);
    expect(row.latestPolicyName).toBe('Terms');
    expect(row.kpiValues.kpiDataCollection).toBe('Moderate');
    expect(row.kpiEvidence.kpiDataCollection?.policyName).toBe('Privacy');
    expect(row.kpiValues.kpiAiOutputOwnership).toBe('Shared');
    expect(row.assessedCount).toBe(2);
    expect(row.assessmentState).toBe('partial');
  });

  it('uses pending rather than a zero risk score when no analysis exists', () => {
    const row = buildCompanyKpiAuditRow({
      companyId: 'company-2',
      companyName: 'Pending Co',
      industry: 'FinTech',
      changes: [],
    });

    expect(row.overallScore).toBeNull();
    expect(row.overallRisk).toBeNull();
    expect(row.assessedCount).toBe(0);
    expect(row.coveragePercent).toBe(0);
    expect(row.assessmentState).toBe('pending');
  });
});

describe('getKpiConcernLevel', () => {
  it('classifies values using field-specific semantics', () => {
    expect(getKpiConcernLevel('kpiThirdPartySharing', 'Restricted')).toBe('lower');
    expect(getKpiConcernLevel('kpiDataRetention', 'Extended')).toBe('moderate');
    expect(getKpiConcernLevel('kpiIndependentAudit', 'Absent')).toBe('higher');
    expect(getKpiConcernLevel('kpiIndependentAudit', 'Not assessed')).toBe('pending');
  });
});
