import { POLICYWATCHER_CANONICAL_ORIGIN, pressKitReleases } from '@/lib/pressKit';
import { POLICYWATCHER_RELEASE_DATE } from '@/lib/release';

export const dynamic = 'force-static';

function escapeXml(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
}

export function GET() {
  const items = pressKitReleases.map((release) => {
    const url = `${POLICYWATCHER_CANONICAL_ORIGIN}/press-kit/releases/${release.slug}`;
    const description = `${release.summary.en} ${release.boundaries.map((item) => `Boundary: ${item.en}`).join(' ')}`;
    return `<item><guid isPermaLink="true">${escapeXml(url)}</guid><link>${escapeXml(url)}</link><title>${escapeXml(release.title.en)}</title><description>${escapeXml(description)}</description><pubDate>${new Date(`${release.datePublished}T10:00:00Z`).toUTCString()}</pubDate><category>${escapeXml(release.category)}</category></item>`;
  }).join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>PolicyWatcher Evidence Newsroom releases</title><link>${POLICYWATCHER_CANONICAL_ORIGIN}/press-kit/releases</link><description>Dated product, methodology and distribution releases with stated boundaries.</description><language>en</language><lastBuildDate>${new Date(`${POLICYWATCHER_RELEASE_DATE}T10:00:00Z`).toUTCString()}</lastBuildDate><atom:link xmlns:atom="http://www.w3.org/2005/Atom" href="${POLICYWATCHER_CANONICAL_ORIGIN}/press-kit/feed.xml" rel="self" type="application/rss+xml"/>${items}</channel></rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' } });
}
