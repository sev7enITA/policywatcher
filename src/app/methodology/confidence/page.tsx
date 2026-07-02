'use client';

/**
 * @file page.tsx (Methodology & Confidence)
 *
 * Public bilingual page explaining PolicyWatcher's Truth & Confidence Framework,
 * double-checking ingestion cascade, AI constraints, and known limitations.
 * Exposes the GRC/auditing telemetry logic to ensure transparency and accountability.
 */
import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ShieldCheck,
  Activity,
  History,
  FileWarning,
  Eye,
  BookOpen,
  Scale,
  Cpu,
  RefreshCw,
  Database
} from 'lucide-react';
import styles from './confidence.module.css';
import Footer from '@/components/Footer';

const translationContent = {
  en: {
    backHome: 'Back to Dashboard',
    tag: 'Auditing Framework',
    title: 'Truth & Confidence Methodology',
    subtitle: 'PolicyWatcher’s operational framework for data provenance, AI constraints, and forensic review accountability.',
    intro: 'GRC and AI Governance require evidence-first verification. This page outlines exactly how PolicyWatcher ingests data, maps changes, controls AI processing, and exposes limitations.',
    
    // Toggles
    langLabel: 'Interfaccia in Italiano',
    
    // Cards / Sections
    sections: [
      {
        icon: Scale,
        title: '1. Informational Mapping (Non-Certification)',
        desc: 'PolicyWatcher is a tracking and mapping tool, not a compliance certification body. The data presented on this platform:',
        bullets: [
          'Evaluates public disclosures and terms of service text, not internal company operations.',
          'Does NOT certify that a company complies with its policies, or that the policies comply with applicable laws.',
          'Must not be treated as legal advice, formal auditing, or compliance validation.',
          'Is intended for risk screening, benchmarking, and policy lifecycle tracking.'
        ]
      },
      {
        icon: RefreshCw,
        title: '2. Double-Checking Ingestion Cascade',
        desc: 'To prevent data fabrication and ensure maximum freshness, the ingestion pipeline utilizes a prioritized cascade:',
        bullets: [
          'Primary Source: Direct HTTP scraping of the configured official policy URL.',
          'Secondary Fallback: If direct scraping is blocked (e.g., bot protection or cloudflare challenges), the pipeline attempts to pull from the Wayback Machine API or cached mirrors.',
          'Honest Failure Recording: If a page remains unreachable, the system does NOT reuse stale data blindly. It updates the database with a status of "Unavailable" or "Needs Review" and logs the check date.',
          'Immutability: Stored texts are fingerprinted via SHA-256 hash checks to guarantee they have not been altered after ingestion.'
        ]
      },
      {
        icon: Cpu,
        title: '3. AI Analysis & LLM Constraints',
        desc: 'Automated reviews are processed using Google Gemini models. To prevent hallucination and ensure auditability, the AI is subject to strict engineering constraints:',
        bullets: [
          'Direct Grounding: Summaries and bullet points are generated only from the ingested text snapshot.',
          'No Fabrication: The models are strictly instructed to return "Not Specified" or "Unavailable" for fields or KPIs not present in the document.',
          'Structured Mapping: Categorizations are verified against a schema to ensure that risk classifications align strictly with the 15 comparative KPIs.',
          'Audit trail: Every AI analysis is linked directly to the specific policy snapshots (old vs. new) from which it was generated.'
        ]
      },
      {
        icon: Eye,
        title: '4. Traceability Controls & Evidence',
        desc: 'Confidence is built on evidence, not trust. PolicyWatcher exposes the following forensic elements in the UI:',
        bullets: [
          'Configured URL: Direct link to the source document monitored.',
          'Ingestion Method: Verification of whether the file was Seeded, Direct Scraped, or Cached.',
          'Scans Timestamps: Both the Last Checked and Last Successful Fetch times are visible for every policy.',
          'Prisma History Logs: Check histories and version changes are kept as an append-only snapshot timeline.'
        ]
      },
      {
        icon: FileWarning,
        title: '5. Known Limitations & Risks',
        desc: 'Users and legal teams must be aware of the following platform boundaries:',
        bullets: [
          'Scraping Latency: Policies are monitored on a recurring schedule. Real-time updates may lag slightly behind live company releases.',
          'LLM Context Limitations: Large documents containing hundreds of pages are analyzed block-by-block, which could miss highly specific clauses in unrelated sections.',
          'Legal Interpretation: Legal terms can be ambiguous. The risk score represents an automated assessment based on best-practice AI governance matrices, not a court-validated analysis.'
        ]
      }
    ],

    // Footer notice
    disclaimerTitle: 'Verification Required',
    disclaimerText: 'Always verify policy states against official source documents. Corporate counsel and GRC directors must conduct independent human reviews before drawing legal compliance conclusions.'
  },
  it: {
    backHome: 'Torna alla Dashboard',
    tag: 'Framework di Controllo',
    title: 'Metodologia della Veridicità e Fiducia',
    subtitle: 'Il framework operativo di PolicyWatcher per la provenienza dei dati, i vincoli dell\'IA e la tracciabilità delle revisioni.',
    intro: 'La governance GRC e dell\'IA richiede una verifica basata sulle evidenze. Questa pagina descrive come PolicyWatcher raccoglie i dati, mappa le modifiche, controlla l\'elaborazione dell\'IA ed espone le limitazioni.',
    
    // Toggles
    langLabel: 'English Interface',
    
    // Cards / Sections
    sections: [
      {
        icon: Scale,
        title: '1. Mappatura Informativa (Nessuna Certificazione)',
        desc: 'PolicyWatcher è uno strumento di tracciamento e mappatura, non un ente di certificazione della conformità. I dati presenti sulla piattaforma:',
        bullets: [
          'Valutano esclusivamente il testo delle policy pubbliche, non le operazioni interne dell\'azienda.',
          'NON certificano che un\'azienda rispetti le proprie policy, né che le policy siano conformi alle leggi vigenti.',
          'Non devono essere considerati consulenza legale, auditing formale o validazione di conformità.',
          'Sono destinati esclusivamente allo screening dei rischi, al benchmarking e al tracciamento del ciclo di vita delle policy.'
        ]
      },
      {
        icon: RefreshCw,
        title: '2. Ingestione a Cascata con Doppio Controllo',
        desc: 'Per prevenire la fabbricazione di dati e garantire la massima freschezza, il sistema utilizza una cascata di recupero:',
        bullets: [
          'Fonte Primaria: Scraping HTTP diretto dell\'URL della policy ufficiale configurata.',
          'Fallback Secondario: Se lo scraping diretto è bloccato (es. bot protection), il sistema tenta di estrarre i dati dalle API della Wayback Machine o mirror di cache.',
          'Registrazione degli Errori: Se una pagina risulta irraggiungibile, il sistema NON riutilizza dati obsoleti alla cieca. Aggiorna il database impostando lo stato su "Unavailable" o "Needs Review" e registra la data del controllo.',
          'Immutabilità: I testi memorizzati sono firmati tramite hash SHA-256 per garantire che non vengano alterati dopo l\'ingestione.'
        ]
      },
      {
        icon: Cpu,
        title: '3. Analisi IA e Limiti dei Modelli (LLM)',
        desc: 'Le analisi automatiche sono elaborate con modelli Google Gemini. Per evitare allucinazioni e garantire la verificabilità, l\'IA è soggetta a rigidi vincoli:',
        bullets: [
          'Ancoraggio Diretto: I riassunti e i punti chiave sono generati esclusivamente a partire dal testo della policy acquisito.',
          'Nessuna Invenzione: I modelli sono programmati per restituire "Non specificato" o "Non disponibile" per i campi non presenti nei documenti.',
          'Mappatura Strutturata: Le categorizzazioni sono verificate rispetto a uno schema per garantire che i rischi si allineino esattamente ai 15 KPI comparativi.',
          'Audit trail: Ogni analisi dell\'IA è collegata direttamente allo snapshot specifico della policy (vecchia vs nuova) da cui è stata prodotta.'
        ]
      },
      {
        icon: Eye,
        title: '4. Controlli di Tracciabilità ed Evidenze',
        desc: 'La fiducia si basa sulle prove. PolicyWatcher espone i seguenti elementi forensi direttamente nell\'interfaccia:',
        bullets: [
          'URL Configurato: Link diretto al documento sorgente monitorato.',
          'Metodo di Ingestione: Indicazione se il file proviene da Seeded, Direct Scraped o Wayback Cache.',
          'Timestamp Scansioni: Visibilità delle date di Ultimo Controllo e Ultimo Check Riuscito per ogni policy.',
          'Storici Prisma: I log dei controlli e delle variazioni di versione sono salvati in una timeline di snapshot di sola aggiunta.'
        ]
      },
      {
        icon: FileWarning,
        title: '5. Limitazioni Noto e Rischi',
        desc: 'Gli utenti e i team legali devono essere consapevoli dei seguenti limiti dello strumento:',
        bullets: [
          'Latenza dello Scraping: Le policy sono monitorate a intervalli periodici. Gli aggiornamenti in tempo reale potrebbero subire lievi ritardi rispetto ai rilasci live.',
          'Limiti di Contesto LLM: I documenti molto ampi di centinaia di pagine vengono analizzati a blocchi, il che potrebbe tralasciare clausole molto specifiche in sezioni isolate.',
          'Interpretazione Giuridica: I termini legali possono essere ambigui. Il punteggio di rischio rappresenta una valutazione automatizzata basata su matrici di governance IA, non un\'analisi con valore legale.'
        ]
      }
    ],

    // Footer notice
    disclaimerTitle: 'Verifica Necessaria',
    disclaimerText: 'Verificare sempre lo stato delle policy con i documenti originali ufficiali. I responsabili legali e i direttori GRC devono effettuare controlli manuali indipendenti prima di trarre conclusioni di conformità.'
  }
};

export default function MethodologyConfidence() {
  const [lang, setLang] = useState<'en' | 'it'>('en');
  const t = translationContent[lang];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Link href="/" className={styles.backBtn}>
            <ArrowLeft size={16} />
            <span>{t.backHome}</span>
          </Link>
          <button 
            onClick={() => setLang((l) => (l === 'en' ? 'it' : 'en'))}
            className={styles.langToggle}
          >
            {t.langLabel}
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.heroSection}>
          <div className={styles.tagRow}>
            <ShieldCheck size={16} className={styles.tagIcon} />
            <span>{t.tag}</span>
          </div>
          <h1 className={styles.title}>{t.title}</h1>
          <p className={styles.subtitle}>{t.subtitle}</p>
          <div className={styles.introBox}>
            <p>{t.intro}</p>
          </div>
        </div>

        <div className={styles.sectionsGrid}>
          {t.sections.map((section, idx) => {
            const Icon = section.icon;
            return (
              <div key={idx} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.iconContainer}>
                    <Icon size={20} />
                  </div>
                  <h2>{section.title}</h2>
                </div>
                <p className={styles.cardDesc}>{section.desc}</p>
                <ul className={styles.bulletList}>
                  {section.bullets.map((bullet, bIdx) => (
                    <li key={bIdx}>{bullet}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className={styles.disclaimerPanel}>
          <div className={styles.disclaimerHeader}>
            <FileWarning size={20} />
            <h3>{t.disclaimerTitle}</h3>
          </div>
          <p>{t.disclaimerText}</p>
        </div>
      </main>

      <Footer lang={lang} />
    </div>
  );
}
