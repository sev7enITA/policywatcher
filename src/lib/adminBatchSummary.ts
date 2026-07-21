export interface BatchSummaryInput {
  limit: number;
  targetName?: string | null;
  availablePolicyCount?: number | null;
}

function normalizedLimit(limit: number): number {
  if (!Number.isFinite(limit)) return 1;
  return Math.max(1, Math.min(50, Math.floor(limit)));
}

export function getBatchLimitSummary({
  limit,
  targetName,
  availablePolicyCount,
}: BatchSummaryInput): string {
  const safeLimit = normalizedLimit(limit);

  if (!targetName) {
    return `Scans at most ${safeLimit} policy documents total across the inventory, starting with the least recently checked.`;
  }

  const available = Math.max(0, Math.floor(availablePolicyCount || 0));
  if (available === 0) {
    return 'Not used during discovery. Approve at least one source first.';
  }

  const base = `Scans at most ${safeLimit} of ${available} approved policy ${available === 1 ? 'document' : 'documents'} for ${targetName}. It never means ${safeLimit} companies.`;
  if (safeLimit > available) {
    return `${base} All ${available} available ${available === 1 ? 'policy' : 'policies'} will be scanned; the remaining ${safeLimit - available} ${safeLimit - available === 1 ? 'slot is' : 'slots are'} unused.`;
  }

  return base;
}
