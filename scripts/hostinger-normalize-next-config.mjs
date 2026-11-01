#!/usr/bin/env node

import { createHash, randomUUID } from 'node:crypto';
import { closeSync, constants, fstatSync, fsyncSync, openSync, readFileSync, realpathSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const hash = value => createHash('sha256').update(value).digest('hex');
const configName = 'next.config.ts';
const manifestName = 'src/lib/engineImplementation.generated.json';

// Exact 191-byte wrapper observed in Hostinger's first hosted-preview build.
// Only its generated, 13-character lower-case hexadecimal basename may vary.
function knownWrapper(basename) {
  return `import type { NextConfig } from "next";\nimport baseConfig from "./${basename}.next.config";\n\nconst config: NextConfig = {\n  ...baseConfig,\n  output: "standalone",\n};\n\nexport default config;`;
}

function readRegularFile(path) {
  const descriptor = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const stat = fstatSync(descriptor);
    if (!stat.isFile() || stat.nlink !== 1) throw new Error('hostinger_next_config_unsafe_file');
    return { bytes: readFileSync(descriptor), mode: stat.mode & 0o777 };
  } finally { closeSync(descriptor); }
}

function expectedConfigHash(root) {
  const manifest = JSON.parse(readRegularFile(join(root, manifestName)).bytes.toString('utf8'));
  if (manifest.schema !== 'pw-engine-implementation-1' || !Array.isArray(manifest.files)
      || !/^[a-f0-9]{64}$/.test(manifest.hash) || hash(JSON.stringify(manifest.files)) !== manifest.hash
      || !manifest.files.every((entry, i) => Array.isArray(entry) && entry.length === 2
        && typeof entry[0] === 'string' && !entry[0].startsWith('/') && !entry[0].split('/').includes('..')
        && typeof entry[1] === 'string' && /^[a-f0-9]{64}$/.test(entry[1])
        && (i === 0 || manifest.files[i - 1][0] < entry[0]))) throw new Error('hostinger_next_config_manifest_invalid');
  const entry = manifest.files.find(([name]) => name === configName);
  if (!entry) throw new Error('hostinger_next_config_manifest_entry_missing');
  return entry[1];
}

function assertCanonicalStandalone(bytes) {
  const source = ts.createSourceFile(configName, bytes.toString('utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const declarations = source.statements.filter(ts.isVariableStatement).flatMap(statement => [...statement.declarationList.declarations]);
  const config = declarations.find(declaration => ts.isIdentifier(declaration.name) && declaration.name.text === 'nextConfig');
  const properties = config?.initializer && ts.isObjectLiteralExpression(config.initializer)
    ? config.initializer.properties.filter(property => ts.isPropertyAssignment(property)
      && (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)) && property.name.text === 'output') : [];
  if (properties.length !== 1 || !ts.isPropertyAssignment(properties[0])
      || !ts.isStringLiteral(properties[0].initializer) || properties[0].initializer.text !== 'standalone') {
    throw new Error('hostinger_next_config_canonical_standalone_required');
  }
}

/** Restore manifest-approved source bytes; never execute or regenerate provider config. */
export function normalizeHostingerNextConfig(appDirectory) {
  const root = realpathSync(resolve(appDirectory));
  const configPath = join(root, configName);
  const expected = expectedConfigHash(root);
  const current = readRegularFile(configPath);
  const beforeHash = hash(current.bytes);
  if (beforeHash === expected) {
    assertCanonicalStandalone(current.bytes);
    return { status: 'canonical', configHash: expected };
  }
  const match = current.bytes.toString('utf8').match(/import baseConfig from "\.\/([a-f0-9]{13})\.next\.config";/);
  if (!match || !current.bytes.equals(Buffer.from(knownWrapper(match[1])))) throw new Error('hostinger_next_config_wrapper_unrecognized');
  // The pattern permits a basename only. Its file must be directly in the same
  // canonical root, must not be a symlink/hardlink and must match release bytes.
  const baseName = `${match[1]}.next.config.ts`;
  const base = readRegularFile(join(root, baseName));
  if (hash(base.bytes) !== expected) throw new Error('hostinger_next_config_base_digest_mismatch');
  assertCanonicalStandalone(base.bytes);

  const temporary = join(root, `.pw-next-config-${randomUUID()}.tmp`);
  let descriptor;
  try {
    descriptor = openSync(temporary, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL, current.mode);
    writeFileSync(descriptor, base.bytes);
    fsyncSync(descriptor);
    closeSync(descriptor); descriptor = undefined;
    // Recheck the known wrapper before the one authorized replacement.
    if (hash(readRegularFile(configPath).bytes) !== beforeHash) throw new Error('hostinger_next_config_changed_during_normalization');
    renameSync(temporary, configPath);
  } finally {
    if (descriptor !== undefined) closeSync(descriptor);
    try { unlinkSync(temporary); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  if (hash(readRegularFile(configPath).bytes) !== expected) throw new Error('hostinger_next_config_restore_verification_failed');
  return { status: 'restored-known-wrapper', configHash: expected, wrapperHash: beforeHash, retainedBase: baseName };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (!['staging', 'production'].includes(process.env.POLICYWATCHER_DEPLOYMENT_TARGET || '')) throw new Error('hostinger_next_config_managed_target_required');
    console.log('[Hostinger Next config]', JSON.stringify(normalizeHostingerNextConfig(resolve(dirname(fileURLToPath(import.meta.url)), '..'))));
  } catch (error) {
    console.error('[Hostinger Next config]', error instanceof Error ? error.message : 'normalization_failed');
    process.exitCode = 1;
  }
}
