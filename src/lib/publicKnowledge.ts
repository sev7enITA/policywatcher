import { cache } from 'react';
import { db } from './db';
import { publicChangeWhere, publicPolicyWhere, publicSnapshotWhere } from './publicDataGate';

export const POLICYWATCHER_ORIGIN =
  process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://policywatcher.online';

export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type KnowledgeAvailability = 'available' | 'empty';

export interface PublicKnowledgePolicySummary {
  id: string;
  name: string;
  type: string;
  jurisdiction: string;
  officialSourceUrl: string | null;
  dataStatus: string;
  ingestionMethod: string;
  lastCheckedAt: string;
  lastRetrievedAt: string;
  latestBaselineAt: string | null;
  publishedChangeCount: number;
}

export interface PublicKnowledgeCompanySummary {
  id: string;
  name: string;
  slug: string;
  industry: string;
  officialWebsiteUrl: string | null;
  publicPolicyCount: number;
  lastObservedAt: string | null;
}

export interface PublicKnowledgeChangeSummary {
  id: string;
  publishedAt: string;
  observedAt: string;
  overallRisk: string;
  summary: string;
  policy: {
    id: string;
    name: string;
    jurisdiction: string;
    company: { name: string; slug: string };
  };
}

export interface PublicKnowledgeHub {
  availability: KnowledgeAvailability;
  counts: { companies: number; policies: number; baselines: number; changes: number };
  lastObservedAt: string | null;
  lastVerifiedAt: string | null;
  dateModified: string | null;
  companies: PublicKnowledgeCompanySummary[];
  policies: Array<PublicKnowledgePolicySummary & { company: { name: string; slug: string } }>;
  recentChanges: PublicKnowledgeChangeSummary[];
}

export interface PublicKnowledgeCompany extends PublicKnowledgeCompanySummary {
  dateModified: string;
  policies: PublicKnowledgePolicySummary[];
  recentChanges: PublicKnowledgeChangeSummary[];
}

export interface PublicKnowledgePolicy extends PublicKnowledgePolicySummary {
  company: {
    id: string;
    name: string;
    slug: string;
    industry: string;
    officialWebsiteUrl: string | null;
  };
  dateModified: string;
  baselines: Array<{ version: number; hash: string; publishedAt: string }>;
  changes: PublicKnowledgeChangeSummary[];
}

function asIso(value: Date): string {
  return value.toISOString();
}

function latestIso(values: Array<Date | string | null | undefined>): string | null {
  const timestamps = values
    .filter((value): value is Date | string => Boolean(value))
    .map((value) => new Date(value).getTime())
    .filter(Number.isFinite);
  return timestamps.length > 0 ? new Date(Math.max(...timestamps)).toISOString() : null;
}

export function safePublicUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.toString() : null;
  } catch {
    return null;
  }
}

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export const getPublicKnowledgeHub = cache(async (): Promise<PublicKnowledgeHub> => {
  const policyGate = publicPolicyWhere();
  const [companies, policies, recentChanges, baselineCount] = await Promise.all([
    db.company.findMany({
      where: { policies: { some: policyGate as never } },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        industry: true,
        website: true,
        policies: {
          where: policyGate as never,
          select: { lastSuccessfulCheckDate: true },
        },
      },
    }),
    db.policy.findMany({
      where: publicPolicyWhere() as never,
      orderBy: [{ company: { name: 'asc' } }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        type: true,
        jurisdiction: true,
        url: true,
        dataStatus: true,
        ingestionMethod: true,
        lastCheckDate: true,
        lastSuccessfulCheckDate: true,
        updatedAt: true,
        company: { select: { name: true, slug: true } },
        snapshots: {
          where: publicSnapshotWhere() as never,
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true },
        },
        _count: { select: { changes: { where: publicChangeWhere({ publicPublishedAt: { not: null } }) as never } } },
      },
    }),
    db.policyChange.findMany({
      where: publicChangeWhere({ publicPublishedAt: { not: null } }) as never,
      orderBy: { publicPublishedAt: 'desc' },
      take: 12,
      select: {
        id: true,
        createdAt: true,
        publicPublishedAt: true,
        overallRisk: true,
        tldrEn: true,
        aiSummaryEn: true,
        policy: {
          select: {
            id: true,
            name: true,
            jurisdiction: true,
            company: { select: { name: true, slug: true } },
          },
        },
      },
    }),
    db.policySnapshot.count({
      where: publicSnapshotWhere({ policy: publicPolicyWhere() }) as never,
    }),
  ]);

  const companyItems: PublicKnowledgeCompanySummary[] = companies.map((company) => ({
    id: company.id,
    name: company.name,
    slug: company.slug,
    industry: company.industry,
    officialWebsiteUrl: safePublicUrl(company.website),
    publicPolicyCount: company.policies.length,
    lastObservedAt: latestIso(company.policies.map((policy) => policy.lastSuccessfulCheckDate)),
  }));

  const policyItems = policies.map((policy) => ({
    id: policy.id,
    name: policy.name,
    type: policy.type,
    jurisdiction: policy.jurisdiction,
    officialSourceUrl: safePublicUrl(policy.url),
    dataStatus: policy.dataStatus,
    ingestionMethod: policy.ingestionMethod,
    lastCheckedAt: asIso(policy.lastCheckDate),
    lastRetrievedAt: asIso(policy.lastSuccessfulCheckDate),
    latestBaselineAt: policy.snapshots[0] ? asIso(policy.snapshots[0].createdAt) : null,
    publishedChangeCount: policy._count.changes,
    company: policy.company,
  }));

  const changeItems: PublicKnowledgeChangeSummary[] = recentChanges.map((change) => ({
    id: change.id,
    publishedAt: asIso(change.publicPublishedAt!),
    observedAt: asIso(change.createdAt),
    overallRisk: change.overallRisk,
    summary: change.tldrEn || change.aiSummaryEn,
    policy: change.policy,
  }));

  const lastObservedAt = latestIso(policies.map((policy) => policy.lastSuccessfulCheckDate));
  const lastVerifiedAt = latestIso(policies.flatMap((policy) => policy.snapshots.map((snapshot) => snapshot.createdAt)));
  const dateModified = latestIso([
    lastObservedAt,
    lastVerifiedAt,
    ...policies.map((policy) => policy.updatedAt),
    ...recentChanges.map((change) => change.publicPublishedAt),
  ]);

  return {
    availability: policies.length > 0 ? 'available' : 'empty',
    counts: {
      companies: companyItems.length,
      policies: policyItems.length,
      baselines: baselineCount,
      changes: await db.policyChange.count({
        where: publicChangeWhere({ publicPublishedAt: { not: null } }) as never,
      }),
    },
    lastObservedAt,
    lastVerifiedAt,
    dateModified,
    companies: companyItems,
    policies: policyItems,
    recentChanges: changeItems,
  };
});

export const getPublicKnowledgeCompany = cache(async (slug: string): Promise<PublicKnowledgeCompany | null> => {
  const policyGate = publicPolicyWhere();
  const company = await db.company.findFirst({
    where: { slug, policies: { some: policyGate as never } },
    select: {
      id: true,
      name: true,
      slug: true,
      industry: true,
      website: true,
      updatedAt: true,
      policies: {
        where: policyGate as never,
        orderBy: [{ jurisdiction: 'asc' }, { name: 'asc' }],
        select: {
          id: true,
          name: true,
          type: true,
          jurisdiction: true,
          url: true,
          dataStatus: true,
          ingestionMethod: true,
          lastCheckDate: true,
          lastSuccessfulCheckDate: true,
          updatedAt: true,
          snapshots: {
            where: publicSnapshotWhere() as never,
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { createdAt: true },
          },
          changes: {
            where: publicChangeWhere({ publicPublishedAt: { not: null } }) as never,
            orderBy: { publicPublishedAt: 'desc' },
            take: 8,
            select: {
              id: true,
              createdAt: true,
              publicPublishedAt: true,
              overallRisk: true,
              tldrEn: true,
              aiSummaryEn: true,
            },
          },
          _count: { select: { changes: { where: publicChangeWhere({ publicPublishedAt: { not: null } }) as never } } },
        },
      },
    },
  });

  if (!company) return null;

  const policies: PublicKnowledgePolicySummary[] = company.policies.map((policy) => ({
    id: policy.id,
    name: policy.name,
    type: policy.type,
    jurisdiction: policy.jurisdiction,
    officialSourceUrl: safePublicUrl(policy.url),
    dataStatus: policy.dataStatus,
    ingestionMethod: policy.ingestionMethod,
    lastCheckedAt: asIso(policy.lastCheckDate),
    lastRetrievedAt: asIso(policy.lastSuccessfulCheckDate),
    latestBaselineAt: policy.snapshots[0] ? asIso(policy.snapshots[0].createdAt) : null,
    publishedChangeCount: policy._count.changes,
  }));

  const recentChanges = company.policies
    .flatMap((policy) => policy.changes.map((change) => ({
      id: change.id,
      publishedAt: asIso(change.publicPublishedAt!),
      observedAt: asIso(change.createdAt),
      overallRisk: change.overallRisk,
      summary: change.tldrEn || change.aiSummaryEn,
      policy: {
        id: policy.id,
        name: policy.name,
        jurisdiction: policy.jurisdiction,
        company: { name: company.name, slug: company.slug },
      },
    })))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, 8);

  const lastObservedAt = latestIso(company.policies.map((policy) => policy.lastSuccessfulCheckDate));
  return {
    id: company.id,
    name: company.name,
    slug: company.slug,
    industry: company.industry,
    officialWebsiteUrl: safePublicUrl(company.website),
    publicPolicyCount: policies.length,
    lastObservedAt,
    dateModified: latestIso([
      company.updatedAt,
      ...company.policies.map((policy) => policy.updatedAt),
      ...recentChanges.map((change) => change.publishedAt),
    ]) || asIso(company.updatedAt),
    policies,
    recentChanges,
  };
});

export const getPublicKnowledgePolicy = cache(async (
  companySlug: string,
  policyId: string,
): Promise<PublicKnowledgePolicy | null> => {
  if (!isUuid(policyId)) return null;

  const policy = await db.policy.findFirst({
    where: publicPolicyWhere({ id: policyId, company: { slug: companySlug } }) as never,
    select: {
      id: true,
      name: true,
      type: true,
      jurisdiction: true,
      url: true,
      dataStatus: true,
      ingestionMethod: true,
      lastCheckDate: true,
      lastSuccessfulCheckDate: true,
      updatedAt: true,
      company: {
        select: { id: true, name: true, slug: true, industry: true, website: true },
      },
      snapshots: {
        where: publicSnapshotWhere() as never,
        orderBy: { createdAt: 'desc' },
        take: 12,
        select: { version: true, hash: true, createdAt: true },
      },
      changes: {
        where: publicChangeWhere({ publicPublishedAt: { not: null } }) as never,
        orderBy: { publicPublishedAt: 'desc' },
        take: 12,
        select: {
          id: true,
          createdAt: true,
          publicPublishedAt: true,
          overallRisk: true,
          tldrEn: true,
          aiSummaryEn: true,
        },
      },
      _count: { select: { changes: { where: publicChangeWhere({ publicPublishedAt: { not: null } }) as never } } },
    },
  });

  if (!policy) return null;

  const changes: PublicKnowledgeChangeSummary[] = policy.changes.map((change) => ({
    id: change.id,
    publishedAt: asIso(change.publicPublishedAt!),
    observedAt: asIso(change.createdAt),
    overallRisk: change.overallRisk,
    summary: change.tldrEn || change.aiSummaryEn,
    policy: {
      id: policy.id,
      name: policy.name,
      jurisdiction: policy.jurisdiction,
      company: { name: policy.company.name, slug: policy.company.slug },
    },
  }));

  const latestBaselineAt = policy.snapshots[0] ? asIso(policy.snapshots[0].createdAt) : null;
  return {
    id: policy.id,
    name: policy.name,
    type: policy.type,
    jurisdiction: policy.jurisdiction,
    officialSourceUrl: safePublicUrl(policy.url),
    dataStatus: policy.dataStatus,
    ingestionMethod: policy.ingestionMethod,
    lastCheckedAt: asIso(policy.lastCheckDate),
    lastRetrievedAt: asIso(policy.lastSuccessfulCheckDate),
    latestBaselineAt,
    publishedChangeCount: policy._count.changes,
    company: {
      id: policy.company.id,
      name: policy.company.name,
      slug: policy.company.slug,
      industry: policy.company.industry,
      officialWebsiteUrl: safePublicUrl(policy.company.website),
    },
    dateModified: latestIso([policy.updatedAt, latestBaselineAt, ...changes.map((change) => change.publishedAt)]) || asIso(policy.updatedAt),
    baselines: policy.snapshots.map((snapshot) => ({
      version: snapshot.version,
      hash: snapshot.hash,
      publishedAt: asIso(snapshot.createdAt),
    })),
    changes,
  };
});
