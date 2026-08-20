import type { Metadata } from 'next';
import WhatChangedClient from './WhatChangedClient';

export const metadata: Metadata = {
  title: 'Policy notice verification | PolicyWatcher',
  description: 'Use a policy-update notification to query published evidence or register a human-review request.',
  alternates: { canonical: '/what-changed' },
};

export default function WhatChangedPage() {
  return <WhatChangedClient />;
}
