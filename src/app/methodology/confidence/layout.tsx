import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Evidence methodology | PolicyWatcher',
  description: 'PolicyWatcher data provenance, publication gates, AI constraints and evidence limitations.',
  alternates: { canonical: '/methodology/confidence' },
};

export default function ConfidenceMethodologyLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
