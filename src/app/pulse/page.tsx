import { withSocialMetadata } from '@/lib/seo';
import type { Metadata } from 'next';
import PulseIndexClient from '@/components/pulse/PulseIndexClient';
import { PULSE_CANONICAL_URL } from '@/lib/editorialPulse';

export const metadata: Metadata = withSocialMetadata({
  title: 'PolicyWatcher Pulse | Editorial lead registry',
  description: 'Verified editorial leads with cited sources.',
  alternates: { canonical: PULSE_CANONICAL_URL },
  openGraph: { title: 'PolicyWatcher Pulse', description: 'Verified editorial leads with cited sources.', url: PULSE_CANONICAL_URL, type: 'website', images: [{ url: 'https://policywatcher.online/api/og/pulse', width: 1200, height: 630, alt: 'PolicyWatcher Pulse editorial story leads' }] },
  twitter: { card: 'summary_large_image', title: 'PolicyWatcher Pulse', description: 'Verified editorial leads with cited sources.', images: ['https://policywatcher.online/api/og/pulse'] },
}, 'en');

export default function PulsePage() {
  return <PulseIndexClient />;
}
