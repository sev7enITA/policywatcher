import type { Metadata } from 'next';
import NewsroomPageClient from '../../NewsroomPageClient';
import { pressKitReleases } from '@/lib/pressKit';

interface ReleasePageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return pressKitReleases.map((release) => ({ slug: release.slug }));
}

export async function generateMetadata({ params }: ReleasePageProps): Promise<Metadata> {
  const { slug } = await params;
  const release = pressKitReleases.find((entry) => entry.slug === slug);
  const image = `https://policywatcher.online/api/og/release/${slug}`;
  return {
    title: release ? `${release.displayVersion} | PolicyWatcher Newsroom` : 'Release | PolicyWatcher Newsroom',
    description: release?.summary.en ?? 'PolicyWatcher newsroom release record.',
    alternates: { canonical: `https://policywatcher.online/press-kit/releases/${slug}` },
    openGraph: release ? { title: `${release.displayVersion}: ${release.title.en}`, description: release.summary.en, url: `https://policywatcher.online/press-kit/releases/${slug}`, type: 'article', publishedTime: release.datePublished, modifiedTime: release.dateModified, images: [{ url: image, width: 1200, height: 630, alt: `${release.displayVersion}: ${release.title.en}` }] } : undefined,
    twitter: release ? { card: 'summary_large_image', title: `${release.displayVersion}: ${release.title.en}`, description: release.summary.en, images: [image] } : undefined,
  };
}

export default async function PressKitReleasePage({ params }: ReleasePageProps) {
  const { slug } = await params;
  const release = pressKitReleases.find((entry) => entry.slug === slug);
  const jsonLd = release ? {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: release.title.en,
    description: release.summary.en,
    datePublished: release.datePublished,
    dateModified: release.dateModified,
    articleSection: release.category,
    mainEntityOfPage: `https://policywatcher.online/press-kit/releases/${release.slug}`,
    isAccessibleForFree: true,
    image: [`https://policywatcher.online/api/og/release/${release.slug}`],
    author: {
      '@type': 'Person',
      name: 'Fabrizio Degni',
      url: 'https://policywatcher.online/about',
    },
    publisher: {
      '@type': 'Person',
      name: 'Fabrizio Degni',
      url: 'https://policywatcher.online/about',
    },
  } : null;

  return (
    <>
      {jsonLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} /> : null}
      <NewsroomPageClient view="release-detail" releaseSlug={slug} />
    </>
  );
}
