import { KPI_ALLOWED_VALUES } from '../metricsCatalog';
import { cohortRows, verifiedSourceTexts } from './archivedKpiReview';
import { archivedEditionConflict } from './archivedEdition';
import { qualificationDigest } from './qualification';

const FIELD = 'kpiAiOutputOwnership';
interface Prior {
  schema: string;
  denominator: number;
  assessedAfterEditionCheck: number;
  newlySupported: number;
  baselineAssessedOnConflictingEditions: number;
  cohortSha256: string;
  archiveSha256: string;
  editionConflicts: { changeId: string }[];
  cells: {
    changeId: string;
    snapshotId: string;
    field: string;
    baselineValue: string | null;
    reason: string;
    value: string | null;
  }[];
}
export interface OwnershipRecord {
  changeId: string;
  snapshotId: string;
  sha256: string;
  url: string;
  edition: string;
  version: number;
  asOf: string;
  publicEvidence: boolean;
}
export interface ContractEdition {
  url: string;
  edition: string;
  sha256: string;
  text: string;
  effectiveFrom: string;
  confirmedThrough: string;
  datingEvidence: string;
}
interface Quote {
  start: number;
  end: number;
  text: string;
}
type Allocation = 'assigns_to_user' | 'allocates_to_both' | 'reserves_to_company';
const allocationValues: Record<Allocation, string> = {
  assigns_to_user: 'User Retained',
  allocates_to_both: 'Shared',
  reserves_to_company: 'Company Retained',
};
export interface ContractChain {
  proposedBy: string;
  value: string;
  scope: 'entire_record' | 'conditional' | 'unknown';
  rights: Allocation;
  // The first edition is the captured record. An incorporation clause may appear in either edition of a link.
  editions: string[];
  links: { citedBy: 'preceding' | 'following'; quotes: Quote[] }[];
  allocation: Quote[];
  scopeEvidence?: { edition: string; quotes: Quote[] }[];
  territorialOverrides?: {
    edition: string;
    incorporates: string;
    applicability: Quote[];
    reference: Quote[];
    allocation: Quote[];
  }[];
}
interface ResearchSource {
  id: string;
  url: string;
  sha256: string;
  text: string;
  origin: string;
  observed: string;
  quotes: Quote[];
}
export interface OwnershipReview {
  context?: string[];
  changeId: string;
  reason: string;
  references: string[];
  chain: ContractChain | null;
}
export interface Confirmation {
  hash: string;
  reviewer: string;
  // Explicit attestations by the second reader for this precise edition sequence and claim.
  checks: {
    historicalValidity: boolean;
    contractualLink: boolean;
    entireRecord: boolean;
    outputAllocation: boolean;
  };
  decision: 'supported' | 'unsupported' | 'uncertain';
  reason: string;
}

function assert(ok: unknown, code: string): asserts ok {
  if (!ok) throw new Error(code);
}
const labelled = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
const sha = (v: unknown): v is string => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v);
function day(s: string) {
  assert(typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s), 'invalid_contract_date');
  const parsed = new Date(s + 'T00:00:00Z');
  assert(Number.isFinite(+parsed) && parsed.toISOString().slice(0, 10) === s, 'invalid_contract_date');
  return s;
}
function https(s: string) {
  const url = new URL(s);
  return url.protocol === 'https:' && !url.username && !url.password;
}
function exactQuote(q: Quote, source: string) {
  return (
    q &&
    labelled(q.text) &&
    Number.isSafeInteger(q.start) &&
    Number.isSafeInteger(q.end) &&
    q.start >= 0 &&
    q.end > q.start &&
    Array.from(source).slice(q.start, q.end).join('') === q.text &&
    Array.from(q.text).length === q.end - q.start
  );
}
export function contractEditionId(d: ContractEdition) {
  return qualificationDigest(
    JSON.stringify([d.url, d.edition, d.sha256, d.effectiveFrom, d.confirmedThrough, d.datingEvidence]),
  );
}
export function ownershipChainId(r: OwnershipRecord, c: ContractChain) {
  const span = (q: Quote) => [q.start, q.end, q.text];
  return qualificationDigest(
    JSON.stringify([
      r.changeId,
      r.snapshotId,
      r.sha256,
      r.url,
      r.version,
      r.edition,
      r.asOf,
      c.proposedBy,
      c.value,
      c.scope,
      c.rights,
      c.editions,
      c.links.map((link) => [link.citedBy, link.quotes.map(span)]),
      c.allocation.map(span),
      ...(c.scopeEvidence ? [c.scopeEvidence.map((s) => [s.edition, s.quotes.map(span)])] : []),
      ...(c.territorialOverrides
        ? [
            c.territorialOverrides.map((o) => [
              o.edition,
              o.incorporates,
              o.applicability.map(span),
              o.reference.map(span),
              o.allocation.map(span),
            ]),
          ]
        : []),
    ]),
  );
}

/** Read-only extension to a pinned retrospective report. Inventory and document provenance are collected independently of model suggestions. */
interface LocalRemainder {
  fullPriorSha256: string;
  denominator: number;
  previousAssessed: number;
  cases: number;
  additionalExcludedForEdition: number;
}
export function reviewOwnership(
  prior: Prior,
  inventoryInput: {
    records: OwnershipRecord[];
    cohortRaw: string;
    archiveRaw: string;
    localRemainder?: LocalRemainder;
  },
  documents: ContractEdition[],
  reviews: OwnershipReview[],
  decisions: Confirmation[],
  researchSources: ResearchSource[] = [],
) {
  assert(
    prior.schema === 'pw-retro-kpi-report-1' &&
      Number.isSafeInteger(prior.denominator) &&
      prior.denominator > 0 &&
      Number.isSafeInteger(prior.assessedAfterEditionCheck) &&
      prior.assessedAfterEditionCheck >= 0 &&
      prior.assessedAfterEditionCheck <= prior.denominator &&
      Array.isArray(prior.cells),
    'invalid_pinned_baseline',
  );
  // Recover the exact inputs of the prior campaign before applying the edition rule to all observable records.
  const { records, cohortRaw, archiveRaw } = inventoryInput;
  assert(
    qualificationDigest(cohortRaw) === prior.cohortSha256 &&
      qualificationDigest(archiveRaw) === prior.archiveSha256,
    'baseline_input_mismatch',
  );
  const original = cohortRows(JSON.parse(cohortRaw));
  const archives = verifiedSourceTexts(JSON.parse(archiveRaw));
  assert(
    prior.denominator === original.length * Object.keys(KPI_ALLOWED_VALUES).length,
    'original_denominator_mismatch',
  );
  const byId = new Map(original.map((r) => [r.changeId, r]));
  const oldConflicts = new Set(prior.editionConflicts.map((c) => c.changeId));
  const conflicts = original.flatMap((r) => {
    const t = archives.get(r.sha256);
    const evidence = t && r.source?.publicEvidence ? archivedEditionConflict(r.source.edition, t) : null;
    if (!evidence) return [];
    const previouslyCounted =
      Object.entries(r.values).filter(([field, v]) =>
        KPI_ALLOWED_VALUES[field as keyof typeof KPI_ALLOWED_VALUES].includes(v ?? ''),
      ).length + prior.cells.filter((c) => c.changeId === r.changeId && c.value !== null).length;
    return [
      { changeId: r.changeId, ...evidence, alreadyExcluded: oldConflicts.has(r.changeId), previouslyCounted },
    ];
  });
  assert(
    [...oldConflicts].every((id) => conflicts.some((c) => c.changeId === id)),
    'previous_edition_conflict_missing',
  );
  const excluded = conflicts
    .filter((c) => !c.alreadyExcluded)
    .reduce((total, c) => total + c.previouslyCounted, 0);
  const eligible = new Map(
    prior.cells
      .filter(
        (c) => c.field === FIELD && c.value === null && (!c.baselineValue || c.baselineValue === 'Not assessed'),
      )
      .map((c) => [c.changeId, c]),
  );
  const inventory = new Map(records.map((r) => [r.changeId, r]));
  assert(eligible.size === inventory.size && inventory.size === records.length, 'ownership_inventory_mismatch');
  for (const r of records) {
    const root = byId.get(r.changeId);
    assert(
      root &&
        root.sha256 === r.sha256 &&
        root.source?.version === r.version &&
        root.source.edition === r.edition &&
        root.source.publicEvidence === r.publicEvidence,
      'ownership_source_mismatch',
    );
    assert(
      eligible.get(r.changeId)?.snapshotId === r.snapshotId &&
        labelled(r.snapshotId) &&
        sha(r.sha256) &&
        https(r.url) &&
        labelled(r.edition) &&
        Number.isSafeInteger(r.version) &&
        r.version > 0 &&
        typeof r.publicEvidence === 'boolean',
      'ownership_inventory_mismatch',
    );
    day(r.asOf);
  }
  const editions = new Map<string, ContractEdition>();
  for (const d of documents) {
    assert(
      https(d.url) &&
        labelled(d.edition) &&
        labelled(d.datingEvidence) &&
        labelled(d.text) &&
        qualificationDigest(d.text) === d.sha256 &&
        day(d.effectiveFrom) <= day(d.confirmedThrough),
      'invalid_contract_edition',
    );
    const id = contractEditionId(d);
    assert(!editions.has(id), 'duplicate_contract_edition');
    editions.set(id, d);
  }
  const researchIds = new Set<string>();
  const researchDigests = new Set(documents.map((d) => d.sha256));
  const evidenceSources = researchSources.map((s) => {
    assert(
      labelled(s.id) &&
        !researchIds.has(s.id) &&
        https(s.url) &&
        labelled(s.origin) &&
        labelled(s.observed) &&
        qualificationDigest(s.text) === s.sha256 &&
        Array.isArray(s.quotes) &&
        s.quotes.every((q) => exactQuote(q, s.text)),
      'invalid_research_source',
    );
    researchIds.add(s.id);
    researchDigests.add(s.sha256);
    return {
      id: s.id,
      url: s.url,
      sha256: s.sha256,
      origin: s.origin,
      observed: s.observed,
      quotes: s.quotes,
      verification: s.quotes.length ? 'verified_text_hash_and_quotations' : 'verified_text_hash',
    };
  });
  const verdicts = new Map<string, Confirmation>();
  for (const v of decisions) {
    assert(
      sha(v.hash) &&
        !verdicts.has(v.hash) &&
        labelled(v.reviewer) &&
        labelled(v.reason) &&
        v.checks &&
        [
          v.checks.historicalValidity,
          v.checks.contractualLink,
          v.checks.entireRecord,
          v.checks.outputAllocation,
        ].every((k) => typeof k === 'boolean') &&
        (v.decision !== 'supported' || Object.values(v.checks).every((k) => k === true)) &&
        ['supported', 'uncertain', 'unsupported'].includes(v.decision),
      'invalid_contract_confirmation',
    );
    verdicts.set(v.hash, v);
  }
  assert(
    Array.isArray(reviews) &&
      reviews.length === records.length &&
      new Set(reviews.map((c) => c.changeId)).size === records.length,
    'incomplete_ownership_review',
  );
  const seen = new Set<string>();
  const cells = reviews.map((c) => {
    const r = inventory.get(c.changeId);
    assert(
      r &&
        labelled(c.reason) &&
        Array.isArray(c.references) &&
        c.references.every(
          (s) => sha(s) && (researchDigests.has(s) || (s === r.sha256 && (!r.publicEvidence || archives.has(s)))),
        ) &&
        (!c.context || (Array.isArray(c.context) && c.context.every(labelled))),
      'invalid_ownership_review',
    );
    let value: string | null = null;
    let chainHash: string | null = null;
    let outcome = !r.publicEvidence
      ? 'withheld_source'
      : conflicts.some((c) => c.changeId === r.changeId)
        ? 'edition_mismatch'
        : 'open';
    const chain = c.chain;
    if (chain !== null) {
      assert(
        labelled(chain.proposedBy) &&
          KPI_ALLOWED_VALUES[FIELD].includes(chain.value) &&
          Array.isArray(chain.editions) &&
          chain.editions.length >= 1 &&
          chain.editions.length <= 12 &&
          new Set(chain.editions).size === chain.editions.length &&
          Array.isArray(chain.links) &&
          chain.links.length + 1 === chain.editions.length,
        'invalid_contract_chain',
      );
      const path = chain.editions.map((id) => {
        const d = editions.get(id);
        assert(d && c.references.includes(d.sha256), 'unregistered_contract_edition');
        return d;
      });
      assert(
        path[0].sha256 === r.sha256 && path[0].edition === r.edition && path[0].url === r.url,
        'wrong_contract_root',
      );
      assert(
        chain.links.every(
          (link, i) =>
            ['preceding', 'following'].includes(link.citedBy) &&
            Array.isArray(link.quotes) &&
            link.quotes.length > 0 &&
            link.quotes.every((q) => exactQuote(q, path[link.citedBy === 'preceding' ? i : i + 1].text)),
        ) &&
          Array.isArray(chain.allocation) &&
          chain.allocation.length > 0 &&
          chain.allocation.every((q) => exactQuote(q, path[path.length - 1].text)),
        'invalid_contract_quote',
      );
      let territorialMismatch = false;
      const temporalSources = [...path];
      const cited = (quotes: Quote[], d: ContractEdition) =>
        Array.isArray(quotes) && quotes.length > 0 && quotes.every((q) => exactQuote(q, d.text));
      for (const o of chain.territorialOverrides ?? []) {
        const d = editions.get(o.edition);
        assert(
          d &&
            r.edition === 'Global' &&
            d.edition !== 'Global' &&
            c.references.includes(d.sha256) &&
            chain.editions.includes(o.incorporates) &&
            cited(o.applicability, d) &&
            cited(o.reference, d) &&
            cited(o.allocation, d),
          'invalid_territorial_override',
        );
        territorialMismatch ||= Boolean(archivedEditionConflict(d.edition, d.text));
        temporalSources.push(d);
      }
      for (const item of chain.scopeEvidence ?? []) {
        const d = editions.get(item.edition);
        assert(d && temporalSources.includes(d) && cited(item.quotes, d), 'invalid_applicability_quote');
      }
      chainHash = ownershipChainId(r, chain);
      const confirmation = verdicts.get(chainHash);
      if (confirmation) {
        assert(
          confirmation.reviewer.trim().toLowerCase() !== chain.proposedBy.trim().toLowerCase(),
          'independent_reviewer_required',
        );
        seen.add(chainHash);
      }
      if (!r.publicEvidence) outcome = 'withheld_source';
      else if (
        territorialMismatch ||
        conflicts.some((c) => c.changeId === r.changeId) ||
        path.some(
          (d) => archivedEditionConflict(d.edition, d.text) || (d.edition !== r.edition && d.edition !== 'Global'),
        )
      )
        outcome = 'edition_mismatch';
      else if (temporalSources.some((d) => d.effectiveFrom > r.asOf || d.confirmedThrough < r.asOf))
        outcome = 'date_mismatch';
      else if (chain.scope !== 'entire_record' || allocationValues[chain.rights] !== chain.value)
        outcome = 'scope_or_rights_unresolved';
      else if (confirmation?.decision === 'supported') {
        value = chain.value;
        outcome = 'supported';
      } else outcome = confirmation?.decision ?? 'awaiting_independent_review';
    }
    return {
      changeId: r.changeId,
      snapshotId: r.snapshotId,
      value,
      outcome,
      record: r,
      reason: c.reason,
      references: c.references,
      context: c.context ?? [],
      chainHash,
      chain,
      confirmation: chainHash ? verdicts.get(chainHash) ?? null : null,
    };
  });
  assert(seen.size === verdicts.size, 'unmatched_contract_confirmation');
  const newlySupported = cells.filter((c) => c.value !== null).length;
  const after = prior.assessedAfterEditionCheck - excluded + newlySupported;
  assert(after <= prior.denominator, 'invalid_coverage');
  const extra = inventoryInput.localRemainder;
  if (extra)
    assert(
      sha(extra.fullPriorSha256) &&
        [extra.denominator, extra.previousAssessed, extra.cases, extra.additionalExcludedForEdition].every(
          (n) => Number.isSafeInteger(n) && n >= 0,
        ) &&
        extra.previousAssessed <= extra.denominator &&
        extra.additionalExcludedForEdition <= extra.previousAssessed &&
        extra.cases <= extra.denominator - extra.previousAssessed,
      'invalid_remainder',
    );
  const campaignDenominator = prior.denominator + (extra?.denominator ?? 0);
  const campaignAssessed = after + (extra ? extra.previousAssessed - extra.additionalExcludedForEdition : 0);
  const campaignCoverage = {
    denominator: campaignDenominator,
    assessed: campaignAssessed,
    ownershipCases: cells.length + (extra?.cases ?? 0),
    minimumAdditionalForOver90: Math.max(0, Math.floor((campaignDenominator * 9) / 10) + 1 - campaignAssessed),
    localRemainder: extra ?? null,
  };
  return {
    schema: 'pw-ownership-review-1',
    campaignCoverage,
    denominator: prior.denominator,
    previousAssessed: prior.assessedAfterEditionCheck,
    additionalExcludedForEdition: excluded,
    editionConflicts: conflicts,
    previousNewlySupported: prior.newlySupported,
    previousExcludedForEdition: prior.baselineAssessedOnConflictingEditions,
    cases: cells.length,
    newlySupported,
    stillOpen: cells.length - newlySupported,
    assessedAfterEditionCheck: after,
    minimumAdditionalForOver90: Math.max(0, Math.floor(prior.denominator * 0.9) + 1 - after),
    contractEditions: documents.map((d) => ({
      id: contractEditionId(d),
      url: d.url,
      edition: d.edition,
      sha256: d.sha256,
      effectiveFrom: d.effectiveFrom,
      confirmedThrough: d.confirmedThrough,
      datingEvidence: d.datingEvidence,
    })),
    evidenceSources,
    cells,
  };
}
