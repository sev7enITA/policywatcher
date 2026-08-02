import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  decodePackageBase64,
  isSafeArchiveEntry,
  validatePackageFilename,
  validateSha256,
  validateVersion,
} from './agent.mjs';

test('accepts only bounded renderer release metadata', () => {
  assert.equal(validateVersion('1.2.0'), true);
  assert.equal(validateVersion('../../root'), false);
  assert.equal(validateSha256('a'.repeat(64)), true);
  assert.equal(validateSha256('a'.repeat(63)), false);
  assert.equal(validatePackageFilename('PolicyWatcher-renderer-1.2.0-vps-2026-08-02.zip'), true);
  assert.equal(validatePackageFilename('PolicyWatcher-renderer-1.2.0-vps-2026-08-02.tar.gz'), false);
  assert.equal(validatePackageFilename('../renderer.zip'), false);
  assert.equal(validatePackageFilename('renderer.exe'), false);
});

test('strictly decodes base64 packages within the configured byte cap', () => {
  const source = Buffer.from('renderer-package');
  assert.deepEqual(decodePackageBase64(source.toString('base64'), source.length), source);
  assert.throws(() => decodePackageBase64('not base64', 100), /invalid_package_base64/);
  assert.throws(() => decodePackageBase64(source.toString('base64'), 3), /package_too_large/);
});

test('rejects traversal, secrets and ambiguous archive paths', () => {
  assert.equal(isSafeArchiveEntry('renderer/server.mjs'), true);
  assert.equal(isSafeArchiveEntry('../agent.mjs'), false);
  assert.equal(isSafeArchiveEntry('renderer/.env.production'), false);
  assert.equal(isSafeArchiveEntry('renderer\\..\\agent.mjs'), false);
});
