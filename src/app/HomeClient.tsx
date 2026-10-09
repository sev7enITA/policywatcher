'use client';

import { useState } from 'react';
import Link from 'next/link';
import DashboardClient from './DashboardClient';
import GlobalContextControl from '@/components/GlobalContextControl';
import HomeKnowledgeSnapshot from '@/components/HomeKnowledgeSnapshot';
import { homeFaqs, homeStructuredData } from '@/lib/homeSeo';
import { localizedPublicPath } from '@/lib/seo';
import type { PublicKnowledgeHub } from '@/lib/publicKnowledge';
import type { PlatformLanguage } from '@/lib/globalContext';
import { POLICYWATCHER_VERSION } from '@/lib/release';
import styles from './HomePage.module.css';

/** SSR includes the entire public home; one language state also owns the workspace. */
export default function HomeClient({ knowledge, initialLanguage }: {
  knowledge: PublicKnowledgeHub | null;
  initialLanguage: PlatformLanguage;
}) {
  const [lang, setLang] = useState(initialLanguage);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeStructuredData(lang)).replace(/</g, '\\u003c') }}
      />
      <div data-policywatcher-release={POLICYWATCHER_VERSION}>
        <main className={styles.publicKnowledgeMain}>
          <div className={styles.publicKnowledgeShell}>
            <GlobalContextControl fallbackLang={lang} forcedLang={lang} />
            <header className={styles.publicKnowledgeIntro}>
              <div>
                <p className={styles.eyebrow}>{lang === 'it' ? "PolicyWatcher · Osservatorio indipendente di evidenze pubbliche" : "PolicyWatcher · Independent public evidence monitor"}</p>
                <h1>{lang === 'it' ? "Segui le modifiche a informative privacy, termini di servizio e policy AI" : "Track updates to privacy policies, terms of service and AI policies"}</h1>
              </div>
              <div className={styles.introBody}>
                <p>{lang === 'it' ? "Segui le policy pubbliche delle aziende attraverso versioni registrate, collegamenti alle fonti e confronti tra prima e dopo. Trova il documento applicabile alla tua area, verifica cosa è cambiato e distingui la revisione del testo dal suo possibile impatto." : "Follow public company policies with recorded versions, source links and before-and-after evidence. Find the document that applies to your region, inspect what changed and keep the difference between a text revision and its possible impact clear."}</p>
                <nav className={styles.introLinks} aria-label={lang === 'it' ? "Riferimenti pubblici di PolicyWatcher" : "PolicyWatcher public references"}>
                  <Link href="/knowledge">{lang === 'it' ? "Esplora i documenti pubblici" : "Browse public records"}</Link>
                  <Link href={localizedPublicPath('/guides', lang)}>{lang === 'it' ? "Esplora le guide al monitoraggio delle policy" : "Explore policy monitoring guides"}</Link>
                  <a href="#workspace">{lang === 'it' ? "Apri lo spazio di lavoro interattivo" : "Open the interactive workspace"}</a>
                  <Link href="/methodology/confidence">{lang === 'it' ? "Leggi la metodologia" : "Read the methodology"}</Link>
                  <Link href="/about">{lang === 'it' ? "Informazioni e contatti" : "About and contact"}</Link>
                </nav>
              </div>
            </header>
            <noscript>
              <p className={styles.noScript}>{lang === 'it' ? "Il riepilogo delle evidenze pubbliche e l’archivio sono disponibili anche senza JavaScript. JavaScript è necessario solo per lo spazio di lavoro interattivo." : "The public evidence summary and knowledge base work without JavaScript. JavaScript is only required for the interactive monitoring workspace."}</p>
            </noscript>
            <HomeKnowledgeSnapshot data={knowledge} lang={lang} />
            <section className={styles.faq} aria-labelledby="home-guides-title">
              <p className={styles.eyebrow}>{lang === 'it' ? "Parti dalla tua domanda" : "Start with your question"}</p>
              <h2 id="home-guides-title">{lang === 'it' ? "Comprendi la policy dietro ogni aggiornamento." : "Understand the policy behind the update."}</h2>
              <div className={styles.faqGrid}>
                <article><h3><Link href={localizedPublicPath('/guides/privacy-policy-changes', lang)}>{lang === 'it' ? "Cosa è cambiato in un’informativa privacy?" : "What changed in a privacy policy?"}</Link></h3><p>{lang === 'it' ? "Controlla la fonte, l’area geografica e le due versioni registrate prima di interpretare una modifica al trattamento dei dati." : "Check the source, region and two recorded versions before interpreting a change in data practices."}</p></article>
                <article><h3><Link href={localizedPublicPath('/guides/ai-provider-policy-updates', lang)}>{lang === 'it' ? "Come seguire le policy di un fornitore di AI?" : "How do I track an AI provider’s policies?"}</Link></h3><p>{lang === 'it' ? "Distingui termini di prodotto, uso accettabile, privacy e documenti sul trattamento dei dati." : "Distinguish product terms, acceptable use, privacy and data-processing documents."}</p></article>
                <article><h3><Link href={localizedPublicPath('/guides/terms-of-service-monitoring', lang)}>{lang === 'it' ? "Come confrontare i termini di servizio?" : "How do I compare terms of service?"}</Link></h3><p>{lang === 'it' ? "Distingui le versioni dei documenti, le date e le evidenze dall’impatto di una revisione." : "Keep document versions, dates and evidence separate from the impact of a revision."}</p></article>
              </div>
              <p><Link href={localizedPublicPath('/guides/data-processing-agreement-monitoring', lang)}>{lang === 'it' ? "Esamina gli accordi sul trattamento dei dati" : "Review data processing agreements"}</Link></p>
            </section>
            <section className={styles.faq} aria-labelledby="home-faq-title">
              <p className={styles.eyebrow}>{lang === 'it' ? "Domande frequenti" : "Frequently asked questions"}</p>
              <h2 id="home-faq-title">{lang === 'it' ? "Come PolicyWatcher gestisce le evidenze sulle policy pubbliche" : "How PolicyWatcher handles public policy evidence"}</h2>
              <div className={styles.faqGrid}>
                {homeFaqs(lang).map((item) => (
                  <article key={item.question}>
                    <h3>{item.question}</h3>
                    <p>{item.answer}</p>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </main>
        <div id="workspace"><DashboardClient initialLanguage={initialLanguage} onLanguageChange={setLang} /></div>
      </div>
    </>
  );
}
