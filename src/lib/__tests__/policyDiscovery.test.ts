import { describe, expect, it } from 'vitest';
import {
  classifyPolicyCandidate,
  extractDiscoveryLinks,
  normalizeDiscoveredUrl,
  policyEvidenceScore,
} from '../policyDiscovery';

describe('policy discovery classification', () => {
  it('classifies policy type and jurisdiction from URL and link text', () => {
    expect(classifyPolicyCandidate('https://example.com/eu/privacy-policy')).toEqual({
      name: 'Privacy Policy (EU)',
      type: 'privacy',
      jurisdiction: 'EU',
    });
    expect(
      classifyPolicyCandidate('https://example.com/legal', 'Generative AI Terms')
    ).toEqual({
      name: 'AI Policy',
      type: 'ai',
      jurisdiction: 'Global',
    });
    expect(classifyPolicyCandidate('https://example.com/about')).toBeNull();
  });

  it('maps regional locale segments, query hints and ccTLDs to a jurisdiction instead of Global', () => {
    const cases: Array<[string, string]> = [
      ['https://www.apple.com/de/legal/privacy/', 'EU'],
      ['https://stripe.com/fr/privacy', 'EU'],
      ['https://www.example.com/it-it/privacy', 'EU'],
      ['https://www.example.com/es/privacidad', 'EU'],
      ['https://policies.google.com/privacy?hl=de', 'EU'],
      ['https://www.apple.com/uk/legal/privacy/', 'UK'],
      ['https://www.example.com/en-gb/legal/terms', 'UK'],
      ['https://www.example.com/us/legal/terms', 'US'],
      ['https://www.example.de/datenschutz', 'EU'],
      ['https://www.example.co.uk/legal/terms', 'UK'],
      ['https://www.example.com/legal/privacy', 'Global'],
    ];
    for (const [url, jurisdiction] of cases) {
      expect(classifyPolicyCandidate(url)?.jurisdiction, url).toBe(jurisdiction);
    }
  });

  it('uses the locale region without mapping non-European markets by language', () => {
    expect(classifyPolicyCandidate('https://example.com/privacy', '', 'fr-CA')?.jurisdiction).toBe('Global');
    expect(classifyPolicyCandidate('https://example.com/privacy', '', 'pt-BR')?.jurisdiction).toBe('Global');
    expect(classifyPolicyCandidate('https://example.com/privacy', '', 'es-MX')?.jurisdiction).toBe('Global');
    expect(classifyPolicyCandidate('https://example.com/privacy', '', 'fr-FR')?.jurisdiction).toBe('EU');
    expect(classifyPolicyCandidate('https://example.com/privacy', '', 'en-US')?.jurisdiction).toBe('US');
    expect(classifyPolicyCandidate('https://example.com/privacy', '', 'x-default')?.jurisdiction).toBe('Global');
  });

  it('recognizes uppercase market abbreviations in labels without reading lowercase pronouns', () => {
    expect(classifyPolicyCandidate('https://example.com/privacy', 'Privacy Policy (EU)')?.jurisdiction).toBe('EU');
    expect(classifyPolicyCandidate('https://example.com/privacy', 'Privacy Policy - UK')?.jurisdiction).toBe('UK');
    expect(classifyPolicyCandidate('https://example.com/privacy', 'Privacy Policy US')?.jurisdiction).toBe('US');
    expect(classifyPolicyCandidate('https://example.com/privacy', 'Privacy Policy, contact us')?.jurisdiction).toBe('Global');
  });

  it('does not read a jurisdiction from ambiguous words in link text', () => {
    // "contact us" must not classify as United States.
    expect(classifyPolicyCandidate('https://example.com/legal/privacy', 'Privacy Policy, contact us')?.jurisdiction)
      .toBe('Global');
  });

  it('attaches locale from hreflang alternates that lack a locale in the URL', () => {
    const html = `
      <link rel="alternate" hreflang="de" href="https://example.com/privacy-de" />
      <link rel="alternate" hreflang="en-gb" href="https://example.com/privacy-gb" />
    `;
    const links = extractDiscoveryLinks(html, 'https://example.com', 'page:direct');
    const de = links.find((link) => link.url === 'https://example.com/privacy-de');
    const gb = links.find((link) => link.url === 'https://example.com/privacy-gb');
    expect(de?.localeHint).toBe('de');
    expect(classifyPolicyCandidate(de!.url, de!.label, de!.localeHint)?.jurisdiction).toBe('EU');
    expect(classifyPolicyCandidate(gb!.url, gb!.label, gb!.localeHint)?.jurisdiction).toBe('UK');
  });

  it('requires type-specific legal-document evidence instead of generic policy words', () => {
    const privacyPolicy = `
      Privacy Policy. Last updated July 19, 2026. This privacy policy explains
      your rights, the data we collect, and the applicable law. ${'Details about personal data. '.repeat(120)}
    `;
    const supportArticle = `
      How to change your privacy settings. Open the app, select Settings, and
      choose who can see your profile. Read our help center for more answers.
    `;

    expect(policyEvidenceScore(privacyPolicy, 'privacy')).toBeGreaterThanOrEqual(4);
    expect(policyEvidenceScore(supportArticle, 'privacy')).toBe(0);
  });

  it('extracts policy links from HTML, XML sitemaps and robots files', () => {
    const html = `
      <a href="/privacy?utm_source=footer">Privacy notice</a>
      <loc>https://example.com/uk/terms-of-service</loc>
      Sitemap: https://example.com/legal-sitemap.xml
    `;
    const links = extractDiscoveryLinks(html, 'https://example.com', 'page:direct');

    expect(links.map((link) => link.url)).toEqual(expect.arrayContaining([
      'https://example.com/privacy',
      'https://example.com/uk/terms-of-service',
      'https://example.com/legal-sitemap.xml',
    ]));
  });

  it('rejects non-HTTP links and strips fragments and tracking parameters', () => {
    expect(normalizeDiscoveredUrl('mailto:privacy@example.com', 'https://example.com')).toBeNull();
    expect(
      normalizeDiscoveredUrl('/privacy?utm_campaign=test&region=eu#rights', 'https://example.com')
    ).toBe('https://example.com/privacy?region=eu');
  });
});
