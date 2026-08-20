const DEFAULT_ORIGIN = 'https://policywatcher.online';

export function resolveOrigin(candidate = process.env.EXPO_PUBLIC_POLICYWATCHER_ORIGIN, isDevelopment = __DEV__): string {
  if (!candidate) return DEFAULT_ORIGIN;
  try {
    const url = new URL(candidate);
    const localDevelopment = isDevelopment && url.protocol === 'http:' && ['localhost', '127.0.0.1', '10.0.2.2'].includes(url.hostname);
    if (url.protocol !== 'https:' && !localDevelopment) return DEFAULT_ORIGIN;
    return url.origin;
  } catch {
    return DEFAULT_ORIGIN;
  }
}

export const POLICYWATCHER_ORIGIN = resolveOrigin();
