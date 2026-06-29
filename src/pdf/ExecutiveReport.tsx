/**
 * ExecutiveReport - one-page A4 PDF document for board / legal reporting.
 *
 * Uses @react-pdf/renderer primitives (NOT DOM React). Rendered server-side
 * by the /api/report/[policyId] route via renderToBuffer.
 *
 * Layout (single A4 page, brand-aware):
 *   - Header: PolicyWatcher brand + "EXECUTIVE REPORT"
 *   - Company & policy identification block
 *   - Risk score gauge (big number + label + colored bar)
 *   - TL;DR (one sentence)
 *   - Key points (3-5 short bullets)
 *   - Risk reasons (why this score)
 *   - Regional compliance chips (EU / US / Global)
 *   - Footer: screening date + disclaimer + URL
 */
import React from 'react';
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from '@react-pdf/renderer';
import type { PolicyChange, Lang, RegionImpact } from '@/types';

// --- Helpers ---------------------------------------------------------------

/**
 * Safely parses a JSON string into an array of key points.
 *
 * @param json - The raw JSON string (from `keyPointsJson` DB column), or null.
 * @returns An array of `KeyPoint` objects, or an empty array on parse failure.
 */
function parseKeyPoints(json?: string | null) {
  if (!json) return [];
  try {
    const p = JSON.parse(json);
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

/**
 * Safely parses a JSON string into an array of risk reasons (max 3).
 *
 * @param json - The raw JSON string (from `riskReasonsJson` DB column), or null.
 * @returns An array of up to 3 `RiskReason` objects, or empty on parse failure.
 */
function parseRiskReasons(json?: string | null) {
  if (!json) return [];
  try {
    const p = JSON.parse(json);
    return Array.isArray(p) ? p.slice(0, 3) : [];
  } catch {
    return [];
  }
}

/**
 * Finds a specific region + perspective impact from the impacts array.
 *
 * @param impacts   - The array of region impacts attached to the policy change.
 * @param region    - Target region code (e.g. 'EU', 'US', 'Global').
 * @param perspective - Target perspective ('Individual' or 'Enterprise').
 * @returns The matching `RegionImpact`, or `undefined` if not found.
 */
function getRegionImpact(
  impacts: RegionImpact[] | undefined,
  region: string,
  perspective: string
): RegionImpact | undefined {
  return impacts?.find((i) => i.region === region && i.perspective === perspective);
}

/** Brand colour palette used throughout the PDF. */
const COLORS = {
  primary: '#6366f1',
  secondary: '#06b6d4',
  ink: '#0f172a',
  body: '#334155',
  muted: '#64748b',
  border: '#e2e8f0',
  bg: '#f8fafc',
  green: '#059669',
  amber: '#d97706',
  red: '#dc2626',
};

/**
 * Returns the appropriate colour for a numeric risk score.
 * High (≥7) → red, Medium (≥4) → amber, Low → green.
 */
function scoreColor(score: number): string {
  if (score >= 7) return COLORS.red;
  if (score >= 4) return COLORS.amber;
  return COLORS.green;
}

// --- Styles ---------------------------------------------------------------

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 40,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: COLORS.body,
    backgroundColor: '#ffffff',
    lineHeight: 1.4,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
    marginBottom: 18,
  },
  brand: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 16,
    color: COLORS.primary,
  },
  brandSub: {
    fontSize: 7,
    color: COLORS.muted,
    letterSpacing: 1.5,
  },
  reportTag: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: COLORS.ink,
    backgroundColor: '#eef2ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    letterSpacing: 1,
  },
  // Title block
  titleBlock: {
    marginBottom: 14,
  },
  companyName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 20,
    color: COLORS.ink,
  },
  policyName: {
    fontFamily: 'Helvetica',
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 6,
    fontSize: 8,
    color: COLORS.muted,
  },
  metaItem: {
    flexDirection: 'row',
    gap: 4,
  },
  metaLabel: {
    color: COLORS.muted,
  },
  metaValue: {
    fontFamily: 'Helvetica-Bold',
    color: COLORS.ink,
  },
  // Score block
  scoreBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    padding: 14,
    backgroundColor: COLORS.bg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  scoreNumber: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 38,
    lineHeight: 1,
  },
  scoreSlash: {
    fontSize: 14,
    color: COLORS.muted,
  },
  scoreInfo: {
    flex: 1,
  },
  scoreRisk: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
    marginBottom: 4,
  },
  scoreBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.border,
    marginTop: 4,
  },
  scoreBarFill: {
    height: 6,
    borderRadius: 3,
  },
  // Section
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tldr: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.ink,
    lineHeight: 1.5,
  },
  // Lists
  bulletRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 3,
  },
  bulletDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
  bulletText: {
    flex: 1,
    fontSize: 9,
    color: COLORS.body,
  },
  reasonRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
    alignItems: 'center',
  },
  reasonBadge: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
    color: '#ffffff',
  },
  reasonText: {
    flex: 1,
    fontSize: 9,
    color: COLORS.ink,
  },
  // Region grid
  regionGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  regionCard: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#ffffff',
  },
  regionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  regionName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    color: COLORS.ink,
  },
  regionBadge: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  regionText: {
    fontSize: 7.5,
    color: COLORS.muted,
    lineHeight: 1.3,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    fontSize: 6.5,
    color: COLORS.muted,
    textAlign: 'center',
  },
});

// --- Component -------------------------------------------------------------

/**
 * Props for the {@link ExecutiveReport} component.
 *
 * All data is pre-fetched by the `/api/report/[policyId]` route
 * and passed directly — the component itself performs no data fetching.
 */
interface ExecutiveReportProps {
  companyName: string;
  policyName: string;
  change: PolicyChange;
  lang: Lang;
  screeningDate: string;
  policyUrl?: string;
}

/**
 * Renders a one-page branded A4 PDF document for executive / legal reporting.
 *
 * Built with `@react-pdf/renderer` primitives (NOT browser-DOM React).
 * The layout includes a header, company identification, risk gauge, TL;DR,
 * key points, risk reasons, regional compliance chips, and a footer.
 *
 * @param props - See {@link ExecutiveReportProps}.
 * @returns A `<Document>` element suitable for `renderToBuffer()`.
 */
export default function ExecutiveReport({
  companyName,
  policyName,
  change,
  lang,
  screeningDate,
  policyUrl,
}: ExecutiveReportProps) {
  const isIt = lang === 'it';
  const score = change.overallScore;
  const sColor = scoreColor(score);
  const keyPoints = parseKeyPoints(change.keyPointsJson);
  const reasons = parseRiskReasons(change.riskReasonsJson);
  const tldr = isIt ? change.tldrIt || change.aiSummaryIt : change.tldrEn || change.aiSummaryEn;

  const euInd = getRegionImpact(change.regionImpacts, 'EU', 'Individual');
  const usInd = getRegionImpact(change.regionImpacts, 'US', 'Individual');
  const glbInd = getRegionImpact(change.regionImpacts, 'Global', 'Individual');

  const L = {
    execReport: isIt ? 'REPORT ESECUTIVO' : 'EXECUTIVE REPORT',
    riskLevel: isIt ? 'Livello Rischio' : 'Risk Level',
    tldrTitle: isIt ? 'Sintesi (TL;DR)' : 'Summary (TL;DR)',
    keyPointsTitle: isIt ? 'Punti Chiave' : 'Key Points',
    reasonsTitle: isIt ? 'Perché Questo Punteggio' : 'Why This Score',
    regionsTitle: isIt ? 'Impatto Regionale (Individui)' : 'Regional Impact (Individuals)',
    industry: isIt ? 'Settore' : 'Industry',
    screening: isIt ? 'Screening' : 'Screening',
    source: isIt ? 'Fonte' : 'Source',
    high: isIt ? 'Alto' : 'High',
    medium: isIt ? 'Medio' : 'Medium',
    low: isIt ? 'Basso' : 'Low',
    disclaimer:
      'BETA RELEASE: Automated AI assessment of publicly available policy texts. Not legal advice. ' +
      'Not a compliance certification. Always consult official sources and qualified legal counsel. ' +
      `© ${new Date().getFullYear()} PolicyWatcher.`,
    generated: isIt ? 'Generato da PolicyWatcher' : 'Generated by PolicyWatcher',
  };

  const riskLabel =
    change.overallRisk === 'High' ? L.high : change.overallRisk === 'Medium' ? L.medium : L.low;

  return (
    <Document
      title={`${companyName} - Executive Report`}
      author="PolicyWatcher"
      subject="Policy Risk Assessment"
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>PolicyWatcher</Text>
            <Text style={styles.brandSub}>
              {isIt ? 'INTELLIGENCE NORMATIVA' : 'REGULATORY INTELLIGENCE'}
            </Text>
          </View>
          <Text style={styles.reportTag}>{L.execReport}</Text>
        </View>

        {/* Title */}
        <View style={styles.titleBlock}>
          <Text style={styles.companyName}>{companyName}</Text>
          <Text style={styles.policyName}>{policyName}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>{L.screening}:</Text>
              <Text style={styles.metaValue}>{screeningDate}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Risk:</Text>
              <Text style={styles.metaValue}>{riskLabel}</Text>
            </View>
          </View>
        </View>

        {/* Score */}
        <View style={styles.scoreBlock}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Text style={[styles.scoreNumber, { color: sColor }]}>{score}</Text>
            <Text style={styles.scoreSlash}>/10</Text>
          </View>
          <View style={styles.scoreInfo}>
            <Text style={[styles.scoreRisk, { color: sColor }]}>
              {L.riskLevel}: {riskLabel}
            </Text>
            <View style={styles.scoreBar}>
              <View
                style={[
                  styles.scoreBarFill,
                  { width: `${(score / 10) * 100}%`, backgroundColor: sColor },
                ]}
              />
            </View>
          </View>
        </View>

        {/* TL;DR */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{L.tldrTitle}</Text>
          <Text style={styles.tldr}>{tldr}</Text>
        </View>

        {/* Key points */}
        {keyPoints.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{L.keyPointsTitle}</Text>
            {keyPoints.map((p: { textEn: string; textIt: string; sentiment: string }, i: number) => (
              <View key={i} style={styles.bulletRow}>
                <View
                  style={[
                    styles.bulletDot,
                    {
                      backgroundColor:
                        p.sentiment === 'positive'
                          ? COLORS.green
                          : p.sentiment === 'negative'
                          ? COLORS.red
                          : COLORS.muted,
                    },
                  ]}
                />
                <Text style={styles.bulletText}>{isIt ? p.textIt : p.textEn}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Reasons */}
        {reasons.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{L.reasonsTitle}</Text>
            {reasons.map(
              (
                r: { textEn: string; textIt: string; icon: string; deltaScore: number },
                i: number
              ) => (
                <View key={i} style={styles.reasonRow}>
                  <Text
                    style={[
                      styles.reasonBadge,
                      {
                        backgroundColor:
                          r.icon === 'alert'
                            ? COLORS.red
                            : r.icon === 'warning'
                            ? COLORS.amber
                            : COLORS.muted,
                      },
                    ]}
                  >
                    {r.deltaScore > 0 ? `+${r.deltaScore}` : r.deltaScore}
                  </Text>
                  <Text style={styles.reasonText}>{isIt ? r.textIt : r.textEn}</Text>
                </View>
              )
            )}
          </View>
        )}

        {/* Regions */}
        {(euInd || usInd || glbInd) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{L.regionsTitle}</Text>
            <View style={styles.regionGrid}>
              {[euInd, usInd, glbInd].map(
                (imp, i) =>
                  imp && (
                    <View key={i} style={styles.regionCard}>
                      <View style={styles.regionHeader}>
                        <Text style={styles.regionName}>{imp.region}</Text>
                        <Text
                          style={[
                            styles.regionBadge,
                            {
                              color: '#ffffff',
                              backgroundColor:
                                imp.riskLevel === 'High'
                                  ? COLORS.red
                                  : imp.riskLevel === 'Medium'
                                  ? COLORS.amber
                                  : COLORS.green,
                            },
                          ]}
                        >
                          {imp.riskLevel}
                        </Text>
                      </View>
                      <Text style={styles.regionText}>
                        {(isIt ? imp.impactAnalysisIt : imp.impactAnalysisEn).substring(0, 180)}
                      </Text>
                    </View>
                  )
              )}
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>
            {L.disclaimer}
            {policyUrl ? `   |   ${L.source}: ${policyUrl}` : ''}
          </Text>
          <Text style={{ marginTop: 2 }}>
            {L.generated} · {screeningDate}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
