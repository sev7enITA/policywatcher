import { withSocialMetadata } from '@/lib/seo';
import type { Metadata } from 'next';
import TermsPageClient from './TermsPageClient';

export const metadata: Metadata = withSocialMetadata({
  title: 'Terms of Use | PolicyWatcher',
  description: 'PolicyWatcher use boundaries, responsible interpretation guidance and local acknowledgement details.',
  alternates: { canonical: '/terms' },
}, 'en');

export default function TermsPage() {
  return <TermsPageClient />;
}
