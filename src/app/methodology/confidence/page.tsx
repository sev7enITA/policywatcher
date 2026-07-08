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
  FileWarning,
  Eye,
  Scale,
  Cpu,
  RefreshCw,
} from 'lucide-react';
import styles from './confidence.module.css';
import Footer from '@/components/Footer';

const translationContent = {
  en: {
    backHome: 'Back to Dashboard',
    tag: 'Auditing Framework',
    title: 'Truth & Confidence Methodology',
    subtitle: 'PolicyWatcher’s operational framework for data provenance, AI constraints, check history, and review accountability.',
    intro: 'GRC and AI Governance work requires evidence-first verification. This page explains how PolicyWatcher records configured sources, maps changes, constrains AI processing, and exposes limitations.',
    
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
        desc: 'To avoid fabricated data and expose source failures clearly, the ingestion pipeline uses a prioritized retrieval cascade:',
        bullets: [
          'Primary source: direct HTTP retrieval of the configured policy URL with browser-like headers, redirect validation, retries, and timeout limits.',
          'Protocol fallback: explicit HTTP/2 retrieval is attempted for providers that reject HTTP/1.1 or return short SPA shells.',
          'Rendered fallback: when configured, a separate VPS renderer executes a headless browser fetch for script-rendered pages. It is protected by bearer auth and validates initial URLs, redirects, and subresource requests against SSRF rules.',
          'Archive fallback: if live retrieval fails, the pipeline may try Wayback Machine and Common Crawl snapshots where available.',
          'Freshness guard: archived snapshots older than the last successful check are rejected so an old cached copy cannot be registered as a new policy change.',
          'Strategy diagnostics: each retrieval attempt records the strategy used, outcome, HTTP status where available, rejection/failure reason, and whether the system escalated to the next fallback.',
          'Host-drift guard: live redirects to a different host are marked for review instead of being accepted as baseline evidence.',
          'Path-drift guard: configured policy URLs that resolve to a same-host homepage or non-policy landing page are rejected instead of becoming baseline evidence.',
          'Completeness guard: over-cap extraction is marked Partial and suspended from public evidence instead of being stored as a complete policy text.',
          'Batch execution: administrative scans can be limited by company slug or policy count so the first source-verification run can be resumed safely on shared hosting.',
          'Honest failure recording: if a page remains unreachable, the system does not create a successful version record from missing data. It updates the policy status to "Unavailable" or "Needs Review" and writes a check-log row.',
          'Hash fingerprinting: retrieved text records are fingerprinted with SHA-256 so later integrity checks can detect mismatches between text and hash.'
        ]
      },
      {
        icon: Cpu,
        title: '3. AI Analysis & LLM Constraints',
        desc: 'Automated reviews are processed using Google Gemini models. To prevent hallucination and ensure auditability, the AI is subject to strict engineering constraints:',
        bullets: [
          'Direct grounding: summaries and bullet points are generated from the retrieved/versioned text record being analysed.',
          'No unsupported filling: prompts instruct the model to return "Not Specified" or "Unavailable" when the document does not support a field or KPI.',
          'Structured mapping: categorisations are normalized against the expected analysis fields used by PolicyWatcher.',
          'Audit trail: Every AI analysis is linked directly to the specific policy version records (old vs. new) from which it was generated.'
        ]
      },
      {
        icon: Eye,
        title: '4. Traceability Controls & Evidence',
        desc: 'Confidence is built on evidence, not trust. PolicyWatcher exposes the following forensic elements in the UI:',
        bullets: [
          'Configured URL: Direct link to the source document monitored.',
          'Ingestion method: indication of whether the current record was seeded, directly retrieved, fetched via HTTP/2, rendered through the VPS service, or recovered through an archive source.',
          'Scan timestamps: both the Last Checked and Last Successful Fetch times are visible for every policy.',
          'Check logs: each scan result can be recorded with status, source, HTTP status, reason, final URL, hash, text length, and archive snapshot timestamp when an archive source is used.',
          'Public-evidence gate: policy snapshots and change records must be explicitly marked as public evidence before public APIs, sitemap, digests, reports, share pages, timelines, or benchmark views can expose them.',
          'Policy Signals Board: the public leaderboard ranks only source coverage, retrieval traceability, public baselines, and publicEvidence-gated movement. It does not certify companies, compliance, safety, internal conduct, or provider trustworthiness.',
          'Re-baseline protection: the first successful fetch after Seeded ingestion evidence establishes the real baseline only. It replaces seeded history for that policy and does not create a PolicyChange, AI score, or subscriber notification. A record is eligible only when it is still seed-only: Configured status alone is not enough, and existing source-evidence logs or public baselines route the scan into normal comparison instead of destructive re-baseline.',
          'Public suspension: when the latest fetch/update produces anomalies or insufficient evidence, the source is temporarily suspended and public views expose only the suspension notice, not the underlying analysis.',
          'Administrator alerting: source suspensions can generate an internal operational email with metadata and a Dataset QA link, without including policy text, scores, diffs, KPIs, or AI interpretation.',
          'Dataset QA control groups: source fit, retrieval evidence, public evidence gates, seeded-record boundaries, hash consistency, check-log completeness, timestamp integrity, archive timestamp coverage, KPI coverage, regional impact coverage, access logs, and subscriber hygiene are inspected before release decisions.',
          'Review decisions: Dataset QA issues can be marked reviewed, ignored with reason, or reopened, with append-only review-log evidence.',
          'Version timeline: versioned policy records remain available for reproducible comparison.'
        ]
      },
      {
        icon: FileWarning,
        title: '5. Known Limitations & Risks',
        desc: 'Users and legal teams must be aware of the following platform boundaries:',
        bullets: [
          'Scraping latency: policies are monitored on a recurring or manual schedule. Updates may lag behind live provider releases.',
          'Extraction limits: blocked pages, consent walls, script-rendered content, renderer outages, or archive gaps can reduce retrieval coverage. The VPS renderer improves coverage for script-rendered pages, but it does not guarantee source availability.',
          'LLM context limits: large documents may be analysed in reduced or structured contexts, which can miss highly specific clauses.',
          'Legal interpretation: legal terms can be ambiguous. Risk scores are analytical indicators, not court-validated conclusions or compliance determinations.'
        ]
      }
    ],

    // Footer notice
    disclaimerTitle: 'Verification Required',
    disclaimerText: 'Always verify policy states against the provider source pages. Corporate counsel and GRC teams should conduct independent human reviews before drawing legal compliance conclusions.'
  },
  it: {
    backHome: 'Torna alla Dashboard',
    tag: 'Framework di Controllo',
    title: 'Metodologia della Veridicità e Fiducia',
    subtitle: 'Il framework operativo di PolicyWatcher per provenienza dei dati, vincoli dell\'IA, storico dei controlli e responsabilità di revisione.',
    intro: 'La governance GRC e dell\'IA richiede verifiche basate su evidenze. Questa pagina descrive come PolicyWatcher registra fonti configurate, mappa le modifiche, vincola l\'elaborazione IA ed espone le limitazioni.',
    
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
        desc: 'Per evitare dati inventati ed esporre chiaramente i fallimenti di recupero, il sistema utilizza una cascata di acquisizione:',
        bullets: [
          'Fonte primaria: recupero HTTP diretto dell\'URL configurato con header simili a browser, validazione redirect, retry e timeout.',
          'Fallback protocollo: viene tentato HTTP/2 esplicito per provider che rifiutano HTTP/1.1 o restituiscono shell SPA troppo corte.',
          'Fallback renderizzato: quando configurato, un renderer VPS separato esegue il fetch con browser headless per pagine script-rendered. È protetto da bearer secret e valida URL iniziali, redirect e subresource contro regole SSRF.',
          'Fallback archivio: se il recupero live fallisce, la pipeline può tentare snapshot Wayback Machine e Common Crawl disponibili.',
          'Freshness guard: gli snapshot archivio più vecchi dell\'ultimo controllo riuscito vengono rifiutati, così una cache vecchia non può apparire come nuova modifica.',
          'Diagnostica strategie: ogni tentativo di retrieval registra strategia usata, esito, HTTP status quando disponibile, motivo di rifiuto/fallimento e passaggio al fallback successivo.',
          'Host-drift guard: i redirect live verso un host diverso vengono marcati per revisione invece di essere accettati come evidenza baseline.',
          'Path-drift guard: URL policy configurati che finiscono su homepage dello stesso host o landing page non-policy sono respinti invece di diventare evidenza baseline.',
          'Completeness guard: le estrazioni oltre il limite vengono marcate Partial e sospese dall\'evidenza pubblica invece di essere salvate come testo policy completo.',
          'Esecuzione batch: le scansioni amministrative possono essere limitate per company slug o numero policy, così la prima verifica sorgenti può riprendere in sicurezza su shared hosting.',
          'Registrazione trasparente degli errori: se una pagina resta irraggiungibile, il sistema non crea un record di versione riuscito partendo da dati mancanti. Aggiorna lo stato a "Unavailable" o "Needs Review" e scrive una riga di check-log.',
          'Fingerprint hash: i record testuali recuperati sono improntati con SHA-256 per consentire controlli successivi di coerenza tra testo e hash.'
        ]
      },
      {
        icon: Cpu,
        title: '3. Analisi IA e Limiti dei Modelli (LLM)',
        desc: 'Le analisi automatiche sono elaborate con modelli Google Gemini. Per ridurre il rischio di allucinazioni e migliorare la verificabilità, l\'IA è soggetta a rigidi vincoli:',
        bullets: [
          'Ancoraggio diretto: riassunti e punti chiave sono generati dal record testuale recuperato/versionato.',
          'Nessun riempimento non supportato: i prompt chiedono al modello di restituire "Non specificato" o "Non disponibile" quando il documento non supporta un campo o KPI.',
          'Mappatura strutturata: le categorizzazioni sono normalizzate rispetto ai campi di analisi previsti da PolicyWatcher.',
          'Audit trail: ogni analisi IA è collegata agli specifici record di versione della policy (vecchia vs nuova) da cui è stata prodotta.'
        ]
      },
      {
        icon: Eye,
        title: '4. Controlli di Tracciabilità ed Evidenze',
        desc: 'La fiducia si basa sulle prove. PolicyWatcher espone i seguenti elementi forensi direttamente nell\'interfaccia:',
        bullets: [
          'URL Configurato: Link diretto al documento sorgente monitorato.',
          'Metodo di ingestione: indicazione se il record corrente deriva da seed, recupero diretto, HTTP/2, renderer VPS o fonte archivio.',
          'Timestamp scansioni: visibilità di Ultimo Controllo e Ultimo Check Riuscito per ogni policy.',
          'Check log: ogni scansione può registrare stato, fonte, HTTP status, motivo, final URL, hash, lunghezza testo e timestamp dello snapshot quando viene usata una fonte archivio.',
          'Gate publicEvidence: snapshot e change devono essere marcati esplicitamente come evidenza pubblica prima che API pubbliche, sitemap, digest, report, share page, timeline o benchmark li espongano.',
          'Policy Signals Board: la leaderboard pubblica ordina soltanto copertura fonte, tracciabilità del retrieval, baseline pubbliche e movimenti marcati publicEvidence. Non certifica aziende, conformità, sicurezza, condotta interna o affidabilità del provider.',
          'Protezione re-baseline: il primo fetch riuscito dopo evidenza di ingestion Seeded stabilisce soltanto la baseline reale. Sostituisce la history seedata per quella policy e non crea PolicyChange, score AI o notifica subscriber. Un record è eleggibile solo se è ancora seed-only: il solo stato Configured non basta, e log di evidenza sorgente o baseline pubbliche instradano la scansione nel confronto normale invece che nella re-baseline distruttiva.',
          'Sospensione pubblica: quando l\'ultimo fetching o aggiornamento produce anomalie o evidenza insufficiente, la sorgente viene temporaneamente sospesa e le viste pubbliche espongono solo l\'avviso di sospensione, non l\'analisi sottostante.',
          'Alert amministrativo: le sospensioni delle sorgenti possono generare una mail operativa interna con metadati e link alla console Dataset QA, senza includere testo policy, score, diff, KPI o interpretazione AI.',
          'Gruppi di controllo Dataset QA: source fit, evidenza retrieval, gate public evidence, confini seed, coerenza hash, completezza check-log, integrità timestamp, copertura timestamp archivio, KPI, impatti regionali, access log e igiene subscriber sono verificati prima delle decisioni di rilascio.',
          'Decisioni di revisione: le issue Dataset QA possono essere marcate reviewed, ignored con motivazione o reopened, con evidenza append-only nel review log.',
          'Timeline versioni: i record versionati della policy restano disponibili per confronti riproducibili.'
        ]
      },
      {
        icon: FileWarning,
        title: '5. Limitazioni Note e Rischi',
        desc: 'Gli utenti e i team legali devono essere consapevoli dei seguenti limiti dello strumento:',
        bullets: [
          'Latenza dello scraping: le policy sono monitorate su base ricorrente o manuale. Gli aggiornamenti possono arrivare dopo la pubblicazione live del provider.',
          'Limiti di estrazione: pagine bloccate, consent wall, contenuti renderizzati via script, indisponibilità del renderer o lacune negli archivi possono ridurre la copertura. Il renderer VPS migliora la copertura delle pagine renderizzate via script, ma non garantisce la disponibilità della fonte.',
          'Limiti di contesto LLM: documenti molto ampi possono essere analizzati in contesti ridotti o strutturati, con rischio di perdere clausole molto specifiche.',
          'Interpretazione giuridica: i termini legali possono essere ambigui. I risk score sono indicatori analitici, non conclusioni giudiziali o determinazioni di conformità.'
        ]
      }
    ],

    // Footer notice
    disclaimerTitle: 'Verifica Necessaria',
    disclaimerText: 'Verificare sempre lo stato delle policy sulle pagine sorgente del provider. Team legali e GRC dovrebbero effettuare revisioni umane indipendenti prima di trarre conclusioni di conformità.'
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
