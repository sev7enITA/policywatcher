import { withSocialMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

export const metadata: Metadata = withSocialMetadata({
  title: 'Infographics | PolicyWatcher',
  description: 'Interactive and downloadable maps of PolicyWatcher evidence, product and public-discovery surfaces.',
  alternates: { canonical: '/infographics' },
}, 'en');

export default function InfographicsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
