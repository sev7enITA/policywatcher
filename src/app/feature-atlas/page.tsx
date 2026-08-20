import type { Metadata } from 'next';
import FeatureAtlasClient from './FeatureAtlasClient';

export const metadata: Metadata = {
  title: 'Feature atlas | PolicyWatcher',
  description:
    'PolicyWatcher capability directory with dependencies, inventory KPIs, residual KRIs, implementation references and delivery status.',
  alternates: { canonical: '/feature-atlas' },
};

export default function FeatureAtlasPage() {
  return <FeatureAtlasClient />;
}
