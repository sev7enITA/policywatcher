/**
 * Admin Review Log API
 *
 * GET /api/admin/review-log
 *
 * Returns append-only human review actions recorded from admin/auditor flows.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/adminAuth';
import { db } from '@/lib/db';

const MAX_LIMIT = 250;

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsedLimit = Number(searchParams.get('limit') || 100);
  const limit = Number.isFinite(parsedLimit)
    ? Math.min(Math.max(Math.trunc(parsedLimit), 1), MAX_LIMIT)
    : 100;

  try {
    const logs = await db.adminReviewLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        actorRole: true,
        action: true,
        targetType: true,
        targetId: true,
        targetLabel: true,
        oldValue: true,
        newValue: true,
        note: true,
        metadataJson: true,
        policyChangeId: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      role: session.role,
      generatedAt: new Date().toISOString(),
      count: logs.length,
      logs: logs.map((log) => ({
        ...log,
        createdAt: log.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('[Admin Review Log] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
