import type { Metadata } from 'next';
import NewsroomPageClient from '../NewsroomPageClient';
import { POLICYWATCHER_CANONICAL_ORIGIN, PRESS_KIT_LICENSE_URL, pressKitDataSnapshots } from '@/lib/pressKit';

export const metadata: Metadata = {
  title: 'Editorial Data Room | PolicyWatcher',
  description: 'Dated PolicyWatcher editorial snapshots with citations, methodology links and published download formats.',
  alternates: { canonical: 'https://policywatcher.online/press-kit/data' },
  openGraph: {
    title: 'PolicyWatcher Editorial Data Room',
    description: 'Dated public snapshots with citations, methodology and reusable distributions.',
    url: 'https://policywatcher.online/press-kit/data',
    type: 'website',
    images: [{ url: 'https://policywatcher.online/api/og/data-room', width: 1200, height: 630, alt: 'PolicyWatcher Editorial Data Room' }],
  },
  twitter: { card: 'summary_large_image', images: ['https://policywatcher.online/api/og/data-room'] },
};

export default function PressKitDataPage() {
  const snapshot = pressKitDataSnapshots[0];
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: snapshot.title.en,
    description: snapshot.description.en,
    url: `${POLICYWATCHER_CANONICAL_ORIGIN}/press-kit/data`,
    identifier: snapshot.id,
    version: snapshot.id,
    dateModified: snapshot.generatedAt,
    temporalCoverage: snapshot.asOf,
    isAccessibleForFree: true,
    license: PRESS_KIT_LICENSE_URL,
    creator: { '@type': 'Person', name: 'Fabrizio Degni', url: `${POLICYWATCHER_CANONICAL_ORIGIN}/about` },
    publisher: { '@type': 'Organization', name: 'PolicyWatcher', url: POLICYWATCHER_CANONICAL_ORIGIN },
    variableMeasured: ['Configured monitored companies', 'Configured sectors', 'Canonical KPIs', 'Editorial languages'],
    measurementTechnique: 'Configured inventory snapshot documented by the PolicyWatcher confidence methodology.',
    distribution: snapshot.files.map((file) => ({
      '@type': 'DataDownload',
      encodingFormat: file.mediaType,
      contentUrl: new URL(file.href, POLICYWATCHER_CANONICAL_ORIGIN).toString(),
      name: `${snapshot.title.en} - ${file.format}`,
    })),
  };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} /><NewsroomPageClient view="data" /></>;
}
