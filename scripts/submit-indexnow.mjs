#!/usr/bin/env node
// Submit explicitly selected, newly published/changed URLs, never an entire archive by default.
import fs from 'node:fs';
import { load } from 'cheerio';
const { origin, key } = JSON.parse(fs.readFileSync(new URL('./indexnow-key.json', import.meta.url), 'utf8'));
const paths = process.argv.slice(2);
if (!paths.length || paths.length > 100) throw new Error('Supply 1–100 changed public paths.');
const urls = [...new Set(paths.map(path => {
  const url = new URL(path, origin);
  if (url.origin !== origin || url.pathname.startsWith('/api/') || url.hash) throw new Error('Only canonical public page URLs are accepted.');
  return url.href;
}))];
const keyLocation = `${origin}/${key}.txt`;
const proof = await fetch(keyLocation, { signal: AbortSignal.timeout(20000) });
if (!proof.ok || (await proof.text()).trim() !== key) throw new Error('Ownership file is not deployed.');
for (const url of urls) {
  const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(20000) });
  const $ = load(await response.text());
  if (response.status !== 200 || $('link[rel="canonical"]').attr('href') !== url
    || /noindex/i.test(`${response.headers.get('x-robots-tag')} ${$('meta[name="robots"]').attr('content')}`)) {
    throw new Error(`Page is not an indexable canonical URL: ${url}`);
  }
}
const response = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: new URL(origin).hostname, key, keyLocation, urlList: urls }),
  signal: AbortSignal.timeout(30000),
});
console.log(JSON.stringify({ submittedAt: new Date().toISOString(), status: response.status, urlList: urls,
  accepted: response.status === 200 || response.status === 202, note: 'Submission is not proof of crawling or indexing.' }, null, 2));
if (![200, 202].includes(response.status)) process.exitCode = 1;
