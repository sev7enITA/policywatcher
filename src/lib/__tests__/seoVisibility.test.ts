import { describe, expect, it } from 'vitest';
import { classifyPolicyChange } from '../changeClassification';
import { captureFreshness, changeSearchDescription, languageAlternates, publicRequestLanguage, recordIdentity, withSocialMetadata } from '../seo';
import { getPolicyGuide, guideMatchesPolicy, policyGuides } from '../policyGuides';

describe('public search and language identity', () => {
  it('distinguishes jurisdiction, policy and recorded version in search titles', () => {
    const record = { company: 'Example', policy: 'Privacy Policy', jurisdiction: 'EU', date: '2026-09-12T09:00:00Z', version: 2 };
    const identities = [record, { ...record, jurisdiction: 'US' }, { ...record, policy: 'Terms' }, { ...record, version: 3 }].map(recordIdentity);
    expect(new Set(identities).size).toBe(4);
    expect(identities[0]).toContain('2026-09-12');
  });
  it('describes observed differences independently of legacy AI summaries', () => {
    const snapshot = { policyId: 'p', publicEvidence: true, version: 1, text: 'We retain data for 30 days.' };
    const classification = classifyPolicyChange({ oldSnapshot: snapshot, newSnapshot: { ...snapshot, version: 2, text: 'We retain data for 90 days.' } });
    const record = { company: 'Example', policy: 'Privacy', jurisdiction: 'EU', date: '2026-09-12', version: 2 };
    expect(changeSearchDescription(record, classification, 'en')).toContain('Needs verification');
    expect(changeSearchDescription(record, classification, 'en')).not.toContain('Unchanged content');
    expect(changeSearchDescription(record, classification, 'it')).toContain('Da verificare');
  });
  it('keeps both translations self-canonical with reciprocal language alternatives', () => {
    const en = languageAlternates('/guides/privacy-policy-changes?lang=en', 'en');
    const it = languageAlternates('/guides/privacy-policy-changes?lang=it', 'it');
    expect(en.canonical).toBe(en.languages.en);
    expect(it.canonical).toBe(en.languages.it);
    expect(en.languages).toEqual(it.languages);
    expect(en.languages['x-default']).toBe(en.canonical);
    expect(en.canonical).not.toContain('?lang=');
  });
  it.each([
    ['/it/associazioni', undefined, 'it'], ['/en/associations', 'it', 'en'],
    ['/change/example', 'it', 'it'], ['/pulse/story', 'it', 'it'],
    ['/guides', 'it', 'it'], ['/guides/privacy-policy-changes', 'it', 'it'],
    ['/browser-extension', 'it', 'it'], ['/about', 'it', 'en'], ['/knowledge', 'it', 'en'],
    ['/', 'it', 'en'], ['/guides', 'fr', 'en'],
  ])('selects document language only for a supported translated route: %s %s', (path, query, lang) => {
    expect(publicRequestLanguage(path, query)).toBe(lang);
  });
  it('gives static pages their own social title, URL and usable image', () => {
    const metadata = withSocialMetadata({ title: 'About the project', description: 'Project background', alternates: { canonical: '/about' } });
    expect(metadata.openGraph).toMatchObject({ title: 'About the project', url: 'https://policywatcher.online/about', images: [{ url: 'https://policywatcher.online/api/og/home', width: 1200, height: 630, alt: 'PolicyWatcher' }] });
    expect(metadata.twitter).toMatchObject({ card: 'summary_large_image', title: 'About the project' });
  });
  it('preserves route-specific social images and article metadata', () => {
    const metadata = withSocialMetadata({ title: 'A record', alternates: languageAlternates('/change/example', 'it'), openGraph: { type: 'article', images: [{ url: 'https://policywatcher.online/api/og/change/example' }] } }, 'it');
    expect(metadata.openGraph).toMatchObject({ type: 'article', locale: 'it_IT', images: [{ url: 'https://policywatcher.online/api/og/change/example' }] });
    expect(metadata.twitter?.images).toEqual([{ url: 'https://policywatcher.online/api/og/change/example' }]);
  });
});

describe('capture age and relevant guides', () => {
  const now = new Date('2026-09-23T12:00:00Z');
  it('separates a dated capture from an unavailable date without asserting scan health', () => {
    expect(captureFreshness('2026-09-12T12:00:00Z', now)).toEqual({ ageDays: 11, status: 'dated' });
    expect(captureFreshness('2026-09-22T12:00:00Z', now)).toEqual({ ageDays: 1, status: 'recent' });
    for (const date of [null, 'invalid', '2027-01-01']) expect(captureFreshness(date, now).status).toBe('unavailable');
  });
  it('selects public policy subjects without matching every policy to every guide', () => {
    const privacy = getPolicyGuide('privacy-policy-changes')!;
    const ai = getPolicyGuide('ai-provider-policy-updates')!;
    expect(guideMatchesPolicy(privacy, { type: 'privacy', name: 'Notice', company: { slug: 'example' } })).toBe(true);
    expect(guideMatchesPolicy(privacy, { type: 'terms', name: 'Terms', company: { slug: 'example' } })).toBe(false);
    expect(guideMatchesPolicy(ai, { type: 'terms', name: 'Terms', company: { slug: 'openai' } })).toBe(true);
    expect(guideMatchesPolicy(ai, { type: 'privacy', name: 'Notice', company: { slug: 'example' } })).toBe(false);
    expect(getPolicyGuide('nonexistent')).toBeUndefined();
    expect(new Set(policyGuides.map(guide => guide.slug)).size).toBe(policyGuides.length);
  });
});
