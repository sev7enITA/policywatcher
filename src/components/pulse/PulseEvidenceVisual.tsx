import Link from 'next/link';
import { pressKitReleases } from '@/lib/pressKit';
import type { PulseLocale, PulseStory } from '@/lib/editorialPulse';
import styles from './pulse.module.css';

const pipeline = {
  en: [
    ['01', 'Public source', 'Configured provider page', 'Source URL and retrieval state'],
    ['02', 'Snapshot', 'Dated captured representation', 'Timestamp and provenance'],
    ['03', 'Diff', 'Observed text-level movement', 'Change evidence'],
    ['04', 'Assessment', 'AI-assisted interpretation', 'KPIs with unavailable states'],
    ['05', 'Publication gate', 'Configured evidence checks', 'Public record or withheld state'],
  ],
  it: [
    ['01', 'Fonte pubblica', 'Pagina provider configurata', 'URL e stato di retrieval'],
    ['02', 'Snapshot', 'Rappresentazione acquisita e datata', 'Timestamp e provenienza'],
    ['03', 'Diff', 'Movimento osservato nel testo', 'Evidenza del cambiamento'],
    ['04', 'Valutazione', 'Interpretazione assistita da AI', 'KPI con stati non disponibili'],
    ['05', 'Gate di pubblicazione', 'Controlli evidenza configurati', 'Record pubblico o stato trattenuto'],
  ],
} as const;

export default function PulseEvidenceVisual({ story, lang, compact = false }: { story: PulseStory; lang: PulseLocale; compact?: boolean }) {
  if (story.visualKind === 'evidence-pipeline') {
    return (
      <figure className={`${styles.visual} ${compact ? styles.visualCompact : ''}`}>
        <ol className={styles.pipeline} aria-label={lang === 'it' ? 'Percorso delle evidenze' : 'Evidence pipeline'}>
          {pipeline[lang].map(([index, title, body, output]) => (
            <li key={index}>
              <span>{index}</span><div><strong>{title}</strong><p>{body}</p><small>{output}</small></div>
            </li>
          ))}
        </ol>
        <figcaption>{story.boundary[lang]} <Link href="/methodology/confidence">{lang === 'it' ? 'Metodo' : 'Method'}</Link></figcaption>
      </figure>
    );
  }

  if (story.visualKind === 'release-timeline') {
    const releases = pressKitReleases.filter((release) => {
      const match = release.version.match(/beta\.(\d+)/);
      return match && Number(match[1]) >= 7;
    }).slice(0, 6).reverse();
    return (
      <figure className={`${styles.visual} ${compact ? styles.visualCompact : ''}`}>
        <ol className={styles.releaseTimeline}>
          {releases.map((release) => (
            <li key={release.slug}>
              <time dateTime={release.dateModified}>{release.displayVersion}</time>
              <div><strong>{release.title[lang]}</strong><span>{release.category}</span><p>{release.changes[0][lang]}</p></div>
            </li>
          ))}
        </ol>
        <figcaption>{story.boundary[lang]} <Link href="/press-kit/releases">{lang === 'it' ? 'Archivio release' : 'Release archive'}</Link></figcaption>
      </figure>
    );
  }

  return (
    <figure className={`${styles.visual} ${compact ? styles.visualCompact : ''}`}>
      <ul className={styles.metricStrip} aria-label={lang === 'it' ? 'Metriche del perimetro configurato' : 'Configured-scope metrics'}>
        {story.facts.map((fact) => <li key={fact.id}><strong>{fact.value}</strong><span>{fact.label[lang]}</span><p>{fact.detail[lang]}</p><Link href={fact.proofHref}>{lang === 'it' ? 'Verifica' : 'Verify'}</Link></li>)}
      </ul>
      <figcaption>{story.boundary[lang]} <Link href="/press-kit/data">{lang === 'it' ? 'Dati' : 'Data'}</Link></figcaption>
    </figure>
  );
}
