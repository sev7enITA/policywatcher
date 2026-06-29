/**
 * Public Changes API — paginated list of PolicyChange rows.
 *
 * GET /api/changes?industry=&risk=&company=&kpi=&from=&to=&q=&page=&pageSize=
 *
 * This is the backbone of the /timeline page and powers the "git log of
 * tech policy" view. Returns a NARROW payload: company/policy metadata +
 * AI summary fields, but NOT the heavy `diff` or `currentText` (those are
 * fetched on-demand by /change/[id]).
 *
 * Filters (v3.0):
 *  - industry: one of the 6 known industries
 *  - risk: Low | Medium | High
 *  - company: UUID of a specific company
 *  - kpi: one of the 15 KPI field names (filters out "Not assessed")
 *  - from/to: ISO date strings for date-range filtering on createdAt
 *  - q: free-text search (min 3 chars) across summaries, TL;DR, and diff
 *
 * Security:
 *  - Public (no auth) — these are public policy analyses.
 *  - Rate limited (60/min/IP) to prevent dataset scraping.
 *  - Prisma-parameterized queries (no injection).
 *  - All inputs validated + clamped against whitelists.
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rateLimit';

const VALID_RISKS = new Set(['Low', 'Medium', 'High']);
const VALID_INDUSTRIES = new Set([
  'Tech Giant',
  'FinTech',
  'Social Media',
  'E-Commerce',
  'AI Provider',
  'Cloud/SaaS',
]);

/** Whitelisted KPI field names on PolicyChange (prevents arbitrary field access). */
const VALID_KPI_FIELDS = new Set([
  // Privacy & Data Protection
  'kpiDataCollection',
  'kpiThirdPartySharing',
  'kpiDataRetention',
  'kpiRightToDeletion',
  'kpiCrossBorderTransfer',
  // AI Governance
  'kpiAiTrainingOptOut',
  'kpiAiOutputOwnership',
  'kpiAlgoTransparency',
  'kpiAutomatedDecision',
  'kpiAiBiasFairness',
  // Ethics & Corporate Governance
  'kpiConsentMechanism',
  'kpiRegulatoryCompliance',
  'kpiBreachNotification',
  'kpiIndependentAudit',
  'kpiContentModeration',
]);

const MAX_PAGE_SIZE = 50;
const DEFAULT_PAGE_SIZE = 20;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: NextRequest) {
  // Rate limit: public listing, same bucket as other public GETs.
  const limited = rateLimit(request, { intervalMs: 60_000, max: 60, name: 'public-get' });
  if (limited) return limited;

  try {
    const { searchParams } = new URL(request.url);

    // --- Parse + validate filters ---
    const industry = searchParams.get('industry');
    const risk = searchParams.get('risk');
    const companyId = searchParams.get('company');
    const kpi = searchParams.get('kpi');
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');
    const query = searchParams.get('q')?.trim();
    const pageRaw = Number.parseInt(searchParams.get('page') || '1', 10);
    const pageSizeRaw = Number.parseInt(searchParams.get('pageSize') || String(DEFAULT_PAGE_SIZE), 10);

    // Clamp pagination (defense against huge takes)
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
    const pageSize = Number.isFinite(pageSizeRaw)
      ? Math.min(Math.max(pageSizeRaw, 1), MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE;

    // Build the where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {};

    if (industry && VALID_INDUSTRIES.has(industry)) {
      where.policy = { company: { industry } };
    }
    if (risk && VALID_RISKS.has(risk)) {
      where.overallRisk = risk;
    }
    // Validate companyId as UUID to avoid junk queries
    if (companyId && /^[a-f0-9-]{36}$/i.test(companyId)) {
      where.policy = { ...(where.policy as object), companyId };
    }

    // KPI filter: only allow whitelisted field names, exclude "Not assessed"
    if (kpi && VALID_KPI_FIELDS.has(kpi)) {
      where[kpi] = { not: 'Not assessed' };
    }

    // Date range filter (ISO format: YYYY-MM-DD)
    if (fromDate && ISO_DATE_RE.test(fromDate)) {
      const d = new Date(fromDate);
      if (!isNaN(d.getTime())) {
        where.createdAt = { ...(where.createdAt as object), gte: d };
      }
    }
    if (toDate && ISO_DATE_RE.test(toDate)) {
      const d = new Date(toDate + 'T23:59:59.999Z');
      if (!isNaN(d.getTime())) {
        where.createdAt = { ...(where.createdAt as object), lte: d };
      }
    }

    // Free-text search (min 3 chars, across summaries + TL;DR + diff)
    if (query && query.length >= 3 && query.length <= 200) {
      where.OR = [
        { tldrEn: { contains: query } },
        { tldrIt: { contains: query } },
        { aiSummaryEn: { contains: query } },
        { aiSummaryIt: { contains: query } },
        { diff: { contains: query } },
      ];
    }

    // --- Query: count + paginated rows in parallel ---
    const [total, changes] = await Promise.all([
      db.policyChange.count({ where: where as never }),
      db.policyChange.findMany({
        where: where as never,
        // NARROW select: metadata + AI summary, NOT diff/currentText
        select: {
          id: true,
          overallRisk: true,
          overallScore: true,
          tldrEn: true,
          tldrIt: true,
          aiSummaryEn: true,
          aiSummaryIt: true,
          riskReasonsJson: true,
          keyPointsJson: true,
          createdAt: true,
          policy: {
            select: {
              id: true,
              name: true,
              type: true,
              url: true,
              jurisdiction: true,
              company: {
                select: {
                  id: true,
                  name: true,
                  industry: true,
                  logo: true,
                  slug: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return NextResponse.json(
      {
        changes,
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
      {
        status: 200,
        headers: {
          // Public cache: 1 min client, 5 min CDN. Timeline data changes only
          // when the cron runs (every few hours), so this is safe.
          'Cache-Control': 'public, max-age=60, s-maxage=300',
        },
      }
    );
  } catch (error) {
    console.error('[Changes API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
