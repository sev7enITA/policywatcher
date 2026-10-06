import { withSocialMetadata } from '@/lib/seo';
import type { Metadata } from 'next';
import FeatureAtlasClient from './FeatureAtlasClient';

export const metadata: Metadata = withSocialMetadata({
  title: 'Feature atlas | PolicyWatcher',
  description:
    'PolicyWatcher capability directory with dependencies, inventory KPIs, residual KRIs, implementation references and delivery status.',
  alternates: { canonical: '/feature-atlas' },
}, 'en');

export default function FeatureAtlasPage() {
  return <FeatureAtlasClient />;
}
