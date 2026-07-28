/**
 * Dynamic sitemap - /sitemap.xml
 *
 * Enumerates every public policy-change permalink so search engines index
 * the "git log of tech policy" archive. Also includes the static landing pages.
 *
 * Revalidated hourly: the archive only grows when the cron runs, so this is
 * a safe cache window.
 */
import type { MetadataRoute } from 'next';
import { db } from '@/lib/db';
import { publicChangeWhere } from '@/lib/publicDataGate';
import { POLICYWATCHER_CANONICAL_ORIGIN, pressKitReleases } from '@/lib/pressKit';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || POLICYWATCHER_CANONICAL_ORIGIN;

export const revalidate = 3600; // 1 hour
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static landing pages
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/showcase`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.95 },
    { url: `${BASE_URL}/atlas`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/feature-atlas`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.92 },
    { url: `${BASE_URL}/observatory`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/developers`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.84 },
    { url: `${BASE_URL}/integrations`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.88 },
    { url: `${BASE_URL}/timeline`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE_URL}/what-changed`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.95 },
    { url: `${BASE_URL}/browser-extension`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.86 },
    { url: `${BASE_URL}/leaderboard`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE_URL}/trust`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/infographics`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.88 },
    { url: `${BASE_URL}/roadmap`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.85 },
    { url: `${BASE_URL}/press`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.82 },
    { url: `${BASE_URL}/press-kit`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.84 },
    { url: `${BASE_URL}/press-kit/releases`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.82 },
    { url: `${BASE_URL}/press-kit/data`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/press-kit/reference`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.74 },
    { url: `${BASE_URL}/press-kit/corrections`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.74 },
    { url: `${BASE_URL}/press-kit/glossary`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.72 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.78 },
    { url: `${BASE_URL}/methodology/confidence`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.85 },
    { url: `${BASE_URL}/security`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.65 },
  ];

  // All change permalinks (EN canonical)
  const changes = await db.policyChange.findMany({
    where: publicChangeWhere(),
    select: { id: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

  const changeEntries: MetadataRoute.Sitemap = changes.map((c) => ({
    url: `${BASE_URL}/change/${c.id}?lang=en`,
    lastModified: c.createdAt,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  const newsroomEntries: MetadataRoute.Sitemap = pressKitReleases.map((release) => ({
    url: `${BASE_URL}/press-kit/releases/${release.slug}`,
    lastModified: new Date(`${release.dateModified}T12:00:00+02:00`),
    changeFrequency: 'monthly' as const,
    priority: release.status === 'current' ? 0.82 : 0.7,
  }));

  return [...staticEntries, ...newsroomEntries, ...changeEntries];
}
