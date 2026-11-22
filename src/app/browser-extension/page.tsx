import type { Metadata } from 'next';
import BrowserExtensionClient from './BrowserExtensionClient';
import { getBrowserExtensionStoreLinks } from '@/lib/browserExtensionStores';
import { languageAlternates, publicLanguage, withSocialMetadata } from '@/lib/seo';

type Props = { searchParams: Promise<{ lang?: string }> };
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const lang = publicLanguage((await searchParams).lang);
  return withSocialMetadata({
    title: lang === 'it' ? 'Verifica dei link delle policy | PolicyWatcher' : 'Policy link verification | PolicyWatcher',
    description: lang === 'it'
      ? 'Esamina localmente i link negli avvisi delle policy. Consulta le evidenze del candidato Safari iOS non firmato e i limiti delle prove, separati dalla disponibilità negli store.'
      : 'Inspect policy-update links locally. Read the unsigned Safari iOS candidate evidence and test limits, separate from browser-store availability.',
    alternates: languageAlternates('/browser-extension', lang),
  }, lang);
}
export default async function BrowserExtensionPage({ searchParams }: Props) {
  return <BrowserExtensionClient lang={publicLanguage((await searchParams).lang)} storeLinks={getBrowserExtensionStoreLinks()} />;
}
