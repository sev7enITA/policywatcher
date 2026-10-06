import type { Metadata } from 'next';
import { withSocialMetadata } from '@/lib/seo';
import CitizenClient from './CitizenClient';

type Props = { searchParams: Promise<{ lang?: string }> };
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const en = (await searchParams).lang === 'en';
  return withSocialMetadata({
    title: en ? 'Your services, your choices | PolicyWatcher' : 'I tuoi servizi, le tue scelte | PolicyWatcher',
    description: en ? 'Follow the services you use, understand published policy changes and keep your choices on your device.' : 'Segui i servizi che usi, comprendi le modifiche pubblicate e conserva le tue scelte sul dispositivo.',
    alternates: { canonical: en ? '/per-te?lang=en' : '/per-te', languages: { it: '/per-te', en: '/per-te?lang=en', 'x-default': '/per-te' } },
  }, en ? 'en' : 'it');
}
export default async function CitizenPage({ searchParams }: Props) {
  return <CitizenClient locale={(await searchParams).lang === 'en' ? 'en' : 'it'} />;
}
