export const SOURCE_ONBOARDING_MAX_ROWS = 100;
export const SOURCE_ONBOARDING_HEADERS = [
  'companyName',
  'companySlug',
  'industry',
  'website',
  'policyName',
  'policyType',
  'policyUrl',
  'jurisdiction',
] as const;

export const SOURCE_ONBOARDING_INDUSTRIES = [
  'Tech Giant',
  'FinTech',
  'Social Media',
  'E-Commerce',
  'AI Provider',
  'Cloud/SaaS',
] as const;

export const SOURCE_ONBOARDING_JURISDICTIONS = ['EU', 'US', 'UK', 'Global'] as const;

export type SourceOnboardingStage =
  | 'Proposed'
  | 'OfficialReview'
  | 'BaselinePending'
  | 'QaReview'
  | 'Ready'
  | 'Published'
  | 'Held'
  | 'Rejected'
  | 'Failed';

export type SourceOnboardingAction =
  | 'start-review'
  | 'approve-source'
  | 'reject-source'
  | 'baseline-captured'
  | 'run-qa'
  | 'publish'
  | 'hold'
  | 'reject-publication';

export interface SourceOnboardingInput {
  companyName: string;
  companySlug: string;
  industry: string;
  website: string;
  policyName: string;
  policyType: string;
  policyUrl: string;
  jurisdiction: string;
}

export interface SourceOnboardingPreviewRow extends SourceOnboardingInput {
  rowNumber: number;
  ready: boolean;
  duplicate: boolean;
  errors: string[];
}

export interface SourceOnboardingPreview {
  rows: SourceOnboardingPreviewRow[];
  errors: string[];
  readyCount: number;
  invalidCount: number;
}

export interface SourceQaCheck {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface SourceQaEvidence {
  policyId?: string | null;
  policyUrl?: string | null;
  ingestionMethod?: string | null;
  dataStatus?: string | null;
  currentHash?: string | null;
  snapshot?: {
    text?: string | null;
    hash?: string | null;
  } | null;
  checkLog?: {
    status?: string | null;
    source?: string | null;
    finalUrl?: string | null;
    textHash?: string | null;
    textLength?: number | null;
  } | null;
}

export interface SourceQaResult {
  status: 'Pass' | 'Fail';
  summary: string;
  checks: SourceQaCheck[];
}

export interface SourceOnboardingPipelineSummary {
  proposed: number;
  officialReview: number;
  baseline: number;
  qa: number;
  publication: number;
  rejectedAtReview: number;
  rejectedAtPublication: number;
  failed: number;
  accounted: number;
}

const PRIVATE_IPV4_PATTERNS = [
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^0\./,
];

function parseDelimitedRecords(text: string, delimiter: ',' | '\t'): string[][] {
  const records: string[][] = [];
  let record: string[] = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }
    if (!quoted && character === delimiter) {
      record.push(field.trim());
      field = '';
      continue;
    }
    if (!quoted && (character === '\n' || character === '\r')) {
      if (character === '\r' && text[index + 1] === '\n') index += 1;
      record.push(field.trim());
      field = '';
      if (record.some(Boolean)) records.push(record);
      record = [];
      continue;
    }
    field += character;
  }

  record.push(field.trim());
  if (record.some(Boolean)) records.push(record);
  return records;
}

function detectDelimiter(text: string): ',' | '\t' {
  const firstLine = text.split(/\r?\n/, 1)[0] || '';
  return firstLine.includes('\t') ? '\t' : ',';
}

export function normalizeSourceSlug(value: string, companyName = ''): string {
  const source = value.trim() || companyName.trim();
  return source
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function normalizeIndustry(value: string): string {
  const normalized = value.trim().toLowerCase();
  return SOURCE_ONBOARDING_INDUSTRIES.find((industry) => industry.toLowerCase() === normalized) || value.trim();
}

function normalizeJurisdiction(value: string): string {
  const normalized = value.trim().toLowerCase() || 'global';
  return SOURCE_ONBOARDING_JURISDICTIONS.find((jurisdiction) => jurisdiction.toLowerCase() === normalized) || value.trim();
}

function normalizeHttpUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  try {
    const url = new URL(trimmed);
    url.hash = '';
    return url.toString();
  } catch {
    return trimmed;
  }
}

function urlValidationError(value: string, label: string): string | null {
  if (!value) return `${label} is required.`;
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) return `${label} must use HTTP or HTTPS.`;
    if (url.username || url.password) return `${label} must not contain credentials.`;
    const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
    if (
      host === 'localhost' ||
      host === '::1' ||
      (host.includes(':') && /^(fc|fd|fe80:)/.test(host)) ||
      host.endsWith('.local') ||
      host.endsWith('.internal') ||
      PRIVATE_IPV4_PATTERNS.some((pattern) => pattern.test(host))
    ) {
      return `${label} must not target a private or local host.`;
    }
    return null;
  } catch {
    return `${label} must be a valid absolute URL.`;
  }
}

export function prepareSourceOnboardingRows(text: string): SourceOnboardingPreview {
  const records = parseDelimitedRecords(text.trim(), detectDelimiter(text));
  if (records.length === 0) {
    return { rows: [], errors: ['Paste CSV or TSV data with a header row.'], readyCount: 0, invalidCount: 0 };
  }

  const headers = records[0].map((header) => header.trim());
  const missingHeaders = SOURCE_ONBOARDING_HEADERS.filter((header) => !headers.includes(header));
  const errors: string[] = [];
  if (missingHeaders.length > 0) errors.push(`Missing required headers: ${missingHeaders.join(', ')}.`);
  if (records.length - 1 > SOURCE_ONBOARDING_MAX_ROWS) {
    errors.push(`A batch may contain at most ${SOURCE_ONBOARDING_MAX_ROWS} rows.`);
  }

  const seenPolicyKeys = new Set<string>();
  const seenCandidateKeys = new Set<string>();
  const rows = records.slice(1, SOURCE_ONBOARDING_MAX_ROWS + 1).map((values, index): SourceOnboardingPreviewRow => {
    const raw = Object.fromEntries(headers.map((header, headerIndex) => [header, values[headerIndex] || '']));
    const companyName = raw.companyName?.trim() || '';
    const companySlug = normalizeSourceSlug(raw.companySlug || '', companyName);
    const industry = normalizeIndustry(raw.industry || '');
    const website = normalizeHttpUrl(raw.website || '');
    const policyName = raw.policyName?.trim() || '';
    const policyType = normalizeSourceSlug(raw.policyType || '');
    const policyUrl = normalizeHttpUrl(raw.policyUrl || '');
    const jurisdiction = normalizeJurisdiction(raw.jurisdiction || 'Global');
    const rowErrors: string[] = [];

    if (!companyName) rowErrors.push('Company name is required.');
    if (!companySlug) rowErrors.push('Company slug could not be derived.');
    if (!SOURCE_ONBOARDING_INDUSTRIES.includes(industry as (typeof SOURCE_ONBOARDING_INDUSTRIES)[number])) {
      rowErrors.push(`Industry must be one of: ${SOURCE_ONBOARDING_INDUSTRIES.join(', ')}.`);
    }
    if (!policyName) rowErrors.push('Policy name is required.');
    if (!policyType) rowErrors.push('Policy type is required.');
    if (!SOURCE_ONBOARDING_JURISDICTIONS.includes(jurisdiction as (typeof SOURCE_ONBOARDING_JURISDICTIONS)[number])) {
      rowErrors.push(`Jurisdiction must be one of: ${SOURCE_ONBOARDING_JURISDICTIONS.join(', ')}.`);
    }
    const websiteError = urlValidationError(website, 'Company website');
    const policyUrlError = urlValidationError(policyUrl, 'Policy URL');
    if (websiteError) rowErrors.push(websiteError);
    if (policyUrlError) rowErrors.push(policyUrlError);

    const policyKey = `${companySlug}|${policyType}|${jurisdiction.toLowerCase()}`;
    const candidateKey = `${policyKey}|${policyUrl.toLowerCase()}`;
    const duplicate = seenPolicyKeys.has(policyKey) || seenCandidateKeys.has(candidateKey);
    if (duplicate) rowErrors.push('Duplicate policy source within this pasted batch.');
    seenPolicyKeys.add(policyKey);
    seenCandidateKeys.add(candidateKey);

    return {
      rowNumber: index + 2,
      companyName,
      companySlug,
      industry,
      website,
      policyName,
      policyType,
      policyUrl,
      jurisdiction,
      duplicate,
      ready: rowErrors.length === 0 && errors.length === 0,
      errors: rowErrors,
    };
  });

  return {
    rows,
    errors,
    readyCount: rows.filter((row) => row.ready).length,
    invalidCount: rows.filter((row) => !row.ready).length,
  };
}

const ALLOWED_TRANSITIONS: Record<SourceOnboardingStage, Partial<Record<SourceOnboardingAction, SourceOnboardingStage>>> = {
  Proposed: { 'start-review': 'OfficialReview' },
  OfficialReview: { 'approve-source': 'BaselinePending', 'reject-source': 'Rejected' },
  BaselinePending: { 'baseline-captured': 'QaReview' },
  QaReview: { 'run-qa': 'Ready', 'reject-publication': 'Rejected' },
  Ready: { publish: 'Published', hold: 'Held', 'reject-publication': 'Rejected' },
  Published: { hold: 'Held' },
  Held: { publish: 'Published', 'reject-publication': 'Rejected' },
  Rejected: {},
  Failed: {},
};

export function transitionSourceOnboardingStage(
  stage: SourceOnboardingStage,
  action: SourceOnboardingAction
): SourceOnboardingStage | null {
  return ALLOWED_TRANSITIONS[stage][action] || null;
}

function normalizedHostname(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

function hasSourceContinuity(policyUrl: string | null | undefined, finalUrl: string | null | undefined): boolean {
  const expected = normalizedHostname(policyUrl);
  const actual = normalizedHostname(finalUrl);
  if (!expected || !actual) return false;
  return expected === actual || expected.endsWith(`.${actual}`) || actual.endsWith(`.${expected}`);
}

export function evaluateSourceOnboardingQa(evidence: SourceQaEvidence): SourceQaResult {
  const sourceGrade = ['direct', 'http2', 'rendered', 'wayback', 'commoncrawl'];
  const checks: SourceQaCheck[] = [
    {
      id: 'linked-policy',
      label: 'Linked policy',
      passed: Boolean(evidence.policyId),
      detail: evidence.policyId ? 'The onboarding item is linked to a configured policy.' : 'No configured policy is linked.',
    },
    {
      id: 'non-seeded-ingestion',
      label: 'Non-seeded ingestion',
      passed: Boolean(evidence.ingestionMethod && evidence.ingestionMethod.toLowerCase() !== 'seeded'),
      detail: `Ingestion method: ${evidence.ingestionMethod || 'missing'}.`,
    },
    {
      id: 'acceptable-status',
      label: 'Acceptable policy status',
      passed: evidence.dataStatus === 'Available' || evidence.dataStatus === 'Reviewed',
      detail: `Policy status: ${evidence.dataStatus || 'missing'}.`,
    },
    {
      id: 'source-grade-log',
      label: 'Source-grade successful check',
      passed: Boolean(
        evidence.checkLog &&
        evidence.checkLog.status === 'Available' &&
        sourceGrade.includes((evidence.checkLog.source || '').toLowerCase())
      ),
      detail: `Latest source-grade log: ${evidence.checkLog?.source || 'missing'} / ${evidence.checkLog?.status || 'missing'}.`,
    },
    {
      id: 'non-empty-evidence',
      label: 'Non-empty captured evidence',
      passed: Boolean(evidence.snapshot?.text?.trim() && (evidence.checkLog?.textLength || 0) > 0),
      detail: `Captured text length: ${evidence.snapshot?.text?.length || 0}.`,
    },
    {
      id: 'hash-consistency',
      label: 'Snapshot and hash consistency',
      passed: Boolean(
        evidence.currentHash &&
        evidence.snapshot?.hash &&
        evidence.checkLog?.textHash &&
        evidence.currentHash === evidence.snapshot.hash &&
        evidence.snapshot.hash === evidence.checkLog.textHash
      ),
      detail: 'Policy, snapshot, and successful check hashes must match.',
    },
    {
      id: 'source-continuity',
      label: 'Official URL continuity',
      passed: hasSourceContinuity(evidence.policyUrl, evidence.checkLog?.finalUrl),
      detail: `Configured host: ${normalizedHostname(evidence.policyUrl) || 'missing'}; final host: ${normalizedHostname(evidence.checkLog?.finalUrl) || 'missing'}.`,
    },
  ];
  const failed = checks.filter((check) => !check.passed);
  return {
    status: failed.length === 0 ? 'Pass' : 'Fail',
    summary: failed.length === 0
      ? `All ${checks.length} source onboarding QA checks passed.`
      : `${failed.length} of ${checks.length} checks failed: ${failed.map((check) => check.label).join(', ')}.`,
    checks,
  };
}

export function canPublishSourceOnboardingItem(input: { stage: string; qaStatus: string }): boolean {
  return (input.stage === 'Ready' || input.stage === 'Held') && input.qaStatus === 'Pass';
}

export function summarizeSourceOnboardingBatch(stages: string[]) {
  const terminalStages = new Set(['Published', 'Held', 'Rejected', 'Failed']);
  const failedItems = stages.filter((stage) => stage === 'Failed').length;
  const terminal = stages.length > 0 && stages.every((stage) => terminalStages.has(stage));
  const status = failedItems === stages.length
    ? 'Failed'
    : terminal && failedItems === 0
      ? 'Completed'
      : failedItems > 0
        ? 'Partial'
        : 'Active';

  return {
    totalItems: stages.length,
    successfulItems: stages.length - failedItems,
    failedItems,
    status,
    terminal,
  };
}

export function summarizeSourceOnboardingPipeline(
  items: Array<{ stage: string; policyId?: string | null }>
): SourceOnboardingPipelineSummary {
  const rejectedAtReview = items.filter((item) => item.stage === 'Rejected' && !item.policyId).length;
  const rejectedAtPublication = items.filter((item) => item.stage === 'Rejected' && Boolean(item.policyId)).length;
  const proposed = items.filter((item) => item.stage === 'Proposed').length;
  const officialReview = items.filter((item) => item.stage === 'OfficialReview').length + rejectedAtReview;
  const baseline = items.filter((item) => item.stage === 'BaselinePending').length;
  const qa = items.filter((item) => item.stage === 'QaReview').length;
  const publication = items.filter((item) => ['Ready', 'Published', 'Held'].includes(item.stage)).length + rejectedAtPublication;
  const failed = items.filter((item) => item.stage === 'Failed').length;
  return {
    proposed,
    officialReview,
    baseline,
    qa,
    publication,
    rejectedAtReview,
    rejectedAtPublication,
    failed,
    accounted: proposed + officialReview + baseline + qa + publication + failed,
  };
}
