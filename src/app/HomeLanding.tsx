'use client';

import Link from 'next/link';
import { POLICYWATCHER_VERSION } from '@/lib/release';
import { useState } from 'react';
import DashboardClient from './DashboardClient';
import PublicCompanyFinder from '@/components/PublicCompanyFinder';
import HomeKnowledgeSnapshot, { type HomeKnowledgeData } from '@/components/HomeKnowledgeSnapshot';
import { HOME_FAQS, HOME_FAQS_IT, HOME_NOTICE_COOKIE } from '@/lib/homeSeo';
import styles from './HomePage.module.css';

export default function HomeLanding({ initialLang, initiallyHidden, knowledge }: {
  initialLang: 'it' | 'en';
  initiallyHidden: boolean;
  knowledge: HomeKnowledgeData | null;
}) {
  const [lang, setLang] = useState(initialLang);
  const [noticeHidden, setNoticeHidden] = useState(initiallyHidden);
  const it = lang === 'it';
  const faqs = it ? HOME_FAQS_IT : HOME_FAQS;
  const local = (path: string) => it ? path + '?lang=it' : path;
  function setNotice(hidden: boolean) {
    setNoticeHidden(hidden);
    try {
      document.cookie = HOME_NOTICE_COOKIE + '=' + (hidden ? '1' : '') + '; Path=/; SameSite=Lax; Max-Age=' + (hidden ? 31536000 : 0);
    } catch { /* The control still works when browser storage is blocked. */ }
  }
  return <div lang={lang}>
        <main className={styles.publicKnowledgeMain}>
          <div className={styles.publicKnowledgeShell}>
            {!noticeHidden && <aside className={styles.enginePreviewNotice} aria-label={it ? 'Novità di Engine 6 Preview' : 'Engine 6 Preview news'}>
              <details className={styles.previewDetails}>
                <summary>{it ? 'Engine 6 Preview · Novità' : 'Engine 6 Preview · Research update'}</summary>
                <p>{it ? `Il servizio pubblico usa la versione stabile ${POLICYWATCHER_VERSION}. Il diario descrive le prove di estrazione. La preview r3 richiede un account amministratore.` : `The public service runs stable version ${POLICYWATCHER_VERSION}. The research diary covers the extraction trials. The r3 preview requires an administrator account.`}</p>
                <nav data-engine-diary aria-label={it ? 'Accesso alla preview e risultati' : 'Engine 6 Preview access and evidence'}>
                  <a href={it ? '/engine-6-preview?lang=it#validation' : '/engine-6-preview#validation'} hrefLang={lang} lang={lang}>{it ? 'Leggi i risultati' : 'Read the latest findings'}</a>
                  <Link href={local('/press-kit/releases/chatbot-policy-watch-5-6-0')}>{it ? 'Versione stabile 5.6' : 'Stable 5.6 release'}</Link>
                  <a href="https://staging.policywatcher.online/admin/engine">{it ? 'Apri la preview privata' : 'Open private preview'} ↗</a>
                  <Link href={local('/engine-6-preview')}>{it ? 'Architettura e prove' : 'Architecture and evidence'}</Link>
                  <a href="https://github.com/sev7enITA/policywatcher/wiki">{it ? 'Wiki su GitHub' : 'GitHub wiki'}</a>
                </nav>
              </details>
              <button type="button" className={styles.noticeControl} onClick={() => setNotice(true)}>{it ? 'Nascondi' : 'Hide'}</button>
            </aside>}
            <header className={styles.publicKnowledgeIntro}>
              <div>
                <p className={styles.eyebrow}>{it ? "PolicyWatcher · Osservatorio indipendente sulle policy" : "PolicyWatcher · Independent public evidence monitor"}</p>
                <h1>{it ? "Segui le modifiche a informative privacy, condizioni di servizio e regole sull’IA" : "Track updates to privacy policies, terms of service and AI policies"}</h1>
                <p className={styles.noticePrompt}>{it ? "Hai ricevuto un avviso di modifica? Parti da qui." : "Received a policy update? Start with the notice."}</p>
                <Link className={styles.noticeAction} href={local('/what-changed')}>{it ? "Verifica un avviso " : "Check a policy notice "}<span aria-hidden="true">→</span></Link>
              </div>
              <div className={styles.introBody}>
                <p>{it ? "Trova il documento per la tua area geografica, confronta le versioni registrate e consulta la fonte originale. Puoi distinguere la modifica al testo dal suo possibile impatto." : "Find the policy for your region, compare recorded versions and check the original source. Text changes and their possible impact are kept separate."}</p>
                <nav className={styles.introLinks} aria-label={it ? 'Risorse pubbliche di PolicyWatcher' : 'PolicyWatcher public references'}>
                  <Link href={it ? '/per-te' : '/per-te?lang=en'}>{it ? "Segui i tuoi servizi" : "Follow your services"}</Link>
                  <Link href={local('/briefing')}>{it ? "Prepara un riepilogo delle modifiche" : "Prepare a policy briefing"}</Link>
                  <Link href={local('/knowledge')}>{it ? "Consulta il catalogo pubblico" : "Browse public records"}</Link>
                  <Link href={local('/guides')}>{it ? "Esplora le guide al monitoraggio" : "Explore policy monitoring guides"}</Link>
                  <a href="#workspace">{it ? "Apri l’area di lavoro interattiva" : "Open the interactive workspace"}</a>
                  <Link href={local('/methodology/confidence')}>{it ? "Consulta il metodo" : "Read the methodology"}</Link>
                  <Link href={local('/live-dev-diary')}>Live Dev Diary</Link>
                  <Link href={local('/about')}>{it ? "Progetto e contatti" : "About and contact"}</Link>
                </nav>
              </div>
            </header>
            <noscript>
              <p className={styles.noScript}>{it ? "Il riepilogo pubblico e il catalogo sono consultabili anche senza JavaScript. Per usare l’area interattiva occorre attivarlo." : "The public evidence summary and knowledge base work without JavaScript. JavaScript is only required for the interactive monitoring workspace."}</p>
            </noscript>
            <PublicCompanyFinder lang={lang} companies={knowledge?.companies ?? []} unavailable={!knowledge} />
            <HomeKnowledgeSnapshot lang={lang} data={knowledge} />
            <section className={styles.faq} aria-labelledby="home-guides-title">
              <p className={styles.eyebrow}>{it ? "Parti dalla tua domanda" : "Start with your question"}</p>
              <h2 id="home-guides-title">{it ? "Come leggere il documento che è cambiato" : "Understand the policy behind the update."}</h2>
              <div className={styles.faqGrid}>
                <article><h3><Link href={local('/guides/privacy-policy-changes')}>{it ? "Cosa è cambiato nell’informativa privacy?" : "What changed in a privacy policy?"}</Link></h3><p>{it ? "Controlla la fonte, l’area geografica e le due versioni prima di interpretare una modifica all’uso dei dati." : "Check the source, region and two recorded versions before interpreting a change in data practices."}</p></article>
                <article><h3><Link href={local('/guides/ai-provider-policy-updates')}>{it ? "Come seguo le policy di un fornitore di IA?" : "How do I track an AI provider’s policies?"}</Link></h3><p>{it ? "Distingui condizioni del prodotto, uso consentito, privacy e trattamento dei dati." : "Distinguish product terms, acceptable use, privacy and data-processing documents."}</p></article>
                <article><h3><Link href={local('/guides/terms-of-service-monitoring')}>{it ? "Come confronto le condizioni di servizio?" : "How do I compare terms of service?"}</Link></h3><p>{it ? "Verifica le versioni, le date e le fonti prima di valutare gli effetti della revisione." : "Keep document versions, dates and evidence separate from the impact of a revision."}</p></article>
              </div>
              <p><Link href={local('/guides/data-processing-agreement-monitoring')}>{it ? "Consulta gli accordi sul trattamento dei dati" : "Review data processing agreements"}</Link> · <Link href={local('/guides')}>{it ? 'Tutte le guide' : 'All guides'}</Link></p>
            </section>
            <section className={styles.faq} id="governance-hub" aria-labelledby="home-governance-title">
              <h2 id="home-governance-title">{it ? "Un hub di governance, tre framework" : "One governance hub, three frameworks"}</h2>
              <p>{it
                ? "PolicyWatcher raccoglie dal basso le evidenze sulle modifiche alle policy. PALO definisce dall’alto autorità e passaggi decisionali. OnToGraPh è uno spin-off autonomo dei due. Nell’hub offre il livello ontologico riusabile che collega evidenze, dizionari, tassonomie, controlli versionati ed esiti osservati nelle applicazioni."
                : "PolicyWatcher supplies bottom-up evidence of policy changes. PALO sets top-down decision authority and review gates. OnToGraPh is their standalone spin-off. In the hub it provides the reusable ontology layer linking evidence, dictionaries, taxonomies, versioned controls and observed application outcomes."}</p>
              <p>{it
                ? "La versione di riferimento importa le evidenze offline. Il ritorno automatico degli esiti ai servizi live è oggetto di pilota."
                : "The reference imports evidence offline. Automated feedback to the live services is pilot work."}</p>
              <p><a href="https://www.fabriziodegni.com/OnToGraPh/#ecosystem">{it ? "Scopri il flusso dei tre framework" : "See the three-framework workflow"}</a></p>
            </section>

            <section className={styles.faq} aria-labelledby="home-faq-title">
              <p className={styles.eyebrow}>{it ? "Domande frequenti" : "Frequently asked questions"}</p>
              <h2 id="home-faq-title">{it ? "Come PolicyWatcher verifica e pubblica le modifiche" : "How PolicyWatcher handles public policy evidence"}</h2>
              <div className={styles.faqGrid}>
                {faqs.map((item) => (
                  <details className={styles.faqItem} key={item.question}>
                    <summary>{item.question}</summary>
                    <p>{item.answer}</p>
                  </details>
                ))}
              </div>
            </section>
            {noticeHidden && <button type="button" className={styles.restoreNotice} onClick={() => setNotice(false)}>{it ? 'Mostra l’avviso su Engine 6' : 'Show Engine 6 notice'}</button>}
          </div>
        </main>
    <div id="workspace"><DashboardClient lang={lang} setLang={setLang} /></div>
  </div>;
}
