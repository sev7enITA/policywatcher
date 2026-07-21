import type { Metadata } from 'next';
import RoadmapClient from './RoadmapClient';

export const metadata: Metadata = {
  title: 'PolicyWatcher Community Roadmap',
  description:
    'PolicyWatcher public roadmap and community signal board: adaptive workspaces, source assurance, API integrations, governance mapping, and future evidence workflows shaped by user feedback.',
};

export default function RoadmapPage() {
  return <RoadmapClient />;
}
