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
import { readScanOptions, runFullScan, ScanProgress } from '@/app/api/cron/check-all/route';
import type { ScrapeDiagnostic } from '@/lib/scraper';

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

function compactReason(reason: string | undefined): string {
  if (!reason) return 'no explicit reason recorded';
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
  const reason = compactReason(diagnostic.reason);
  const http = typeof diagnostic.httpStatus === 'number' && diagnostic.httpStatus > 0
    ? ` HTTP ${diagnostic.httpStatus}`
    : '';
  const next = diagnostics[index + 1]?.source;
  const escalation =
    status === 'ok'
      ? 'accepted as evidence'
      : status === 'partial'
        ? 'captured incomplete text; source suspended pending review'
      : next
        ? `escalated to ${sourceLabel(next)} because ${reason}`
        : `chain stopped: ${reason}`;

  return `[${orderedIndex}/5 ${source}] ${status}${http}: ${reason} -> ${escalation}`;
}

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session.valid || session.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  return NextResponse.json({
    ...cronState,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  const session = getSession(request);
  if (!session.valid || session.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  if (cronState.isRunning) {
    return NextResponse.json(
      {
        error: 'A scan is already running.',
        startedAt: cronState.startedAt,
      },
      { status: 409 }
    );
  }

  cronState.isRunning = true;
  cronState.startedAt = new Date().toISOString();
  cronState.lastError = null;
  cronState.progressTotal = 0;
  cronState.progressCurrent = 0;
  cronState.progressLog = [];
  cronState.progressActivity = 'Initializing...';
  const scanOptions = await readScanOptions(request);

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
      cronState.progressActivity = `Scan complete: ${result.checked} checked, ${result.changed} changed, ${result.rebaselined} re-baselined, ${result.partial} partial, ${result.errors} errors.`;
      cronState.progressLog.push(`Scan complete [OK] at ${new Date().toLocaleTimeString()}`);
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
    message: 'Scan started. Poll GET /api/admin/cron-status for updates.',
    startedAt: cronState.startedAt,
    options: scanOptions,
  });
}
