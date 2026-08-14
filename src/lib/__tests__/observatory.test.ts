import { describe, expect, it } from 'vitest';
import {
  buildObservatoryIcs,
  compareObservatoryDeadlines,
  getObservatoryCountdown,
  observatorySignals,
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
  it('keeps the July 2026 watchlist source-specific and reviewable', () => {
    expect(observatorySignals.map((signal) => signal.id)).toEqual([
      'eu-ai-act-article-50-guidelines',
      'edpb-anonymisation-web-scraping-guidelines',
      'ftc-ai-accuracy-comment-watch',
      'ico-safe-ai-workplan',
    ]);

    for (const signal of observatorySignals) {
      expect(signal.sourceUrl).toMatch(/^https:\/\//);
      expect(signal.publishedOn).toMatch(/^2026-\d{2}-\d{2}$/);
      expect(signal.reviewUtc).toMatch(/^2026\d{4}T\d{6}Z$/);
    }

    const ftc = observatorySignals.find((signal) => signal.id === 'ftc-ai-accuracy-comment-watch');
    expect(ftc?.summary.en).toContain('not a final rule');
    expect(observatorySignals.find((signal) => signal.id === 'edpb-anonymisation-web-scraping-guidelines')?.reviewUtc).toBe('20261030T090000Z');
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
        it: 'Review',
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
        it: 'Remote room',
      },
      summary: {
        en: 'Governance, privacy; and standards \\ review\r\nURL:https://evil.example',
        it: 'Governance review',
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
