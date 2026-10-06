import type { Metadata } from 'next';
import { languageAlternates, localizedPublicUrl, publicLanguage } from '@/lib/seo';
import NewsroomPageClient from '../../NewsroomPageClient';
import { pressKitReleases } from '@/lib/pressKit';

interface ReleasePageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}

export function generateStaticParams() {
  return pressKitReleases.map((release) => ({ slug: release.slug }));
}

export async function generateMetadata({ params, searchParams }: ReleasePageProps): Promise<Metadata> {
  const { slug } = await params;
  const lang = publicLanguage((await searchParams).lang);
  const release = pressKitReleases.find((entry) => entry.slug === slug);
  const image = `https://policywatcher.online/api/og/release/${slug}`;
  return {
    title: release ? `${release.displayVersion} | PolicyWatcher Newsroom` : 'Release | PolicyWatcher Newsroom',
    description: release?.summary[lang] ?? 'PolicyWatcher newsroom release record.',
    alternates: languageAlternates(`/press-kit/releases/${slug}`, lang),
    openGraph: release ? { title: `${release.displayVersion}: ${release.title[lang]}`, description: release.summary[lang], url: localizedPublicUrl(`/press-kit/releases/${slug}`, lang), locale: lang === 'it' ? 'it_IT' : 'en_US', type: 'article', publishedTime: release.datePublished, modifiedTime: release.dateModified, images: [{ url: image, width: 1200, height: 630, alt: `${release.displayVersion}: ${release.title[lang]}` }] } : undefined,
    twitter: release ? { card: 'summary_large_image', title: `${release.displayVersion}: ${release.title[lang]}`, description: release.summary[lang], images: [image] } : undefined,
  };
}

export default async function PressKitReleasePage({ params, searchParams }: ReleasePageProps) {
  const { slug } = await params;
  const lang = publicLanguage((await searchParams).lang);
  const release = pressKitReleases.find((entry) => entry.slug === slug);
  const jsonLd = release ? {
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
      <NewsroomPageClient key={`${slug}-${lang}`} view="release-detail" releaseSlug={slug} initialLang={lang} />
    </>
  );
}
