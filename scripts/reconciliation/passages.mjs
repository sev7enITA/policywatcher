import { createHash } from 'node:crypto';
import path from 'node:path';
import { gunzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const digest = value => createHash('sha256').update(value).digest('hex');
export const version = 'pw-passage-tokens-v1';
function words(text) {
  return text.normalize('NFKC').toLowerCase().match(/[\p{L}\p{M}\p{N}]+/gu) ?? [];
}
function locate(stream, reference, starts) {
  for (const index of starts.get(reference[0]) ?? []) {
    if (reference.every((token, offset) => stream[index + offset] === token)) return index;
  }
  return -1;
}
function offsets(stream) {
  const starts = new Map();
  stream.forEach((token, index) => {
    if (!starts.has(token)) starts.set(token, []);
    starts.get(token).push(index);
  });
  return starts;
}
function passageHash(tokens, vocabulary) {
  return digest(tokens.map(token => vocabulary[token]).join(''));
}
export function capturePassages(extraction, passages) {
  const vocabulary = [];
  const tokensByWord = new Map();
  function encode(text) {
    return words(text).map(word => {
      if (!tokensByWord.has(word)) {
        tokensByWord.set(word, vocabulary.length);
        vocabulary.push(digest(word));
      }
      return tokensByWord.get(word);
    });
  }
  const stream = encode(extraction);
  const starts = offsets(stream);
  const seen = new Set();
  const references = [];
  for (const passage of passages) {
    const tokens = encode(passage.text);
    const sha256 = passageHash(tokens, vocabulary);
    if (!tokens.length || seen.has(sha256)) continue;
    seen.add(sha256);
    references.push({ locator: passage.locator, sha256, tokens, offset: locate(stream, tokens, starts) });
  }
  return { version, vocabulary, stream, references };
}
export function replay(bundle) {
  const { vocabulary, stream, references } = bundle;
  if (bundle.version !== version || !Array.isArray(vocabulary) || !vocabulary.every(x => /^[a-f0-9]{64}$/.test(x)) ||
      new Set(vocabulary).size !== vocabulary.length) throw Error('Invalid token dictionary or version');
  const valid = tokens => Array.isArray(tokens) && tokens.every(t => Number.isSafeInteger(t) && t >= 0 && t < vocabulary.length);
  if (!valid(stream) || !Array.isArray(references)) throw Error('Invalid extraction stream or references');
  const starts = offsets(stream);
  const ids = new Set();
  return references.map(ref => {
    if (!ref.locator || !valid(ref.tokens) || !ref.tokens.length || passageHash(ref.tokens, vocabulary) !== ref.sha256 ||
        ids.has(ref.sha256) || !Number.isSafeInteger(ref.offset) || ref.offset < -1) throw Error('Invalid passage reference');
    ids.add(ref.sha256);
    const actual = locate(stream, ref.tokens, starts);
    return { sha256: ref.sha256, locator: ref.locator, expected: ref.offset, actual, reproduced: actual === ref.offset };
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const file = process.argv[2];
  const bytes = readFileSync(file);
  const manifest = JSON.parse(readFileSync(path.join(path.dirname(file), 'manifest.json'), 'utf8'));
  if (digest(bytes) !== manifest.sha256) throw Error('Archive digest differs from manifest');
  const corpus = JSON.parse(gunzipSync(bytes));
  if (!corpus.sources?.length) throw Error('Empty corpus');
  for (const source of corpus.sources) {
    const result = replay(source.bundle);
    const failures = result.filter(r => !r.reproduced);
    console.log(JSON.stringify({ source: source.id, total: result.length, matched: result.filter(r => r.actual >= 0).length, failures }));
    if (failures.length) process.exitCode = 1;
  }
}
