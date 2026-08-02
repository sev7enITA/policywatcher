export const ROADMAP_SIGNAL_DRAFT_VERSION = 1 as const;
export const ROADMAP_SIGNAL_STORAGE_KEY = 'policywatcher_roadmap_signal_v1';
export const ROADMAP_SIGNAL_MAX_DRAFT_BYTES = 12_000;

export const ROADMAP_SIGNAL_FIELD_LIMITS = {
  title: 120,
  track: 60,
  role: 120,
  decision: 800,
  workaround: 800,
  evidenceNeed: 1_000,
  limitations: 1_000,
  acceptanceSignal: 500,
} as const;

export const ROADMAP_SIGNAL_DEPTHS = ['snapshot', 'operational', 'forensic'] as const;

export type RoadmapSignalDepth = (typeof ROADMAP_SIGNAL_DEPTHS)[number];
export type RoadmapSignalStep = 0 | 1 | 2 | 3;

export type RoadmapSignalFields = {
  title: string;
  track: string;
  role: string;
  decision: string;
  workaround: string;
  evidenceNeed: string;
  evidenceDepth: RoadmapSignalDepth | '';
  limitations: string;
  acceptanceSignal: string;
};

export type RoadmapSignalDraft = {
  version: typeof ROADMAP_SIGNAL_DRAFT_VERSION;
  savedAt: string;
  step: RoadmapSignalStep;
  fields: RoadmapSignalFields;
};

export type RoadmapSignalField = keyof RoadmapSignalFields;
export type RoadmapSignalValidationErrors = Partial<Record<RoadmapSignalField, string>>;

export function bringRoadmapSignalStepIntoView(
  body: Pick<HTMLElement, 'scrollTo'>,
  heading: Pick<HTMLElement, 'focus'> | null,
) {
  body.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  heading?.focus({ preventScroll: true });
}

const draftKeys = ['version', 'savedAt', 'step', 'fields'] as const;
const fieldKeys = [
  'title',
  'track',
  'role',
  'decision',
  'workaround',
  'evidenceNeed',
  'evidenceDepth',
  'limitations',
  'acceptanceSignal',
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, expected: readonly string[]) {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  return actual.length === wanted.length && actual.every((key, index) => key === wanted[index]);
}

function byteLength(value: string) {
  return new TextEncoder().encode(value).byteLength;
}

function isBoundedString(value: unknown, limit: number) {
  return typeof value === 'string' && value.length <= limit;
}

function isCanonicalDate(value: unknown) {
  if (typeof value !== 'string') return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString() === value;
}

export function createRoadmapSignalDraft(
  seed: Partial<Pick<RoadmapSignalFields, 'title' | 'track'>> = {},
  savedAt = new Date(0).toISOString(),
): RoadmapSignalDraft {
  return {
    version: ROADMAP_SIGNAL_DRAFT_VERSION,
    savedAt,
    step: 0,
    fields: {
      title: seed.title ?? '',
      track: seed.track ?? '',
      role: '',
      decision: '',
      workaround: '',
      evidenceNeed: '',
      evidenceDepth: '',
      limitations: '',
      acceptanceSignal: '',
    },
  };
}

export function parseRoadmapSignalDraft(raw: string | null): RoadmapSignalDraft | null {
  if (!raw || byteLength(raw) > ROADMAP_SIGNAL_MAX_DRAFT_BYTES) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!isRecord(parsed) || !hasExactKeys(parsed, draftKeys)) return null;
  if (parsed.version !== ROADMAP_SIGNAL_DRAFT_VERSION || !isCanonicalDate(parsed.savedAt)) return null;
  if (![0, 1, 2, 3].includes(parsed.step as number)) return null;
  if (!isRecord(parsed.fields) || !hasExactKeys(parsed.fields, fieldKeys)) return null;

  const fields = parsed.fields;
  if (!isBoundedString(fields.title, ROADMAP_SIGNAL_FIELD_LIMITS.title)) return null;
  if (!isBoundedString(fields.track, ROADMAP_SIGNAL_FIELD_LIMITS.track)) return null;
  if (!isBoundedString(fields.role, ROADMAP_SIGNAL_FIELD_LIMITS.role)) return null;
  if (!isBoundedString(fields.decision, ROADMAP_SIGNAL_FIELD_LIMITS.decision)) return null;
  if (!isBoundedString(fields.workaround, ROADMAP_SIGNAL_FIELD_LIMITS.workaround)) return null;
  if (!isBoundedString(fields.evidenceNeed, ROADMAP_SIGNAL_FIELD_LIMITS.evidenceNeed)) return null;
  if (!isBoundedString(fields.limitations, ROADMAP_SIGNAL_FIELD_LIMITS.limitations)) return null;
  if (!isBoundedString(fields.acceptanceSignal, ROADMAP_SIGNAL_FIELD_LIMITS.acceptanceSignal)) return null;
  if (fields.evidenceDepth !== '' && !ROADMAP_SIGNAL_DEPTHS.includes(fields.evidenceDepth as RoadmapSignalDepth)) return null;

  return parsed as RoadmapSignalDraft;
}

export function serializeRoadmapSignalDraft(draft: RoadmapSignalDraft) {
  const serialized = JSON.stringify(draft);
  const parsed = parseRoadmapSignalDraft(serialized);
  if (!parsed) throw new Error('INVALID_ROADMAP_SIGNAL_DRAFT');
  return serialized;
}

export function validateRoadmapSignalFields(fields: RoadmapSignalFields): RoadmapSignalValidationErrors {
  const errors: RoadmapSignalValidationErrors = {};
  const required: Array<[RoadmapSignalField, string]> = [
    ['title', 'Add a concise proposal title.'],
    ['track', 'Choose a roadmap track.'],
    ['role', 'Describe the role that needs this capability.'],
    ['decision', 'Describe the decision or job to accomplish.'],
    ['workaround', 'Describe the current workflow or workaround.'],
    ['evidenceNeed', 'Describe the evidence, view or export needed.'],
    ['evidenceDepth', 'Choose an evidence depth.'],
    ['limitations', 'Describe acceptable limitations or risks.'],
  ];

  for (const [field, message] of required) {
    if (!fields[field].trim()) errors[field] = message;
  }

  for (const field of fieldKeys) {
    if (field === 'evidenceDepth') continue;
    const limit = ROADMAP_SIGNAL_FIELD_LIMITS[field];
    if (fields[field].length > limit) errors[field] = `Keep this field within ${limit} characters.`;
  }

  if (fields.evidenceDepth && !ROADMAP_SIGNAL_DEPTHS.includes(fields.evidenceDepth)) {
    errors.evidenceDepth = 'Choose a supported evidence depth.';
  }

  return errors;
}

function quoteAnswer(value: string) {
  return value
    .replace(/\r\n?/g, '\n')
    .trim()
    .split('\n')
    .map((line) => `> ${line}`)
    .join('\n');
}

function oneLine(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

export function generateRoadmapSignalIssue(fields: RoadmapSignalFields) {
  const errors = validateRoadmapSignalFields(fields);
  if (Object.keys(errors).length > 0) throw new Error('INVALID_ROADMAP_SIGNAL_FIELDS');

  const title = `Roadmap signal: ${oneLine(fields.title)}`;
  const acceptance = fields.acceptanceSignal.trim()
    ? quoteAnswer(fields.acceptanceSignal)
    : '> Not specified. Please derive a testable signal during review.';
  const body = [
    '## Proposal profile',
    '',
    `- Track: ${oneLine(fields.track)}`,
    `- Role: ${oneLine(fields.role)}`,
    `- Preferred evidence depth: ${fields.evidenceDepth}`,
    '',
    '## Need',
    '',
    '### Decision or job to accomplish',
    quoteAnswer(fields.decision),
    '',
    '### Current workflow or workaround',
    quoteAnswer(fields.workaround),
    '',
    '## Evidence',
    '',
    '### Evidence, view or export needed',
    quoteAnswer(fields.evidenceNeed),
    '',
    '## Limits',
    '',
    '### Acceptable limitations or risks',
    quoteAnswer(fields.limitations),
    '',
    '## Review signal',
    '',
    '### Optional acceptance signal',
    acceptance,
    '',
    '---',
    'Prepared locally in the PolicyWatcher roadmap composer. Opening this issue is an explicit user action.',
  ].join('\n');

  return { title, body };
}

export function buildRoadmapSignalIssueUrl(fields: RoadmapSignalFields, repositoryUrl: string) {
  const issue = generateRoadmapSignalIssue(fields);
  return `${repositoryUrl.replace(/\/$/, '')}/issues/new?title=${encodeURIComponent(issue.title)}&body=${encodeURIComponent(issue.body)}`;
}
