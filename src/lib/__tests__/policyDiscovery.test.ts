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
