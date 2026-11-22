import type { Metadata } from 'next';
import { languageAlternates, publicLanguage, withSocialMetadata } from '@/lib/seo';
import RoadmapClient from './RoadmapClient';

type Props = { searchParams: Promise<{ lang?: string }> };
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const lang = publicLanguage((await searchParams).lang);
  return withSocialMetadata({
    title: lang === 'it' ? 'Roadmap del prodotto | PolicyWatcher' : 'Product roadmap | PolicyWatcher',
    description: lang === 'it' ? 'Roadmap pubblica e proposte della comunità, con stati di consegna e limiti delle evidenze espliciti.' : 'PolicyWatcher public roadmap and community signal board, with delivery states and explicit evidence limits.',
    alternates: languageAlternates('/roadmap', lang),
  }, lang);
}
export default async function Page({ searchParams }: Props) {
  return <RoadmapClient lang={publicLanguage((await searchParams).lang)} />;
}
