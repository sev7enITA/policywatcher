import { createHash } from 'node:crypto';
import { createInsight, type InsightBody, type InsightWarning } from '../../integrations/policy-as-code/insight-ir.mjs';

interface PublicSnapshot {
  version: number;
  text: string;
  publicEvidence: boolean;
  createdAt: Date | string;
}

/** Deliberately excludes EngineReview, raw inference, reviewer and tenant data. */
export interface PublicInsightInput {
  id: string;
  publicEvidence: boolean;
  publicPublishedAt: Date | string | null;
  createdAt: Date | string;
  tldrEn: string | null;
  aiSummaryEn: string;
  riskReasonsJson: string | null;
  oldSnapshot: PublicSnapshot | null;
  newSnapshot: PublicSnapshot;
  policy: {
    id: string;
    url: string;
    jurisdiction: string;
    ingestionMethod: string;
    dataStatus: string;
  };
}

const sha256 = (text: string) => createHash('sha256').update(text, 'utf8').digest('hex');
function iso(value: Date | string): string | null {
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : null;
}
function clean(value: unknown, max: number): string {
  return typeof value === 'string' ? Array.from(value.trim()).slice(0, max).join('') : '';
}
function category(kpi: unknown): 'retention' | 'data-use' | 'licensing' | 'screening' {
  if (kpi === 'kpiDataRetention') return 'retention';
  if (kpi === 'kpiDataCollection' || kpi === 'kpiAiTrainingOptOut') return 'data-use';
  // No licensing KPI is currently mapped: do not infer one from prose.
  return 'screening';
}

/** Pure public projection. Missing qualification stays unknown; publication grants no execution. */
export function buildPublicInsight(input: PublicInsightInput, asOf = new Date()) {
  const publishedAt = input.publicPublishedAt && iso(input.publicPublishedAt);
  if (!input.publicEvidence || !input.newSnapshot.publicEvidence
    || input.policy.ingestionMethod.trim().toLowerCase() === 'seeded'
    || !['Available', 'Reviewed'].includes(input.policy.dataStatus)
    || !publishedAt || new Date(publishedAt) > asOf) return null;

  let url: URL;
  try { url = new URL(input.policy.url); } catch { return null; }
  if (url.protocol !== 'https:') return null;
  const redacted = Boolean(url.username || url.password || url.search || url.hash);
  url.username = ''; url.password = ''; url.search = ''; url.hash = '';
  const warnings = new Set<InsightWarning>([
    'source_completeness_unqualified', 'semantic_verification_not_performed',
    'effective_date_unknown', 'source_metadata_not_verified', 'extractor_version_not_recorded',
  ]);
  if (redacted) warnings.add('source_url_scope_redacted');
  if (input.oldSnapshot && !input.oldSnapshot.publicEvidence) warnings.add('private_before_omitted');
  const before = input.oldSnapshot?.publicEvidence ? input.oldSnapshot : null;
  const capture = (snapshot: PublicSnapshot) => ({
    version: snapshot.version, capturedAt: iso(snapshot.createdAt) ?? '', textSha256: sha256(snapshot.text),
    representation: 'normalized-text' as const, offsetEncoding: 'utf-16-code-units' as const,
    extractorVersion: null,
  });
  const snapshots = { before: before ? capture(before) : null, after: capture(input.newSnapshot) };
  let reasons: unknown = [];
  try { reasons = JSON.parse(input.riskReasonsJson ?? '[]'); } catch { /* Legacy malformed metadata stays unanchored. */ }
  const claims = (Array.isArray(reasons) ? reasons.slice(0, 3) : []).flatMap((raw, index) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return [];
    const reason = raw as Record<string, unknown>;
    // Do not leak even the statement of a reason explicitly tied to a private predecessor.
    if (reason.evidenceSide === 'old' && !before) return [];
    const statement = clean(reason.textEn, 180);
    if (!statement) return [];
    const side = reason.evidenceSide === 'old' ? 'before' as const
      : reason.evidenceSide === 'new' ? 'after' as const : null;
    const source = side === 'before' ? before : side === 'after' ? input.newSnapshot : null;
    // Never truncate evidence: a matching prefix is not the supplied quotation.
    const rawQuote = reason.evidenceQuote;
    const quote = typeof rawQuote === 'string' && rawQuote.trim() && rawQuote.length <= 240 ? rawQuote : '';
    if (rawQuote && !quote) warnings.add('quote_rejected');
    const start = source && quote ? source.text.indexOf(quote) : -1;
    const ambiguous = source && start >= 0 && source.text.indexOf(quote, start + 1) >= 0;
    if (ambiguous) warnings.add('quote_ambiguous');
    else if (quote && start < 0) warnings.add('quote_rejected');
    const evidence = source && side && quote && start >= 0 && !ambiguous ? [{
      side, start, end: start + quote.length, quote, quoteSha256: sha256(quote), textSha256: sha256(source.text),
    }] : [];
    return [{ id: `reason-${index + 1}`, kind: 'inferred' as const, category: category(reason.relatedKpi),
      statement, value: { type: 'text' as const, value: statement }, evidence }];
  });
  if (!claims.length) {
    const statement = clean(input.tldrEn || input.aiSummaryEn, 180);
    if (!statement) return null;
    claims.push({ id: 'summary', kind: 'inferred', category: 'screening', statement,
      value: { type: 'text', value: statement }, evidence: [] });
  }
  if (claims.some(claim => !claim.evidence.length)) warnings.add('legacy_unanchored');
  const observedAt = iso(input.newSnapshot.createdAt);
  if (!observedAt || !snapshots.after.capturedAt || (snapshots.before && !snapshots.before.capturedAt)) return null;
  const body: InsightBody = {
    schemaVersion: '0.1.0', id: input.id, revision: input.newSnapshot.version, visibility: 'public',
    provenance: { producer: 'PolicyWatcher', adapterVersion: '0.1.0' },
    source: { policyId: input.policy.id, scopeId: `policywatcher:policy:${input.policy.id}`,
      publicUrl: url.toString(), jurisdiction: clean(input.policy.jurisdiction, 120) || null },
    times: { observedAt, publishedAt, effectiveAt: null }, snapshots, claims,
    quality: { identity: 'not_verified', completeness: 'unqualified', language: 'not_verified',
      freshness: 'not_verified', semanticVerification: 'not_verified' },
    review: { status: 'required', approved: false },
    decision: { state: 'indeterminate', executionAuthorized: false },
    warnings: [...warnings].sort(),
  };
  return createInsight(body);
}
