import type { Metadata } from 'next';
import WhatChangedClient from './WhatChangedClient';

export const metadata: Metadata = {
  title: 'What changed? | PolicyWatcher',
  description: 'Turn a policy-update notification into source-verified evidence or a human-review request.',
};

export default function WhatChangedPage() {
  return <WhatChangedClient />;
}
