import { withSocialMetadata } from '@/lib/seo';
import type { Metadata } from 'next';
import Link from 'next/link';
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

export const metadata: Metadata = withSocialMetadata({
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
}, 'en');

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let knowledge: PublicKnowledgeHub | null = null;
  try { knowledge = await getPublicKnowledgeHub(); }
  catch (error) { console.error('[Home] Public knowledge snapshot temporarily unavailable:', error); }
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
                <p className={styles.eyebrow}>PolicyWatcher · Independent public evidence monitor</p>
                <h1>Track updates to privacy policies, terms of service and AI policies</h1>
              </div>
              <div className={styles.introBody}>
                <p>Follow public company policies with recorded versions, source links and before-and-after evidence. Find the document that applies to your region, inspect what changed and keep the difference between a text revision and its possible impact clear.</p>
                <nav className={styles.introLinks} aria-label="PolicyWatcher public references">
                  <Link href="/knowledge">Browse public records</Link>
                  <Link href="/guides">Explore policy monitoring guides</Link>
                  <a href="#workspace">Open the interactive workspace</a>
                  <Link href="/methodology/confidence">Read the methodology</Link>
                  <Link href="/about">About and contact</Link>
                </nav>
              </div>
            </header>
            <noscript>
              <p className={styles.noScript}>The public evidence summary and knowledge base work without JavaScript. JavaScript is only required for the interactive monitoring workspace.</p>
            </noscript>
            <HomeKnowledgeSnapshot data={knowledge} />
            <section className={styles.faq} aria-labelledby="home-guides-title">
              <p className={styles.eyebrow}>Start with your question</p>
              <h2 id="home-guides-title">Understand the policy behind the update.</h2>
              <div className={styles.faqGrid}>
                <article><h3><Link href="/guides/privacy-policy-changes">What changed in a privacy policy?</Link></h3><p>Check the source, region and two recorded versions before interpreting a change in data practices.</p></article>
                <article><h3><Link href="/guides/ai-provider-policy-updates">How do I track an AI provider’s policies?</Link></h3><p>Distinguish product terms, acceptable use, privacy and data-processing documents.</p></article>
                <article><h3><Link href="/guides/terms-of-service-monitoring">How do I compare terms of service?</Link></h3><p>Keep document versions, dates and evidence separate from the impact of a revision.</p></article>
              </div>
              <p><Link href="/guides/data-processing-agreement-monitoring">Review data processing agreements</Link> · <Link href="/guides?lang=it" hrefLang="it">Guide in italiano</Link></p>
            </section>
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
        <div id="workspace"><DashboardClient /></div>
      </div>
    </>
  );
}
