import ledgerJson from '../../data/releases/release-evidence-ledger.v1.json';

export type ReleasePulseWave = 'technical' | 'distribution' | 'product' | 'experience' | 'assurance';
export type ReleasePulseLocale = 'en' | 'it';
export type LocalizedReleasePulseText = Record<ReleasePulseLocale, string>;

export interface ReleasePulseMetric {
  value: string;
  label: LocalizedReleasePulseText;
}

export interface ReleasePulseEntry {
  version: string;
  displayVersion: string;
  date: string;
  title: LocalizedReleasePulseText;
  wave: ReleasePulseWave;
  impact: LocalizedReleasePulseText;
  metrics: ReleasePulseMetric[];
  evidence: string[];
  boundary: LocalizedReleasePulseText;
}

export interface ReleaseEvidenceLedger {
  $schema: string;
  schemaVersion: 'policywatcher-release-evidence-ledger.v1';
  generatedAt: string;
  window: { start: string; end: string; inclusiveDays: 14; timezone: 'UTC' };
  currentRelease: string;
  integrity: { algorithm: 'sha256'; canonicalization: 'JSON.stringify(releases)'; digest: string };
  claimBoundary: string;
  releases: ReleasePulseEntry[];
}

const WAVES = new Set<ReleasePulseWave>(['technical', 'distribution', 'product', 'experience', 'assurance']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function validateLocalized(value: unknown, field: string): asserts value is LocalizedReleasePulseText {
  if (!isRecord(value) || typeof value.en !== 'string' || value.en.length < 4 || typeof value.it !== 'string' || value.it.length < 4) {
    throw new Error(`Release evidence ledger ${field} must contain bounded EN/IT copy.`);
  }
}

export function validateReleaseEvidenceLedger(value: unknown): asserts value is ReleaseEvidenceLedger {
  if (!isRecord(value) || value.schemaVersion !== 'policywatcher-release-evidence-ledger.v1') throw new Error('Unsupported release evidence ledger schema.');
  if (!isRecord(value.window) || !isIsoDate(value.window.start) || !isIsoDate(value.window.end) || value.window.inclusiveDays !== 14 || value.window.timezone !== 'UTC') {
    throw new Error('Release evidence ledger requires one inclusive 14-day UTC window.');
  }
  const start = Date.parse(`${value.window.start}T00:00:00Z`);
  const end = Date.parse(`${value.window.end}T00:00:00Z`);
  if ((end - start) / 86_400_000 + 1 !== 14) throw new Error('Release evidence ledger window is not 14 inclusive days.');
  if (!isRecord(value.integrity) || value.integrity.algorithm !== 'sha256' || typeof value.integrity.digest !== 'string' || !/^[a-f0-9]{64}$/.test(value.integrity.digest)) {
    throw new Error('Release evidence ledger requires a SHA-256 digest.');
  }
  if (!Array.isArray(value.releases) || value.releases.length === 0) throw new Error('Release evidence ledger entries are missing.');
  const versions = new Set<string>();
  let previousDate = '';
  for (const release of value.releases) {
    if (!isRecord(release) || typeof release.version !== 'string' || versions.has(release.version)) throw new Error('Release evidence ledger versions must be unique.');
    versions.add(release.version);
    if (!isIsoDate(release.date) || release.date < value.window.start || release.date > value.window.end || release.date < previousDate) {
      throw new Error(`Release evidence ledger date is invalid or out of order: ${release.version}.`);
    }
    previousDate = release.date;
    if (!WAVES.has(release.wave as ReleasePulseWave)) throw new Error(`Release wave is invalid: ${release.version}.`);
    validateLocalized(release.title, `${release.version} title`);
    validateLocalized(release.impact, `${release.version} impact`);
    validateLocalized(release.boundary, `${release.version} boundary`);
    if (!Array.isArray(release.metrics) || release.metrics.length === 0 || release.metrics.length > 4) throw new Error(`Release metrics are invalid: ${release.version}.`);
    if (!Array.isArray(release.evidence) || release.evidence.length === 0) throw new Error(`Release evidence references are missing: ${release.version}.`);
  }
  if (value.currentRelease !== value.releases.at(-1)?.version) throw new Error('Current release must be the final ledger entry.');
}

export function releasesInWindow(
  releases: readonly ReleasePulseEntry[],
  start: string,
  end: string,
): ReleasePulseEntry[] {
  return releases.filter((release) => release.date >= start && release.date <= end).sort((a, b) => a.date.localeCompare(b.date) || a.version.localeCompare(b.version));
}

validateReleaseEvidenceLedger(ledgerJson);

export const RELEASE_EVIDENCE_LEDGER = ledgerJson as ReleaseEvidenceLedger;

export function getReleaseEvidencePulse(): ReleasePulseEntry[] {
  return releasesInWindow(RELEASE_EVIDENCE_LEDGER.releases, RELEASE_EVIDENCE_LEDGER.window.start, RELEASE_EVIDENCE_LEDGER.window.end);
}
