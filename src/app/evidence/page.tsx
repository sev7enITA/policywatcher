import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpenCheck,
  FileCheck2,
  Fingerprint,
  FolderKanban,
  Scale,
} from 'lucide-react';
import Footer from '@/components/Footer';
import PublicHeader from '@/components/PublicHeader';
import AddToCollectionButton from '@/components/AddToCollectionButton';
import { listPublicEvidencePacketSummaries } from '@/lib/evidencePacketData';
import styles from './evidence.module.css';

export const metadata: Metadata = {
  title: 'Evidence Packets | PolicyWatcher',
  description: 'Public, change-bound evidence packets for PolicyWatcher policy-change records.',
  alternates: { canonical: '/evidence' },
};

export const dynamic = 'force-dynamic';

const stages = [
  {
    number: '01',
    title: 'Source Confidence',
    text: 'Sanitized retrieval status and public snapshot fingerprints.',
    icon: Fingerprint,
  },
  {
    number: '02',
    title: 'Explainability',
    text: 'Recorded score reasons with exact source passages only when verified.',
    icon: BookOpenCheck,
  },
  {
    number: '03',
    title: 'Governance Relevance',
    text: 'Advisory framework topics linked to assessed KPI evidence.',
    icon: Scale,
  },
  {
    number: '04',
    title: 'Report Output',
    text: 'Change-bound PDF and JSON with review questions and a content digest.',
    icon: FileCheck2,
  },
] as const;

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function sourceStateLabel(value: string): string {
  if (value === 'verified-retrieval') return 'Recorded retrieval available';
  if (value === 'review-required') return 'Review required';
  return 'Retrieval not recorded';
}

export default async function EvidenceIndexPage() {
  let records: Awaited<ReturnType<typeof listPublicEvidencePacketSummaries>> = [];
  let temporarilyUnavailable = false;

  try {
    records = await listPublicEvidencePacketSummaries();
  } catch (error) {
    temporarilyUnavailable = true;
    console.error('[Evidence index] Public packet summaries unavailable:', error);
  }

  return (
    <>
      <PublicHeader current="evidence" />
      <main className={styles.page}>
        <div className={styles.shell}>
          <header className={styles.hero}>
            <div className={styles.heroMeta}>
              <span>Public evidence files</span>
              <span>Change-bound records</span>
            </div>
            <div className={styles.heroGrid}>
              <div>
                <p className={styles.kicker}>PolicyWatcher evidence register</p>
                <h1>Evidence Packets</h1>
                <p className={styles.lead}>
                  Inspect the evidence retained for a specific public policy change, from retrieval
                  status to the exact downloadable report.
                </p>
                <nav className={styles.heroActions} aria-label="Evidence entry points">
                  <a href="#evidence-register">View available evidence files <ArrowRight size={15} aria-hidden="true" /></a>
                  <Link href="/collections">Build an evidence collection <FolderKanban size={15} aria-hidden="true" /></Link>
                </nav>
              </div>
              <aside className={styles.gateNote} aria-label="Public evidence gate">
                <strong>Public-evidence gate</strong>
                <p>
                  Only records with publishable change and snapshot evidence are listed. Admin notes,
                  raw retrieval failures and withheld records are not exposed.
                </p>
              </aside>
            </div>
          </header>

          <section id="evidence-register" className={styles.register} aria-labelledby="register-title">
            <div className={styles.registerHead}>
              <div>
                <p className={styles.kicker}>Published packet register</p>
                <h2 id="register-title">Available evidence files</h2>
              </div>
              {!temporarilyUnavailable && (
                <span className={styles.recordCount}>{records.length} public records shown</span>
              )}
            </div>

            {temporarilyUnavailable ? (
              <div className={styles.notice} role="status">
                <FileCheck2 size={22} aria-hidden="true" />
                <div>
                  <h3>Evidence register temporarily unavailable</h3>
                  <p>The public packet list could not be loaded. No internal storage details are exposed.</p>
                </div>
              </div>
            ) : records.length === 0 ? (
              <div className={styles.notice} role="status">
                <FileCheck2 size={22} aria-hidden="true" />
                <div>
                  <h3>No public evidence packets are available</h3>
                  <p>Packets appear here only after the public-evidence gate is satisfied.</p>
                  <Link href="/methodology/confidence">Read the publication methodology</Link>
                </div>
              </div>
            ) : (
              <ol className={styles.recordList}>
                {records.map((record, index) => (
                  <li key={record.id} className={styles.record}>
                    <div className={styles.recordIndex}>{String(index + 1).padStart(2, '0')}</div>
                    <div className={styles.recordMain}>
                      <div className={styles.recordTopline}>
                        <span>{formatDate(record.createdAt)}</span>
                        <span data-state={record.sourceState}>{sourceStateLabel(record.sourceState)}</span>
                      </div>
                      <h3>{record.policy.company.name}</h3>
                      <p className={styles.policyName}>{record.policy.name}</p>
                      <p className={styles.summary}>{record.summary}</p>
                      <dl className={styles.recordMeta}>
                        <div><dt>Change ID</dt><dd title={record.id}>{record.id}</dd></div>
                        <div><dt>Jurisdiction</dt><dd>{record.policy.jurisdiction}</dd></div>
                        <div><dt>Risk</dt><dd>{record.overallRisk} · {record.overallScore}/10</dd></div>
                        <div><dt>Data status</dt><dd>{record.policy.dataStatus}</dd></div>
                      </dl>
                    </div>
                    <nav className={styles.recordActions} aria-label={`Evidence actions for ${record.policy.company.name}`}>
                      <Link href={`/evidence/${record.id}`}>
                        Open packet <ArrowRight size={15} aria-hidden="true" />
                      </Link>
                      <AddToCollectionButton changeId={record.id} compact />
                      <Link href={`/change/${record.id}`}>
                        Original change <ArrowRight size={15} aria-hidden="true" />
                      </Link>
                    </nav>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className={styles.spineSection} aria-labelledby="spine-title">
            <div className={styles.sectionIntro}>
              <p className={styles.kicker}>One provenance chain</p>
              <h2 id="spine-title">Four review stages for the same change ID</h2>
            </div>
            <ol className={styles.spine}>
              {stages.map((stage) => {
                const Icon = stage.icon;
                return (
                  <li key={stage.number}>
                    <span className={styles.stageNumber}>{stage.number}</span>
                    <Icon size={20} aria-hidden="true" />
                    <div>
                      <h3>{stage.title}</h3>
                      <p>{stage.text}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
            <p className={styles.spineBoundary}>
              The chain records available evidence and derived screening outputs. It does not certify
              a source, determine compliance or replace specialist review.
            </p>
          </section>
        </div>
      </main>
      <Footer lang="en" variant="compact" />
    </>
  );
}
