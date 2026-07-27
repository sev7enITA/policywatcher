import type { Metadata } from 'next';
import WhatChangedClient from './WhatChangedClient';

export const metadata: Metadata = {
  title: 'What changed? | PolicyWatcher',
  description: 'Use a policy-update notification to query published evidence or register a human-review request.',
};

export default function WhatChangedPage() {
  return <WhatChangedClient />;
}
