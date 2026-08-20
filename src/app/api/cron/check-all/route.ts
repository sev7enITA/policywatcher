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
import { createHash } from 'node:crypto';
import { db } from '@/lib/db';
import { scrapePolicyText, type ScrapeDiagnostic, type ScrapeResult } from '@/lib/scraper';
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
  archiveFreshnessFloor,
  dataStatusFromScrapeFailure,
  normalizeIngestionMethod,
  shouldRebaselineFromSeededRecord,
} from '@/lib/policyConfidence';
import {
  establishSourceMigrationBaseline,
  establishVerifiedPolicyBaseline,
  replaceSeededPolicyBaseline,
} from '@/lib/policyBaseline';
import { createErrorReference, getErrorMessage } from '@/lib/safeErrors';
import { dualWriteCanonicalPolicyGraph } from '@/lib/documentEvidenceSync';
import { normalizeKpiFields } from '@/lib/kpiDefaults';
import {
  CHANGE_CONFIRMATION_PENDING_REASON,
  isConsecutiveChangeConfirmation,
} from '@/lib/changeConfirmation';
import {
  buildAcquisitionKey,
  emptyRetrievalMetrics,
  recordRetrievalDiagnostics,
  sanitizeAcquisitionUrlForLog,
  suggestedSourceAction,
  terminalRetrievalCause,
  type RetrievalMetrics,
} from '@/lib/sourceReliability';

type RetrievalRuntime = 'app' | 'vps' | 'archive' | 'none';

export interface ScanOptions {
  limit?: number;
  companySlug?: string;
}

const GLOBAL_SCAN_LEASE_KEY = 'policy-scan';
const SCAN_LEASE_DURATION_MS = 15 * 60 * 1000;
const LEGACY_SCAN_STALE_AFTER_MS = 24 * 60 * 60 * 1000;

export class ScanAlreadyRunningError extends Error {
  constructor() {
    super('scan_already_running');
    this.name = 'ScanAlreadyRunningError';
  }
}

function scanLeaseExpiry(now = new Date()): Date {
  return new Date(now.getTime() + SCAN_LEASE_DURATION_MS);
}

async function acquireScanRun(options: ScanOptions) {
  const now = new Date();
  await db.scanRun.updateMany({
    where: {
      status: 'running',
      completedAt: null,
      OR: [
        { leaseExpiresAt: { lt: now } },
        {
          leaseExpiresAt: null,
          startedAt: { lt: new Date(now.getTime() - LEGACY_SCAN_STALE_AFTER_MS) },
        },
      ],
    },
    data: {
      status: 'failed',
      completedAt: now,
      leaseKey: null,
      leaseExpiresAt: null,
      failureReason: 'stale_scan_recovered',
    },
  });

  try {
    return await db.scanRun.create({
      data: {
        status: 'running',
        leaseKey: GLOBAL_SCAN_LEASE_KEY,
        leaseExpiresAt: scanLeaseExpiry(now),
        optionsJson: JSON.stringify(options),
      },
    });
  } catch (error) {
    if ((error as { code?: unknown } | null)?.code === 'P2002') {
      throw new ScanAlreadyRunningError();
    }
    throw error;
  }
}

async function renewScanLease(scanRunId: string): Promise<void> {
  const renewed = await db.scanRun.updateMany({
    where: {
      id: scanRunId,
      status: 'running',
      leaseKey: GLOBAL_SCAN_LEASE_KEY,
    },
    data: { leaseExpiresAt: scanLeaseExpiry() },
  });
  if (renewed.count !== 1) throw new Error('scan_lease_lost');
}

async function failScanRun(scanRunId: string): Promise<void> {
  await db.scanRun.updateMany({
    where: { id: scanRunId, status: 'running' },
    data: {
      status: 'failed',
      completedAt: new Date(),
      leaseKey: null,
      leaseExpiresAt: null,
      failureReason: 'scan_execution_failed',
    },
  });
}

// -- Types --

/** Per-policy result detail included in the response `details` array. */
interface CheckDetail {
  policyId: string;
  company: string;
  policy: string;
  jurisdiction?: string;
  status:
    | 'unchanged'
    | 'changed'
    | 'confirmation_pending'
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
  retrievalKey?: string;
  retrievalKeyId?: string;
  sourceRetrievalId?: string;
  cacheHit?: boolean;
  acquisitionMode?: 'network' | 'deduplicated';
}

/** Result shape returned by runFullScan(). */
export interface ScanResult {
  checked: number;
  selected: number;
  changed: number;
  confirmationPending: number;
  rebaselined: number;
  partial: number;
  errors: number;
  unavailable: number;
  invalid: number;
  scanRunId: string;
  retrievalMetrics: RetrievalMetrics;
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
  jurisdiction?: string;
  status?: string;
  source?: string;
  runtime?: RetrievalRuntime;
  transportLabel?: string;
  diagnostics?: ScrapeDiagnostic[];
  retrievalKeyId?: string;
  acquisitionMode?: 'network' | 'deduplicated';
  message: string;
}

/** Callback for real-time progress tracking. */
export type ProgressCallback = (progress: ScanProgress) => void;

function retrievalKeyFingerprint(retrievalKey: string): string {
  return createHash('sha256').update(retrievalKey).digest('hex').slice(0, 12);
}

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

function formatPolicyProgressLabel(
  policy: { company: { name: string }; name: string; jurisdiction?: string | null },
  retrievalKeyId?: string,
): string {
  const jurisdiction = policy.jurisdiction?.trim() || 'Unspecified';
  const acquisition = retrievalKeyId ? ` [acq:${retrievalKeyId}]` : '';
  return `${policy.company.name} - ${policy.name} (${jurisdiction})${acquisition}`;
}

function isExpectedRebaselineAbort(error: unknown): boolean {
  const message = getErrorMessage(error);
  return message.startsWith('rebaseline_aborted_')
    || message.startsWith('source_migration_rebaseline_aborted_');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

interface PersistedRetrieval {
  result: ScrapeResult;
  sourceRetrievalId: string;
  durationMs: number;
  reasonCode: string;
}

async function persistUniqueRetrieval(params: {
  scanRunId: string;
  retrievalKey: string;
  requestedUrl: string;
  archiveNotBefore?: Date;
  result: ScrapeResult;
  durationMs: number;
  affectedPolicyIds: string[];
}): Promise<PersistedRetrieval> {
  const retrievalStatus = params.result.status === 'ok' && params.result.partial
    ? 'partial'
    : params.result.status;
  const reasonCode = params.result.status === 'ok'
    ? (params.result.partial ? 'partial' : 'verified')
    : params.result.reasonCode || terminalRetrievalCause(params.result.diagnostics || []);
  const sourceRetrieval = await db.sourceRetrieval.create({
    data: {
      scanRunId: params.scanRunId,
      retrievalKey: params.retrievalKey,
      requestedUrl: params.requestedUrl,
      archiveNotBefore: params.archiveNotBefore || null,
      status: retrievalStatus,
      source: params.result.source || 'none',
      httpStatus: params.result.httpStatus || null,
      durationMs: params.durationMs,
      reasonCode,
      reason: params.result.reason || null,
      finalUrl: params.result.finalUrl || params.requestedUrl,
      archiveTimestamp: archiveTimestampFromScrape(params.result.archiveTimestamp),
      attemptsJson: JSON.stringify(params.result.diagnostics || []),
    },
  });

  const existingIssue = await db.sourceRemediationIssue.findUnique({
    where: { retrievalKey: params.retrievalKey },
  });
  const affectedPolicyIds = [...new Set([
    ...params.affectedPolicyIds,
    ...(() => {
      try {
        return JSON.parse(existingIssue?.affectedPolicyIdsJson || '[]') as string[];
      } catch {
        return [];
      }
    })(),
  ])];

  if (params.result.status === 'ok' && !params.result.partial) {
    if (existingIssue && existingIssue.status !== 'Resolved') {
      await db.sourceRemediationIssue.update({
        where: { retrievalKey: params.retrievalKey },
        data: {
          status: existingIssue.consecutiveFailures > 0 ? 'Recovered' : existingIssue.status,
          consecutiveFailures: 0,
          recoveredAt: existingIssue.consecutiveFailures > 0 ? new Date() : existingIssue.recoveredAt,
          affectedPolicyIdsJson: JSON.stringify(affectedPolicyIds),
        },
      });
    }
  } else {
    const consecutiveFailures = (existingIssue?.consecutiveFailures || 0) + 1;
    await db.sourceRemediationIssue.upsert({
      where: { retrievalKey: params.retrievalKey },
      create: {
        retrievalKey: params.retrievalKey,
        sourceUrl: params.requestedUrl,
        status: consecutiveFailures >= 3 ? 'Open' : 'Watching',
        reasonCode,
        affectedPolicyIdsJson: JSON.stringify(affectedPolicyIds),
        totalFailures: 1,
        consecutiveFailures,
        suggestedAction: suggestedSourceAction(reasonCode),
      },
      update: {
        sourceUrl: params.requestedUrl,
        status: consecutiveFailures >= 3 ? 'Open' : 'Watching',
        reasonCode,
        affectedPolicyIdsJson: JSON.stringify(affectedPolicyIds),
        totalFailures: { increment: 1 },
        consecutiveFailures,
        lastDetectedAt: new Date(),
        recoveredAt: null,
        resolvedAt: null,
        suggestedAction: suggestedSourceAction(reasonCode),
      },
    });
  }

  const historicalReference = params.result.historicalReference;
  if (historicalReference) {
    const capturedAt = new Date(historicalReference.capturedAt);
    if (!Number.isNaN(capturedAt.getTime())) {
      await db.$transaction(
        params.affectedPolicyIds.map((policyId) =>
          db.historicalSourceReference.upsert({
            where: {
              policyId_source_capturedAt: {
                policyId,
                source: historicalReference.source,
                capturedAt,
              },
            },
            create: {
              policyId,
              sourceRetrievalId: sourceRetrieval.id,
              source: historicalReference.source,
              referenceUrl: historicalReference.referenceUrl || null,
              capturedAt,
              reasonCode: 'stale_archive',
              eligibleForChangeDetection: false,
            },
            update: {
              sourceRetrievalId: sourceRetrieval.id,
              referenceUrl: historicalReference.referenceUrl || null,
              observedAt: new Date(),
              eligibleForChangeDetection: false,
            },
          })
        )
      );
    }
  }

  return { result: params.result, sourceRetrievalId: sourceRetrieval.id, durationMs: params.durationMs, reasonCode };
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
  let confirmationPending = 0;
  let rebaselined = 0;
  let errors = 0;
  const scanRun = await acquireScanRun(options);

  try {

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
        orderBy: { checkedAt: 'desc' },
        // The latest row is required for consecutive-scan change confirmation.
        // A small history still lets seeded-baseline detection find recent
        // verified evidence when the newest row records a transient failure.
        take: 5,
        select: {
          source: true,
          textHash: true,
          status: true,
          reason: true,
          checkedAt: true,
        },
      },
    },
  });

  const optionLabel = [
    options.companySlug ? `company=${options.companySlug}` : null,
    options.limit ? `limit=${options.limit}` : null,
  ].filter(Boolean).join(', ');

  const acquisitionGroups = new Map<string, {
    policyIds: string[];
    archiveNotBefore?: Date;
    requestedUrl: string;
  }>();
  for (const policy of policies) {
    const requestedUrl = policy.retrievalUrl || policy.url;
    const retrievalKey = buildAcquisitionKey(requestedUrl);
    const archiveFloor = archiveFreshnessFloor(policy);
    const group = acquisitionGroups.get(retrievalKey) || {
      policyIds: [],
      requestedUrl,
    };
    group.policyIds.push(policy.id);
    // Use the strictest freshness floor in a shared acquisition. This can
    // under-recover an archive for an older record, but cannot promote stale
    // evidence into a policy with a newer verified baseline.
    if (archiveFloor && (!group.archiveNotBefore || archiveFloor > group.archiveNotBefore)) {
      group.archiveNotBefore = archiveFloor;
    }
    acquisitionGroups.set(retrievalKey, group);
  }

  await db.scanRun.update({
    where: { id: scanRun.id },
    data: {
      selectedRecords: policies.length,
      uniqueSources: acquisitionGroups.size,
    },
  });
  const retrievalMetrics = emptyRetrievalMetrics(policies.length, acquisitionGroups.size);
  const retrievalCache = new Map<string, Promise<PersistedRetrieval>>();
  const hostLastRequestAt = new Map<string, number>();

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

  // Process each policy
  for (const policy of policies) {
    await renewScanLease(scanRun.id);
    checked++;
    const detail: CheckDetail = {
      policyId: policy.id,
      company: policy.company.name,
      policy: policy.name,
      jurisdiction: policy.jurisdiction,
      status: 'unchanged',
    };

    try {
      onProgress?.({
        phase: 'policy_start',
        total: policies.length,
        current: checked,
        company: policy.company.name,
        policy: policy.name,
        jurisdiction: policy.jurisdiction,
        message: `Preparing ${policy.company.name} - ${policy.name} (${policy.jurisdiction})...`,
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
      const requestedUrl = policy.retrievalUrl || policy.url;
      const retrievalKey = buildAcquisitionKey(requestedUrl);
      const retrievalKeyId = retrievalKeyFingerprint(retrievalKey);
      const policyProgressLabel = formatPolicyProgressLabel(policy, retrievalKeyId);
      const safeSourceLabel = sanitizeAcquisitionUrlForLog(requestedUrl);
      const acquisitionGroup = acquisitionGroups.get(retrievalKey)!;
      let retrievalPromise = retrievalCache.get(retrievalKey);
      const cacheHit = Boolean(retrievalPromise);
      const acquisitionMode = cacheHit ? 'deduplicated' : 'network';
      const acquisitionMarker = `[${cacheHit ? 'cached/deduplicated' : 'network'}] [acq:${retrievalKeyId}]`;

      onProgress?.({
        phase: 'policy_start',
        total: policies.length,
        current: checked,
        company: policy.company.name,
        policy: policy.name,
        jurisdiction: policy.jurisdiction,
        retrievalKeyId,
        acquisitionMode,
        message: cacheHit
          ? `Reusing ${safeSourceLabel} for ${policy.company.name} - ${policy.name} ${acquisitionMarker}`
          : `Fetching ${safeSourceLabel} for ${policy.company.name} - ${policy.name} ${acquisitionMarker}`,
      });

      console.log(
        `[Cron] Acquisition ${retrievalKeyId} ${acquisitionMode}: ` +
        `${policy.company.name} / ${policy.name} / ${policy.jurisdiction} (${safeSourceLabel})`
      );

      if (!retrievalPromise) {
        retrievalPromise = (async () => {
          const currentHost = hostnameOf(requestedUrl);
          const lastRequestAt = currentHost ? hostLastRequestAt.get(currentHost) : undefined;
          if (currentHost && lastRequestAt) {
            const remainingDelay = Math.max(0, 1500 - (Date.now() - lastRequestAt));
            if (remainingDelay > 0) {
              onProgress?.({
                phase: 'policy_start',
                total: policies.length,
                current: checked,
                company: policy.company.name,
                policy: policy.name,
                jurisdiction: policy.jurisdiction,
                retrievalKeyId,
                acquisitionMode,
                message: `Per-host pacing before another ${currentHost} request ${acquisitionMarker}`,
              });
              await sleep(remainingDelay);
            }
          }
          if (currentHost) hostLastRequestAt.set(currentHost, Date.now());
          const startedAt = Date.now();
          const result = await scrapePolicyText(acquisitionGroup.requestedUrl, {
            archiveNotBefore: acquisitionGroup.archiveNotBefore,
          });
          const durationMs = Date.now() - startedAt;
          recordRetrievalDiagnostics(
            retrievalMetrics,
            result.diagnostics || [],
            result.status === 'ok' && result.partial ? 'partial' : result.status,
            result.source,
          );
          return persistUniqueRetrieval({
            scanRunId: scanRun.id,
            retrievalKey,
            requestedUrl: acquisitionGroup.requestedUrl,
            archiveNotBefore: acquisitionGroup.archiveNotBefore,
            result,
            durationMs,
            affectedPolicyIds: acquisitionGroup.policyIds,
          });
        })();
        retrievalCache.set(retrievalKey, retrievalPromise);
      } else {
        retrievalMetrics.deduplicatedRetrievals += 1;
      }
      const persistedRetrieval = await retrievalPromise;
      const scrapeResult = persistedRetrieval.result;
      const source = scrapeResult.source || (scrapeResult.status === 'ok' ? 'direct' : 'none');
      const runtime = getRetrievalRuntime(source);
      const transportLabel = getTransportLabel(source);
      const archiveTimestamp = archiveTimestampFromScrape(scrapeResult.archiveTimestamp);
      const diagnostics = scrapeResult.diagnostics || [];
      detail.diagnostics = diagnostics;
      detail.retrievalKey = retrievalKey;
      detail.retrievalKeyId = retrievalKeyId;
      detail.sourceRetrievalId = persistedRetrieval.sourceRetrievalId;
      detail.cacheHit = cacheHit;
      detail.acquisitionMode = acquisitionMode;

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
              reasonCode: persistedRetrieval.reasonCode,
              finalUrl: scrapeResult.finalUrl || policy.url,
              archiveTimestamp,
              scanRunId: scanRun.id,
              sourceRetrievalId: persistedRetrieval.sourceRetrievalId,
              durationMs: persistedRetrieval.durationMs,
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
          message: `${policyProgressLabel}: ${scrapeResult.status} (${scrapeResult.reason}) [${formatSourceMarker(source)}] [URL: ${policy.url}]`,
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
              reasonCode: 'partial',
              finalUrl: scrapeResult.finalUrl || policy.url,
              textHash: newHash,
              textLength: newText.length,
              archiveTimestamp,
              durationMs: persistedRetrieval.durationMs,
              scanRunId: scanRun.id,
              sourceRetrievalId: persistedRetrieval.sourceRetrievalId,
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
          message: `${policyProgressLabel}: temporarily suspended (${partialReason}) [${formatSourceMarker(source)}]`,
        });
        continue;
      }

      if (policy.sourceMigrationPending) {
        const checkedAt = new Date();
        try {
          const sourceBaseline = await db.$transaction((tx) =>
            establishSourceMigrationBaseline(tx, {
              policyId: policy.id,
              text: newText,
              hash: newHash,
              checkedAt,
              ingestionMethod: normalizeIngestionMethod(scrapeResult.source || 'direct'),
              source: scrapeResult.source || 'direct',
              httpStatus: scrapeResult.httpStatus || null,
              finalUrl: scrapeResult.finalUrl || requestedUrl,
              archiveTimestamp,
              scanRunId: scanRun.id,
              sourceRetrievalId: persistedRetrieval.sourceRetrievalId,
              durationMs: persistedRetrieval.durationMs,
              reasonCode: persistedRetrieval.reasonCode,
            })
          );
          detail.status = 'rebaselined';
          detail.source = source;
          detail.runtime = runtime;
          detail.transportLabel = transportLabel;
          details.push(detail);
          rebaselined++;
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
            message: `${policyProgressLabel}: source migration baseline established${sourceBaseline.createdSnapshot ? '' : ' (content hash unchanged)'} [OK] [${formatSourceMarker(source)}]`,
          });
          continue;
        } catch (sourceBaselineError) {
          if (isExpectedRebaselineAbort(sourceBaselineError)) {
            const refreshedPolicy = await db.policy.findUnique({
              where: { id: policy.id },
              select: { currentHash: true, sourceMigrationPending: true },
            });
            if (!refreshedPolicy?.sourceMigrationPending && refreshedPolicy?.currentHash === newHash) {
              detail.status = 'unchanged';
              detail.source = source;
              detail.runtime = runtime;
              detail.transportLabel = transportLabel;
              details.push(detail);
              continue;
            }
          }
          throw sourceBaselineError;
        }
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
              scanRunId: scanRun.id,
              sourceRetrievalId: persistedRetrieval.sourceRetrievalId,
              durationMs: persistedRetrieval.durationMs,
              reasonCode: persistedRetrieval.reasonCode,
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
                message: `${policyProgressLabel}: baseline already established by another scan [${formatSourceMarker(source)}]`,
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
          message: `${policyProgressLabel}: re-baselined from seeded evidence [OK] [${formatSourceMarker(source)}]`,
        });
        continue;
      }

      // A previous successful scan may already have changed ingestionMethod
      // and written a source check log without establishing public evidence.
      // Do not let such records remain forever in the ordinary "unchanged"
      // path: establish a verified baseline before comparing for changes.
      if (!hasPublicBaseline) {
        const checkedAt = new Date();
        const baseline = await db.$transaction((tx) =>
          establishVerifiedPolicyBaseline(tx, {
            policyId: policy.id,
            text: newText,
            hash: newHash,
            checkedAt,
            ingestionMethod: normalizeIngestionMethod(scrapeResult.source || 'direct'),
            source: scrapeResult.source || 'direct',
            httpStatus: scrapeResult.httpStatus || null,
            finalUrl: scrapeResult.finalUrl || policy.url,
            archiveTimestamp,
            scanRunId: scanRun.id,
            sourceRetrievalId: persistedRetrieval.sourceRetrievalId,
            durationMs: persistedRetrieval.durationMs,
            reasonCode: persistedRetrieval.reasonCode,
          })
        );

        detail.status = baseline.publicEvidence ? 'rebaselined' : 'partial';
        detail.source = source;
        detail.runtime = runtime;
        detail.transportLabel = transportLabel;
        details.push(detail);
        if (baseline.publicEvidence) rebaselined++;

        onProgress?.({
          phase: 'policy_done',
          total: policies.length,
          current: checked,
          company: policy.company.name,
          policy: policy.name,
          status: baseline.publicEvidence ? 'rebaselined' : 'partial',
          source,
          runtime,
          transportLabel,
          diagnostics,
          message: baseline.publicEvidence
            ? `${policyProgressLabel}: first verified public baseline established [OK] [${formatSourceMarker(source)}]`
            : `${policyProgressLabel}: verified private baseline retained pending onboarding QA [${formatSourceMarker(source)}]`,
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
          message: `${policyProgressLabel}: unchanged [OK] [${formatSourceMarker(source)}]`,
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
              reasonCode: 'verified',
              durationMs: persistedRetrieval.durationMs,
              scanRunId: scanRun.id,
              sourceRetrievalId: persistedRetrieval.sourceRetrievalId,
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
              reasonCode: 'content_invalid',
              finalUrl: scrapeResult.finalUrl || policy.url,
              textHash: newHash,
              textLength: newText.length,
              archiveTimestamp,
              durationMs: persistedRetrieval.durationMs,
              scanRunId: scanRun.id,
              sourceRetrievalId: persistedRetrieval.sourceRetrievalId,
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
          message: `${policyProgressLabel}: suspended (non-public baseline) [${formatSourceMarker(source)}]`,
        });
        details.push(detail);
        continue;
      }

      const latestCheckLog = policy.checkLogs[0];
      if (!isConsecutiveChangeConfirmation(latestCheckLog, newHash)) {
        const checkedAt = new Date();
        await db.$transaction([
          db.policy.update({
            where: { id: policy.id },
            data: {
              lastCheckDate: checkedAt,
              // The last verified public baseline remains valid while the
              // candidate waits for the next same-hash observation.
              dataStatus: 'Available',
            },
          }),
          db.policyCheckLog.create({
            data: {
              policyId: policy.id,
              status: 'Needs Review',
              checkedAt,
              source: scrapeResult.source || 'direct',
              httpStatus: scrapeResult.httpStatus || null,
              reason: CHANGE_CONFIRMATION_PENDING_REASON,
              reasonCode: CHANGE_CONFIRMATION_PENDING_REASON,
              finalUrl: scrapeResult.finalUrl || policy.url,
              textHash: newHash,
              textLength: newText.length,
              archiveTimestamp,
              durationMs: persistedRetrieval.durationMs,
              scanRunId: scanRun.id,
              sourceRetrievalId: persistedRetrieval.sourceRetrievalId,
            },
          }),
        ]);

        detail.status = 'confirmation_pending';
        detail.error = CHANGE_CONFIRMATION_PENDING_REASON;
        confirmationPending++;
        details.push(detail);
        onProgress?.({
          phase: 'policy_done',
          total: policies.length,
          current: checked,
          company: policy.company.name,
          policy: policy.name,
          jurisdiction: policy.jurisdiction,
          status: 'confirmation_pending',
          source,
          runtime,
          transportLabel,
          diagnostics,
          retrievalKeyId,
          acquisitionMode,
          message: `${policyProgressLabel}: CHANGED CANDIDATE [ATTENTION] awaiting the same hash in the next scan [${formatSourceMarker(source)}]`,
        });
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
            reasonCode: 'verified',
            durationMs: persistedRetrieval.durationMs,
            scanRunId: scanRun.id,
            sourceRetrievalId: persistedRetrieval.sourceRetrievalId,
          },
        });

        await dualWriteCanonicalPolicyGraph(tx, policy.id);
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
        message: `${policyProgressLabel}: CHANGED CONFIRMED [ATTENTION] (Risk: ${analysis.overallRisk}, Score: ${analysis.overallScore}/10) [${formatSourceMarker(source)}]`,
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
              reasonCode: 'unknown',
              finalUrl: policy.url,
              scanRunId: scanRun.id,
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
        message: `${formatPolicyProgressLabel(policy, detail.retrievalKeyId)}: ERROR (${errorReference})`,
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
  await renewScanLease(scanRun.id);
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

  await db.scanRun.update({
    where: { id: scanRun.id },
    data: {
      status: 'completed',
      completedAt: new Date(),
      leaseKey: null,
      leaseExpiresAt: null,
      failureReason: null,
      networkRetrievals: retrievalMetrics.networkRetrievals,
      deduplicatedRetrievals: retrievalMetrics.deduplicatedRetrievals,
      uniqueAvailableSources: retrievalMetrics.uniqueAvailableSources,
      uniqueUnavailableSources: retrievalMetrics.uniqueUnavailableSources,
      unavailableRecords: unavailableCount,
      invalidRecords: invalidCount,
      partialRecords: partialCount,
      errorRecords: errors,
      metricsJson: JSON.stringify(retrievalMetrics),
    },
  });

  const result: ScanResult = {
    checked,
    selected: policies.length,
    changed,
    confirmationPending,
    rebaselined,
    partial: partialCount,
    errors,
    unavailable: unavailableCount,
    invalid: invalidCount,
    scanRunId: scanRun.id,
    retrievalMetrics,
    details,
    timestamp: new Date().toISOString(),
    options,
  };

  console.log(
    `[Cron] Check complete. Checked: ${checked}, Unique sources: ${retrievalMetrics.uniqueSources}, Network retrievals: ${retrievalMetrics.networkRetrievals}, Deduplicated: ${retrievalMetrics.deduplicatedRetrievals}, Changed: ${changed}, Confirmation pending: ${confirmationPending}, Re-baselined: ${rebaselined}, Partial: ${partialCount}, Unavailable: ${unavailableCount}, Invalid: ${invalidCount}, Errors: ${errors}`
  );

  return result;
  } catch (error) {
    await failScanRun(scanRun.id).catch(() => undefined);
    throw error;
  }
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
    if (error instanceof ScanAlreadyRunningError) {
      return NextResponse.json(
        { error: 'A policy scan is already running.' },
        { status: 409 },
      );
    }
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
