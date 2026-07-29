import { db } from './db';
import { publicChangeWhere } from './publicDataGate';
import {
  buildPublicChangeEventFeed,
  type PublicChangeEventQuery,
  type PublicChangeEventRow,
} from './publicChangeEvents';

const select = {
  id: true,
  publicPublishedAt: true,
  overallRisk: true,
  overallScore: true,
  tldrEn: true,
  tldrIt: true,
  aiSummaryEn: true,
  aiSummaryIt: true,
  policy: {
    select: {
      id: true,
      name: true,
      type: true,
      jurisdiction: true,
      company: { select: { id: true, name: true, slug: true, industry: true } },
    },
  },
} as const;

export async function getPublicChangeEventFeed(query: Extract<PublicChangeEventQuery, { ok: true }>) {
  const cursorFilter = query.cursor ? {
    OR: [
      { publicPublishedAt: { gt: new Date(query.cursor.occurredAt) } },
      { publicPublishedAt: new Date(query.cursor.occurredAt), id: { gt: query.cursor.changeId } },
    ],
  } : {};

  const result = await db.policyChange.findMany({
    where: publicChangeWhere({ publicPublishedAt: { not: null }, ...cursorFilter }) as never,
    select,
    orderBy: query.cursor
      ? [{ publicPublishedAt: 'asc' }, { id: 'asc' }]
      : [{ publicPublishedAt: 'desc' }, { id: 'desc' }],
    take: query.limit + 1,
  });

  const hasMore = result.length > query.limit;
  const window = result.slice(0, query.limit) as PublicChangeEventRow[];
  const chronological = query.cursor ? window : window.reverse();

  return buildPublicChangeEventFeed(chronological, {
    locale: query.locale,
    limit: query.limit,
    inputCursor: query.cursor,
    hasMore: query.cursor ? hasMore : false,
    initialWindowTruncated: query.cursor ? false : hasMore,
  });
}
