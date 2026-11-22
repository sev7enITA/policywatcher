import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createInsight, parseInsight, validateInsight, canonicalize } from './insight-ir.mjs';
import { syntheticInsight } from './fixture.mjs';
import { importDraft } from './draft-importer.mjs';
const mutate = (fn) => { const { contentDigest, ...b } = syntheticInsight(); void contentDigest; fn(b); return b; };
test('synthetic Unicode anchor uses UTF16 rather than codepoints', () => { const v = syntheticInsight(); assert.equal(v.claims[0].evidence[0].start, 14); assert.equal(v.claims[0].evidence[0].quote.length, v.claims[0].evidence[0].end - 14); assert.deepEqual(parseInsight(JSON.stringify(v)), v); });
test('canonical key order retains provenance and deterministic digest', () => { const v = syntheticInsight(); assert.equal(canonicalize(v), canonicalize(Object.fromEntries(Object.entries(v).reverse()))); assert.equal(syntheticInsight().contentDigest, v.contentDigest); });
test('unknown quality remains explicit when no anchors exist', () => { const v = createInsight(mutate(b => { b.claims[0].evidence = []; b.warnings.push('legacy_unanchored'); })); assert.equal(v.quality.completeness, 'unqualified'); assert.equal(v.decision.executionAuthorized, false); });
test('mutation without a digest update is rejected', () => { const v = syntheticInsight(); v.claims[0].statement = 'tampered'; assert.equal(validateInsight(v).ok, false); });
test('rejects private scope and an enforcement escalation', () => { for (const f of [b => b.visibility = 'private', b => b.review.approved = true, b => b.decision.executionAuthorized = true, b => b.source.tenant = 'secret'])
    assert.throws(() => createInsight(mutate(f))); });
test('rejects broken hash and mismatched captures even with recomputed digest', () => { for (const f of [b => b.claims[0].evidence[0].quoteSha256 = '0'.repeat(64), b => b.claims[0].evidence[0].side = 'before', b => b.claims[0].evidence[0].end++, b => b.source.scopeId += '-extra'])
    assert.throws(() => createInsight(mutate(f))); });
test('rejects duplicate escaped keys and non JSON whitespace', () => { assert.throws(() => parseInsight('{"id":"a","\\u0069d":"b"}')); assert.throws(() => parseInsight('\u00a0' + JSON.stringify(syntheticInsight()))); });
test('draft import is immutable, namespaced, idempotent and detects local tamper', () => { const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'pac-')); try {
    fs.chmodSync(root, 0o700);
    const input = { insight: syntheticInsight(), draftRoot: root, tenant: 'tenant-a', project: 'project-a', actor: 'reviewer' };
    const first = importDraft(input);
    assert.equal(first.status, 'created');
    assert.equal(first.receipt.status, 'draft');
    assert.equal(first.receipt.executionAuthorized, false);
    assert.equal(fs.statSync(first.path).mode & 0o777, 0o600);
    assert.equal(importDraft({ ...input, actor: 'another' }).receipt.importedBy, 'reviewer');
    const other = importDraft({ ...input, tenant: 'tenant-b' });
    assert.notEqual(other.path, first.path);
    assert.throws(() => importDraft({ ...input, tenant: '../escape' }));
    const tampered = JSON.parse(fs.readFileSync(first.path, 'utf8'));
    tampered.executionAuthorized = true;
    fs.writeFileSync(first.path, JSON.stringify(tampered));
    assert.throws(() => importDraft(input));
}
finally {
    fs.rmSync(root, { recursive: true, force: true });
} });
test('CLI imports synthetic file offline and rejects unknown arguments', () => { const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'pac-cli-')); try {
    fs.chmodSync(root, 0o700);
    const file = path.join(root, 'input.json');
    fs.writeFileSync(file, JSON.stringify(syntheticInsight()));
    const args = ['integrations/policy-as-code/import-draft.mjs', '--input', file, '--draft-root', root, '--tenant', 'demo', '--project', 'demo', '--actor', 'qa'];
    const r = spawnSync(process.execPath, args, { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    assert.equal(JSON.parse(r.stdout).executionAuthorized, false);
    assert.equal(spawnSync(process.execPath, [...args, '--execute', 'true']).status, 1);
}
finally {
    fs.rmSync(root, { recursive: true, force: true });
} });
test('empty claims and suppressed uncertainty warnings are rejected', () => {
    assert.throws(() => createInsight(mutate(b => b.claims = [])), /minItems/);
    for (const warning of ['source_completeness_unqualified', 'semantic_verification_not_performed', 'effective_date_unknown', 'source_metadata_not_verified', 'extractor_version_not_recorded']) {
        assert.throws(() => createInsight(mutate(b => b.warnings = b.warnings.filter(w => w !== warning))), /missing_warning/);
    }
    assert.throws(() => createInsight(mutate(b => b.claims[0].evidence = [])), /missing_warning:legacy_unanchored/);
});
test('observation and before-after capture order must remain coherent', () => {
    assert.throws(() => createInsight(mutate(b => b.times.observedAt = '2026-11-22T09:59:59.000Z')), /observation_capture_mismatch/);
    assert.throws(() => createInsight(mutate(b => b.snapshots.before = { ...b.snapshots.after })), /snapshot_order/);
    assert.throws(() => createInsight(mutate(b => { b.snapshots.after.version = 2; b.revision = 2; b.snapshots.before = { ...b.snapshots.after, version: 1, capturedAt: '2026-11-22T10:00:01.000Z' }; })), /snapshot_order/);
});
