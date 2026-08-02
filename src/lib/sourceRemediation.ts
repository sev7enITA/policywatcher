export const REMEDIATION_RETURN_LIMIT = 100;

export type SourceRemediationStatus = 'Open' | 'Watching' | 'Recovered' | 'Resolved';

export interface RemediationIssueLike {
  id: string;
  status: string;
  lastDetectedAt: Date | string;
  sourceUrl?: string;
  sourceHost?: string;
  retrievalKey: string;
  reasonCode?: string | null;
}

const STATUS_PRIORITY: Record<SourceRemediationStatus, number> = {
  Open: 0,
  Watching: 1,
  Recovered: 2,
  Resolved: 3,
};

const REASON_LABELS: Record<string, string> = {
  access_blocked: 'Access blocked',
  rate_limited: 'Rate limited',
  upstream_unavailable: 'Upstream unavailable',
  transport_timeout: 'Transport timeout',
  content_incomplete: 'Incomplete content',
  content_invalid: 'Invalid policy content',
  source_gone: 'Source removed',
  stale_archive: 'Stale archive evidence',
  configuration: 'Configuration issue',
  partial: 'Partial retrieval',
  unknown: 'Unknown retrieval failure',
};

export function remediationStatusPriority(status: string): number {
  return STATUS_PRIORITY[status as SourceRemediationStatus] ?? 4;
}

export function sortRemediationIssues<T extends RemediationIssueLike>(issues: T[]): T[] {
  return [...issues].sort((left, right) => {
    const byActionability = remediationStatusPriority(left.status) - remediationStatusPriority(right.status);
    if (byActionability !== 0) return byActionability;
    const byRecency = new Date(right.lastDetectedAt).getTime() - new Date(left.lastDetectedAt).getTime();
    return byRecency || left.id.localeCompare(right.id);
  });
}

export function remediationReasonLabel(reasonCode?: string | null): string {
  if (!reasonCode) return 'Reason not recorded';
  return REASON_LABELS[reasonCode] || reasonCode.replaceAll('_', ' ').replace(/^./, (value) => value.toUpperCase());
}

export interface SafeSourceReference {
  host: string;
  path: string;
  href: string | null;
}

export function safeSourceReference(value: string): SafeSourceReference {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    const path = url.pathname || '/';
    const validExternal = url.protocol === 'https:' && !url.username && !url.password && !url.hash && Boolean(host);
    return {
      host: host || 'Invalid source',
      path: path.length > 160 ? `${path.slice(0, 157)}...` : path,
      href: validExternal ? url.toString() : null,
    };
  } catch {
    return { host: 'Invalid source', path: 'URL unavailable', href: null };
  }
}

export function buildReturnedRemediationSummary(issues: RemediationIssueLike[], total: number) {
  const counts: Record<SourceRemediationStatus, number> = {
    Open: 0,
    Watching: 0,
    Recovered: 0,
    Resolved: 0,
  };
  for (const issue of issues) {
    if (issue.status in counts) counts[issue.status as SourceRemediationStatus] += 1;
  }
  return {
    returned: issues.length,
    total,
    limit: REMEDIATION_RETURN_LIMIT,
    counts: {
      open: counts.Open,
      watching: counts.Watching,
      recovered: counts.Recovered,
      resolved: counts.Resolved,
    },
    boundary: `Counts describe the ${issues.length} issues returned in this actionable window${total > issues.length ? ` of ${total} recorded issues` : ''}; they are not a source-health claim.`,
  };
}

export function deriveNextRemediationAction(issues: RemediationIssueLike[]) {
  const issue = sortRemediationIssues(issues).find((candidate) => candidate.status !== 'Resolved');
  if (!issue) return null;
  const sourceHost = issue.sourceHost || safeSourceReference(issue.sourceUrl || '').host;
  if (issue.status === 'Recovered') {
    return {
      issueId: issue.id,
      status: issue.status,
      sourceHost,
      label: 'Close recovered issue',
      guidance: 'Acquisition has recovered. Review the evidence, then close the issue if the successful rescan is sufficient.',
    };
  }
  if (issue.status === 'Watching') {
    return {
      issueId: issue.id,
      status: issue.status,
      sourceHost,
      label: 'Verify watching source',
      guidance: 'Review the emerging failure and rescan before it becomes an active remediation issue.',
    };
  }
  return {
    issueId: issue.id,
    status: issue.status,
    sourceHost,
    label: 'Repair active source failure',
    guidance: 'Inspect the bounded evidence, repair the configured acquisition path, then run a fresh source scan.',
  };
}
