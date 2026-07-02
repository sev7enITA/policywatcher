/**
 * PolicyWatcher v3.0 - Scheduled Policy Check Endpoint
 *
 * POST /api/cron/check-all
 *
 * Protected by Bearer token (API_SECRET env var).
 * Fetches all policies, scrapes current text, detects changes via hash diff,
 * runs Gemini analysis on changed policies, stores snapshots, and notifies
 * all active subscribers.
 *
 * The core scan logic is exported as `runFullScan()` so that the admin
 * cron-status endpoint can invoke it directly (no self-fetch required).
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { scrapePolicyText } from '@/lib/scraper';
import { analyzePolicyChange } from '@/lib/gemini';
import { sendPolicyChangeAlert, ChangedPolicySummary } from '@/lib/mailer';
import { isAuthorized } from '@/lib/auth';
import { normalizePreferenceKey, splitPreferenceKeys } from '@/lib/subscriberPreferences';

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

/** Result shape returned by runFullScan(). */
export interface ScanResult {
  checked: number;
  changed: number;
  errors: number;
  unavailable: number;
  invalid: number;
  details: CheckDetail[];
  timestamp: string;
}

/** Progress event emitted during a scan. */
export interface ScanProgress {
  phase: 'start' | 'policy_start' | 'policy_done' | 'notify' | 'complete';
  total: number;
  current: number;
  company?: string;
  policy?: string;
  status?: string;
  message: string;
}

/** Callback for real-time progress tracking. */
export type ProgressCallback = (progress: ScanProgress) => void;

// -- Core scan logic (framework-independent) --

/**
 * Runs a full policy scan: scrape → hash-diff → AI analysis → notify.
 *
 * This is the extracted business logic that can be called directly from
 * the admin dashboard (cron-status POST) or from the HTTP route handler.
 * It does NOT perform auth checks — callers must verify authorization
 * before invoking.
 *
 * @param onProgress - Optional callback for real-time progress reporting.
 * @returns Scan result with counts and per-policy details.
 */
export async function runFullScan(onProgress?: ProgressCallback): Promise<ScanResult> {
  const details: CheckDetail[] = [];
  let checked = 0;
  let changed = 0;
  let errors = 0;

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
  onProgress?.({
    phase: 'start',
    total: policies.length,
    current: 0,
    message: `Starting scan of ${policies.length} policies...`,
  });

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
      onProgress?.({
        phase: 'policy_start',
        total: policies.length,
        current: checked,
        company: policy.company.name,
        policy: policy.name,
        message: `Scraping ${policy.company.name} — ${policy.name}...`,
      });

      // Scrape current policy text (hardened: never fabricates)
      const scrapeResult = await scrapePolicyText(policy.url);

      if (scrapeResult.status !== 'ok') {
        // Page unreachable or unusable. Record it honestly: do NOT
        // create a snapshot or run AI analysis on missing data.
        const isInvalid = scrapeResult.status === 'invalid';
        await db.policy.update({
          where: { id: policy.id },
          data: {
            lastCheckDate: new Date(),
            dataStatus: isInvalid ? 'Needs Review' : 'Unavailable',
          },
        });
        detail.status = scrapeResult.status; // 'unavailable' | 'invalid'
        detail.error = `scrape:${scrapeResult.reason}`;
        detail.httpStatus = scrapeResult.httpStatus;
        details.push(detail);
        console.warn(
          `[Cron] ${policy.company.name} - ${policy.name} → ${scrapeResult.status} (${scrapeResult.reason}). Skipped, no snapshot written.`
        );
        onProgress?.({
          phase: 'policy_done',
          total: policies.length,
          current: checked,
          company: policy.company.name,
          policy: policy.name,
          status: scrapeResult.status,
          message: `${policy.company.name} — ${policy.name}: ${scrapeResult.status} (${scrapeResult.reason}) [URL: ${policy.url}]`,
        });
        continue;
      }

      const newText = scrapeResult.text;
      const newHash = scrapeResult.hash; // SHA-256

      // Compare with stored hash
      if (newHash === policy.currentHash) {
        detail.status = 'unchanged';
        details.push(detail);
        onProgress?.({
          phase: 'policy_done',
          total: policies.length,
          current: checked,
          company: policy.company.name,
          policy: policy.name,
          status: 'unchanged',
          message: `${policy.company.name} — ${policy.name}: unchanged ✓ [${scrapeResult.source}]`,
        });

        await db.policy.update({
          where: { id: policy.id },
          data: {
            updatedAt: new Date(),
            lastCheckDate: new Date(),
            lastSuccessfulCheckDate: new Date(),
            dataStatus: 'Available',
            ingestionMethod: scrapeResult.source || 'Direct Scrape',
          },
        });
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

      // Get the latest change for copying KPIs
      const previousChange = await db.policyChange.findFirst({
        where: { policyId: policy.id },
        orderBy: { createdAt: 'desc' },
      });

      // Store the policy change
      await db.policyChange.create({
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
          lastCheckDate: new Date(),
          lastSuccessfulCheckDate: new Date(),
          dataStatus: 'Available',
          ingestionMethod: scrapeResult.source || 'Direct Scrape',
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
      onProgress?.({
        phase: 'policy_done',
        total: policies.length,
        current: checked,
        company: policy.company.name,
        policy: policy.name,
        status: 'changed',
        message: `${policy.company.name} — ${policy.name}: CHANGED ⚠ (Risk: ${analysis.overallRisk}, Score: ${analysis.overallScore}/10) [${scrapeResult.source}]`,
      });
    } catch (policyError) {
      errors++;
      detail.status = 'error';
      detail.error = (policyError as Error).message;
      console.error(
        `[Cron] Error processing ${policy.company.name} - ${policy.name}:`,
        policyError
      );
      onProgress?.({
        phase: 'policy_done',
        total: policies.length,
        current: checked,
        company: policy.company.name,
        policy: policy.name,
        status: 'error',
        message: `${policy.company.name} — ${policy.name}: ERROR ✗ (${(policyError as Error).message})`,
      });
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
        const subscriberRegions = splitPreferenceKeys(subscriber.regions);
        const subscriberIndustries = splitPreferenceKeys(subscriber.industries);

        const filteredChanges = changedPolicySummaries.filter(p => {
          const hasRegion = subscriberRegions.includes(normalizePreferenceKey(p.region));
          const hasIndustry = subscriberIndustries.includes(normalizePreferenceKey(p.industry));
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
  const unavailableCount = details.filter((d) => d.status === 'unavailable').length;
  const invalidCount = details.filter((d) => d.status === 'invalid').length;

  const result: ScanResult = {
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

  return result;
}

// -- HTTP route handler --

/**
 * Thin HTTP wrapper around runFullScan(). Checks authorization, then
 * delegates to the core logic.
 */
export async function POST(request: NextRequest) {
  // Auth check
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: 'Unauthorized. Provide valid Bearer token in Authorization header.' },
      { status: 401 }
    );
  }

  try {
    const result = await runFullScan();
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
