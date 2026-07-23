export const POLICYWATCHER_VERSION = '3.8.3-beta.4' as const;
export const POLICYWATCHER_RELEASE_NAME = 'Regional Retrieval Hardening' as const;
export type PolicyWatcherReleaseChannel = 'stable' | 'beta';
export const POLICYWATCHER_RELEASE_CHANNEL: PolicyWatcherReleaseChannel = 'beta';
export const POLICYWATCHER_RELEASE_CHANNEL_LABEL = 'BETA' as const;
export const POLICYWATCHER_RELEASE_BADGE =
  `v${POLICYWATCHER_VERSION} · ${POLICYWATCHER_RELEASE_CHANNEL_LABEL}` as const;
export const POLICYWATCHER_BUILD_LABEL = `v${POLICYWATCHER_VERSION} ${POLICYWATCHER_RELEASE_NAME}` as const;
