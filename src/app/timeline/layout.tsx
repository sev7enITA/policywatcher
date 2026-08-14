import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Policy Change Timeline | PolicyWatcher',
  description: 'Chronological public policy-change evidence with source, confidence and regional context.',
  alternates: { canonical: '/timeline' },
};

export default function TimelineLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
