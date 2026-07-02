/**
 * PolicyWatcher - On-Demand Scrape & Analyze API
 *
 * @route POST /api/scrape
 *
 * Scrapes the current policy text for a given policyId, compares it against
 * the stored hash, and — if changed — creates a new snapshot, generates an
 * AI analysis via Gemini, and records a PolicyChange with region impacts.
 *
 * The scraper is hardened: it never fabricates content. If the page is
 * unreachable, an honest error is returned and nothing is written to the DB.
 *
 * @auth    None (public endpoint).
 * @rateLimit 3 requests / 10 minutes per IP (scrape + AI is the most expensive op).
 *
 * @body {{ policyId: string }}
 * @returns {{ changed: boolean, message: string, policy?, change? }} or error.
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { scrapePolicyText } from '@/lib/scraper';
import { analyzePolicyChange } from '@/lib/gemini';
import { rateLimit } from '@/lib/rateLimit';
import { isAuthorized } from '@/lib/auth';
import * as Diff from 'diff';

/**
 * Handles a POST request to scrape, diff, and analyze a single policy.
 *
 * @param request - The incoming request containing `{ policyId }` in the body.
 * @returns JSON with `changed` flag, the updated policy, and the AI-generated change analysis.
 */
export async function POST(request: NextRequest) {
  // Auth check
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: 'Unauthorized. Provide valid Bearer token in Authorization header.' },
      { status: 401 }
    );
  }

  // Rate limit: scrape+AI is the most expensive operation.
  // 3/10min per IP (enough for genuine exploration, blocks abuse).
  const limited = rateLimit(request, {
    intervalMs: 10 * 60 * 1000,
    max: 3,
    name: 'scrape',
  });
  if (limited) return limited;

  try {
    const { policyId } = await request.json();

    if (!policyId) {
      return NextResponse.json(
        { error: 'policyId è richiesto.' },
        { status: 400 }
      );
    }

    const policy = await db.policy.findUnique({
      where: { id: policyId },
      include: {
        company: true,
        snapshots: {
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });

    if (!policy) {
      return NextResponse.json(
        { error: 'Policy non trovata.' },
        { status: 404 }
      );
    }

    // Scrape latest policy text (hardened: never fabricates content)
    const scrapeResult = await scrapePolicyText(policy.url);

    if (scrapeResult.status !== 'ok') {
      // The page is unreachable or unusable. We MUST NOT invent data:
      // surface a clear, honest status and point to the official source.
      // However, we record the check status honestly in the DB for trust:
      const isInvalid = scrapeResult.status === 'invalid';
      await db.policy.update({
        where: { id: policy.id },
        data: {
          lastCheckDate: new Date(),
          dataStatus: isInvalid ? 'Needs Review' : 'Unavailable',
        },
      });
      const message = {
        en: isInvalid
          ? 'The policy link appears to be no longer valid or reachable.'
          : 'The page is temporarily UNAVAILABLE (maintenance, bot protection, or timeout). Please check the official website directly.',
        it: isInvalid
          ? 'Il link alla policy non risulta più valido o raggiungibile.'
          : 'La pagina è temporaneamente NON DISPONIBILE (manutenzione, protezione bot, o timeout). Ti invitiamo a consultare direttamente il sito ufficiale.',
      };

      return NextResponse.json(
        {
          changed: false,
          unavailable: true,
          invalid: isInvalid,
          reason: scrapeResult.reason,
          httpStatus: scrapeResult.httpStatus,
          message,
          officialUrl: policy.url,
        },
        { status: isInvalid ? 422 : 503 }
      );
    }

    const newText = scrapeResult.text;
    const newHash = scrapeResult.hash; // SHA-256, computed inside the scraper

    // If text hasn't changed, return status
    if (newHash === policy.currentHash) {
      const updatedPolicy = await db.policy.update({
        where: { id: policy.id },
        data: {
          updatedAt: new Date(),
          lastCheckDate: new Date(),
          lastSuccessfulCheckDate: new Date(),
          dataStatus: 'Available',
          ingestionMethod: scrapeResult.source || 'Direct Scrape',
        },
      });
      return NextResponse.json({
        changed: false,
        message: 'Nessun cambiamento rilevato rispetto alla versione memorizzata.',
        policy: updatedPolicy,
      });
    }

    // It changed! Retrieve old text
    const latestSnapshot = policy.snapshots[0];
    const oldText = latestSnapshot ? latestSnapshot.text : '';
    const newVersion = latestSnapshot ? latestSnapshot.version + 1 : 1;

    // Create the new snapshot
    const newSnapshot = await db.policySnapshot.create({
      data: {
        policyId: policy.id,
        version: newVersion,
        text: newText,
        hash: newHash,
      },
    });

    // Compute diff
    const diffObjects = Diff.diffLines(oldText, newText);
    const serializedDiff = JSON.stringify(diffObjects);

    // Call Gemini AI
    const aiAnalysis = await analyzePolicyChange(
      policy.company.name,
      policy.name,
      oldText,
      newText
    );

    // Get the latest change for copying KPIs
    const previousChange = await db.policyChange.findFirst({
      where: { policyId: policy.id },
      orderBy: { createdAt: 'desc' },
    });

    // Create policy change
    const policyChange = await db.policyChange.create({
      data: {
        policyId: policy.id,
        oldSnapshotId: latestSnapshot ? latestSnapshot.id : null,
        newSnapshotId: newSnapshot.id,
        diff: serializedDiff,
        aiSummaryEn: aiAnalysis.executiveSummaryEn,
        aiSummaryIt: aiAnalysis.executiveSummaryIt,
        tldrEn: aiAnalysis.tldrEn,
        tldrIt: aiAnalysis.tldrIt,
        keyPointsJson: JSON.stringify(aiAnalysis.keyPoints),
        riskReasonsJson: JSON.stringify(aiAnalysis.riskReasons),
        overallRisk: aiAnalysis.overallRisk,
        overallScore: aiAnalysis.overallScore,
        remediationsJson: JSON.stringify(aiAnalysis.remediations),
        aiTrainingOptOut: aiAnalysis.aiTrainingOptOut,
        aiDataScrapingRestricted: aiAnalysis.aiDataScrapingRestricted,
        aiIpLicensing: aiAnalysis.aiIpLicensing,
        aiPromptRetention: aiAnalysis.aiPromptRetention,
        // Inherited KPI fields
        kpiDataCollection: previousChange?.kpiDataCollection || 'Not assessed',
        kpiThirdPartySharing: previousChange?.kpiThirdPartySharing || 'Not assessed',
        kpiDataRetention: previousChange?.kpiDataRetention || 'Not assessed',
        kpiRightToDeletion: previousChange?.kpiRightToDeletion || 'Not assessed',
        kpiCrossBorderTransfer: previousChange?.kpiCrossBorderTransfer || 'Not assessed',
        kpiAiTrainingOptOut: previousChange?.kpiAiTrainingOptOut || 'Not assessed',
        kpiAiOutputOwnership: previousChange?.kpiAiOutputOwnership || 'Not assessed',
        kpiAlgoTransparency: previousChange?.kpiAlgoTransparency || 'Not assessed',
        kpiAutomatedDecision: previousChange?.kpiAutomatedDecision || 'Not assessed',
        kpiAiBiasFairness: previousChange?.kpiAiBiasFairness || 'Not assessed',
        kpiConsentMechanism: previousChange?.kpiConsentMechanism || 'Not assessed',
        kpiRegulatoryCompliance: previousChange?.kpiRegulatoryCompliance || 'Not assessed',
        kpiBreachNotification: previousChange?.kpiBreachNotification || 'Not assessed',
        kpiIndependentAudit: previousChange?.kpiIndependentAudit || 'Not assessed',
        kpiContentModeration: previousChange?.kpiContentModeration || 'Not assessed',
      },
    });

    // Create region impacts
    for (const impact of aiAnalysis.regionImpacts) {
      await db.regionImpact.create({
        data: {
          policyChangeId: policyChange.id,
          region: impact.region,
          perspective: impact.perspective,
          impactAnalysisEn: impact.impactAnalysisEn,
          impactAnalysisIt: impact.impactAnalysisIt,
          riskLevel: impact.riskLevel,
          complianceNoteEn: impact.complianceNoteEn,
          complianceNoteIt: impact.complianceNoteIt,
        },
      });
    }

    // Update the policy itself with new text and hash
    const updatedPolicy = await db.policy.update({
      where: { id: policy.id },
      data: {
        currentText: newText,
        currentHash: newHash,
        lastCheckDate: new Date(),
        lastSuccessfulCheckDate: new Date(),
        dataStatus: 'Available',
        ingestionMethod: scrapeResult.source || 'Direct Scrape',
      },
    });

    return NextResponse.json({
      changed: true,
      message: 'Nuova versione rilevata ed analizzata con successo!',
      policy: updatedPolicy,
      change: {
        ...policyChange,
        regionImpacts: aiAnalysis.regionImpacts,
      },
    });
  } catch (error) {
    console.error('Error in scrape API route:', error);
    return NextResponse.json(
      { error: `Errore interno durante il controllo: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
