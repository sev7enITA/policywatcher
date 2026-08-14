import {
  Document,
  Link,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';
import type { EvidencePacket } from '@/lib/evidencePacket';
import { KPI_METRICS } from '@/lib/metricsCatalog';

const colors = {
  ink: '#10223e',
  body: '#3c4c62',
  muted: '#647084',
  line: '#cfd4d7',
  teal: '#087a75',
  indigo: '#334cba',
  rust: '#9a432e',
  paper: '#fffdf8',
  soft: '#f3f1e9',
};

const styles = StyleSheet.create({
  page: { padding: 32, backgroundColor: colors.paper, color: colors.ink, fontFamily: 'Helvetica', fontSize: 8.2, lineHeight: 1.38 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 11, borderBottom: `2 solid ${colors.ink}` },
  brand: { color: colors.teal, fontFamily: 'Helvetica-Bold', fontSize: 9, letterSpacing: 1.1, textTransform: 'uppercase' },
  packetLabel: { marginTop: 4, color: colors.muted, fontSize: 7, letterSpacing: .8, textTransform: 'uppercase' },
  schema: { maxWidth: 190, color: colors.muted, fontFamily: 'Courier', fontSize: 6.4, textAlign: 'right' },
  titleBlock: { paddingVertical: 18 },
  company: { fontFamily: 'Helvetica-Bold', fontSize: 25, letterSpacing: -.6 },
  policy: { marginTop: 5, color: colors.body, fontSize: 11 },
  id: { marginTop: 9, color: colors.indigo, fontFamily: 'Courier', fontSize: 6.6 },
  meta: { flexDirection: 'row', borderTop: `1 solid ${colors.line}`, borderLeft: `1 solid ${colors.line}` },
  metaCell: { width: '25%', minHeight: 48, padding: 8, borderRight: `1 solid ${colors.line}`, borderBottom: `1 solid ${colors.line}` },
  label: { color: colors.muted, fontFamily: 'Helvetica-Bold', fontSize: 6.1, letterSpacing: .7, textTransform: 'uppercase' },
  value: { marginTop: 5, color: colors.ink, fontFamily: 'Helvetica-Bold', fontSize: 8 },
  boundary: { marginTop: 11, padding: 8, borderLeft: `3 solid ${colors.rust}`, backgroundColor: '#fff3e8', color: '#713825', fontSize: 7 },
  section: { marginTop: 15 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', paddingBottom: 5, borderBottom: `1 solid ${colors.ink}` },
  sectionNumber: { width: 24, color: colors.indigo, fontFamily: 'Courier-Bold', fontSize: 7 },
  sectionTitle: { fontFamily: 'Helvetica-Bold', fontSize: 12 },
  sectionKicker: { marginLeft: 'auto', color: colors.teal, fontFamily: 'Helvetica-Bold', fontSize: 6.2, letterSpacing: .6, textTransform: 'uppercase' },
  twoColumns: { flexDirection: 'row', gap: 14, marginTop: 9 },
  column: { width: '50%' },
  ledgerRow: { flexDirection: 'row', paddingVertical: 4.2, borderBottom: `1 solid ${colors.line}` },
  ledgerLabel: { width: '42%', color: colors.muted, fontFamily: 'Helvetica-Bold', fontSize: 6.2, textTransform: 'uppercase' },
  ledgerValue: { width: '58%', color: colors.body, fontSize: 7.1 },
  snapshot: { marginBottom: 7, padding: 7, border: `1 solid ${colors.line}` },
  hash: { marginTop: 4, color: colors.indigo, fontFamily: 'Courier', fontSize: 5.8 },
  summary: { marginTop: 9, color: colors.body, fontFamily: 'Helvetica-Bold', fontSize: 8.2 },
  reason: { marginTop: 7, paddingBottom: 7, borderBottom: `1 solid ${colors.line}` },
  reasonHead: { flexDirection: 'row', justifyContent: 'space-between', color: colors.muted, fontFamily: 'Helvetica-Bold', fontSize: 6.2, textTransform: 'uppercase' },
  reasonText: { marginTop: 4, color: colors.ink, fontFamily: 'Helvetica-Bold', fontSize: 7.3 },
  reasonMeta: { marginTop: 3, color: colors.muted, fontSize: 6.2 },
  quote: { marginTop: 4, padding: 5, borderLeft: `2 solid ${colors.teal}`, backgroundColor: '#edf8f5', color: '#214b48', fontSize: 6.4 },
  noQuote: { marginTop: 4, color: colors.rust, fontSize: 6.2 },
  frameworkGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, borderTop: `1 solid ${colors.line}`, borderLeft: `1 solid ${colors.line}` },
  framework: { width: '50%', padding: 8, borderRight: `1 solid ${colors.line}`, borderBottom: `1 solid ${colors.line}` },
  frameworkHead: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  frameworkName: { maxWidth: '70%', fontFamily: 'Helvetica-Bold', fontSize: 8 },
  status: { color: colors.teal, fontFamily: 'Helvetica-Bold', fontSize: 5.8, textTransform: 'uppercase' },
  statusPending: { color: colors.rust },
  frameworkVersion: { marginTop: 3, color: colors.muted, fontFamily: 'Courier', fontSize: 5.5 },
  question: { marginTop: 5, color: colors.body, fontSize: 6.2 },
  evidence: { marginTop: 5, color: colors.ink, fontSize: 5.9 },
  reviewList: { marginTop: 8 },
  reviewItem: { flexDirection: 'row', marginBottom: 5 },
  reviewNumber: { width: 18, color: colors.indigo, fontFamily: 'Courier-Bold' },
  reviewText: { flex: 1, color: colors.body, fontSize: 6.8 },
  digest: { marginTop: 10, padding: 8, backgroundColor: colors.soft },
  digestValue: { marginTop: 4, color: colors.indigo, fontFamily: 'Courier', fontSize: 5.8 },
  footer: { position: 'absolute', right: 32, bottom: 20, left: 32, flexDirection: 'row', justifyContent: 'space-between', paddingTop: 6, borderTop: `1 solid ${colors.line}`, color: colors.muted, fontSize: 5.8 },
  link: { color: colors.indigo, textDecoration: 'none' },
});

function utcDate(value: string | null): string {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString().replace('T', ' ').replace('.000Z', ' UTC');
}

function deltaLabel(value: number | null): string {
  if (value === null) return 'Baseline';
  if (value === 0) return '0, unchanged';
  return `${value > 0 ? '+' : ''}${value} points`;
}

function FooterLine({ packet, page }: { packet: EvidencePacket; page: number }) {
  return (
    <View style={styles.footer} fixed>
      <Text>PolicyWatcher Evidence Packet · {packet.changeId}</Text>
      <Text>Page {page} of 2</Text>
    </View>
  );
}

export default function EvidencePacketReport({ packet }: { packet: EvidencePacket }) {
  return (
    <Document title={`PolicyWatcher Evidence Packet ${packet.changeId}`} author="PolicyWatcher" subject="Change-bound public evidence packet">
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View><Text style={styles.brand}>PolicyWatcher</Text><Text style={styles.packetLabel}>Public Evidence Packet</Text></View>
          <Text style={styles.schema}>Schema {packet.schemaVersion} · Mapping {packet.mappingVersion}</Text>
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.company}>{packet.company.name}</Text>
          <Text style={styles.policy}>{packet.policy.name}</Text>
          <Text style={styles.id}>Change ID · {packet.changeId}</Text>
        </View>

        <View style={styles.meta}>
          <View style={styles.metaCell}><Text style={styles.label}>Screening date</Text><Text style={styles.value}>{utcDate(packet.screeningDate)}</Text></View>
          <View style={styles.metaCell}><Text style={styles.label}>Jurisdiction</Text><Text style={styles.value}>{packet.policy.jurisdiction}</Text></View>
          <View style={styles.metaCell}><Text style={styles.label}>Risk screening</Text><Text style={styles.value}>{packet.assessment.overallRisk} · {packet.assessment.overallScore}/10</Text></View>
          <View style={styles.metaCell}><Text style={styles.label}>Score trace</Text><Text style={styles.value}>{deltaLabel(packet.assessment.scoreDelta)}</Text></View>
        </View>
        <Text style={styles.boundary}>{packet.boundary}</Text>

        <View style={styles.section}>
          <View style={styles.sectionHead}><Text style={styles.sectionNumber}>01</Text><Text style={styles.sectionTitle}>Source Confidence</Text><Text style={styles.sectionKicker}>Sanitized public view</Text></View>
          <View style={styles.twoColumns}>
            <View style={styles.column}>
              {[
                ['Publication gate', packet.publicationGate],
                ['Retrieval state', packet.sourceConfidence.state],
                ['Latest retrieval', utcDate(packet.sourceConfidence.lastCheckedAt)],
                ['Sanitized channel', packet.sourceConfidence.retrievalChannel],
                ['Data status', packet.sourceConfidence.dataStatus],
              ].map(([label, value]) => <View key={label} style={styles.ledgerRow}><Text style={styles.ledgerLabel}>{label}</Text><Text style={styles.ledgerValue}>{value}</Text></View>)}
            </View>
            <View style={styles.column}>
              {packet.snapshots.old ? (
                <View style={styles.snapshot}><Text style={styles.label}>Previous snapshot · v{packet.snapshots.old.version}</Text><Text style={styles.hash}>{packet.snapshots.old.sha256}</Text><Text style={styles.reasonMeta}>{utcDate(packet.snapshots.old.capturedAt)}</Text></View>
              ) : <View style={styles.snapshot}><Text style={styles.label}>Previous snapshot</Text><Text style={styles.reasonMeta}>Not available as public evidence.</Text></View>}
              <View style={styles.snapshot}><Text style={styles.label}>Current snapshot · v{packet.snapshots.current.version}</Text><Text style={styles.hash}>{packet.snapshots.current.sha256}</Text><Text style={styles.reasonMeta}>{utcDate(packet.snapshots.current.capturedAt)}</Text></View>
            </View>
          </View>
          <Text style={styles.boundary}>{packet.sourceConfidence.limitation}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHead}><Text style={styles.sectionNumber}>02</Text><Text style={styles.sectionTitle}>Explainability</Text><Text style={styles.sectionKicker}>Source-anchored trace</Text></View>
          <Text style={styles.summary}>{packet.assessment.summary}</Text>
          {packet.assessment.reasons.length > 0 ? packet.assessment.reasons.map((reason, index) => (
            <View key={`${reason.textEn}-${index}`} style={styles.reason} wrap={false}>
              <View style={styles.reasonHead}><Text>Reason {index + 1}</Text><Text>{reason.deltaScore > 0 ? '+' : ''}{reason.deltaScore} score contribution</Text></View>
              <Text style={styles.reasonText}>{reason.textEn || 'Reason text not recorded.'}</Text>
              <Text style={styles.reasonMeta}>Related KPI: {reason.relatedKpi ? KPI_METRICS[reason.relatedKpi].label.en : 'Not recorded'} · Snapshot side: {reason.anchorStatus === 'verified' ? reason.evidenceSide : 'Not recorded'}</Text>
              {reason.anchorStatus === 'verified' && reason.evidenceQuote
                ? <Text style={styles.quote}>Verified exact source passage: “{reason.evidenceQuote}”</Text>
                : <Text style={styles.noQuote}>Source passage not recorded. An unverified candidate passage is never displayed.</Text>}
            </View>
          )) : <Text style={styles.noQuote}>No recorded score reasons. The packet does not infer missing explanations.</Text>}
        </View>
        <FooterLine packet={packet} page={1} />
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View><Text style={styles.brand}>PolicyWatcher</Text><Text style={styles.packetLabel}>Evidence Packet · continued</Text></View>
          <Text style={styles.schema}>{packet.changeId}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHead}><Text style={styles.sectionNumber}>03</Text><Text style={styles.sectionTitle}>Governance Relevance</Text><Text style={styles.sectionKicker}>Advisory mapping</Text></View>
          <View style={styles.frameworkGrid}>
            {packet.governance.mappings.map((mapping) => (
              <View key={mapping.framework.id} style={styles.framework} wrap={false}>
                <View style={styles.frameworkHead}>
                  <Text style={styles.frameworkName}>{mapping.framework.shortName}</Text>
                  <Text style={[styles.status, mapping.status !== 'mapped' ? styles.statusPending : {}]}>{mapping.status === 'mapped' ? 'Mapped evidence' : 'Not assessed'}</Text>
                </View>
                <Text style={styles.frameworkVersion}>{mapping.framework.referenceVersion}</Text>
                <Text style={styles.question}>{mapping.framework.reviewQuestion}</Text>
                <Text style={styles.evidence}>{mapping.evidence.length > 0
                  ? mapping.evidence.map((item) => `${item.label}: ${item.value}`).join(' · ')
                  : 'No assessed KPI value is available for this advisory mapping.'}</Text>
                <Link src={mapping.framework.referenceUrl} style={styles.link}>Framework source</Link>
              </View>
            ))}
          </View>
          <Text style={styles.boundary}>{packet.governance.boundary}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHead}><Text style={styles.sectionNumber}>04</Text><Text style={styles.sectionTitle}>Report Output</Text><Text style={styles.sectionKicker}>Human review</Text></View>
          <View style={styles.twoColumns}>
            <View style={styles.column}>
              <Text style={styles.label}>Questions before reuse</Text>
              <View style={styles.reviewList}>{packet.humanReviewQuestions.map((question, index) => <View key={question} style={styles.reviewItem}><Text style={styles.reviewNumber}>{String(index + 1).padStart(2, '0')}</Text><Text style={styles.reviewText}>{question}</Text></View>)}</View>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Related records</Text>
              <View style={styles.reviewList}>
                <Link src={packet.changeUrl} style={styles.link}>Original public change</Link>
                <Link src={packet.methodologyUrl} style={[styles.link, { marginTop: 6 }]}>Confidence methodology</Link>
                {packet.policy.sourceUrl ? <Link src={packet.policy.sourceUrl} style={[styles.link, { marginTop: 6 }]}>Provider policy source</Link> : null}
              </View>
              <View style={styles.digest}>
                <Text style={styles.label}>Packet content digest · SHA-256</Text>
                <Text style={styles.digestValue}>{packet.contentDigest}</Text>
              </View>
            </View>
          </View>
          <Text style={styles.boundary}>{packet.assessment.explanationBoundary}</Text>
          <Text style={styles.boundary}>{packet.boundary}</Text>
        </View>
        <FooterLine packet={packet} page={2} />
      </Page>
    </Document>
  );
}
