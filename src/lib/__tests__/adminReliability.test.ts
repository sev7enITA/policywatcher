import { describe, expect, it } from 'vitest';
import { hasFreshLiveCheck, isCompleteRegionalImpact } from '../datasetQuality';
import { extractPolicyText, validateContent } from '../scraper';

const now = Date.parse('2026-10-09T00:00:00Z');
describe('operational freshness follows live acquisition evidence', () => {
  const check = { checkedAt: new Date(now - 1000), status: 'Available', source: 'direct' };
  it('rejects archives, failures, future timestamps and stale successful checks', () => {
    expect(hasFreshLiveCheck([check], now)).toBe(true);
    expect(hasFreshLiveCheck([{ ...check, source: 'wayback' }], now)).toBe(false);
    expect(hasFreshLiveCheck([{ ...check, status: 'Needs Review' }], now)).toBe(false);
    expect(hasFreshLiveCheck([{ ...check, checkedAt: new Date(now + 1000) }], now)).toBe(false);
    expect(hasFreshLiveCheck([{ ...check, checkedAt: new Date(now - 31 * 3600000) }], now)).toBe(false);
    expect(hasFreshLiveCheck([], now)).toBe(false);
  });
  it('requires both regional narratives and a valid risk value', () => {
    const impact = { riskLevel: 'Low', impactAnalysisEn: 'Evidence in English', impactAnalysisIt: 'Evidenza in italiano' };
    expect(isCompleteRegionalImpact(impact)).toBe(true);
    expect(isCompleteRegionalImpact({ ...impact, impactAnalysisIt: '  ' })).toBe(false);
    expect(isCompleteRegionalImpact({ ...impact, riskLevel: 'Unknown' })).toBe(false);
  });
});

describe('OneTrust document extraction', () => {
  const notice = '<h2>COOKIE NOTICE</h2><p>Effective date: January 31, 2026</p>' +
    '<p>We use cookies to collect personal information when you use our services. You can withdraw consent and request deletion of your data. Our privacy policy describes processing, retention and third party sharing of personal data under this agreement.</p>'.repeat(5);
  const html = `<html><body><div class="ot-digital-policy-language-dropdown-wrapper">${'English Italian French '.repeat(150)}</div><div class="otnotice-content">${notice}</div></body></html>`;
  it('extracts the actual notice rather than the longer language picker', async () => {
    const text = extractPolicyText(html);
    expect(text).toContain('COOKIE NOTICE');
    expect(text).toContain('Effective date: January 31, 2026');
    expect(text).not.toContain('French');
    expect((await validateContent(html)).ok).toBe(true);
  });
  it('does not silently select a single notice when multiple documents are present', () => {
    const text = extractPolicyText(`<body><div class="otnotice-content">${notice}</div><div class="otnotice-content"><h2>Second Privacy Notice</h2><p>Separate agreement for business accounts.</p></div></body>`);
    expect(text).toContain('Second Privacy Notice');
  });
});
