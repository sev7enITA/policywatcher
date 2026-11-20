import { withSocialMetadata, publicLanguage, languageAlternates } from '@/lib/seo';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import HomeLanding from './HomeLanding';
import {
  HOME_DESCRIPTION,
  HOME_NOTICE_COOKIE,
  HOME_SOCIAL_IMAGE_URL,
  homeStructuredData,
  HOME_TITLE,
} from '@/lib/homeSeo';
import { getPublicKnowledgeHub, serializeJsonLd, type PublicKnowledgeHub } from '@/lib/publicKnowledge';
import { POLICYWATCHER_VERSION } from '@/lib/release';

type PageProps = { searchParams: Promise<{ lang?: string }> };

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const lang = publicLanguage((await searchParams).lang);
  const title = lang === 'it' ? 'PolicyWatcher | Modifiche a privacy, condizioni e policy IA' : HOME_TITLE;
  const description = lang === 'it' ? 'Segui gli aggiornamenti delle policy aziendali. Confronta le versioni registrate di informative privacy, condizioni di servizio e regole sull’IA e verifica le fonti.' : HOME_DESCRIPTION;
  return withSocialMetadata({
    title, description, alternates: languageAlternates('/', lang),
    openGraph: {
      title, description, siteName: 'PolicyWatcher',
      images: [{ url: HOME_SOCIAL_IMAGE_URL, width: 1200, height: 630, alt: 'PolicyWatcher' }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [HOME_SOCIAL_IMAGE_URL] },
  }, lang);
}

export const dynamic = 'force-dynamic';

export default async function HomePage({ searchParams }: PageProps) {
  const lang = publicLanguage((await searchParams).lang);
  const hidden = (await cookies()).get(HOME_NOTICE_COOKIE)?.value === '1';
  let knowledge: PublicKnowledgeHub | null = null;
  try { knowledge = await getPublicKnowledgeHub(); }
  catch (error) { console.error('[Home] Public knowledge snapshot temporarily unavailable:', error); }
  const summary = knowledge && {
    availability: knowledge.availability,
    counts: knowledge.counts,
    lastObservedAt: knowledge.lastObservedAt,
    companies: knowledge.companies.map(({ id, slug, name }) => ({ id, slug, name })),
    policies: knowledge.policies.slice(0, 5).map(({ id, company, name, jurisdiction }) => ({ id, company, name, jurisdiction })),
  };
  return (
    <div data-policywatcher-release={POLICYWATCHER_VERSION}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(homeStructuredData(lang)) }} />
      <HomeLanding key={lang} initialLang={lang} initiallyHidden={hidden} knowledge={summary} />
    </div>
  );
}
