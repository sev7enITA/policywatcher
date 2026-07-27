'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Download,
  ExternalLink,
  FileWarning,
  Languages,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import Footer from '@/components/Footer';
import PublicHeader from '@/components/PublicHeader';
import {
  pressKitDataSnapshots,
  pressKitGlossary,
  pressKitRegistryEvents,
  pressKitReleases,
  type PressKitLocale,
} from '@/lib/pressKit';
import { recordPressMetric } from '@/lib/pressMetrics';
import styles from './pressKit.module.css';

type NewsroomView = 'releases' | 'release-detail' | 'data' | 'reference' | 'corrections' | 'glossary';

interface NewsroomPageClientProps {
  view: NewsroomView;
  releaseSlug?: string;
}

const pageCopy = {
  en: {
    switchLanguage: 'Italiano',
    back: 'Back to press kit',
    releasesLabel: 'Newsroom archive',
    releasesTitle: 'Dated product releases.',
    releasesLead: 'Published information is versioned and keeps evidence links and interpretation boundaries with the release record.',
    releaseStatus: 'Status',
    published: 'Published',
    modified: 'Modified',
    category: 'Category',
    evidence: 'Evidence links',
    boundaries: 'Interpretation boundaries',
    changes: 'Included changes',
    openRelease: 'Read release record',
    dataLabel: 'Editorial data room',
    dataTitle: 'Dated snapshots and available formats.',
    dataLead: 'Only published files are actionable. Every record states its date, citation, method link and reuse boundary.',
    snapshot: 'Snapshot',
    generated: 'Generated',
    formats: 'Published formats',
    citation: 'Suggested citation',
    method: 'Method',
    download: 'Download',
    referenceLabel: 'Reference desk',
    referenceTitle: 'Provenance, corrections and glossary.',
    referenceLead: 'The registers below distinguish file integrity, factual correction history and the terms used by PolicyWatcher.',
    provenanceTitle: 'Provenance status',
    provenanceBody: 'Published media files have SHA-256 checksums and descriptive metadata. Content Credentials are not attached.',
    provenanceBoundary: 'A checksum can confirm that a downloaded file matches the listed file. It does not prove semantic truth, authorship provenance or endorsement.',
    correctionsTitle: 'Correction and clarification register',
    correctionsLead: 'Dated corrections and clarifications are published with the affected stable record.',
    noCorrections: 'No correction or clarification event is currently published for the press-kit registry.',
    affected: 'Affected record',
    glossaryTitle: 'Glossary',
    glossaryLead: 'Terms used in public evidence, source and publication states.',
    unavailableTitle: 'Release record unavailable',
    unavailableBody: 'The requested release is not present in the published newsroom archive.',
  },
  it: {
    switchLanguage: 'English',
    back: 'Torna al press kit',
    releasesLabel: 'Archivio newsroom',
    releasesTitle: 'Release prodotto datate.',
    releasesLead: 'Le informazioni pubblicate sono versionate e mantengono link alle evidenze e limiti interpretativi insieme al record della release.',
    releaseStatus: 'Stato',
    published: 'Pubblicata',
    modified: 'Modificata',
    category: 'Categoria',
    evidence: 'Link evidenze',
    boundaries: 'Limiti interpretativi',
    changes: 'Modifiche incluse',
    openRelease: 'Leggi il record release',
    dataLabel: 'Data room editoriale',
    dataTitle: 'Snapshot datati e formati disponibili.',
    dataLead: 'Solo i file pubblicati sono azionabili. Ogni record indica data, citazione, link al metodo e limite di riuso.',
    snapshot: 'Snapshot',
    generated: 'Generato',
    formats: 'Formati pubblicati',
    citation: 'Citazione suggerita',
    method: 'Metodo',
    download: 'Scarica',
    referenceLabel: 'Desk di riferimento',
    referenceTitle: 'Provenienza, correzioni e glossario.',
    referenceLead: 'I registri distinguono integrita dei file, storico delle correzioni fattuali e termini usati da PolicyWatcher.',
    provenanceTitle: 'Stato provenienza',
    provenanceBody: 'I file media pubblicati hanno checksum SHA-256 e metadata descrittivi. Le Content Credentials non sono allegate.',
    provenanceBoundary: 'Un checksum puo confermare che un file scaricato corrisponde a quello elencato. Non prova verita semantica, provenienza autoriale o endorsement.',
    correctionsTitle: 'Registro correzioni e chiarimenti',
    correctionsLead: 'Correzioni e chiarimenti datati sono pubblicati con il record stabile interessato.',
    noCorrections: 'Non sono attualmente pubblicati eventi di correzione o chiarimento per il registro press kit.',
    affected: 'Record interessato',
    glossaryTitle: 'Glossario',
    glossaryLead: 'Termini usati per evidenze pubbliche, fonti e stati di pubblicazione.',
    unavailableTitle: 'Record release non disponibile',
    unavailableBody: 'La release richiesta non e presente nell archivio newsroom pubblicato.',
  },
} as const;

export default function NewsroomPageClient({ view, releaseSlug }: NewsroomPageClientProps) {
  const [lang, setLang] = useState<PressKitLocale>('en');
  const dataRoomViewRecorded = useRef(false);
  const t = pageCopy[lang];
  const selectedRelease = releaseSlug ? pressKitReleases.find((release) => release.slug === releaseSlug) : null;

  useEffect(() => {
    if (view !== 'data' || dataRoomViewRecorded.current) return;
    dataRoomViewRecorded.current = true;
    recordPressMetric('data_room_view', 'data-room', lang);
  }, [lang, view]);

  const pageHeader = view === 'data'
    ? [t.dataLabel, t.dataTitle, t.dataLead]
    : view === 'corrections'
      ? [t.referenceLabel, t.correctionsTitle, t.correctionsLead]
      : view === 'glossary'
        ? [t.referenceLabel, t.glossaryTitle, t.glossaryLead]
    : view === 'reference'
      ? [t.referenceLabel, t.referenceTitle, t.referenceLead]
      : view === 'release-detail' && selectedRelease
        ? [`${selectedRelease.category} / ${selectedRelease.displayVersion}`, selectedRelease.title[lang], selectedRelease.summary[lang]]
        : [t.releasesLabel, t.releasesTitle, t.releasesLead];

  return (
    <div className={styles.page} lang={lang}>
      <PublicHeader current="press-kit" lang={lang} />
      <main className={styles.subpageMain}>
        <section className={styles.subpageHero}>
          <div>
            <span className={styles.subpageEyebrow}>{pageHeader[0]}</span>
            <h1>{pageHeader[1]}</h1>
            <p>{pageHeader[2]}</p>
          </div>
          <div className={styles.subpageTools}>
            <button type="button" onClick={() => setLang(lang === 'en' ? 'it' : 'en')}><Languages size={15} />{t.switchLanguage}</button>
            <Link className={styles.subpageBack} href="/press-kit"><ArrowLeft size={14} />{t.back}</Link>
          </div>
        </section>

        {view === 'releases' && (
          <section className={styles.subpageList} aria-label={t.releasesLabel}>
            {pressKitReleases.map((release) => (
              <article key={release.slug}>
                <header><span>{release.displayVersion} · {release.category}</span><time dateTime={release.datePublished}>{release.datePublished}</time></header>
                <h2>{release.title[lang]}</h2>
                <p>{release.summary[lang]}</p>
                <dl className={styles.releaseMeta}>
                  <div><dt>{t.releaseStatus}</dt><dd>{release.status}</dd></div>
                  <div><dt>{t.modified}</dt><dd>{release.dateModified}</dd></div>
                </dl>
                <Link className={styles.subpageAction} href={`/press-kit/releases/${release.slug}`}>{t.openRelease}<ArrowRight size={14} /></Link>
              </article>
            ))}
          </section>
        )}

        {view === 'release-detail' && selectedRelease && (
          <section className={styles.subpageList} aria-label={selectedRelease.title[lang]}>
            <article>
              <dl className={styles.releaseMeta}>
                <div><dt>{t.releaseStatus}</dt><dd>{selectedRelease.status}</dd></div>
                <div><dt>{t.published}</dt><dd>{selectedRelease.datePublished}</dd></div>
                <div><dt>{t.modified}</dt><dd>{selectedRelease.dateModified}</dd></div>
                <div><dt>{t.category}</dt><dd>{selectedRelease.category}</dd></div>
              </dl>
              <h2>{t.changes}</h2>
              <ol className={styles.subpageChanges}>{selectedRelease.changes.map((change, index) => <li key={change.en}><span>{String(index + 1).padStart(2, '0')}</span>{change[lang]}</li>)}</ol>
            </article>
            <article>
              <h2>{t.boundaries}</h2>
              <ul className={styles.subpageChanges}>{selectedRelease.boundaries.map((boundary, index) => <li key={boundary.en}><span>{String(index + 1).padStart(2, '0')}</span>{boundary[lang]}</li>)}</ul>
              <h2>{t.evidence}</h2>
              <div className={styles.formatList}>{selectedRelease.evidenceLinks.map((link) => <Link key={link.href} href={link.href}>{link.label[lang]}<ExternalLink size={12} /></Link>)}</div>
            </article>
          </section>
        )}

        {view === 'release-detail' && !selectedRelease && (
          <section className={styles.referenceBlock}>
            <div className={styles.emptyRegister}><FileWarning size={20} /><strong>{t.unavailableTitle}</strong><span>{t.unavailableBody}</span></div>
          </section>
        )}

        {view === 'data' && (
          <section className={styles.subpageList} aria-label={t.dataLabel}>
            {pressKitDataSnapshots.map((snapshot) => (
              <article id={snapshot.id} key={snapshot.id}>
                <header><span>{snapshot.id}</span><time dateTime={snapshot.asOf}>{snapshot.asOf}</time></header>
                <h2>{snapshot.title[lang]}</h2>
                <p>{snapshot.description[lang]}</p>
                <dl className={styles.dataMeta}>
                  <div><dt>{t.snapshot}</dt><dd>{snapshot.asOf}</dd></div>
                  <div><dt>{t.generated}</dt><dd>{snapshot.generatedAt}</dd></div>
                  <div><dt>{t.citation}</dt><dd>{snapshot.citation[lang]}</dd></div>
                  <div><dt>{t.formats}</dt><dd>{snapshot.files.map((file) => file.format).join(' · ')}</dd></div>
                </dl>
                <div className={styles.formatList}>{snapshot.files.map((file) => <a key={file.format} href={file.href} download><Download size={12} />{file.format} · {t.download}</a>)}</div>
                <Link className={styles.dataLink} href={snapshot.methodologyHref}>{t.method}<ArrowRight size={13} /></Link>
                <p className={styles.dataBoundary}><ShieldCheck size={15} />{snapshot.boundary[lang]}</p>
              </article>
            ))}
          </section>
        )}

        {view === 'reference' && (
          <>
            <section id="provenance" className={styles.referenceBlock}>
              <h2>{t.provenanceTitle}</h2>
              <p>{t.provenanceBody}</p>
              <p className={styles.dataBoundary}><ShieldCheck size={15} />{t.provenanceBoundary}</p>
              <div className={styles.formatList}><Link href="/press-kit/asset-manifest.json">Asset manifest<ArrowRight size={12} /></Link><Link href="/press-kit/LICENSE-ASSETS.md">Asset terms<ArrowRight size={12} /></Link></div>
            </section>
            <section id="corrections" className={styles.referenceBlock}>
              <h2>{t.correctionsTitle}</h2>
              {pressKitRegistryEvents.filter((event) => event.type === 'correction' || event.type === 'clarification').length === 0 ? (
                <div className={styles.emptyRegister}><CheckCircle2 size={20} /><span>{t.noCorrections}</span></div>
              ) : (
                <ol className={styles.registryEvents}>{pressKitRegistryEvents.filter((event) => event.type === 'correction' || event.type === 'clarification').map((event) => <li key={event.id}><strong>{event.occurredAt}<br />{event.type}</strong><span>{event.title[lang]}: {event.detail[lang]} <Link href={event.affectedHref}>{t.affected}</Link></span></li>)}</ol>
              )}
              <a className={styles.subpageAction} href="mailto:info@policywatcher.online?subject=PolicyWatcher%20factual%20review%20request" onClick={() => recordPressMetric('press_contact_intent', 'fact-checking', lang)}><Mail size={14} />info@policywatcher.online</a>
            </section>
            <section id="glossary" className={styles.referenceBlock}>
              <h2>{t.glossaryTitle}</h2>
              <dl className={styles.glossaryList}>{pressKitGlossary.map((entry) => <div key={entry.id}><dt><strong>{entry.term}</strong></dt><dd>{entry.definition[lang]}{entry.boundary ? <small>{entry.boundary[lang]}</small> : null}</dd></div>)}</dl>
            </section>
          </>
        )}

        {view === 'corrections' && (
          <section id="corrections" className={styles.referenceBlock}>
            <h2>{t.correctionsTitle}</h2>
            {pressKitRegistryEvents.filter((event) => event.type === 'correction' || event.type === 'clarification').length === 0 ? (
              <div className={styles.emptyRegister}><CheckCircle2 size={20} /><span>{t.noCorrections}</span></div>
            ) : (
              <ol className={styles.registryEvents}>{pressKitRegistryEvents.filter((event) => event.type === 'correction' || event.type === 'clarification').map((event) => <li key={event.id}><strong>{event.occurredAt}<br />{event.type}</strong><span>{event.title[lang]}: {event.detail[lang]} <Link href={event.affectedHref}>{t.affected}</Link></span></li>)}</ol>
            )}
            <a className={styles.subpageAction} href="mailto:info@policywatcher.online?subject=PolicyWatcher%20factual%20review%20request" onClick={() => recordPressMetric('press_contact_intent', 'fact-checking', lang)}><Mail size={14} />info@policywatcher.online</a>
          </section>
        )}

        {view === 'glossary' && (
          <section id="glossary" className={styles.referenceBlock}>
            <h2>{t.glossaryTitle}</h2>
            <dl className={styles.glossaryList}>{pressKitGlossary.map((entry) => <div key={entry.id}><dt><strong>{entry.term}</strong></dt><dd>{entry.definition[lang]}{entry.boundary ? <small>{entry.boundary[lang]}</small> : null}</dd></div>)}</dl>
          </section>
        )}
      </main>
      <Footer lang={lang} variant="compact" />
    </div>
  );
}
