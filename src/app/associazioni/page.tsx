import type { Metadata } from 'next';
import Footer from '@/components/Footer';
import PublicHeader from '@/components/PublicHeader';
import {
  buildAssociationRadarItems,
  summarizeAssociationRadar,
} from '@/lib/associationVertical';
import { listPublicEvidencePacketSummaries } from '@/lib/evidencePacketData';
import { POLICYWATCHER_CANONICAL_ORIGIN } from '@/lib/pressKit';
import { serializeJsonLd } from '@/lib/publicKnowledge';
import AssociationsClient from './AssociationsClient';

export const metadata: Metadata = {
  title: 'PolicyWatcher Civico | Workspace globale per le associazioni',
  description:
    'Directory verificabile di associazioni dei consumatori e diritti digitali, con contesto globale per paese e radar di evidenze pubbliche.',
  alternates: { canonical: `${POLICYWATCHER_CANONICAL_ORIGIN}/associazioni` },
};

export const dynamic = 'force-dynamic';

export default async function AssociationsPage() {
  let records: Awaited<ReturnType<typeof listPublicEvidencePacketSummaries>> = [];
  let catalogUnavailable = false;

  try {
    records = await listPublicEvidencePacketSummaries(50);
  } catch (error) {
    catalogUnavailable = true;
    console.error('[Associazioni] Catalogo pubblico delle evidenze non disponibile:', error);
  }

  const items = buildAssociationRadarItems(records.map((record) => ({
    ...record,
    summary: record.summaryIt,
  })));
  const summary = summarizeAssociationRadar(items);
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'PolicyWatcher Civico',
    url: 'https://policywatcher.online/associazioni',
    applicationCategory: 'CivicTechnology',
    inLanguage: ['it', 'en'],
    description:
      'Workspace pubblico globale con directory source-backed di associazioni dei consumatori e diritti digitali, contesto territoriale e radar di evidenze con revisione umana.',
    isPartOf: {
      '@type': 'WebSite',
      name: 'PolicyWatcher',
      url: 'https://policywatcher.online/',
    },
  };

  return (
    <>
      <PublicHeader current="associations" lang="it" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }}
      />
      <AssociationsClient
        items={items}
        summary={summary}
        catalogUnavailable={catalogUnavailable}
      />
      <Footer lang="it" />
    </>
  );
}
