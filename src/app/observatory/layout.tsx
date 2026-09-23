import { withSocialMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

export const metadata: Metadata = withSocialMetadata({
  title: 'Policy, privacy and AI meta-observatory | PolicyWatcher',
  description:
    'A census of AI, privacy and policy observatories, authorities and standards sources, with cross-source insights, an evidence gate and an operational monitoring calendar.',
  alternates: { canonical: '/observatory' },
}, 'en');

export const dynamic = 'force-dynamic';

export default function ObservatoryLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
