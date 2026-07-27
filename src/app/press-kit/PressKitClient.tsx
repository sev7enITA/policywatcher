'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Clipboard,
  Code2,
  Download,
  ExternalLink,
  FileCheck2,
  FileText,
  GitFork,
  Languages,
  Mail,
  Newspaper,
  Radio,
  Scale,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import Footer from '@/components/Footer';
import PublicHeader from '@/components/PublicHeader';
import {
  POLICYWATCHER_BROWSER_EXTENSION_DISPLAY_VERSION,
  POLICYWATCHER_BROWSER_EXTENSION_RELEASE_STATUS,
  POLICYWATCHER_RELEASE_BADGE,
  POLICYWATCHER_RELEASE_NAME,
  POLICYWATCHER_VERSION_DISPLAY,
} from '@/lib/release';
import {
  PRESS_KIT_ARTICLE_50_URL,
  PRESS_KIT_JSON_URL,
  PRESS_KIT_RELEASE_DATE,
  PRESS_KIT_REPOSITORY_URL,
  pressKitAssets,
  pressKitBoilerplates,
  pressKitClaims,
  pressKitCycleItems,
  pressKitFacts,
  type PressKitLocale,
} from '@/lib/pressKit';
import styles from './pressKit.module.css';

const copy = {
  en: {
    switchLanguage: 'Italiano',
    kicker: 'PolicyWatcher editorial briefing room',
    title: 'Evidence, not hype.',
    lead: 'A publication-ready newsroom for verifying what PolicyWatcher does, where the proof lives, and what every claim does not establish.',
    currentRelease: 'Current web release',
    releaseDate: 'Released 27 July 2026',
    factSheet: 'Download fact sheet',
    copyShort: 'Copy short boilerplate',
    copied: 'Copied',
    copyFailed: 'Copy failed.',
    manualCopy: 'Select the text and copy it manually.',
    browseAssets: 'Browse assets',
    contactPress: 'Contact press',
    statusTitle: 'Briefing status',
    releaseFreshness: 'Release metadata',
    releaseFreshnessBody: 'Current to 27 July 2026 for the web application.',
    evidenceFreshness: 'Platform evidence',
    evidenceFreshnessBody: 'Source-specific timestamps; not a global real-time claim.',
    extension: 'Extension track',
    factsTitle: 'The useful facts, with their scope attached.',
    factsLead: 'These figures describe configured product inventory and method, not exhaustive market coverage.',
    whyNow: 'Why now',
    whyTitle: 'AI transparency is moving from principle to operational detail.',
    whyBody: 'European Commission guidance published on 20 July and updated on 24 July addresses Article 50 transparency obligations that apply from 2 August 2026. This is editorial context, not proof of PolicyWatcher or provider compliance.',
    officialSource: 'Read the Commission source',
    pillars: [
      ['Transparency', 'Keep public claims connected to source status, dates and exact evidence.'],
      ['Explainability', 'Show why an analytical signal appears and where interpretation remains uncertain.'],
      ['Data Quality', 'Withhold incomplete evidence and preserve Not assessed instead of manufacturing zero.'],
    ],
    cycleLabel: 'Latest two-week development cycle',
    cycleTitle: 'The newsroom reflects the product that exists now.',
    ledgerLabel: 'Claim Ledger',
    ledgerTitle: 'Every claim carries its proof and boundary.',
    ledgerLead: 'Use the proof link when citing. Keep the limitation with the claim.',
    claim: 'Public statement', status: 'Status / type', proof: 'Proof', boundary: 'Boundary',
    storyLabel: 'Story angles', storyTitle: 'Four reporting paths grounded in evidence.',
    storyAngles: [
      ['AI transparency', 'Article 50 turns transparency into an operational reporting question: what must be disclosed, to whom, and with what evidence?'],
      ['Privacy and legal operations', 'Policy changes are not useful as alerts alone; legal teams need source provenance, review state and exact wording.'],
      ['Data and engineering quality', 'Evidence gates, source suspension and missing-value semantics are product decisions, not backstage implementation details.'],
      ['Civic tech and open governance', 'A public, CC BY 4.0 repository makes the monitoring method inspectable without implying OSI certification.'],
    ],
    assetsLabel: 'Owned media assets', assetsTitle: 'Downloadable files with honest provenance.',
    assetsLead: 'Only PolicyWatcher-owned assets appear here. Third-party coverage screenshots remain references on the Press Wall.',
    download: 'Download', noCredentials: 'Content Credentials not attached',
    checksumNote: 'SHA-256 confirms file integrity only. It does not prove semantic truth, authorship provenance or endorsement.',
    boilerLabel: 'Boilerplates and citation', boilerTitle: 'Copy, cite, then verify.',
    short: 'Short boilerplate', long: 'Long boilerplate', copyAction: 'Copy text',
    citation: 'Suggested citation',
    citationText: `PolicyWatcher, ${POLICYWATCHER_VERSION_DISPLAY} ${POLICYWATCHER_RELEASE_NAME}, 27 July 2026, https://policywatcher.online/press-kit (accessed [date]).`,
    corrections: 'Corrections and factual questions: info@policywatcher.online. Include the cited URL and the statement requiring review.',
    founderLabel: 'Founder and contact', founderTitle: 'Fabrizio Degni',
    founderBio: 'Independent builder working on public-interest tools that make digital-policy change easier to inspect, discuss and verify at the source.',
    portraitNote: 'Available portrait: 200 x 200 px, suitable for small digital placements.',
    coverageLabel: 'Coverage and boundaries', coverageTitle: 'A newsroom is useful only if its limits remain visible.',
    boundaries: ['Not legal advice or compliance certification.', 'Configured inventory is not exhaustive coverage.', 'Evidence freshness is source-specific, not real-time.', 'AI-assisted analysis can be incomplete or incorrect.', 'External mentions are not endorsements or independent audits.'],
    json: 'Machine-readable press kit', manifest: 'Asset manifest', coverageWall: 'Coverage wall', trust: 'Trust evidence', method: 'Methodology', timeline: 'Policy timeline', featureAtlas: 'Feature Atlas', releaseSurface: 'Release impact',
  },
  it: {
    switchLanguage: 'English',
    kicker: 'Sala stampa editoriale PolicyWatcher',
    title: 'Evidenze, non hype.',
    lead: 'Una newsroom pronta per la pubblicazione, per verificare cosa fa PolicyWatcher, dove si trova la prova e cosa ogni affermazione non dimostra.',
    currentRelease: 'Release web corrente',
    releaseDate: 'Rilasciata il 27 luglio 2026',
    factSheet: 'Scarica la scheda stampa',
    copyShort: 'Copia boilerplate breve',
    copied: 'Copiato',
    copyFailed: 'Copia non riuscita.',
    manualCopy: 'Seleziona il testo e copialo manualmente.',
    browseAssets: 'Sfoglia gli asset',
    contactPress: 'Contatto stampa',
    statusTitle: 'Stato briefing',
    releaseFreshness: 'Metadata release',
    releaseFreshnessBody: 'Correnti al 27 luglio 2026 per l applicazione web.',
    evidenceFreshness: 'Evidenze piattaforma',
    evidenceFreshnessBody: 'Timestamp specifici delle fonti; non una dichiarazione globale in tempo reale.',
    extension: 'Track estensione',
    factsTitle: 'I fatti utili, con il loro perimetro.',
    factsLead: 'Questi numeri descrivono inventario configurato e metodo, non copertura esaustiva del mercato.',
    whyNow: 'Perche ora',
    whyTitle: 'La trasparenza AI passa dai principi ai dettagli operativi.',
    whyBody: 'Le linee guida della Commissione europea pubblicate il 20 luglio e aggiornate il 24 luglio trattano gli obblighi di trasparenza dell articolo 50 applicabili dal 2 agosto 2026. E contesto editoriale, non prova di conformita di PolicyWatcher o dei provider.',
    officialSource: 'Leggi la fonte Commissione',
    pillars: [
      ['Trasparenza', 'Collegare le affermazioni pubbliche a stato fonte, date ed evidenze esatte.'],
      ['Spiegabilita', 'Mostrare perche appare un segnale analitico e dove resta incertezza.'],
      ['Qualita dati', 'Trattenere evidenze incomplete e mantenere Non valutato senza produrre uno zero.'],
    ],
    cycleLabel: 'Ultimo ciclo di sviluppo di due settimane',
    cycleTitle: 'La newsroom riflette il prodotto disponibile oggi.',
    ledgerLabel: 'Registro delle affermazioni',
    ledgerTitle: 'Ogni affermazione porta prova e limite.',
    ledgerLead: 'Usa il link alla prova quando citi. Mantieni il limite insieme all affermazione.',
    claim: 'Affermazione pubblica', status: 'Stato / tipo', proof: 'Prova', boundary: 'Limite',
    storyLabel: 'Angoli editoriali', storyTitle: 'Quattro percorsi giornalistici basati su evidenze.',
    storyAngles: [
      ['Trasparenza AI', 'L articolo 50 trasforma la trasparenza in una domanda operativa: cosa dichiarare, a chi e con quali evidenze?'],
      ['Privacy e operazioni legali', 'Gli alert non bastano: i team legali richiedono provenienza, stato revisione e formulazione esatta.'],
      ['Qualita dati e engineering', 'Gate evidenze, sospensione fonti e semantica dei valori mancanti sono decisioni di prodotto.'],
      ['Civic tech e governance aperta', 'Un repository pubblico CC BY 4.0 rende il metodo ispezionabile senza implicare certificazione OSI.'],
    ],
    assetsLabel: 'Asset media proprietari', assetsTitle: 'File scaricabili con provenienza onesta.',
    assetsLead: 'Qui compaiono solo asset PolicyWatcher. Gli screenshot della copertura di terzi restano riferimenti nella Press Wall.',
    download: 'Scarica', noCredentials: 'Content Credentials non allegati',
    checksumNote: 'SHA-256 conferma solo l integrita del file. Non prova verita semantica, provenienza autoriale o endorsement.',
    boilerLabel: 'Boilerplate e citazione', boilerTitle: 'Copia, cita, poi verifica.',
    short: 'Boilerplate breve', long: 'Boilerplate lungo', copyAction: 'Copia testo',
    citation: 'Citazione suggerita',
    citationText: `PolicyWatcher, ${POLICYWATCHER_VERSION_DISPLAY} ${POLICYWATCHER_RELEASE_NAME}, 27 luglio 2026, https://policywatcher.online/press-kit (consultato il [data]).`,
    corrections: 'Correzioni e domande fattuali: info@policywatcher.online. Includere URL citato e affermazione da verificare.',
    founderLabel: 'Fondatore e contatti', founderTitle: 'Fabrizio Degni',
    founderBio: 'Builder indipendente di strumenti di interesse pubblico che rendono i cambiamenti delle policy digitali piu facili da ispezionare, discutere e verificare alla fonte.',
    portraitNote: 'Ritratto disponibile: 200 x 200 px, adatto a piccoli usi digitali.',
    coverageLabel: 'Copertura e limiti', coverageTitle: 'Una newsroom e utile solo se i limiti restano visibili.',
    boundaries: ['Non e consulenza legale o certificazione di conformita.', 'L inventario configurato non e copertura esaustiva.', 'La freschezza dipende dalla fonte, non e in tempo reale.', 'L analisi assistita da AI puo essere incompleta o errata.', 'Le menzioni esterne non sono endorsement o audit indipendenti.'],
    json: 'Press kit machine-readable', manifest: 'Manifest asset', coverageWall: 'Rassegna pubblica', trust: 'Evidenze Trust', method: 'Metodologia', timeline: 'Timeline policy', featureAtlas: 'Feature Atlas', releaseSurface: 'Impatto release',
  },
} as const;

const angleIcons = [Sparkles, Scale, Code2, BookOpen] as const;
const pressAssetImageSizes: Record<string, { width: number; height: number }> = {
  'logo-mark': { width: 512, height: 512 },
  'logo-square': { width: 1024, height: 1024 },
  'founder-portrait': { width: 200, height: 200 },
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
    <div className={styles.page}>
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
            <p className={styles.releaseBadge}>{POLICYWATCHER_RELEASE_BADGE} · {PRESS_KIT_RELEASE_DATE}</p>
            <h1 id="press-kit-title">{t.title}</h1>
            <p className={styles.heroLead}>{t.lead}</p>
            <div className={styles.heroActions}>
              <a href="/press-kit/policywatcher-fact-sheet-2026-07-27.md" download><Download size={16} />{t.factSheet}</a>
              <button type="button" onClick={() => void copyText('hero-short', pressKitBoilerplates.short[lang])}>
                {copied === 'hero-short' ? <Check size={16} /> : <Clipboard size={16} />}{copied === 'hero-short' ? t.copied : t.copyShort}
              </button>
              <a href="#media-assets"><FileText size={16} />{t.browseAssets}</a>
              <a href="mailto:info@policywatcher.online?subject=PolicyWatcher%20press"><Mail size={16} />{t.contactPress}</a>
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

        <section className={styles.facts} aria-labelledby="facts-title">
          <div className={styles.sectionIntro}><span>01 / Facts</span><h2 id="facts-title">{t.factsTitle}</h2><p>{t.factsLead}</p></div>
          <div className={styles.factRail}>{pressKitFacts.map((fact) => <article key={fact.value + fact.label.en}><strong>{fact.value}</strong><h3>{fact.label[lang]}</h3><p>{fact.scope[lang]}</p></article>)}</div>
        </section>

        <section className={styles.whyNow} aria-labelledby="why-now-title">
          <div className={styles.articleHook}>
            <span>{t.whyNow}</span><h2 id="why-now-title">{t.whyTitle}</h2><p>{t.whyBody}</p>
            <a href={PRESS_KIT_ARTICLE_50_URL} target="_blank" rel="noopener noreferrer">{t.officialSource}<ExternalLink size={15} /></a>
          </div>
          <div className={styles.pillarList}>{t.pillars.map(([title, body], index) => <article key={title}><span>0{index + 1}</span><div><h3>{title}</h3><p>{body}</p></div></article>)}</div>
        </section>

        <section className={styles.cycle} aria-labelledby="cycle-title">
          <div className={styles.sectionIntro}><span>02 / Release evidence</span><h2 id="cycle-title">{t.cycleTitle}</h2><p>{t.cycleLabel}</p></div>
          <ol>{pressKitCycleItems.map((item, index) => <li key={item.en}><span>{String(index + 1).padStart(2, '0')}</span><p>{item[lang]}</p></li>)}</ol>
        </section>

        <section className={styles.ledger} aria-labelledby="ledger-title">
          <div className={styles.sectionIntro}><span>03 / {t.ledgerLabel}</span><h2 id="ledger-title">{t.ledgerTitle}</h2><p>{t.ledgerLead}</p></div>
          <div className={styles.ledgerTable} role="table" aria-label={t.ledgerLabel}>
            <div className={styles.ledgerHead} role="row"><span role="columnheader">{t.claim}</span><span role="columnheader">{t.status}</span><span role="columnheader">{t.proof}</span><span role="columnheader">{t.boundary}</span></div>
            {pressKitClaims.map((claim, index) => <article key={claim.id} className={styles.ledgerRow} role="row">
              <div role="cell"><small>{String(index + 1).padStart(2, '0')}</small><strong>{claim.claim[lang]}</strong></div>
              <div role="cell"><span data-type={claim.type}>{claim.status[lang]}</span><small>{claim.type}</small></div>
              <div role="cell">{claim.proofHref.startsWith('http') ? <a href={claim.proofHref} target="_blank" rel="noopener noreferrer">{claim.proofLabel[lang]}<ExternalLink size={13} /></a> : <Link href={claim.proofHref}>{claim.proofLabel[lang]}<ArrowRight size={13} /></Link>}</div>
              <p role="cell">{claim.boundary[lang]}</p>
            </article>)}
          </div>
        </section>

        <section className={styles.stories} aria-labelledby="stories-title">
          <div className={styles.sectionIntro}><span>04 / {t.storyLabel}</span><h2 id="stories-title">{t.storyTitle}</h2></div>
          <div className={styles.storyGrid}>{t.storyAngles.map(([title, body], index) => { const Icon = angleIcons[index]; return <article key={title}><Icon size={21} /><span>Angle {String(index + 1).padStart(2, '0')}</span><h3>{title}</h3><p>{body}</p></article>; })}</div>
        </section>

        <section id="media-assets" className={styles.assets} aria-labelledby="assets-title">
          <div className={styles.sectionIntro}><span>05 / {t.assetsLabel}</span><h2 id="assets-title">{t.assetsTitle}</h2><p>{t.assetsLead}</p></div>
          <div className={styles.assetGrid}>{pressKitAssets.map((asset) => <article key={asset.id}>
            <div className={styles.assetPreview}>{asset.mediaType.startsWith('image/') ? <Image src={asset.href} alt={asset.alt[lang]} width={pressAssetImageSizes[asset.id].width} height={pressAssetImageSizes[asset.id].height} loading="eager" sizes="(max-width: 640px) calc(100vw - 24px), (max-width: 980px) 50vw, 66vw" unoptimized /> : <FileCheck2 size={44} aria-hidden="true" />}</div>
            <div className={styles.assetBody}><span>{asset.mediaType} · {asset.dimensions ?? 'text'}</span><h3>{asset.title[lang]}</h3><p>{asset.caption[lang]}</p><small>{asset.usageBoundary[lang]}</small><code>sha256 {asset.sha256.slice(0, 18)}…</code><div><a href={asset.href} download><Download size={14} />{t.download}</a><span><ShieldCheck size={13} />{t.noCredentials}</span></div></div>
          </article>)}</div>
          <p className={styles.checksumNote}><ShieldCheck size={16} />{t.checksumNote} <a href="/press-kit/asset-manifest.json">{t.manifest}</a></p>
        </section>

        <section className={styles.boilerplates} aria-labelledby="boiler-title">
          <div className={styles.sectionIntro}><span>06 / {t.boilerLabel}</span><h2 id="boiler-title">{t.boilerTitle}</h2></div>
          <div className={styles.boilerGrid}>{(['short', 'long'] as const).map((length) => <article key={length}><header><span>{length === 'short' ? t.short : t.long}</span><button type="button" onClick={() => void copyText(length, pressKitBoilerplates[length][lang])}>{copied === length ? <Check size={14} /> : <Clipboard size={14} />}{copied === length ? t.copied : t.copyAction}</button></header><p>{pressKitBoilerplates[length][lang]}</p></article>)}</div>
          <div className={styles.citation}><div><Newspaper size={18} /><span>{t.citation}</span></div><p>{t.citationText}</p><button type="button" onClick={() => void copyText('citation', t.citationText)}>{copied === 'citation' ? <Check size={14} /> : <Clipboard size={14} />}{copied === 'citation' ? t.copied : t.copyAction}</button><small>{t.corrections}</small></div>
        </section>

        <section className={styles.founder} aria-labelledby="founder-title">
          <Image src="/press-kit/fabrizio-degni-portrait-200.png" alt={lang === 'en' ? 'Portrait of Fabrizio Degni' : 'Ritratto di Fabrizio Degni'} width={200} height={200} loading="eager" sizes="200px" unoptimized />
          <div><span>{t.founderLabel}</span><h2 id="founder-title">{t.founderTitle}</h2><p>{t.founderBio}</p><small>{t.portraitNote}</small><nav aria-label={t.founderLabel}><a href="mailto:info@policywatcher.online"><Mail size={15} />info@policywatcher.online</a><a href="https://linkedin.com/in/fabriziodegni" target="_blank" rel="noopener noreferrer"><ExternalLink size={15} />LinkedIn</a><a href={PRESS_KIT_REPOSITORY_URL} target="_blank" rel="noopener noreferrer"><GitFork size={15} />GitHub</a></nav></div>
        </section>

        <section className={styles.boundaries} aria-labelledby="boundaries-title">
          <div><span>{t.coverageLabel}</span><h2 id="boundaries-title">{t.coverageTitle}</h2><ul>{t.boundaries.map((boundary) => <li key={boundary}><CheckCircle2 size={15} />{boundary}</li>)}</ul></div>
          <nav aria-label={t.coverageLabel}><Link href="/press">{t.coverageWall}<ArrowRight size={14} /></Link><Link href="/trust">{t.trust}<ArrowRight size={14} /></Link><Link href="/methodology/confidence">{t.method}<ArrowRight size={14} /></Link><Link href="/timeline">{t.timeline}<ArrowRight size={14} /></Link><Link href="/feature-atlas">{t.featureAtlas}<ArrowRight size={14} /></Link><Link href="/roadmap">{t.releaseSurface}<ArrowRight size={14} /></Link><a href={PRESS_KIT_JSON_URL}>{t.json}<Download size={14} /></a></nav>
        </section>
        <div className={styles.copyStatus} role="status" aria-live="polite" aria-atomic="true">
          {copyFailure ? `${t.copyFailed} ${t.manualCopy}` : copied ? t.copied : ''}
        </div>
      </main>
      <Footer lang={lang} />
    </div>
  );
}
