import { diffLines } from 'diff';
import { extractPolicyText } from '../scraper';
import { digest } from './document';
import type { CaptureBody, Observation } from './acquisition';
import type { TaskInput } from './store';

/** No fetch, inference, baseline update or publication. Both outputs use one capture. */
export function compareCapturedExtraction(body: CaptureBody, input: TaskInput, observation: Observation) {
  const started = performance.now();
  const stableText = extractPolicyText(body.html, input.sourceUrl);
  const stableExtractionMs = performance.now() - started;
  const previewText = body.document.text;
  const diffOmitted = stableText.length + previewText.length > 100_000;
  const differences = diffOmitted ? [] : diffLines(stableText, previewText).filter(part => part.added || part.removed);
  return { schema: 'pw-extraction-comparison-1', scope: 'same-capture-extraction', observedAt: observation.observedAt,
    sourceUrl: input.sourceUrl, finalUrl: observation.finalUrl, transport: observation.source,
    captureArtifactId: observation.artifactId, captureInputHash: digest(body.html), baselineHash: input.baselineHash,
    stable: { version: '5.2.0', textHash: digest(stableText), chars: stableText.length, extracted: stableText.length > 0, extractionMs: stableExtractionMs },
    preview: { version: body.document.schema, profileHash: input.profileHash, textHash: body.document.hash,
      language: body.language || null,
      chars: previewText.length, eligible: observation.eligible, reasons: observation.reasons,
      structuralIssues: body.extraction?.issues || [] },
    identicalText: stableText === previewText,
    differences: differences.slice(0, 20).map(part => ({ side: part.added ? 'preview' : 'stable',
      text: part.value.slice(0, 2000), truncated: part.value.length > 2000 })),
    differencesTruncated: diffOmitted || differences.length > 20, diffOmittedReason: diffOmitted ? 'comparison_size_limit' : null,
    modelComparisonPerformed: false, acquisitionComparisonPerformed: false,
    completenessQualified: false,
    boundary: 'One decoded capture, two extractors. Differences are review candidates, not proof of omissions or correctness. AI analysis, live acquisition performance and total scan costs are not compared. PDF input may be a converted representation.' };
}
