import { languageAlternates, publicLanguage, withSocialMetadata } from '@/lib/seo';
import type { Metadata } from 'next';
import NewsroomPageClient from '../NewsroomPageClient';

type Props = { searchParams: Promise<{ lang?: string }> };
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const lang = publicLanguage((await searchParams).lang);
  return withSocialMetadata({
    title: lang === 'it' ? 'Archivio release | PolicyWatcher' : 'Newsroom Releases | PolicyWatcher',
    description: lang === 'it' ? 'Release PolicyWatcher datate, collegamenti alle evidenze e limiti interpretativi.' : 'Dated PolicyWatcher product release information, evidence links and interpretation boundaries.',
    alternates: languageAlternates('/press-kit/releases', lang),
  }, lang);
}
export default async function PressKitReleasesPage({ searchParams }: Props) {
  const lang = publicLanguage((await searchParams).lang);
  return <NewsroomPageClient key={lang} view="releases" initialLang={lang} />;
}
