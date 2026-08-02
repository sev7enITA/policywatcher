import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, Database, FileCheck2, Globe2, Server, ShieldAlert } from 'lucide-react';
import Footer from '@/components/Footer';
import PublicHeader from '@/components/PublicHeader';
import { getResidencyEvidencePack, type ResidencyEvidenceState } from '@/lib/residencyEvidence';
import styles from './residency.module.css';

export const metadata: Metadata = {
  title: 'Residency & Processor Evidence | PolicyWatcher',
  description: 'A dated register of PolicyWatcher hosting, storage, transfer and processor evidence with open verification gaps.',
  alternates: { canonical: 'https://policywatcher.online/trust/residency' },
};

const stateLabels: Record<ResidencyEvidenceState, string> = {
  documented: 'Public document reviewed',
  'operator-declared': 'Operator declaration',
  'configuration-dependent': 'Deployment dependent',
  open: 'Evidence open',
};

const roleIcons = {
  hosting: Server,
  storage: Database,
  backup: Database,
  retrieval: Globe2,
  ai: FileCheck2,
  email: FileCheck2,
} as const;

export default function ResidencyEvidencePage() {
  const pack = getResidencyEvidencePack();
  const documented = pack.records.filter((record) => record.state === 'documented').length;
  const open = pack.records.filter((record) => record.state === 'open').length;

  return (
    <>
      <PublicHeader current="trust" />
      <main className={styles.page}>
        <div className={styles.shell}>
          <Link href="/trust" className={styles.backLink}><ArrowLeft size={16} /> Back to Trust & Quality</Link>
          <header className={styles.hero}>
            <div>
              <span className={styles.eyebrow}>Beta 31 · legal-resilience evidence</span>
              <h1>Residency and processor evidence, without inferred certainty</h1>
              <p>
                This dated pack separates provider documents, operator declarations, deployment-dependent facts and missing evidence. A public provider DPA does not by itself prove where the active PolicyWatcher deployment or its backups run.
              </p>
              <div className={styles.actions}>
                <a href="/api/v1/residency-evidence" className={styles.primaryAction}>Open JSON evidence pack <ArrowUpRight size={16} /></a>
                <Link href="/privacy" className={styles.secondaryAction}>Privacy policy</Link>
              </div>
            </div>
            <aside className={styles.summary} aria-label="Evidence pack summary">
              <span>Evidence pack</span>
              <strong>{pack.records.length}</strong>
              <small>processing and storage records</small>
              <dl>
                <div><dt>Documented</dt><dd>{documented}</dd></div>
                <div><dt>Open</dt><dd>{open}</dd></div>
                <div><dt>Reviewed</dt><dd>{pack.reviewedAt}</dd></div>
              </dl>
              <code>{pack.digest.slice(0, 24)}...</code>
            </aside>
          </header>

          <section className={styles.boundary}>
            <ShieldAlert size={22} />
            <div><strong>Interpretation boundary</strong><p>{pack.boundary}</p></div>
          </section>

          <section aria-labelledby="residency-register-title">
            <div className={styles.sectionHead}>
              <div><span>Record-level status</span><h2 id="residency-register-title">Processing and storage register</h2></div>
              <p>Every record states both what is known and what the available evidence cannot establish.</p>
            </div>
            <div className={styles.grid}>
              {pack.records.map((record) => {
                const Icon = roleIcons[record.role];
                return (
                  <article className={styles.card} key={record.id} data-state={record.state}>
                    <div className={styles.cardTop}><Icon size={19} /><span>{record.role}</span><b>{stateLabels[record.state]}</b></div>
                    <h3>{record.service}</h3>
                    <dl>
                      <div><dt>Data</dt><dd>{record.data}</dd></div>
                      <div><dt>Location</dt><dd>{record.location}</dd></div>
                      <div><dt>Evidence</dt><dd>{record.evidence}</dd></div>
                      <div><dt>Limit</dt><dd>{record.limitation}</dd></div>
                    </dl>
                  </article>
                );
              })}
            </div>
          </section>

          <section className={styles.references} aria-labelledby="residency-references-title">
            <div className={styles.sectionHead}>
              <div><span>Dated source register</span><h2 id="residency-references-title">Documents reviewed</h2></div>
              <p>Links identify the reviewed source; applicability still depends on the contracted service and live configuration.</p>
            </div>
            <div className={styles.referenceList}>
              {pack.references.map((reference) => (
                <a href={reference.href} key={reference.id} target={reference.href.startsWith('http') ? '_blank' : undefined} rel={reference.href.startsWith('http') ? 'noopener noreferrer' : undefined}>
                  <span>{reference.publisher}</span><strong>{reference.title}</strong><small>{reference.scope}</small><b>Reviewed {reference.reviewedAt} <ArrowUpRight size={14} /></b>
                </a>
              ))}
            </div>
          </section>

          <section className={styles.openActions}>
            <div><span>Closure criteria</span><h2>Evidence still required</h2></div>
            <ol>{pack.openActions.map((action) => <li key={action}>{action}</li>)}</ol>
          </section>
        </div>
      </main>
      <Footer lang="en" />
    </>
  );
}
