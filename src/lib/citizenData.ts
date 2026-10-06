import { db } from './db';
import { publicPolicyWhere, publicChangeWhere } from './publicDataGate';
import { classificationSnapshotSelect, classifyPolicyChange } from './changeClassification';
import { citizenFreshness, citizenSafeUrl, type CitizenFeed, type CitizenService } from '../../shared/citizen';

export const CITIZEN_FEED_LIMIT = 25;
const CATALOG_LIMIT = 1000;
interface CitizenCursor { at: string; id: string }
export type CitizenFeedQuery = { ok: true; cursor: CitizenCursor | null } | { ok: false; error: string };

export function parseCitizenFeedQuery(params: URLSearchParams): CitizenFeedQuery {
  if ([...params.keys()].some(key => key !== 'cursor') || params.getAll('cursor').length > 1) return { ok: false, error: 'Only one history cursor is accepted.' };
  const raw = params.get('cursor');
  if (raw === null) return { ok: true, cursor: null };
  try {
    if (raw.length > 300 || !/^[A-Za-z0-9_-]+$/.test(raw)) throw new Error();
    const value: unknown = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
    const v = value as Record<string, unknown>;
    if (Object.keys(v).sort().join(',') !== 'at,id' || typeof v.at !== 'string' || !Number.isFinite(Date.parse(v.at))
      || new Date(v.at).toISOString() !== v.at || typeof v.id !== 'string' || !/^[a-zA-Z0-9_-]{1,120}$/.test(v.id)) throw new Error();
    return { ok: true, cursor: { at: v.at, id: v.id } };
  } catch { return { ok: false, error: 'Invalid history cursor.' }; }
}

export async function getCitizenFeed(query: Extract<CitizenFeedQuery, { ok: true }>, now = new Date()): Promise<CitizenFeed> {
  const changeGate = { publicEvidence: true, publicPublishedAt: { not: null, lte: now }, newSnapshot: { publicEvidence: true } } as const;
  const policies = await db.policy.findMany({
    // Explicit gates remain in effect even when a local developer permits seeded data elsewhere.
    where: { AND: [publicPolicyWhere(), { ingestionMethod: { not: 'Seeded' }, dataStatus: { in: ['Available', 'Reviewed'] },
      snapshots: { some: { publicEvidence: true } }, sourceMigrationPending: false }] },
    orderBy: [{ company: { name: 'asc' } }, { id: 'asc' }], take: CATALOG_LIMIT + 1,
    select: {
      id: true, name: true, type: true, jurisdiction: true, url: true,
      company: { select: { id: true, name: true, slug: true, website: true } },
      checkLogs: { orderBy: { checkedAt: 'desc' }, take: 1,
        select: { checkedAt: true, status: true, source: true, textHash: true, textLength: true, archiveTimestamp: true } },
      changes: { where: changeGate, orderBy: [{ publicPublishedAt: 'desc' }, { id: 'desc' }], take: 1,
        select: { id: true, publicPublishedAt: true } },
    },
  });
  const services = new Map<string, CitizenService>();
  const publicPolicyIds: string[] = [];
  for (const policy of policies.slice(0, CATALOG_LIMIT)) {
    const sourceUrl = citizenSafeUrl(policy.url);
    if (!sourceUrl) continue;
    const company = policy.company;
    if (!services.has(company.id) && services.size >= 500) continue;
    const service = services.get(company.id) || { id: company.id, name: company.name.slice(0, 200), slug: company.slug,
      website: citizenSafeUrl(company.website) || sourceUrl, policies: [] };
    const capture = policy.checkLogs[0];
    // An admin status or a database default date alone is not successful acquisition evidence.
    const captured = capture && ['Available', 'Reviewed'].includes(capture.status)
      && capture.source && !['seeded', 'none', 'cache'].includes(capture.source.toLowerCase())
      && (capture.textHash || (capture.textLength || 0) > 0);
    const archiveSource = capture?.source && ['wayback', 'commoncrawl', 'archive'].includes(capture.source.toLowerCase());
    const lastRetrievedAt = captured && (!archiveSource || capture.archiveTimestamp)
      ? (capture.archiveTimestamp || capture.checkedAt).toISOString() : null;
    const latest = policy.changes[0];
    service.policies.push({ id: policy.id, name: policy.name.slice(0, 300), type: policy.type, jurisdiction: policy.jurisdiction,
      sourceUrl, lastRetrievedAt, freshness: citizenFreshness(lastRetrievedAt, now),
      latestChange: latest?.publicPublishedAt ? { id: latest.id, publishedAt: latest.publicPublishedAt.toISOString() } : null });
    services.set(company.id, service);
    publicPolicyIds.push(policy.id);
  }
  const cursorWhere = query.cursor ? { OR: [
    { publicPublishedAt: { lt: new Date(query.cursor.at) } },
    { publicPublishedAt: new Date(query.cursor.at), id: { lt: query.cursor.id } },
  ] } : {};
  const rows = publicPolicyIds.length ? await db.policyChange.findMany({
    where: { AND: [publicChangeWhere(), { ...changeGate, policyId: { in: publicPolicyIds }, ...cursorWhere }] },
    orderBy: [{ publicPublishedAt: 'desc' }, { id: 'desc' }], take: CITIZEN_FEED_LIMIT + 1,
    select: { id: true, policyId: true, publicPublishedAt: true, createdAt: true,
      tldrIt: true, tldrEn: true, aiSummaryIt: true, aiSummaryEn: true, riskReasonsJson: true,
      policy: { select: { companyId: true } }, oldSnapshot: { select: classificationSnapshotSelect }, newSnapshot: { select: classificationSnapshotSelect } },
  }) : [];
  const page = rows.slice(0, CITIZEN_FEED_LIMIT);
  const hasMore = rows.length > CITIZEN_FEED_LIMIT;
  const last = page.at(-1);
  const nextCursor = hasMore && last?.publicPublishedAt
    ? Buffer.from(JSON.stringify({ at: last.publicPublishedAt.toISOString(), id: last.id })).toString('base64url') : null;
  return {
    schemaVersion: '1.0', generatedAt: now.toISOString(), services: [...services.values()],
    changes: page.map(row => {
      const classification = classifyPolicyChange(row);
      return { id: row.id, serviceId: row.policy.companyId, policyId: row.policyId,
        publishedAt: row.publicPublishedAt!.toISOString(), detectedAt: row.createdAt.toISOString(),
        summary: { it: (row.tldrIt?.trim() || row.aiSummaryIt?.trim() || 'Consulta il confronto tra i documenti.').slice(0, 1200),
          en: (row.tldrEn?.trim() || row.aiSummaryEn?.trim() || 'Review the document comparison.').slice(0, 1200) },
        kind: classification.kind, impact: 'not_assessed',
        evidence: classification.evidence.map(e => ({ before: e.before.text, after: e.after.text })),
        detailPath: `/change/${encodeURIComponent(row.id)}`, evidencePath: `/api/evidence-packet/${encodeURIComponent(row.id)}` };
    }),
    history: { limit: CITIZEN_FEED_LIMIT, hasMore, nextCursor },
    catalogTruncated: policies.length > CATALOG_LIMIT || publicPolicyIds.length < policies.slice(0, CATALOG_LIMIT).length,
  };
}
