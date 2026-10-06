import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../db', () => ({ db: { policy: { findMany: vi.fn() }, policyChange: { findMany: vi.fn() } } }));
import { db } from '../db';
import { getCitizenFeed, parseCitizenFeedQuery } from '../citizenData';
import { parseCitizenFeed } from '../../../shared/citizen';
const now = new Date('2026-10-06T12:00:00Z');
const policy = () => ({ id: 'policy1', name: 'Terms', type: 'terms', jurisdiction: 'Global', url: 'https://example.org/terms',
  company: { id: 'service1', name: 'Example', slug: 'example', website: 'https://example.org' },
  checkLogs: [{ checkedAt: now, status: 'Available', source: 'direct', textHash: 'hash', textLength: 500, archiveTimestamp: null as Date | null }],
  changes: [{ id: 'change1', publicPublishedAt: now }] });
const change = (id: string) => ({ id, policyId: 'policy1', publicPublishedAt: now, createdAt: new Date('2026-10-01'),
  tldrIt: 'Sintesi', tldrEn: 'Summary', aiSummaryIt: '', aiSummaryEn: '', riskReasonsJson: null,
  policy: { companyId: 'service1' }, oldSnapshot: { policyId: 'policy1', text: 'Old terms', publicEvidence: false, version: 1 },
  newSnapshot: { policyId: 'policy1', text: 'New terms', publicEvidence: true, version: 2 } });
describe('citizen public data contract', () => {
  beforeEach(() => { vi.clearAllMocks(); vi.mocked(db.policy.findMany).mockResolvedValue([policy()] as never); vi.mocked(db.policyChange.findMany).mockResolvedValue([change('change1')] as never); });
  it('requires specific public snapshots, published changes and usable policies; emits no raw snapshot text', async () => {
    const result = await getCitizenFeed({ ok: true, cursor: null }, now);
    const query = vi.mocked(db.policyChange.findMany).mock.calls[0][0]!;
    expect(query.where).toMatchObject({ AND: expect.arrayContaining([expect.objectContaining({ publicEvidence: true, newSnapshot: { publicEvidence: true }, policyId: { in: ['policy1'] } })]) });
    expect(vi.mocked(db.policy.findMany).mock.calls[0][0]!.where).toMatchObject({ AND: expect.arrayContaining([expect.objectContaining({ sourceMigrationPending: false, ingestionMethod: { not: 'Seeded' } })]) });
    expect(result.changes[0].kind).toBe('needs_review');
    expect(result.changes[0].evidence).toEqual([]);
    expect(JSON.stringify(result)).not.toContain('Old terms');
    expect(parseCitizenFeed(result)).toEqual(result);
  });
  it('has a descending compound history cursor rather than a forward-only latest window', async () => {
    vi.mocked(db.policyChange.findMany).mockResolvedValue(Array.from({ length: 26 }, (_, i) => change(`change${i}`)) as never);
    const first = await getCitizenFeed({ ok: true, cursor: null }, now);
    expect(first.changes).toHaveLength(25); expect(first.history.hasMore).toBe(true);
    const parsed = parseCitizenFeedQuery(new URLSearchParams({ cursor: first.history.nextCursor! }));
    expect(parsed).toEqual({ ok: true, cursor: { at: now.toISOString(), id: 'change24' } });
    if (!parsed.ok) throw new Error();
    await getCitizenFeed(parsed, now);
    expect(vi.mocked(db.policyChange.findMany).mock.calls[1][0]!.where).toMatchObject({ AND: expect.arrayContaining([expect.objectContaining({ OR: [{ publicPublishedAt: { lt: now } }, { publicPublishedAt: now, id: { lt: 'change24' } }] })]) });
  });
  it('does not promote a status/default date, failed check or cached read into a fresh acquisition', async () => {
    for (const logs of [[], [{ ...policy().checkLogs[0], status: 'Unavailable' }], [{ ...policy().checkLogs[0], source: 'cache' }], [{ ...policy().checkLogs[0], source: 'wayback' }]]) {
      vi.mocked(db.policy.findMany).mockResolvedValue([{ ...policy(), checkLogs: logs }] as never);
      const result = await getCitizenFeed({ ok: true, cursor: null }, now);
      expect(result.services[0].policies[0].lastRetrievedAt).toBeNull();
      expect(result.services[0].policies[0].freshness).toBe('unavailable');
    }
  });
  it('uses the archive capture age, not today’s retrieval from that archive', async () => {
    const row = policy(); row.checkLogs[0].source = 'wayback'; row.checkLogs[0].archiveTimestamp = new Date('2024-01-01');
    vi.mocked(db.policy.findMany).mockResolvedValue([row] as never);
    expect((await getCitizenFeed({ ok: true, cursor: null }, now)).services[0].policies[0].freshness).toBe('dated');
  });
  it('reports omitted unsafe links as incomplete catalog and never exposes nonpublic fallback data', async () => {
    vi.mocked(db.policy.findMany).mockResolvedValue([{ ...policy(), url: 'javascript:alert(1)' }] as never);
    const result = await getCitizenFeed({ ok: true, cursor: null }, now);
    expect(result.catalogTruncated).toBe(true); expect(result.services).toEqual([]); expect(result.changes).toEqual([]);
    expect(db.policyChange.findMany).not.toHaveBeenCalled();
  });
  it('rejects personal filters, raw text, duplicate and malformed cursors', () => {
    for (const input of ['country=it', 'text=private', 'cursor=', 'cursor=bad', 'cursor=a&cursor=b']) expect(parseCitizenFeedQuery(new URLSearchParams(input)).ok).toBe(false);
  });
});
