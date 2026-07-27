export const POLICYWATCHER_VERSION = '3.9.0-beta.4' as const;
export const POLICYWATCHER_VERSION_DISPLAY = '3.9.0 Beta 4' as const;
export const POLICYWATCHER_RELEASE_NAME = 'Native Dashboard Intelligence' as const;
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
export const POLICYWATCHER_BROWSER_EXTENSION_RELEASE_STATE = 'beta-package-ready' as const;
export const POLICYWATCHER_BROWSER_EXTENSION_RELEASE_STATUS = {
  en: 'Beta package ready · store submission planned',
  it: 'Pacchetto Beta pronto · invio allo store pianificato',
} as const;
