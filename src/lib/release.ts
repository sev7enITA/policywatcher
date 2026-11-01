export const POLICYWATCHER_VERSION = '6.0.0-preview.1' as const;
export const POLICYWATCHER_VERSION_DISPLAY = '6.0.0-preview.1' as const;
export const POLICYWATCHER_RELEASE_NAME = 'Engine 6 Private Preview' as const;
export const POLICYWATCHER_RELEASE_DATE = '2026-11-01' as const;
export const POLICYWATCHER_RELEASE_DATE_LABEL = {
  en: '1 November 2026',
  it: '1 novembre 2026',
} as const;
export const POLICYWATCHER_RELEASE_MONTH_LABEL = {
  en: 'November 2026',
  it: 'novembre 2026',
} as const;
export type PolicyWatcherReleaseChannel = 'stable' | 'beta' | 'preview';
export const POLICYWATCHER_RELEASE_CHANNEL: PolicyWatcherReleaseChannel = 'preview';
export const POLICYWATCHER_RELEASE_CHANNEL_LABEL = 'PREVIEW' as const;
export const POLICYWATCHER_RELEASE_BADGE =
  `v${POLICYWATCHER_VERSION} · ${POLICYWATCHER_RELEASE_CHANNEL_LABEL}` as const;
export const POLICYWATCHER_BUILD_LABEL = `v${POLICYWATCHER_VERSION} ${POLICYWATCHER_RELEASE_NAME}` as const;
export const POLICYWATCHER_BROWSER_EXTENSION_VERSION = '3.8.3-beta.3' as const;
export const POLICYWATCHER_BROWSER_EXTENSION_DISPLAY_VERSION = '3.8.3 Beta 3' as const;
export const POLICYWATCHER_BROWSER_EXTENSION_RELEASE_BADGE =
  `v${POLICYWATCHER_BROWSER_EXTENSION_DISPLAY_VERSION} · EXTENSION BETA` as const;
export const POLICYWATCHER_BROWSER_EXTENSION_RELEASE_STATE = 'chrome-edge-store-published' as const;
export const POLICYWATCHER_BROWSER_EXTENSION_RELEASE_STATUS = {
  en: 'Chrome Web Store and Microsoft Edge Add-ons published · Safari not yet available',
  it: 'Pubblicata su Chrome Web Store e Microsoft Edge Add-ons · Safari non ancora disponibile',
} as const;
