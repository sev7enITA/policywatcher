import { describe, expect, it } from 'vitest';
import { validateCachedFeed, validateFeed } from '../src/domain/changeEvent';

const origin = 'https://policywatcher.online';
const id = '5a20e7d0-39bd-4c21-8a60-7165a8c7d1aa';

function validEnvelope() {
  return {
    schema: `${origin}/schemas/change-event-feed/v1`,
    schemaVersion: '1.0.0',
    mode: 'forward-polling',
    locale: 'it',
    count: 1,
    events: [{
      eventId: 'pwe_12345678901234567890',
      eventType: 'policy.change.published',
      schemaVersion: '1.0.0',
      occurredAt: '2026-08-18T10:20:00.000Z',
      subject: {
        changeId: id,
        company: { id: 'company_1', name: 'Acme Cloud', slug: 'acme-cloud', industry: 'Cloud' },
        policy: { id: 'policy_1', name: 'Cloud terms', type: 'Terms', jurisdiction: 'EU' },
      },
      screening: { overallRisk: 'High', overallScore: 82, summary: 'A bounded summary.', boundary: 'For human review; not legal advice.' },
      links: {
        change: `${origin}/change/${id}`,
        evidence: `${origin}/evidence/${id}`,
        evidenceJson: `${origin}/api/evidence-packet/${id}?format=json`,
      },
    }],
    boundary: 'A polling publication feed, not a live alert.',
  };
}

describe('public feed validation', () => {
  it('accepts and normalizes a known safe envelope', () => {
    const result = validateFeed(validEnvelope(), origin);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.feed.events[0]?.screening.overallRisk).toBe('High');
  });

  it('fails the entire envelope closed when an event is untrusted', () => {
    const envelope = validEnvelope();
    envelope.events[0]!.links.evidence = 'https://attacker.example/evidence/' + id;
    expect(validateFeed(envelope, origin)).toEqual({ ok: false, reason: 'invalid-event' });
  });

  it('rejects count mismatches and unknown schema versions', () => {
    const badCount = validEnvelope();
    badCount.count = 4;
    expect(validateFeed(badCount, origin)).toEqual({ ok: false, reason: 'invalid-count' });
    const unknown = validEnvelope();
    unknown.schemaVersion = '9.0.0';
    expect(validateFeed(unknown, origin)).toEqual({ ok: false, reason: 'unsupported-envelope' });
  });

  it('revalidates device cache and rejects a tampered URL', () => {
    const result = validateFeed(validEnvelope(), origin);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(validateCachedFeed(result.feed, origin)?.events).toHaveLength(1);
    const tampered = structuredClone(result.feed);
    tampered.events[0]!.links.change = 'https://attacker.example/change/' + id;
    expect(validateCachedFeed(tampered, origin)).toBeNull();
  });
});
