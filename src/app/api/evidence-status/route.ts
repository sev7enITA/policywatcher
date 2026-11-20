import { parseDocumentTypes, documentTypeWhere } from '@/lib/documentScope';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rateLimit';
import { summarizeDashboardEvidence } from '@/lib/dashboardEvidence';
import { latestCaptureCheck } from '@/lib/confirmedCapture';
import { suspendedPolicyWhere } from '@/lib/publicDataGate';
import { publishedAssessmentFilter } from '@/lib/publicAssessment';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const limited = rateLimit(request, { intervalMs: 60_000, max: 60, name: 'evidence-status' });
  if (limited) return limited;
  try {
    const documentTypes = parseDocumentTypes(request.nextUrl.searchParams.get('documents'));
    if (!documentTypes) return NextResponse.json({ error: 'Invalid document types.' }, { status: 400 });
    const scope = documentTypeWhere(documentTypes);
    const [policies, suspendedPolicies] = await db.$transaction([db.policy.findMany({
      where: scope,
      select: {
        id: true, dataStatus: true, ingestionMethod: true,
        snapshots: { where: { publicEvidence: true }, take: 1, select: { publicEvidence: true } },
        checkLogs: { ...latestCaptureCheck, select: { ...latestCaptureCheck.select, reason: true } },
        changes: { where: publishedAssessmentFilter(new Date()), orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 1, select: { createdAt: true, kpiDataCollection: true, kpiThirdPartySharing: true, kpiDataRetention: true, kpiRightToDeletion: true, kpiCrossBorderTransfer: true, kpiAiTrainingOptOut: true, kpiAiOutputOwnership: true, kpiAlgoTransparency: true, kpiAutomatedDecision: true, kpiAiBiasFairness: true, kpiConsentMechanism: true, kpiRegulatoryCompliance: true, kpiBreachNotification: true, kpiIndependentAudit: true, kpiContentModeration: true } },
      },
    }), db.policy.count({ where: suspendedPolicyWhere(scope) })]);
    return NextResponse.json({ ...summarizeDashboardEvidence(policies), suspendedPolicies, generatedAt: new Date().toISOString() },
      { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Evidence status is temporarily unavailable.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
