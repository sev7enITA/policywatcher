export type ChangeKind = 'substantive' | 'editorial' | 'unchanged' | 'needs_review';
export type ChangeClassificationReason = 'identical_text' | 'presentation_only' | 'changed_clause_anchor' | 'missing_public_pair' | 'comparison_limit' | 'unverified_meaning';

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
  /** An AI-selected quote is shown only after independent exact anchoring. */
  anchoredQuote?: { text: string; side: 'old' | 'new'; relatedKpi: string };
}

export interface ChangeClassification {
  version: '1.0';
  kind: ChangeKind;
  reason: ChangeClassificationReason;
  impact: 'not_assessed';
  compared: boolean;
  oldHash: string | null;
  newHash: string | null;
  oldVersion: number | null;
  newVersion: number | null;
  totalHunks: number;
  evidence: ChangeEvidence[];
}

export function shouldNotifyChange(classification?: Pick<ChangeClassification, 'kind'> | null): boolean {
  // Unknown/legacy cases must remain visible for review, never silently suppressed.
  return classification?.kind !== 'editorial' && classification?.kind !== 'unchanged';
}
