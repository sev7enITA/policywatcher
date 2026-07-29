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
import { scrapePolicyText, type ScrapeDiagnostic } from '@/lib/scraper';
import { analyzePolicyChange } from '@/lib/gemini';
import {
  sendPolicyChangeAlert,
  sendSourceSuspensionAdminAlert,
  maskEmailForLog,
  ChangedPolicySummary,
  SourceSuspensionAlert,
} from '@/lib/mailer';
import { isAuthorized } from '@/lib/auth';
import { normalizePreferenceKey, splitPreferenceKeys } from '@/lib/subscriberPreferences';
import {
  dataStatusFromScrapeFailure,
  normalizeIngestionMethod,
  shouldRebaselineFromSeededRecord,
} from '@/lib/policyConfidence';
import { replaceSeededPolicyBaseline } from '@/lib/policyBaseline';
import { createErrorReference, getErrorMessage } from '@/lib/safeErrors';
import { normalizeKpiFields } from '@/lib/kpiDefaults';

type RetrievalRuntime = 'app' | 'vps' | 'archive' | 'none';

export interface ScanOptions {
  limit?: number;
  companySlug?: string;
}

// -- Types --

/** Per-policy result detail included in the response `details` array. */
interface CheckDetail {
  policyId: string;
  company: string;
  policy: string;
  status:
    | 'unchanged'
    | 'changed'
    | 'rebaselined'
    | 'partial'
    | 'error'
    | 'unavailable' // page temporarily unreachable (timeout, maintenance, bot block)
    | 'invalid'; // URL permanently gone (404/410/soft-404)
  error?: string;
  httpStatus?: number;
  source?: string;
  runtime?: RetrievalRuntime;
  transportLabel?: string;
  diagnostics?: ScrapeDiagnostic[];
}

/** Result shape returned by runFullScan(). */
export interface ScanResult {
  checked: number;
  selected: number;
  changed: number;
  rebaselined: number;
  partial: number;
  errors: number;
  unavailable: number;
  invalid: number;
  details: CheckDetail[];
  timestamp: string;
  options?: ScanOptions;
}

/** Progress event emitted during a scan. */
export interface ScanProgress {
  phase: 'start' | 'policy_start' | 'policy_done' | 'notify' | 'complete';
  total: number;
  current: number;
  company?: string;
  policy?: string;
  status?: string;
  source?: string;
  runtime?: RetrievalRuntime;
  transportLabel?: string;
  diagnostics?: ScrapeDiagnostic[];
  message: string;
}

/** Callback for real-time progress tracking. */
export type ProgressCallback = (progress: ScanProgress) => void;

function getRetrievalRuntime(source: string | null | undefined): RetrievalRuntime {
  const normalized = (source || '').toLowerCase();
  if (normalized === 'rendered') return 'vps';
  if (normalized === 'wayback' || normalized === 'commoncrawl' || normalized === 'cache') return 'archive';
  if (normalized === 'direct' || normalized === 'http2') return 'app';
  return 'none';
}

function getTransportLabel(source: string | null | undefined): string {
  const normalized = (source || '').toLowerCase();
  const labels: Record<string, string> = {
    direct: 'Hostinger direct fetch',
    http2: 'Hostinger HTTP/2 fetch',
    rendered: 'VPS renderer',
    wayback: 'Hostinger archive fallback: Wayback',
    commoncrawl: 'Hostinger archive fallback: Common Crawl',
    cache: 'Hostinger web cache fallback',
    none: 'No retrieval source',
  };

  return labels[normalized] || `Unknown source: ${source || 'none'}`;
}

function formatSourceMarker(source: string | null | undefined): string {
  const runtime = getRetrievalRuntime(source);
  const label = getTransportLabel(source);
  const suffix = runtime === 'vps' ? 'VPS' : runtime === 'archive' ? 'archive' : runtime === 'app' ? 'app' : 'none';
  return `${label} / ${suffix}`;
}

function isExpectedRebaselineAbort(error: unknown): boolean {
  return getErrorMessage(error).startsWith('rebaseline_aborted_');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sameHostPoliteDelay(): Promise<void> {
  const ms = 1200 + Math.random() * 1800;
  await sleep(ms);
}

function hostnameOf(rawUrl: string): string | null {
  try {
    return new URL(rawUrl).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

function archiveTimestampFromScrape(value: string | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeScanOptions(input: unknown): ScanOptions {
  if (!input || typeof input !== 'object') return {};
  const source = input as Record<string, unknown>;
  const limitValue = Number(source.limit);
  const companySlug =
    typeof source.companySlug === 'string' ? source.companySlug.trim().toLowerCase() : '';

  return {
    ...(Number.isFinite(limitValue) && limitValue > 0
      ? { limit: Math.min(Math.floor(limitValue), 50) }
      : {}),
    ...(companySlug ? { companySlug } : {}),
  };
}

export async function readScanOptions(request: NextRequest): Promise<ScanOptions> {
  const queryOptions = normalizeScanOptions({
    limit: request.nextUrl.searchParams.get('limit'),
    companySlug: request.nextUrl.searchParams.get('companySlug') || request.nextUrl.searchParams.get('company'),
  });

  let bodyOptions: ScanOptions = {};
  try {
    bodyOptions = normalizeScanOptions(await request.json());
  } catch {
    bodyOptions = {};
  }

  return { ...queryOptions, ...bodyOptions };
}

// -- Core scan logic (framework-independent) --

/**
 * Runs a full policy scan: scrape, hash-diff, AI analysis, notify.
 *
 * This is the extracted business logic that can be called directly from
 * the admin dashboard (cron-status POST) or from the HTTP route handler.
 * It does NOT perform auth checks - callers must verify authorization
 * before invoking.
 *
 * @param onProgress - Optional callback for real-time progress reporting.
 * @param options - Optional batch controls for safer shared-hosting scans.
 * @returns Scan result with counts and per-policy details.
 */
export async function runFullScan(
  onProgress?: ProgressCallback,
  options: ScanOptions = {}
): Promise<ScanResult> {
  const details: CheckDetail[] = [];
  let checked = 0;
  let changed = 0;
  let rebaselined = 0;
  let errors = 0;

  // Fetch selected policies with their company info. limit/companySlug let
  // operators run the first real-source rebaseline in safe batches.
  //
  // Ordering by oldest lastCheckDate makes repeated limited batches advance
  // through the inventory: a policy checked in batch 1 moves to the back of
  // the queue, so batch 2 naturally picks the next least-recently checked rows.
  const policies = await db.policy.findMany({
    where: options.companySlug
      ? {
          company: {
            slug: options.companySlug,
          },
        }
      : undefined,
    take: options.limit,
    orderBy: [
      { lastCheckDate: 'asc' },
      { companyId: 'asc' },
      { name: 'asc' },
      { jurisdiction: 'asc' },
    ],
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

  const optionLabel = [
    options.companySlug ? `company=${options.companySlug}` : null,
    options.limit ? `limit=${options.limit}` : null,
  ].filter(Boolean).join(', ');

  console.log(`[Cron] Starting check of ${policies.length} policies${optionLabel ? ` (${optionLabel})` : ''}.`);
  onProgress?.({
    phase: 'start',
    total: policies.length,
    current: 0,
    message: `Starting scan of ${policies.length} policies${optionLabel ? ` (${optionLabel})` : ''}...`,
  });

  // Track which policies changed for subscriber notifications
  const changedPolicySummaries: ChangedPolicySummary[] = [];
  const suspendedSourceAlerts: SourceSuspensionAlert[] = [];
  let previousHost: string | null = null;

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
      const currentHost = hostnameOf(policy.url);
      if (currentHost && previousHost && currentHost === previousHost) {
        onProgress?.({
          phase: 'policy_start',
          total: policies.length,
          current: checked,
          company: policy.company.name,
          policy: policy.name,
          message: `Polite delay before another ${currentHost} request...`,
        });
        await sameHostPoliteDelay();
      }
      previousHost = currentHost;

      onProgress?.({
        phase: 'policy_start',
        total: policies.length,
        current: checked,
        company: policy.company.name,
        policy: policy.name,
        message: `Scraping ${policy.company.name} - ${policy.name}...`,
      });

      // Scrape current policy text (hardened: never fabricates).
      // archiveNotBefore: archive fallbacks (Wayback/Common Crawl) may only
      // return snapshots newer than the last successful check - otherwise a
      // temporarily blocked site would resurface an OLD version as a "change".
      // Exception: the first re-baseline from Seeded inventory has no real
      // successful source check yet, so the inventory timestamp must not be
      // used to reject otherwise usable archive evidence.
      const seededRebaselineCandidate = shouldRebaselineFromSeededRecord(policy);
      const hasPublicBaseline = policy.snapshots.some((snapshot) => snapshot.publicEvidence);
      const scrapeResult = await scrapePolicyText(policy.url, {
        archiveNotBefore:
          seededRebaselineCandidate || !hasPublicBaseline ? undefined : policy.lastSuccessfulCheckDate,
      });
      const source = scrapeResult.source || (scrapeResult.status === 'ok' ? 'direct' : 'none');
      const runtime = getRetrievalRuntime(source);
      const transportLabel = getTransportLabel(source);
      const archiveTimestamp = archiveTimestampFromScrape(scrapeResult.archiveTimestamp);
      const diagnostics = scrapeResult.diagnostics || [];
      detail.diagnostics = diagnostics;

      if (scrapeResult.status !== 'ok') {
        // Page unreachable or unusable. Record it honestly: do NOT
        // create a snapshot or run AI analysis on missing data.
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
        detail.status = scrapeResult.status; // 'unavailable' | 'invalid'
        detail.error = `scrape:${scrapeResult.reason}`;
        detail.httpStatus = scrapeResult.httpStatus;
        detail.source = source;
        detail.runtime = runtime;
        detail.transportLabel = transportLabel;
        suspendedSourceAlerts.push({
          companyName: policy.company.name,
          policyName: policy.name,
          jurisdiction: policy.jurisdiction,
          status: dataStatus,
          reason: scrapeResult.reason || null,
          source,
          httpStatus: scrapeResult.httpStatus || null,
          officialUrl: policy.url,
          checkedAt,
        });
        details.push(detail);
        console.warn(
          `[Cron] ${policy.company.name} - ${policy.name} -> ${scrapeResult.status} (${scrapeResult.reason}). Skipped, no snapshot written.`
        );
        onProgress?.({
          phase: 'policy_done',
          total: policies.length,
          current: checked,
          company: policy.company.name,
          policy: policy.name,
          status: scrapeResult.status,
          source,
          runtime,
          transportLabel,
          diagnostics,
          message: `${policy.company.name} - ${policy.name}: ${scrapeResult.status} (${scrapeResult.reason}) [${formatSourceMarker(source)}] [URL: ${policy.url}]`,
        });
        continue;
      }

      const newText = scrapeResult.text;
      const newHash = scrapeResult.hash; // SHA-256

      if (scrapeResult.partial) {
        const checkedAt = new Date();
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

        detail.status = 'partial';
        detail.error = partialReason;
        detail.httpStatus = scrapeResult.httpStatus;
        detail.source = source;
        detail.runtime = runtime;
        detail.transportLabel = transportLabel;
        suspendedSourceAlerts.push({
          companyName: policy.company.name,
          policyName: policy.name,
          jurisdiction: policy.jurisdiction,
          status: 'Partial',
          reason: partialReason,
          source,
          httpStatus: scrapeResult.httpStatus || null,
          officialUrl: policy.url,
          checkedAt,
        });
        details.push(detail);
        console.warn(
          `[Cron] ${policy.company.name} - ${policy.name} -> partial (${partialReason}). Skipped, no snapshot written.`
        );
        onProgress?.({
          phase: 'policy_done',
          total: policies.length,
          current: checked,
          company: policy.company.name,
          policy: policy.name,
          status: 'partial',
          source,
          runtime,
          transportLabel,
          diagnostics,
          message: `${policy.company.name} - ${policy.name}: temporarily suspended (${partialReason}) [${formatSourceMarker(source)}]`,
        });
        continue;
      }

      if (seededRebaselineCandidate) {
        const checkedAt = new Date();
        const ingestionMethod = normalizeIngestionMethod(scrapeResult.source || 'direct');
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
              detail.status = 'unchanged';
              detail.source = source;
              detail.runtime = runtime;
              detail.transportLabel = transportLabel;
              details.push(detail);
              onProgress?.({
                phase: 'policy_done',
                total: policies.length,
                current: checked,
                company: policy.company.name,
                policy: policy.name,
                status: 'unchanged',
                source,
                runtime,
                transportLabel,
                diagnostics,
                message: `${policy.company.name} - ${policy.name}: baseline already established by another scan [${formatSourceMarker(source)}]`,
              });
              continue;
            }
          }
          throw rebaselineError;
        }

        detail.status = 'rebaselined';
        detail.source = source;
        detail.runtime = runtime;
        detail.transportLabel = transportLabel;
        details.push(detail);
        rebaselined++;

        console.log(
          `[Cron] Re-baselined ${policy.company.name} - ${policy.name} from seeded evidence. Removed ${rebaseline.removedChangeCount} seeded changes and ${rebaseline.removedSnapshotCount} seeded snapshots.`
        );
        onProgress?.({
          phase: 'policy_done',
          total: policies.length,
          current: checked,
          company: policy.company.name,
          policy: policy.name,
          status: 'rebaselined',
          source,
          runtime,
          transportLabel,
          diagnostics,
          message: `${policy.company.name} - ${policy.name}: re-baselined from seeded evidence [OK] [${formatSourceMarker(source)}]`,
        });
        continue;
      }

      // Compare with stored hash
      if (newHash === policy.currentHash) {
        detail.status = 'unchanged';
        detail.source = source;
        detail.runtime = runtime;
        detail.transportLabel = transportLabel;
        details.push(detail);
        onProgress?.({
          phase: 'policy_done',
          total: policies.length,
          current: checked,
          company: policy.company.name,
          policy: policy.name,
          status: 'unchanged',
          source,
          runtime,
          transportLabel,
          diagnostics,
          message: `${policy.company.name} - ${policy.name}: unchanged [OK] [${formatSourceMarker(source)}]`,
        });

        const checkedAt = new Date();
        await db.$transaction([
          db.policy.update({
            where: { id: policy.id },
            data: {
              updatedAt: checkedAt,
              lastCheckDate: checkedAt,
              lastSuccessfulCheckDate: checkedAt,
              dataStatus: 'Available',
              ingestionMethod: normalizeIngestionMethod(scrapeResult.source || 'direct'),
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
        continue;
      }

      // Policy has changed
      detail.status = 'changed';
      detail.source = source;
      detail.runtime = runtime;
      detail.transportLabel = transportLabel;

      // Get the latest snapshot version
      const latestSnapshot = policy.snapshots[0];
      if (latestSnapshot && !latestSnapshot.publicEvidence) {
        const checkedAt = new Date();
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

        detail.status = 'error';
        detail.error = 'change_blocked_non_public_baseline';
        detail.httpStatus = scrapeResult.httpStatus;
        detail.source = source;
        detail.runtime = runtime;
        detail.transportLabel = transportLabel;
        errors++;
        suspendedSourceAlerts.push({
          companyName: policy.company.name,
          policyName: policy.name,
          jurisdiction: policy.jurisdiction,
          status: 'Needs Review',
          reason: 'change_blocked_non_public_baseline',
          source,
          httpStatus: scrapeResult.httpStatus || null,
          officialUrl: policy.url,
          checkedAt,
        });
        onProgress?.({
          phase: 'policy_done',
          total: policies.length,
          current: checked,
          company: policy.company.name,
          policy: policy.name,
          status: 'needs_review',
          source,
          runtime,
          transportLabel,
          diagnostics,
          message: `${policy.company.name} - ${policy.name}: suspended (non-public baseline) [${formatSourceMarker(source)}]`,
        });
        details.push(detail);
        continue;
      }
      changed++;
      const newVersion = latestSnapshot ? latestSnapshot.version + 1 : 1;
      const oldText = latestSnapshot ? latestSnapshot.text : '';

      // Run Gemini analysis
      const analysis = await analyzePolicyChange(
        policy.company.name,
        policy.name,
        oldText,
        newText
      );

      // Compute diff on the FULL texts (a 10k-char truncation here used to
      // hide any change beyond the first pages of long policies), using the
      // same JSON diffLines format as /api/scrape so the viewer has one format.
      const diffLib = await import('diff');
      const diffResult = JSON.stringify(diffLib.diffLines(oldText, newText));

      const checkedAt = new Date();
      await db.$transaction(async (tx) => {
        const newSnapshot = await tx.policySnapshot.create({
          data: {
            policyId: policy.id,
            version: newVersion,
            text: newText,
            hash: newHash,
            publicEvidence: true,
          },
        });

        await tx.policyChange.create({
          data: {
            policyId: policy.id,
            oldSnapshotId: latestSnapshot?.id || null,
            newSnapshotId: newSnapshot.id,
            // Store the full JSON diff: truncating serialized JSON would
            // break parsing and silently hide the tail of the change.
            diff: diffResult,
            aiSummaryEn: analysis.executiveSummaryEn,
            aiSummaryIt: analysis.executiveSummaryIt,
            tldrEn: analysis.tldrEn,
            tldrIt: analysis.tldrIt,
            keyPointsJson: JSON.stringify(analysis.keyPoints),
            riskReasonsJson: JSON.stringify(analysis.riskReasons),
            overallRisk: analysis.overallRisk,
            overallScore: analysis.overallScore,
            remediationsJson: JSON.stringify(analysis.remediations),
            publicEvidence: true,
            publicPublishedAt: checkedAt,
            aiTrainingOptOut: analysis.aiTrainingOptOut,
            aiDataScrapingRestricted: analysis.aiDataScrapingRestricted,
            aiIpLicensing: analysis.aiIpLicensing,
            aiPromptRetention: analysis.aiPromptRetention,
            ...normalizeKpiFields(analysis),
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

        await tx.policy.update({
          where: { id: policy.id },
          data: {
            currentText: newText,
            currentHash: newHash,
            lastCheckDate: checkedAt,
            lastSuccessfulCheckDate: checkedAt,
            dataStatus: 'Available',
            ingestionMethod: normalizeIngestionMethod(scrapeResult.source || 'direct'),
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
        source,
        runtime,
        transportLabel,
        diagnostics,
        message: `${policy.company.name} - ${policy.name}: CHANGED [ATTENTION] (Risk: ${analysis.overallRisk}, Score: ${analysis.overallScore}/10) [${formatSourceMarker(source)}]`,
      });
    } catch (policyError) {
      const errorReference = createErrorReference('scan');
      console.error(
        `[Cron] Error reference ${errorReference}: ${policy.company.name} - ${policy.name}: ${getErrorMessage(policyError)}`
      );
      errors++;
      detail.status = 'error';
      detail.error = errorReference;
      const checkedAt = new Date();

      try {
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
              source: detail.source || 'none',
              reason: `processing_error:${errorReference}`,
              finalUrl: policy.url,
            },
          }),
        ]);
        suspendedSourceAlerts.push({
          companyName: policy.company.name,
          policyName: policy.name,
          jurisdiction: policy.jurisdiction,
          status: 'Needs Review',
          reason: `processing_error:${errorReference}`,
          source: detail.source || 'none',
          httpStatus: detail.httpStatus || null,
          officialUrl: policy.url,
          checkedAt,
        });
      } catch (logError) {
        console.error(
          `[Cron] Failed to mark ${policy.company.name} - ${policy.name} as Needs Review:`,
          logError
        );
      }

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
        message: `${policy.company.name} - ${policy.name}: ERROR (${errorReference})`,
      });
    }

    details.push(detail);
  }

  if (suspendedSourceAlerts.length > 0) {
    try {
      await sendSourceSuspensionAdminAlert(suspendedSourceAlerts, 'cron');
    } catch (mailError) {
      console.error('[Cron] Failed to send source suspension admin alert:', mailError);
    }
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
          console.log(`[Cron] Skipping subscriber ${maskEmailForLog(subscriber.email)}: no matching changes based on configured regions or industries.`);
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
          const errorType = mailError instanceof Error ? mailError.name : 'UnknownError';
          console.error(`[Cron] Failed to notify ${maskEmailForLog(subscriber.email)} (${errorType}).`);
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
  const partialCount = details.filter((d) => d.status === 'partial').length;

  const result: ScanResult = {
    checked,
    selected: policies.length,
    changed,
    rebaselined,
    partial: partialCount,
    errors,
    unavailable: unavailableCount,
    invalid: invalidCount,
    details,
    timestamp: new Date().toISOString(),
    options,
  };

  console.log(
    `[Cron] Check complete. Checked: ${checked}, Changed: ${changed}, Re-baselined: ${rebaselined}, Partial: ${partialCount}, Unavailable: ${unavailableCount}, Invalid: ${invalidCount}, Errors: ${errors}`
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
    const options = await readScanOptions(request);
    const result = await runFullScan(undefined, options);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('[Cron] Fatal error:', error);
    const errorReference = createErrorReference('cron');
    console.error(`[Cron] Fatal error reference ${errorReference}: ${getErrorMessage(error)}`);
    return NextResponse.json(
      {
        error: 'Internal server error during policy check.',
        reference: errorReference,
      },
      { status: 500 }
    );
  }
}
