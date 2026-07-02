'use client';

/**
 * @file page.tsx (Roadmap)
 *
 * Roadmap page displaying the PolicyWatcher 3.5 Confidence Release objectives,
 * detailing the Intel-inspired development cadence (Feature Drop vs. Confidence Release).
 * Supports EN/IT localisations.
 */
import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ShieldCheck,
  Cpu,
  Layers,
  Activity,
  FileCode,
  History,
  ShieldAlert,
  GitFork,
  Database,
  Eye,
  Radio,
  FileWarning,
  ListFilter
} from 'lucide-react';
import styles from './roadmap.module.css';
import Footer from '@/components/Footer';

const translationContent = {
  en: {
    backHome: 'Back to Dashboard',
    tag: 'Operational Roadmap',
    title: 'PolicyWatcher 3.5 Roadmap',
    subtitle: 'Transitioning to the Confidence Release framework: proving provenance, ensuring transparency, and operationalizing GRC controls.',
    claim: 'PolicyWatcher 3.5 focuses on confidence: every visible analysis must expose its data status, source context, QA findings, review history and limits.',
    
    // Cadence
    cadenceTitle: 'The Alternating Release Cadence',
    cadenceIntro: 'Inspired by Intel’s historic "Tick-Tock" processor development rhythm, PolicyWatcher alternates release cycles to balance product capability with operational security and trust.',
    tockLabel: 'X.0 Feature Drop (The "Tock")',
    tockName: 'Feature Drop Release',
    tockBody: 'Expands what PolicyWatcher can do. Introduces new user-facing views, visual modules, admin tools, APIs, and product capabilities.',
    tockQuote: 'Example: 3.0 Feature Drop introduced the timeline, diff viewer, radar benchmarks, reports, and dataset QA grids.',
    tickLabel: 'X.5 Confidence Hardening (The "Tick")',
    tickName: 'Confidence Release',
    tickBody: 'Hardens, documents, and explains how PolicyWatcher works. Focuses on data quality, reviewability, audit trails, security, and methodological transparency.',
    tickQuote: 'Core Principle: X.0 expands capabilities; X.5 increases confidence in how those capabilities are produced and audited.',

    // Priorities
    roadmapTitle: 'Roadmap & Milestones',
    roadmapIntro: 'The following technical milestones govern the 3.5 release, moving from data provenance down to database security.',
    
    p0Title: 'P0 — Truth & Confidence Layer',
    p0Desc: 'Every public and admin view should make the state of the underlying data easier to understand.',
    p0Needs: [
      'Rename "Dataset Quality Seal" to "Dataset QA Status"',
      'Add explicit data confidence labels: Configured, Available, Partial, Needs Review, Unavailable, Reviewed',
      'Show visible data context: policy URL, jurisdiction, policy type, check dates, ingestion method, and QA findings',
      'Create a public methodology page explaining what the platform does and does not certify'
    ],
    p0WordingTitle: 'Wording Guidelines',
    p0Prefer: 'Prefer:',
    p0Avoid: 'Avoid:',

    p1Title: 'P1 — Admin Review Log',
    p1Desc: 'Introducing a human-in-the-loop review layer to audit automatic AI assessments.',
    p1Needs: [
      'Add an append-only review log for policy changes and dataset records',
      'Allow auditor users to approve, mark as needing review, override risk scores, and write notes',
      'Preserve the actor, role, action, old/new values, and timestamps',
      'Rule: Review logs are strictly append-only and cannot be overwritten'
    ],

    p2Title: 'P2 — Dataset QA Issue Queue',
    p2Desc: 'Evolving the QA dashboard into an actionable issue tracking and diagnostics list.',
    p2Needs: [
      'List dataset issues (localized URL, hash mismatch, missing region impact, stale records, etc.)',
      'Grade findings by severity: Critical, Warning, Info',
      'Support actions to mark as reviewed, ignore with reason, or link directly to the affected record',
      'Provide CSV exports for compliance auditors'
    ],

    p3Title: 'P3 — Advisory Framework Mapping',
    p3Desc: 'Prudent mapping of policy text changes to legal and governance compliance frameworks.',
    p3Needs: [
      'Support advisory mapping to EU AI Act, ISO/IEC 42001, and NIST AI RMF',
      'Show potentially relevant articles, reasons why, evidence available, and evidence missing',
      'Rule: Avoid terms like "Compliant" or "Violation". Use "Evidence Available" or "Requires Human Review"'
    ],

    p4Title: 'P4 — API & Signed Webhooks',
    p4Desc: 'Preparing the platform for secure and controlled enterprise GRC integrations.',
    p4Needs: [
      'Expose scoped API routes (/api/v1/companies, /api/v1/policies, /api/v1/changes, etc.)',
      'Apply pagination, rate limiting, request logging, and object-level authorization',
      'Implement signed outgoing webhooks via HMAC-SHA256 signatures with timestamp replay protection'
    ],

    p5Title: 'P5 — Multi-Version Diff',
    p5Desc: 'Making policy comparison flexible by enabling arbitrary version selection.',
    p5Needs: [
      'Allow users to select and compare any two snapshots side-by-side',
      'Expose dates, hashes, policy URLs, and related audit reviews directly in the diff window',
      'Support comparison report exports'
    ],

    p6Title: 'P6 — PostgreSQL Readiness',
    p6Desc: 'Upgrading the architecture to be production-ready for larger, cloud-based GRC deployments.',
    p6Needs: [
      'Maintain SQLite locally for simple local/dev setup',
      'Add PostgreSQL support in production via environment-driven Prisma configs',
      'Support separate demo and production seed profiles, and database health checks'
    ],

    p7Title: 'P7 — Forensic Lab Visual Refresh',
    p7Desc: 'Moving the interface design away from generic SaaS marketing toward an audit workstation.',
    p7Needs: [
      'Visual themes inspired by evidence boards and forensic labs',
      'Calmer, technical color schemes with dense but readable data panels',
      'Eliminate certification-like seals, decorative badges, and non-data animations'
    ],

    // Excluded
    excludedHeader: 'Intentionally Excluded from 3.5',
    excludedIntro: 'The following capabilities are postponed to keep the focus on trust, verification, and auditability.',
    questionnaireTitle: 'Automated Questionnaire Generator',
    questionnaireReason: 'AI-generated compliance answers cannot guarantee legal truth. Postponed to be developed later as a draft assistant only.',
    jiraTitle: 'Jira & OneTrust Direct Integrations',
    jiraReason: 'Postponed to prioritize building a robust, generic signed HMAC webhook framework first.',
    scoreTitle: 'EU AI Act Compliance Score',
    scoreReason: 'Legally risky. PolicyWatcher provides advisory framework mapping, not legal determinations or verdicts.',
    realTimeTitle: 'Real-Time Monitoring Claims',
    realTimeReason: 'The platform operates on scheduled checks and configured routes, not instant real-time hooks.',

    // Forensic Lab details
    forensicHeader: 'Forensic Lab Visual Principles',
    forensicCol1: 'Embrace (Confidence UI)',
    forensicCol2: 'Avoid (SaaS Marketing)',
    forensicCol1Items: [
      'Record Status, QA Finding, and Review Trail',
      'Calm technical palettes with detailed metadata',
      'Wording showing data status and review history',
      'Animations limited to graphs and timeline changes'
    ],
    forensicCol2Items: [
      'Decorative seals, guarantees, and certified stamps',
      'Vibrant SaaS marketing templates',
      'Absolute claims like "100% Compliant"',
      'High-contrast decorative transitions'
    ],

    // Statement
    positionTitle: '3.5 Confidence Release Objective',
    positionText: 'PolicyWatcher 3.5 does not aim to make louder claims. It aims to make every visible result easier to inspect, verify, and audit.'
  },
  it: {
    backHome: 'Torna alla Dashboard',
    tag: 'Roadmap Operativa',
    title: 'Roadmap PolicyWatcher 3.5',
    subtitle: 'Transizione al framework "Confidence Release": provare la provenienza, garantire trasparenza e integrare i controlli GRC.',
    claim: 'PolicyWatcher 3.5 si concentra sulla fiducia: ogni analisi visibile deve esporre lo stato dei dati, il contesto della fonte, i risultati del controllo QA, la cronologia delle revisioni e i limiti.',
    
    // Cadence
    cadenceTitle: 'La Cadenza Alternata dei Rilasci',
    cadenceIntro: 'Ispirato al modello storico "Tick-Tock" dei processori Intel, PolicyWatcher alterna i cicli di rilascio per bilanciare l\'espansione delle funzionalità con la sicurezza e l\'affidabilità operativa.',
    tockLabel: 'X.0 Feature Drop (Il "Tock")',
    tockName: 'Rilascio Nuove Funzionalità',
    tockBody: 'Espande ciò che PolicyWatcher può fare. Introduce nuove visualizzazioni per gli utenti, moduli grafici, strumenti amministrativi, API e capacità di prodotto.',
    tockQuote: 'Esempio: Il rilascio 3.0 ha introdotto la timeline, il visualizzatore di diff, benchmark radar, report e pannelli di controllo QA.',
    tickLabel: 'X.5 Consolidamento e Sicurezza (Il "Tick")',
    tickName: 'Confidence Release',
    tickBody: 'Migliora, documenta e spiega il funzionamento interno di PolicyWatcher. Si concentra su qualità del dato, revisionabilità, log di audit, sicurezza e trasparenza metodologica.',
    tickQuote: 'Principio Cardine: X.0 espande le capacità; X.5 aumenta la fiducia e il controllo su come tali capacità sono prodotte.',

    // Priorities
    roadmapTitle: 'Punti Chiave & Milestones',
    roadmapIntro: 'Le seguenti tappe tecniche regolano la versione 3.5, partendo dalla tracciabilità del dato fino alla blindatura del database.',
    
    p0Title: 'P0 — Livello Verità & Trasparenza',
    p0Desc: 'Ogni visualizzazione pubblica e amministrativa deve rendere trasparente lo stato del dato sottostante.',
    p0Needs: [
      'Rinominare "Dataset Quality Seal" in "Dataset QA Status"',
      'Aggiungere etichette di confidence: Configured, Available, Partial, Needs Review, Unavailable, Reviewed',
      'Mostrare il contesto del dato: URL configurato, giurisdizione, tipo di policy, date di controllo e risultati QA',
      'Creare una pagina pubblica sulla metodologia spiegando limiti e criteri di funzionamento dell\'AI'
    ],
    p0WordingTitle: 'Linee Guida Wording',
    p0Prefer: 'Usa:',
    p0Avoid: 'Evita:',

    p1Title: 'P1 — Registro Revisioni Admin',
    p1Desc: 'Introduzione di un livello di revisione umana (Human-in-the-loop) per validare le analisi AI.',
    p1Needs: [
      'Aggiungere un registro append-only (PolicyReviewLog) per modifiche e record',
      'Consentire agli admin di approvare, segnalare revisioni, sovrascrivere punteggi e aggiungere note',
      'Salvare autore, ruolo, azione, valore precedente/nuovo e timestamp',
      'Regola: Il log delle revisioni è append-only e non può essere sovrascritto'
    ],

    p2Title: 'P2 — Coda Problemi Dataset QA',
    p2Desc: 'Evoluzione del pannello QA in una coda di segnalazione e risoluzione delle anomalie.',
    p2Needs: [
      'Elencare i problemi (URL localizzati, hash non corrispondenti, record obsoleti, KPI non valutati)',
      'Classificare le anomalie per gravità: Critico, Warning, Info',
      'Azioni per segnare come esaminato, ignorare con motivazione e linkare direttamente al record coinvolto',
      'Esportazione CSV per audit di conformità'
    ],

    p3Title: 'P3 — Mappatura Framework Advisory',
    p3Desc: 'Associazione prudente delle variazioni di testo delle policy ai principali standard di governance.',
    p3Needs: [
      'Associare le policy a EU AI Act, ISO/IEC 42001 e NIST AI RMF',
      'Indicare articoli rilevanti, motivazione, prove presenti e prove assenti nel testo',
      'Regola: Evitare "Conforme" o "Violazione". Utilizzare "Prove Disponibili" o "Richiede Revisione Umana"'
    ],

    p4Title: 'P4 — API & Webhooks Firmati',
    p4Desc: 'Preparazione della piattaforma per integrazioni aziendali GRC sicure.',
    p4Needs: [
      'Esporre rotte API dedicate (/api/v1/companies, /api/v1/policies, /api/v1/changes, ecc.)',
      'Applicare paginazione, rate limiting, log delle richieste e autorizzazione a livello di oggetto',
      'Implementare webhook in uscita firmati via HMAC-SHA256 con timestamp contro i replay attacks'
    ],

    p5Title: 'P5 — Diff Multi-Versione',
    p5Desc: 'Miglioramento del confronto dei testi abilitando la selezione libera delle versioni.',
    p5Needs: [
      'Consentire il confronto affiancato di due snapshot storici a scelta',
      'Mostrare date, hash, URL delle policy e note di revisione nel visualizzatore diff',
      'Esportare i report di confronto'
    ],

    p6Title: 'P6 — Supporto PostgreSQL',
    p6Desc: 'Aggiornamento dell\'architettura per consentire l\'uso in ambienti cloud aziendali.',
    p6Needs: [
      'Mantenere SQLite per lo sviluppo locale e dimostrativo',
      'Aggiungere il supporto a PostgreSQL in produzione tramite configurazioni Prisma variabili',
      'Gestire seed di dati demo separati dai profili di produzione e controlli sanitari del DB'
    ],

    p7Title: 'P7 — Interfaccia Stile Forensic Lab',
    p7Desc: 'Evoluzione del design visivo da una logica di marketing a uno spazio di lavoro per audit.',
    p7Needs: [
      'Interfaccia ispirata a console di controllo e laboratori di analisi dati',
      'Colori tecnici rilassanti e griglie strutturate per massimizzare la leggibilità dei metadati',
      'Rimuovere sigilli, badge decorativi ed elementi estetici non legati a dati reali'
    ],

    // Excluded
    excludedHeader: 'Esclusi Intenzionalmente dalla 3.5',
    excludedIntro: 'Le seguenti funzionalità sono rimandate per mantenere il focus su affidabilità e verifica.',
    questionnaireTitle: 'Generatore Questionari Vendor',
    questionnaireReason: 'Le risposte generate da AI non garantiscono conformità legale. Rimandato per essere sviluppato solo come assistente bozza in futuro.',
    jiraTitle: 'Integrazioni Jira e OneTrust',
    jiraReason: 'Rimandato per dare priorità a un sistema webhook HMAC firmato e generico.',
    scoreTitle: 'Punteggio di Conformità EU AI Act',
    scoreReason: 'Rischioso legalmente. PolicyWatcher fornisce mappature di orientamento, non verdetti o pareri di conformità.',
    realTimeTitle: 'Monitoraggio Real-Time',
    realTimeReason: 'La piattaforma lavora su controlli pianificati (cron) e non su flussi istantanei.',

    // Forensic Lab details
    forensicHeader: 'Principi Visivi Forensic Lab',
    forensicCol1: 'Usa (Confidence UI)',
    forensicCol2: 'Evita (SaaS Marketing)',
    forensicCol1Items: [
      'Stato del record, QA findings e traccia di revisione',
      'Tonalità neutre con evidenza di metadati',
      'Wording focalizzato su tracciabilità del dato',
      'Animazioni limitate a grafici e dati'
    ],
    forensicCol2Items: [
      'Sigilli grafici, certificati e bollini di conformità',
      'Colori accesi e template promozionali',
      'Affermazioni assolute come "100% Conforme"',
      'Animazioni ornamentali'
    ],

    // Statement
    positionTitle: 'Obiettivo del Rilascio 3.5',
    positionText: 'PolicyWatcher 3.5 non mira ad avanzare pretese altisonanti. Vuole rendere ogni risultato ispezionabile, trasparente e verificabile.'
  }
};

export default function RoadmapPage() {
  const [lang, setLang] = useState<'en' | 'it'>('en');
  const t = translationContent[lang];

  return (
    <div className={styles.page}>
      {/* Top sticky bar */}
      <div className={styles.topBar}>
        <div className={styles.topBarContent}>
          <Link href="/" className={styles.logoArea}>
            <ShieldCheck size={22} color="#6366f1" />
            <span className={styles.logoText}>PolicyWatcher</span>
            <span className={styles.logoSubtitle}>v3.5 roadmap</span>
          </Link>
          
          <div className={styles.actions}>
            <Link href="/" className={styles.backLink}>
              <ArrowLeft size={16} />
              {t.backHome}
            </Link>
            
            <div className={styles.langToggle}>
              <button
                onClick={() => setLang('en')}
                className={`${styles.langBtn} ${lang === 'en' ? styles.langBtnActive : ''}`}
              >
                EN
              </button>
              <button
                onClick={() => setLang('it')}
                className={`${styles.langBtn} ${lang === 'it' ? styles.langBtnActive : ''}`}
              >
                IT
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.container}>
        {/* Hero Banner */}
        <div className={styles.hero}>
          <span className={styles.heroTag}>{t.tag}</span>
          <h1 className={styles.heroTitle}>{t.title}</h1>
          <p className={styles.heroSubtitle}>{t.subtitle}</p>
          <p className={styles.heroClaim}>"{t.claim}"</p>
        </div>

        {/* Release rhythm section */}
        <section className={styles.cadenceSection}>
          <div className={styles.sectionHeader}>
            <Cpu className={styles.sectionIcon} size={20} />
            <h2 className={styles.sectionTitle}>{t.cadenceTitle}</h2>
          </div>
          <p className={styles.cadenceIntro}>{t.cadenceIntro}</p>
          
          <div className={styles.cadenceGrid}>
            <div className={styles.cadenceCard}>
              <div className={`${styles.cadenceAccent} ${styles.tockAccent}`} />
              <div className={styles.cadenceHeader}>
                <div>
                  <span className={styles.cadenceLabel}>{t.tockLabel}</span>
                  <h3 className={styles.cadenceName}>{t.tockName}</h3>
                </div>
                <div className={`${styles.cadenceIconWrapper} ${styles.tockIcon}`}>
                  <GitFork size={20} />
                </div>
              </div>
              <p className={styles.cadenceBody}>{t.tockBody}</p>
              <div className={`${styles.cadenceQuote} ${styles.tockQuote}`}>
                {t.tockQuote}
              </div>
            </div>

            <div className={styles.cadenceCard}>
              <div className={`${styles.cadenceAccent} ${styles.tickAccent}`} />
              <div className={styles.cadenceHeader}>
                <div>
                  <span className={styles.cadenceLabel}>{t.tickLabel}</span>
                  <h3 className={styles.cadenceName}>{t.tickName}</h3>
                </div>
                <div className={`${styles.cadenceIconWrapper} ${styles.tickIcon}`}>
                  <ShieldCheck size={20} />
                </div>
              </div>
              <p className={styles.cadenceBody}>{t.tickBody}</p>
              <div className={`${styles.cadenceQuote} ${styles.tickQuote}`}>
                {t.tickQuote}
              </div>
            </div>
          </div>
        </section>

        {/* Priorities roadmap */}
        <section className={styles.roadmapSection}>
          <div className={styles.sectionHeader}>
            <ListFilter className={styles.sectionIcon} size={20} />
            <h2 className={styles.sectionTitle}>{t.roadmapTitle}</h2>
          </div>
          <p className={styles.roadmapIntro}>{t.roadmapIntro}</p>

          <div className={styles.timeline}>
            {/* P0 */}
            <div className={styles.priorityCard}>
              <div className={styles.priorityHeader}>
                <div className={styles.priorityLeft}>
                  <span className={`${styles.priorityPill} ${styles.p0Pill}`}>P0</span>
                  <h3 className={styles.priorityTitle}>{t.p0Title}</h3>
                </div>
                <Layers className={styles.priorityIcon} size={18} />
              </div>
              <div className={styles.priorityContent}>
                <div>
                  <p className={styles.priorityDesc}>{t.p0Desc}</p>
                  <div className={styles.ruleBlock}>
                    <div className={styles.ruleBlockTitle}>
                      <FileWarning size={14} />
                      {t.p0WordingTitle}
                    </div>
                    <div className={styles.wordingGrid}>
                      <div className={styles.wordingCol}>
                        <h5 className={styles.preferTitle}>{t.p0Prefer}</h5>
                        <ul className={styles.wordingList}>
                          <li>Dataset QA Status</li>
                          <li>Review status</li>
                          <li>Available analysis</li>
                          <li>Needs review</li>
                        </ul>
                      </div>
                      <div className={styles.wordingCol}>
                        <h5 className={styles.avoidTitle}>{t.p0Avoid}</h5>
                        <ul className={styles.wordingList}>
                          <li>Verified / Certified</li>
                          <li>Guaranteed</li>
                          <li>Compliance engine</li>
                          <li>Legal determination</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                <ul className={styles.priorityList}>
                  {t.p0Needs.map((need, idx) => <li key={idx}>{need}</li>)}
                </ul>
              </div>
            </div>

            {/* P1 */}
            <div className={styles.priorityCard}>
              <div className={styles.priorityHeader}>
                <div className={styles.priorityLeft}>
                  <span className={`${styles.priorityPill} ${styles.p1Pill}`}>P1</span>
                  <h3 className={styles.priorityTitle}>{t.p1Title}</h3>
                </div>
                <History className={styles.priorityIcon} size={18} />
              </div>
              <div className={styles.priorityContent}>
                <div>
                  <p className={styles.priorityDesc}>{t.p1Desc}</p>
                  <div className={styles.codeBlock}>
                    <div className={styles.codeBlockHeader}>
                      <span>Prisma Model: PolicyReviewLog</span>
                      <span>v3.5 schema</span>
                    </div>
                    {`model PolicyReviewLog {
  id             String   @id @default(uuid())
  policyId       String?
  policyChangeId String?
  actorName      String
  actorRole      String
  action         String   // e.g. "OVERRIDE"
  oldValueJson   String?
  newValueJson   String?
  notes          String?
  createdAt      DateTime @default(now())
}`}
                  </div>
                </div>
                <ul className={styles.priorityList}>
                  {t.p1Needs.map((need, idx) => <li key={idx}>{need}</li>)}
                </ul>
              </div>
            </div>

            {/* P2 */}
            <div className={styles.priorityCard}>
              <div className={styles.priorityHeader}>
                <div className={styles.priorityLeft}>
                  <span className={styles.priorityPill}>P2</span>
                  <h3 className={styles.priorityTitle}>{t.p2Title}</h3>
                </div>
                <ShieldAlert className={styles.priorityIcon} size={18} />
              </div>
              <div className={styles.priorityContent}>
                <p className={styles.priorityDesc}>{t.p2Desc}</p>
                <ul className={styles.priorityList}>
                  {t.p2Needs.map((need, idx) => <li key={idx}>{need}</li>)}
                </ul>
              </div>
            </div>

            {/* P3 */}
            <div className={styles.priorityCard}>
              <div className={styles.priorityHeader}>
                <div className={styles.priorityLeft}>
                  <span className={styles.priorityPill}>P3</span>
                  <h3 className={styles.priorityTitle}>{t.p3Title}</h3>
                </div>
                <ListFilter className={styles.priorityIcon} size={18} />
              </div>
              <div className={styles.priorityContent}>
                <p className={styles.priorityDesc}>{t.p3Desc}</p>
                <ul className={styles.priorityList}>
                  {t.p3Needs.map((need, idx) => <li key={idx}>{need}</li>)}
                </ul>
              </div>
            </div>

            {/* P4 */}
            <div className={styles.priorityCard}>
              <div className={styles.priorityHeader}>
                <div className={styles.priorityLeft}>
                  <span className={styles.priorityPill}>P4</span>
                  <h3 className={styles.priorityTitle}>{t.p4Title}</h3>
                </div>
                <Radio className={styles.priorityIcon} size={18} />
              </div>
              <div className={styles.priorityContent}>
                <div>
                  <p className={styles.priorityDesc}>{t.p4Desc}</p>
                  <div className={styles.codeBlock} style={{ background: '#1e293b' }}>
                    <div className={styles.codeBlockHeader} style={{ color: '#94a3b8' }}>
                      <span>Signed HMAC Headers</span>
                    </div>
                    {`X-PolicyWatcher-Event: change.created\nX-PolicyWatcher-Timestamp: 1782937281\nX-PolicyWatcher-Signature: t8a2b3...`}
                  </div>
                </div>
                <ul className={styles.priorityList}>
                  {t.p4Needs.map((need, idx) => <li key={idx}>{need}</li>)}
                </ul>
              </div>
            </div>

            {/* P5 */}
            <div className={styles.priorityCard}>
              <div className={styles.priorityHeader}>
                <div className={styles.priorityLeft}>
                  <span className={styles.priorityPill}>P5</span>
                  <h3 className={styles.priorityTitle}>{t.p5Title}</h3>
                </div>
                <Eye className={styles.priorityIcon} size={18} />
              </div>
              <div className={styles.priorityContent}>
                <p className={styles.priorityDesc}>{t.p5Desc}</p>
                <ul className={styles.priorityList}>
                  {t.p5Needs.map((need, idx) => <li key={idx}>{need}</li>)}
                </ul>
              </div>
            </div>

            {/* P6 */}
            <div className={styles.priorityCard}>
              <div className={styles.priorityHeader}>
                <div className={styles.priorityLeft}>
                  <span className={styles.priorityPill}>P6</span>
                  <h3 className={styles.priorityTitle}>{t.p6Title}</h3>
                </div>
                <Database className={styles.priorityIcon} size={18} />
              </div>
              <div className={styles.priorityContent}>
                <p className={styles.priorityDesc}>{t.p6Desc}</p>
                <ul className={styles.priorityList}>
                  {t.p6Needs.map((need, idx) => <li key={idx}>{need}</li>)}
                </ul>
              </div>
            </div>

            {/* P7 */}
            <div className={styles.priorityCard}>
              <div className={styles.priorityHeader}>
                <div className={styles.priorityLeft}>
                  <span className={styles.priorityPill}>P7</span>
                  <h3 className={styles.priorityTitle}>{t.p7Title}</h3>
                </div>
                <Activity className={styles.priorityIcon} size={18} />
              </div>
              <div className={styles.priorityContent}>
                <p className={styles.priorityDesc}>{t.p7Desc}</p>
                <ul className={styles.priorityList}>
                  {t.p7Needs.map((need, idx) => <li key={idx}>{need}</li>)}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Forensic lab design guidelines */}
        <section className={styles.forensicPanel}>
          <div className={styles.sectionHeader}>
            <Eye className={styles.sectionIcon} size={20} />
            <h2 className={styles.sectionTitle}>{t.forensicHeader}</h2>
          </div>
          <div className={styles.forensicGrid}>
            <div>
              <h4 className={styles.forensicTitle} style={{ color: 'var(--risk-low)' }}>
                {t.forensicCol1}
              </h4>
              <ul className={styles.forensicList}>
                {t.forensicCol1Items.map((item, idx) => (
                  <li key={idx}>
                    <span className={styles.forensicDot} style={{ backgroundColor: 'var(--risk-low)' }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className={styles.forensicTitle} style={{ color: 'var(--risk-high)' }}>
                {t.forensicCol2}
              </h4>
              <ul className={styles.forensicList}>
                {t.forensicCol2Items.map((item, idx) => (
                  <li key={idx}>
                    <span className={styles.forensicDot} style={{ backgroundColor: 'var(--risk-high)' }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Excluded items */}
        <section className={styles.excludedSection}>
          <div className={styles.sectionHeader}>
            <FileWarning className={styles.sectionIcon} size={20} />
            <h2 className={styles.sectionTitle}>{t.excludedHeader}</h2>
          </div>
          <p className={styles.cadenceIntro}>{t.excludedIntro}</p>

          <div className={styles.excludedGrid}>
            <div className={styles.excludedCard}>
              <span className={styles.excludedLabel}>{t.questionnaireTitle}</span>
              <h4 className={styles.excludedTitle}>Vendor Questionnaire Generator</h4>
              <p className={styles.excludedReason}>{t.questionnaireReason}</p>
            </div>

            <div className={styles.excludedCard}>
              <span className={styles.excludedLabel}>{t.jiraTitle}</span>
              <h4 className={styles.excludedTitle}>Direct GRC / Jira Integrations</h4>
              <p className={styles.excludedReason}>{t.jiraReason}</p>
            </div>

            <div className={styles.excludedCard}>
              <span className={styles.excludedLabel}>{t.scoreTitle}</span>
              <h4 className={styles.excludedTitle}>EU AI Act Compliance Score</h4>
              <p className={styles.excludedReason}>{t.scoreReason}</p>
            </div>

            <div className={styles.excludedCard}>
              <span className={styles.excludedLabel}>{t.realTimeTitle}</span>
              <h4 className={styles.excludedTitle}>Real-Time Monitoring Claims</h4>
              <p className={styles.excludedReason}>{t.realTimeReason}</p>
            </div>
          </div>
        </section>

        {/* Bottom Position Statement */}
        <div className={styles.statement}>
          <h3 className={styles.statementTitle}>{t.positionTitle}</h3>
          <p className={styles.statementText}>{t.positionText}</p>
        </div>
      </div>
      
      <Footer lang={lang} />
    </div>
  );
}
