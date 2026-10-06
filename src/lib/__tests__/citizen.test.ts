import { describe, expect, it } from 'vitest';
import {
  buildCitizenDossier, citizenFreshness, emptyCitizenPreferences, evaluateCitizenChoice,
  matchCitizenNotice, parseCitizenFeed, parseCitizenPreferences, type CitizenChoice, type CitizenFeed,
} from '../../../shared/citizen';
import { CITIZEN_GUIDES, citizenGuideFreshness, citizenGuidesForService } from '../../../shared/citizenGuides';

const now = new Date('2026-10-06T12:00:00Z');
const feed: CitizenFeed = {
  schemaVersion: '1.0', generatedAt: now.toISOString(), catalogTruncated: false,
  services: [{ id: 'service1', name: 'OpenAI', slug: 'openai', website: 'https://openai.com', policies: [{
    id: 'policy1', name: 'Terms', type: 'terms', jurisdiction: 'Global', sourceUrl: 'https://openai.com/policies/terms',
    lastRetrievedAt: now.toISOString(), freshness: 'recent', latestChange: { id: 'change1', publishedAt: '2026-10-05T12:00:00Z' },
  }] }],
  changes: [{ id: 'change1', serviceId: 'service1', policyId: 'policy1', publishedAt: '2026-10-05T12:00:00Z', detectedAt: '2026-10-01T12:00:00Z',
    summary: { it: 'Un aggiornamento da leggere.', en: 'An update to read.' }, kind: 'needs_review', impact: 'not_assessed',
    evidence: [{ before: 'old', after: 'new' }], detailPath: '/change/change1', evidencePath: '/api/evidence-packet/change1' }],
  history: { limit: 25, hasMore: false, nextCursor: null },
};
const choice: CitizenChoice = {
  id: 'choice1', serviceId: 'service1', serviceName: 'OpenAI', policyId: 'policy1', policyName: 'Terms',
  changeId: 'change1', baselinePublishedAt: '2026-10-05T12:00:00Z', status: 'action_recorded', recordedAt: now.toISOString(),
};

describe('citizen choices and trustworthy local state', () => {
  it('records a declaration without claiming a verified account effect', () => {
    expect(evaluateCitizenChoice(choice, feed, true, now)).toBe('recorded');
    expect(buildCitizenDossier({ locale: 'it', choice, change: feed.changes[0], policy: feed.services[0].policies[0] })).toContain('non è stato verificato');
    expect(buildCitizenDossier({ locale: 'it', choice })).toContain('Ho eseguito un’azione');
    expect(buildCitizenDossier({ locale: 'it', choice })).not.toContain('action_recorded');
  });
  it('reopens a choice for a later publication even if detection happened earlier', () => {
    const updated = structuredClone(feed);
    updated.services[0].policies[0].latestChange = { id: 'late-publication', publishedAt: '2026-10-06T11:00:00Z' };
    expect(evaluateCitizenChoice(choice, updated, true, now)).toBe('revisit');
    expect(choice.changeId).toBe('change1');
  });
  it('reopens different records at the same publication time and explicit reminders', () => {
    const updated = structuredClone(feed);
    updated.services[0].policies[0].latestChange!.id = 'another-record';
    expect(evaluateCitizenChoice(choice, updated, true, now)).toBe('revisit');
    expect(evaluateCitizenChoice({ ...choice, status: 'remind_me' }, feed, true, now)).toBe('revisit');
  });
  it('keeps offline, missing and old source coverage unknown', () => {
    expect(evaluateCitizenChoice(choice, feed, false, now)).toBe('unknown');
    expect(evaluateCitizenChoice(choice, null, true, now)).toBe('unknown');
    expect(evaluateCitizenChoice(choice, { ...feed, services: [] }, true, now)).toBe('unknown');
    const old = structuredClone(feed);
    old.services[0].policies[0].lastRetrievedAt = '2026-08-01T00:00:00Z';
    expect(evaluateCitizenChoice(choice, old, true, now)).toBe('unknown');
    expect(evaluateCitizenChoice(choice, feed, true, new Date('2026-11-01'))).toBe('unknown');
    const withdrawn = structuredClone(feed);
    withdrawn.services[0].policies[0].latestChange = null;
    expect(evaluateCitizenChoice(choice, withdrawn, true, now)).toBe('unknown');
  });
  it('does not treat future or missing acquisition times as recent', () => {
    for (const value of [null, 'not a date', '2027-01-01']) expect(citizenFreshness(value, now)).toBe('unavailable');
    expect(citizenFreshness('2026-10-01', now)).toBe('recent');
    expect(citizenFreshness('2026-09-01', now)).toBe('dated');
  });
  it('round-trips bounded choices while discarding unknown personal payloads', () => {
    const prefs = { ...emptyCitizenPreferences(), followed: [{ serviceId: 'service1', name: 'OpenAI', slug: 'openai', plan: 'Personal' }], choices: [choice], rawNotice: 'PRIVATE-PASTED-CONTENT' };
    const parsed = parseCitizenPreferences(JSON.stringify(prefs));
    expect(parsed?.choices).toEqual([choice]);
    expect(JSON.stringify(parsed)).not.toContain('PRIVATE-PASTED-CONTENT');
  });
  it('rejects corruption, unknown versions, duplicate ids and oversized data', () => {
    const prefs = emptyCitizenPreferences();
    for (const raw of ['{', JSON.stringify({ ...prefs, version: 2 }), JSON.stringify({ ...prefs, country: 'guessed-location' }),
      JSON.stringify({ ...prefs, choices: [choice, choice] }), JSON.stringify({ ...prefs, choices: [{ ...choice, status: 'verified' }] }),
      JSON.stringify({ ...prefs, savedChangeIds: Array.from({ length: 101 }, (_, i) => String(i)) })]) expect(parseCitizenPreferences(raw)).toBeNull();
  });
});

describe('local notice matching and support', () => {
  it('matches public metadata locally without fetching pasted links or returning personal text', () => {
    const text = 'To: private@example.com\nhttps://openai.com/policies/terms?token=secret#personal';
    const matches = matchCitizenNotice(text, feed.services);
    expect(matches.map(s => s.id)).toEqual(['service1']);
    expect(JSON.stringify(matches)).not.toMatch(/private@example|token=secret/);
  });
  it('does not match an attacker suffix or a name embedded inside a word', () => {
    expect(matchCitizenNotice('https://openai.com.attacker.example/terms', feed.services)).toEqual([]);
    expect(matchCitizenNotice('notopenaiword', feed.services)).toEqual([]);
  });
  it('limits UTF-8 bytes including emoji on native runtimes without TextEncoder', () => {
    expect(() => matchCitizenNotice('😀'.repeat(5121), feed.services)).toThrow('INPUT_TOO_LARGE');
    expect(matchCitizenNotice('😀'.repeat(5120), feed.services)).toEqual([]);
  });
  it('creates a support draft without inventing a choice and without HTML execution', () => {
    const draft = buildCitizenDossier({ locale: 'it', service: feed.services[0], change: feed.changes[0], policy: feed.services[0].policies[0], note: '<script>test</script>', generatedAt: now.toISOString() });
    expect(draft).toContain('Nessuna scelta dichiarata');
    expect(draft).toContain('https://policywatcher.online/change/change1');
    expect(draft).toContain('Nessun invio automatico');
    expect(draft).toContain('<script>test</script>'); // plain text, never innerHTML
  });
});

describe('citizen API payload validation and official guides', () => {
  it('accepts bounded public payload and strips uncontracted raw fields', () => {
    expect(parseCitizenFeed({ ...feed, rawText: 'private', internalLogs: [] })).toEqual(feed);
  });
  it('rejects cross-service orphan records, executable links and contradictory pagination', () => {
    const changed = structuredClone(feed); changed.changes[0].serviceId = 'missing';
    expect(parseCitizenFeed(changed)).toBeNull();
    const badLink = structuredClone(feed); badLink.services[0].policies[0].sourceUrl = 'javascript:alert(1)';
    expect(parseCitizenFeed(badLink)).toBeNull();
    const badPath = structuredClone(feed); badPath.changes[0].detailPath = 'https://attacker.example';
    expect(parseCitizenFeed(badPath)).toBeNull();
    expect(parseCitizenFeed({ ...feed, history: { limit: 25, hasMore: true, nextCursor: null } })).toBeNull();
  });
  it('ages curated guide reviews separately from account verification', () => {
    const guide = citizenGuidesForService('openai')[0];
    expect(guide).toBeDefined();
    expect(citizenGuideFreshness(guide, now)).toBe('current');
    expect(citizenGuideFreshness(guide, new Date('2027-02-01'))).toBe('review_due');
    expect(citizenGuideFreshness(guide, new Date('2026-01-01'))).toBe('review_due');
    expect(citizenGuidesForService('unknown-service')).toEqual([]);
    expect(CITIZEN_GUIDES.every(g => new URL(g.officialUrl).protocol === 'https:')).toBe(true);
  });
});
