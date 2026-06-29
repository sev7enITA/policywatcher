/**
 * Dynamic sitemap — /sitemap.xml
 *
 * Enumerates every public policy-change permalink so search engines index
 * the "git log of tech policy" archive. Also includes the static landing pages.
 *
 * Revalidated hourly: the archive only grows when the cron runs, so this is
 * a safe cache window.
 */
import type { MetadataRoute } from 'next';
import { db } from '@/lib/db';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://www.policywatcher.online';

export const revalidate = 3600; // 1 hour
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static landing pages
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/showcase`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.95 },
    { url: `${BASE_URL}/timeline`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
  ];

  // All change permalinks (EN canonical)
  const changes = await db.policyChange.findMany({
    select: { id: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

  const changeEntries: MetadataRoute.Sitemap = changes.map((c) => ({
    url: `${BASE_URL}/change/${c.id}?lang=en`,
    lastModified: c.createdAt,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...staticEntries, ...changeEntries];
}
