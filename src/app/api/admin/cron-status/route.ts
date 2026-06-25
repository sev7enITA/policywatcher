/**
 * Admin Cron Status API
 *
 * GET /api/admin/cron-status - Returns current cron state (running/idle, last result).
 * POST /api/admin/cron-status - Triggers a full scan (admin only).
 * Admin only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/adminAuth';

// Shared cron state (in-memory, per-process)
// Exported so the cron/check-all route can update it.
export const cronState = {
  isRunning: false,
  startedAt: null as string | null,
  lastResult: null as Record<string, unknown> | null,
  lastCompletedAt: null as string | null,
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

  // Trigger the cron via internal fetch (same server)
  const baseUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`;
  const secret = process.env.API_SECRET;

  cronState.isRunning = true;
  cronState.startedAt = new Date().toISOString();

  // Fire and forget: run the cron in the background
  fetch(`${baseUrl}/api/cron/check-all`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
  })
    .then(async (res) => {
      const result = await res.json();
      cronState.lastResult = result;
      cronState.lastCompletedAt = new Date().toISOString();
    })
    .catch((err) => {
      cronState.lastResult = { error: String(err) };
      cronState.lastCompletedAt = new Date().toISOString();
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
