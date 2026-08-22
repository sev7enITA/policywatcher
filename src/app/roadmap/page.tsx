import type { Metadata } from 'next';
import RoadmapClient from './RoadmapClient';

export const metadata: Metadata = {
  title: 'Product roadmap | PolicyWatcher',
  description:
    'PolicyWatcher public roadmap: deployed evidence infrastructure, deployment-pending Full-V4 taxonomy and semantic gates, and research into provenance-rich, human-reviewed applicability assertions.',
  alternates: { canonical: '/roadmap' },
};

export default function RoadmapPage() {
  return <RoadmapClient />;
}
