import { serializeJsonLd } from '@/lib/structuredData';
import { PRESS_KIT_STRUCTURED_DATA } from '@/lib/pressKitStructuredData';
import { withSocialMetadata } from '@/lib/seo';
import type { Metadata } from 'next';
import PressKitClient from './PressKitClient';
import { PRESS_KIT_CANONICAL_URL } from '@/lib/pressKit';

export const metadata: Metadata = withSocialMetadata({
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
}, 'en');



export default function PressKitPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(PRESS_KIT_STRUCTURED_DATA) }}
      />
      <PressKitClient />
    </>
  );
}
