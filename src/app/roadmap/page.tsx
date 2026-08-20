import type { Metadata } from 'next';
import RoadmapClient from './RoadmapClient';

export const metadata: Metadata = {
  title: 'Product roadmap | PolicyWatcher',
  description:
    'PolicyWatcher public roadmap and community signal board: native dashboard intelligence, source assurance, API integrations, governance mapping, and future evidence workflows shaped by user feedback.',
  alternates: { canonical: '/roadmap' },
};

export default function RoadmapPage() {
  return <RoadmapClient />;
}
