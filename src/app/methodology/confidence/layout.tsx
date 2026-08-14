import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Evidence & Confidence Methodology | PolicyWatcher',
  description: 'PolicyWatcher data provenance, publication gates, AI constraints and confidence boundaries.',
  alternates: { canonical: '/methodology/confidence' },
};

export default function ConfidenceMethodologyLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
