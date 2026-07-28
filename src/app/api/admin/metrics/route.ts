/**
 * Admin Metrics API
 *
 * GET /api/admin/metrics - Returns system metrics, database stats, and last cron result.
 * Accessible by both admin and auditor roles.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/adminAuth';
import { db } from '@/lib/db';
import { getDatabaseDiagnostics } from '@/lib/databaseConfig';
import { buildPressMetricCounts, emptyPressMetricCounts } from '@/lib/pressMetrics';
import { ensurePressMetricStorage } from '@/lib/pressMetricStorage';

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const database = await getDatabaseDiagnostics();

  try {
    const trailingWindowStartedAt = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [companyCount, policyCount, snapshotCount, changeCount, subscriberCount] =
      await Promise.all([
        db.company.count(),
        db.policy.count(),
        db.policySnapshot.count(),
        db.policyChange.count(),
        db.subscriber.count(),
      ]);

    let openPolicyInquiryCount = 0;
    let policyInquiryMetricsAvailable = true;
    try {
      openPolicyInquiryCount = await db.policyInquiry.count({
        where: { status: { notIn: ['Rejected', 'Duplicate', 'Resolved'] } },
      });
    } catch (error) {
      policyInquiryMetricsAvailable = false;
      console.warn('[Admin Metrics] Policy inquiry metric unavailable:', error);
    }

    let allTimePressCounts = emptyPressMetricCounts();
    let trailingPressCounts = emptyPressMetricCounts();
    let pressMetricsAvailable = true;
    try {
      await ensurePressMetricStorage();
      const [allTimePressGroups, trailingPressGroups] = await Promise.all([
        db.pressMetricEvent.groupBy({
          by: ['eventType', 'target'],
          _count: { _all: true },
        }),
        db.pressMetricEvent.groupBy({
          by: ['eventType', 'target'],
          where: { createdAt: { gte: trailingWindowStartedAt } },
          _count: { _all: true },
        }),
      ]);
      allTimePressCounts = buildPressMetricCounts(allTimePressGroups);
      trailingPressCounts = buildPressMetricCounts(trailingPressGroups);
    } catch (error) {
      pressMetricsAvailable = false;
      console.warn('[Admin Metrics] Press metrics unavailable:', error);
    }

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
        dbPath: database.filePath || 'non-sqlite-database-url',
        dbExists: database.fileExists,
        dbDirectoryExists: database.directoryExists,
        dbDirectoryWritable: database.directoryWritable,
        dbFileReadable: database.fileReadable,
        dbFileWritable: database.fileWritable,
        dbSizeBytes: database.fileSizeBytes,
        envVars: {
          GEMINI_API_KEY: process.env.GEMINI_API_KEY ? 'SET' : 'NOT SET',
          API_SECRET: process.env.API_SECRET ? 'SET' : 'NOT SET',
          SESSION_HMAC_SECRET: process.env.SESSION_HMAC_SECRET ? 'SET' : 'NOT SET',
          DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
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
        openPolicyInquiries: openPolicyInquiryCount,
        metricAvailability: {
          policyInquiries: policyInquiryMetricsAvailable,
          pressNewsroom: pressMetricsAvailable,
        },
        lastChangeAt: latestChange?.createdAt || null,
        riskDistribution,
        pressNewsroom: {
          available: pressMetricsAvailable,
          allTime: allTimePressCounts,
          trailing30Days: trailingPressCounts,
          trailingWindowStartedAt: trailingWindowStartedAt.toISOString(),
          boundary: 'Aggregate event counts, not unique visitors. Package and contact events record intent only; automated traffic can affect counts.',
        },
      },
      timestamp: new Date().toISOString(),
      role: session.role,
    });
  } catch (error) {
    console.error('[Admin Metrics] Error:', error);
    return NextResponse.json(
      {
        error: 'Core database metrics are unavailable. Review the runtime error code and database diagnostics; the admin session remains accessible independently.',
        database: {
          path: database.filePath,
          directoryPath: database.directoryPath,
          directoryExists: database.directoryExists,
          directoryWritable: database.directoryWritable,
          fileExists: database.fileExists,
          fileReadable: database.fileReadable,
          fileWritable: database.fileWritable,
          fileSizeBytes: database.fileSizeBytes,
          configured: database.configured,
        },
      },
      { status: 503 }
    );
  }
}
