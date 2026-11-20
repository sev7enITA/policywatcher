import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { isUuid } from '@/lib/publicKnowledge';
import { comparisonPair } from '@/lib/publicComparison';
import { publicChangeWhere } from '@/lib/publicDataGate';
import { publishedAssessmentFilter } from '@/lib/publicAssessment';
import { classifyPolicyChange, classificationSnapshotSelect } from '@/lib/changeClassification';
import ChangeClassificationPanel from '@/components/ChangeClassification';
import DiffViewer from '@/components/DiffViewer';
import { comparisonPath, isDigest } from '../../../../../shared/comparisonLink';
import styles from '../../briefing.module.css';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false }, title: 'PolicyWatcher | Briefing' };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ before?: string; after?: string; lang?: string }> };
export default async function SharedComparison({ params, searchParams }: Props) {
  const { id } = await params;
  const query = await searchParams;
  if (!isUuid(id) || !isDigest(query.before) || !isDigest(query.after)) notFound();
  const change = await db.policyChange.findFirst({
    where: publicChangeWhere({ id, ...publishedAssessmentFilter(new Date()), oldSnapshot: { publicEvidence: true }, policy: { sourceMigrationPending: false } }),
    select: { policyId: true, diff: true, riskReasonsJson: true, publicPublishedAt: true,
      policy: { select: { name: true, url: true, jurisdiction: true, company: { select: { name: true } } } },
      oldSnapshot: { select: classificationSnapshotSelect }, newSnapshot: { select: classificationSnapshotSelect } },
  });
  if (!change?.oldSnapshot) notFound();
  const pair = comparisonPair(change.policyId, change.oldSnapshot, change.newSnapshot);
  if (!pair || pair.before !== query.before || pair.after !== query.after) notFound();
  const lang = query.lang === 'it' ? 'it' : 'en';
  const it = lang === 'it';
  return <main className={styles.page} lang={lang}><div className={styles.shared}>
    <nav className={styles.related}><Link href={`/briefing?lang=${lang}`}>Briefing</Link>
      <Link href={comparisonPath(id, pair, it ? 'en' : 'it')} hrefLang={it ? 'en' : 'it'}>{it ? 'English' : 'Italiano'}</Link></nav>
    <h1>{change.policy.company.name} · {change.policy.name}</h1>
    <p>{it ? 'Area del documento' : 'Document region'} · {change.policy.jurisdiction}</p>
    <p><strong>{it ? 'Versioni condivise' : 'Shared versions'} · V{change.oldSnapshot.version} → V{change.newSnapshot.version}</strong></p>
    <p>{it ? 'Domanda per la revisione: la clausola riguarda il servizio, il territorio e il contratto in uso?' : 'Review question: does the clause cover the service, territory and contract in use?'}</p>
    <ChangeClassificationPanel classification={classifyPolicyChange(change)} lang={lang} headingLevel={2} />
    <details><summary>{it ? 'Apri il confronto completo' : 'Open the full comparison'}</summary>
      <DiffViewer diff={change.diff} lang={lang}/></details>
    <nav className={styles.related}><a href={change.policy.url}>{it ? 'Fonte ufficiale' : 'Official source'}</a>
      <Link href={`/change/${id}?lang=${lang}`}>{it ? 'Scheda della modifica' : 'Change record'}</Link></nav>
  </div></main>;
}
