import type { Metadata } from 'next';
import LocalizedAssociationsPage, { buildAssociationsMetadata } from '@/app/associazioni/LocalizedAssociationsPage';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  return buildAssociationsMetadata('it');
}

export default function ItalianAssociationsPage() {
  return <LocalizedAssociationsPage lang="it" />;
}
