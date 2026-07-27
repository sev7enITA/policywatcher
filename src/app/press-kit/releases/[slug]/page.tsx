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
  return {
    title: release ? `${release.displayVersion} | PolicyWatcher Newsroom` : 'Release | PolicyWatcher Newsroom',
    description: release?.summary.en ?? 'PolicyWatcher newsroom release record.',
    alternates: { canonical: `https://policywatcher.online/press-kit/releases/${slug}` },
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
