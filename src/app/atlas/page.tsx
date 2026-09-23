import { withSocialMetadata } from '@/lib/seo';
import type { Metadata } from 'next';
import SiteAtlasClient from './SiteAtlasClient';

export const metadata: Metadata = withSocialMetadata({
  title: 'Site map | PolicyWatcher',
  description:
    'PolicyWatcher route graph with public sections, evidence views, quality controls, methodology and protected operations.',
  alternates: { canonical: '/atlas' },
}, 'en');

export default function AtlasPage() {
  return <SiteAtlasClient />;
}
