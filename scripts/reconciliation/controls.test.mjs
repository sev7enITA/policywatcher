import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { verifyDiaryNavigation } from './diary-navigation.mjs';
import { capturePassages, replay } from './passages.mjs';
const base = 'https://example.test';
const en = '<a href="/engine-6-preview#validation">Read the diary</a>';
const it = '<a lang="it" hreflang="it" href="/engine-6-preview?lang=it#validation">Leggi il diario</a>';
function navigate(links, language = 'it', section = 'validation') {
  return async url => new Response(url.pathname === '/'
    ? '<nav aria-label="Engine 6 Preview access and evidence">' + links + '</nav>'
    : '<html lang="' + language + '"><main><section id="' + section + '"><h2>Diary</h2></section></main></html>');
}
test('Italian link is required even when the English diary link works', async () => {
  await verifyDiaryNavigation(base, 'en', navigate(en, 'en'));
  await assert.rejects(verifyDiaryNavigation(base, 'it', navigate(en)), /Missing or ambiguous/);
  await verifyDiaryNavigation(base, 'it', navigate(en + it));
});
test('wrong destination language, fragment or origin fails', async () => {
  await assert.rejects(verifyDiaryNavigation(base, 'it', navigate(it, 'en')), /Wrong diary/);
  await assert.rejects(verifyDiaryNavigation(base, 'it', navigate(it, 'it', 'old')), /Wrong diary/);
  await assert.rejects(verifyDiaryNavigation(base, 'it', navigate(it.replace('href="/','href="https://other.example/'))), /Missing/);
});
test('offline matching preserves order and reports a specific omitted passage', () => {
  const bundle = capturePassages('Caffè in Rome. Return before noon.', [
    { locator: '#a', text: 'Caffè in Rome' }, { locator: '#b', text: 'Return before noon' },
  ]);
  assert.deepEqual(replay(bundle).map(r => r.actual), [0, 3]);
  bundle.stream.splice(3);
  const failures = replay(bundle).filter(r => !r.reproduced);
  assert.equal(failures.length, 1);
  assert.deepEqual([failures[0].locator, failures[0].actual], ['#b', -1]);
});
test('replay the complete archived cohort including recorded misses, then delete a matched passage', () => {
  const file = new URL('../../docs/reports/engine-v6-evidence-fixes-2026-11-16/passages.json.gz', import.meta.url);
  const corpus = JSON.parse(gunzipSync(fs.readFileSync(file)));
  assert.equal(new Set([...corpus.sources, ...corpus.unavailable].map(s => s.id)).size, 10);
  const results = corpus.sources.flatMap(s => replay(s.bundle));
  assert.equal(results.length, 1060);
  assert.equal(results.filter(r => r.actual >= 0).length, 1046);
  assert.ok(results.every(r => r.reproduced));
  const bundle = corpus.sources[0].bundle;
  const ref = bundle.references.find(r => r.offset >= 0);
  bundle.stream.splice(ref.offset, ref.tokens.length);
  const missing = replay(bundle).find(r => r.sha256 === ref.sha256);
  assert.equal(missing.actual, -1);
  assert.equal(missing.reproduced, false);
});
