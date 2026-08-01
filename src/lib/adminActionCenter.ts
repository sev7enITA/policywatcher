export const ADMIN_SCAN_STALE_AFTER_HOURS = 30;
export const ADMIN_ACTION_CENTER_LIMIT = 5;

export type AdminActionSeverity = 'critical' | 'high' | 'medium' | 'unavailable';
export type AdminActionMetricState = 'available' | 'unavailable';

export interface AdminActionPriority {
  id: string;
  severity: AdminActionSeverity;
  severityLabel: 'Critical' | 'High' | 'Medium' | 'Unavailable';
  title: string;
  cause: string;
  timestamp: string | null;
  timestampLabel: string;
  impact: string;
  affectedRecords: number | null;
  metricState: AdminActionMetricState;
  action: {
    label: string;
    href: string;
  };
}

export interface AdminActionCenterInput {
  checkedAt: string;
  database: {
    available: boolean;
    status: 'ready' | 'degraded' | 'unavailable';
    checkedAt: string | null;
    missingTableCount: number | null;
    missingMigrationCount: number | null;
    diagnosticCode: string | null;
  };
  scan: {
    available: boolean;
    latestStartedAt: string | null;
  };
  baselines: {
    available: boolean;
    configuredPolicies: number | null;
    verifiedPublicPolicies: number | null;
    observedAt: string | null;
  };
  remediation: {
    available: boolean;
    openCount: number | null;
    latestDetectedAt: string | null;
    latestReasonCode: string | null;
  };
  webhook: {
    available: boolean;
    terminalFailureCount: number | null;
    latestFailureAt: string | null;
    latestErrorCode: string | null;
  };
  inquiries: {
    available: boolean;
    openCount: number | null;
    latestCreatedAt: string | null;
  };
  staleAfterHours?: number;
}

export interface AdminActionCenterResult {
  checkedAt: string;
  checkedWindow: string;
  priorities: AdminActionPriority[];
}

interface RankedPriority extends AdminActionPriority {
  rank: number;
}

function normalizeIso(value: string | null | undefined): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function safeCount(value: number | null): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : null;
}

function safeCode(value: string | null): string | null {
  if (!value) return null;
  const normalized = value.trim().toUpperCase().replace(/[^A-Z0-9_.:-]/g, '_').slice(0, 64);
  return normalized || null;
}

function priority(
  rank: number,
  input: Omit<AdminActionPriority, 'timestampLabel'>,
): RankedPriority {
  return {
    ...input,
    rank,
    timestampLabel: input.timestamp ? 'Evidence timestamp' : 'Timestamp unavailable',
  };
}

function unavailablePriority(
  rank: number,
  id: string,
  title: string,
  cause: string,
  impact: string,
  label: string,
  href: string,
): RankedPriority {
  return priority(rank, {
    id,
    severity: 'unavailable',
    severityLabel: 'Unavailable',
    title,
    cause,
    timestamp: null,
    impact,
    affectedRecords: null,
    metricState: 'unavailable',
    action: { label, href },
  });
}

/**
 * Builds the bounded admin triage queue from already-sanitized operational facts.
 * The 30-hour default allows a daily source run a small scheduling margin without
 * treating a missing or invalid timestamp as evidence of freshness.
 */
export function buildAdminActionCenter(input: AdminActionCenterInput): AdminActionCenterResult {
  const checkedAt = normalizeIso(input.checkedAt) || new Date(0).toISOString();
  const staleAfterHours = Number.isFinite(input.staleAfterHours) && (input.staleAfterHours || 0) > 0
    ? Number(input.staleAfterHours)
    : ADMIN_SCAN_STALE_AFTER_HOURS;
  const candidates: RankedPriority[] = [];

  const databaseCheckedAt = normalizeIso(input.database.checkedAt);
  const missingTables = safeCount(input.database.missingTableCount);
  const missingMigrations = safeCount(input.database.missingMigrationCount);
  const diagnosticCode = safeCode(input.database.diagnosticCode);

  if (!input.database.available || input.database.status === 'unavailable') {
    candidates.push(priority(0, {
      id: 'database-unavailable',
      severity: 'critical',
      severityLabel: 'Critical',
      title: 'Database readiness unavailable',
      cause: diagnosticCode
        ? `The readiness check could not complete (${diagnosticCode}).`
        : 'The readiness check could not complete.',
      timestamp: databaseCheckedAt,
      impact: 'Core operational records and dependent metrics cannot be trusted until database access is restored.',
      affectedRecords: null,
      metricState: 'unavailable',
      action: { label: 'Open Database Readiness', href: '/admin/database' },
    }));
  } else if (input.database.status === 'degraded') {
    const schemaDetail = [
      missingTables ? `${missingTables} missing table${missingTables === 1 ? '' : 's'}` : null,
      missingMigrations ? `${missingMigrations} missing migration${missingMigrations === 1 ? '' : 's'}` : null,
    ].filter(Boolean).join(' and ');
    candidates.push(priority(10, {
      id: 'database-degraded',
      severity: 'critical',
      severityLabel: 'Critical',
      title: 'Database readiness degraded',
      cause: schemaDetail || 'The database readiness check reported a degraded state.',
      timestamp: databaseCheckedAt,
      impact: 'Schema, integrity or write-readiness conditions may make operational results incomplete.',
      affectedRecords: (missingTables ?? 0) + (missingMigrations ?? 0),
      metricState: 'available',
      action: { label: 'Open Database Readiness', href: '/admin/database' },
    }));
  }

  const webhookCount = safeCount(input.webhook.terminalFailureCount);
  const webhookAt = normalizeIso(input.webhook.latestFailureAt);
  if (!input.webhook.available || webhookCount === null) {
    candidates.push(unavailablePriority(
      40,
      'webhook-metric-unavailable',
      'Webhook failure metric unavailable',
      'The terminal-delivery inventory could not be queried.',
      'Failed outbound delivery may require examination, but the affected count is unknown.',
      'Open Webhook Delivery',
      '/admin/webhook-delivery',
    ));
  } else if (webhookCount > 0) {
    const errorCode = safeCode(input.webhook.latestErrorCode);
    candidates.push(priority(20, {
      id: 'webhook-terminal-failures',
      severity: 'critical',
      severityLabel: 'Critical',
      title: 'Webhook deliveries reached terminal failure',
      cause: errorCode
        ? `${webhookCount} terminal delivery failure${webhookCount === 1 ? '' : 's'}; latest code ${errorCode}.`
        : `${webhookCount} terminal delivery failure${webhookCount === 1 ? '' : 's'} recorded.`,
      timestamp: webhookAt,
      impact: 'Configured receivers may not have received one or more policy-change events.',
      affectedRecords: webhookCount,
      metricState: 'available',
      action: { label: 'Open Webhook Delivery', href: '/admin/webhook-delivery' },
    }));
  }

  if (!input.scan.available) {
    candidates.push(unavailablePriority(
      41,
      'scan-metric-unavailable',
      'Source scan metric unavailable',
      'The latest persisted scan could not be queried.',
      'Source freshness cannot be established from available evidence.',
      'Open Cron Manager',
      '/admin/cron',
    ));
  } else if (input.scan.latestStartedAt === null) {
    candidates.push(priority(30, {
      id: 'scan-never-run',
      severity: 'high',
      severityLabel: 'High',
      title: 'No persisted source scan',
      cause: 'No ScanRun record is available.',
      timestamp: null,
      impact: 'Configured policies have no current scan evidence for publication readiness.',
      affectedRecords: null,
      metricState: 'available',
      action: { label: 'Open Cron Manager', href: '/admin/cron' },
    }));
  } else {
    const latestScanAt = normalizeIso(input.scan.latestStartedAt);
    if (!latestScanAt) {
      candidates.push(unavailablePriority(
        42,
        'scan-timestamp-unavailable',
        'Source scan timestamp unavailable',
        'The latest ScanRun timestamp is missing or invalid.',
        'Source freshness cannot be established from the persisted scan record.',
        'Open Cron Manager',
        '/admin/cron',
      ));
    } else {
      const ageMs = new Date(checkedAt).getTime() - new Date(latestScanAt).getTime();
      if (ageMs > staleAfterHours * 60 * 60 * 1000) {
        candidates.push(priority(31, {
          id: 'scan-stale',
          severity: 'high',
          severityLabel: 'High',
          title: 'Latest source scan is stale',
          cause: `The latest persisted scan is older than the ${staleAfterHours}-hour operational threshold.`,
          timestamp: latestScanAt,
          impact: 'Policy freshness and source availability may no longer reflect the current monitoring window.',
          affectedRecords: null,
          metricState: 'available',
          action: { label: 'Open Cron Manager', href: '/admin/cron' },
        }));
      }
    }
  }

  const configuredPolicies = safeCount(input.baselines.configuredPolicies);
  const verifiedPolicies = safeCount(input.baselines.verifiedPublicPolicies);
  if (!input.baselines.available || configuredPolicies === null || verifiedPolicies === null) {
    candidates.push(unavailablePriority(
      43,
      'baseline-metric-unavailable',
      'Public baseline metric unavailable',
      'Configured-policy or verified-baseline counts could not be queried.',
      'Publication readiness cannot be established for the configured policy inventory.',
      'Open Source Reliability',
      '/admin/source-reliability',
    ));
  } else {
    const missingBaselines = Math.max(0, configuredPolicies - verifiedPolicies);
    if (missingBaselines > 0) {
      candidates.push(priority(50, {
        id: 'public-baselines-missing',
        severity: 'high',
        severityLabel: 'High',
        title: 'Verified public baselines missing',
        cause: `${missingBaselines} of ${configuredPolicies} configured policies do not have a verified public baseline.`,
        timestamp: normalizeIso(input.baselines.observedAt) || checkedAt,
        impact: 'Affected policies remain withheld from public evidence surfaces.',
        affectedRecords: missingBaselines,
        metricState: 'available',
        action: { label: 'Open Source Reliability', href: '/admin/source-reliability' },
      }));
    }
  }

  const remediationCount = safeCount(input.remediation.openCount);
  if (!input.remediation.available || remediationCount === null) {
    candidates.push(unavailablePriority(
      44,
      'remediation-metric-unavailable',
      'Source remediation metric unavailable',
      'Open source issues could not be queried.',
      'Unresolved retrieval failures may exist without a visible count.',
      'Open Source Reliability',
      '/admin/source-reliability',
    ));
  } else if (remediationCount > 0) {
    const reasonCode = safeCode(input.remediation.latestReasonCode);
    candidates.push(priority(60, {
      id: 'source-remediation-open',
      severity: 'high',
      severityLabel: 'High',
      title: 'Source remediation issues open',
      cause: reasonCode
        ? `${remediationCount} open issue${remediationCount === 1 ? '' : 's'}; latest reason ${reasonCode}.`
        : `${remediationCount} open source issue${remediationCount === 1 ? '' : 's'} recorded.`,
      timestamp: normalizeIso(input.remediation.latestDetectedAt),
      impact: 'Affected retrieval sources require verification or remediation before evidence can be published.',
      affectedRecords: remediationCount,
      metricState: 'available',
      action: { label: 'Open Source Reliability', href: '/admin/source-reliability' },
    }));
  }

  const inquiryCount = safeCount(input.inquiries.openCount);
  if (!input.inquiries.available || inquiryCount === null) {
    candidates.push(unavailablePriority(
      70,
      'inquiry-metric-unavailable',
      'Policy inquiry metric unavailable',
      'Non-terminal PolicyInquiry records could not be queried.',
      'Requests needing examination may exist without a visible count.',
      'Open Policy Inquiries',
      '/admin/inquiries',
    ));
  } else if (inquiryCount > 0) {
    candidates.push(priority(80, {
      id: 'policy-inquiries-open',
      severity: 'medium',
      severityLabel: 'Medium',
      title: 'Policy inquiries need examination',
      cause: `${inquiryCount} non-terminal inquir${inquiryCount === 1 ? 'y' : 'ies'} remain open.`,
      timestamp: normalizeIso(input.inquiries.latestCreatedAt),
      impact: 'Submitted policy-change leads remain outside the resolved review workflow.',
      affectedRecords: inquiryCount,
      metricState: 'available',
      action: { label: 'Open Policy Inquiries', href: '/admin/inquiries' },
    }));
  }

  return {
    checkedAt,
    checkedWindow: `Latest persisted operational evidence; source freshness threshold ${staleAfterHours} hours.`,
    priorities: candidates
      .sort((left, right) => left.rank - right.rank || left.id.localeCompare(right.id))
      .slice(0, ADMIN_ACTION_CENTER_LIMIT)
      .map(({ rank, ...item }) => {
        void rank;
        return item;
      }),
  };
}

export function buildUnavailableAdminActionCenter(checkedAt = new Date().toISOString()): AdminActionCenterResult {
  const normalizedCheckedAt = normalizeIso(checkedAt) || new Date(0).toISOString();
  return {
    checkedAt: normalizedCheckedAt,
    checkedWindow: 'Core database metrics could not be queried.',
    priorities: [priority(0, {
      id: 'database-metrics-unavailable',
      severity: 'critical',
      severityLabel: 'Critical',
      title: 'Database metrics unavailable',
      cause: 'The core metrics query could not complete.',
      timestamp: normalizedCheckedAt,
      impact: 'Operational counts and dependent readiness signals are unavailable for this check.',
      affectedRecords: null,
      metricState: 'unavailable',
      action: { label: 'Open Database Readiness', href: '/admin/database' },
    })].map(({ rank, ...item }) => {
      void rank;
      return item;
    }),
  };
}
