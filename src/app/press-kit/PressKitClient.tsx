'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowRight,
  Archive,
  BookOpen,
  CalendarClock,
  Check,
  CheckCircle2,
  Clipboard,
  Code2,
  Database,
  Download,
  ExternalLink,
  FileCheck2,
  FileArchive,
  FileText,
  GitFork,
  Languages,
  Mail,
  MessageSquareQuote,
  Mic2,
  Newspaper,
  Radio,
  Scale,
  ShieldCheck,
  Sparkles,
  Tags,
} from 'lucide-react';
import Footer from '@/components/Footer';
import PublicHeader from '@/components/PublicHeader';
import {
  POLICYWATCHER_BROWSER_EXTENSION_DISPLAY_VERSION,
  POLICYWATCHER_BROWSER_EXTENSION_RELEASE_STATUS,
  POLICYWATCHER_RELEASE_BADGE,
  POLICYWATCHER_RELEASE_DATE,
  POLICYWATCHER_RELEASE_NAME,
  POLICYWATCHER_VERSION_DISPLAY,
} from '@/lib/release';
import {
  PRESS_KIT_ARTICLE_50_URL,
  PRESS_KIT_JSON_URL,
  PRESS_KIT_REPOSITORY_URL,
  pressKitAssets,
  pressKitBoilerplates,
  pressKitClaims,
  pressKitContactRoutes,
  pressKitCycleItems,
  pressKitDataSnapshots,
  pressKitFacts,
  pressKitPackages,
  pressKitReleases,
  type PressKitLocale,
} from '@/lib/pressKit';
import { recordPressMetric } from '@/lib/pressMetrics';
import styles from './pressKit.module.css';

const copy = {
  en: {
    switchLanguage: 'Italiano',
    kicker: 'PolicyWatcher press information',
    title: 'PolicyWatcher press kit.',
    lead: 'Product facts, supporting links, limitations, release information, media files and press contact details.',
    currentRelease: 'Current web release',
    releaseDate: 'Released 2 August 2026',
    factSheet: 'Download fact sheet',
    copyShort: 'Copy short boilerplate',
    copied: 'Copied',
    copyFailed: 'Copy failed.',
    manualCopy: 'Select the text and copy it manually.',
    browseAssets: 'Browse assets',
    contactPress: 'Contact press',
    quickFacts: 'Fast facts',
    deskLabel: 'Journalist action desk',
    deskLead: 'Move directly to reusable files, dated facts, releases, data or the correct request route.',
    deskOverflowCue: 'Swipe horizontally for more actions',
    deskActions: [
      ['Press packages', 'Language-specific files and integrity details.'],
      ['Current facts', 'Stable identifiers, dates and evidence links.'],
      ['Newsroom releases', 'Dated release notes and stated boundaries.'],
      ['Data room', 'Published snapshots and available formats.'],
      ['Route a request', 'Press, fact-checking, interview or speaking.'],
    ],
    packagesLabel: 'Press packages',
    packagesTitle: 'Language-specific editorial files.',
    packagesLead: 'Every package lists version, generation date, contents, rights boundary and checksum.',
    packageContents: 'Included files',
    packageVersion: 'Version',
    packageGenerated: 'Generated',
    packageChecksum: 'SHA-256',
    releaseArchive: 'Open release archive',
    dataRoom: 'Open data room',
    contactRouting: 'Request routing',
    contactTitle: 'Send the request with the context needed for review.',
    contactLead: 'These routes use one public address with a contextual subject. No response time is promised.',
    requestedContext: 'Please include',
    sendRequest: 'Prepare email',
    referenceTitle: 'Provenance, corrections and terminology.',
    provenance: 'Provenance status',
    correctionsLog: 'Correction register',
    glossary: 'Glossary',
    statusTitle: 'Briefing status',
    releaseFreshness: 'Release metadata',
    releaseFreshnessBody: 'Current to 2 August 2026 for the web application.',
    evidenceFreshness: 'Platform evidence',
    evidenceFreshnessBody: 'Timestamps are recorded per source; update intervals depend on retrieval and review.',
    extension: 'Extension track',
    factsTitle: 'Product facts and scope.',
    factsLead: 'These figures describe configured product inventory and method, not exhaustive market coverage.',
    whyNow: 'Why now',
    whyTitle: 'EU AI Act Article 50 transparency obligations apply from 2 August 2026.',
    whyBody: 'European Commission guidance published on 20 July and updated on 24 July addresses Article 50 transparency obligations that apply from 2 August 2026. This is editorial context, not proof of PolicyWatcher or provider compliance.',
    officialSource: 'Read the Commission source',
    pillars: [
      ['Transparency', 'Public claims include links to source status, dates and available evidence.'],
      ['Explainability', 'Show why an analytical signal appears and where interpretation remains uncertain.'],
      ['Data Quality', 'Withhold incomplete evidence and display Not assessed without assigning a numerical value.'],
    ],
    cycleLabel: 'Latest two-week development cycle',
    cycleTitle: 'Functions included in the current release.',
    ledgerLabel: 'Claim Ledger',
    ledgerTitle: 'Claims, supporting links and limitations.',
    ledgerLead: 'Each entry identifies a product statement, its supporting page and its stated limitation.',
    claim: 'Public statement', status: 'Status / type', proof: 'Proof', boundary: 'Boundary',
    verified: 'Verification', asOf: 'As of', lastVerified: 'Last verified', reviewCadence: 'Review cadence', stableId: 'Stable ID', statementStatus: 'Statement status', claimType: 'Claim type',
    storyLabel: 'Reporting topics', storyTitle: 'Topics supported by product and policy information.',
    storyAngles: [
      ['AI transparency', 'Article 50 turns transparency into an operational reporting question: what must be disclosed, to whom, and with what evidence?'],
      ['Privacy and legal operations', 'The product records source provenance, review state and policy text changes for configured sources.'],
      ['Data and engineering quality', 'Evidence gates, source suspension and missing-value handling are documented product controls.'],
      ['Civic tech and open governance', 'A public, CC BY 4.0 repository makes the monitoring method inspectable without implying OSI certification.'],
    ],
    assetsLabel: 'Owned media files', assetsTitle: 'Files available for media use.',
    assetsLead: 'Only PolicyWatcher-owned assets appear here. Third-party coverage screenshots remain references on the Press Wall.',
    download: 'Download', noCredentials: 'Content Credentials not attached',
    checksumNote: 'SHA-256 confirms file integrity only. It does not prove semantic truth, authorship provenance or endorsement.',
    boilerLabel: 'Boilerplates and citation', boilerTitle: 'Descriptions and citation details.',
    short: 'Short boilerplate', long: 'Long boilerplate', copyAction: 'Copy text',
    citation: 'Suggested citation',
    citationText: `PolicyWatcher, ${POLICYWATCHER_VERSION_DISPLAY} ${POLICYWATCHER_RELEASE_NAME}, 2 August 2026, https://policywatcher.online/press-kit (accessed [date]).`,
    corrections: 'Corrections and factual questions: info@policywatcher.online. Include the cited URL and the statement requiring review.',
    founderLabel: 'Founder and contact', founderTitle: 'Fabrizio Degni',
    founderBio: 'Independent builder working on public-interest tools for inspecting and discussing digital-policy changes with links to source material.',
    portraitNote: 'Available portrait: 200 x 200 px, suitable for small digital placements.',
    coverageLabel: 'Scope and limitations', coverageTitle: 'Stated limits of the available information.',
    boundaries: ['Not legal advice or compliance certification.', 'Configured inventory is not exhaustive coverage.', 'Update intervals depend on source retrieval and review.', 'AI-assisted analysis can be incomplete or incorrect.', 'External mentions are not endorsements or independent audits.'],
    json: 'Machine-readable press kit', manifest: 'Asset manifest', coverageWall: 'Coverage wall', trust: 'Trust evidence', method: 'Methodology', timeline: 'Policy timeline', featureAtlas: 'Feature Atlas', releaseSurface: 'Release impact',
  },
  it: {
    switchLanguage: 'English',
    kicker: 'Informazioni stampa PolicyWatcher',
    title: 'Press kit PolicyWatcher.',
    lead: 'Dati sul prodotto, link di supporto, limiti, informazioni di release, file media e contatti stampa.',
    currentRelease: 'Release web corrente',
    releaseDate: 'Rilasciata il 2 agosto 2026',
    factSheet: 'Scarica la scheda stampa',
    copyShort: 'Copia boilerplate breve',
    copied: 'Copiato',
    copyFailed: 'Copia non riuscita.',
    manualCopy: 'Seleziona il testo e copialo manualmente.',
    browseAssets: 'Sfoglia gli asset',
    contactPress: 'Contatto stampa',
    quickFacts: 'Dati rapidi',
    deskLabel: 'Desk operativo per giornalisti',
    deskLead: 'Vai direttamente a file riutilizzabili, dati datati, release, data room o al percorso corretto per la richiesta.',
    deskOverflowCue: 'Scorri orizzontalmente per altre azioni',
    deskActions: [
      ['Pacchetti stampa', 'File per lingua e dettagli di integrita.'],
      ['Dati correnti', 'Identificatori stabili, date e link alle evidenze.'],
      ['Release newsroom', 'Note di release datate e limiti dichiarati.'],
      ['Data room', 'Snapshot pubblicati e formati disponibili.'],
      ['Indirizza una richiesta', 'Stampa, fact-checking, intervista o speaking.'],
    ],
    packagesLabel: 'Pacchetti stampa',
    packagesTitle: 'File editoriali specifici per lingua.',
    packagesLead: 'Ogni pacchetto elenca versione, data di generazione, contenuti, limiti di utilizzo e checksum.',
    packageContents: 'File inclusi',
    packageVersion: 'Versione',
    packageGenerated: 'Generato',
    packageChecksum: 'SHA-256',
    releaseArchive: 'Apri archivio release',
    dataRoom: 'Apri data room',
    contactRouting: 'Instradamento richieste',
    contactTitle: 'Invia la richiesta con il contesto necessario alla revisione.',
    contactLead: 'I percorsi usano un unico indirizzo pubblico con oggetto contestuale. Non viene promessa una tempistica di risposta.',
    requestedContext: 'Includere',
    sendRequest: 'Prepara email',
    referenceTitle: 'Provenienza, correzioni e terminologia.',
    provenance: 'Stato provenienza',
    correctionsLog: 'Registro correzioni',
    glossary: 'Glossario',
    statusTitle: 'Stato briefing',
    releaseFreshness: 'Metadata release',
    releaseFreshnessBody: 'Correnti al 2 agosto 2026 per l applicazione web.',
    evidenceFreshness: 'Evidenze piattaforma',
    evidenceFreshnessBody: 'I timestamp sono registrati per fonte; gli intervalli dipendono da recupero e revisione.',
    extension: 'Track estensione',
    factsTitle: 'Dati sul prodotto e relativo perimetro.',
    factsLead: 'Questi numeri descrivono inventario configurato e metodo, non copertura esaustiva del mercato.',
    whyNow: 'Perche ora',
    whyTitle: 'Gli obblighi di trasparenza dell articolo 50 dell AI Act si applicano dal 2 agosto 2026.',
    whyBody: 'Le linee guida della Commissione europea pubblicate il 20 luglio e aggiornate il 24 luglio trattano gli obblighi di trasparenza dell articolo 50 applicabili dal 2 agosto 2026. E contesto editoriale, non prova di conformita di PolicyWatcher o dei provider.',
    officialSource: 'Leggi la fonte Commissione',
    pillars: [
      ['Trasparenza', 'Le affermazioni pubbliche includono link a stato fonte, date ed evidenze disponibili.'],
      ['Spiegabilita', 'Mostrare perche appare un segnale analitico e dove resta incertezza.'],
      ['Qualita dati', 'Trattenere evidenze incomplete e mostrare Non valutato senza assegnare un valore numerico.'],
    ],
    cycleLabel: 'Ultimo ciclo di sviluppo di due settimane',
    cycleTitle: 'Funzioni incluse nella release corrente.',
    ledgerLabel: 'Registro delle affermazioni',
    ledgerTitle: 'Affermazioni, link di supporto e limiti.',
    ledgerLead: 'Ogni voce identifica una dichiarazione sul prodotto, la pagina di supporto e il limite dichiarato.',
    claim: 'Affermazione pubblica', status: 'Stato / tipo', proof: 'Prova', boundary: 'Limite',
    verified: 'Verifica', asOf: 'Valido al', lastVerified: 'Ultima verifica', reviewCadence: 'Cadenza revisione', stableId: 'ID stabile', statementStatus: 'Stato dichiarazione', claimType: 'Tipo claim',
    storyLabel: 'Temi editoriali', storyTitle: 'Temi supportati dalle informazioni sul prodotto e sulle policy.',
    storyAngles: [
      ['Trasparenza AI', 'L articolo 50 trasforma la trasparenza in una domanda operativa: cosa dichiarare, a chi e con quali evidenze?'],
      ['Privacy e operazioni legali', 'Il prodotto registra provenienza, stato di revisione e modifiche ai testi per le fonti configurate.'],
      ['Qualita dati e engineering', 'Gate evidenze, sospensione fonti e gestione dei valori mancanti sono controlli documentati.'],
      ['Civic tech e governance aperta', 'Un repository pubblico CC BY 4.0 rende il metodo ispezionabile senza implicare certificazione OSI.'],
    ],
    assetsLabel: 'File media proprietari', assetsTitle: 'File disponibili per uso editoriale.',
    assetsLead: 'Qui compaiono solo asset PolicyWatcher. Gli screenshot della copertura di terzi restano riferimenti nella Press Wall.',
    download: 'Scarica', noCredentials: 'Content Credentials non allegati',
    checksumNote: 'SHA-256 conferma solo l integrita del file. Non prova verita semantica, provenienza autoriale o endorsement.',
    boilerLabel: 'Boilerplate e citazione', boilerTitle: 'Descrizioni e dettagli per la citazione.',
    short: 'Boilerplate breve', long: 'Boilerplate lungo', copyAction: 'Copia testo',
    citation: 'Citazione suggerita',
    citationText: `PolicyWatcher, ${POLICYWATCHER_VERSION_DISPLAY} ${POLICYWATCHER_RELEASE_NAME}, 2 agosto 2026, https://policywatcher.online/press-kit (consultato il [data]).`,
    corrections: 'Correzioni e domande fattuali: info@policywatcher.online. Includere URL citato e affermazione da verificare.',
    founderLabel: 'Fondatore e contatti', founderTitle: 'Fabrizio Degni',
    founderBio: 'Builder indipendente di strumenti di interesse pubblico per ispezionare e discutere i cambiamenti delle policy digitali con link alle fonti.',
    portraitNote: 'Ritratto disponibile: 200 x 200 px, adatto a piccoli usi digitali.',
    coverageLabel: 'Perimetro e limiti', coverageTitle: 'Limiti dichiarati delle informazioni disponibili.',
    boundaries: ['Non e consulenza legale o certificazione di conformita.', 'L inventario configurato non e copertura esaustiva.', 'La freschezza dipende dalla fonte, non e in tempo reale.', 'L analisi assistita da AI puo essere incompleta o errata.', 'Le menzioni esterne non sono endorsement o audit indipendenti.'],
    json: 'Press kit machine-readable', manifest: 'Manifest asset', coverageWall: 'Rassegna pubblica', trust: 'Evidenze Trust', method: 'Metodologia', timeline: 'Timeline policy', featureAtlas: 'Feature Atlas', releaseSurface: 'Impatto release',
  },
} as const;

const angleIcons = [Sparkles, Scale, Code2, BookOpen] as const;
const deskIcons = [FileArchive, FileCheck2, Archive, Database, Mail] as const;
const deskHrefs = ['#press-packages', '#claim-registry', '/press-kit/releases', '/press-kit/data', '#contact-routing'] as const;
const contactIcons = [Newspaper, FileCheck2, MessageSquareQuote, Mic2] as const;
const pressAssetImageSizes: Record<string, { width: number; height: number }> = {
  'logo-mark': { width: 512, height: 512 },
  'wordmark-dark': { width: 2400, height: 600 },
  'wordmark-light': { width: 2400, height: 600 },
  'logo-square': { width: 1024, height: 1024 },
  'founder-portrait': { width: 200, height: 200 },
  'founder-portrait-high-resolution': { width: 2400, height: 2400 },
  'founder-portrait-ai-restored': { width: 2400, height: 2400 },
  'logo-editorial-svg': { width: 2400, height: 2400 },
  'beta27-knowledge-screenshot': { width: 1440, height: 1000 },
  'beta27-release-screenshot': { width: 1440, height: 1000 },
  'beta27-press-kit-screenshot': { width: 1440, height: 1000 },
  'beta27-pulse-screenshot': { width: 1440, height: 1000 },
  'beta27-data-room-screenshot': { width: 1440, height: 1000 },
  'two-week-progress': { width: 866, height: 1817 },
  'feature-atlas-screenshot': { width: 1440, height: 1000 },
  'release-impact-screenshot': { width: 1440, height: 1000 },
};

export default function PressKitClient() {
  const [lang, setLang] = useState<PressKitLocale>('en');
  const [copied, setCopied] = useState<string | null>(null);
  const [copyFailure, setCopyFailure] = useState<string | null>(null);
  const t = copy[lang];

  async function copyText(id: string, value: string) {
    let copySucceeded = false;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(value);
      copySucceeded = true;
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = value;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      try {
        textarea.select();
        copySucceeded = document.execCommand('copy');
      } catch {
        copySucceeded = false;
      } finally {
        textarea.remove();
      }
    }

    if (!copySucceeded) {
      setCopied(null);
      setCopyFailure(id);
      window.setTimeout(() => setCopyFailure((current) => current === id ? null : current), 5000);
      return;
    }

    setCopyFailure(null);
    setCopied(id);
    window.setTimeout(() => setCopied((current) => current === id ? null : current), 1800);
  }

  return (
    <div className={styles.page} lang={lang}>
      <PublicHeader current="press-kit" lang={lang} />
      <main>
        <section className={styles.hero} aria-labelledby="press-kit-title">
          <div className={styles.heroCopy}>
            <div className={styles.heroMeta}>
              <span><Radio size={14} />{t.kicker}</span>
              <button type="button" onClick={() => setLang(lang === 'en' ? 'it' : 'en')}>
                <Languages size={15} />{t.switchLanguage}
              </button>
            </div>
            <p className={styles.releaseBadge}>{POLICYWATCHER_RELEASE_BADGE} · {POLICYWATCHER_RELEASE_DATE}</p>
            <h1 id="press-kit-title">{t.title}</h1>
            <p className={styles.heroLead}>{t.lead}</p>
            <div className={styles.heroActions}>
              <a href={`/press-kit/policywatcher-fact-sheet-${lang}-${POLICYWATCHER_RELEASE_DATE}.pdf`} download><Download size={16} />{t.factSheet}</a>
              <button type="button" onClick={() => void copyText('hero-short', pressKitBoilerplates.short[lang])}>
                {copied === 'hero-short' ? <Check size={16} /> : <Clipboard size={16} />}{copied === 'hero-short' ? t.copied : t.copyShort}
              </button>
              <a href="#media-assets"><FileText size={16} />{t.browseAssets}</a>
              <a href="mailto:info@policywatcher.online?subject=PolicyWatcher%20press" onClick={() => recordPressMetric('press_contact_intent', 'press', lang)}><Mail size={16} />{t.contactPress}</a>
            </div>
          </div>
          <aside className={styles.statusPanel} aria-label={t.statusTitle}>
            <header><span>{t.statusTitle}</span><strong>{POLICYWATCHER_VERSION_DISPLAY}</strong></header>
            <dl>
              <div><dt><CheckCircle2 size={15} />{t.releaseFreshness}</dt><dd>{t.releaseFreshnessBody}</dd></div>
              <div><dt><Radio size={15} />{t.evidenceFreshness}</dt><dd>{t.evidenceFreshnessBody}</dd></div>
              <div><dt><Code2 size={15} />{t.extension}</dt><dd>{POLICYWATCHER_BROWSER_EXTENSION_DISPLAY_VERSION}: {POLICYWATCHER_BROWSER_EXTENSION_RELEASE_STATUS[lang]}.</dd></div>
            </dl>
          </aside>
        </section>

        <section className={styles.fastFacts} aria-labelledby="fast-facts-title">
          <h2 id="fast-facts-title">{t.quickFacts}</h2>
          <div>
            {pressKitFacts.map((fact) => (
              <article key={`fast-${fact.id}`}>
                <strong>{fact.value}</strong>
                <span>{fact.label[lang]}</span>
              </article>
            ))}
          </div>
          <a href="#claim-registry">{lang === 'en' ? 'Open dated claim registry' : 'Apri il registro claim datato'}<ArrowRight size={13} /></a>
        </section>

        <section className={styles.actionRail} aria-label={t.deskLabel}>
          <header>
            <span>{t.deskLabel}</span>
            <p>{t.deskLead}</p>
          </header>
          <nav aria-label={t.deskLabel} aria-describedby="action-rail-cue">
            {t.deskActions.map(([label, detail], index) => {
              const Icon = deskIcons[index];
              return (
                <Link key={label} href={deskHrefs[index]}>
                  <Icon size={18} aria-hidden="true" />
                  <span><strong>{label}</strong><small>{detail}</small></span>
                </Link>
              );
            })}
          </nav>
          <p id="action-rail-cue" className={styles.actionRailCue}>{t.deskOverflowCue}<ArrowRight size={14} aria-hidden="true" /></p>
        </section>

        <section id="press-packages" className={styles.packages} aria-labelledby="packages-title">
          <div className={styles.sectionIntro}><span>01 / {t.packagesLabel}</span><h2 id="packages-title">{t.packagesTitle}</h2><p>{t.packagesLead}</p></div>
          <div className={styles.packageGrid}>
            {pressKitPackages.map((pressPackage) => (
              <article className={styles.packageCard} key={pressPackage.id}>
                <div className={styles.packageLocale}>{pressPackage.locale.toUpperCase()}</div>
                <div className={styles.packageBody}>
                  <span>{pressPackage.filename}</span>
                  <h3>{pressPackage.title[lang]}</h3>
                  <p>{pressPackage.boundary[lang]}</p>
                  <ul aria-label={t.packageContents}>{pressPackage.contents.map((item) => <li key={item.en}><CheckCircle2 size={13} />{item[lang]}</li>)}</ul>
                  <dl className={styles.packageMeta}>
                    <div><dt>{t.packageVersion}</dt><dd>{pressPackage.version}</dd></div>
                    <div><dt>{t.packageGenerated}</dt><dd>{pressPackage.generatedAt}</dd></div>
                    <div><dt>{t.packageChecksum}</dt><dd>{pressPackage.sha256}</dd></div>
                  </dl>
                  <a className={styles.packageDownload} href={pressPackage.href} download onClick={() => recordPressMetric('press_package_download', pressPackage.locale, lang)}><Download size={14} />{t.download}</a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.facts} aria-labelledby="facts-title">
          <div className={styles.sectionIntro}><span>02 / Facts</span><h2 id="facts-title">{t.factsTitle}</h2><p>{t.factsLead}</p></div>
          <div className={styles.factRail}>{pressKitFacts.map((fact) => <article id={`fact-${fact.id}`} key={fact.id}><strong>{fact.value}</strong><h3>{fact.label[lang]}</h3><p>{fact.scope[lang]}</p><a className={styles.claimId} href={fact.permalink}><Tags size={11} />{fact.id}</a></article>)}</div>
        </section>

        <section className={styles.whyNow} aria-labelledby="why-now-title">
          <div className={styles.articleHook}>
            <span>{t.whyNow}</span><h2 id="why-now-title">{t.whyTitle}</h2><p>{t.whyBody}</p>
            <a href={PRESS_KIT_ARTICLE_50_URL} target="_blank" rel="noopener noreferrer">{t.officialSource}<ExternalLink size={15} /></a>
          </div>
          <div className={styles.pillarList}>{t.pillars.map(([title, body], index) => <article key={title}><span>0{index + 1}</span><div><h3>{title}</h3><p>{body}</p></div></article>)}</div>
        </section>

        <section className={styles.cycle} aria-labelledby="cycle-title">
          <div className={styles.sectionIntro}><span>03 / Release evidence</span><h2 id="cycle-title">{t.cycleTitle}</h2><p>{t.cycleLabel}</p></div>
          <ol>{pressKitCycleItems.map((item, index) => <li key={item.en}><span>{String(index + 1).padStart(2, '0')}</span><p>{item[lang]}</p></li>)}</ol>
        </section>

        <section className={styles.releasePreview} aria-labelledby="release-preview-title">
          <div className={styles.sectionIntro}><span>04 / Newsroom</span><h2 id="release-preview-title">{lang === 'en' ? 'Latest dated release record.' : 'Ultimo record release datato.'}</h2><p>{lang === 'en' ? 'Release information keeps its publication date, evidence links and stated boundaries.' : 'Le informazioni di release mantengono data di pubblicazione, link alle evidenze e limiti dichiarati.'}</p></div>
          {pressKitReleases.slice(0, 1).map((release) => (
            <div className={styles.releaseLayout} key={release.slug}>
              <article className={styles.releaseCard}>
                <header><span>{release.displayVersion} · {release.category}</span><time dateTime={release.datePublished}>{release.datePublished}</time></header>
                <h3>{release.title[lang]}</h3>
                <p>{release.summary[lang]}</p>
                <dl className={styles.releaseMeta}><div><dt>{t.status}</dt><dd>{release.status}</dd></div><div><dt>{t.lastVerified}</dt><dd>{release.dateModified}</dd></div></dl>
                <Link className={styles.releaseLink} href={`/press-kit/releases/${release.slug}`}>{lang === 'en' ? 'Read release record' : 'Leggi record release'}<ArrowRight size={13} /></Link>
              </article>
              <aside className={styles.releaseIndex} aria-label={t.cycleTitle}><span>{t.cycleTitle}</span><ul>{release.changes.slice(0, 5).map((change, index) => <li key={change.en}><span>{String(index + 1).padStart(2, '0')}</span>{change[lang]}</li>)}</ul></aside>
            </div>
          ))}
          <Link className={styles.subpageAction} href="/press-kit/releases"><Archive size={14} />{t.releaseArchive}</Link>
        </section>

        <section id="claim-registry" className={styles.ledger} aria-labelledby="ledger-title">
          <div className={styles.sectionIntro}><span>05 / {t.ledgerLabel}</span><h2 id="ledger-title">{t.ledgerTitle}</h2><p>{t.ledgerLead}</p></div>
          <div className={styles.ledgerTable} role="table" aria-label={t.ledgerLabel}>
            <div className={styles.ledgerHead} role="row"><span role="columnheader">{t.claim}</span><span role="columnheader">{t.status}</span><span role="columnheader">{t.verified}</span><span role="columnheader">{t.proof}</span><span role="columnheader">{t.boundary}</span></div>
            {pressKitClaims.map((claim, index) => <article id={`claim-${claim.id}`} key={claim.id} className={styles.ledgerRow} role="row">
              <div role="cell"><small>{String(index + 1).padStart(2, '0')}</small><strong>{claim.claim[lang]}</strong><a className={styles.claimId} href={claim.permalink}><Tags size={11} />{claim.id}</a></div>
              <div role="cell" data-label={t.status}><span className={styles.recordStatus} data-status={claim.recordStatus}>{claim.recordStatus}</span><dl className={styles.statusRecord}><div><dt>{t.statementStatus}</dt><dd>{claim.status[lang]}</dd></div><div><dt>{t.claimType}</dt><dd>{claim.type}</dd></div></dl></div>
              <dl className={styles.registryRecord} role="cell"><div><dt>{t.asOf}</dt><dd>{claim.asOf}</dd></div><div><dt>{t.lastVerified}</dt><dd>{claim.verifiedAt}</dd></div><div><dt>{t.reviewCadence}</dt><dd>{claim.reviewCadence[lang]}</dd></div></dl>
              <div role="cell" data-label={t.proof}>{claim.proofHref.startsWith('http') ? <a href={claim.proofHref} target="_blank" rel="noopener noreferrer">{claim.proofLabel[lang]}<ExternalLink size={13} /></a> : <Link href={claim.proofHref}>{claim.proofLabel[lang]}<ArrowRight size={13} /></Link>}</div>
              <p role="cell" data-label={t.boundary}>{claim.boundary[lang]}</p>
            </article>)}
          </div>
        </section>

        <section className={styles.dataPreview} aria-labelledby="data-preview-title">
          <div className={styles.sectionIntro}><span>06 / Data room</span><h2 id="data-preview-title">{lang === 'en' ? 'Published snapshots and reusable formats.' : 'Snapshot pubblicati e formati riutilizzabili.'}</h2><p>{lang === 'en' ? 'Each record states its date, method, citation and reuse boundary. Only listed formats are available.' : 'Ogni record indica data, metodo, citazione e limite di riuso. Sono disponibili solo i formati elencati.'}</p></div>
          <div className={styles.dataGrid}>
            {pressKitDataSnapshots.slice(0, 3).map((snapshot) => (
              <article className={styles.dataCard} key={snapshot.id}>
                <header><span>{snapshot.id}</span><time dateTime={snapshot.asOf}>{snapshot.asOf}</time></header>
                <h3>{snapshot.title[lang]}</h3>
                <p>{snapshot.description[lang]}</p>
                <div className={styles.formatList}>{snapshot.files.map((file) => <a href={file.href} download key={file.format}>{file.format}<Download size={11} /></a>)}</div>
              </article>
            ))}
          </div>
          <p className={styles.dataBoundary}><CalendarClock size={15} />{lang === 'en' ? 'Snapshots remain tied to their listed date; they are not live or exhaustive market data.' : 'Gli snapshot restano legati alla data indicata; non sono dati live o copertura esaustiva del mercato.'}</p>
          <Link className={styles.subpageAction} href="/press-kit/data"><Database size={14} />{t.dataRoom}</Link>
        </section>

        <section className={styles.stories} aria-labelledby="stories-title">
          <div className={styles.sectionIntro}><span>07 / {t.storyLabel}</span><h2 id="stories-title">{t.storyTitle}</h2></div>
          <div className={styles.storyGrid}>{t.storyAngles.map(([title, body], index) => { const Icon = angleIcons[index]; return <article key={title}><Icon size={21} /><span>Angle {String(index + 1).padStart(2, '0')}</span><h3>{title}</h3><p>{body}</p></article>; })}</div>
        </section>

        <section id="media-assets" className={styles.assets} aria-labelledby="assets-title">
          <div className={styles.sectionIntro}><span>08 / {t.assetsLabel}</span><h2 id="assets-title">{t.assetsTitle}</h2><p>{t.assetsLead}</p></div>
          <div className={styles.assetGrid}>{pressKitAssets.map((asset) => <article key={asset.id}>
            <div className={styles.assetPreview}>{asset.mediaType.startsWith('image/') ? <Image src={asset.href} alt={asset.alt[lang]} width={pressAssetImageSizes[asset.id].width} height={pressAssetImageSizes[asset.id].height} loading="lazy" sizes="(max-width: 640px) calc(100vw - 24px), (max-width: 980px) 50vw, 66vw" unoptimized /> : <FileCheck2 size={44} aria-hidden="true" />}</div>
            <div className={styles.assetBody}><span>{asset.mediaType} · {asset.dimensions ?? 'text'}</span><h3>{asset.title[lang]}</h3><p>{asset.caption[lang]}</p><small>{asset.usageBoundary[lang]}</small><code>sha256 {asset.sha256.slice(0, 18)}…</code><div><a href={asset.href} download><Download size={14} />{t.download}</a><span><ShieldCheck size={13} />{t.noCredentials}</span></div></div>
          </article>)}</div>
          <p className={styles.checksumNote}><ShieldCheck size={16} />{t.checksumNote} <a href="/press-kit/asset-manifest.json">{t.manifest}</a></p>
        </section>

        <section className={styles.boilerplates} aria-labelledby="boiler-title">
          <div className={styles.sectionIntro}><span>09 / {t.boilerLabel}</span><h2 id="boiler-title">{t.boilerTitle}</h2></div>
          <div className={styles.boilerGrid}>{(['short', 'long'] as const).map((length) => <article key={length}><header><span>{length === 'short' ? t.short : t.long}</span><button type="button" onClick={() => void copyText(length, pressKitBoilerplates[length][lang])}>{copied === length ? <Check size={14} /> : <Clipboard size={14} />}{copied === length ? t.copied : t.copyAction}</button></header><p>{pressKitBoilerplates[length][lang]}</p></article>)}</div>
          <div className={styles.citation}><div><Newspaper size={18} /><span>{t.citation}</span></div><p>{t.citationText}</p><button type="button" onClick={() => void copyText('citation', t.citationText)}>{copied === 'citation' ? <Check size={14} /> : <Clipboard size={14} />}{copied === 'citation' ? t.copied : t.copyAction}</button><small>{t.corrections}</small></div>
        </section>

        <section id="contact-routing" className={styles.contactRouting} aria-labelledby="contact-routing-title">
          <div className={styles.sectionIntro}><span>10 / {t.contactRouting}</span><h2 id="contact-routing-title">{t.contactTitle}</h2><p>{t.contactLead}</p></div>
          <div className={styles.contactGrid}>
            {pressKitContactRoutes.map((route, index) => {
              const Icon = contactIcons[index];
              return (
                <article className={styles.contactCard} key={route.id}>
                  <header><Icon size={20} /><span className={styles.subpageEyebrow}>{route.id}</span></header>
                  <h3>{route.title[lang]}</h3>
                  <p>{route.description[lang]}</p>
                  <small><strong>{t.requestedContext}:</strong> {route.requestedContext[lang]}</small>
                  <a href={route.href[lang]} onClick={() => recordPressMetric('press_contact_intent', route.id, lang)}><Mail size={14} />{t.sendRequest}</a>
                </article>
              );
            })}
          </div>
          <nav className={styles.referenceLinks} aria-label={t.referenceTitle}>
            <Link href="/press-kit/reference#provenance">{t.provenance}<ShieldCheck size={14} /></Link>
            <Link href="/press-kit/corrections">{t.correctionsLog}<FileCheck2 size={14} /></Link>
            <Link href="/press-kit/glossary">{t.glossary}<BookOpen size={14} /></Link>
          </nav>
        </section>

        <section className={styles.founder} aria-labelledby="founder-title">
          <Image src="/press-kit/fabrizio-degni-portrait-2400-source-upscale.png" alt={lang === 'en' ? 'Portrait of Fabrizio Degni' : 'Ritratto di Fabrizio Degni'} width={200} height={200} loading="eager" sizes="200px" unoptimized />
          <div><span>{t.founderLabel}</span><h2 id="founder-title">{t.founderTitle}</h2><p>{t.founderBio}</p><small>{t.portraitNote}</small><nav aria-label={t.founderLabel}><a href="mailto:info@policywatcher.online"><Mail size={15} />info@policywatcher.online</a><a href="https://linkedin.com/in/fabriziodegni" target="_blank" rel="noopener noreferrer"><ExternalLink size={15} />LinkedIn</a><a href={PRESS_KIT_REPOSITORY_URL} target="_blank" rel="noopener noreferrer"><GitFork size={15} />GitHub</a></nav></div>
        </section>

        <section className={styles.boundaries} aria-labelledby="boundaries-title">
          <div><span>{t.coverageLabel}</span><h2 id="boundaries-title">{t.coverageTitle}</h2><ul>{t.boundaries.map((boundary) => <li key={boundary}><CheckCircle2 size={15} />{boundary}</li>)}</ul></div>
          <nav aria-label={t.coverageLabel}><Link href="/press-kit/releases">{t.releaseArchive}<ArrowRight size={14} /></Link><Link href="/press-kit/data">{t.dataRoom}<ArrowRight size={14} /></Link><Link href="/press-kit/reference">{t.referenceTitle}<ArrowRight size={14} /></Link><Link href="/press">{t.coverageWall}<ArrowRight size={14} /></Link><Link href="/trust">{t.trust}<ArrowRight size={14} /></Link><Link href="/methodology/confidence">{t.method}<ArrowRight size={14} /></Link><Link href="/timeline">{t.timeline}<ArrowRight size={14} /></Link><Link href="/feature-atlas">{t.featureAtlas}<ArrowRight size={14} /></Link><Link href="/roadmap">{t.releaseSurface}<ArrowRight size={14} /></Link><a href={PRESS_KIT_JSON_URL}>{t.json}<Download size={14} /></a></nav>
        </section>
        <div className={styles.copyStatus} role="status" aria-live="polite" aria-atomic="true">
          {copyFailure ? `${t.copyFailed} ${t.manualCopy}` : copied ? t.copied : ''}
        </div>
      </main>
      <Footer lang={lang} variant="compact" />
    </div>
  );
}
