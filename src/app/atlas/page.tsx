import type { Metadata } from 'next';
import { languageAlternates, publicLanguage, withSocialMetadata } from '@/lib/seo';
import SiteAtlasClient from './SiteAtlasClient';

type Props = { searchParams: Promise<{ lang?: string }> };
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const lang = publicLanguage((await searchParams).lang);
  return withSocialMetadata({
    title: lang === 'it' ? 'Mappa del sito | PolicyWatcher' : 'Site map | PolicyWatcher',
    description: lang === 'it' ? 'Mappa delle sezioni pubbliche, delle evidenze, dei controlli di qualità e delle operazioni protette di PolicyWatcher.' : 'PolicyWatcher route graph with public sections, evidence views, quality controls, methodology and protected operations.',
    alternates: languageAlternates('/atlas', lang),
  }, lang);
}
export default async function Page({ searchParams }: Props) {
  return <SiteAtlasClient lang={publicLanguage((await searchParams).lang)} />;
}
