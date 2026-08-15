import { AI_MODEL_REGISTRY, canPromoteAiModel, getAiModelCandidate, validateAiModelRegistry } from '../src/lib/aiModelRegistry';

function candidateArgument(): string | null {
  const raw = process.argv.find((argument) => argument.startsWith('--candidate='));
  return raw ? raw.slice('--candidate='.length).trim() : null;
}

validateAiModelRegistry(AI_MODEL_REGISTRY);
const candidateId = candidateArgument();

if (!candidateId) {
  const qualified = AI_MODEL_REGISTRY.candidates.filter(canPromoteAiModel).map((candidate) => candidate.id);
  process.stdout.write(`AI model registry valid: ${AI_MODEL_REGISTRY.candidates.length} candidates, ${qualified.length} qualified (${qualified.join(', ')}).\n`);
  process.exit(0);
}

const candidate = getAiModelCandidate(candidateId);
if (!candidate) {
  process.stderr.write(`Unknown AI model candidate: ${candidateId}.\n`);
  process.exit(1);
}

if (!canPromoteAiModel(candidate)) {
  process.stderr.write(`Promotion denied for ${candidate.id}: status=${candidate.status}, evaluation=${candidate.evaluation.state}, frozenGates=${candidate.evaluation.passesFrozenGates}.\n`);
  for (const blocker of candidate.blockers ?? []) process.stderr.write(`- ${blocker}\n`);
  process.exit(2);
}

process.stdout.write(`Promotion evidence satisfied for ${candidate.id}; human approval is still required.\n`);
