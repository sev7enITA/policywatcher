import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cancel Email Subscription | PolicyWatcher',
  robots: { index: false, follow: false, nocache: true },
};

export default function UnsubscribeLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
