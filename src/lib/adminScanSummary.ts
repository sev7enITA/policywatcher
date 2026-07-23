export interface ScanCompletionCounts {
  checked: number;
  changed: number;
  rebaselined: number;
  partial: number;
  errors: number;
  unavailable: number;
  invalid: number;
}

export function formatScanCompletionLog(
  result: ScanCompletionCounts,
  completedAt = new Date()
): string {
  const needsAttention = result.errors > 0
    || result.partial > 0
    || result.unavailable > 0
    || result.invalid > 0;
  const marker = needsAttention ? '[ATTENTION]' : '[OK]';
  return `Scan complete ${marker}: ${result.checked} checked, ${result.changed} changed, ${result.rebaselined} re-baselined, ${result.partial} partial, ${result.unavailable} unavailable, ${result.invalid} invalid, ${result.errors} errors at ${completedAt.toLocaleTimeString()}`;
}
