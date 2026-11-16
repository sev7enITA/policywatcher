/** Compare candidate extraction against fixed archived references without source requests. */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { gunzipSync, gzipSync } from 'node:zlib';
import { extractEngineBody } from '../../src/lib/engine/acquisition';
import { capturePassages, digest, replay } from './passages.mjs';

type Reference = { locator: string; sha256: string; tokens: number[]; offset: number };
type Source = { id: string; url: string; payloadSha256: string; extractionSha256: string;
  bundle: { version: string; vocabulary: string[]; stream: number[]; references: Reference[] } };
type Archive = { sources: Source[]; unavailable: unknown };
const byteDigest = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

const [baselinePath, bodies, destination] = process.argv.slice(2);
if (!baselinePath || !bodies || !destination) throw Error('baseline_bodies_destination_required');
const bytes = fs.readFileSync(baselinePath);
const baselineManifest = JSON.parse(fs.readFileSync(path.join(path.dirname(baselinePath), 'manifest.json'), 'utf8'));
if (byteDigest(bytes) !== baselineManifest.sha256) throw Error('baseline_digest_mismatch');
const baseline: Archive = JSON.parse(gunzipSync(bytes).toString('utf8'));
const sources = baseline.sources.map(source => {
  const body = fs.readFileSync(path.join(bodies, source.id + '.body'));
  if (byteDigest(body) !== source.payloadSha256) throw Error('body_digest_mismatch');
  const document = extractEngineBody(body.toString('utf8'), source.url).document;
  const bundle = capturePassages(document.text, []);
  const indices = new Map(bundle.vocabulary.map((hash, i) => [hash, i]));
  const oldToNew = source.bundle.vocabulary.map(hash => {
    let index = indices.get(hash);
    if (index === undefined) {
      index = bundle.vocabulary.length;
      indices.set(hash, index);
      bundle.vocabulary.push(hash);
    }
    return index;
  });
  // Hold the reference text, DOM locators and passage digests fixed.
  bundle.references = source.bundle.references.map(reference => ({
    ...reference, tokens: reference.tokens.map(index => oldToNew[index]),
  }));
  const observations = replay(bundle);
  bundle.references.forEach((reference, i) => { reference.offset = observations[i].actual; });
  return { ...source, extractionSha256: digest(document.text), bundle };
});
fs.mkdirSync(destination, { recursive: false });
const archive = gzipSync(JSON.stringify({ ...baseline, mode: 'Candidate extraction of identical archived bodies; original references fixed', sources }));
fs.writeFileSync(path.join(destination, 'passages.json.gz'), archive, { flag: 'wx' });
const manifest = {
  version: baselineManifest.version, baselineArchiveSha256: byteDigest(bytes), sha256: byteDigest(archive),
  sources: sources.map((source, index) => {
    const old = replay(baseline.sources[index].bundle), next = replay(source.bundle);
    return { id: source.id, url: source.url, payloadSha256: source.payloadSha256,
      extractionSha256: source.extractionSha256, beforeExtractionSha256: baseline.sources[index].extractionSha256,
      references: next.length, matches: next.filter(row => row.actual >= 0).length,
      beforeMatches: old.filter(row => row.actual >= 0).length,
      recovered: next.filter((row, i) => row.actual >= 0 && old[i].actual < 0),
      lost: next.filter((row, i) => row.actual < 0 && old[i].actual >= 0) };
  }), unavailable: baseline.unavailable,
};
fs.writeFileSync(path.join(destination, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(manifest.sources.map(({ recovered, lost, ...source }) => ({ ...source, recovered: recovered.length, lost: lost.length }))));
