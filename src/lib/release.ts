export const POLICYWATCHER_VERSION = '5.1.0' as const;
export const POLICYWATCHER_VERSION_DISPLAY = '5.1.0' as const;
export const POLICYWATCHER_RELEASE_NAME = 'Traceable Evidence' as const;
export const POLICYWATCHER_RELEASE_DATE = '2026-10-15' as const;
export const POLICYWATCHER_RELEASE_DATE_LABEL = {
  en: '15 October 2026',
  it: '15 ottobre 2026',
} as const;
export const POLICYWATCHER_RELEASE_MONTH_LABEL = {
  en: 'October 2026',
  it: 'ottobre 2026',
} as const;
export type PolicyWatcherReleaseChannel = 'stable' | 'beta';
export const POLICYWATCHER_RELEASE_CHANNEL: PolicyWatcherReleaseChannel = 'stable';
export const POLICYWATCHER_RELEASE_CHANNEL_LABEL = 'STABLE' as const;
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
