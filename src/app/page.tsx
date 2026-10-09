import { withSocialMetadata } from '@/lib/seo';
import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import { LANGUAGE_PREFERENCE_COOKIE, requestLanguage } from '@/lib/platformLanguage';
import HomeClient from './HomeClient';
import {
  HOME_DESCRIPTION,
  HOME_SOCIAL_IMAGE_URL,
  HOME_TITLE,
} from '@/lib/homeSeo';
import { getPublicKnowledgeHub, type PublicKnowledgeHub } from '@/lib/publicKnowledge';
import { languageAlternates } from '@/lib/seo';

type Props = { searchParams: Promise<{ lang?: string }> };

async function homeLanguage(queryLanguage?: string): Promise<'en' | 'it'> {
  const requestHeaders = await headers();
  return requestLanguage(queryLanguage, (await cookies()).get(LANGUAGE_PREFERENCE_COOKIE)?.value, requestHeaders.get('accept-language'));
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const lang = await homeLanguage((await searchParams).lang);
  const title = lang === 'it' ? 'PolicyWatcher | Modifiche a privacy, termini e policy AI' : HOME_TITLE;
  const description = lang === 'it' ? 'Segui le modifiche a informative privacy, termini di servizio e policy AI. Confronta le versioni registrate e verifica le fonti con PolicyWatcher.' : HOME_DESCRIPTION;
  return withSocialMetadata({
    title,
    description,
    alternates: languageAlternates('/', lang),
    openGraph: {
      title,
      description,
      url: languageAlternates('/', lang).canonical,
      siteName: 'PolicyWatcher',
      locale: lang === 'it' ? 'it_IT' : 'en_US',
      type: 'website',
      images: [{
        url: HOME_SOCIAL_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: lang === 'it' ? 'PolicyWatcher: monitoraggio delle evidenze pubbliche sulle policy' : 'PolicyWatcher public policy evidence monitor',
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [HOME_SOCIAL_IMAGE_URL],
    },
  }, lang);
}

export const dynamic = 'force-dynamic';

export default async function HomePage({ searchParams }: Props) {
  const initialLanguage = await homeLanguage((await searchParams).lang);
  let knowledge: PublicKnowledgeHub | null = null;
  try { knowledge = await getPublicKnowledgeHub(); }
  catch (error) { console.error('[Home] Public knowledge snapshot temporarily unavailable:', error); }
  return <HomeClient knowledge={knowledge} initialLanguage={initialLanguage} />;
}
