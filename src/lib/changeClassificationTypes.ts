export type ChangeKind = 'substantive' | 'editorial' | 'unchanged' | 'needs_review';
export type ChangeClassificationReason = 'identical_text' | 'presentation_only' | 'changed_clause_anchor' | 'missing_public_pair' | 'comparison_limit' | 'unverified_meaning';
export type ChangeComparisonStatus = 'complete' | 'partial' | 'incomplete';

export interface ChangeExcerpt {
  /** Exact substring and UTF-16 offsets in the immutable snapshot. */
  text: string;
  start: number;
  end: number;
  changedStart: number;
  changedEnd: number;
}

export interface ChangeEvidence {
  before: ChangeExcerpt;
  after: ChangeExcerpt;
  /** Both versions differ in this window; individual edits could not be aligned. */
  precision?: 'block';
  /** An AI-selected quote is shown only after independent exact anchoring. */
  anchoredQuote?: { text: string; side: 'old' | 'new'; relatedKpi: string };
}

export interface ChangeClassification {
  version: '1.0';
  kind: ChangeKind;
  reason: ChangeClassificationReason;
  impact: 'not_assessed';
  compared: boolean;
  /** Outcome of the comparison, independent from the semantic classification. */
  comparisonStatus?: ChangeComparisonStatus;
  oldHash: string | null;
  newHash: string | null;
  oldVersion: number | null;
  newVersion: number | null;
  totalHunks: number;
  /** Changed windows whose edits were not resolved individually. */
  blockHunks?: number;
  evidence: ChangeEvidence[];
}

export function comparisonStatusOf(
  classification?: Pick<ChangeClassification, 'compared' | 'blockHunks'> | null,
): ChangeComparisonStatus {
  if (classification?.compared !== true) return 'incomplete';
  return classification.blockHunks ? 'partial' : 'complete';
}

export function shouldNotifyChange(classification?: Pick<ChangeClassification, 'kind' | 'compared' | 'blockHunks'> | null): boolean {
  if (comparisonStatusOf(classification) !== 'complete') return false;
  return classification?.kind !== 'editorial' && classification?.kind !== 'unchanged';
}
