import type { Metadata } from 'next';
import PulseIndexClient from '@/components/pulse/PulseIndexClient';
import { PULSE_CANONICAL_URL } from '@/lib/editorialPulse';

export const metadata: Metadata = {
  title: 'PolicyWatcher Pulse | Verified story leads',
  description: 'Human-approved story leads with dated evidence, source links, reuse boundaries and versioned editorial assets.',
  alternates: { canonical: PULSE_CANONICAL_URL },
  openGraph: { title: 'PolicyWatcher Pulse', description: 'Verified story leads with the evidence attached.', url: PULSE_CANONICAL_URL, type: 'website', images: [{ url: 'https://policywatcher.online/api/og/pulse', width: 1200, height: 630, alt: 'PolicyWatcher Pulse editorial story leads' }] },
  twitter: { card: 'summary_large_image', title: 'PolicyWatcher Pulse', description: 'Verified story leads with the evidence attached.', images: ['https://policywatcher.online/api/og/pulse'] },
};

export default function PulsePage() {
  return <PulseIndexClient />;
}
