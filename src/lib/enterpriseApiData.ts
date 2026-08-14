import { db } from './db';
import { parseJsonArray, type EnterprisePagination } from './enterpriseApi';
import { publicChangeWhere, publicPolicyWhere, suspendedPolicyWhere } from './publicDataGate';
import {
  buildSourceContinuityResponse,
  SOURCE_CONTINUITY_MAX_LOGS_PER_POLICY,
} from './sourceContinuity';

export const ENTERPRISE_RISKS = ['Low', 'Medium', 'High'] as const;

export interface EnterpriseCompanyFilters extends EnterprisePagination {
  industry?: string;
  query?: string;
}

export interface EnterpriseChangeFilters extends EnterprisePagination {
  companyId?: string;
  companySlug?: string;
  region?: string;
  risk?: (typeof ENTERPRISE_RISKS)[number];
  since?: Date;
  until?: Date;
}

function pageMeta(total: number, pagination: EnterprisePagination) {
  return {
    page: pagination.page,
    pageSize: pagination.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pagination.pageSize)),
  };
}

export async function listEnterpriseCompanies(filters: EnterpriseCompanyFilters) {
  const where: Record<string, unknown> = {};
  if (filters.industry) where.industry = filters.industry;
  if (filters.query) where.name = { contains: filters.query };
  where.policies = { some: publicPolicyWhere() };

  const [total, companies] = await Promise.all([
    db.company.count({ where: where as never }),
    db.company.findMany({
      where: where as never,
      select: {
        id: true,
        name: true,
        slug: true,
        industry: true,
        website: true,
        policies: {
          where: publicPolicyWhere(),
          select: {
            id: true,
            name: true,
            type: true,
            jurisdiction: true,
            url: true,
            dataStatus: true,
            lastCheckDate: true,
            lastSuccessfulCheckDate: true,
            changes: {
              where: { publicEvidence: true },
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: {
                id: true,
                createdAt: true,
                overallRisk: true,
                overallScore: true,
              },
            },
          },
          orderBy: [{ name: 'asc' }, { jurisdiction: 'asc' }],
        },
      },
      orderBy: { name: 'asc' },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
  ]);

  return { data: companies, meta: pageMeta(total, filters) };
}

export async function listEnterpriseChanges(filters: EnterpriseChangeFilters) {
  const conditions: Record<string, unknown>[] = [];
  if (filters.companyId) conditions.push({ policy: { companyId: filters.companyId } });
  if (filters.companySlug) conditions.push({ policy: { company: { slug: filters.companySlug } } });
  if (filters.region) {
    conditions.push({
      OR: [
        { policy: { jurisdiction: filters.region } },
        { regionImpacts: { some: { region: filters.region } } },
      ],
    });
  }
  if (filters.risk) conditions.push({ overallRisk: filters.risk });
  if (filters.since || filters.until) {
    conditions.push({
      createdAt: {
        ...(filters.since ? { gte: filters.since } : {}),
        ...(filters.until ? { lte: filters.until } : {}),
      },
    });
  }

  conditions.push({ newSnapshot: { publicEvidence: true } });
  const where = publicChangeWhere({ AND: conditions });
  const [total, changes] = await Promise.all([
    db.policyChange.count({ where: where as never }),
    db.policyChange.findMany({
      where: where as never,
      select: {
        id: true,
        createdAt: true,
        overallRisk: true,
        overallScore: true,
        tldrEn: true,
        tldrIt: true,
        aiSummaryEn: true,
        aiSummaryIt: true,
        keyPointsJson: true,
        riskReasonsJson: true,
        policy: {
          select: {
            id: true,
            name: true,
            type: true,
            jurisdiction: true,
            url: true,
            company: {
              select: {
                id: true,
                name: true,
                slug: true,
                industry: true,
              },
            },
          },
        },
        newSnapshot: {
          select: { version: true, createdAt: true, publicEvidence: true },
        },
        regionImpacts: {
          select: { region: true, perspective: true, riskLevel: true },
          orderBy: [{ region: 'asc' }, { perspective: 'asc' }],
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
  ]);

  return {
    data: changes.map(({ keyPointsJson, riskReasonsJson, ...change }) => ({
      ...change,
      keyPoints: parseJsonArray(keyPointsJson),
      riskReasons: parseJsonArray(riskReasonsJson),
      evidence: {
        publicEvidence: true,
        snapshotVersion: change.newSnapshot.version,
        observedAt: change.newSnapshot.createdAt,
        sourceUrl: change.policy.url,
      },
    })),
    meta: pageMeta(total, filters),
  };
}

export async function getEnterpriseChange(changeId: string) {
  const change = await db.policyChange.findFirst({
    where: publicChangeWhere({ id: changeId, newSnapshot: { publicEvidence: true } }),
    select: {
      id: true,
      createdAt: true,
      overallRisk: true,
      overallScore: true,
      tldrEn: true,
      tldrIt: true,
      aiSummaryEn: true,
      aiSummaryIt: true,
      keyPointsJson: true,
      riskReasonsJson: true,
      remediationsJson: true,
      policy: {
        select: {
          id: true,
          name: true,
          type: true,
          jurisdiction: true,
          url: true,
          company: {
            select: { id: true, name: true, slug: true, industry: true, website: true },
          },
        },
      },
      newSnapshot: {
        select: { version: true, createdAt: true, publicEvidence: true },
      },
      regionImpacts: {
        select: {
          region: true,
          perspective: true,
          riskLevel: true,
          impactAnalysisEn: true,
          impactAnalysisIt: true,
          complianceNoteEn: true,
          complianceNoteIt: true,
        },
        orderBy: [{ region: 'asc' }, { perspective: 'asc' }],
      },
    },
  });
  if (!change) return null;

  const { keyPointsJson, riskReasonsJson, remediationsJson, ...safeChange } = change;
  return {
    ...safeChange,
    keyPoints: parseJsonArray(keyPointsJson),
    riskReasons: parseJsonArray(riskReasonsJson),
    remediations: parseJsonArray(remediationsJson),
    evidence: {
      publicEvidence: true,
      snapshotVersion: change.newSnapshot.version,
      observedAt: change.newSnapshot.createdAt,
      sourceUrl: change.policy.url,
    },
    excludedFields: ['policyText', 'snapshotHash', 'rawRetrievalDiagnostics', 'adminReviewLogs'],
  };
}

export async function getEnterpriseSourceContinuity(sourceId: string) {
  const policy = await db.policy.findFirst({
    where: {
      id: sourceId,
      OR: [
        { snapshots: { some: { publicEvidence: true } } },
        suspendedPolicyWhere(),
      ],
    } as never,
    select: {
      id: true,
      name: true,
      type: true,
      jurisdiction: true,
      url: true,
      company: {
        select: { id: true, name: true, slug: true, industry: true },
      },
      snapshots: {
        where: { publicEvidence: true },
        take: 1,
        select: { publicEvidence: true },
      },
      checkLogs: {
        orderBy: { checkedAt: 'desc' },
        take: SOURCE_CONTINUITY_MAX_LOGS_PER_POLICY,
        select: { id: true, status: true, checkedAt: true, source: true },
      },
      _count: { select: { checkLogs: true } },
    },
  });
  return policy ? buildSourceContinuityResponse([policy], 1) : null;
}
