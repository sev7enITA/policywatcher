export const POLICYWATCHER_VERSION = '3.9.0-beta.38' as const;
export const POLICYWATCHER_VERSION_DISPLAY = '3.9.0 Beta 38' as const;
export const POLICYWATCHER_RELEASE_NAME = 'Git-hosted Press Distribution' as const;
export const POLICYWATCHER_RELEASE_DATE = '2026-08-02' as const;
export type PolicyWatcherReleaseChannel = 'stable' | 'beta';
export const POLICYWATCHER_RELEASE_CHANNEL: PolicyWatcherReleaseChannel = 'beta';
export const POLICYWATCHER_RELEASE_CHANNEL_LABEL = 'BETA' as const;
export const POLICYWATCHER_RELEASE_BADGE =
  `v${POLICYWATCHER_VERSION} · ${POLICYWATCHER_RELEASE_CHANNEL_LABEL}` as const;
export const POLICYWATCHER_BUILD_LABEL = `v${POLICYWATCHER_VERSION} ${POLICYWATCHER_RELEASE_NAME}` as const;
export const POLICYWATCHER_BROWSER_EXTENSION_VERSION = '3.8.3-beta.3' as const;
export const POLICYWATCHER_BROWSER_EXTENSION_DISPLAY_VERSION = '3.8.3 Beta 3' as const;
export const POLICYWATCHER_BROWSER_EXTENSION_RELEASE_BADGE =
  `v${POLICYWATCHER_BROWSER_EXTENSION_DISPLAY_VERSION} · EXTENSION BETA` as const;
export const POLICYWATCHER_BROWSER_EXTENSION_RELEASE_STATE = 'chrome-store-published' as const;
export const POLICYWATCHER_BROWSER_EXTENSION_RELEASE_STATUS = {
  en: 'Chrome Web Store published · Edge listing not yet verified · Safari not yet available',
  it: 'Pubblicata sul Chrome Web Store · scheda Edge non ancora verificata · Safari non ancora disponibile',
} as const;
