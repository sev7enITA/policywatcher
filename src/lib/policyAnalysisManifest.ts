import { createHash } from 'node:crypto';

// Matches the extraction ceiling. This is an application limit, not a token
// estimate or a claim about the provider's attention to the supplied text.
export const MAX_ANALYSIS_DOCUMENT_CHARS = 500_000;
export const POLICY_ANALYSIS_INPUT_VERSION = 'full-document.v1';

export function analysisDigest(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

export function assertCompleteAnalysisInput(oldText: string, newText: string): void {
  if (!newText.trim()) throw new Error('analysis_input_empty');
  for (const [side, text] of [['old', oldText], ['new', newText]] as const) {
    if (text.length > MAX_ANALYSIS_DOCUMENT_CHARS) {
      throw new Error(`analysis_input_limit:${side}:${text.length}:coverage_incomplete`);
    }
  }
}

function documentCoverage(text: string) {
  return {
    sha256: analysisDigest(text),
    charLength: text.length,
    byteLength: Buffer.byteLength(text, 'utf8'),
    rangeUnit: 'utf16-code-unit' as const,
    includedRanges: text.length ? [[0, text.length]] : [],
    excludedRanges: [] as number[][],
  };
}

export function buildPolicyAnalysisManifest(input: {
  traceId: string;
  context: { companyName: string; policyName: string };
  oldText: string;
  newText: string;
  request: {
    model: string;
    contents: string;
    config: { systemInstruction: string; [key: string]: unknown };
  };
  rawResponse: string;
  normalizedResponse: unknown;
  promptVersion: string;
  schemaVersion: string;
  attempt: number;
}) {
  assertCompleteAnalysisInput(input.oldText, input.newText);
  const { systemInstruction, ...generationConfig } = input.request.config;
  return {
    contractVersion: '1.0.0',
    inputVersion: POLICY_ANALYSIS_INPUT_VERSION,
    traceId: input.traceId,
    model: input.request.model,
    attempt: input.attempt,
    promptVersion: input.promptVersion,
    schemaVersion: input.schemaVersion,
    // Hash the exact JSON serialization of the application request passed to
    // the SDK. Authentication and SDK transport headers are intentionally absent.
    requestSerialization: 'JSON.stringify/UTF-8',
    requestBoundary: 'application-sdk-request',
    requestSha256: analysisDigest(JSON.stringify(input.request)),
    promptSha256: analysisDigest(input.request.contents),
    promptRecipe: {
      template: input.oldText ? CHANGE_PROMPT_TEMPLATE : BASELINE_PROMPT_TEMPLATE,
      fields: input.context,
      documentFields: { oldText: 'oldDocument.sha256', newText: 'newDocument.sha256' },
    },
    systemInstruction,
    systemInstructionSha256: analysisDigest(systemInstruction),
    configurationSha256: analysisDigest(JSON.stringify(generationConfig)),
    generationConfig,
    oldDocument: documentCoverage(input.oldText),
    newDocument: documentCoverage(input.newText),
    inputCoverage: 'complete',
    semanticCoverage: 'not_measured',
    rawResponse: input.rawResponse,
    rawResponseSha256: analysisDigest(input.rawResponse),
    normalizedResponseSha256: analysisDigest(JSON.stringify(input.normalizedResponse)),
    validation: { structuredSchema: 'passed', normalization: 'applied' },
  } as const;
}

export type PolicyAnalysisManifest = ReturnType<typeof buildPolicyAnalysisManifest>;

/** Reconstructs the SDK request from retained templates and immutable snapshots. */
export function verifyPolicyAnalysisManifest(manifest: PolicyAnalysisManifest, oldText: string, newText: string) {
  const issues: string[] = [];
  const fields = { ...manifest.promptRecipe.fields, oldText, newText };
  const contents = manifest.promptRecipe.template.replace(
    /{{(companyName|policyName|oldText|newText)}}/g,
    (_, key: keyof typeof fields) => fields[key],
  );
  const request = {
    model: manifest.model,
    contents,
    config: { systemInstruction: manifest.systemInstruction, ...manifest.generationConfig },
  };
  const check = (actual: string, expected: string, name: string) => { if (actual !== expected) issues.push(name); };
  check(analysisDigest(oldText), manifest.oldDocument.sha256, 'old_document_hash');
  check(analysisDigest(newText), manifest.newDocument.sha256, 'new_document_hash');
  check(analysisDigest(contents), manifest.promptSha256, 'prompt_hash');
  check(analysisDigest(manifest.systemInstruction), manifest.systemInstructionSha256, 'system_hash');
  check(analysisDigest(JSON.stringify(manifest.generationConfig)), manifest.configurationSha256, 'configuration_hash');
  check(analysisDigest(JSON.stringify(request)), manifest.requestSha256, 'request_hash');
  check(analysisDigest(manifest.rawResponse), manifest.rawResponseSha256, 'response_hash');
  for (const [side, text] of [['oldDocument', oldText], ['newDocument', newText]] as const) {
    if (JSON.stringify(documentCoverage(text)) !== JSON.stringify(manifest[side])) issues.push(`${side}_coverage`);
  }
  return { valid: issues.length === 0, issues };
}

const BASELINE_PROMPT_TEMPLATE = `You are a legal and regulatory compliance AI expert. Analyze this policy:
       Company: {{companyName}}
       Policy: {{policyName}}

       Policy Text:
       {{newText}}

       Provide a structured JSON assessment of this policy.`;
const CHANGE_PROMPT_TEMPLATE = `You are a legal and regulatory compliance AI expert. Compare these two versions of a policy and analyze the changes:
       Company: {{companyName}}
       Policy: {{policyName}}

       OLD VERSION:
       {{oldText}}

       NEW VERSION:
       {{newText}}

       Analyze what changed and how it impacts users and businesses in different regions.`;

export function buildPolicyAnalysisPrompt(companyName: string, policyName: string, oldText: string, newText: string): string {
  assertCompleteAnalysisInput(oldText, newText);
  const fields = { companyName, policyName, oldText, newText };
  return (oldText ? CHANGE_PROMPT_TEMPLATE : BASELINE_PROMPT_TEMPLATE).replace(
    /{{(companyName|policyName|oldText|newText)}}/g,
    (_, key: keyof typeof fields) => fields[key],
  );
}
