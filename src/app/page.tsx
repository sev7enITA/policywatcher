import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import DashboardClient from './DashboardClient';
import HomeKnowledgeSnapshot from '@/components/HomeKnowledgeSnapshot';
import {
  HOME_CANONICAL_URL,
  HOME_DESCRIPTION,
  HOME_FAQS,
  HOME_SOCIAL_IMAGE_URL,
  HOME_STRUCTURED_DATA,
  HOME_TITLE,
} from '@/lib/homeSeo';
import { getPublicKnowledgeHub, serializeJsonLd, type PublicKnowledgeHub } from '@/lib/publicKnowledge';
import { POLICYWATCHER_VERSION } from '@/lib/release';
import styles from './HomePage.module.css';

export const metadata: Metadata = {
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  alternates: { canonical: HOME_CANONICAL_URL },
  openGraph: {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    url: HOME_CANONICAL_URL,
    siteName: 'PolicyWatcher',
    locale: 'en_US',
    type: 'website',
    images: [{
      url: HOME_SOCIAL_IMAGE_URL,
      width: 1200,
      height: 630,
      alt: 'PolicyWatcher public policy evidence monitor',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    images: [HOME_SOCIAL_IMAGE_URL],
  },
};

export const dynamic = 'force-dynamic';

async function HomeKnowledgeSnapshotLoader() {
  let knowledge: PublicKnowledgeHub | null = null;
  try {
    knowledge = await getPublicKnowledgeHub();
  } catch (error) {
    console.error('[Home] Public knowledge snapshot temporarily unavailable:', error);
  }

  return <HomeKnowledgeSnapshot data={knowledge} />;
}

function HomeKnowledgeLoading() {
  return (
    <section className={styles.publicKnowledgeLoading} aria-label="Public knowledge loading">
      <div>
        <strong>Verified public records</strong>
        <p>Current evidence counts are loading. The server-rendered knowledge base remains directly available.</p>
      </div>
      <Link href="/knowledge">Open knowledge base</Link>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(HOME_STRUCTURED_DATA) }}
      />
      <div data-policywatcher-release={POLICYWATCHER_VERSION}>
        <main className={styles.publicKnowledgeMain}>
          <div className={styles.publicKnowledgeShell}>
            <header className={styles.publicKnowledgeIntro}>
              <div>
                <p className={styles.eyebrow}>Independent public evidence monitor</p>
                <h1>Track verified changes to public company policies</h1>
              </div>
              <div className={styles.introBody}>
                <p>PolicyWatcher records public policy sources, verified baselines and published changes with direct links to their evidence. Automated screening supports review; it is not legal advice or a compliance determination.</p>
                <nav className={styles.introLinks} aria-label="PolicyWatcher public references">
                  <Link href="/knowledge">Browse public records</Link>
                  <Link href="/methodology/confidence">Read the methodology</Link>
                  <Link href="/about">About and contact</Link>
                </nav>
              </div>
            </header>
            <noscript>
              <p className={styles.noScript}>The public evidence summary and knowledge base work without JavaScript. JavaScript is only required for the interactive monitoring workspace.</p>
            </noscript>
            <Suspense fallback={<HomeKnowledgeLoading />}>
              <HomeKnowledgeSnapshotLoader />
            </Suspense>
            <section className={styles.faq} aria-labelledby="home-faq-title">
              <p className={styles.eyebrow}>Frequently asked questions</p>
              <h2 id="home-faq-title">How PolicyWatcher handles public policy evidence</h2>
              <div className={styles.faqGrid}>
                {HOME_FAQS.map((item) => (
                  <article key={item.question}>
                    <h3>{item.question}</h3>
                    <p>{item.answer}</p>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </main>
        <DashboardClient />
      </div>
    </>
  );
}
