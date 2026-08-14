import type { Metadata } from 'next';
import TermsPageClient from './TermsPageClient';

export const metadata: Metadata = {
  title: 'Terms of Use | PolicyWatcher',
  description: 'PolicyWatcher use boundaries, responsible interpretation guidance and local acknowledgement details.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return <TermsPageClient />;
}
