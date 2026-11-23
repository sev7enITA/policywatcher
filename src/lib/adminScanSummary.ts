export interface ScanCompletionCounts {
  checked: number;
  changed: number;
  confirmationPending?: number;
  rebaselined: number;
  partial: number;
  errors: number;
  unavailable: number;
  invalid: number;
  extractionHeld?: number;
  actionHolds?: number;
  execution?: 'complete' | 'attention';
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
    || result.execution === 'attention'
    || (result.actionHolds || 0) > 0
    || (result.extractionHeld || 0) > 0
    || (result.confirmationPending || 0) > 0
    || result.partial > 0
    || result.unavailable > 0
    || result.invalid > 0;
  const marker = needsAttention ? '[ATTENTION]' : '[OK]';
  const retrieval = result.retrievalMetrics
    ? `, ${result.retrievalMetrics.uniqueSources} unique sources, ${result.retrievalMetrics.networkRetrievals} network retrievals, ${result.retrievalMetrics.deduplicatedRetrievals} deduplicated, ${result.retrievalMetrics.uniqueUnavailableSources} unique sources unavailable${result.retrievalMetrics.degradedDependencies.length ? `, degraded: ${result.retrievalMetrics.degradedDependencies.join('/')}` : ''}`
    : '';
  const outcome = needsAttention ? 'Scan finished with items requiring attention' : 'Scan complete';
  return `${outcome} ${marker}: ${result.checked} checked${retrieval}, ${result.changed} changed, ${result.confirmationPending || 0} awaiting confirmation, ${result.rebaselined} re-baselined, ${result.partial} partial, ${result.unavailable} unavailable, ${result.invalid} invalid, ${result.errors} errors, ${result.actionHolds || 0} analysis/comparison holds at ${completedAt.toLocaleTimeString()}`;
}
