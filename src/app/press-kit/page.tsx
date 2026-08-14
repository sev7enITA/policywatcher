import type { Metadata } from 'next';
import PressKitClient from './PressKitClient';
import {
  PRESS_KIT_CANONICAL_URL,
  PRESS_KIT_LICENSE_URL,
  PRESS_KIT_RELEASE_DATE,
  PRESS_KIT_REPOSITORY_URL,
} from '@/lib/pressKit';
import {
  POLICYWATCHER_RELEASE_NAME,
  POLICYWATCHER_VERSION,
} from '@/lib/release';

export const metadata: Metadata = {
  title: 'Press Kit | PolicyWatcher',
  description: 'PolicyWatcher product facts, supporting links, limitations, media files, boilerplates and citation details.',
  alternates: { canonical: PRESS_KIT_CANONICAL_URL },
  openGraph: {
    title: 'PolicyWatcher Press Kit',
    description: 'Product facts, supporting links, limitations and owned media files.',
    url: PRESS_KIT_CANONICAL_URL,
    type: 'website',
    images: [{ url: 'https://policywatcher.online/press-kit/policywatcher-logo-square-1024.jpg', width: 1024, height: 1024, alt: 'PolicyWatcher brand artwork' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PolicyWatcher Press Kit',
    description: 'Product facts, supporting links, limitations and owned media files.',
    images: ['https://policywatcher.online/press-kit/policywatcher-logo-square-1024.jpg'],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://policywatcher.online/#software',
      name: 'PolicyWatcher',
      url: 'https://policywatcher.online/',
      applicationCategory: 'CivicTechnologyApplication',
      operatingSystem: 'Web',
      softwareVersion: POLICYWATCHER_VERSION,
      releaseNotes: 'https://policywatcher.online/roadmap',
      datePublished: PRESS_KIT_RELEASE_DATE,
      description: `${POLICYWATCHER_RELEASE_NAME} public policy evidence application. Outputs are evidence-gated and are not legal advice or compliance certification.`,
      codeRepository: PRESS_KIT_REPOSITORY_URL,
      license: PRESS_KIT_LICENSE_URL,
      image: 'https://policywatcher.online/press-kit/policywatcher-logo-square-1024.jpg',
      author: { '@id': 'https://policywatcher.online/#founder' },
    },
    {
      '@type': 'Person',
      '@id': 'https://policywatcher.online/#founder',
      name: 'Fabrizio Degni',
      url: 'https://policywatcher.online/about',
      sameAs: ['https://linkedin.com/in/fabriziodegni', PRESS_KIT_REPOSITORY_URL],
      email: 'mailto:info@policywatcher.online',
      image: 'https://policywatcher.online/press-kit/fabrizio-degni-portrait-200.png',
    },
  ],
};

export default function PressKitPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <PressKitClient />
    </>
  );
}
