interface Capture {
  checkedAt: Date;
  status: string;
  source: string | null;
  textHash?: string | null;
  textLength?: number | null;
  archiveTimestamp: Date | null;
}

/** The latest check must carry evidence of retrieved text. An archive uses its own capture date. */
export function confirmedCaptureDate(capture: Capture | undefined): Date | null {
  if (!capture || !['Available', 'Reviewed'].includes(capture.status) || !capture.source
    || ['seeded', 'none', 'cache'].includes(capture.source.toLowerCase())
    || !(capture.textHash || (capture.textLength ?? 0) > 0)) return null;
  return ['wayback', 'commoncrawl', 'archive'].includes(capture.source.toLowerCase())
    ? capture.archiveTimestamp : capture.checkedAt;
}

export const latestCaptureCheck = {
  orderBy: [{ checkedAt: 'desc' as const }, { id: 'desc' as const }],
  take: 1,
  select: { checkedAt: true, status: true, source: true, textHash: true, textLength: true, archiveTimestamp: true },
};
