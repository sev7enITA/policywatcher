export type PressCoverageKind = 'editorial-article' | 'newsletter-article' | 'professional-post';
export type PressCoverageLanguage = 'en' | 'it';
export type PressCoverageTitleStatus = 'publisher-supplied' | 'registry-description';

export interface PressCoverageRecord {
  id: string;
  sourceName: string;
  platform: string;
  kind: PressCoverageKind;
  language: PressCoverageLanguage;
  publishedDate: string;
  datePrecision: 'month' | 'day';
  recordedAt: string;
  reviewedAt: string;
  title: string;
  titleStatus: PressCoverageTitleStatus;
  summary: string;
  sourceUrl: string;
  caseSlug?: 'meta-ai' | 'tiktok-audience';
  localPreview?: { src: string; alt: string };
  relationship: 'external editorial reference' | 'external professional reference';
  recordStatus: 'source-linked';
}

export const PRESS_COVERAGE_AS_OF = '2026-11-20' as const;
export const PRESS_COVERAGE_SCHEMA_VERSION = '1.1.0' as const;
export const PRESS_COVERAGE_BOUNDARY =
  'Registry inclusion records a public external reference. It does not establish endorsement, certification, independent audit, readership, reach or factual validation by PolicyWatcher.' as const;

export const pressCoverageRecords: readonly PressCoverageRecord[] = [
  {
    id: 'coverage-economy-magazine-2026-11-19',
    sourceName: 'Economy Magazine',
    caseSlug: 'meta-ai',
    platform: 'Economy Magazine',
    kind: 'editorial-article',
    language: 'it',
    publishedDate: '2026-11-19',
    datePrecision: 'day',
    recordedAt: '2026-11-20',
    reviewedAt: '2026-11-20',
    title: 'PolicyWatcher, lo strumento gratuito che segue i cambiamenti delle regole digitali',
    titleStatus: 'publisher-supplied',
    summary: 'Economy Magazine describes how individuals and businesses can follow changes to privacy terms and the use of their data.',
    sourceUrl: 'https://www.economymagazine.it/policywatcher-lo-strumento-gratuito-che-segue-i-cambiamenti-delle-regole-digitali/',
    relationship: 'external editorial reference',
    recordStatus: 'source-linked',
  },
  {
    id: 'coverage-fortune-italia-2026-11-18',
    sourceName: 'Fortune Italia',
    caseSlug: 'tiktok-audience',
    platform: 'Fortune Italia',
    kind: 'editorial-article',
    language: 'it',
    publishedDate: '2026-11-18',
    datePrecision: 'day',
    recordedAt: '2026-11-20',
    reviewedAt: '2026-11-20',
    title: 'Dati e intelligenza artificiale: PolicyWatcher di Fabrizio Degni aiuta a capire come cambiano le regole dei servizi digitali',
    titleStatus: 'publisher-supplied',
    summary: 'Fortune Italia examines how readers can trace an AI-assisted summary back to earlier policy text and how a change in supplier terms can prompt an internal review.',
    sourceUrl: 'https://www.fortuneita.com/2026/11/18/dati-e-intelligenza-artificiale-policywatcher-di-fabrizio-degni-aiuta-a-capire-come-cambiano-le-regole-dei-servizi-digitali/',
    relationship: 'external editorial reference',
    recordStatus: 'source-linked',
  },
  {
    id: 'coverage-toms-hardware-it-2026-07',
    sourceName: "Tom's Hardware Italia",
    platform: "Tom's Hardware Italia",
    kind: 'editorial-article',
    language: 'it',
    publishedDate: '2026-07',
    datePrecision: 'month',
    recordedAt: '2026-07-29',
    reviewedAt: '2026-07-29',
    title: 'PolicyWatcher: osservare le policy delle Big Tech come infrastruttura civica',
    titleStatus: 'publisher-supplied',
    summary: 'Article describing PolicyWatcher as a civic-tech project for inspecting changes in configured public policy sources.',
    sourceUrl: 'https://www.tomshw.it/business/policywatcher-osservare-le-policy-delle-big-tech-come-infrastruttura-civica',
    localPreview: { src: '/press/toms-hardware-policywatcher.jpg', alt: "Preview of the Tom's Hardware Italia PolicyWatcher article" },
    relationship: 'external editorial reference',
    recordStatus: 'source-linked',
  },
  {
    id: 'coverage-massimo-chiriatti-linkedin-2026-07',
    sourceName: 'Massimo Chiriatti',
    platform: 'LinkedIn',
    kind: 'professional-post',
    language: 'it',
    publishedDate: '2026-07',
    datePrecision: 'month',
    recordedAt: '2026-07-29',
    reviewedAt: '2026-07-29',
    title: 'Public LinkedIn post sharing the PolicyWatcher repository',
    titleStatus: 'registry-description',
    summary: 'Public professional post linking to the PolicyWatcher repository in an AI and digital-policy context.',
    sourceUrl: 'https://www.linkedin.com/posts/massimochiriatti_github-sev7enitapolicywatcher-ai-powered-activity-7480524272717914113-drNk',
    localPreview: { src: '/press/massimo-chiriatti-linkedin.png', alt: 'Preview of the Massimo Chiriatti LinkedIn post' },
    relationship: 'external professional reference',
    recordStatus: 'source-linked',
  },
  {
    id: 'coverage-michele-iaselli-linkedin-2026-07',
    sourceName: 'Michele Iaselli',
    platform: 'LinkedIn',
    kind: 'professional-post',
    language: 'it',
    publishedDate: '2026-07',
    datePrecision: 'month',
    recordedAt: '2026-07-29',
    reviewedAt: '2026-07-29',
    title: 'Public LinkedIn post discussing PolicyWatcher in an AI-governance context',
    titleStatus: 'registry-description',
    summary: 'Public professional post discussing PolicyWatcher in relation to policy monitoring and AI governance.',
    sourceUrl: 'https://www.linkedin.com/posts/micheleiaselli_policywatcher-aigovernance-policy-activity-7476170330156273665-oz42',
    localPreview: { src: '/press/michele-iaselli-linkedin.jpg', alt: 'Preview of the Michele Iaselli LinkedIn post' },
    relationship: 'external professional reference',
    recordStatus: 'source-linked',
  },
  {
    id: 'coverage-gladiatori-digitali-2026-07',
    sourceName: 'Giovanna Panucci / Gladiatori Digitali',
    platform: 'Substack',
    kind: 'newsletter-article',
    language: 'it',
    publishedDate: '2026-07',
    datePrecision: 'month',
    recordedAt: '2026-07-29',
    reviewedAt: '2026-07-29',
    title: 'Come monitorare policy, privacy e AI Act dei principali tool di intelligenza artificiale',
    titleStatus: 'publisher-supplied',
    summary: 'Newsletter article discussing PolicyWatcher as a public-repository tool for inspecting policy, privacy and AI-governance sources.',
    sourceUrl: 'https://avvocatogiovannapanucci.substack.com/p/come-monitorare-policy-privacy-e',
    localPreview: { src: '/press/gladiatori-digitali-panucci.png', alt: 'Preview of the Gladiatori Digitali PolicyWatcher article' },
    relationship: 'external editorial reference',
    recordStatus: 'source-linked',
  },
] as const;

export const pressCoverageKindLabels: Record<PressCoverageKind, string> = {
  'editorial-article': 'Editorial article',
  'newsletter-article': 'Newsletter article',
  'professional-post': 'Professional post',
};

export function formatPressCoverageDate(record: Pick<PressCoverageRecord, 'publishedDate' | 'language'>): string {
  const [year, month, day] = record.publishedDate.split('-').map(Number);
  return new Intl.DateTimeFormat(record.language === 'it' ? 'it-IT' : 'en-GB', {
    day: day ? 'numeric' : undefined, month: 'long', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day ?? 1)));
}

export function buildPressCoverageCitation(record: PressCoverageRecord): string {
  const titleMarker = record.titleStatus === 'publisher-supplied' ? `“${record.title}”` : record.title;
  return `${record.sourceName}, ${titleMarker}, ${record.platform}, ${formatPressCoverageDate(record)}, ${record.sourceUrl} (accessed [date]).`;
}

export function getPressCoverageSummary(records: readonly PressCoverageRecord[] = pressCoverageRecords) {
  return {
    total: records.length,
    sourceLinked: records.filter((record) => record.recordStatus === 'source-linked').length,
    editorial: records.filter((record) => record.kind !== 'professional-post').length,
    professionalPosts: records.filter((record) => record.kind === 'professional-post').length,
    byLanguage: {
      en: records.filter((record) => record.language === 'en').length,
      it: records.filter((record) => record.language === 'it').length,
    },
  };
}

export function buildPressCoveragePayload() {
  return {
    schema: 'https://policywatcher.online/schemas/press-coverage/v1',
    schemaVersion: PRESS_COVERAGE_SCHEMA_VERSION,
    asOf: PRESS_COVERAGE_AS_OF,
    canonicalUrl: 'https://policywatcher.online/press',
    boundary: PRESS_COVERAGE_BOUNDARY,
    summary: getPressCoverageSummary(),
    records: pressCoverageRecords.map((record) => ({
      ...record,
      ...(record.caseSlug ? { caseUrl: `https://policywatcher.online/press/cases/${record.caseSlug}?lang=${record.language}` } : {}),
      dateLabel: formatPressCoverageDate(record),
      citation: buildPressCoverageCitation(record),
    })),
  };
}
