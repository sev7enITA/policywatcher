import type { Metadata } from 'next';
import SiteAtlasClient from './SiteAtlasClient';

export const metadata: Metadata = {
  title: 'PolicyWatcher Site Atlas',
  description:
    'Interactive entity-relationship sitemap for PolicyWatcher public sections, evidence views, trust surfaces, methodology, roadmap and protected operations boundary.',
};

export default function AtlasPage() {
  return <SiteAtlasClient />;
}
