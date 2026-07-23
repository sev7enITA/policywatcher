/**
 * Admin KPI Audit API
 *
 * GET /api/admin/kpi-audit - Returns full KPI matrix with values and justifications.
 * Accessible by both admin and auditor roles.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/adminAuth';
import { db } from '@/lib/db';
import { buildCompanyKpiAuditRow } from '@/lib/kpiAudit';
import { KPI_FIELD_KEYS } from '@/lib/kpiDefaults';

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const companies = await db.company.findMany({
      include: {
        policies: {
          select: {
            name: true,
            changes: {
              where: { publicEvidence: true },
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: {
                id: true,
                overallScore: true,
                overallRisk: true,
                createdAt: true,
                ...Object.fromEntries(KPI_FIELD_KEYS.map(f => [f, true])),
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const matrix = companies.map((company) => buildCompanyKpiAuditRow({
      companyId: company.id,
      companyName: company.name,
      industry: company.industry,
      changes: company.policies.flatMap((policy) => policy.changes.map((change) => ({
        ...change,
        policyName: policy.name,
      }))),
    }));

    // KPI value distribution across all companies
    const distribution: Record<string, Record<string, number>> = {};
    for (const field of KPI_FIELD_KEYS) {
      distribution[field] = {};
      for (const row of matrix) {
        const val = row.kpiValues[field] || 'Not assessed';
        distribution[field][val] = (distribution[field][val] || 0) + 1;
      }
    }

    return NextResponse.json({
      matrix,
      distribution,
      kpiFields: KPI_FIELD_KEYS,
      role: session.role,
    });
  } catch (error) {
    console.error('[Admin KPI Audit] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
