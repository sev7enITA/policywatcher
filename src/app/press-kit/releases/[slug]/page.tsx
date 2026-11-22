import { PUBLIC_AUTHOR, PUBLIC_PUBLISHER, serializeJsonLd } from '@/lib/structuredData';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { languageAlternates, localizedPublicUrl, publicLanguage } from '@/lib/seo';
import NewsroomPageClient from '../../NewsroomPageClient';
import { pressKitReleases } from '@/lib/pressKit';

interface ReleasePageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return pressKitReleases.map((release) => ({ slug: release.slug }));
}

export async function generateMetadata({ params, searchParams }: ReleasePageProps): Promise<Metadata> {
  const { slug } = await params;
  const lang = publicLanguage((await searchParams).lang);
  const release = pressKitReleases.find((entry) => entry.slug === slug) ?? notFound();
  const image = `https://policywatcher.online/api/og/release/${slug}`;
  return {
    title: `${release.title[lang]} | PolicyWatcher Newsroom`,
    description: release.summary[lang],
    alternates: languageAlternates(`/press-kit/releases/${slug}`, lang),
    openGraph: { title: `${release.displayVersion}: ${release.title[lang]}`, description: release.summary[lang], url: localizedPublicUrl(`/press-kit/releases/${slug}`, lang), locale: lang === 'it' ? 'it_IT' : 'en_US', type: 'article', publishedTime: release.datePublished, modifiedTime: release.dateModified, images: [{ url: image, width: 1200, height: 630, alt: `${release.displayVersion}: ${release.title[lang]}` }] },
    twitter: { card: 'summary_large_image', title: `${release.displayVersion}: ${release.title[lang]}`, description: release.summary[lang], images: [image] },
  };
}

export default async function PressKitReleasePage({ params, searchParams }: ReleasePageProps) {
  const { slug } = await params;
  const lang = publicLanguage((await searchParams).lang);
  const release = pressKitReleases.find((entry) => entry.slug === slug) ?? notFound();
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: release.title[lang],
    description: release.summary[lang],
    datePublished: release.datePublished,
    dateModified: release.dateModified,
    articleSection: release.category,
    mainEntityOfPage: localizedPublicUrl(`/press-kit/releases/${release.slug}`, lang),
    inLanguage: lang,
    isAccessibleForFree: true,
    image: [`https://policywatcher.online/api/og/release/${release.slug}`],
    author: PUBLIC_AUTHOR,
    publisher: PUBLIC_PUBLISHER,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      <NewsroomPageClient key={`${slug}-${lang}`} view="release-detail" releaseSlug={slug} initialLang={lang} />
    </>
  );
}
