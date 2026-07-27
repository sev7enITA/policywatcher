import { NextResponse } from 'next/server';
import { POLICYWATCHER_CANONICAL_ORIGIN, pressKitReleases } from '@/lib/pressKit';

export const dynamic = 'force-static';

export function GET() {
  return NextResponse.json(
    {
      version: 'https://jsonfeed.org/version/1.1',
      title: 'PolicyWatcher Evidence Newsroom releases',
      home_page_url: `${POLICYWATCHER_CANONICAL_ORIGIN}/press-kit/releases`,
      feed_url: `${POLICYWATCHER_CANONICAL_ORIGIN}/press-kit/feed.json`,
      description: 'Dated PolicyWatcher product, methodology and distribution releases with stated boundaries.',
      language: 'en',
      authors: [{ name: 'PolicyWatcher', url: POLICYWATCHER_CANONICAL_ORIGIN }],
      items: pressKitReleases.map((release) => ({
        id: `${POLICYWATCHER_CANONICAL_ORIGIN}/press-kit/releases/${release.slug}`,
        url: `${POLICYWATCHER_CANONICAL_ORIGIN}/press-kit/releases/${release.slug}`,
        title: release.title.en,
        summary: release.summary.en,
        content_text: [release.summary.en, ...release.changes.map((item) => item.en), ...release.boundaries.map((item) => `Boundary: ${item.en}`)].join('\n\n'),
        date_published: `${release.datePublished}T12:00:00+02:00`,
        date_modified: `${release.dateModified}T12:00:00+02:00`,
        tags: ['PolicyWatcher', release.category, release.status],
        language: 'en',
      })),
    },
    {
      headers: {
        'Content-Type': 'application/feed+json; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    },
  );
}
