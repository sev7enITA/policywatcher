import type { Metadata } from 'next';
import Link from 'next/link';
import { createPatch } from 'diff';
import { db } from '@/lib/db';
import { OFFICIAL_ARCHIVE_KIND } from '@/lib/officialArchive';
import { parseDocumentTypes } from '@/lib/documentScope';
import PublicHeader from '@/components/PublicHeader';
import Footer from '@/components/Footer';
import DiffViewer from '@/components/DiffViewer';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Official historical comparisons | PolicyWatcher', description: 'Compare dated versions recovered from publishers’ official archives, with source URLs and capture fingerprints.', alternates: { canonical: '/historical-comparisons' } };
export default async function HistoricalComparisons({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const types = parseDocumentTypes(typeof query.documents === 'string' ? query.documents : null);
  const company = typeof query.company === 'string' ? query.company : undefined;
  const records = types ? await db.change.findMany({ where: { kind: OFFICIAL_ARCHIVE_KIND, publicEvidence: true,
    fromVersion: { publicEvidence: true }, toVersion: { publicEvidence: true },
    document: { documentType: { in: types }, ...(company ? { entity: { legacyCompanyId: { in: (await db.company.findMany({ where: { slug: company }, select: { id: true } })).map(c => c.id) } } } : {}) },
  }, include: { document: { include: { entity: true } }, fromVersion: true, toVersion: true }, orderBy: { document: { title: 'asc' } } }) : [];
  const active = records.find(record => record.publicId === query.id) || records[0];
  const labels = active?.summary ? JSON.parse(active.summary) as { olderLabel: string; newerLabel: string } : null;
  return <><PublicHeader current="evidence" /><main className={styles.page}>
    <p className={styles.kicker}>PolicyWatcher · Official source archives</p><h1>Historical document comparisons</h1>
    <p className={styles.lead}>Inspect earlier and later versions published by the same company. These documents were recovered retrospectively; the dates below distinguish the publisher’s version from our capture time.</p>
    <aside className={styles.notice}>Archive comparisons demonstrate the text comparison process. They do not create live change alerts, AI assessments or dashboard KPI scores. Missing archives remain unknown. <Link href="/methodology/confidence">Read the methodology</Link>.</aside>
    <form method="get" className={styles.controls}><label>Comparison <select name="id" defaultValue={active?.publicId || ''}>
      {records.map(record => <option key={record.id} value={record.publicId}>{record.document.entity.name} · {record.document.title} · {record.document.jurisdiction}</option>)}
    </select></label>{typeof query.documents === 'string' && <input type="hidden" name="documents" value={query.documents} />}{company && <input type="hidden" name="company" value={company} />}<button type="submit">Show comparison</button></form>
    <p>{records.length} verified comparison pairs in this scope. <Link href="/historical-comparisons">All archives</Link> · <Link href="/evidence">Monitored change evidence</Link> · <Link href="/">Dashboard</Link></p>
    {!types ? <p role="alert">Invalid document type selection.</p> : !active ? <p>No verified historical pair is available in this scope.</p> : <section>
      <h2>{active.document.entity.name}: {active.document.title}</h2><p>{active.document.jurisdiction} · {active.document.documentType} · <a href={active.document.canonicalUrl} target="_blank" rel="noreferrer">Publisher’s archive</a></p>
      <div className={styles.versions}>{[active.fromVersion!, active.toVersion].map((version, i) => <article key={version.id}>
        <h3>{i === 0 ? 'Earlier version' : 'Later version'}</h3><strong>{i === 0 ? labels?.olderLabel : labels?.newerLabel}</strong>
        <dl><dt>Captured by PolicyWatcher (UTC)</dt><dd>{version.capturedAt.toISOString()}</dd><dt>Effective date stated in document</dt><dd>{version.effectiveAt?.toISOString().slice(0, 10) || 'Not separately established'}</dd><dt>Text SHA-256</dt><dd className={styles.hash}>{version.contentHash}</dd></dl>
        <a href={version.sourceUrl} target="_blank" rel="noreferrer">Open official version ↗</a>
        <details><summary>Read captured text</summary><pre>{version.contentText}</pre></details>
      </article>)}</div>
      <DiffViewer diff={createPatch(active.document.title, active.fromVersion?.contentText || '', active.toVersion.contentText || '', labels?.olderLabel, labels?.newerLabel)} lang="en" title="Text differences: removed (−) and added (+)" maxHeight="650px" />
      <p className={styles.hash}>Evidence ID: {active.publicId}</p>
    </section>}
  </main><Footer lang="en" /></>;
}
