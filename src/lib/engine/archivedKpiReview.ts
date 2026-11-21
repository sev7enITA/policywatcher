import { KPI_ALLOWED_VALUES, KPI_FIELD_KEYS, NOT_ASSESSED_KPI_VALUE, type KpiField } from '../metricsCatalog';
import { qualificationDigest } from './qualification';

type ObjectRow = Record<string, unknown>;

function record(x: unknown): x is ObjectRow {
  return x !== null && typeof x === 'object' && !Array.isArray(x);
}
function exact(x: unknown, keys: readonly string[]): x is ObjectRow {
  return record(x) && Object.keys(x).length === keys.length && keys.every(k => Object.hasOwn(x, k));
}
function label(x: unknown): x is string {
  return typeof x === 'string' && x.length <= 200 && x.trim().length > 0;
}
function sha(x: unknown): x is string {
  return typeof x === 'string' && /^[a-f0-9]{64}$/.test(x);
}
function array(x: unknown): unknown[] {
  if (!Array.isArray(x)) throw new Error('expected_array');
  return x;
}
interface Source {
  edition: string; version: number; publicEvidence: boolean;
}
interface FrozenAnalysis {
  changeId: string; snapshotId: string; sha256: string;
  source: Source | null;
  values: Record<KpiField, string | null>;
}

function cohortRows(cohort: unknown): FrozenAnalysis[] {
  if (!exact(cohort, ['schema', 'analyses']) || cohort.schema !== 'pw-retro-kpi-1') throw new Error('invalid_cohort');
  const ids = new Set<string>();
  const result: FrozenAnalysis[] = [];
  for (const row of array(cohort.analyses)) {
    if (!exact(row, ['changeId', 'snapshotId', 'sha256', 'source', 'values']) ||
      !label(row.changeId) || ids.has(row.changeId) || !label(row.snapshotId) || !sha(row.sha256) ||
      !exact(row.values, KPI_FIELD_KEYS)) throw new Error('invalid_analysis');
    const values = row.values;
    for (const key of KPI_FIELD_KEYS) {
      const value = values[key];
      // Preserve legacy labels for diagnosis; only the current vocabulary counts below.
      if (value !== null && typeof value !== 'string') throw new Error('invalid_baseline_value');
    }
    const source = row.source;
    if (source !== null && (!exact(source, ['edition', 'version', 'publicEvidence']) ||
      !label(source.edition) || !Number.isSafeInteger(source.version) || Number(source.version) < 1 ||
      typeof source.publicEvidence !== 'boolean')) throw new Error('invalid_source');
    ids.add(row.changeId);
    result.push(row as unknown as FrozenAnalysis);
  }
  if (!result.length) throw new Error('empty_cohort');
  return result;
}

function decisionIndex(input: unknown) {
  const map = new Map<string, { reviewer: string; verdict: string; reason: string }>();
  for (const d of array(input)) {
    if (!exact(d, ['proposalHash', 'reviewer', 'verdict', 'reason']) || !sha(d.proposalHash) ||
        !label(d.reviewer) || typeof d.reason !== 'string' || !d.reason.trim() ||
        typeof d.verdict !== 'string' || !['supported', 'unsupported', 'uncertain'].includes(d.verdict) ||
        map.has(d.proposalHash)) throw new Error('invalid_or_duplicate_adjudication');
    map.set(d.proposalHash, { reviewer: d.reviewer, verdict: d.verdict, reason: d.reason });
  }
  return map;
}

interface Suggestion {
  changeId: string; field: KpiField; snapshotId: string; sha256: string; version: number;
  edition: string; value: string; reviewer: string; quotes: Array<{ start: number; end: number; text: string }>;
}
function canonicalProposal(p: Suggestion) {
  return qualificationDigest(JSON.stringify([
    p.changeId, p.field, p.snapshotId, p.sha256, p.version, p.edition, p.value, p.reviewer,
    p.quotes.map(q => [q.start, q.end, q.text]),
  ]));
}

/** Read-only replay. A trusted caller pins the entire cohort and supplies adjudications separately from model proposals. */
export function assessArchivedKpis(cohort: unknown, archive: unknown, proposals: unknown, adjudications: unknown) {
  const analyses = cohortRows(cohort);
  if (!record(archive)) throw new Error('invalid_archive');
  const byId = new Map(analyses.map(r => [r.changeId, r]));
  const codePoints = new Map<string, string[]>();
  for (const [hash, text] of Object.entries(archive)) {
    if (!sha(hash) || typeof text !== 'string' || qualificationDigest(text) !== hash) throw new Error('archive_digest_mismatch');
  }
  const decisions = decisionIndex(adjudications);
  const seen = new Set<string>();
  const entries = new Map<string, Map<KpiField, Array<{ value: string; supported: boolean }>>>();
  const findings = array(proposals).map((raw, index) => {
    if (!exact(raw, ['changeId','field','snapshotId','sha256','version','edition','value','reviewer','quotes']) ||
        !label(raw.changeId) || !KPI_FIELD_KEYS.includes(raw.field as KpiField) ||
        !label(raw.reviewer) || !label(raw.value) || !Array.isArray(raw.quotes) ||
        !raw.quotes.length || raw.quotes.length > 30) return { index, outcome: 'invalid_proposal' };
    const row = byId.get(raw.changeId);
    const field = raw.field as KpiField;
    if (!row || !row.source || raw.snapshotId !== row.snapshotId || raw.sha256 !== row.sha256 ||
        raw.version !== row.source.version || raw.edition !== row.source.edition) return { index, outcome: 'source_mismatch' };
    if (!row.source.publicEvidence) return { index, outcome: 'withheld_source' };
    if (KPI_ALLOWED_VALUES[field].includes(row.values[field] ?? '')) return { index, outcome: 'already_assessed' };
    if (!KPI_ALLOWED_VALUES[field].includes(raw.value)) return { index, outcome: 'unsupported_value' };
    const text = archive[row.sha256];
    if (typeof text !== 'string') return { index, outcome: 'missing_archived_text' };
    // Offsets in archived sources count Unicode code points, including supplementary characters.
    const chars = codePoints.get(row.sha256) ?? Array.from(text);
    codePoints.set(row.sha256, chars);
    for (const q of raw.quotes) {
      if (!exact(q, ['start','end','text']) || typeof q.start !== 'number' || typeof q.end !== 'number' ||
          !Number.isSafeInteger(q.start) || !Number.isSafeInteger(q.end) || q.start < 0 || q.end > chars.length ||
          q.start >= q.end || typeof q.text !== 'string' || !q.text.trim() ||
          chars.slice(q.start, q.end).join('') !== q.text) return { index, outcome: 'invalid_quote' };
    }
    const proposalHash = canonicalProposal(raw as unknown as Suggestion);
    if (seen.has(proposalHash)) return { index, proposalHash, outcome: 'duplicate' };
    seen.add(proposalHash);
    const decision = decisions.get(proposalHash);
    if (decision && decision.reviewer.trim().toLowerCase() === raw.reviewer.trim().toLowerCase()) throw new Error('independent_reviewer_required');
    const supported = decision?.verdict === 'supported';
    const fields = entries.get(row.changeId) ?? new Map();
    const suggestions = fields.get(field) ?? [];
    suggestions.push({ value: raw.value, supported });
    fields.set(field, suggestions);
    entries.set(row.changeId, fields);
    return { index, proposalHash, outcome: decision?.verdict ?? 'awaiting_review' };
  });
  if ([...decisions.keys()].some(hash => !seen.has(hash))) throw new Error('adjudication_without_valid_proposal');
  const cells = [];
  let baselineAssessed = 0;
  let baselineOutsideCatalogue = 0;
  for (const row of analyses) {
    for (const field of KPI_FIELD_KEYS) {
      const existing = row.values[field];
      if (KPI_ALLOWED_VALUES[field].includes(existing ?? '')) {
        baselineAssessed++;
        continue;
      }
      if (existing && existing !== NOT_ASSESSED_KPI_VALUE) baselineOutsideCatalogue++;
      const candidates = entries.get(row.changeId)?.get(field) ?? [];
      const supported = [...new Set(candidates.filter(c => c.supported).map(c => c.value))];
      const reason = supported.length > 1 ? 'conflicting_approvals' : supported.length ? 'supported' :
        candidates.length ? 'no_supported_decision' : 'no_valid_proposal';
      cells.push({ changeId: row.changeId, snapshotId: row.snapshotId, field, baselineValue: existing, reason,
        value: reason === 'supported' ? supported[0] : null });
    }
  }
  const denominator = analyses.length * KPI_FIELD_KEYS.length;
  const newlySupported = cells.filter(c => c.value !== null).length;
  const assessedAfterReview = baselineAssessed + newlySupported;
  return { schema: 'pw-retro-kpi-report-1', denominator, baselineAssessed, baselineOutsideCatalogue,
    baselineNotAssessed: denominator - baselineAssessed - baselineOutsideCatalogue, newlySupported, assessedAfterReview,
    unresolved: denominator - assessedAfterReview, minimumAdditionalForOver90: Math.max(0, Math.floor(denominator * 9 / 10) + 1 - assessedAfterReview),
    over90Percent: assessedAfterReview * 10 > denominator * 9, findings, cells };
}
