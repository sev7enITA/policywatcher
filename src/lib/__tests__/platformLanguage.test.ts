import { describe, expect, it } from 'vitest';
import { browserLanguage, requestLanguage } from '../platformLanguage';
import { DEFAULT_GLOBAL_CONTEXT, resolvePlatformLanguage } from '../globalContext';
import { homeFaqs, homeStructuredData } from '../homeSeo';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import HomeKnowledgeSnapshot from '../../components/HomeKnowledgeSnapshot';

describe('interface language preference', () => {
  it.each([
    ['it-IT,it;q=0.9,en;q=0.8', 'it'], ['en-GB,en;q=0.9,it;q=0.8', 'en'],
    ['fr-FR, it-CH;q=0.8,en;q=0.7', 'it'], ['it;q=0,en;q=0.4', 'en'],
    ['en;q=0.2,it;q=0.9', 'it'], ['fr-FR', 'en'], ['', 'en'], ['it;q=NaN,en', 'en'],
  ])('negotiates %s as %s', (input, expected) => expect(browserLanguage(input)).toBe(expected));
  it('uses the browser preference list and never the selected country', () => {
    expect(browserLanguage(['fr-FR', 'it-IT', 'en-US'])).toBe('it');
    expect(resolvePlatformLanguage({ ...DEFAULT_GLOBAL_CONTEXT, country: 'it' }, 'en-GB')).toBe('en');
    expect(resolvePlatformLanguage({ ...DEFAULT_GLOBAL_CONTEXT, country: 'us' }, 'it-IT')).toBe('it');
  });
  it('remembers explicit choices, with URL translation links overriding defaults', () => {
    expect(requestLanguage(null, 'it', 'en-GB')).toBe('it');
    expect(requestLanguage(null, 'en', 'it-IT')).toBe('en');
    expect(requestLanguage('it', 'en', 'en-GB')).toBe('it');
    expect(requestLanguage(null, 'auto', 'it-IT')).toBe('it');
    expect(requestLanguage('invalid', 'invalid', 'it-IT')).toBe('it');
    expect(resolvePlatformLanguage({ ...DEFAULT_GLOBAL_CONTEXT, language: 'en' }, ['it-IT'])).toBe('en');
  });
  it.each(['it', 'en'] as const)('keeps %s FAQ structured data aligned with its visible translation', (lang) => {
    const faq = homeStructuredData(lang)['@graph'].find(entry => entry['@type'] === 'FAQPage');
    expect(faq).toMatchObject({ inLanguage: lang, mainEntity: homeFaqs(lang).map(item => ({
      name: item.question, acceptedAnswer: { text: item.answer },
    })) });
  });
  it('renders Italian public unavailable state without an English fallback', () => {
    const html = renderToStaticMarkup(createElement(HomeKnowledgeSnapshot, { data: null, lang: 'it' }));
    expect(html).toContain('Record verificati e collegamenti alle fonti');
    expect(html).toContain('temporaneamente non disponibile');
    expect(html).not.toContain('Public policy records');
    expect(html).not.toContain('The interactive dashboard');
  });
});
