/**
 * PolicyWatcher - Root Layout
 *
 * @file src/app/layout.tsx
 *
 * Next.js root layout component. Sets up the HTML document shell,
 * loads the Titillium Web font (sans + display variants via Google Fonts),
 * injects the global CSS, and defines page-level metadata for SEO.
 *
 * All pages in the application inherit this layout.
 */
import type { Metadata } from 'next';
import { Titillium_Web } from 'next/font/google';
import './globals.css';

/** Primary body font — Titillium Web in regular weights. */
const titilliumSans = Titillium_Web({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['300', '400', '600', '700'],
});

/** Display / heading font — Titillium Web in heavier weights. */
const titilliumDisplay = Titillium_Web({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['600', '700', '900'],
});

/** Site-wide metadata: title, description, keywords, author, and icons. */
export const metadata: Metadata = {
  title: 'PolicyWatcher - AI Regulatory Compliance Monitor',
  description: 'Monitor, compare, and analyze the impact of Tech and FinTech company policies and terms of service over time with Google Gemini AI. Multi-region, multi-jurisdiction compliance tracking.',
  keywords: ['policy monitoring', 'compliance', 'GDPR', 'AI governance', 'FinTech', 'privacy policy', 'terms of service'],
  authors: [{ name: 'Fabrizio Degni' }],
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

/**
 * Root layout component wrapping all pages.
 *
 * Applies the Titillium Web CSS variables to the `<html>` element so that
 * both `--font-sans` and `--font-display` are available throughout the app.
 *
 * @param props.children - The page content rendered by Next.js routing.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${titilliumSans.variable} ${titilliumDisplay.variable}`}>
      <body>
        {children}
      </body>
    </html>
  );
}
