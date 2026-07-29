import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  Download,
  ExternalLink,
  FileJson2,
  FileText,
  Fingerprint,
  HelpCircle,
  Scale,
  ShieldAlert,
} from 'lucide-react';
import Footer from '@/components/Footer';
import PublicHeader from '@/components/PublicHeader';
import { getPublicEvidencePacket } from '@/lib/evidencePacketData';
import { KPI_METRICS, type KpiField } from '@/lib/metricsCatalog';
import styles from '../evidence.module.css';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const dynamic = 'force-dynamic';

interface EvidenceDetailPageProps {
  params: Promise<{ changeId: string }>;
}

function formatDate(value: string | null): string {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
  }).format(date);
}

function sourceStateLabel(value: string): string {
  if (value === 'verified-retrieval') return 'Recorded retrieval available';
  if (value === 'review-required') return 'Review required';
  return 'Retrieval not recorded';
}

function scoreDeltaLabel(delta: number | null): string {
  if (delta === null) return 'Baseline; no earlier public change';
  if (delta === 0) return '0 points; unchanged';
  return `${delta > 0 ? '+' : ''}${delta} points from previous public change`;
}

function kpiLabel(value: KpiField | null): string {
  return value ? KPI_METRICS[value].label.en : 'No related KPI recorded';
}

export async function generateMetadata({ params }: EvidenceDetailPageProps): Promise<Metadata> {
  const { changeId } = await params;
  if (!UUID_RE.test(changeId)) return { title: 'Evidence Packet not found | PolicyWatcher' };

  try {
    const packet = await getPublicEvidencePacket(changeId);
    if (!packet || packet.publicationGate !== 'published') {
      return { title: 'Evidence Packet not found | PolicyWatcher' };
    }
    return {
      title: `${packet.company.name} Evidence Packet | PolicyWatcher`,
      description: `Source confidence, explainability, advisory governance mapping and report output for change ${packet.changeId}.`,
    };
  } catch {
    return { title: 'Evidence Packet | PolicyWatcher' };
  }
}

export default async function EvidenceDetailPage({ params }: EvidenceDetailPageProps) {
  const { changeId } = await params;
  if (!UUID_RE.test(changeId)) notFound();

  let packet: Awaited<ReturnType<typeof getPublicEvidencePacket>>;
  try {
    packet = await getPublicEvidencePacket(changeId);
  } catch (error) {
    console.error('[Evidence detail] Public packet unavailable:', error);
    throw error;
  }

  if (!packet || packet.publicationGate !== 'published') notFound();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://policywatcher.online';
  const packetUrl = `${baseUrl}/evidence/${packet.changeId}`;
  const jsonUrl = `${baseUrl}/api/evidence-packet/${packet.changeId}?format=json`;
  const pdfUrl = `${baseUrl}/api/evidence-packet/${packet.changeId}?format=pdf`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: `PolicyWatcher Evidence Packet: ${packet.company.name} ${packet.policy.name}`,
    description: packet.boundary,
    identifier: packet.changeId,
    url: packetUrl,
    dateModified: packet.screeningDate,
    creator: { '@type': 'Organization', name: 'PolicyWatcher', url: baseUrl },
    isBasedOn: packet.policy.sourceUrl || packet.changeUrl,
    distribution: [
      { '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: jsonUrl },
      { '@type': 'DataDownload', encodingFormat: 'application/pdf', contentUrl: pdfUrl },
    ],
  };

  return (
    <>
      <PublicHeader current="evidence" />
      <main className={styles.page}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
        <article className={`${styles.shell} ${styles.packet}`}>
          <nav className={styles.backRow} aria-label="Evidence packet navigation">
            <Link href="/evidence"><ArrowLeft size={15} aria-hidden="true" /> Evidence register</Link>
            <span>Schema {packet.schemaVersion} · Mapping {packet.mappingVersion}</span>
          </nav>

          <header className={styles.packetHeader}>
            <div className={styles.packetIdentity}>
              <p className={styles.kicker}>Public Evidence Packet</p>
              <h1>{packet.company.name}</h1>
              <p className={styles.packetPolicy}>{packet.policy.name}</p>
              <code title={packet.changeId}>{packet.changeId}</code>
            </div>
            <dl className={styles.packetSummary}>
              <div><dt>Screening date</dt><dd>{formatDate(packet.screeningDate)}</dd></div>
              <div><dt>Jurisdiction</dt><dd>{packet.policy.jurisdiction}</dd></div>
              <div><dt>Risk screening</dt><dd>{packet.assessment.overallRisk} · {packet.assessment.overallScore}/10</dd></div>
              <div><dt>Score trace</dt><dd>{scoreDeltaLabel(packet.assessment.scoreDelta)}</dd></div>
            </dl>
          </header>

          <div className={styles.packetBoundary} role="note">
            <ShieldAlert size={18} aria-hidden="true" />
            <p>{packet.boundary}</p>
          </div>

          <ol className={styles.detailSpine} aria-label="Evidence packet stages">
            <li><span>01</span><Fingerprint size={18} aria-hidden="true" /><strong>Source Confidence</strong></li>
            <li><span>02</span><BookOpenCheck size={18} aria-hidden="true" /><strong>Explainability</strong></li>
            <li><span>03</span><Scale size={18} aria-hidden="true" /><strong>Governance Relevance</strong></li>
            <li><span>04</span><FileText size={18} aria-hidden="true" /><strong>Report Output</strong></li>
          </ol>

          <section className={styles.packetSection} id="source-confidence" aria-labelledby="source-title">
            <div className={styles.packetSectionHead}>
              <span>01</span>
              <div><p className={styles.kicker}>Dataset QA · sanitized public view</p><h2 id="source-title">Source Confidence</h2></div>
            </div>
            <div className={styles.sourceGrid}>
              <dl className={styles.dataLedger}>
                <div><dt>Publication gate</dt><dd className={styles.available}><CheckCircle2 size={14} /> Published</dd></div>
                <div><dt>Retrieval state</dt><dd>{sourceStateLabel(packet.sourceConfidence.state)}</dd></div>
                <div><dt>Latest retrieval</dt><dd>{formatDate(packet.sourceConfidence.lastCheckedAt)}</dd></div>
                <div><dt>Sanitized channel</dt><dd><code>{packet.sourceConfidence.retrievalChannel}</code></dd></div>
                <div><dt>Data status</dt><dd>{packet.sourceConfidence.dataStatus}</dd></div>
                <div><dt>Public snapshot evidence</dt><dd>{packet.sourceConfidence.publicSnapshotEvidence ? 'Available' : 'Not available'}</dd></div>
              </dl>
              <div className={styles.snapshotLedger}>
                <h3>Public snapshot fingerprints</h3>
                {packet.snapshots.old ? (
                  <div>
                    <span>Previous · version {packet.snapshots.old.version}</span>
                    <code title={packet.snapshots.old.sha256}>{packet.snapshots.old.sha256}</code>
                    <small>Captured {formatDate(packet.snapshots.old.capturedAt)}</small>
                  </div>
                ) : (
                  <div><span>Previous snapshot</span><p>Not available as public evidence for this change.</p></div>
                )}
                <div>
                  <span>Current · version {packet.snapshots.current.version}</span>
                  <code title={packet.snapshots.current.sha256}>{packet.snapshots.current.sha256}</code>
                  <small>Captured {formatDate(packet.snapshots.current.capturedAt)}</small>
                </div>
              </div>
            </div>
            <p className={styles.sectionBoundary}>{packet.sourceConfidence.limitation}</p>
          </section>

          <section className={styles.packetSection} id="explainability" aria-labelledby="explain-title">
            <div className={styles.packetSectionHead}>
              <span>02</span>
              <div><p className={styles.kicker}>Source-anchored screening trace</p><h2 id="explain-title">Explainability</h2></div>
            </div>
            <p className={styles.assessmentSummary}>{packet.assessment.summary}</p>
            {packet.assessment.reasons.length > 0 ? (
              <ol className={styles.reasonList}>
                {packet.assessment.reasons.map((reason, index) => (
                  <li key={`${reason.textEn}-${index}`}>
                    <div className={styles.reasonHead}>
                      <span>Reason {index + 1}</span>
                      <strong>{reason.deltaScore > 0 ? '+' : ''}{reason.deltaScore} score contribution</strong>
                    </div>
                    <p>{reason.textEn || 'Reason text not recorded.'}</p>
                    <dl>
                      <div><dt>Related KPI</dt><dd>{kpiLabel(reason.relatedKpi)}</dd></div>
                      <div><dt>Source side</dt><dd>{reason.anchorStatus === 'verified' ? `${reason.evidenceSide} snapshot` : 'Not recorded'}</dd></div>
                    </dl>
                    {reason.anchorStatus === 'verified' && reason.evidenceQuote ? (
                      <blockquote>
                        <span>Verified exact source passage</span>
                        <p>“{reason.evidenceQuote}”</p>
                      </blockquote>
                    ) : (
                      <div className={styles.noAnchor}>
                        <span>Source passage not recorded</span>
                        <p>{reason.anchorStatus === 'rejected'
                          ? 'A candidate passage did not match the named snapshot and is not displayed.'
                          : 'This historical reason has no recorded source passage.'}</p>
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            ) : (
              <div className={styles.noAnchor}><span>No recorded score reasons</span><p>The packet does not infer explanations that were not stored.</p></div>
            )}
            <p className={styles.sectionBoundary}>{packet.assessment.explanationBoundary}</p>
          </section>

          <section className={styles.packetSection} id="governance" aria-labelledby="governance-title">
            <div className={styles.packetSectionHead}>
              <span>03</span>
              <div><p className={styles.kicker}>Advisory review map</p><h2 id="governance-title">Governance Relevance</h2></div>
            </div>
            <div className={styles.frameworkList}>
              {packet.governance.mappings.map((mapping) => (
                <article key={mapping.framework.id}>
                  <div className={styles.frameworkHead}>
                    <div><h3>{mapping.framework.shortName}</h3><p>{mapping.framework.referenceVersion}</p></div>
                    <span data-state={mapping.status}>{mapping.status === 'mapped' ? 'Mapped evidence' : 'Not assessed'}</span>
                  </div>
                  <p className={styles.reviewQuestion}><HelpCircle size={15} aria-hidden="true" /> {mapping.framework.reviewQuestion}</p>
                  {mapping.evidence.length > 0 ? (
                    <dl className={styles.kpiEvidence}>
                      {mapping.evidence.map((item) => <div key={item.field}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}
                    </dl>
                  ) : (
                    <p className={styles.notAssessed}>No assessed KPI value is available for this advisory mapping.</p>
                  )}
                  <a href={mapping.framework.referenceUrl} target="_blank" rel="noopener noreferrer">
                    Framework source <ExternalLink size={13} aria-hidden="true" />
                  </a>
                </article>
              ))}
            </div>
            <p className={styles.sectionBoundary}>{packet.governance.boundary}</p>
          </section>

          <section className={styles.packetSection} id="report-output" aria-labelledby="report-title">
            <div className={styles.packetSectionHead}>
              <span>04</span>
              <div><p className={styles.kicker}>Exact change-bound files</p><h2 id="report-title">Report Output</h2></div>
            </div>
            <div className={styles.reportGrid}>
              <div className={styles.downloadPanel}>
                <p>Both files are generated from this exact change ID.</p>
                <a href={`/api/evidence-packet/${packet.changeId}?format=pdf`} download>
                  <Download size={18} aria-hidden="true" /> Download exact-change PDF <ArrowRight size={15} />
                </a>
                <a href={`/api/evidence-packet/${packet.changeId}?format=json`} download>
                  <FileJson2 size={18} aria-hidden="true" /> Download exact-change JSON <ArrowRight size={15} />
                </a>
                <div className={styles.digest}>
                  <span>Packet content digest · SHA-256</span>
                  <code title={packet.contentDigest}>{packet.contentDigest}</code>
                </div>
              </div>
              <div className={styles.reviewPanel}>
                <h3>Questions before reuse</h3>
                <ol>{packet.humanReviewQuestions.map((question) => <li key={question}>{question}</li>)}</ol>
              </div>
            </div>
          </section>

          <footer className={styles.packetFoot}>
            <div><p className={styles.kicker}>Review boundary</p><p>{packet.boundary}</p></div>
            <nav aria-label="Related evidence links">
              <Link href={`/change/${packet.changeId}`}>Open original change <ArrowRight size={14} /></Link>
              <Link href="/methodology/confidence">Read methodology <ArrowRight size={14} /></Link>
              {packet.policy.sourceUrl && (
                <a href={packet.policy.sourceUrl} target="_blank" rel="noopener noreferrer">Provider source <ExternalLink size={14} /></a>
              )}
            </nav>
          </footer>
        </article>
      </main>
      <Footer lang="en" variant="compact" />
    </>
  );
}
