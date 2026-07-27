import type { Metadata } from 'next';
import NewsroomPageClient from '../NewsroomPageClient';

export const metadata: Metadata = {
  title: 'Press Kit Reference | PolicyWatcher',
  description: 'PolicyWatcher press asset provenance status, correction register and terminology.',
  alternates: { canonical: 'https://policywatcher.online/press-kit/reference' },
};

export default function PressKitReferencePage() {
  return <NewsroomPageClient view="reference" />;
}
