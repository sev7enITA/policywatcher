import type { Metadata } from 'next';
import { languageAlternates, publicLanguage, withSocialMetadata } from '@/lib/seo';
import BriefingClient from './BriefingClient';

type Props = { searchParams: Promise<{ lang?: string }> };
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const lang = publicLanguage((await searchParams).lang);
  return withSocialMetadata({
    title: lang === 'it' ? 'Briefing policy e piano di revisione | PolicyWatcher' : 'Policy briefing and review plan | PolicyWatcher',
    description: lang === 'it' ? 'Filtra le modifiche pubblicate per servizio e tema, annota revisioni locali ed esporta un briefing con le fonti.' : 'Filter published changes by service and topic, keep a local review plan and export a source-linked briefing.',
    alternates: languageAlternates('/briefing', lang),
  }, lang);
}
export default async function BriefingPage({ searchParams }: Props) {
  return <BriefingClient locale={publicLanguage((await searchParams).lang)} />;
}
