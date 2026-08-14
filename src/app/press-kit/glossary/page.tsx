import type { Metadata } from 'next';
import NewsroomPageClient from '../NewsroomPageClient';

export const metadata: Metadata = {
  title: 'Press Kit Glossary | PolicyWatcher',
  description: 'Definitions and interpretation boundaries for terms used in PolicyWatcher public evidence records.',
  alternates: { canonical: 'https://policywatcher.online/press-kit/glossary' },
};

export default function PressKitGlossaryPage() {
  return <NewsroomPageClient view="glossary" />;
}
