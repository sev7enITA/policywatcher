import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PolicyWatcher Infographics',
  description: 'Interactive and downloadable maps of PolicyWatcher evidence, product and public-discovery surfaces.',
  alternates: { canonical: '/infographics' },
};

export default function InfographicsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
