import { describe, expect, it } from 'vitest';
import {
  ROADMAP_SIGNAL_MAX_DRAFT_BYTES,
  buildRoadmapSignalIssueUrl,
  createRoadmapSignalDraft,
  generateRoadmapSignalIssue,
  parseRoadmapSignalDraft,
  serializeRoadmapSignalDraft,
  validateRoadmapSignalFields,
  type RoadmapSignalFields,
} from '../roadmapSignals';

const completeFields: RoadmapSignalFields = {
  title: 'Cross-version review workspace',
  track: 'Explainability',
  role: 'Policy researcher',
  decision: 'Compare why two recorded policy changes received different screening signals.',
  workaround: 'Open each evidence packet in a separate tab and reconcile notes manually.',
  evidenceNeed: 'A source-bound comparison with timestamps, KPI links and a CSV export.',
  evidenceDepth: 'forensic',
  limitations: 'A comparison may describe stored evidence but must not infer causality.',
  acceptanceSignal: 'I can reproduce the same comparison from two canonical change IDs.',
};

describe('roadmap signal drafts', () => {
  it('round-trips a bounded versioned draft', () => {
    const draft = {
      ...createRoadmapSignalDraft({ title: completeFields.title, track: completeFields.track }),
      savedAt: '2026-08-02T12:00:00.000Z',
      step: 2 as const,
      fields: completeFields,
    };
    expect(parseRoadmapSignalDraft(serializeRoadmapSignalDraft(draft))).toEqual(draft);
  });

  it('fails closed for corrupt, oversized, unknown-version and extra-key state', () => {
    expect(parseRoadmapSignalDraft('{broken')).toBeNull();
    expect(parseRoadmapSignalDraft('x'.repeat(ROADMAP_SIGNAL_MAX_DRAFT_BYTES + 1))).toBeNull();

    const draft = {
      ...createRoadmapSignalDraft(),
      savedAt: '2026-08-02T12:00:00.000Z',
    };
    expect(parseRoadmapSignalDraft(JSON.stringify({ ...draft, version: 2 }))).toBeNull();
    expect(parseRoadmapSignalDraft(JSON.stringify({ ...draft, unexpected: true }))).toBeNull();
    expect(parseRoadmapSignalDraft(JSON.stringify({ ...draft, fields: { ...draft.fields, title: 'x'.repeat(121) } }))).toBeNull();
  });
});

describe('roadmap signal validation and issue generation', () => {
  it('reports every required field without inventing an acceptance signal', () => {
    const errors = validateRoadmapSignalFields(createRoadmapSignalDraft().fields);
    expect(Object.keys(errors).sort()).toEqual([
      'decision',
      'evidenceDepth',
      'evidenceNeed',
      'limitations',
      'role',
      'title',
      'track',
      'workaround',
    ]);
    expect(errors.acceptanceSignal).toBeUndefined();
  });

  it('generates deterministic, sectioned GitHub content after validation', () => {
    const first = generateRoadmapSignalIssue(completeFields);
    const second = generateRoadmapSignalIssue({ ...completeFields });
    expect(second).toEqual(first);
    expect(first.title).toBe('Roadmap signal: Cross-version review workspace');
    expect(first.body).toContain('## Need');
    expect(first.body).toContain('## Evidence');
    expect(first.body).toContain('## Limits');
    expect(first.body).toContain('## Review signal');
    expect(first.body).toContain('explicit user action');
  });

  it('produces an encoded GitHub handoff without sending anything', () => {
    const url = buildRoadmapSignalIssueUrl(completeFields, 'https://github.com/example/policywatcher/');
    expect(url).toMatch(/^https:\/\/github\.com\/example\/policywatcher\/issues\/new\?/);
    const parsed = new URL(url);
    expect(parsed.searchParams.get('title')).toBe('Roadmap signal: Cross-version review workspace');
    expect(parsed.searchParams.get('body')).toContain('Prepared locally');
  });

  it('refuses to generate issue content from incomplete data', () => {
    expect(() => generateRoadmapSignalIssue(createRoadmapSignalDraft().fields)).toThrow(
      'INVALID_ROADMAP_SIGNAL_FIELDS',
    );
  });
});
