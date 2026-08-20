import type { Metadata } from 'next';
import Footer from '@/components/Footer';
import PublicHeader from '@/components/PublicHeader';
import {
  buildAssociationRadarItems,
  summarizeAssociationRadar,
  type AssociationLanguage,
} from '@/lib/associationVertical';
import { listPublicEvidencePacketSummaries } from '@/lib/evidencePacketData';
import { CIVIC_ROUTE_BY_LANGUAGE } from '@/lib/globalContext';
import { serializeJsonLd } from '@/lib/publicKnowledge';
import { POLICYWATCHER_CANONICAL_ORIGIN } from '@/lib/siteOrigin';
import AssociationsClient from './AssociationsClient';

export const ASSOCIATIONS_ROUTES = CIVIC_ROUTE_BY_LANGUAGE;

const pageCopy = {
  it: {
    title: 'Associazioni dei consumatori | PolicyWatcher',
    description: 'Directory verificabile di associazioni dei consumatori e diritti digitali, con contesto globale per paese e radar di evidenze pubbliche.',
    name: 'PolicyWatcher Civico',
    structuredDescription: 'Workspace pubblico globale con directory documentata di associazioni dei consumatori e diritti digitali, contesto territoriale e radar di evidenze con revisione umana.',
    errorLabel: '[Associazioni] Catalogo pubblico delle evidenze non disponibile:',
  },
  en: {
    title: 'Consumer associations | PolicyWatcher',
    description: 'Source-backed directory of consumer and digital-rights organizations, with country context and a public-evidence radar.',
    name: 'PolicyWatcher Civic',
    structuredDescription: 'Global public workspace with a source-backed directory of consumer and digital-rights organizations, territorial context and a human-reviewed evidence radar.',
    errorLabel: '[Associations] Public evidence catalog unavailable:',
  },
} as const;

export function buildAssociationsMetadata(lang: AssociationLanguage): Metadata {
  const copy = pageCopy[lang];
  const canonical = `${POLICYWATCHER_CANONICAL_ORIGIN}${ASSOCIATIONS_ROUTES[lang]}`;
  return {
    title: copy.title,
    description: copy.description,
    alternates: {
      canonical,
      languages: {
        'it-IT': `${POLICYWATCHER_CANONICAL_ORIGIN}${ASSOCIATIONS_ROUTES.it}`,
        en: `${POLICYWATCHER_CANONICAL_ORIGIN}${ASSOCIATIONS_ROUTES.en}`,
        'x-default': `${POLICYWATCHER_CANONICAL_ORIGIN}${ASSOCIATIONS_ROUTES.en}`,
      },
    },
    openGraph: {
      title: copy.title,
      description: copy.description,
      url: canonical,
      locale: lang === 'it' ? 'it_IT' : 'en_US',
      alternateLocale: [lang === 'it' ? 'en_US' : 'it_IT'],
      type: 'website',
    },
  };
}

export default async function LocalizedAssociationsPage({ lang }: { lang: AssociationLanguage }) {
  const copy = pageCopy[lang];
  let records: Awaited<ReturnType<typeof listPublicEvidencePacketSummaries>> = [];
  let catalogUnavailable = false;

  try {
    records = await listPublicEvidencePacketSummaries(50);
  } catch (error) {
    catalogUnavailable = true;
    console.error(copy.errorLabel, error);
  }

  const items = buildAssociationRadarItems(records.map((record) => ({
    ...record,
    summary: lang === 'it' ? record.summaryIt : record.summary,
  })), lang);
  const summary = summarizeAssociationRadar(items);
  const canonicalUrl = `${POLICYWATCHER_CANONICAL_ORIGIN}${ASSOCIATIONS_ROUTES[lang]}`;
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: copy.name,
    url: canonicalUrl,
    applicationCategory: 'CivicTechnology',
    inLanguage: lang,
    description: copy.structuredDescription,
    isPartOf: {
      '@type': 'WebSite',
      name: 'PolicyWatcher',
      url: `${POLICYWATCHER_CANONICAL_ORIGIN}/`,
    },
  };

  return (
    <>
      <PublicHeader current="associations" lang={lang} lockLang />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }}
      />
      <AssociationsClient
        lang={lang}
        items={items}
        summary={summary}
        catalogUnavailable={catalogUnavailable}
      />
      <Footer lang={lang} lockLang />
    </>
  );
}
