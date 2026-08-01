import type { Metadata } from 'next';
import Script from 'next/script';
import ContractReviewClient from './ContractReviewClient';

export const metadata: Metadata = {
  title: 'Contract Evidence Review | PolicyWatcher',
  description: 'Word task pane for locally classifying selected contract text and finding related public PolicyWatcher evidence.',
  robots: { index: false, follow: false },
};

export default function ContractReviewPage() {
  return (
    <>
      <Script src="https://appsforoffice.microsoft.com/lib/1/hosted/office.js" strategy="afterInteractive" />
      <ContractReviewClient />
    </>
  );
}
