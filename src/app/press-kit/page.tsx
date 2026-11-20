import type { Metadata } from 'next';
import { serializeJsonLd } from '@/lib/structuredData';
import { PRESS_KIT_STRUCTURED_DATA } from '@/lib/pressKitStructuredData';
import { languageAlternates, publicLanguage, withSocialMetadata } from '@/lib/seo';
import PressKitClient from './PressKitClient';

type Props = { searchParams: Promise<{ lang?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const lang = publicLanguage((await searchParams).lang);
  const description = lang === 'it'
    ? 'Schede stampa, screenshot del Briefing, pacchetti editoriali e fonti di PolicyWatcher.'
    : 'PolicyWatcher fact sheets, Briefing screenshots, editorial packages and sources.';
  const title = lang === 'it' ? 'Materiali per la stampa | PolicyWatcher' : 'Press Kit | PolicyWatcher';
  const image = 'https://policywatcher.online/press-kit/policywatcher-logo-square-1024.jpg';
  return withSocialMetadata({
    title,
    description,
    alternates: languageAlternates('/press-kit', lang),
    openGraph: { type: 'website', images: [{ url: image, width: 1024, height: 1024, alt: 'PolicyWatcher' }] },
    twitter: { card: 'summary_large_image', images: [image] },
  }, lang);
}

export default async function PressKitPage({ searchParams }: Props) {
  const lang = publicLanguage((await searchParams).lang);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(PRESS_KIT_STRUCTURED_DATA) }}
      />
      <PressKitClient lang={lang} />
    </>
  );
}
