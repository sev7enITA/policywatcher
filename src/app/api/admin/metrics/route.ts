/**
 * Admin Metrics API
 *
 * GET /api/admin/metrics - Returns system metrics and a bounded operational
 * action center. Accessible by both admin and auditor roles.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/adminAuth';
import { db } from '@/lib/db';
import { getDatabaseDiagnostics } from '@/lib/databaseConfig';
import { buildEnvironmentReadiness, getDatabaseReadinessReport } from '@/lib/databaseReadiness';
import {
  buildAdminActionCenter,
  buildUnavailableAdminActionCenter,
} from '@/lib/adminActionCenter';
import {
  buildPublicationReadiness,
  buildUnavailablePublicationReadiness,
  type PublicationReadinessMetric,
} from '@/lib/publicationReadiness';
import { buildPressMetricCounts, emptyPressMetricCounts } from '@/lib/pressMetrics';
import { ensurePressMetricStorage } from '@/lib/pressMetricStorage';
import { buildAcquisitionKey } from '@/lib/sourceReliability';
import { publicPolicyWhere } from '@/lib/publicDataGate';

function toIso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const checkedAt = new Date().toISOString();
  const [database, databaseReadiness] = await Promise.all([
    getDatabaseDiagnostics(),
    getDatabaseReadinessReport(),
  ]);

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
    let latestPolicyInquiryAt: Date | null = null;
    let policyInquiryMetricsAvailable = true;
    try {
      const inquiryWhere = { status: { notIn: ['Rejected', 'Duplicate', 'Resolved'] } };
      const [count, latest] = await Promise.all([
        db.policyInquiry.count({ where: inquiryWhere }),
        db.policyInquiry.findFirst({
          where: inquiryWhere,
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        }),
      ]);
      openPolicyInquiryCount = count;
      latestPolicyInquiryAt = latest?.createdAt || null;
    } catch (error) {
      policyInquiryMetricsAvailable = false;
      console.warn('[Admin Metrics] Policy inquiry metric unavailable:', error);
    }

    let uniqueRetrievalKeys = 0;
    let publicEvidencePolicies = 0;
    let baselineMetricsAvailable = true;
    try {
      const [sourcePolicies, publicCount] = await Promise.all([
        db.policy.findMany({ select: { url: true, retrievalUrl: true } }),
        db.policy.count({ where: { snapshots: { some: { publicEvidence: true } } } }),
      ]);
      uniqueRetrievalKeys = new Set(
        sourcePolicies.map((policy) => buildAcquisitionKey(policy.retrievalUrl || policy.url)),
      ).size;
      publicEvidencePolicies = publicCount;
    } catch (error) {
      baselineMetricsAvailable = false;
      console.warn('[Admin Metrics] Public baseline metric unavailable:', error);
    }

    let latestScanStatus: string | null = null;
    let latestScanAt: Date | null = null;
    let scanMetricAvailable = true;
    try {
      const lastScan = await db.scanRun.findFirst({
        where: {
          status: 'completed',
          selectedRecords: { gte: policyCount },
        },
        orderBy: { startedAt: 'desc' },
        select: { status: true, startedAt: true },
      });
      latestScanStatus = lastScan?.status || null;
      latestScanAt = lastScan?.startedAt || null;
    } catch (error) {
      scanMetricAvailable = false;
      console.warn('[Admin Metrics] Source scan metric unavailable:', error);
    }

    let openRemediationIssues = 0;
    let latestRemediationAt: Date | null = null;
    let latestRemediationReasonCode: string | null = null;
    let remediationMetricAvailable = true;
    try {
      const remediationWhere = { status: { in: ['Watching', 'Open'] } };
      const [count, latest] = await Promise.all([
        db.sourceRemediationIssue.count({ where: remediationWhere }),
        db.sourceRemediationIssue.findFirst({
          where: remediationWhere,
          orderBy: { lastDetectedAt: 'desc' },
          select: { lastDetectedAt: true, reasonCode: true },
        }),
      ]);
      openRemediationIssues = count;
      latestRemediationAt = latest?.lastDetectedAt || null;
      latestRemediationReasonCode = latest?.reasonCode || null;
    } catch (error) {
      remediationMetricAvailable = false;
      console.warn('[Admin Metrics] Source remediation metric unavailable:', error);
    }

    let terminalWebhookFailures = 0;
    let latestWebhookFailureAt: Date | null = null;
    let latestWebhookErrorCode: string | null = null;
    let webhookMetricAvailable = true;
    try {
      const webhookWhere = { status: 'failed' };
      const [count, latest] = await Promise.all([
        db.webhookDelivery.count({ where: webhookWhere }),
        db.webhookDelivery.findFirst({
          where: webhookWhere,
          orderBy: { updatedAt: 'desc' },
          select: { lastAttemptAt: true, updatedAt: true, lastErrorCode: true },
        }),
      ]);
      terminalWebhookFailures = count;
      latestWebhookFailureAt = latest?.lastAttemptAt || latest?.updatedAt || null;
      latestWebhookErrorCode = latest?.lastErrorCode || null;
    } catch (error) {
      webhookMetricAvailable = false;
      console.warn('[Admin Metrics] Webhook terminal-failure metric unavailable:', error);
    }

    const unavailableStage = (reason: string): PublicationReadinessMetric => ({
      available: false,
      count: null,
      reason,
    });
    let retrievedStage = unavailableStage('Retrieved-policy metric is unavailable.');
    let baselineStage = unavailableStage('Verified-baseline metric is unavailable.');
    let publicStage = unavailableStage('Public-policy metric is unavailable.');
    let analysedStage = unavailableStage('Analysed-policy metric is unavailable.');

    try {
      retrievedStage = {
        available: true,
        count: await db.policy.count({
          where: {
            checkLogs: {
              some: {
                status: { in: ['Available', 'Reviewed'] },
                source: { notIn: ['seeded', 'none'], not: null },
                OR: [
                  { textHash: { not: null } },
                  { textLength: { gt: 0 } },
                ],
              },
            },
          },
        }),
      };
    } catch (error) {
      console.warn('[Admin Metrics] Retrieved-policy funnel metric unavailable:', error);
    }

    try {
      baselineStage = {
        available: true,
        count: await db.policy.count({ where: { snapshots: { some: { publicEvidence: true } } } }),
      };
    } catch (error) {
      console.warn('[Admin Metrics] Baseline-verified funnel metric unavailable:', error);
    }

    try {
      publicStage = {
        available: true,
        count: await db.policy.count({ where: publicPolicyWhere() }),
      };
    } catch (error) {
      console.warn('[Admin Metrics] Public-policy funnel metric unavailable:', error);
    }

    try {
      analysedStage = {
        available: true,
        count: await db.policy.count({
          where: publicPolicyWhere({ changes: { some: { publicEvidence: true } } }),
        }),
      };
    } catch (error) {
      console.warn('[Admin Metrics] Analysed-policy funnel metric unavailable:', error);
    }

    const sourceReliabilityAvailable = (
      baselineMetricsAvailable && scanMetricAvailable && remediationMetricAvailable
    );
    const sourceReliability = {
      available: sourceReliabilityAvailable,
      uniqueRetrievalKeys,
      publicEvidencePolicies,
      withheldPolicies: baselineMetricsAvailable
        ? Math.max(0, policyCount - publicEvidencePolicies)
        : 0,
      openRemediationIssues,
      lastScanStatus: latestScanStatus,
      lastScanAt: latestScanAt,
    };

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

    const [latestChange, allChanges] = await Promise.all([
      db.policyChange.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
      db.policyChange.findMany({
        select: { overallScore: true, overallRisk: true },
      }),
    ]);
    const riskDistribution: Record<string, number> = {};
    for (const change of allChanges) {
      riskDistribution[change.overallRisk] = (riskDistribution[change.overallRisk] || 0) + 1;
    }

    const actionCenter = buildAdminActionCenter({
      checkedAt,
      database: {
        available: true,
        status: databaseReadiness.status,
        checkedAt: databaseReadiness.checkedAt,
        missingTableCount: databaseReadiness.schema.missingTables.length,
        missingMigrationCount: databaseReadiness.schema.missingMigrations.length,
        diagnosticCode: databaseReadiness.diagnosticCode,
      },
      scan: {
        available: scanMetricAvailable,
        latestStartedAt: toIso(latestScanAt),
      },
      baselines: {
        available: baselineMetricsAvailable,
        configuredPolicies: baselineMetricsAvailable ? policyCount : null,
        verifiedPublicPolicies: baselineMetricsAvailable ? publicEvidencePolicies : null,
        observedAt: checkedAt,
      },
      remediation: {
        available: remediationMetricAvailable,
        openCount: remediationMetricAvailable ? openRemediationIssues : null,
        latestDetectedAt: toIso(latestRemediationAt),
        latestReasonCode: latestRemediationReasonCode,
      },
      webhook: {
        available: webhookMetricAvailable,
        terminalFailureCount: webhookMetricAvailable ? terminalWebhookFailures : null,
        latestFailureAt: toIso(latestWebhookFailureAt),
        latestErrorCode: latestWebhookErrorCode,
      },
      inquiries: {
        available: policyInquiryMetricsAvailable,
        openCount: policyInquiryMetricsAvailable ? openPolicyInquiryCount : null,
        latestCreatedAt: toIso(latestPolicyInquiryAt),
      },
    });
    const publicationReadiness = buildPublicationReadiness({
      checkedAt,
      configured: { available: true, count: policyCount },
      retrieved: retrievedStage,
      baselineVerified: baselineStage,
      public: publicStage,
      analysed: analysedStage,
    });

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
        environmentReadiness: buildEnvironmentReadiness(),
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
          sourceScan: scanMetricAvailable,
          publicBaselines: baselineMetricsAvailable,
          sourceRemediation: remediationMetricAvailable,
          webhookTerminalFailures: webhookMetricAvailable,
        },
        lastChangeAt: latestChange?.createdAt || null,
        riskDistribution,
        sourceReliability,
        pressNewsroom: {
          available: pressMetricsAvailable,
          allTime: allTimePressCounts,
          trailing30Days: trailingPressCounts,
          trailingWindowStartedAt: trailingWindowStartedAt.toISOString(),
          boundary: 'Aggregate event counts, not unique visitors or people, delivery confirmations, editorial decisions or conversion outcomes. Package, campaign, pitch, reply, card, citation, embed, contact and launch records represent bounded actions or operator entries; automated traffic can affect public-event counts.',
        },
      },
      actionCenter,
      publicationReadiness,
      timestamp: checkedAt,
      role: session.role,
    });
  } catch (error) {
    console.error('[Admin Metrics] Core query failed:', error);
    return NextResponse.json(
      {
        error: 'Core database metrics are unavailable. Open Database Readiness to inspect the current diagnostic state.',
        diagnosticCode: databaseReadiness.diagnosticCode || 'DATABASE_QUERY_FAILED',
        actionCenter: buildUnavailableAdminActionCenter(checkedAt),
        publicationReadiness: buildUnavailablePublicationReadiness(checkedAt),
        timestamp: checkedAt,
        role: session.role,
      },
      { status: 503 },
    );
  }
}
