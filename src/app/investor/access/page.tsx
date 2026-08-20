import type { Metadata } from 'next';
import { unstable_noStore as noStore } from 'next/cache';
import InvestorAccessClient from './InvestorAccessClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export const metadata: Metadata = {
  title: 'Investor data room access | PolicyWatcher',
  referrer: 'no-referrer',
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nocache: true,
    googleBot: { index: false, follow: false, noarchive: true, noimageindex: true },
  },
};

export default function InvestorAccessPage() {
  noStore();
  return <InvestorAccessClient />;
}
