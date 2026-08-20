import registryJson from '../../evals/ai-model-registry.v1.json';

export type AiModelWorkload = 'retrieval' | 'extraction' | 'escalation' | 'architecture';
export type AiModelStatus = 'qualified' | 'blocked' | 'pending' | 'research-only';
export type AiEvaluationState = 'observed' | 'observed-unavailable' | 'not-observed';

export interface AiModelCandidate {
  id: string;
  workload: AiModelWorkload;
  provider: string;
  model: string;
  status: AiModelStatus;
  evaluation: {
    state: AiEvaluationState;
    cases: number;
    metrics: Record<string, number>;
    passesFrozenGates: boolean;
  };
  evidenceRefs: string[];
  blockers?: string[];
  decision: string;
}

export interface AiModelRegistry {
  $schema?: string;
  schemaVersion: 'policywatcher-ai-model-registry.v1';
  asOf: string;
  promotionPolicy: {
    mode: 'human-approved-evidence-first';
    automaticPromotion: false;
    requiresObservedEvaluation: true;
    requiresSchemaConformance: true;
    requiresEvidenceQuality: true;
    requiresOperationalAvailability: true;
    privacyBoundary: string;
  };
  candidates: AiModelCandidate[];
}

const WORKLOADS = new Set<AiModelWorkload>(['retrieval', 'extraction', 'escalation', 'architecture']);
const STATUSES = new Set<AiModelStatus>(['qualified', 'blocked', 'pending', 'research-only']);
const EVALUATION_STATES = new Set<AiEvaluationState>(['observed', 'observed-unavailable', 'not-observed']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function validateAiModelRegistry(value: unknown): asserts value is AiModelRegistry {
  if (!isRecord(value)) throw new Error('AI model registry must be an object.');
  if (value.schemaVersion !== 'policywatcher-ai-model-registry.v1') throw new Error('Unsupported AI model registry schema.');
  if (typeof value.asOf !== 'string' || Number.isNaN(Date.parse(`${value.asOf}T00:00:00Z`))) throw new Error('AI model registry requires an ISO date.');
  if (!isRecord(value.promotionPolicy)) throw new Error('AI model registry promotion policy is missing.');
  if (value.promotionPolicy.mode !== 'human-approved-evidence-first' || value.promotionPolicy.automaticPromotion !== false) {
    throw new Error('AI model promotion must remain human-approved and evidence-first.');
  }
  for (const key of ['requiresObservedEvaluation', 'requiresSchemaConformance', 'requiresEvidenceQuality', 'requiresOperationalAvailability'] as const) {
    if (value.promotionPolicy[key] !== true) throw new Error(`AI promotion invariant is disabled: ${key}.`);
  }
  if (!Array.isArray(value.candidates) || value.candidates.length === 0) throw new Error('AI model registry candidates are missing.');

  const ids = new Set<string>();
  for (const candidate of value.candidates) {
    if (!isRecord(candidate) || typeof candidate.id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(candidate.id)) {
      throw new Error('AI model candidate id is invalid.');
    }
    if (ids.has(candidate.id)) throw new Error(`Duplicate AI model candidate: ${candidate.id}.`);
    ids.add(candidate.id);
    if (!WORKLOADS.has(candidate.workload as AiModelWorkload)) throw new Error(`Invalid workload for ${candidate.id}.`);
    if (!STATUSES.has(candidate.status as AiModelStatus)) throw new Error(`Invalid status for ${candidate.id}.`);
    if (typeof candidate.provider !== 'string' || typeof candidate.model !== 'string') throw new Error(`Provider/model missing for ${candidate.id}.`);
    if (!Array.isArray(candidate.evidenceRefs) || candidate.evidenceRefs.length === 0) throw new Error(`Evidence missing for ${candidate.id}.`);
    if (!isRecord(candidate.evaluation)) throw new Error(`Evaluation missing for ${candidate.id}.`);
    if (!EVALUATION_STATES.has(candidate.evaluation.state as AiEvaluationState)) throw new Error(`Evaluation state invalid for ${candidate.id}.`);
    if (!Number.isInteger(candidate.evaluation.cases) || (candidate.evaluation.cases as number) < 0) throw new Error(`Case count invalid for ${candidate.id}.`);
    if (!isRecord(candidate.evaluation.metrics) || typeof candidate.evaluation.passesFrozenGates !== 'boolean') throw new Error(`Metrics invalid for ${candidate.id}.`);

    const qualified = candidate.status === 'qualified';
    if (qualified && (candidate.evaluation.state !== 'observed' || candidate.evaluation.passesFrozenGates !== true || (candidate.evaluation.cases as number) < 1)) {
      throw new Error(`Qualified candidate lacks observed passing evidence: ${candidate.id}.`);
    }
    if (!qualified && candidate.evaluation.passesFrozenGates === true) throw new Error(`Non-qualified candidate cannot pass frozen gates: ${candidate.id}.`);
    if ((candidate.status === 'blocked' || candidate.status === 'pending') && (!Array.isArray(candidate.blockers) || candidate.blockers.length === 0)) {
      throw new Error(`Blocked or pending candidate lacks an explicit blocker: ${candidate.id}.`);
    }
    if (candidate.status === 'research-only' && candidate.workload !== 'architecture') {
      throw new Error(`Research-only candidate must remain an architecture option: ${candidate.id}.`);
    }
  }
}

validateAiModelRegistry(registryJson);

export const AI_MODEL_REGISTRY = registryJson as AiModelRegistry;

export function getAiModelCandidate(id: string): AiModelCandidate | undefined {
  return AI_MODEL_REGISTRY.candidates.find((candidate) => candidate.id === id);
}

export function canPromoteAiModel(candidate: AiModelCandidate): boolean {
  return candidate.status === 'qualified'
    && candidate.evaluation.state === 'observed'
    && candidate.evaluation.cases > 0
    && candidate.evaluation.passesFrozenGates;
}
