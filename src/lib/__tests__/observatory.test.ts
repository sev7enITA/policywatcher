import { describe, expect, it } from 'vitest';
import { buildObservatoryIcs, type ObservatoryEvent } from '../observatory';

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
