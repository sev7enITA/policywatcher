import { describe, expect, it } from 'vitest';
import {
  buildPaloPolicyWatcherSignal,
  PALO_POLICYWATCHER_SIGNAL_BOUNDARY,
  PALO_POLICYWATCHER_SIGNAL_SCHEMA,
  parsePaloPolicyWatcherSignalQuery,
} from '../paloPolicyWatcherSignal';
import type { PublicChangeEventRow } from '../publicChangeEvents';
import goldenSignal from './fixtures/palo-policywatcher-signal.v1.json';

const CHANGE_ID = '11111111-1111-4111-8111-111111111111';
export const paloSignalTestRow: PublicChangeEventRow = {
  id: CHANGE_ID,
  publicPublishedAt: '2026-08-26T10:00:00.000Z',
  overallRisk: 'Medium',
  overallScore: 5,
  tldrEn: 'Alpha published a public policy change.',
  tldrIt: 'Alpha ha pubblicato una modifica della policy.',
  aiSummaryEn: 'English fallback.',
  aiSummaryIt: 'Fallback italiano.',
  policy: {
    id: 'policy-1',
    name: 'AI Policy',
    type: 'ai',
    jurisdiction: 'EU',
    company: { id: 'company-1', name: 'Alpha', slug: 'alpha', industry: 'Technology' },
  },
};

describe('PALO PolicyWatcher handoff contract', () => {
  it('accepts one strict public-change query and rejects ambiguous input', () => {
    expect(parsePaloPolicyWatcherSignalQuery(new URLSearchParams(`changeId=${CHANGE_ID}&lang=it`))).toEqual({
      ok: true,
      changeId: CHANGE_ID,
      locale: 'it',
    });
    expect(parsePaloPolicyWatcherSignalQuery(new URLSearchParams())).toMatchObject({ ok: false });
    expect(parsePaloPolicyWatcherSignalQuery(new URLSearchParams(`changeId=${CHANGE_ID}&lang=fr`))).toMatchObject({ ok: false });
    expect(parsePaloPolicyWatcherSignalQuery(new URLSearchParams(`changeId=${CHANGE_ID}&private=true`))).toMatchObject({ ok: false });
  });

  it('builds the canonical PALO v1 signal without promoting screening into a PALO decision', () => {
    const signal = buildPaloPolicyWatcherSignal(paloSignalTestRow, 'en');
    expect(signal).toEqual(goldenSignal);
    expect(signal).toMatchObject({
      format: 'palo-policywatcher-signal',
      schemaVersion: '1.0.0',
      signalId: `signal-policywatcher-${CHANGE_ID}`,
      observedAt: paloSignalTestRow.publicPublishedAt,
      source: { publisher: 'PolicyWatcher', checkedAt: paloSignalTestRow.publicPublishedAt },
      summary: paloSignalTestRow.tldrEn,
      changeType: 'unknown',
      confidence: { level: 'high', score: 1 },
      authority: { status: 'non-authoritative-monitoring-signal' },
      suggestedHandoff: {
        module: 'PALO_RegulatoryWatch',
        eventName: 'palo:policywatcher:signal',
        reviewGateIds: ['measure', 'prove'],
      },
      extensions: {
        contractOwner: 'PALO',
        canonicalSchema: PALO_POLICYWATCHER_SIGNAL_SCHEMA,
        handoffBoundary: PALO_POLICYWATCHER_SIGNAL_BOUNDARY,
        policyWatcherRecord: {
          changeId: CHANGE_ID,
          screening: { overallRisk: 'Medium', overallScore: 5 },
        },
      },
    });
    expect(signal).not.toHaveProperty('riskScore');
    expect(signal).not.toHaveProperty('applicability');
    expect(signal).not.toHaveProperty('gateDecision');
    expect(JSON.stringify(signal)).not.toMatch(/privatePolicy|rawText|internalId|legalVerdict/);
  });

  it('localizes the public summary while retaining stable identity and provenance', () => {
    const english = buildPaloPolicyWatcherSignal(paloSignalTestRow, 'en');
    const italian = buildPaloPolicyWatcherSignal(paloSignalTestRow, 'it');
    expect(italian.summary).toBe(paloSignalTestRow.tldrIt);
    expect(italian.signalId).toBe(english.signalId);
    expect(italian.source).toEqual(english.source);
    expect(italian.extensions.policyWatcherRecord.links).toEqual(english.extensions.policyWatcherRecord.links);
  });
});
