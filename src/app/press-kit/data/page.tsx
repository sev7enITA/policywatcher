import type { Metadata } from 'next';
import NewsroomPageClient from '../NewsroomPageClient';

export const metadata: Metadata = {
  title: 'Editorial Data Room | PolicyWatcher',
  description: 'Dated PolicyWatcher editorial snapshots with citations, methodology links and published download formats.',
  alternates: { canonical: 'https://policywatcher.online/press-kit/data' },
};

export default function PressKitDataPage() {
  return <NewsroomPageClient view="data" />;
}
