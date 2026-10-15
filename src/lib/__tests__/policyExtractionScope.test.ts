import { describe, expect, it } from 'vitest';

import { extractPolicyText, validateContent } from '../scraper';

const policy = 'Privacy policy. We collect personal data with your consent. You may delete your account. Terms of service apply. '.repeat(15);
describe('fragment scope cannot widen silently', () => {
  it('rejects a missing anchor even when the body is a valid long policy', async () => {
    expect(await validateContent(`<main>${policy}</main>`, 'https://example.com/legal#missing')).toEqual({ ok: false, reason: 'scope_missing' });
  });
  it('does not borrow a sibling section to satisfy a short heading scope', async () => {
    const html = `<article><h2 id="privacy">Privacy</h2><p>Short policy.</p><h2>Other terms</h2><p>${policy}</p></article>`;
    expect(extractPolicyText(html, 'https://example.com/legal#privacy')).toBe('');
    expect(await validateContent(html, 'https://example.com/legal#privacy')).toEqual({ ok: false, reason: 'scope_incomplete' });
  });
  it('retains a valid scoped section and excludes sibling text', async () => {
    const html = `<article><h2 id="privacy">Privacy</h2><p>${policy}</p><h2>Other</h2><p>UNRELATED_SENTINEL</p></article>`;
    const result = await validateContent(html, 'https://example.com/legal#privacy');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.text).not.toContain('UNRELATED_SENTINEL');
  });

  it('does not widen a short element to its containing article', async () => {
    const html = `<article><div id="privacy">Short policy.</div><p>${policy}</p></article>`;
    expect(await validateContent(html, 'https://example.com/legal#privacy')).toEqual({ ok: false, reason: 'scope_incomplete' });
  });

  it('preserves a malformed fragment as a requested scope', async () => {
    expect(await validateContent(`<main>${policy}</main>`, 'https://example.com/legal#bad%')).toEqual({ ok: false, reason: 'scope_missing' });
  });

  it('accepts a short legitimate section only with an explicit minimum contract', async () => {
    const text = 'Privacy policy: We collect personal data only with consent. You may request deletion of your account. Terms of service apply to this agreement.';
    const html = `<main><section id="privacy"><p>${text}</p></section></main>`;
    expect((await validateContent(html, 'https://example.com/legal#privacy')).ok).toBe(false);
    expect((await validateContent(html, 'https://example.com/legal#privacy', { minimumTextLength: 100 })).ok).toBe(true);
    expect(await validateContent(html, 'https://example.com/legal#privacy', { minimumTextLength: 0 })).toEqual({ ok: false, reason: 'invalid_extraction_contract' });
  });
});
