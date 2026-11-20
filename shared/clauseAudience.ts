/** Quote only explicit audience wording. A policy's catalogue region is never an input. */
const region = '(?:UK|United Kingdom|EU|European Union|EEA|European Economic Area|US|United States|Italy|Italia|Regno Unito|Unione europea|SEE|Stati Uniti|California)';
const people = '(?:users?|residents?|consumers?|customers?|merchants?|subscribers?|developers?|account holders?)';
const italian = '(?:utenti|residenti|consumatori|clienti|abbonati|sviluppatori)';
const audience = new RegExp([
  `\\b${region}\\s+${people}\\b`,
  `\\b${people}\\s+(?:(?:who (?:live|reside)|located|based) )?(?:in|of) (?:the )?${region}\\b`,
  `\\bif you (?:are (?:located |based )?|live |reside )in (?:the )?${region}\\b`,
  `\\b${italian} (?:residenti |con sede )?(?:in |nel |negli |nell[’'])${region}\\b`,
  '\\b(?:adult users|business customers|enterprise customers|business users|registered developers|paid subscribers|utenti adulti|clienti aziendali|abbonati paganti)\\b',
].join('|'), 'gi');

export function clauseAudience(editedText: string, lang: 'it' | 'en'): string {
  const phrases = new Set<string>();
  for (const sentence of editedText.split(/[.!?;\n]+/u)) {
    // Exceptions and negative conditions need human interpretation.
    if (/\b(?:not|except|excluding|unless|other than|non|esclus[ioe]|eccetto|salvo)\b/i.test(sentence)) continue;
    for (const match of sentence.matchAll(audience)) phrases.add(match[0]);
  }
  if (!phrases.size) return lang === 'it' ? 'Applicabilità da verificare' : 'Applicability needs verification';
  return (lang === 'it' ? 'Destinatari citati nel testo' : 'Audience named in the text') + ' · ' + [...phrases].map(p => '“' + p + '”').join(', ');
}

export function editedSentences(value: { text: string; start: number; changedStart: number; changedEnd: number }) {
  const from = value.changedStart - value.start;
  const to = value.changedEnd - value.start;
  if (to <= from) return '';
  const boundary = /[.!?;\n]/u;
  const left = value.text.slice(0, from).split(boundary).at(-1) ?? '';
  const right = value.text.slice(to).split(boundary)[0];
  return left + value.text.slice(from, to) + right;
}
