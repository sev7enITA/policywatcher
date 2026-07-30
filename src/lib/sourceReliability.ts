export const RETRIEVAL_CAUSES = [
  'verified',
  'partial',
  'access_blocked',
  'rate_limited',
  'upstream_unavailable',
  'transport_timeout',
  'content_incomplete',
  'content_invalid',
  'source_gone',
  'stale_archive',
  'configuration',
  'skipped',
  'unknown',
] as const;

export type RetrievalCause = (typeof RETRIEVAL_CAUSES)[number];

export interface DiagnosticLike {
  source?: string;
  status?: string;
  reason?: string;
  httpStatus?: number;
  durationMs?: number;
  cause?: RetrievalCause;
}

export interface StrategyMetric {
  attempted: number;
  accepted: number;
  failed: number;
  skipped: number;
  durationMs: number;
}

export interface RetrievalMetrics {
  policyRecords: number;
  uniqueSources: number;
  networkRetrievals: number;
  deduplicatedRetrievals: number;
  uniqueAvailableSources: number;
  uniqueUnavailableSources: number;
  retrievalAttempts: number;
  directSuccesses: number;
  rendererRescues: number;
  archiveRescues: number;
  degradedDependencies: string[];
  strategies: Record<string, StrategyMetric>;
}

export function normalizeAcquisitionUrl(value: string): string {
  try {
    const url = new URL(value.trim());
    url.protocol = url.protocol.toLowerCase();
    url.hostname = url.hostname.toLowerCase().replace(/^www\./, '');
    if ((url.protocol === 'https:' && url.port === '443') || (url.protocol === 'http:' && url.port === '80')) {
      url.port = '';
    }
    url.pathname = url.pathname.replace(/\/{2,}/g, '/');
    if (url.pathname !== '/') url.pathname = url.pathname.replace(/\/+$/, '');
    const sorted = [...url.searchParams.entries()].sort(([aKey, aValue], [bKey, bValue]) =>
      aKey.localeCompare(bKey) || aValue.localeCompare(bValue)
    );
    url.search = '';
    for (const [key, item] of sorted) url.searchParams.append(key, item);
    return url.toString();
  } catch {
    return value.trim();
  }
}

export function buildAcquisitionKey(value: string): string {
  return normalizeAcquisitionUrl(value);
}

export function classifyRetrievalCause(input: DiagnosticLike): RetrievalCause {
  if (input.cause) return input.cause;
  const status = (input.status || '').toLowerCase();
  const reason = (input.reason || '').toLowerCase();
  const httpStatus = input.httpStatus || 0;

  if (status === 'ok') return 'verified';
  if (status === 'partial') return 'partial';
  if (status === 'skipped') return 'skipped';
  if (httpStatus === 404 || httpStatus === 410 || reason.includes('soft_404') || reason.includes('_gone')) {
    return 'source_gone';
  }
  if (httpStatus === 429 || reason.includes('rate_limit') || reason.includes('too_many_requests')) {
    return 'rate_limited';
  }
  if (
    httpStatus === 401 || httpStatus === 403 ||
    reason.includes('blocked:') || reason.includes('captcha') || reason.includes('waf') ||
    reason.includes('access_denied')
  ) {
    return 'access_blocked';
  }
  if (httpStatus >= 500 || reason.includes('service_unavailable') || /(?:^|_)5\d\d(?:$|_)/.test(reason)) {
    return 'upstream_unavailable';
  }
  if (reason.includes('timeout') || reason.includes('aborted') || reason.includes('aborterror')) {
    return 'transport_timeout';
  }
  if (reason.includes('stale_snapshot') || reason.includes('stale_snapshots')) {
    return 'stale_archive';
  }
  if (reason.includes('content_too_short') || reason.includes('empty_html') || reason.includes('partial_retrieval')) {
    return 'content_incomplete';
  }
  if (
    reason.includes('not_a_policy') || reason.includes('host_drift') || reason.includes('path_drift') ||
    reason.includes('invalid')
  ) {
    return 'content_invalid';
  }
  if (reason.includes('not_configured') || reason.includes('malformed_url') || reason.includes('blocked_url')) {
    return 'configuration';
  }
  return 'unknown';
}

export function terminalRetrievalCause(diagnostics: DiagnosticLike[]): RetrievalCause {
  const causes = diagnostics.map(classifyRetrievalCause).filter((cause) => cause !== 'skipped');
  const priority: Array<Exclude<RetrievalCause, 'skipped' | 'verified' | 'partial'>> = [
    'source_gone',
    'access_blocked',
    'rate_limited',
    'upstream_unavailable',
    'transport_timeout',
    'content_invalid',
    'content_incomplete',
    'stale_archive',
    'configuration',
    'unknown',
  ];
  return priority.find((cause) => causes.includes(cause)) || 'unknown';
}

export function emptyRetrievalMetrics(policyRecords: number, uniqueSources: number): RetrievalMetrics {
  return {
    policyRecords,
    uniqueSources,
    networkRetrievals: 0,
    deduplicatedRetrievals: 0,
    uniqueAvailableSources: 0,
    uniqueUnavailableSources: 0,
    retrievalAttempts: 0,
    directSuccesses: 0,
    rendererRescues: 0,
    archiveRescues: 0,
    degradedDependencies: [],
    strategies: {},
  };
}

export function recordRetrievalDiagnostics(
  metrics: RetrievalMetrics,
  diagnostics: DiagnosticLike[],
  finalStatus: string,
  finalSource: string,
): void {
  metrics.networkRetrievals += 1;
  if (finalStatus === 'ok') metrics.uniqueAvailableSources += 1;
  else metrics.uniqueUnavailableSources += 1;

  if (finalSource === 'direct') metrics.directSuccesses += 1;
  if (finalSource === 'rendered') metrics.rendererRescues += 1;
  if (finalSource === 'wayback' || finalSource === 'commoncrawl') metrics.archiveRescues += 1;

  for (const diagnostic of diagnostics) {
    const source = diagnostic.source || 'unknown';
    const strategy = metrics.strategies[source] || {
      attempted: 0,
      accepted: 0,
      failed: 0,
      skipped: 0,
      durationMs: 0,
    };
    if (diagnostic.status === 'skipped') strategy.skipped += 1;
    else {
      strategy.attempted += 1;
      metrics.retrievalAttempts += 1;
    }
    if (diagnostic.status === 'ok' || diagnostic.status === 'partial') strategy.accepted += 1;
    if (diagnostic.status === 'failed' || diagnostic.status === 'rejected') strategy.failed += 1;
    strategy.durationMs += diagnostic.durationMs || 0;
    metrics.strategies[source] = strategy;

    const cause = classifyRetrievalCause(diagnostic);
    if (
      (source === 'wayback' || source === 'commoncrawl' || source === 'rendered') &&
      ['rate_limited', 'upstream_unavailable', 'transport_timeout'].includes(cause)
    ) {
      metrics.degradedDependencies.push(source);
    }
  }
  metrics.degradedDependencies = [...new Set(metrics.degradedDependencies)].sort();
}

export function suggestedSourceAction(cause: RetrievalCause): string {
  if (cause === 'partial') return 'Review extraction completeness before allowing the source to recover or publish evidence.';
  if (cause === 'access_blocked') return 'Review an official regional URL, PDF, or traceable assisted source; do not bypass provider challenges.';
  if (cause === 'source_gone') return 'Run source discovery and verify a replacement official URL.';
  if (cause === 'stale_archive') return 'Keep the current source withheld and expose only dated historical-reference metadata.';
  if (cause === 'content_incomplete' || cause === 'content_invalid') return 'Review extraction scope, canonical URL, and document markers.';
  if (cause === 'rate_limited' || cause === 'transport_timeout' || cause === 'upstream_unavailable') {
    return 'Review provider pacing, retry policy, and dependency health before changing the source.';
  }
  return 'Review the configured source and latest structured retrieval diagnostics.';
}
