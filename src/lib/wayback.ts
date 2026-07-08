export function buildWaybackSearchUrl(sourceUrl: string): string {
  return `https://web.archive.org/web/*/${sourceUrl}`;
}

export function buildWaybackSnapshotSearchUrl(sourceUrl: string, date: Date): string {
  if (Number.isNaN(date.getTime()) || date.getTime() > Date.now()) {
    return buildWaybackSearchUrl(sourceUrl);
  }

  const timestamp = date.toISOString().replace(/[-:T]/g, '').slice(0, 14);
  return `https://web.archive.org/web/${timestamp}*/${sourceUrl}`;
}
