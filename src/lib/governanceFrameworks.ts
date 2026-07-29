import {
  KPI_METRICS,
  isAssessedKpiValue,
  type KpiField,
} from './metricsCatalog';

export type GovernanceFrameworkId = 'eu-ai-act' | 'iso-42001' | 'nist-ai-rmf' | 'oecd-ai-principles';
export type GovernanceMappingStatus = 'mapped' | 'not-assessed' | 'not-applicable';

export interface GovernanceFrameworkDefinition {
  id: GovernanceFrameworkId;
  name: string;
  shortName: string;
  referenceUrl: string;
  referenceVersion: string;
  reviewQuestion: string;
  kpiFields: readonly KpiField[];
}

export interface GovernanceEvidenceItem {
  field: KpiField;
  label: string;
  value: string;
}

export interface GovernanceFrameworkMapping {
  framework: GovernanceFrameworkDefinition;
  status: GovernanceMappingStatus;
  assessedCount: number;
  mappedFieldCount: number;
  evidence: GovernanceEvidenceItem[];
}

export const GOVERNANCE_MAPPING_VERSION = '2026-07-29.1' as const;

/**
 * Advisory review map, not a control catalogue or compliance crosswalk.
 * Each framework is connected only to PolicyWatcher KPI topics that can help
 * a reviewer decide where to inspect the source policy next.
 */
export const GOVERNANCE_FRAMEWORKS: readonly GovernanceFrameworkDefinition[] = [
  {
    id: 'eu-ai-act',
    name: 'Regulation (EU) 2024/1689 (EU AI Act)',
    shortName: 'EU AI Act',
    referenceUrl: 'https://eur-lex.europa.eu/eli/reg/2024/1689/oj',
    referenceVersion: 'Official Journal text, 2024',
    reviewQuestion: 'Which recorded policy statements may be relevant to transparency, automated decisions, data use and human oversight review?',
    kpiFields: ['kpiAiTrainingOptOut', 'kpiAlgoTransparency', 'kpiAutomatedDecision', 'kpiAiBiasFairness'],
  },
  {
    id: 'iso-42001',
    name: 'ISO/IEC 42001:2023',
    shortName: 'ISO/IEC 42001',
    referenceUrl: 'https://www.iso.org/standard/42001',
    referenceVersion: 'ISO/IEC 42001:2023 overview',
    reviewQuestion: 'Which recorded policy statements may inform an AI management-system review of transparency, risk oversight and independent assurance?',
    kpiFields: ['kpiAlgoTransparency', 'kpiAiBiasFairness', 'kpiIndependentAudit', 'kpiRegulatoryCompliance'],
  },
  {
    id: 'nist-ai-rmf',
    name: 'NIST AI Risk Management Framework 1.0',
    shortName: 'NIST AI RMF',
    referenceUrl: 'https://www.nist.gov/itl/ai-risk-management-framework',
    referenceVersion: 'AI RMF 1.0; NIST revision in progress, checked 2026-07-29',
    reviewQuestion: 'Which recorded policy statements may support Govern, Map, Measure or Manage review questions?',
    kpiFields: ['kpiAlgoTransparency', 'kpiAutomatedDecision', 'kpiAiBiasFairness', 'kpiContentModeration'],
  },
  {
    id: 'oecd-ai-principles',
    name: 'OECD AI Principles',
    shortName: 'OECD AI Principles',
    referenceUrl: 'https://oecd.ai/en/ai-principles',
    referenceVersion: 'OECD AI Principles, updated 2024',
    reviewQuestion: 'Which recorded policy statements may be relevant to transparency, fairness, accountability and user agency review?',
    kpiFields: ['kpiConsentMechanism', 'kpiAlgoTransparency', 'kpiAiBiasFairness', 'kpiIndependentAudit'],
  },
] as const;

export const GOVERNANCE_MAPPING_BOUNDARY =
  'Mappings identify review relevance between recorded PolicyWatcher KPI fields and framework topics. They are not legal interpretations, conformity assessments, certifications or compliance verdicts.';

export function buildGovernanceMappings(
  values: Partial<Record<KpiField, string | null | undefined>>,
): GovernanceFrameworkMapping[] {
  return GOVERNANCE_FRAMEWORKS.map((framework) => {
    const evidence = framework.kpiFields.flatMap((field) => {
      const value = values[field];
      if (!isAssessedKpiValue(value)) return [];
      return [{ field, label: KPI_METRICS[field].label.en, value: value.trim() }];
    });

    return {
      framework,
      status: evidence.length > 0 ? 'mapped' : 'not-assessed',
      assessedCount: evidence.length,
      mappedFieldCount: framework.kpiFields.length,
      evidence,
    };
  });
}
