import type { Metadata } from 'next';
import { POLICYWATCHER_CANONICAL_ORIGIN, policyWatcherUrl } from './siteOrigin';
import type { ChangeClassification } from './changeClassificationTypes';
import { CHANGE_KIND_LABELS, changeClassificationDescription } from './changeClassificationCopy';

export type PublicLanguage = 'en' | 'it';
export const PUBLISHER_ID = `${POLICYWATCHER_CANONICAL_ORIGIN}/#organization`;
export const FOUNDER_ID = `${POLICYWATCHER_CANONICAL_ORIGIN}/#founder`;
export const DEFAULT_SOCIAL_IMAGE = policyWatcherUrl('/api/og/home');

/** URL state, not browser storage or Accept-Language, selects a public translation. */
export function publicLanguage(value: unknown): PublicLanguage {
  return value === 'it' ? 'it' : 'en';
}

export function publicRequestLanguage(pathname: string, queryLanguage: unknown): PublicLanguage {
  if (pathname.startsWith('/it/')) return 'it';
  const localizedQueryRoute = /^\/(change\/[^/]+|pulse\/[^/]+|share\/[^/]+|embed\/pulse\/[^/]+|guides(?:\/[^/]+)?|browser-extension)\/?$/.test(pathname);
  return localizedQueryRoute ? publicLanguage(queryLanguage) : 'en';
}

export function localizedPublicUrl(path: string, lang: PublicLanguage): string {
  const url = new URL(path, POLICYWATCHER_CANONICAL_ORIGIN);
  url.searchParams.delete('lang');
  if (lang === 'it') url.searchParams.set('lang', 'it');
  return url.toString();
}

export function localizedPublicPath(path: string, lang: PublicLanguage): string {
  const url = new URL(localizedPublicUrl(path, lang));
  return `${url.pathname}${url.search}${url.hash}`;
}

export function languageAlternates(path: string, lang: PublicLanguage) {
  const en = localizedPublicUrl(path, 'en');
  const it = localizedPublicUrl(path, 'it');
  return { canonical: lang === 'it' ? it : en, languages: { en, it, 'x-default': en } };
}

/** Complete each route's own preview instead of inheriting the homepage's title/URL. */
export function withSocialMetadata(metadata: Metadata, lang: PublicLanguage = 'en'): Metadata {
  const title = typeof metadata.title === 'string' ? metadata.title : 'PolicyWatcher';
  const description = metadata.description || undefined;
  const canonical = metadata.alternates?.canonical;
  const url = typeof canonical === 'string' ? policyWatcherUrl(canonical) : undefined;
  const openGraph = metadata.openGraph || {};
  return {
    ...metadata,
    openGraph: {
      title, description, url, siteName: 'PolicyWatcher',
      locale: lang === 'it' ? 'it_IT' : 'en_US', type: 'website',
      images: [{ url: DEFAULT_SOCIAL_IMAGE, width: 1200, height: 630, alt: 'PolicyWatcher' }],
      ...openGraph,
    },
    twitter: {
      card: 'summary_large_image', title: openGraph.title || title,
      description: openGraph.description || description,
      images: openGraph.images || [DEFAULT_SOCIAL_IMAGE],
      ...metadata.twitter,
    },
  };
}

export function breadcrumbData(items: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem', position: index + 1, name: item.name, item: policyWatcherUrl(item.path),
    })),
  };
}

interface RecordIdentity {
  company: string;
  policy: string;
  jurisdiction: string;
  date: string;
  version?: number | null;
}

export function recordIdentity(record: RecordIdentity): string {
  return `${record.company} ${record.policy} (${record.jurisdiction}) · ${record.date.slice(0, 10)}${record.version != null ? ` · V${record.version}` : ''}`;
}

/** The observation's classification takes precedence over an older AI summary. */
export function changeSearchDescription(record: RecordIdentity, classification: ChangeClassification, lang: PublicLanguage): string {
  return `${recordIdentity(record)}. ${CHANGE_KIND_LABELS[lang][classification.kind]}. ${changeClassificationDescription(classification, lang)}`;
}

/** A successful capture's age is not proof that a source or scanner is currently healthy. */
export function captureFreshness(lastRetrievedAt: string | null, now = new Date()) {
  if (!lastRetrievedAt) return { ageDays: null, status: 'unavailable' as const };
  const time = new Date(lastRetrievedAt).getTime();
  if (!Number.isFinite(time) || time > now.getTime()) return { ageDays: null, status: 'unavailable' as const };
  const ageDays = Math.floor((now.getTime() - time) / 86_400_000);
  return { ageDays, status: ageDays > 7 ? 'dated' as const : 'recent' as const };
}
