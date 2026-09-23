import { withSocialMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

export const metadata: Metadata = withSocialMetadata({
  title: 'Evidence methodology | PolicyWatcher',
  description: 'PolicyWatcher data provenance, publication gates, AI constraints and evidence limitations.',
  alternates: { canonical: '/methodology/confidence' },
}, 'en');

export default function ConfidenceMethodologyLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
