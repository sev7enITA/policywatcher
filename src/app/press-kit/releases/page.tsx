import type { Metadata } from 'next';
import NewsroomPageClient from '../NewsroomPageClient';

export const metadata: Metadata = {
  title: 'Newsroom Releases | PolicyWatcher',
  description: 'Dated PolicyWatcher product release information, evidence links and interpretation boundaries.',
  alternates: { canonical: 'https://policywatcher.online/press-kit/releases' },
};

export default function PressKitReleasesPage() {
  return <NewsroomPageClient view="releases" />;
}
