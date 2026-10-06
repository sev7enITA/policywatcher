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
      ? 'Esamina localmente i link negli avvisi di aggiornamento delle policy e confrontali con le evidenze pubbliche di PolicyWatcher.'
      : 'Inspect policy-update links locally in your browser, then compare them with public PolicyWatcher evidence and recorded policy versions.',
    alternates: languageAlternates('/browser-extension', lang),
  }, lang);
}
export default async function BrowserExtensionPage({ searchParams }: Props) {
  return <BrowserExtensionClient lang={publicLanguage((await searchParams).lang)} storeLinks={getBrowserExtensionStoreLinks()} />;
}
