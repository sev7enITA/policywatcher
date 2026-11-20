'use client';

import Link from 'next/link';
import { CheckCircle2, Clock, Sparkles, X } from 'lucide-react';
import ModalDialog from '@/components/ModalDialog';
import { pressKitReleases, latestResearchUpdate, type PressKitLocale } from '@/lib/pressKit';
import { POLICYWATCHER_RELEASE_CHANNEL, POLICYWATCHER_RELEASE_CHANNEL_LABEL, POLICYWATCHER_VERSION } from '@/lib/release';
import styles from './ChangelogModal.module.css';

const copy = {
  en: {
    title: 'System changelog', close: 'Close changelog',
    subtitle: 'Current web release and earlier milestones', current: 'Latest published release',
    implemented: 'Implemented features', boundaries: 'Availability and limits',
    history: 'Earlier releases', historical: 'Historical release',
    historyNote: 'Version numbers below identify when a feature was introduced. These features remain included in the current web release.',
    record: 'Read release details', archive: 'Full release archive', atlas: 'Feature Atlas',
    roadmap: 'Planned work and priorities', roadmapNote: 'The roadmap tracks future work separately from delivered features. Companion and extension versions follow their own release cycles.',
    source: 'Complete repository changelog',
  },
  it: {
    title: 'Registro delle modifiche', close: 'Chiudi registro delle modifiche',
    subtitle: 'Release web corrente e tappe precedenti', current: 'Ultima release pubblicata',
    implemented: 'Funzionalità implementate', boundaries: 'Disponibilità e limiti',
    history: 'Release precedenti', historical: 'Release storica',
    historyNote: 'Le versioni qui sotto indicano quando è stata introdotta una funzionalità. Queste funzionalità restano incluse nella release web corrente.',
    record: 'Leggi i dettagli della release', archive: 'Archivio completo delle release', atlas: 'Atlante delle funzionalità',
    roadmap: 'Sviluppi previsti e priorità', roadmapNote: 'La roadmap distingue gli sviluppi futuri dalle funzionalità disponibili. Companion ed estensione seguono cicli di rilascio propri.',
    source: 'Changelog completo del repository',
  },
};

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: PressKitLocale;
}

export default function ChangelogModal({ isOpen, onClose, lang = 'en' }: ChangelogModalProps) {
  if (!isOpen) return null;
  const t = { ...copy[lang], ...(POLICYWATCHER_RELEASE_CHANNEL === 'preview'
    ? { current: lang === 'it' ? 'Build preview corrente' : 'Current preview build' } : {}) };
  // The newsroom and dashboard read the same release record, including boundaries.
  const current = pressKitReleases.find(release => release.status === 'current' && release.version === POLICYWATCHER_VERSION);
  const history = pressKitReleases.filter(release => release.status === 'archived');
  const href = (slug: string) => `/press-kit/releases/${slug}?lang=${lang}`;
  return (
    <ModalDialog label={t.title} className={styles.modal} onRequestClose={onClose}>
      <div lang={lang} className={styles.content}>
        <button className={styles.closeBtn} onClick={onClose} aria-label={t.close}><X size={20} /></button>
        <header className={styles.header}>
          <div className={styles.iconContainer}><Sparkles size={24} className={styles.sparkleIcon} /></div>
          <h2>{t.title}</h2><p className={styles.subtitle}>{t.subtitle}</p>
        </header>
        <div className={styles.body}>
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>{lang === 'it' ? 'Rassegna stampa' : 'Press coverage'} · <time dateTime="2026-11-20">{lang === 'it' ? '20 novembre 2026' : '20 November 2026'}</time></h3>
            <p className={styles.featureDesc}>{lang === 'it' ? 'Leggi gli articoli di Economy Magazine del 19 novembre e di Fortune Italia del 18 novembre. La rassegna include le fonti originali anche nei download CSV e JSON.' : 'Read the original articles from Economy Magazine (19 November) and Fortune Italia (18 November). The CSV and JSON downloads also include the source links.'}</p>
            <Link href={`/press?lang=${lang}`}>{lang === 'it' ? 'Apri la rassegna stampa' : 'Open press coverage'}</Link>
          </section>
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>{lang === 'it' ? 'Briefing policy' : 'Policy Briefing'} · <time dateTime="2026-11-19">{lang === 'it' ? '19 novembre 2026' : '19 November 2026'}</time></h3>
            <p className={styles.featureDesc}>{lang === 'it' ? 'Scegli i servizi e i temi da seguire, confronta gli estratti e salva sul dispositivo un piano di revisione.' : 'Choose services and topics, compare the excerpts and save a review plan on your device.'}</p>
            <Link href={`/briefing?lang=${lang}`}>{lang === 'it' ? 'Apri il briefing' : 'Open the briefing'}</Link>
          </section>
          <section className={styles.section} aria-label={lang === 'it' ? 'Ultimo aggiornamento Preview' : 'Latest Preview research update'}>
            <h3 className={styles.sectionTitle}><Sparkles size={16} />{lang === 'it' ? 'Novità della ricerca' : 'Latest research update'} · {latestResearchUpdate.displayVersion} · {lang === 'it' ? 'SPERIMENTALE' : 'EXPERIMENTAL'}</h3>
            <article className={styles.featureItem}>
              <div className={styles.featureHeader}><h4 className={styles.featureName}>{latestResearchUpdate.title[lang]}</h4><time dateTime={latestResearchUpdate.datePublished}>{new Intl.DateTimeFormat(lang === 'it' ? 'it-IT' : 'en-GB', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(latestResearchUpdate.datePublished))}</time></div>
              <p className={styles.featureDesc}>{latestResearchUpdate.summary[lang]}</p>
              <p className={styles.featureDesc}>{latestResearchUpdate.boundaries[0][lang]}</p>
              <Link href={href(latestResearchUpdate.slug)}>{lang === 'it' ? 'Tutte le novità, le prove e i limiti' : 'All progress, evidence and limits'}</Link>
            </article>
          </section>
          {current && <section className={styles.section} aria-label={t.current}>
            <h3 className={styles.sectionTitle}><CheckCircle2 size={16} className={styles.sectionIconActive} />{t.current} · {current.displayVersion} · {POLICYWATCHER_RELEASE_CHANNEL_LABEL}</h3>
            <article className={styles.featureItem}>
              <div className={styles.featureHeader}><h4 className={styles.featureName}>{current.title[lang]}</h4><time dateTime={current.datePublished}>{new Intl.DateTimeFormat(lang === 'it' ? 'it-IT' : 'en-GB', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(current.datePublished))}</time></div>
              <p className={styles.featureDesc}>{current.summary[lang]}</p>
              <h4>{t.implemented}</h4><ul>{current.changes.map(change => <li key={change.en}>{change[lang]}</li>)}</ul>
              <h4>{t.boundaries}</h4><ul>{current.boundaries.map(boundary => <li key={boundary.en}>{boundary[lang]}</li>)}</ul>
              <Link href={href(current.slug)}>{t.record}</Link>
            </article>
          </section>}
          <section className={styles.section} aria-label={t.history}>
            <h3 className={styles.sectionTitle}><Clock size={16} />{t.history}</h3>
            <p className={styles.featureDesc}>{t.historyNote}</p>
            {history.slice(0, 5).map(release => <article className={styles.featureItem} key={release.slug}>
              <div className={styles.featureHeader}><h4 className={styles.featureName}>{release.title[lang]}</h4><span className={styles.badgeDone}>{t.historical} · {release.displayVersion}</span></div>
              <p className={styles.featureDesc}>{release.summary[lang]}</p><Link href={href(release.slug)}>{t.record}</Link>
            </article>)}
            <Link href={`/press-kit/releases?lang=${lang}`}>{t.archive}</Link>
            <a href="https://github.com/sev7enITA/policywatcher/blob/main/CHANGELOG.md">{t.source}</a>
          </section>
          <nav className={styles.section} aria-label={t.roadmap}>
            <p className={styles.featureDesc}>{t.roadmapNote}</p>
            <Link href="/feature-atlas">{t.atlas}</Link><Link href="/roadmap">{t.roadmap}</Link>
          </nav>
        </div>
      </div>
    </ModalDialog>
  );
}
