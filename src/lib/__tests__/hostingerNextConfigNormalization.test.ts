import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { linkSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { normalizeHostingerNextConfig } from '../../../scripts/hostinger-normalize-next-config.mjs';

const digest = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
const canonical = 'import type { NextConfig } from "next";\nconst nextConfig: NextConfig = {\n  output: \'standalone\',\n  poweredByHeader: false,\n};\nexport default nextConfig;\n';
// Captured Hostinger R1 wrapper, including its lack of a final newline.
const captured = 'import type { NextConfig } from "next";\nimport baseConfig from "./6ae7b51a93585.next.config";\n\nconst config: NextConfig = {\n  ...baseConfig,\n  output: "standalone",\n};\n\nexport default config;';
const baseName = '6ae7b51a93585.next.config.ts';
let root: string;
function manifest(config = canonical) {
  const files = [['next.config.ts', digest(config)]];
  writeFileSync(join(root, 'src/lib/engineImplementation.generated.json'), JSON.stringify({ schema: 'pw-engine-implementation-1', files, hash: digest(JSON.stringify(files)) }));
}
function seedWrapper(wrapper = captured, base = canonical) {
  writeFileSync(join(root, 'next.config.ts'), wrapper);
  writeFileSync(join(root, baseName), base);
}
function unchangedAfterFailure(expectedError?: string) {
  const beforeConfig = readFileSync(join(root, 'next.config.ts'));
  const beforeManifest = readFileSync(join(root, 'src/lib/engineImplementation.generated.json'));
  const beforeEntries = readdirSync(root).sort();
  if (expectedError) expect(() => normalizeHostingerNextConfig(root)).toThrow(expectedError);
  else expect(() => normalizeHostingerNextConfig(root)).toThrow();
  expect(readFileSync(join(root, 'next.config.ts'))).toEqual(beforeConfig);
  expect(readFileSync(join(root, 'src/lib/engineImplementation.generated.json'))).toEqual(beforeManifest);
  expect(readdirSync(root).sort()).toEqual(beforeEntries);
}

beforeEach(() => {
  root = realpathSync(mkdtempSync(join(tmpdir(), 'pw-hostinger-config-')));
  mkdirSync(join(root, 'src/lib'), { recursive: true }); manifest();
});
afterEach(() => { rmSync(root, { recursive: true, force: true }); });

describe('exact Hostinger Next config normalization', () => {
  it('keeps an already canonical standalone config byte-identical', () => {
    writeFileSync(join(root, 'next.config.ts'), canonical);
    expect(normalizeHostingerNextConfig(root)).toEqual({ status: 'canonical', configHash: digest(canonical) });
    expect(readFileSync(join(root, 'next.config.ts'), 'utf8')).toBe(canonical);
  });
  it('restores the actual wrapper to manifest-identical bytes while preserving its base and manifest', () => {
    expect(Buffer.byteLength(captured)).toBe(191); seedWrapper();
    const manifestBefore = readFileSync(join(root, 'src/lib/engineImplementation.generated.json'));
    expect(normalizeHostingerNextConfig(root)).toEqual({ status: 'restored-known-wrapper', configHash: digest(canonical), wrapperHash: digest(captured), retainedBase: baseName });
    expect(readFileSync(join(root, 'next.config.ts'), 'utf8')).toBe(canonical);
    expect(readFileSync(join(root, baseName), 'utf8')).toBe(canonical);
    expect(readFileSync(join(root, 'src/lib/engineImplementation.generated.json'))).toEqual(manifestBefore);
    expect(readdirSync(root).some(name => name.startsWith('.pw-next-config-'))).toBe(false);
    expect(normalizeHostingerNextConfig(root).status).toBe('canonical');
  });
  it('accepts another generated basename only within the same exact wrapper', () => {
    seedWrapper(captured.replace('6ae7b51a93585', 'abcdef0123456'));
    writeFileSync(join(root, 'abcdef0123456.next.config.ts'), canonical);
    expect(normalizeHostingerNextConfig(root).status).toBe('restored-known-wrapper');
  });
  it.each([
    `${captured}\n`, `// provider customization\n${captured}`,
    captured.replace('...baseConfig,', '...baseConfig,\n  poweredByHeader: true,'),
    captured.replace('"standalone"', '"export"'),
    captured.replace('./6ae7b51a93585.next.config', '../6ae7b51a93585.next.config'),
    captured.replace('./6ae7b51a93585.next.config', './6ae7b51a93585.next.config.ts'),
    captured.replace('6ae7b51a93585', '6AE7B51A93585'),
    captured.replace('6ae7b51a93585', '6ae7b51a9358'),
    captured.replace('import baseConfig', 'import  baseConfig'),
  ])('rejects any unknown wrapper bytes without mutation', wrapper => {
    seedWrapper(wrapper); unchangedAfterFailure('hostinger_next_config_wrapper_unrecognized');
  });
  it('rejects modified canonical source instead of silently accepting config drift', () => {
    writeFileSync(join(root, 'next.config.ts'), `${canonical}// drift\n`);
    unchangedAfterFailure('hostinger_next_config_wrapper_unrecognized');
  });
  it('rejects a modified base even when it has standalone output', () => {
    seedWrapper(captured, `${canonical}// modified base\n`);
    unchangedAfterFailure('hostinger_next_config_base_digest_mismatch');
  });
  it('rejects a missing base', () => {
    writeFileSync(join(root, 'next.config.ts'), captured); unchangedAfterFailure();
  });
  it.each(['base-symlink', 'base-hardlink', 'config-symlink', 'config-hardlink'])('rejects %s without following or modifying the linked file', mode => {
    seedWrapper();
    const target = join(root, mode.startsWith('base') ? baseName : 'next.config.ts');
    const external = join(root, 'retained-file'); const original = readFileSync(target);
    writeFileSync(external, original); rmSync(target);
    if (mode.endsWith('symlink')) symlinkSync(external, target); else linkSync(external, target);
    unchangedAfterFailure(); expect(readFileSync(external)).toEqual(original);
  });
  it('rejects a stale or malformed manifest without changing config', () => {
    seedWrapper();
    const path = join(root, 'src/lib/engineImplementation.generated.json');
    const content = JSON.parse(readFileSync(path, 'utf8')); content.hash = '0'.repeat(64);
    writeFileSync(path, JSON.stringify(content)); unchangedAfterFailure('hostinger_next_config_manifest_invalid');
  });
  it('requires the canonical config digest to be present in the manifest', () => {
    seedWrapper();
    writeFileSync(join(root, 'src/lib/engineImplementation.generated.json'), JSON.stringify({ schema: 'pw-engine-implementation-1', files: [], hash: digest('[]') }));
    unchangedAfterFailure('hostinger_next_config_manifest_entry_missing');
  });
  it('rejects an old canonical config whose only standalone declaration comes from the wrapper', () => {
    const old = canonical.replace("  output: 'standalone',\n", '');
    manifest(old); seedWrapper(captured, old); unchangedAfterFailure('hostinger_next_config_canonical_standalone_required');
  });
  it('does not accept standalone text in comments as an actual canonical output setting', () => {
    const misleading = canonical.replace("  output: 'standalone',", "  // output: 'standalone',");
    manifest(misleading); seedWrapper(captured, misleading); unchangedAfterFailure('hostinger_next_config_canonical_standalone_required');
  });
});
