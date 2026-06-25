/**
 * PolicyWatcher v2.0 - Scheduled Policy Check Endpoint
 *
 * POST /api/cron/check-all
 *
 * Protected by Bearer token (API_SECRET env var).
 * Fetches all policies, scrapes current text, detects changes via hash diff,
 * runs Gemini analysis on changed policies, stores snapshots, and notifies
 * all active subscribers.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { db } from '@/lib/db';
import { scrapePolicyText } from '@/lib/scraper';
import { analyzePolicyChange } from '@/lib/gemini';
import { sendPolicyChangeAlert, ChangedPolicySummary } from '@/lib/mailer';
import { isAuthorized } from '@/lib/auth';

// -- Hash helper --

// -- Types --

/** Per-policy result detail included in the response `details` array. */
interface CheckDetail {
  policyId: string;
  company: string;
  policy: string;
  status:
    | 'unchanged'
    | 'changed'
    | 'error'
    | 'unavailable' // page temporarily unreachable (timeout, maintenance, bot block)
    | 'invalid'; // URL permanently gone (404/410/soft-404)
  error?: string;
  httpStatus?: number;
}

// -- Main handler --

/**
 * Processes every tracked policy in sequence: scrape → hash-diff → AI analysis → notify.
 *
 * @param request - The incoming request; must carry a valid `Authorization: Bearer <token>` header.
 * @returns JSON summary with `checked`, `changed`, `errors`, `unavailable`, `invalid` counts and full `details`.
 */
export async function POST(request: NextRequest) {
  // Auth check
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: 'Unauthorized. Provide valid Bearer token in Authorization header.' },
      { status: 401 }
    );
  }

  const details: CheckDetail[] = [];
  let checked = 0;
  let changed = 0;
  let errors = 0;

  try {
    // Fetch all policies with their company info
    const policies = await db.policy.findMany({
      include: {
        company: true,
        snapshots: {
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });

    console.log(`[Cron] Starting check of ${policies.length} policies.`);

    // Track which policies changed for subscriber notifications
    const changedPolicySummaries: ChangedPolicySummary[] = [];

    // Process each policy
    for (const policy of policies) {
      checked++;
      const detail: CheckDetail = {
        policyId: policy.id,
        company: policy.company.name,
        policy: policy.name,
        status: 'unchanged',
      };

      try {
        // Scrape current policy text (hardened: never fabricates)
        const scrapeResult = await scrapePolicyText(policy.url);

        if (scrapeResult.status !== 'ok') {
          // Page unreachable or unusable. Record it honestly: do NOT
          // create a snapshot or run AI analysis on missing data.
          detail.status = scrapeResult.status; // 'unavailable' | 'invalid'
          detail.error = `scrape:${scrapeResult.reason}`;
          detail.httpStatus = scrapeResult.httpStatus;
          details.push(detail);
          console.warn(
            `[Cron] ${policy.company.name} - ${policy.name} → ${scrapeResult.status} (${scrapeResult.reason}). Skipped, no snapshot written.`
          );
          continue;
        }

        const newText = scrapeResult.text;
        const newHash = scrapeResult.hash; // SHA-256

        // Compare with stored hash
        if (newHash === policy.currentHash) {
          detail.status = 'unchanged';
          details.push(detail);
          continue;
        }

        // Policy has changed
        detail.status = 'changed';
        changed++;

        // Get the latest snapshot version
        const latestSnapshot = policy.snapshots[0];
        const newVersion = latestSnapshot ? latestSnapshot.version + 1 : 1;
        const oldText = latestSnapshot ? latestSnapshot.text : '';

        // Create new snapshot
        const newSnapshot = await db.policySnapshot.create({
          data: {
            policyId: policy.id,
            version: newVersion,
            text: newText,
            hash: newHash,
          },
        });

        // Run Gemini analysis
        const analysis = await analyzePolicyChange(
          policy.company.name,
          policy.name,
          oldText,
          newText
        );

        // Compute diff (store a summary since full diff can be large)
        const diffLib = await import('diff');
        const diffResult = diffLib.createPatch(
          policy.name,
          oldText.substring(0, 10000),
          newText.substring(0, 10000),
          'Previous Version',
          'Current Version'
        );

        // Store the policy change
        const policyChange = await db.policyChange.create({
          data: {
            policyId: policy.id,
            oldSnapshotId: latestSnapshot?.id || null,
            newSnapshotId: newSnapshot.id,
            diff: diffResult.substring(0, 50000),
            aiSummaryEn: analysis.executiveSummaryEn,
            aiSummaryIt: analysis.executiveSummaryIt,
            tldrEn: analysis.tldrEn,
            tldrIt: analysis.tldrIt,
            keyPointsJson: JSON.stringify(analysis.keyPoints),
            riskReasonsJson: JSON.stringify(analysis.riskReasons),
            overallRisk: analysis.overallRisk,
            overallScore: analysis.overallScore,
            remediationsJson: JSON.stringify(analysis.remediations),
            aiTrainingOptOut: analysis.aiTrainingOptOut,
            aiDataScrapingRestricted: analysis.aiDataScrapingRestricted,
            aiIpLicensing: analysis.aiIpLicensing,
            aiPromptRetention: analysis.aiPromptRetention,
            regionImpacts: {
              create: analysis.regionImpacts.map((ri) => ({
                region: ri.region,
                perspective: ri.perspective,
                impactAnalysisEn: ri.impactAnalysisEn,
                impactAnalysisIt: ri.impactAnalysisIt,
                riskLevel: ri.riskLevel,
                complianceNoteEn: ri.complianceNoteEn || null,
                complianceNoteIt: ri.complianceNoteIt || null,
              })),
            },
          },
        });

        // Update the policy record with new hash and text
        await db.policy.update({
          where: { id: policy.id },
          data: {
            currentText: newText,
            currentHash: newHash,
          },
        });

        // Track for subscriber notifications
        changedPolicySummaries.push({
          companyName: policy.company.name,
          policyName: policy.name,
          overallRisk: analysis.overallRisk,
          overallScore: analysis.overallScore,
          summaryEn: analysis.executiveSummaryEn.substring(0, 300),
          url: policy.url,
          region: policy.jurisdiction,
          industry: policy.company.industry,
        });

        console.log(
          `[Cron] Change detected: ${policy.company.name} - ${policy.name} (Risk: ${analysis.overallRisk}, Score: ${analysis.overallScore})`
        );
      } catch (policyError) {
        errors++;
        detail.status = 'error';
        detail.error = (policyError as Error).message;
        console.error(
          `[Cron] Error processing ${policy.company.name} - ${policy.name}:`,
          policyError
        );
      }

      details.push(detail);
    }

    // Notify subscribers if any policies changed
    if (changedPolicySummaries.length > 0) {
      try {
        const activeSubscribers = await db.subscriber.findMany({
          where: { 
            isActive: true,
            frequency: 'INSTANT'
          },
        });

        console.log(
          `[Cron] Processing notifications for ${activeSubscribers.length} subscribers.`
        );

        for (const subscriber of activeSubscribers) {
          // Filter changes relevant to subscriber's regions/industries
          const subscriberRegions = subscriber.regions.split(',').map((r: string) => r.trim().toLowerCase());
          const subscriberIndustries = subscriber.industries.split(',').map((i: string) => i.trim().toLowerCase());

          const filteredChanges = changedPolicySummaries.filter(p => {
            const hasRegion = subscriberRegions.includes(p.region.toLowerCase());
            const hasIndustry = subscriberIndustries.includes(p.industry.toLowerCase());
            return hasRegion && hasIndustry;
          });

          if (filteredChanges.length === 0) {
            console.log(`[Cron] Skipping subscriber ${subscriber.email}: no matching changes based on regions (${subscriber.regions}) or industries (${subscriber.industries})`);
            continue;
          }

          try {
            await sendPolicyChangeAlert(
              subscriber.email,
              subscriber.name || undefined,
              filteredChanges,
              subscriber.unsubscribeToken
            );
          } catch (mailError) {
            console.error(
              `[Cron] Failed to notify ${subscriber.email}:`,
              mailError
            );
          }
        }
      } catch (subscriberError) {
        console.error('[Cron] Error fetching subscribers:', subscriberError);
      }
    }

    // Derived counts for honest reporting (unavailable/invalid never
    // produced fake snapshots: they are tracked here for transparency).
    const unavailableCount = details.filter((d: any) => d.status === 'unavailable').length;
    const invalidCount = details.filter((d: any) => d.status === 'invalid').length;

    const result = {
      checked,
      changed,
      errors,
      unavailable: unavailableCount,
      invalid: invalidCount,
      details,
      timestamp: new Date().toISOString(),
    };

    console.log(
      `[Cron] Check complete. Checked: ${checked}, Changed: ${changed}, Unavailable: ${unavailableCount}, Invalid: ${invalidCount}, Errors: ${errors}`
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('[Cron] Fatal error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error during policy check.',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
