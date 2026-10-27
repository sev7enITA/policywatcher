import { POLICYWATCHER_CANONICAL_ORIGIN } from './siteOrigin';

export const PUBLISHER_ID = `${POLICYWATCHER_CANONICAL_ORIGIN}/#organization`;
export const FOUNDER_ID = `${POLICYWATCHER_CANONICAL_ORIGIN}/#founder`;
export const WEBSITE_ID = `${POLICYWATCHER_CANONICAL_ORIGIN}/#website`;
export const SOFTWARE_ID = `${POLICYWATCHER_CANONICAL_ORIGIN}/#software`;
export const SOURCE_CODE_ID = `${POLICYWATCHER_CANONICAL_ORIGIN}/#source-code`;

/** Complete identity stubs remain understandable without fetching another page's graph. */
export const PUBLIC_PUBLISHER = {
  '@type': 'Organization', '@id': PUBLISHER_ID,
  name: 'PolicyWatcher', url: `${POLICYWATCHER_CANONICAL_ORIGIN}/`,
} as const;
export const PUBLIC_AUTHOR = {
  '@type': 'Person', '@id': FOUNDER_ID,
  name: 'Fabrizio Degni', url: `${POLICYWATCHER_CANONICAL_ORIGIN}/about`,
} as const;
export const AUTHOR_PROFILES = ['https://www.linkedin.com/in/fdegni/', 'https://github.com/sev7enITA'] as const;

/** Escape HTML script delimiters while preserving the JSON round trip. No database dependency. */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
