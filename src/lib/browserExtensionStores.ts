export type BrowserExtensionStore = 'chrome' | 'edge' | 'safari';

export type BrowserExtensionStoreLinks = Record<BrowserExtensionStore, string | null>;

const STORE_HOSTS: Record<BrowserExtensionStore, ReadonlySet<string>> = {
  chrome: new Set(['chromewebstore.google.com']),
  edge: new Set(['microsoftedge.microsoft.com']),
  safari: new Set(['apps.apple.com']),
};

type StoreEnv = Partial<Record<
  | 'NEXT_PUBLIC_CHROME_EXTENSION_URL'
  | 'NEXT_PUBLIC_EDGE_EXTENSION_URL'
  | 'NEXT_PUBLIC_SAFARI_EXTENSION_URL',
  string | undefined
>>;

export function normalizeExtensionStoreUrl(
  value: string | undefined,
  store?: BrowserExtensionStore,
): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    if (store && !STORE_HOSTS[store].has(url.hostname.toLowerCase())) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function getBrowserExtensionStoreLinks(
  env?: StoreEnv,
): BrowserExtensionStoreLinks {
  const source = env || {
    NEXT_PUBLIC_CHROME_EXTENSION_URL: process.env.NEXT_PUBLIC_CHROME_EXTENSION_URL,
    NEXT_PUBLIC_EDGE_EXTENSION_URL: process.env.NEXT_PUBLIC_EDGE_EXTENSION_URL,
    NEXT_PUBLIC_SAFARI_EXTENSION_URL: process.env.NEXT_PUBLIC_SAFARI_EXTENSION_URL,
  };
  return {
    chrome: normalizeExtensionStoreUrl(source.NEXT_PUBLIC_CHROME_EXTENSION_URL, 'chrome'),
    edge: normalizeExtensionStoreUrl(source.NEXT_PUBLIC_EDGE_EXTENSION_URL, 'edge'),
    safari: normalizeExtensionStoreUrl(source.NEXT_PUBLIC_SAFARI_EXTENSION_URL, 'safari'),
  };
}
