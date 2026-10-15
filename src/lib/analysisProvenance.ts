import { AI_ANALYSIS_PROMPT_VERSION } from './aiTelemetry';
import { POLICY_ANALYSIS_SCHEMA_VERSION } from './geminiPolicySchema';
import type { PolicyAnalysisResult } from './gemini';

export const POLICY_SCORE_METHOD = 'ai_generated' as const;

export function buildAnalysisProvenance(input: {
  traceId: string;
  versionId: string;
  oldVersionId?: string | null;
  contentHash: string;
  analysis: Pick<PolicyAnalysisResult, 'overallScore' | 'overallRisk' | 'riskReasons' | 'inferenceManifest'>;
}) {
  const anchors = input.analysis.riskReasons.flatMap((reason, index) =>
    reason.evidenceQuote && reason.evidenceSide
      ? [{
          reasonIndex: index,
          evidenceSide: reason.evidenceSide,
          evidenceQuote: reason.evidenceQuote,
          relatedKpi: reason.relatedKpi || null,
        }]
      : []
  );
  return {
    contractVersion: '1.1.0',
    traceId: input.traceId,
    inference: input.analysis.inferenceManifest ?? null,
    inputCoverage: input.analysis.inferenceManifest?.inputCoverage ?? 'unknown',
    schemaVersion: POLICY_ANALYSIS_SCHEMA_VERSION,
    promptVersion: AI_ANALYSIS_PROMPT_VERSION,
    score: {
      method: POLICY_SCORE_METHOD,
      deterministic: false,
      scale: '1-10',
      value: input.analysis.overallScore,
      risk: input.analysis.overallRisk,
    },
    sourceVersion: { id: input.versionId, contentHash: input.contentHash },
    sourceVersions: {
      old: input.oldVersionId ? { id: input.oldVersionId, contentHash: input.analysis.inferenceManifest?.oldDocument.sha256 ?? null } : null,
      new: { id: input.versionId, contentHash: input.contentHash },
    },
    riskReasonEvidence: {
      totalReasons: input.analysis.riskReasons.length,
      anchoredReasons: anchors.length,
      anchors,
    },
    boundary: 'The score is model-generated, not a deterministic compliance score. Evidence anchors support individual reasons only and do not establish legal applicability or correctness.',
  } as const;
}
