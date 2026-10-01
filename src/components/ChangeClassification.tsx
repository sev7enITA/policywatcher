import type { ChangeClassification, ChangeExcerpt } from '@/lib/changeClassificationTypes';
import { CHANGE_KIND_LABELS, changeClassificationDescription } from '@/lib/changeClassificationCopy';
import styles from './ChangeClassification.module.css';

interface Props { classification?: ChangeClassification | null; lang?: 'en' | 'it'; headingLevel?: 2 | 3 }

export function ChangeClassificationBadge({ classification, lang = 'en' }: Props) {
  const kind = classification?.kind ?? 'needs_review';
  return <span className={styles.badge} data-change-kind={kind}>{CHANGE_KIND_LABELS[lang][kind]}</span>;
}

function Excerpt({ value }: { value: ChangeExcerpt }) {
  const from = value.changedStart - value.start, to = value.changedEnd - value.start;
  return <blockquote className={styles.quote}>
    {value.start > 0 && <span aria-label="excerpt">…</span>}
    {value.text.slice(0, from)}<mark>{value.text.slice(from, to)}</mark>{value.text.slice(to)}
    <span aria-label="excerpt">…</span>
  </blockquote>;
}

export default function ChangeClassificationPanel({ classification, lang = 'en', headingLevel = 3 }: Props) {
  const it = lang === 'it';
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  const ExcerptHeading = headingLevel === 2 ? 'h3' : 'h4';
  return <section className={styles.panel} aria-label={it ? 'Verifica della modifica' : 'Change verification'}>
    <div className={styles.heading}>
      <Heading>{it ? 'Cosa cambia davvero' : 'What actually changed'}</Heading>
      <ChangeClassificationBadge classification={classification} lang={lang} />
    </div>
    <p>{changeClassificationDescription(classification, lang)}</p>
    <p className={styles.impact}><strong>{it ? 'Impatto della modifica: da valutare.' : 'Change impact: not assessed.'}</strong>{' '}
      {it ? 'Il punteggio di rischio descrive la policy analizzata e non misura l’effetto di questa revisione.' : 'The risk score describes the assessed policy and does not measure the effect of this revision.'}
    </p>
    {Boolean(classification?.evidence.length) && <details className={styles.evidence} open>
      <summary>{it ? 'Confronto prima / dopo' : 'Before / after comparison'} <span>({classification!.evidence.length}/{classification!.totalHunks})</span></summary>
      <p className={styles.note}>{it ? 'Estratti esatti degli snapshot. Evidenziazioni = testo modificato; il contesto non evidenziato può essere invariato. Il diff completo segue nell’analisi.' : 'Exact snapshot excerpts. Highlights show edited text; surrounding context can be unchanged. The full diff follows in the analysis.'}</p>
      {classification!.evidence.map((evidence, index) => <div className={styles.comparison} key={index}>
        <div><ExcerptHeading>{it ? 'Prima' : 'Before'} · V{classification!.oldVersion ?? '?'}</ExcerptHeading><Excerpt value={evidence.before} /></div>
        <div><ExcerptHeading>{it ? 'Dopo' : 'After'} · V{classification!.newVersion ?? '?'}</ExcerptHeading><Excerpt value={evidence.after} /></div>
        {evidence.anchoredQuote && <p className={styles.anchor}>{it ? 'Clausola selezionata dall’AI e riscontrata nel testo modificato' : 'AI-selected clause located in the edited text'}: <q>{evidence.anchoredQuote.text}</q></p>}
      </div>)}
    </details>}
    {classification?.oldHash && classification.newHash && <details className={styles.provenance}>
      <summary>{it ? 'Metodo e riferimenti degli snapshot' : 'Method and snapshot references'}</summary>
      <p>{it ? 'Classificazione automatica' : 'Automatic classification'} v{classification.version}. {it ? 'Gli estratti sono parziali; lo storico e le valutazioni AI originali sono conservati.' : 'Excerpts are partial; history and original AI assessments are preserved.'}</p>
      <p>SHA-256 V{classification.oldVersion ?? '?'}: <code>{classification.oldHash}</code><br />SHA-256 V{classification.newVersion ?? '?'}: <code>{classification.newHash}</code></p>
    </details>}
  </section>;
}
