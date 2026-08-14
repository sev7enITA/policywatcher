export interface ScanCompletionCounts {
  checked: number;
  changed: number;
  confirmationPending?: number;
  rebaselined: number;
  partial: number;
  errors: number;
  unavailable: number;
  invalid: number;
  retrievalMetrics?: {
    uniqueSources: number;
    networkRetrievals: number;
    deduplicatedRetrievals: number;
    uniqueUnavailableSources: number;
    degradedDependencies: string[];
  };
}

export function formatScanCompletionLog(
  result: ScanCompletionCounts,
  completedAt = new Date()
): string {
  const needsAttention = result.errors > 0
    || (result.confirmationPending || 0) > 0
    || result.partial > 0
    || result.unavailable > 0
    || result.invalid > 0;
  const marker = needsAttention ? '[ATTENTION]' : '[OK]';
  const retrieval = result.retrievalMetrics
    ? `, ${result.retrievalMetrics.uniqueSources} unique sources, ${result.retrievalMetrics.networkRetrievals} network retrievals, ${result.retrievalMetrics.deduplicatedRetrievals} deduplicated, ${result.retrievalMetrics.uniqueUnavailableSources} unique sources unavailable${result.retrievalMetrics.degradedDependencies.length ? `, degraded: ${result.retrievalMetrics.degradedDependencies.join('/')}` : ''}`
    : '';
  return `Scan complete ${marker}: ${result.checked} checked${retrieval}, ${result.changed} changed, ${result.confirmationPending || 0} awaiting confirmation, ${result.rebaselined} re-baselined, ${result.partial} partial, ${result.unavailable} unavailable, ${result.invalid} invalid, ${result.errors} errors at ${completedAt.toLocaleTimeString()}`;
}
