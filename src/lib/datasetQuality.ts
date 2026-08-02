export interface TimestampedRecord {
  checkedAt: Date;
}

export interface QualityCheckScore {
  passed: number;
  total: number;
}

/**
 * SQLite deployments upgraded through the Hostinger fallback can contain a
 * mixture of ISO-text and Prisma integer DateTime values. SQL sorts storage
 * classes before their chronological value, so normalize the already parsed
 * dates in application code before selecting the latest evidence row.
 */
export function newestTimestampedRecord<T extends TimestampedRecord>(records: readonly T[]): T | undefined {
  return records.reduce<T | undefined>((latest, record) => (
    !latest || record.checkedAt.getTime() > latest.checkedAt.getTime() ? record : latest
  ), undefined);
}

/**
 * Produce a bounded coverage score from the evaluated cells represented by
 * the gate checks. Issue occurrences remain visible separately and therefore
 * do not multiply the same missing field into an uninformative score of zero.
 */
export function calculateDatasetQualityScore(checks: readonly QualityCheckScore[]): number {
  const evaluated = checks.filter((check) => (
    Number.isFinite(check.passed)
    && Number.isFinite(check.total)
    && check.total > 0
  ));
  const total = evaluated.reduce((sum, check) => sum + check.total, 0);
  if (total === 0) return 0;
  const passed = evaluated.reduce(
    (sum, check) => sum + Math.max(0, Math.min(check.passed, check.total)),
    0,
  );
  return Math.round((passed / total) * 1000) / 10;
}
