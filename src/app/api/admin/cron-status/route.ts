/**
 * Admin Cron Status API
 *
 * GET /api/admin/cron-status - Returns current cron state and live progress log.
 * POST /api/admin/cron-status - Triggers a full scan (admin only).
 *
 * v3.0: Calls `runFullScan()` directly with a progress callback that
 * populates a live log array. The admin UI polls every 2s and renders
 * each entry in real-time.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/adminAuth';
import { runFullScan, type ScanOptions, type ScanProgress } from '@/app/api/cron/check-all/route';
import { engineEnabled, enqueueRun } from '@/lib/engine/store';
import { db } from '@/lib/db';
import { readBoundedJsonObject } from '@/lib/requestBody';
import { channelMetadata, isolatedChannelWorkspace, parseChannelRequest, scanChannelCapabilities } from '@/lib/scanChannels';
import { channelRunReport, recentChannelRuns } from '@/lib/engine/channelReports';
import type { ScrapeDiagnostic } from '@/lib/scraper';
import { formatScanCompletionLog } from '@/lib/adminScanSummary';

// Shared cron state, in-memory per process.
export const cronState = {
  isRunning: false,
  startedAt: null as string | null,
  lastResult: null as Record<string, unknown> | null,
  lastCompletedAt: null as string | null,
  lastError: null as string | null,
  /** Live progress: total policies to scan. */
  progressTotal: 0,
  /** Live progress: policies processed so far. */
  progressCurrent: 0,
  /** Live progress: human-readable log entries (newest last). */
  progressLog: [] as string[],
  /** Live progress: current activity (what's happening right now). */
  progressActivity: '',
  requestKey: null as string | null,
  requestFingerprint: null as string | null,
};

const STRATEGY_ORDER = ['direct', 'http2', 'rendered', 'wayback', 'commoncrawl'];

function sourceLabel(source: string): string {
  const labels: Record<string, string> = {
    direct: 'Hostinger direct fetch',
    http2: 'Hostinger HTTP/2 fetch',
    rendered: 'VPS renderer',
    wayback: 'Wayback archive',
    commoncrawl: 'Common Crawl archive',
  };
  return labels[source] || source || 'unknown';
}

function compactReason(reason: string | undefined, status?: ScrapeDiagnostic['status']): string {
  if (!reason && status === 'ok') return 'content passed validation gates';
  if (!reason) return 'validation did not record a specific failure reason';
  return reason.length > 180 ? `${reason.slice(0, 177)}...` : reason;
}

function formatDiagnosticLine(
  diagnostic: ScrapeDiagnostic,
  index: number,
  diagnostics: ScrapeDiagnostic[]
): string {
  const source = diagnostic.source || 'unknown';
  const orderedIndex = STRATEGY_ORDER.includes(source) ? STRATEGY_ORDER.indexOf(source) + 1 : index + 1;
  const status = diagnostic.status || 'failed';
  const reason = compactReason(diagnostic.reason, status);
  const cause = diagnostic.cause ? ` cause=${diagnostic.cause}` : '';
  const duration = typeof diagnostic.durationMs === 'number' ? ` ${diagnostic.durationMs}ms` : '';
  const http = typeof diagnostic.httpStatus === 'number' && diagnostic.httpStatus > 0
    ? ` HTTP ${diagnostic.httpStatus}`
    : '';
  const next = diagnostics[index + 1]?.source;
  if (status === 'ok') {
    return `[${orderedIndex}/5 ${source}] ${status}${http}${duration}${cause}: ${reason}`;
  }
  const escalation =
    status === 'partial'
      ? 'captured incomplete text; source suspended pending review'
      : status === 'skipped'
        ? 'skipped by routing policy'
      : next
        ? `escalated to ${sourceLabel(next)} because ${reason}`
        : `chain stopped: ${reason}`;

  return `[${orderedIndex}/5 ${source}] ${status}${http}${duration}${cause}: ${reason} -> ${escalation}`;
}

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session.valid || session.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const channels = scanChannelCapabilities();
  const runId = request.nextUrl.searchParams.get('channelRunId');
  if (runId) {
    if (!isolatedChannelWorkspace()) return NextResponse.json({ error: 'experimental_channel_unavailable' }, { status: 409 });
    if (!/^[\w:-]{1,160}$/.test(runId)) return NextResponse.json({ error: 'invalid_run_id' }, { status: 400 });
    const report = await channelRunReport(runId);
    return NextResponse.json(report || { error: 'run_not_found' }, { status: report ? 200 : 404, headers: { 'Cache-Control': 'private, no-store' } });
  }
  return NextResponse.json({
    ...cronState,
    engineV6: engineEnabled(),
    channels,
    channelRuns: isolatedChannelWorkspace() ? await recentChannelRuns() : [],
    timestamp: new Date().toISOString(),
  }, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function POST(request: NextRequest) {
  const session = getSession(request);
  if (!session.valid || session.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const parsed = await readBoundedJsonObject(request, 16 * 1024);
  if (!parsed.ok) return NextResponse.json({ error: parsed.reason }, { status: 400 });
  let selected;
  try { selected = parseChannelRequest(parsed.value); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'invalid_scan_request' }, { status: 400 }); }
  const channels = scanChannelCapabilities();
  if (process.env.POLICYWATCHER_SCANS_PAUSED === '1') return NextResponse.json({ error: 'policy_scans_paused' }, { status: 503 });
  if (!channels[selected.channel]) return NextResponse.json({ error: selected.channel === 'stable' ? 'stable_channel_unavailable' : 'experimental_channel_unavailable' }, { status: 409 });
  if (selected.channel !== 'stable') {
    try {
      const run = await enqueueRun({ ...selected, channel: selected.channel, mode: 'observe', notificationMode: 'silent', requestedBy: 'admin-channel' });
      return NextResponse.json({ accepted: true, channel: selected.channel, runId: run.id, status: run.status,
        statusUrl: `/api/admin/cron-status?channelRunId=${encodeURIComponent(run.id)}` }, { status: 202 });
    } catch (error) {
      const reason = error instanceof Error ? error.message : '';
      const expected = ['request_key_conflict', 'stable_scan_active', 'stable_scan_recovery_required', 'experimental_channel_unavailable'];
      return NextResponse.json({ error: expected.includes(reason) ? reason : 'unable_to_enqueue_channel' }, { status: expected.includes(reason) ? 409 : 500 });
    }
  }
  const metadata = channelMetadata(selected);
  const existing = await db.scanRun.findUnique({ where: { id: `stable:${selected.requestKey}` } });
  if (existing) {
    const prior = existing.optionsJson ? JSON.parse(existing.optionsJson) : null;
    if (prior?.channelMetadata?.requestFingerprint !== metadata.requestFingerprint) return NextResponse.json({ error: 'request_key_conflict' }, { status: 409 });
    return NextResponse.json({ accepted: true, channel: 'stable', runId: existing.id, status: existing.status, replayed: true });
  }
  if (channels.preview && await db.engineRun.count({ where: { status: { in: ['queued', 'running'] } } })) return NextResponse.json({ error: 'preview_scan_active' }, { status: 409 });

  if (cronState.isRunning) {
    if (cronState.requestKey === selected.requestKey && cronState.requestFingerprint === metadata.requestFingerprint) return NextResponse.json({ accepted: true, channel: 'stable', runId: `stable:${selected.requestKey}`, status: 'running', replayed: true }, { status: 202 });
    return NextResponse.json(
      {
        error: 'A scan is already running.',
        startedAt: cronState.startedAt,
      },
      { status: 409 }
    );
  }

  cronState.isRunning = true;
  cronState.requestKey = selected.requestKey;
  cronState.requestFingerprint = metadata.requestFingerprint;
  cronState.startedAt = new Date().toISOString();
  cronState.lastError = null;
  cronState.progressTotal = 0;
  cronState.progressCurrent = 0;
  cronState.progressLog = [];
  cronState.progressActivity = 'Initializing...';
  const scanOptions: ScanOptions = { channel: 'stable', requestKey: selected.requestKey,
    limit: selected.limit, companySlug: selected.companySlug, notificationMode: 'silent', channelMetadata: metadata };

  // Progress callback updates cronState in real time.
  const onProgress = (p: ScanProgress) => {
    cronState.progressTotal = p.total;
    cronState.progressCurrent = p.current;

    if (p.phase === 'policy_start') {
      cronState.progressActivity = p.message;
    } else if (p.phase === 'policy_done') {
      cronState.progressLog.push(p.message);
      if (p.diagnostics?.length) {
        for (const [index, diagnostic] of p.diagnostics.entries()) {
          cronState.progressLog.push(`  ${formatDiagnosticLine(diagnostic, index, p.diagnostics)}`);
        }
      }
      cronState.progressActivity = '';
    } else if (p.phase === 'start') {
      cronState.progressLog.push(p.message);
    }
  };

  // Fire and forget: run the scan with progress tracking
  runFullScan(onProgress, scanOptions)
    .then((result) => {
      cronState.lastResult = result as unknown as Record<string, unknown>;
      cronState.lastCompletedAt = new Date().toISOString();
      cronState.lastError = null;
      cronState.progressActivity = `Scan complete: ${result.checked} checked, ${result.changed} changed, ${result.confirmationPending} awaiting confirmation, ${result.extractionHeld} needing review, ${result.rebaselined} re-baselined, ${result.partial} partial, ${result.errors} errors.`;
      cronState.progressLog.push(formatScanCompletionLog(result));
    })
    .catch((err) => {
      const errorMessage = err instanceof Error ? err.message : String(err);
      cronState.lastResult = { error: errorMessage };
      cronState.lastCompletedAt = new Date().toISOString();
      cronState.lastError = errorMessage;
      cronState.progressActivity = `Scan failed: ${errorMessage}`;
      cronState.progressLog.push(`Scan failed [ERROR]: ${errorMessage}`);
    })
    .finally(() => {
      cronState.isRunning = false;
    });

  return NextResponse.json({
    success: true,
    channel: 'stable',
    runId: `stable:${selected.requestKey}`,
    message: 'Scan started. Poll GET /api/admin/cron-status for updates.',
    startedAt: cronState.startedAt,
    options: scanOptions,
  });
}
