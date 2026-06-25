/**
 * Admin KPI Audit API
 *
 * GET /api/admin/kpi-audit - Returns full KPI matrix with values and justifications.
 * Accessible by both admin and auditor roles.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/adminAuth';
import { db } from '@/lib/db';

const KPI_FIELDS = [
  'kpiDataCollection', 'kpiThirdPartySharing', 'kpiDataRetention',
  'kpiRightToDeletion', 'kpiCrossBorderTransfer', 'kpiAiTrainingOptOut',
  'kpiAiOutputOwnership', 'kpiAlgoTransparency', 'kpiAutomatedDecision',
  'kpiAiBiasFairness', 'kpiConsentMechanism', 'kpiRegulatoryCompliance',
  'kpiBreachNotification', 'kpiIndependentAudit', 'kpiContentModeration',
] as const;

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const companies = await db.company.findMany({
      include: {
        policies: {
          include: {
            changes: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: {
                id: true,
                overallScore: true,
                overallRisk: true,
                createdAt: true,
                ...Object.fromEntries(KPI_FIELDS.map(f => [f, true])),
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Build the matrix
    const matrix = companies.map(company => {
      // Get the latest change across all policies for this company
      const allChanges = company.policies
        .flatMap(p => p.changes)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const latestChange = allChanges[0] || null;
      const kpiValues: Record<string, string> = {};
      let assessedCount = 0;

      if (latestChange) {
        for (const field of KPI_FIELDS) {
          const val = (latestChange as Record<string, unknown>)[field] as string || 'Not assessed';
          kpiValues[field] = val;
          if (val !== 'Not assessed') assessedCount++;
        }
      }

      return {
        companyId: company.id,
        companyName: company.name,
        industry: company.industry,
        overallScore: latestChange?.overallScore || 0,
        overallRisk: latestChange?.overallRisk || 'N/A',
        lastAnalysis: latestChange?.createdAt || null,
        kpiValues,
        assessedCount,
        totalKpis: KPI_FIELDS.length,
      };
    });

    // KPI value distribution across all companies
    const distribution: Record<string, Record<string, number>> = {};
    for (const field of KPI_FIELDS) {
      distribution[field] = {};
      for (const row of matrix) {
        const val = row.kpiValues[field] || 'Not assessed';
        distribution[field][val] = (distribution[field][val] || 0) + 1;
      }
    }

    return NextResponse.json({
      matrix,
      distribution,
      kpiFields: KPI_FIELDS,
      role: session.role,
    });
  } catch (error) {
    console.error('[Admin KPI Audit] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
