import type { Metadata } from 'next';
import LocalizedAssociationsPage, { buildAssociationsMetadata } from '@/app/associazioni/LocalizedAssociationsPage';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  return buildAssociationsMetadata('en');
}

export default function EnglishAssociationsPage() {
  return <LocalizedAssociationsPage lang="en" />;
}
