import type { Metadata } from 'next';
import { languageAlternates, publicLanguage, withSocialMetadata } from '@/lib/seo';
import WhatChangedClient from './WhatChangedClient';

type Props = { searchParams: Promise<{ lang?: string }> };
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const lang = publicLanguage((await searchParams).lang);
  return withSocialMetadata({
    title: lang === 'it' ? 'Verifica di una notifica policy | PolicyWatcher' : 'Policy notice verification | PolicyWatcher',
    description: lang === 'it'
      ? 'Usa un avviso di aggiornamento per consultare le evidenze pubbliche o registrare una richiesta limitata di revisione umana.'
      : 'Use a policy-update notification to query published evidence or register a human-review request.',
    alternates: languageAlternates('/what-changed', lang),
  }, lang);
}
export default async function WhatChangedPage({ searchParams }: Props) {
  return <WhatChangedClient initialLang={publicLanguage((await searchParams).lang)} />;
}
