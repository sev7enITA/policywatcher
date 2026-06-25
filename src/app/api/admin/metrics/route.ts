/**
 * Admin Metrics API
 *
 * GET /api/admin/metrics - Returns system metrics, database stats, and last cron result.
 * Accessible by both admin and auditor roles.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/adminAuth';
import { db } from '@/lib/db';
import path from 'path';
import fs from 'fs';

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const cwd = process.cwd();
    const dbPath = path.join(cwd, 'prisma', 'dev.db');
    const dbExists = fs.existsSync(dbPath);

    const [companyCount, policyCount, snapshotCount, changeCount, subscriberCount] =
      await Promise.all([
        db.company.count(),
        db.policy.count(),
        db.policySnapshot.count(),
        db.policyChange.count(),
        db.subscriber.count(),
      ]);

    // Get the most recent change date
    const latestChange = await db.policyChange.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    // Risk score distribution
    const allChanges = await db.policyChange.findMany({
      select: { overallScore: true, overallRisk: true },
    });
    const riskDistribution: Record<string, number> = {};
    for (const c of allChanges) {
      riskDistribution[c.overallRisk] = (riskDistribution[c.overallRisk] || 0) + 1;
    }

    return NextResponse.json({
      system: {
        nodeVersion: process.version,
        nodeEnv: process.env.NODE_ENV || 'development',
        dbPath,
        dbExists,
        dbSizeBytes: dbExists ? fs.statSync(dbPath).size : 0,
        envVars: {
          GEMINI_API_KEY: process.env.GEMINI_API_KEY ? 'SET' : 'NOT SET',
          API_SECRET: process.env.API_SECRET ? 'SET' : 'NOT SET',
          SMTP_HOST: process.env.SMTP_HOST ? 'SET' : 'NOT SET',
          ADMIN_USER: process.env.ADMIN_USER ? 'SET' : 'NOT SET',
        },
      },
      data: {
        companies: companyCount,
        policies: policyCount,
        snapshots: snapshotCount,
        changes: changeCount,
        subscribers: subscriberCount,
        lastChangeAt: latestChange?.createdAt || null,
        riskDistribution,
      },
      timestamp: new Date().toISOString(),
      role: session.role,
    });
  } catch (error) {
    console.error('[Admin Metrics] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
