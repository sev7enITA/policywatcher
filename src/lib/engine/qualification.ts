import { createHash } from 'node:crypto';

export const qualificationDigest = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
export const QUALIFICATION_MIN_INTERVAL_MS = 20 * 60 * 60 * 1000;
export const qualificationDay = (iso: string) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso));
export interface CampaignSource { id: string; url: string; expectedLanguage: 'en' | 'it'; format: 'html' | 'pdf' }
export interface CampaignManifest {
  schema: 'pw-engine-qualification-1'; createdAt: string; sourceCommit: string;
  implementationHash: string; profileHash: string; corpusHash: string; sources: CampaignSource[];
}
export interface CampaignObservation {
  id: string; observedAt: string; status: number; transport: string; fresh: boolean;
  payloadHash: string; extractionCompleted: boolean; sourceDrift: boolean;
  languageMatches: boolean; textHash: string | null;
}
export interface CampaignWindow {
  schema: 'pw-engine-window-1'; id: string; manifestHash: string; implementationHash: string;
  startedAt: string; completedAt: string; mode: 'live' | 'replay'; complete: boolean;
  observations: CampaignObservation[]; failures: Array<{ id: string; reason: string }>;
  sourceReceiptHash: string;
}
export interface CheckedWindow { window: CampaignWindow; integrityVerified: boolean }

/** Observed acquisition days only. This result never approves sources or publication. */
export function assessCampaign(manifest: CampaignManifest, windows: CheckedWindow[], now = Date.now()) {
  const manifestHash = qualificationDigest(JSON.stringify(manifest));
  const expected = new Set(manifest.sources.map(s => s.id));
  if (manifest.schema !== 'pw-engine-qualification-1' || expected.size !== manifest.sources.length
      || !expected.size || expected.size > 30 || manifest.corpusHash !== qualificationDigest(JSON.stringify(manifest.sources))) {
    throw new Error('invalid_campaign_manifest');
  }
  const accepted: CampaignWindow[] = [];
  const results: Array<{ id: string; accepted: boolean; day: string | null; reasons: string[] }> = [];
  const ids = new Map<string, number>();
  for (const { window } of windows) ids.set(window.id, (ids.get(window.id) || 0) + 1);
  const sorted = [...windows].sort((a, b) => Date.parse(a.window.startedAt) - Date.parse(b.window.startedAt));
  for (const { window: w, integrityVerified } of sorted) {
    const reasons: string[] = [];
    const start = Date.parse(w.startedAt), end = Date.parse(w.completedAt);
    const validTime = Number.isFinite(start) && Number.isFinite(end) && start >= Date.parse(manifest.createdAt) && end >= start && end <= now && end - start <= 2 * 60 * 60 * 1000;
    const day = validTime ? qualificationDay(w.startedAt) : null;
    if (!integrityVerified) reasons.push('artifact_integrity_unverified');
    if (w.schema !== 'pw-engine-window-1' || w.manifestHash !== manifestHash || w.implementationHash !== manifest.implementationHash) reasons.push('cohort_mismatch');
    if ((ids.get(w.id) || 0) !== 1) reasons.push('duplicate_window_id');
    if (!validTime) reasons.push('invalid_observation_time');
    else if (qualificationDay(w.completedAt) !== day) reasons.push('window_crosses_local_date');
    if (w.mode !== 'live') reasons.push('replay_is_not_observation');
    if (!w.complete || w.failures.length) reasons.push('window_incomplete');
    const observed = new Set(w.observations.map(o => o.id));
    if (observed.size !== w.observations.length || observed.size !== expected.size || [...observed].some(id => !expected.has(id))) reasons.push('source_denominator_mismatch');
    for (const o of w.observations) {
      const at = Date.parse(o.observedAt);
      if (!Number.isFinite(at) || at < start || at > end) reasons.push('invalid_source_time');
      if (!o.fresh || o.status !== 200 || !['direct', 'http2', 'rendered'].includes(o.transport)) reasons.push('fresh_capture_required');
      if (!o.extractionCompleted || o.sourceDrift || !/^[a-f0-9]{64}$/.test(o.payloadHash) || !o.textHash || !/^[a-f0-9]{64}$/.test(o.textHash)) reasons.push('source_capture_incomplete');
    }
    if (!reasons.length) {
      const prior = accepted.at(-1);
      if (accepted.some(a => qualificationDay(a.startedAt) === day)) reasons.push('daily_window_already_counted');
      if (prior) {
        const previous = new Map(prior.observations.map(o => [o.id, Date.parse(o.observedAt)]));
        if (w.observations.some(o => Date.parse(o.observedAt) - previous.get(o.id)! < QUALIFICATION_MIN_INTERVAL_MS)) reasons.push('daily_interval_too_short');
      }
    }
    if (!reasons.length) accepted.push(w);
    results.push({ id: w.id, day, accepted: reasons.length === 0, reasons: [...new Set(reasons)] });
  }
  const first = accepted[0], last = accepted.at(-1);
  const minimumSpanMs = first && last ? Math.min(...last.observations.map(o => Date.parse(o.observedAt) - Date.parse(first.observations.find(p => p.id === o.id)!.observedAt))) : 0;
  return { schema: 'pw-engine-campaign-status-1', observedAt: new Date(now).toISOString(), manifestHash,
    sources: expected.size, observedWindows: windows.length, countedAcquisitionDays: accepted.length,
    targetDays: 3, minimumRequiredSpanHours: 48, observedMinimumSpanHours: minimumSpanMs / 3_600_000,
    acquisitionWindowTargetMet: accepted.length >= 3 && minimumSpanMs >= 48 * 3_600_000,
    sourceCompletenessQualified: false, real500SourceCapacityQualified: false, productionQualified: false,
    languageUnverifiedSources: [...new Set(accepted.flatMap(w => w.observations.filter(o => !o.languageMatches).map(o => o.id)))],
    windows: results,
    boundary: 'Fresh acquisition windows only. Completeness annotations, source approval, realistic capacity and publication qualification are separate and are not granted by this counter.' };
}
