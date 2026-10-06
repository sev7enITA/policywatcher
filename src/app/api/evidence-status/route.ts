import { parseDocumentTypes, documentTypeWhere } from '@/lib/documentScope';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rateLimit';
import { summarizeDashboardEvidence } from '@/lib/dashboardEvidence';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const limited = rateLimit(request, { intervalMs: 60_000, max: 60, name: 'evidence-status' });
  if (limited) return limited;
  try {
    const documentTypes = parseDocumentTypes(request.nextUrl.searchParams.get('documents'));
    if (!documentTypes) return NextResponse.json({ error: 'Invalid document types.' }, { status: 400 });
    const policies = await db.policy.findMany({
      where: documentTypeWhere(documentTypes),
      select: {
        id: true, dataStatus: true, ingestionMethod: true,
        snapshots: { select: { publicEvidence: true } },
        checkLogs: { select: { checkedAt: true, status: true, source: true, reason: true, archiveTimestamp: true } },
        changes: { where: { publicEvidence: true }, select: { createdAt: true, kpiDataCollection: true, kpiThirdPartySharing: true, kpiDataRetention: true, kpiRightToDeletion: true, kpiCrossBorderTransfer: true, kpiAiTrainingOptOut: true, kpiAiOutputOwnership: true, kpiAlgoTransparency: true, kpiAutomatedDecision: true, kpiAiBiasFairness: true, kpiConsentMechanism: true, kpiRegulatoryCompliance: true, kpiBreachNotification: true, kpiIndependentAudit: true, kpiContentModeration: true } },
      },
    });
    return NextResponse.json({ ...summarizeDashboardEvidence(policies), generatedAt: new Date().toISOString() },
      { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Evidence status is temporarily unavailable.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
