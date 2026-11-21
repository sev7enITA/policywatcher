import { describe, expect, it } from 'vitest';
import { KPI_ALLOWED_VALUES, KPI_FIELD_KEYS } from '../metricsCatalog';
import { qualificationDigest as digest } from '../engine/qualification';
import { assessArchivedKpis } from '../engine/archivedKpiReview';
import { archivedEditionConflict } from '../engine/archivedEdition';
import {
  contractEditionId,
  ownershipChainId,
  reviewOwnership,
  type ContractChain,
  type ContractEdition,
  type OwnershipRecord,
} from '../engine/ownershipReview';

const referral = 'The AI service is governed by the Model Terms.';
const rights = 'We assign to the customer our rights in all generated outputs.';
const root = '# Terms\n' + referral;
const second = '# Model Terms\n' + rights;
const source = { edition: 'Global', version: 1, publicEvidence: true };
const record: OwnershipRecord = {
  ...source,
  changeId: 'change',
  snapshotId: 'v1',
  url: 'https://example.com/legal',
  sha256: digest(root),
  asOf: '2026-10-01',
};
function edition(url: string, text: string): ContractEdition {
  return {
    url,
    text,
    sha256: digest(text),
    edition: 'Global',
    effectiveFrom: '2026-01-03',
    confirmedThrough: '2026-11-13',
    datingEvidence: 'dated official archive',
  };
}
function fixture() {
  const cohort = {
    schema: 'pw-retro-kpi-1',
    analyses: [
      {
        changeId: record.changeId,
        snapshotId: record.snapshotId,
        sha256: record.sha256,
        source,
        values: Object.fromEntries(KPI_FIELD_KEYS.map((key) => [key, 'Not assessed'])),
      },
    ],
  };
  const archive = { [record.sha256]: root };
  const cohortRaw = JSON.stringify(cohort),
    archiveRaw = JSON.stringify(archive);
  const prior = {
    ...assessArchivedKpis(cohort, archive, [], []),
    cohortSha256: digest(cohortRaw),
    archiveSha256: digest(archiveRaw),
  };
  const documents = [edition(record.url, root), edition('https://example.com/model', second)];
  const span = (s: string, q: string) => ({ start: s.indexOf(q), end: s.indexOf(q) + q.length, text: q });
  const chain: ContractChain = {
    proposedBy: 'analyst',
    value: 'User Retained',
    scope: 'entire_record',
    rights: 'assigns_to_user',
    editions: documents.map(contractEditionId),
    links: [{ citedBy: 'preceding', quotes: [span(root, referral)] }],
    allocation: [span(second, rights)],
  };
  const cell = {
    changeId: 'change',
    references: documents.map((d) => d.sha256),
    reason: 'Both public editions and their scope verified.',
    chain,
  };
  const inventory = { records: [record], cohortRaw, archiveRaw };
  const confirm = () => ({
    hash: ownershipChainId(record, chain),
    reviewer: 'second reader',
    checks: { historicalValidity: true, contractualLink: true, entireRecord: true, outputAllocation: true },
    decision: 'supported' as const,
    reason: 'Verified applicability, dating, and explicit allocation.',
  });
  const replay = () => reviewOwnership(prior, inventory, documents, [cell], [confirm()]);
  return { chain, cell, prior, documents, inventory, confirm, replay };
}
describe('linked contract ownership review', () => {
  it('adds one rating to the fixed denominator after an independent confirmation', () => {
    expect(fixture().replay()).toMatchObject({ denominator: 15, newlySupported: 1, assessedAfterEditionCheck: 1 });
  });
  it('supports incorporation stated in the contract and binds every territorial clause to the review', () => {
    const { chain, documents } = fixture();
    const text =
      'This contract incorporates the Privacy Policy. The first territory assigns ownership to the user. The other territory assigns it too.';
    documents[1].text = text;
    documents[1].sha256 = digest(text);
    const q = (s: string) => ({ start: text.indexOf(s), end: text.indexOf(s) + s.length, text: s });
    chain.editions = documents.map(contractEditionId);
    const b = fixture();
    b.documents[1] = documents[1];
    b.cell.references = b.documents.map((d) => d.sha256);
    b.chain.editions = b.documents.map(contractEditionId);
    b.chain.links = [{ citedBy: 'following', quotes: [q('This contract incorporates the Privacy Policy.')] }];
    b.chain.allocation = [
      q('The first territory assigns ownership to the user.'),
      q('The other territory assigns it too.'),
    ];
    expect(b.replay().newlySupported).toBe(1);
    b.chain.links[0].citedBy = 'preceding';
    expect(b.replay).toThrow('invalid_contract_quote');
  });
  it('checks dates and citations from a separate territorial contract', () => {
    const f = fixture();
    const text = 'For EU residents. We incorporate the Privacy Policy. ' + rights;
    const other = { ...edition('https://example.com/eu', text), edition: 'EU' };
    const q = (s: string) => ({ start: text.indexOf(s), end: text.indexOf(s) + s.length, text: s });
    f.documents.push(other);
    f.cell.references.push(other.sha256);
    const override = {
      edition: contractEditionId(other),
      incorporates: f.chain.editions[0],
      applicability: [q('For EU residents.')],
      reference: [q('We incorporate the Privacy Policy.')],
      allocation: [q(rights)],
    };
    f.chain.territorialOverrides = [override];
    expect(f.replay().newlySupported).toBe(1);
    other.effectiveFrom = '2026-10-02';
    override.edition = contractEditionId(other);
    expect(f.replay().cells[0].outcome).toBe('date_mismatch');
    override.allocation[0].end--;
    expect(f.replay).toThrow('invalid_territorial_override');
  });
  it('leaves a conditional allocation and a mismatched edition or date open', () => {
    const { chain, documents, replay } = fixture();
    chain.scope = 'conditional';
    expect(replay().newlySupported).toBe(0);
    chain.scope = 'entire_record';
    documents[1].edition = 'US';
    chain.editions = documents.map(contractEditionId);
    expect(replay().cells[0].outcome).toBe('edition_mismatch');
    documents[1].edition = 'Global';
    documents[1].effectiveFrom = '2026-10-02';
    chain.editions = documents.map(contractEditionId);
    expect(replay().cells[0].outcome).toBe('date_mismatch');
  });
  it('rejects altered citations, dates, source tampering, missing records and self-review', () => {
    const a = fixture();
    a.chain.links[0].quotes[0].text += '!';
    expect(a.replay).toThrow('invalid_contract_quote');
    const b = fixture();
    b.inventory.records = [];
    expect(b.replay).toThrow('ownership_inventory_mismatch');
    const c = fixture();
    c.documents[1].text += 'x';
    expect(c.replay).toThrow('invalid_contract_edition');
    const d = fixture();
    d.chain.proposedBy = ' SECOND READER ';
    expect(d.replay).toThrow('independent_reviewer_required');
    const denied = d.confirm();
    denied.checks.entireRecord = false;
    expect(() => reviewOwnership(d.prior, d.inventory, d.documents, [d.cell], [denied])).toThrow(
      'invalid_contract_confirmation',
    );
    const e = fixture();
    const decision = e.confirm();
    e.documents[1].confirmedThrough = '2026-10-03';
    e.chain.editions = e.documents.map(contractEditionId);
    expect(() => reviewOwnership(e.prior, e.inventory, e.documents, [e.cell], [decision])).toThrow(
      'unmatched_contract_confirmation',
    );
  });
  it('preserves the prior count, then excludes newly detected editions throughout the pinned cohort', () => {
    const f = fixture();
    const original = JSON.parse(f.inventory.cohortRaw);
    const body =
      '# Europe privacy policy\nFor individuals outside the EEA, UK, and Switzerland, you can read this version of our Privacy Policy.';
    const extra = {
      ...original.analyses[0],
      changeId: 'second',
      snapshotId: 'extra',
      sha256: digest(body),
      values: Object.fromEntries(KPI_FIELD_KEYS.map((field) => [field, KPI_ALLOWED_VALUES[field][0]])),
    };
    original.analyses.push(extra);
    const texts = { ...JSON.parse(f.inventory.archiveRaw), [extra.sha256]: body };
    const inventory = { ...f.inventory, cohortRaw: JSON.stringify(original), archiveRaw: JSON.stringify(texts) };
    const prior = {
      ...f.prior,
      denominator: 30,
      assessedAfterEditionCheck: 15,
      cohortSha256: digest(inventory.cohortRaw),
      archiveSha256: digest(inventory.archiveRaw),
    };
    const report = reviewOwnership(prior, inventory, f.documents, [f.cell], [f.confirm()]);
    expect(report).toMatchObject({
      previousAssessed: 15,
      additionalExcludedForEdition: 15,
      denominator: 30,
      cases: 1,
      newlySupported: 1,
      assessedAfterEditionCheck: 1,
      minimumAdditionalForOver90: 27,
    });
  });
  it('verifies research-only quotations without turning a source into a grade', () => {
    const f = fixture();
    const research = {
      id: 'study',
      url: record.url,
      sha256: record.sha256,
      text: root,
      origin: 'source archive',
      observed: record.asOf,
      quotes: [f.chain.links[0].quotes[0]],
    };
    const cell = {
      ...f.cell,
      chain: null,
      references: [research.sha256],
      context: ['Only for eligible business customers.'],
    };
    expect(reviewOwnership(f.prior, f.inventory, [], [cell], [], [research])).toMatchObject({
      newlySupported: 0,
      evidenceSources: [{ verification: 'verified_text_hash_and_quotations' }],
    });
    research.quotes[0] = { ...research.quotes[0], text: 'different' };
    expect(() => reviewOwnership(f.prior, f.inventory, [], [cell], [], [research])).toThrow(
      'invalid_research_source',
    );
  });
  it('holds a European privacy notice that directs all outside residents to a separate version', () => {
    const cue =
      'For individuals outside the European Economic Area, United Kingdom, and Switzerland, you can read this version\u2060 of our Privacy Policy.';
    expect(archivedEditionConflict('Global', '# Europe privacy policy\n\n' + cue)?.applicability).toBe(cue);
    expect(archivedEditionConflict('Global', '# Privacy policy\n' + cue)).toBeNull();
    expect(
      archivedEditionConflict('Global', '# Europe privacy policy\n## Separate GDPR terms\n' + cue),
    ).toBeNull();
    expect(
      archivedEditionConflict('Global', '# Europe privacy policy\n' + cue.replace('Switzerland', 'Brazil')),
    ).toBeNull();
  });
});
