/**
 * PolicyWatcher - On-Demand Scrape & Analyze API
 *
 * @route POST /api/scrape
 *
 * Scrapes the current policy text for a given policyId, compares it against
 * the stored hash, and if changed creates a new snapshot, generates an
 * AI analysis via Gemini, and records a PolicyChange with region impacts.
 *
 * The scraper is hardened: it never fabricates content. If the page is
 * unreachable, an honest error is returned and the failed check is logged.
 *
 * @auth    Bearer token required via API_SECRET.
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
import {
  dataStatusFromScrapeFailure,
  normalizeIngestionMethod,
  shouldRebaselineFromSeededRecord,
} from '@/lib/policyConfidence';
import { sendSourceSuspensionAdminAlert } from '@/lib/mailer';
import { establishVerifiedPolicyBaseline, replaceSeededPolicyBaseline } from '@/lib/policyBaseline';
import { createErrorReference, getErrorMessage } from '@/lib/safeErrors';
import { normalizeKpiFields } from '@/lib/kpiDefaults';
import * as Diff from 'diff';

function archiveTimestampFromScrape(value: string | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isExpectedRebaselineAbort(error: unknown): boolean {
  return getErrorMessage(error).startsWith('rebaseline_aborted_');
}

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
        checkLogs: {
          where: {
            textHash: { not: null },
            source: { in: ['direct', 'http2', 'rendered', 'wayback', 'commoncrawl'] },
          },
          orderBy: { checkedAt: 'desc' },
          take: 1,
          select: {
            source: true,
            textHash: true,
          },
        },
      },
    });

    if (!policy) {
      return NextResponse.json(
        { error: 'Policy non trovata.' },
        { status: 404 }
      );
    }

    // Scrape latest policy text (hardened: never fabricates content).
    // archiveNotBefore: archive fallbacks may only return snapshots newer
    // than the last successful check (prevents stale-archive regressions).
    // Exception: a Seeded inventory row has no real successful source check
    // yet, so its bootstrap timestamp must not block initial archive baseline.
    const seededRebaselineCandidate = shouldRebaselineFromSeededRecord(policy);
    const hasPublicBaseline = policy.snapshots.some((snapshot) => snapshot.publicEvidence);
    const scrapeResult = await scrapePolicyText(policy.retrievalUrl || policy.url, {
      archiveNotBefore:
        seededRebaselineCandidate || !hasPublicBaseline ? undefined : policy.lastSuccessfulCheckDate,
    });
    const archiveTimestamp = archiveTimestampFromScrape(scrapeResult.archiveTimestamp);

    if (scrapeResult.status !== 'ok') {
      // The page is unreachable or unusable. We MUST NOT invent data:
      // surface a clear, honest status and point to the configured source.
      // However, we record the check status honestly in the DB for trust:
      const isInvalid = scrapeResult.status === 'invalid';
      const checkedAt = new Date();
      const dataStatus = dataStatusFromScrapeFailure(scrapeResult.status);

      await db.$transaction([
        db.policy.update({
          where: { id: policy.id },
          data: {
            lastCheckDate: checkedAt,
            dataStatus,
          },
        }),
        db.policyCheckLog.create({
          data: {
            policyId: policy.id,
            status: dataStatus,
            checkedAt,
            source: scrapeResult.source || 'none',
            httpStatus: scrapeResult.httpStatus || null,
            reason: scrapeResult.reason || null,
            finalUrl: scrapeResult.finalUrl || policy.url,
            archiveTimestamp,
          },
        }),
      ]);

      try {
        await sendSourceSuspensionAdminAlert(
          [
            {
              companyName: policy.company.name,
              policyName: policy.name,
              jurisdiction: policy.jurisdiction,
              status: dataStatus,
              reason: scrapeResult.reason || null,
              source: scrapeResult.source || 'none',
              httpStatus: scrapeResult.httpStatus || null,
              officialUrl: policy.url,
              checkedAt,
            },
          ],
          'manual'
        );
      } catch (mailError) {
        console.error('[Scrape] Failed to send source suspension admin alert:', mailError);
      }

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
    const checkedAt = new Date();
    const ingestionMethod = normalizeIngestionMethod(scrapeResult.source || 'direct');

    if (scrapeResult.partial) {
      const partialReason = scrapeResult.partialReason || 'partial_retrieval';
      await db.$transaction([
        db.policy.update({
          where: { id: policy.id },
          data: {
            lastCheckDate: checkedAt,
            dataStatus: 'Partial',
          },
        }),
        db.policyCheckLog.create({
          data: {
            policyId: policy.id,
            status: 'Partial',
            checkedAt,
            source: scrapeResult.source || 'direct',
            httpStatus: scrapeResult.httpStatus || null,
            reason: partialReason,
            finalUrl: scrapeResult.finalUrl || policy.url,
            textHash: newHash,
            textLength: newText.length,
            archiveTimestamp,
          },
        }),
      ]);

      try {
        await sendSourceSuspensionAdminAlert(
          [
            {
              companyName: policy.company.name,
              policyName: policy.name,
              jurisdiction: policy.jurisdiction,
              status: 'Partial',
              reason: partialReason,
              source: scrapeResult.source || 'direct',
              httpStatus: scrapeResult.httpStatus || null,
              officialUrl: policy.url,
              checkedAt,
            },
          ],
          'manual'
        );
      } catch (mailError) {
        console.error('[Scrape] Failed to send partial-source admin alert:', mailError);
      }

      return NextResponse.json(
        {
          changed: false,
          partial: true,
          reason: partialReason,
          originalTextLength: scrapeResult.originalTextLength || null,
          storedTextLength: newText.length,
          message: {
            en: 'The latest fetch was incomplete, so this source is temporarily suspended from public evidence until reviewed.',
            it: 'L’ultimo aggiornamento è incompleto: la sorgente è temporaneamente sospesa dall’evidenza pubblica fino a revisione.',
          },
          officialUrl: policy.url,
        },
        { status: 202 }
      );
    }

    if (seededRebaselineCandidate) {
      let rebaseline;
      try {
        rebaseline = await db.$transaction((tx) =>
          replaceSeededPolicyBaseline(tx, {
            policyId: policy.id,
            text: newText,
            hash: newHash,
            checkedAt,
            ingestionMethod,
            source: scrapeResult.source || 'direct',
            httpStatus: scrapeResult.httpStatus || null,
            finalUrl: scrapeResult.finalUrl || policy.url,
            archiveTimestamp,
          })
        );
      } catch (rebaselineError) {
        if (isExpectedRebaselineAbort(rebaselineError)) {
          const refreshedPolicy = await db.policy.findUnique({
            where: { id: policy.id },
            select: { currentHash: true },
          });
          if (refreshedPolicy?.currentHash === newHash) {
            return NextResponse.json({
              changed: false,
              rebaselined: false,
              message:
                'Baseline already established by another verified scan. No PolicyChange, AI score, or subscriber alert was generated.',
            });
          }
        }
        throw rebaselineError;
      }

      return NextResponse.json({
        changed: false,
        rebaselined: true,
        message:
          'Baseline reale aggiornata da evidenza seedata. Nessun PolicyChange, scoring AI o alert subscriber è stato generato.',
        removedSeedChanges: rebaseline.removedChangeCount,
        removedSeedSnapshots: rebaseline.removedSnapshotCount,
        policy: rebaseline.policy,
      });
    }

    if (!hasPublicBaseline) {
      const baseline = await db.$transaction((tx) =>
        establishVerifiedPolicyBaseline(tx, {
          policyId: policy.id,
          text: newText,
          hash: newHash,
          checkedAt,
          ingestionMethod,
          source: scrapeResult.source || 'direct',
          httpStatus: scrapeResult.httpStatus || null,
          finalUrl: scrapeResult.finalUrl || policy.url,
          archiveTimestamp,
        })
      );
      return NextResponse.json({
        changed: false,
        rebaselined: baseline.publicEvidence,
        publicationPending: !baseline.publicEvidence,
        message: baseline.publicEvidence
          ? 'First source-verified public baseline established. No PolicyChange, AI score, or subscriber alert was generated.'
          : 'Verified baseline retained privately pending onboarding QA and publication review.',
        policy: baseline.policy,
      });
    }

    // If text hasn't changed, return status
    if (newHash === policy.currentHash) {
      const [updatedPolicy] = await db.$transaction([
        db.policy.update({
          where: { id: policy.id },
          data: {
            updatedAt: checkedAt,
            lastCheckDate: checkedAt,
            lastSuccessfulCheckDate: checkedAt,
            dataStatus: 'Available',
            ingestionMethod,
          },
        }),
        db.policyCheckLog.create({
          data: {
            policyId: policy.id,
            status: 'Available',
            checkedAt,
            source: scrapeResult.source || 'direct',
            httpStatus: scrapeResult.httpStatus || null,
            finalUrl: scrapeResult.finalUrl || policy.url,
            textHash: newHash,
            textLength: newText.length,
            archiveTimestamp,
          },
        }),
      ]);
      return NextResponse.json({
        changed: false,
        message: 'Nessun cambiamento rilevato rispetto alla versione memorizzata.',
        policy: updatedPolicy,
      });
    }

    // It changed! Retrieve old text
    const latestSnapshot = policy.snapshots[0];
    if (latestSnapshot && !latestSnapshot.publicEvidence) {
      await db.$transaction([
        db.policy.update({
          where: { id: policy.id },
          data: {
            lastCheckDate: checkedAt,
            dataStatus: 'Needs Review',
          },
        }),
        db.policyCheckLog.create({
          data: {
            policyId: policy.id,
            status: 'Needs Review',
            checkedAt,
            source: scrapeResult.source || 'direct',
            httpStatus: scrapeResult.httpStatus || null,
            reason: 'change_blocked_non_public_baseline',
            finalUrl: scrapeResult.finalUrl || policy.url,
            textHash: newHash,
            textLength: newText.length,
            archiveTimestamp,
          },
        }),
      ]);

      try {
        await sendSourceSuspensionAdminAlert(
          [
            {
              companyName: policy.company.name,
              policyName: policy.name,
              jurisdiction: policy.jurisdiction,
              status: 'Needs Review',
              reason: 'change_blocked_non_public_baseline',
              source: scrapeResult.source || 'direct',
              httpStatus: scrapeResult.httpStatus || null,
              officialUrl: policy.url,
              checkedAt,
            },
          ],
          'manual'
        );
      } catch (mailError) {
        console.error('[Scrape] Failed to send baseline guard admin alert:', mailError);
      }

      return NextResponse.json(
        {
          changed: false,
          suspended: true,
          reason: 'change_blocked_non_public_baseline',
          message: {
            en: 'A new source text was retrieved, but the previous baseline is not marked as public evidence. The policy is suspended pending review.',
            it: 'Il nuovo testo sorgente è stato recuperato, ma la baseline precedente non è marcata come evidenza pubblicabile. La policy è sospesa in attesa di revisione.',
          },
          officialUrl: policy.url,
        },
        { status: 409 }
      );
    }
    const oldText = latestSnapshot ? latestSnapshot.text : '';
    const newVersion = latestSnapshot ? latestSnapshot.version + 1 : 1;

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

    const { policyChange, updatedPolicy } = await db.$transaction(async (tx) => {
      const newSnapshot = await tx.policySnapshot.create({
        data: {
          policyId: policy.id,
          version: newVersion,
          text: newText,
          hash: newHash,
          publicEvidence: true,
        },
      });

      const createdPolicyChange = await tx.policyChange.create({
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
          publicEvidence: true,
          publicPublishedAt: checkedAt,
          aiTrainingOptOut: aiAnalysis.aiTrainingOptOut,
          aiDataScrapingRestricted: aiAnalysis.aiDataScrapingRestricted,
          aiIpLicensing: aiAnalysis.aiIpLicensing,
          aiPromptRetention: aiAnalysis.aiPromptRetention,
          ...normalizeKpiFields(aiAnalysis),
          regionImpacts: {
            create: aiAnalysis.regionImpacts.map((impact) => ({
              region: impact.region,
              perspective: impact.perspective,
              impactAnalysisEn: impact.impactAnalysisEn,
              impactAnalysisIt: impact.impactAnalysisIt,
              riskLevel: impact.riskLevel,
              complianceNoteEn: impact.complianceNoteEn || null,
              complianceNoteIt: impact.complianceNoteIt || null,
            })),
          },
        },
      });

      const savedPolicy = await tx.policy.update({
        where: { id: policy.id },
        data: {
          currentText: newText,
          currentHash: newHash,
          lastCheckDate: checkedAt,
          lastSuccessfulCheckDate: checkedAt,
          dataStatus: 'Available',
          ingestionMethod,
        },
      });

      await tx.policyCheckLog.create({
        data: {
          policyId: policy.id,
          status: 'Available',
          checkedAt,
          source: scrapeResult.source || 'direct',
          httpStatus: scrapeResult.httpStatus || null,
          finalUrl: scrapeResult.finalUrl || policy.url,
          textHash: newHash,
          textLength: newText.length,
          archiveTimestamp,
        },
      });

      return {
        policyChange: createdPolicyChange,
        updatedPolicy: savedPolicy,
      };
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
    const errorReference = createErrorReference('scrape');
    console.error(`[Scrape] Error reference ${errorReference}: ${getErrorMessage(error)}`);
    return NextResponse.json(
      {
        error: 'Internal error during policy check.',
        reference: errorReference,
      },
      { status: 500 }
    );
  }
}
