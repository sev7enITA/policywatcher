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
import { publicChangeWhere, publicPolicyWhere } from '@/lib/publicDataGate';
import { pressKitReleases } from '@/lib/pressKit';
import { pulseStories } from '@/lib/editorialPulse';
import { POLICYWATCHER_CANONICAL_ORIGIN } from '@/lib/siteOrigin';

const BASE_URL = POLICYWATCHER_CANONICAL_ORIGIN;

export const revalidate = 3600; // 1 hour
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static landing pages
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, changeFrequency: 'daily', priority: 1.0 },
    // One canonical URL per supported language covers the global directory and
    // evidence radar; browser-local filters do not create thin indexable pages.
    {
      url: `${BASE_URL}/en/associations`,
      changeFrequency: 'daily',
      priority: 0.96,
      alternates: { languages: { en: `${BASE_URL}/en/associations`, it: `${BASE_URL}/it/associazioni` } },
    },
    {
      url: `${BASE_URL}/it/associazioni`,
      changeFrequency: 'daily',
      priority: 0.96,
      alternates: { languages: { en: `${BASE_URL}/en/associations`, it: `${BASE_URL}/it/associazioni` } },
    },
    { url: `${BASE_URL}/evidence`, changeFrequency: 'daily', priority: 0.94 },
    { url: `${BASE_URL}/collections`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/showcase`, changeFrequency: 'weekly', priority: 0.95 },
    { url: `${BASE_URL}/atlas`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/feature-atlas`, changeFrequency: 'weekly', priority: 0.92 },
    { url: `${BASE_URL}/observatory`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/developers`, changeFrequency: 'weekly', priority: 0.84 },
    { url: `${BASE_URL}/developers/event-continuity`, changeFrequency: 'monthly', priority: 0.82 },
    { url: `${BASE_URL}/developers/webhook-readiness`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/integrations`, changeFrequency: 'weekly', priority: 0.88 },
    { url: `${BASE_URL}/timeline`, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE_URL}/what-changed`, changeFrequency: 'weekly', priority: 0.95 },
    { url: `${BASE_URL}/browser-extension`, changeFrequency: 'weekly', priority: 0.86 },
    { url: `${BASE_URL}/leaderboard`, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE_URL}/trust`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/trust/residency`, changeFrequency: 'monthly', priority: 0.82 },
    { url: `${BASE_URL}/infographics`, changeFrequency: 'weekly', priority: 0.88 },
    { url: `${BASE_URL}/roadmap`, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${BASE_URL}/press`, changeFrequency: 'weekly', priority: 0.82 },
    { url: `${BASE_URL}/press-kit`, changeFrequency: 'weekly', priority: 0.84 },
    { url: `${BASE_URL}/pulse`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/press-kit/releases`, changeFrequency: 'weekly', priority: 0.82 },
    { url: `${BASE_URL}/press-kit/data`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/press-kit/reference`, changeFrequency: 'monthly', priority: 0.74 },
    { url: `${BASE_URL}/press-kit/corrections`, changeFrequency: 'monthly', priority: 0.74 },
    { url: `${BASE_URL}/press-kit/glossary`, changeFrequency: 'monthly', priority: 0.72 },
    { url: `${BASE_URL}/about`, changeFrequency: 'monthly', priority: 0.78 },
    { url: `${BASE_URL}/methodology/confidence`, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${BASE_URL}/security`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/privacy`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/terms`, changeFrequency: 'monthly', priority: 0.65 },
  ];

  // All change permalinks (EN canonical). A database failure must not leak
  // diagnostics or remove the stable static sitemap entries.
  let changes: Array<{ id: string; createdAt: Date }> = [];
  let knowledgePolicies: Array<{
    id: string;
    updatedAt: Date;
    lastSuccessfulCheckDate: Date;
    company: { slug: string; updatedAt: Date };
  }> = [];
  try {
    [changes, knowledgePolicies] = await Promise.all([
      db.policyChange.findMany({
        where: publicChangeWhere(),
        select: { id: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      db.policy.findMany({
        where: publicPolicyWhere() as never,
        select: {
          id: true,
          updatedAt: true,
          lastSuccessfulCheckDate: true,
          company: { select: { slug: true, updatedAt: true } },
        },
        orderBy: { updatedAt: 'desc' },
      }),
    ]);
  } catch (error) {
    console.error('[Sitemap] Dynamic public records temporarily unavailable:', error);
  }

  const changeEntries: MetadataRoute.Sitemap = changes.map((c) => ({
    url: `${BASE_URL}/change/${c.id}`,
    lastModified: c.createdAt,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  const evidenceEntries: MetadataRoute.Sitemap = changes.map((c) => ({
    url: `${BASE_URL}/evidence/${c.id}`,
    lastModified: c.createdAt,
    changeFrequency: 'monthly' as const,
    priority: 0.72,
  }));

  const knowledgePolicyEntries: MetadataRoute.Sitemap = knowledgePolicies.map((policy) => ({
    url: `${BASE_URL}/knowledge/companies/${policy.company.slug}/policies/${policy.id}`,
    lastModified: policy.updatedAt > policy.lastSuccessfulCheckDate ? policy.updatedAt : policy.lastSuccessfulCheckDate,
    changeFrequency: 'weekly' as const,
    priority: 0.76,
  }));

  const companyLastModified = new Map<string, Date>();
  for (const policy of knowledgePolicies) {
    const policyDate = policy.updatedAt > policy.lastSuccessfulCheckDate ? policy.updatedAt : policy.lastSuccessfulCheckDate;
    const candidate = policyDate > policy.company.updatedAt ? policyDate : policy.company.updatedAt;
    const existing = companyLastModified.get(policy.company.slug);
    if (!existing || candidate > existing) companyLastModified.set(policy.company.slug, candidate);
  }
  const knowledgeCompanyEntries: MetadataRoute.Sitemap = [...companyLastModified.entries()].map(([slug, lastModified]) => ({
    url: `${BASE_URL}/knowledge/companies/${slug}`,
    lastModified,
    changeFrequency: 'weekly' as const,
    priority: 0.82,
  }));
  const knowledgeHubEntry: MetadataRoute.Sitemap = [{
    url: `${BASE_URL}/knowledge`,
    lastModified: knowledgePolicies[0]?.updatedAt,
    changeFrequency: 'daily',
    priority: 0.96,
  }];

  const newsroomEntries: MetadataRoute.Sitemap = pressKitReleases.map((release) => ({
    url: `${BASE_URL}/press-kit/releases/${release.slug}`,
    lastModified: new Date(`${release.dateModified}T12:00:00+02:00`),
    changeFrequency: 'monthly' as const,
    priority: release.status === 'current' ? 0.82 : 0.7,
  }));

  const pulseEntries: MetadataRoute.Sitemap = pulseStories.map((story) => ({
    url: `${BASE_URL}/pulse/${story.slug}`,
    lastModified: new Date(`${story.updatedAt}T12:00:00+02:00`),
    changeFrequency: 'monthly' as const,
    priority: 0.84,
  }));

  return [
    ...staticEntries,
    ...knowledgeHubEntry,
    ...knowledgeCompanyEntries,
    ...knowledgePolicyEntries,
    ...pulseEntries,
    ...newsroomEntries,
    ...changeEntries,
    ...evidenceEntries,
  ];
}
