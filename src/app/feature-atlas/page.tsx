import type { Metadata } from 'next';
import { languageAlternates, publicLanguage, withSocialMetadata } from '@/lib/seo';
import FeatureAtlasClient from './FeatureAtlasClient';

type Props = { searchParams: Promise<{ lang?: string }> };
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const lang = publicLanguage((await searchParams).lang);
  return withSocialMetadata({
    title: lang === 'it' ? 'Atlante delle funzioni | PolicyWatcher' : 'Feature atlas | PolicyWatcher',
    description: lang === 'it' ? 'Atlante delle funzioni PolicyWatcher con dipendenze, riferimenti di implementazione, stato di consegna e limiti residui.' : 'PolicyWatcher capability directory with dependencies, inventory KPIs, residual KRIs, implementation references and delivery status.',
    alternates: languageAlternates('/feature-atlas', lang),
  }, lang);
}
export default async function Page({ searchParams }: Props) {
  return <FeatureAtlasClient lang={publicLanguage((await searchParams).lang)} />;
}
