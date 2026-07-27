import type { Metadata } from 'next';
import NewsroomPageClient from '../NewsroomPageClient';

export const metadata: Metadata = {
  title: 'Correction Register | PolicyWatcher',
  description: 'Dated PolicyWatcher press-kit corrections and clarifications linked to affected stable records.',
  alternates: { canonical: 'https://policywatcher.online/press-kit/corrections' },
};

export default function PressKitCorrectionsPage() {
  return <NewsroomPageClient view="corrections" />;
}
