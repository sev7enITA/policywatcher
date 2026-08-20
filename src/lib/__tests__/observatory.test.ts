import { describe, expect, it } from 'vitest';
import {
  buildObservatoryIcs,
  compareObservatoryDeadlines,
  getMetaObservatoryMetrics,
  getObservatoryCountdown,
  OBSERVATORY_VERIFIED_AT,
  observatoryMetaInsights,
  observatorySignals,
  observatorySources,
  type ObservatorySourceKind,
  type ObservatoryEvent,
} from '../observatory';

describe('getObservatoryCountdown', () => {
  it('compares UTC calendar days instead of elapsed 24-hour periods', () => {
    const now = new Date('2026-07-21T23:55:00Z');

    expect(getObservatoryCountdown(new Date('2026-07-21T23:59:00Z'), now)).toBe('Today');
    expect(getObservatoryCountdown(new Date('2026-07-22T00:01:00Z'), now)).toBe('Tomorrow');
    expect(getObservatoryCountdown(new Date('2026-07-23T12:00:00Z'), now)).toBe('D-2');
    expect(getObservatoryCountdown(new Date('2026-07-20T23:59:00Z'), now)).toBe('Review due');
  });
});

describe('observatory source facts', () => {
  it('supports repository and tracker as future normalized source kinds', () => {
    const futureKinds: ObservatorySourceKind[] = ['repository', 'tracker'];

    expect(futureKinds).toEqual(['repository', 'tracker']);
    expect(observatorySources.some((source) => futureKinds.includes(source.kind))).toBe(false);
  });

  it('catalogues eight normalized sources and keeps AI Observatory behind the source gate', () => {
    expect(observatorySources).toHaveLength(8);

    const aiObservatory = observatorySources.find((source) => source.id === 'ai-observatory');
    expect(aiObservatory).toMatchObject({
      name: 'AI Observatory',
      shortName: 'AI Observatory',
      url: 'https://www.ai-observatory.org/',
      region: 'Global',
      kind: 'observatory',
      evidenceStatus: 'source-review',
      evidenceRole: 'research-context',
      evidenceReady: false,
      accessCapability: 'public-web',
    });
    expect(aiObservatory?.note.en).toMatch(/methodology and outputs must pass/i);
    expect(aiObservatory?.note.en).toMatch(/not used as sole evidence/i);

    const normalizedKinds = new Set<ObservatorySourceKind>([
      'observatory',
      'authority',
      'standards-hub',
      'repository',
      'tracker',
    ]);
    const normalizedRoles = new Set([
      'policy-context',
      'binding-implementation',
      'enforcement',
      'standards-implementation',
      'research-context',
    ]);
    const normalizedStatuses = new Set(['verified', 'source-review']);

    for (const source of observatorySources) {
      expect(normalizedKinds.has(source.kind)).toBe(true);
      expect(normalizedRoles.has(source.evidenceRole)).toBe(true);
      expect(normalizedStatuses.has(source.evidenceStatus)).toBe(true);
      expect(source.lastReviewLabel.en.length).toBeGreaterThan(0);
      if (source.evidenceStatus === 'source-review') {
        expect(source.evidenceReady).toBe(false);
      }
      if (source.evidenceReady) {
        expect(source.evidenceStatus).toBe('verified');
      }
    }

    expect(getMetaObservatoryMetrics()).toEqual({
      censusSources: 8,
      verifiedSources: 7,
      evidenceReadySources: 7,
      sourcesUnderReview: 1,
      insightLenses: 3,
    });
  });

  it('keeps cross-source insights referentially valid and covers the whole census', () => {
    const sourceIds = new Set(observatorySources.map((source) => source.id));
    const insightSourceIds = new Set(observatoryMetaInsights.flatMap((insight) => insight.sourceIds));

    for (const insight of observatoryMetaInsights) {
      expect(insight.evidenceBoundary).toBe('catalog-inference');
      expect(insight.sourceIds.length).toBeGreaterThan(1);
      for (const sourceId of insight.sourceIds) {
        expect(sourceIds.has(sourceId), `${insight.id}: ${sourceId}`).toBe(true);
      }
    }

    expect(insightSourceIds).toEqual(sourceIds);
    const aiInsights = observatoryMetaInsights.filter((insight) => insight.sourceIds.includes('ai-observatory'));
    expect(aiInsights).toHaveLength(1);
    expect(aiInsights[0]?.lens).toBe('blind-spot');
    expect(aiInsights[0]?.summary.en).toMatch(/catalogued under source review/i);
  });

  it('keeps the August 2026 applicability updates first, source-specific and reviewable', () => {
    expect(observatorySignals.map((signal) => signal.id)).toEqual([
      'eu-ai-act-article-50-in-force-2026',
      'eu-ai-act-gpai-full-enforcement-2026',
      'eu-ai-literacy-supervision-2026',
      'eu-ai-act-article-50-guidelines',
      'edpb-anonymisation-web-scraping-guidelines',
      'ftc-ai-accuracy-comment-watch',
      'ico-safe-ai-workplan',
    ]);
    expect(OBSERVATORY_VERIFIED_AT).toBe('17 August 2026');

    for (const signal of observatorySignals) {
      expect(signal.sourceUrl).toMatch(/^https:\/\//);
      expect(signal.publishedOn).toMatch(/^2026-\d{2}-\d{2}$/);
      expect(signal.reviewUtc).toMatch(/^2026\d{4}T\d{6}Z$/);
    }

    const ftc = observatorySignals.find((signal) => signal.id === 'ftc-ai-accuracy-comment-watch');
    expect(ftc?.summary.en).toContain('not a final rule');
    expect(observatorySignals.find((signal) => signal.id === 'edpb-anonymisation-web-scraping-guidelines')?.reviewUtc).toBe('20261030T090000Z');
    expect(observatorySignals.slice(0, 3).every((signal) => signal.state === 'In force')).toBe(true);
    expect(observatorySignals[0]?.summary.en).toContain('2 December 2026');
    expect(observatorySignals[1]?.sourceUrl).toContain('/guidelines-obligations-general-purpose-ai-providers');
    expect(observatorySignals[2]?.sourceUrl).toContain('/ai-literacy-questions-answers');
  });

  it('orders future deadlines before overdue work and remains deterministic', () => {
    const now = new Date('2026-07-27T12:00:00Z');
    const items = [
      { id: 'overdue-old', deadlineAt: Date.parse('2026-07-20T09:00:00Z') },
      { id: 'future-later', deadlineAt: Date.parse('2026-09-01T09:00:00Z') },
      { id: 'overdue-recent', deadlineAt: Date.parse('2026-07-26T09:00:00Z') },
      { id: 'future-next', deadlineAt: Date.parse('2026-08-02T09:00:00Z') },
    ];

    expect(items.sort((a, b) => compareObservatoryDeadlines(a, b, now)).map((item) => item.id)).toEqual([
      'future-next',
      'future-later',
      'overdue-recent',
      'overdue-old',
    ]);
  });
});

describe('buildObservatoryIcs', () => {
  it('escapes calendar text fields so event content cannot inject ICS properties', () => {
    const event: ObservatoryEvent = {
      id: 'security-review',
      title: {
        en: 'Review\nATTACH:https://evil.example/payload\nBEGIN:VEVENT',
        it: 'Revisione',
      },
      organizer: 'PolicyWatcher Observatory',
      dateLabel: {
        en: 'Review window',
        it: 'Finestra review',
      },
      timeLabel: {
        en: '09:00 UTC',
        it: '09:00 UTC',
      },
      location: {
        en: 'Remote room\r\nLOCATION:Injected',
        it: 'Registro remoto',
      },
      summary: {
        en: 'Governance, privacy; and standards \\ review\r\nURL:https://evil.example',
        it: 'Revisione governance',
      },
      href: 'https://example.com/source?x=1,2;y=3',
      calendar: {
        startUtc: '20261005T090000Z',
        endUtc: '20261005T093000Z',
        filename: 'security-review.ics',
      },
    };

    const ics = buildObservatoryIcs(event);
    const unfolded = ics.replace(/\r\n /g, '');
    const lines = unfolded.split('\r\n');

    expect(lines.filter((line) => line === 'BEGIN:VEVENT')).toHaveLength(1);
    expect(lines.filter((line) => line === 'END:VEVENT')).toHaveLength(1);
    expect(lines.some((line) => line.startsWith('ATTACH:'))).toBe(false);
    expect(lines.some((line) => line === 'LOCATION:Injected')).toBe(false);
    expect(lines.some((line) => line === 'URL:https://evil.example')).toBe(false);
    expect(unfolded).toContain('SUMMARY:Review\\nATTACH:https://evil.example/payload\\nBEGIN:VEVENT');
    expect(unfolded).toContain('DESCRIPTION:Governance\\, privacy\\; and standards \\\\ review\\nURL:https://evil.example');
    expect(unfolded).toContain('LOCATION:Remote room\\nLOCATION:Injected');
    expect(unfolded).toContain('URL:https://example.com/source?x=1,2;y=3');

    const italian = buildObservatoryIcs(event, 'it').replace(/\r\n /g, '');
    expect(italian).toContain('PRODID:-//PolicyWatcher//Observatory//IT');
    expect(italian).toContain('SUMMARY:Revisione');
    expect(italian).toContain('DESCRIPTION:Revisione governance Fonte: https://example.com/source?x=1\\,2\\;y=3');
    expect(italian).toContain('LOCATION:Registro remoto');
  });

  it('rejects unsafe calendar URL schemes', () => {
    const event: ObservatoryEvent = {
      id: 'unsafe-url',
      title: { en: 'Unsafe URL', it: 'Unsafe URL' },
      organizer: 'PolicyWatcher Observatory',
      dateLabel: { en: 'Review window', it: 'Finestra review' },
      timeLabel: { en: '09:00 UTC', it: '09:00 UTC' },
      location: { en: 'Remote registry review', it: 'Remote registry review' },
      summary: { en: 'Review source.', it: 'Review source.' },
      href: 'javascript:alert(1)',
      calendar: {
        startUtc: '20261005T090000Z',
        endUtc: '20261005T093000Z',
        filename: 'unsafe-url.ics',
      },
    };

    expect(() => buildObservatoryIcs(event)).toThrow('Invalid observatory calendar URL protocol');
  });
});
