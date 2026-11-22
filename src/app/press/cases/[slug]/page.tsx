import type { Metadata } from 'next';
import { languageAlternates, publicLanguage, withSocialMetadata, type PublicLanguage } from '@/lib/seo';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { publicChangeWhere } from '@/lib/publicDataGate';
import { publishedAssessmentFilter } from '@/lib/publicAssessment';
import { classificationSnapshotSelect, classifyPolicyChange } from '@/lib/changeClassification';
import { comparisonPair } from '@/lib/publicComparison';
import ChangeClassificationPanel from '@/components/ChangeClassification';
import { comparisonPath } from '../../../../../shared/comparisonLink';
import { pressCoverageRecords } from '@/lib/pressCoverage';
import styles from '../../../briefing/briefing.module.css';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ lang?: string }> };

function caseHeading(slug: string, lang: PublicLanguage): string {
  return slug === 'meta-ai'
    ? (lang === 'it' ? 'Meta e i contenuti pubblici degli adulti' : 'Meta and public content shared by adults')
    : (lang === 'it' ? 'TikTok: a chi si applica la modifica sugli annunci?' : 'TikTok: who does the advertising change cover?');
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  if (!pressCoverageRecords.some(record => record.caseSlug === slug)) notFound();
  const lang = publicLanguage(query.lang);
  return withSocialMetadata({
    title: `${caseHeading(slug, lang)} | PolicyWatcher`,
    description: lang === 'it'
      ? 'Un caso documentato che distingue la fonte originale, il contesto storico e le evidenze pubbliche disponibili.'
      : 'A documented case separating the original source, historical context and available public evidence.',
    alternates: languageAlternates(`/press/cases/${slug}`, lang),
  }, lang);
}

export default async function PressCase({ params, searchParams }: Props) {
  const { slug } = await params;
  const lang = publicLanguage((await searchParams).lang);
  const it = lang === 'it';
  const article = pressCoverageRecords.find(record => record.caseSlug === slug);
  if (!article) notFound();
  const meta = slug === 'meta-ai';
  const id = meta ? '7db948e3-a96e-4118-85d0-41c51c80796f' : '8fee8965-4f52-4d9e-86b4-33dc60fdadd7';
  const change = await db.policyChange.findFirst({
    where: publicChangeWhere({ id, ...publishedAssessmentFilter(new Date()), policy: { sourceMigrationPending: false } }),
    select: { policyId: true, riskReasonsJson: true, publicPublishedAt: true,
      policy: { select: { url: true, name: true, jurisdiction: true } },
      oldSnapshot: { select: classificationSnapshotSelect }, newSnapshot: { select: classificationSnapshotSelect } },
  });
  const pair = change && comparisonPair(change.policyId, change.oldSnapshot, change.newSnapshot);
  return <main lang={lang} className={styles.page}><article className={styles.shared}>
    <nav className={styles.related}><Link href={`/press?lang=${lang}#registry`}>{it ? 'Rassegna stampa' : 'Press coverage'}</Link>
      <Link href={`/press/cases/${slug}?lang=${it ? 'en' : 'it'}`}>{it ? 'English' : 'Italiano'}</Link></nav>
    <h1>{caseHeading(slug, lang)}</h1>
    <a href={article.sourceUrl}>{it ? 'Articolo originale' : 'Original article'} · {article.sourceName}</a>
    {meta ? <>
      <h2>{it ? 'Il caso del maggio 2025' : 'The May 2025 case'}</h2>
      <p>{it ? 'Il 21 maggio 2025 l’autorità irlandese per la protezione dei dati ha descritto il piano di Meta per usare i contenuti pubblici condivisi dagli adulti su Facebook e Instagram nell’UE e nello Spazio economico europeo per addestrare i modelli di IA.' : 'On 21 May 2025, Ireland’s Data Protection Commission described Meta’s plan to train AI models using public content shared by adults on Facebook and Instagram in the EU and European Economic Area.'}</p>
      <p>{it ? 'Il comunicato descrive le notifiche e il modulo di opposizione di allora. Per le opzioni oggi disponibili sul tuo account, consulta il Centro sulla privacy di Meta. Può richiedere l’accesso.' : 'The statement describes the notices and objection form available at the time. For the controls currently available to your account, visit Meta’s Privacy Centre. You may need to sign in.'}</p>
      <nav className={styles.related}><a href="https://dataprotection.ie/en/news-media/latest-news/dpc-statement-meta-ai">{it ? 'Comunicato ufficiale del 21 maggio 2025' : 'Official statement of 21 May 2025'}</a>
        <a href="https://www.facebook.com/privacy/center/">{it ? 'Centro sulla privacy di Meta' : 'Meta Privacy Centre'}</a></nav>
      <h2>{it ? 'Una revisione successiva in archivio' : 'A later revision in the archive'}</h2>
      <p>{it ? 'Questa scheda documenta una revisione successiva della privacy policy UE. Per il piano di addestramento del 2025 la fonte è il comunicato dell’autorità.' : 'This record documents a later revision of the EU privacy policy. The regulator’s statement is the source for the 2025 training plan.'}</p>
    </> : <>
      <p>{it ? 'Fortune Italia racconta come risalire dalla sintesi alle fonti. Per provare il metodo, PolicyWatcher ha scelto una revisione TikTok. Il documento è in catalogo sotto UE. Nel passaggio sugli annunci, cerca il riferimento agli utenti del Regno Unito.' : 'Fortune Italia describes how to trace a summary back to its sources. PolicyWatcher selected this TikTok revision as a worked example. The catalogue lists the document under EU. In the advertising passage, look for the reference to UK users.'}</p>
    </>}
    {change ? <>
      <p>{change.policy.name} · {change.policy.jurisdiction} · {change.publicPublishedAt?.toISOString().slice(0, 10)}</p>
      <ChangeClassificationPanel classification={classifyPolicyChange(change)} lang={lang} headingLevel={2}/>
      <nav className={styles.related}><a href={change.policy.url}>{it ? 'Policy ufficiale' : 'Official policy'}</a>
        <Link href={pair ? comparisonPath(id, pair, lang) : `/change/${id}?lang=${lang}`}>{it ? 'Apri le evidenze del confronto' : 'Open comparison evidence'}</Link></nav>
    </> : <p>{it ? 'Il confronto archiviato non è disponibile nel catalogo pubblico corrente.' : 'The archived comparison is unavailable in the current public catalogue.'}</p>}
  </article></main>;
}
