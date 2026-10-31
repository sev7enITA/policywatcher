import { describe, expect, it } from 'vitest';
import { assessCampaign, qualificationDigest as hash, type CampaignManifest, type CampaignWindow } from '../engine/qualification';
const sources = [{ id: 'source-one', url: 'https://example.com/privacy', expectedLanguage: 'en' as const, format: 'html' as const }];
const manifest: CampaignManifest = { schema: 'pw-engine-qualification-1', createdAt: '2026-10-31T12:00:00Z', sourceCommit: 'fixture', implementationHash: hash('code'), profileHash: hash('parser'), corpusHash: hash(JSON.stringify(sources)), sources };
const now = Date.parse('2026-11-05T20:00:00Z');
function window(day: number): CampaignWindow {
  const time = `2026-11-0${day}T12:00:00Z`;
  return { schema: 'pw-engine-window-1', id: `day-${day}`, manifestHash: hash(JSON.stringify(manifest)), implementationHash: manifest.implementationHash,
    startedAt: time, completedAt: time, mode: 'live', complete: true, failures: [], sourceReceiptHash: hash('receipt'), observations: [{ id: 'source-one', observedAt: time,
      status: 200, transport: 'direct', fresh: true, payloadHash: hash('raw'), textHash: hash('text'), extractionCompleted: true, sourceDrift: false, languageMatches: true }] };
}
const check = (windows: CampaignWindow[], integrityVerified = true) => assessCampaign(manifest, windows.map(window => ({ window, integrityVerified })), now);
describe('qualification evidence boundaries', () => {
  it('counts three real dates without claiming complete sources, 500-source capacity or production', () => {
    const result = check([window(1), window(2), window(3)]);
    expect(result.countedAcquisitionDays).toBe(3); expect(result.acquisitionWindowTargetMet).toBe(true);
    expect(result.sourceCompletenessQualified).toBe(false); expect(result.real500SourceCapacityQualified).toBe(false); expect(result.productionQualified).toBe(false);
  });
  it.each(['replay', 'conditional', 'missing', 'duplicate', 'future', 'cohort', 'drift', 'failed', 'invalid_time', 'short_interval', 'midnight'])('refuses a misleading window: %s', mutation => {
    const w = window(2);
    if (mutation === 'replay') w.mode = 'replay';
    if (mutation === 'conditional') w.observations[0].status = 304;
    if (mutation === 'missing') w.observations = [];
    if (mutation === 'duplicate') w.observations.push({ ...w.observations[0] });
    if (mutation === 'future') w.completedAt = '2027-01-01T12:00:00Z';
    if (mutation === 'cohort') w.implementationHash = hash('other');
    if (mutation === 'drift') w.observations[0].sourceDrift = true;
    if (mutation === 'failed') w.failures.push({ id: 'source-one', reason: 'timeout' });
    if (mutation === 'invalid_time') w.observations[0].observedAt = 'not-a-time';
    if (mutation === 'short_interval') w.startedAt = w.completedAt = w.observations[0].observedAt = '2026-11-02T00:00:00Z';
    if (mutation === 'midnight') { w.startedAt = '2026-11-02T22:59:00Z'; w.completedAt = w.observations[0].observedAt = '2026-11-02T23:01:00Z'; }
    expect(check([window(1), w]).countedAcquisitionDays).toBe(1);
  });
  it('rejects corrupted artifacts and duplicate window identities rather than counting copies', () => {
    expect(check([window(1)], false).countedAcquisitionDays).toBe(0);
    expect(check([window(1), window(1)]).countedAcquisitionDays).toBe(0);
  });
  it('does not count two different window ids on one date and preserves the rejected record', () => {
    const copy = { ...window(1), id: 'retry' }; const result = check([window(1), copy]);
    expect(result.countedAcquisitionDays).toBe(1); expect(result.observedWindows).toBe(2);
  });
  it('records language uncertainty separately from successful HTTP acquisition', () => {
    const w = window(1); w.observations[0].languageMatches = false;
    expect(check([w]).languageUnverifiedSources).toEqual(['source-one']);
    expect(check([w]).sourceCompletenessQualified).toBe(false);
  });
  it('requires 48 actual hours across all sources rather than compressing three dates into forty hours', () => {
    const two = window(2), three = window(3);
    two.startedAt = two.completedAt = two.observations[0].observedAt = '2026-11-02T08:00:00Z';
    three.startedAt = three.completedAt = three.observations[0].observedAt = '2026-11-03T04:00:00Z';
    const result = check([window(1), two, three]);
    expect(result.countedAcquisitionDays).toBe(3); expect(result.acquisitionWindowTargetMet).toBe(false);
    expect(result.observedMinimumSpanHours).toBe(40);
  });
});
