import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { parseInsight, createInsight, canonicalize, sha256, MAX_INSIGHT_BYTES } from './insight-ir.mjs';
import { syntheticInsight } from './fixture.mjs';
import { importDraft } from './draft-importer.mjs';

const cli = fileURLToPath(new URL('./import-draft.mjs', import.meta.url));
const args = root => ({ insight: syntheticInsight(), draftRoot: root, tenant: 'tenant-a', project: 'project-a', actor: 'qa-audit' });
function temp() { const dir = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'pac-adversarial-')); fs.chmodSync(dir, 0o700); return dir; }
function body() { const { contentDigest, ...payload } = syntheticInsight(); void contentDigest; return payload; }
function withRoot(fn) { const root = temp(); try { return fn(root); } finally { fs.rmSync(root, { recursive: true, force: true }); } }
function resignDraft(value) { const { draftDigest, ...payload } = value; void draftDigest; return { ...payload, draftDigest: sha256(canonicalize(payload)) }; }

test('escaped duplicate and prototype keys cannot pass the import parser', () => {
  const original = JSON.stringify(syntheticInsight());
  for (const key of ['"id"', '"\\u0069d"']) {
    assert.throws(() => parseInsight(original.slice(0, -1) + `,${key}:"ignored"}`));
  }
  for (const key of ['__proto__', '\\u005f_proto__', 'constructor', 'prototype']) {
    assert.throws(() => parseInsight(original.slice(0, -1) + `,"${key}":{}}`));
  }
  assert.equal(Object.prototype.polluted, undefined);
});

test('only JSON whitespace is accepted and oversized UTF8 bytes are bounded', () => {
  const original = JSON.stringify(syntheticInsight());
  assert.equal(parseInsight(' \t\r\n' + original + '\r\n').id, syntheticInsight().id);
  for (const whitespace of ['\u00a0', '\ufeff', '\u2028', '\u2003']) assert.throws(() => parseInsight(whitespace + original));
  assert.throws(() => parseInsight(original + ' '.repeat(MAX_INSIGHT_BYTES)));
  assert.throws(() => parseInsight(original.slice(0, -1) + ',}'));
});

test('recomputing digest cannot legitimize private, approved or contradictory span payloads', () => {
  const mutations = [
    b => { b.visibility = 'private'; },
    b => { b.review.approved = true; },
    b => { b.decision.executionAuthorized = true; },
    b => { b.quality.completeness = 'qualified'; },
    b => { b.claims[0].evidence[0].side = 'before'; },
    b => { b.claims[0].evidence[0].quoteSha256 = '0'.repeat(64); },
    b => { b.claims[0].evidence[0].textSha256 = 'f'.repeat(64); },
    b => { b.claims[0].evidence[0].end += 1; },
    b => { b.claims[0].evidence[0].start = -1; },
    b => { b.claims[0].command = 'execute'; },
    b => { b.source.publicUrl = 'https://example.org/?private=1'; },
    b => { b.source.publicUrl = 'https://user:password@example.org/'; },
  ];
  for (const mutate of mutations) { const b = body(); mutate(b); assert.throws(() => createInsight(b)); }
});

test('direct object input cannot sneak in getters, custom objects or cyclic references', () => {
  const getter = body(); Object.defineProperty(getter.claims[0], 'statement', { enumerable: true, get() { throw new Error('must not run'); } });
  assert.throws(() => createInsight(getter));
  const custom = body(); custom.source = new URL('https://example.org/'); assert.throws(() => createInsight(custom));
  const cycle = body(); cycle.source.cycle = cycle; assert.throws(() => createInsight(cycle));
});

test('root and namespace symlinks are rejected without creating files in the target', () => withRoot(root => {
  const outside = temp();
  try {
    const alias = path.join(root, 'alias'); fs.symlinkSync(outside, alias);
    assert.throws(() => importDraft({ ...args(root), draftRoot: alias }));
    fs.symlinkSync(outside, path.join(root, 'tenant-a'));
    assert.throws(() => importDraft(args(root)));
    assert.deepEqual(fs.readdirSync(outside), []);
  } finally { fs.rmSync(outside, { recursive: true, force: true }); }
}));

test('symlinked final files and permissive directories never become import destinations', () => withRoot(root => {
  const ctx = args(root); const first = importDraft(ctx); const target = path.join(root, 'outside.json');
  fs.writeFileSync(target, 'UNCHANGED', { mode: 0o600 }); fs.unlinkSync(first.path); fs.symlinkSync(target, first.path);
  assert.throws(() => importDraft(ctx)); assert.equal(fs.readFileSync(target, 'utf8'), 'UNCHANGED');
  fs.chmodSync(root, 0o755); assert.throws(() => importDraft(ctx));
}));

test('context traversal is rejected and tenants keep separate immutable draft identities', () => withRoot(root => {
  for (const tenant of ['../tenant-b', '..', '/tmp', 'tenant-a/../../escape', 'tenant-a\\escape']) {
    assert.throws(() => importDraft({ ...args(root), tenant }));
  }
  const first = importDraft(args(root)); const other = importDraft({ ...args(root), tenant: 'tenant-b' });
  assert.notEqual(first.path, other.path);
  assert.equal(first.receipt.tenant, 'tenant-a'); assert.equal(other.receipt.tenant, 'tenant-b');
  const changed = body(); changed.claims[0].statement = 'A distinct revision payload';
  assert.throws(() => importDraft({ ...args(root), insight: createInsight(changed) }), /draft_revision_conflict/);
  assert.equal(importDraft(args(root)).receipt.sourcePayloadDigest, syntheticInsight().contentDigest);
}));

test('idempotent retries reject altered approval, scope and invalid audit timestamps even with recomputed draft digest', () => withRoot(root => {
  const ctx = args(root); const first = importDraft(ctx); const original = fs.readFileSync(first.path, 'utf8');
  const mutations = [
    d => { d.status = 'active'; }, d => { d.executionAuthorized = true; },
    d => { d.tenant = 'tenant-b'; }, d => { d.importedBy = '../not-an-actor'; },
    d => { d.importedAt = '2026-02-30T10:00:00.000Z'; },
    d => { d.sourcePayloadDigest = '0'.repeat(64); },
    d => { d.adminApproved = true; },
  ];
  for (const mutate of mutations) {
    const draft = JSON.parse(original); mutate(draft); fs.writeFileSync(first.path, JSON.stringify(resignDraft(draft)));
    assert.throws(() => importDraft(ctx));
  }
  fs.writeFileSync(first.path, original); fs.chmodSync(first.path, 0o644); assert.throws(() => importDraft(ctx));
}));

function cliImport(root, input) {
  return new Promise((resolve, reject) => {
    const process = spawn(globalThis.process.execPath, [cli, '--input', input, '--draft-root', root, '--tenant', 'tenant-a', '--project', 'project-a', '--actor', 'parallel-qa']);
    let stdout = '', stderr = ''; process.stdout.on('data', chunk => { stdout += chunk; }); process.stderr.on('data', chunk => { stderr += chunk; });
    process.on('error', reject); process.on('close', code => code === 0 ? resolve(JSON.parse(stdout)) : reject(new Error(stderr)));
  });
}
test('concurrent identical CLI imports commit one complete immutable draft and no partial temp files', async () => {
  const root = temp();
  try {
    const input = path.join(root, 'input.json'); fs.writeFileSync(input, JSON.stringify(syntheticInsight()), { mode: 0o600 });
    const receipts = await Promise.all(Array.from({ length: 8 }, () => cliImport(root, input)));
    assert.equal(receipts.filter(x => x.status === 'created').length, 1);
    assert.equal(new Set(receipts.map(x => x.path)).size, 1);
    const persisted = JSON.parse(fs.readFileSync(receipts[0].path, 'utf8'));
    assert.equal(persisted.status, 'draft'); assert.equal(persisted.executionAuthorized, false);
    assert.equal(persisted.sourcePayloadDigest, syntheticInsight().contentDigest);
    assert.deepEqual(fs.readdirSync(path.dirname(receipts[0].path)), [path.basename(receipts[0].path)]);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
