import { load } from 'cheerio';
import { pathToFileURL } from 'node:url';

export async function verifyDiaryNavigation(origin, lang, get = fetch) {
  if (!['it', 'en'].includes(lang)) throw Error('Unsupported language');
  const home = new URL(lang === 'it' ? '/?lang=it' : '/', origin);
  const expected = new URL('/engine-6-preview' + (lang === 'it' ? '?lang=it' : '') + '#validation', origin);
  async function read(url) {
    const res = await get(url, { redirect: 'error', signal: AbortSignal.timeout(15000) });
    if (res.status !== 200) throw Error('Expected HTTP 200 for ' + url.pathname);
    return load(await res.text());
  }
  const $ = await read(home);
  const links = $('nav[aria-label="Engine 6 Preview access and evidence"] a[href]').toArray().filter(a => {
    const target = new URL($(a).attr('href'), home);
    return target.href === expected.href && (lang !== 'it' || $(a).attr('hreflang') === 'it');
  });
  if (links.length !== 1) throw Error('Missing or ambiguous diary link for ' + lang);
  const destination = new URL($(links[0]).attr('href'), home);
  const doc = await read(destination);
  if (doc('html').attr('lang') !== lang || doc('[id="validation"]').length !== 1 ||
      !doc('main section#validation h2').text().trim()) throw Error('Wrong diary language or validation section for ' + lang);
  return { language: lang, href: destination.href, section: 'validation' };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  for (const lang of ['en', 'it']) console.log(JSON.stringify(await verifyDiaryNavigation(process.argv[2], lang)));
}
