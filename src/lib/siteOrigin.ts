export const POLICYWATCHER_CANONICAL_ORIGIN = 'https://policywatcher.online' as const;
export const POLICYWATCHER_CANONICAL_HOSTNAME = 'policywatcher.online' as const;
export const POLICYWATCHER_WWW_HOSTNAME = 'www.policywatcher.online' as const;

export function policyWatcherUrl(pathname = '/'): string {
  return new URL(pathname, `${POLICYWATCHER_CANONICAL_ORIGIN}/`).toString();
}

export function normalizeRequestHostname(value: string | null | undefined): string | null {
  const firstValue = value?.split(',')[0]?.trim().toLowerCase();
  if (!firstValue) return null;

  try {
    return new URL(`http://${firstValue}`).hostname.replace(/\.$/, '');
  } catch {
    return null;
  }
}
