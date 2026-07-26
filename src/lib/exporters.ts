/**
 * PolicyWatcher v2.0 - Export Utilities
 *
 * CSV export using papaparse and PDF report data generation.
 */

import Papa from 'papaparse';
import type { Company, Policy, Lang } from '@/types';
import type { DashboardViewManifest, DashboardViewModel } from './dashboardViewModel';

// -- CSV Export --

/**
 * Shape of a single flattened row in the CSV export.
 * Each row represents the latest change for one policy of one company,
 * including AI governance indicators and per-region risk levels.
 */
export interface CSVRow {
  Company: string;
  Industry: string;
  Policy: string;
  Jurisdiction: string;
  OverallRisk: string;
  OverallScore: number;
  Date: string;
  AITrainingOptOut: string;
  AIDataScraping: string;
  AIIpLicensing: string;
  AIPromptRetention: string;
  RegionEU_Individual_Risk: string;
  RegionEU_Enterprise_Risk: string;
  RegionUS_Individual_Risk: string;
  RegionUS_Enterprise_Risk: string;
  RegionGlobal_Individual_Risk: string;
  RegionGlobal_Enterprise_Risk: string;
}

export interface DashboardExportManifest extends DashboardViewManifest {
  generatedAt: string;
  policyWatcherRelease: string;
  language: Lang;
  rowCount: number;
}

export interface DashboardCSVRow {
  RecordType: 'manifest' | 'policy';
  Company: string;
  Industry: string;
  Policy: string;
  Jurisdiction: string;
  OverallRisk: string;
  OverallScore: number | '';
  Date: string;
  AITrainingOptOut: string;
  AIDataScraping: string;
  AIIpLicensing: string;
  AIPromptRetention: string;
  RegionEU_Individual_Risk: string;
  RegionEU_Enterprise_Risk: string;
  RegionUS_Individual_Risk: string;
  RegionUS_Enterprise_Risk: string;
  RegionGlobal_Individual_Risk: string;
  RegionGlobal_Enterprise_Risk: string;
  ManifestJSON: string;
}

export interface DashboardCsvArtifact {
  csv: string;
  manifest: DashboardExportManifest;
  rows: DashboardCSVRow[];
}

export function buildCompanyCsvRows(companies: readonly Company[]): CSVRow[] {
  const rows: CSVRow[] = [];

  for (const company of companies) {
    for (const policy of company.policies) {
      const latestChange = policy.changes?.[0];
      if (!latestChange) continue;

      const findRegionRisk = (region: string, perspective: string): string => {
        const impact = latestChange.regionImpacts?.find(
          (ri) => ri.region === region && ri.perspective === perspective
        );
        return impact?.riskLevel || 'N/A';
      };

      rows.push({
        Company: company.name,
        Industry: company.industry,
        Policy: policy.name,
        Jurisdiction: policy.jurisdiction,
        OverallRisk: latestChange.overallRisk,
        OverallScore: latestChange.overallScore,
        Date: new Date(latestChange.createdAt).toISOString().split('T')[0],
        AITrainingOptOut: latestChange.aiTrainingOptOut,
        AIDataScraping: latestChange.aiDataScrapingRestricted,
        AIIpLicensing: latestChange.aiIpLicensing,
        AIPromptRetention: latestChange.aiPromptRetention,
        RegionEU_Individual_Risk: findRegionRisk('EU', 'Individual'),
        RegionEU_Enterprise_Risk: findRegionRisk('EU', 'Enterprise'),
        RegionUS_Individual_Risk: findRegionRisk('US', 'Individual'),
        RegionUS_Enterprise_Risk: findRegionRisk('US', 'Enterprise'),
        RegionGlobal_Individual_Risk: findRegionRisk('Global', 'Individual'),
        RegionGlobal_Enterprise_Risk: findRegionRisk('Global', 'Enterprise'),
      });
    }
  }

  return rows;
}

/**
 * Flattens company data into a CSV-ready table and triggers browser download.
 */
export function exportToCSV(companies: Company[], filename: string = 'policywatcher-export'): void {
  const csv = Papa.unparse(buildCompanyCsvRows(companies));
  const timestamped = `${filename}-${new Date().toISOString().slice(0, 10)}`;
  triggerDownload(csv, `${timestamped}.csv`, 'text/csv;charset=utf-8;');
}

/** Builds a provenance-rich CSV from the exact dashboard view shown on screen. */
export function buildDashboardCsvArtifact(
  view: DashboardViewModel,
  options: { generatedAt: string; policyWatcherRelease: string; language: Lang }
): DashboardCsvArtifact {
  const policyRows = buildCompanyCsvRows(view.companies);
  const manifest: DashboardExportManifest = {
    ...view.manifest,
    ...options,
    rowCount: policyRows.length,
  };
  const emptyPolicyColumns = {
    Company: '',
    Industry: '',
    Policy: '',
    Jurisdiction: '',
    OverallRisk: '',
    OverallScore: '' as const,
    Date: '',
    AITrainingOptOut: '',
    AIDataScraping: '',
    AIIpLicensing: '',
    AIPromptRetention: '',
    RegionEU_Individual_Risk: '',
    RegionEU_Enterprise_Risk: '',
    RegionUS_Individual_Risk: '',
    RegionUS_Enterprise_Risk: '',
    RegionGlobal_Individual_Risk: '',
    RegionGlobal_Enterprise_Risk: '',
  };
  const rows: DashboardCSVRow[] = [
    {
      RecordType: 'manifest',
      ...emptyPolicyColumns,
      ManifestJSON: JSON.stringify(manifest),
    },
    ...policyRows.map((row): DashboardCSVRow => ({
      RecordType: 'policy',
      ...row,
      ManifestJSON: '',
    })),
  ];

  return { csv: Papa.unparse(rows), manifest, rows };
}

export function exportDashboardViewToCSV(
  view: DashboardViewModel,
  options: { policyWatcherRelease: string; language: Lang },
  filename: string = 'policywatcher-dashboard-export'
): DashboardExportManifest {
  const generatedAt = new Date().toISOString();
  const artifact = buildDashboardCsvArtifact(view, { ...options, generatedAt });
  const timestamped = `${filename}-${generatedAt.slice(0, 10)}`;
  triggerDownload(artifact.csv, `${timestamped}.csv`, 'text/csv;charset=utf-8;');
  return artifact.manifest;
}

// -- PDF Report Data --

/**
 * Structured data object consumed by the PDF report renderer.
 * Produced by `generatePolicyReport()` and passed to the
 * `@react-pdf/renderer` component for client-side PDF generation.
 */
export interface PolicyReportData {
  generatedAt: string;
  lang: string;
  company: {
    name: string;
    industry: string;
    website: string;
  };
  policy: {
    name: string;
    type: string;
    jurisdiction: string;
    url: string;
    updatedAt: string;
  };
  analysis: {
    summaryTitle: string;
    summary: string;
    overallRisk: string;
    overallScore: number;
    aiGovernance: {
      label: string;
      value: string;
    }[];
  };
  regionImpacts: {
    region: string;
    perspective: string;
    riskLevel: string;
    analysis: string;
    complianceNote: string;
  }[];
  remediations: {
    title: string;
    description: string;
    actionUrl?: string;
    actionText?: string;
  }[];
}

/**
 * Generates a structured report data object for PDF rendering.
 * Uses @react-pdf/renderer in the consuming component.
 */
export function generatePolicyReport(
  policy: Policy,
  company: { name: string; industry: string; website: string },
  lang: Lang
): PolicyReportData | null {
  const latestChange = policy.changes?.[0];
  if (!latestChange) return null;

  const isIt = lang === 'it';

  // Parse remediations
  let remediations: Array<{
    titleEn: string;
    titleIt: string;
    descriptionEn: string;
    descriptionIt: string;
    actionUrl?: string;
    actionTextEn?: string;
    actionTextIt?: string;
  }> = [];
  try {
    remediations = JSON.parse(latestChange.remediationsJson);
  } catch {
    // graceful fallback
  }

  const aiGovernanceLabels = isIt
    ? ['Opt-Out Addestramento AI', 'Scraping Dati AI', 'Licenza IP AI', 'Conservazione Prompt']
    : ['AI Training Opt-Out', 'AI Data Scraping', 'AI IP Licensing', 'Prompt Retention'];

  return {
    generatedAt: new Date().toISOString(),
    lang,
    company: {
      name: company.name,
      industry: company.industry,
      website: company.website,
    },
    policy: {
      name: policy.name,
      type: policy.type,
      jurisdiction: policy.jurisdiction,
      url: policy.url,
      updatedAt: policy.updatedAt,
    },
    analysis: {
      summaryTitle: isIt ? 'Riepilogo Esecutivo' : 'Executive Summary',
      summary: isIt ? latestChange.aiSummaryIt : latestChange.aiSummaryEn,
      overallRisk: latestChange.overallRisk,
      overallScore: latestChange.overallScore,
      aiGovernance: [
        { label: aiGovernanceLabels[0], value: latestChange.aiTrainingOptOut },
        { label: aiGovernanceLabels[1], value: latestChange.aiDataScrapingRestricted },
        { label: aiGovernanceLabels[2], value: latestChange.aiIpLicensing },
        { label: aiGovernanceLabels[3], value: latestChange.aiPromptRetention },
      ],
    },
    regionImpacts: latestChange.regionImpacts.map((ri) => ({
      region: ri.region,
      perspective: ri.perspective,
      riskLevel: ri.riskLevel,
      analysis: isIt ? ri.impactAnalysisIt : ri.impactAnalysisEn,
      complianceNote: (isIt ? ri.complianceNoteIt : ri.complianceNoteEn) || '',
    })),
    remediations: remediations.map((r) => ({
      title: isIt ? r.titleIt : r.titleEn,
      description: isIt ? r.descriptionIt : r.descriptionEn,
      actionUrl: r.actionUrl,
      actionText: isIt ? r.actionTextIt : r.actionTextEn,
    })),
  };
}

// -- Download Helper --

/**
 * Triggers a file download in the browser from raw content.
 */
export function triggerDownload(
  content: string | Blob,
  filename: string,
  mimeType: string = 'application/octet-stream'
): void {
  const blob =
    content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
