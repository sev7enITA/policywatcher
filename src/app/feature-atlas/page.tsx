import type { Metadata } from 'next';
import FeatureAtlasClient from './FeatureAtlasClient';

export const metadata: Metadata = {
  title: 'Feature Intelligence Atlas | PolicyWatcher',
  description:
    'Explore PolicyWatcher capabilities as an operational evidence constellation with dependencies, qualitative inventory KPIs, residual KRIs, implementation proof and delivery horizons.',
  alternates: { canonical: '/feature-atlas' },
};

export default function FeatureAtlasPage() {
  return <FeatureAtlasClient />;
}
