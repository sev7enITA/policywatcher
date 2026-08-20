import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Confirm Email Subscription | PolicyWatcher',
  robots: { index: false, follow: false, nocache: true },
  referrer: 'no-referrer',
};

export default function ConfirmSubscriptionLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
