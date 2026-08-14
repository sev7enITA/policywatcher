import type { Metadata } from 'next';
import BrowserExtensionClient from './BrowserExtensionClient';
import { getBrowserExtensionStoreLinks } from '@/lib/browserExtensionStores';

export const metadata: Metadata = {
  title: 'Browser extension | PolicyWatcher',
  description: 'Capture policy-update notification clues and real policy links locally, then verify them against PolicyWatcher evidence.',
  alternates: { canonical: '/browser-extension' },
};

export default function BrowserExtensionPage() {
  return <BrowserExtensionClient storeLinks={getBrowserExtensionStoreLinks()} />;
}
