/**
 * Admin Cron Status API
 *
 * GET /api/admin/cron-status - Returns current cron state + live progress log.
 * POST /api/admin/cron-status - Triggers a full scan (admin only).
 *
 * v3.0: Calls `runFullScan()` directly with a progress callback that
 * populates a live log array. The admin UI polls every 2s and renders
 * each entry in real-time.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/adminAuth';
import { runFullScan, ScanProgress } from '@/app/api/cron/check-all/route';

// Shared cron state (in-memory, per-process)
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

  // Progress callback — updates cronState in real-time
  const onProgress = (p: ScanProgress) => {
    cronState.progressTotal = p.total;
    cronState.progressCurrent = p.current;

    if (p.phase === 'policy_start') {
      cronState.progressActivity = p.message;
    } else if (p.phase === 'policy_done') {
      cronState.progressLog.push(p.message);
      cronState.progressActivity = '';
    } else if (p.phase === 'start') {
      cronState.progressLog.push(p.message);
    }
  };

  // Fire and forget: run the scan with progress tracking
  runFullScan(onProgress)
    .then((result) => {
      cronState.lastResult = result as unknown as Record<string, unknown>;
      cronState.lastCompletedAt = new Date().toISOString();
      cronState.lastError = null;
      cronState.progressActivity = `Scan complete: ${result.checked} checked, ${result.changed} changed, ${result.errors} errors.`;
      cronState.progressLog.push(`✅ Scan complete at ${new Date().toLocaleTimeString()}`);
    })
    .catch((err) => {
      const errorMessage = err instanceof Error ? err.message : String(err);
      cronState.lastResult = { error: errorMessage };
      cronState.lastCompletedAt = new Date().toISOString();
      cronState.lastError = errorMessage;
      cronState.progressActivity = `Scan failed: ${errorMessage}`;
      cronState.progressLog.push(`❌ Scan failed: ${errorMessage}`);
    })
    .finally(() => {
      cronState.isRunning = false;
    });

  return NextResponse.json({
    success: true,
    message: 'Scan started. Poll GET /api/admin/cron-status for updates.',
    startedAt: cronState.startedAt,
  });
}
