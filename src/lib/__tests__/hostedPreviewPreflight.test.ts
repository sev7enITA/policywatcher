import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { appendFileSync, copyFileSync, linkSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const project = process.cwd();
const manifest = JSON.parse(readFileSync(join(project, 'src/lib/engineImplementation.generated.json'), 'utf8')) as { files: [string, string][] };
const sentinel = 'Private preview fixture: preflight must not change or initialize this file.';
let root: string;
let file: string;
let environment: NodeJS.ProcessEnv;

beforeEach(() => {
  root = realpathSync(mkdtempSync(join(tmpdir(), 'pw-hosted-preflight-')));
  // A complete source fixture exercises the real --check command, including
  // dependency discovery. node_modules is shared read-only; no build is run.
  for (const relative of [...manifest.files.map(([path]) => path), 'src/lib/engineImplementation.generated.json']) {
    mkdirSync(dirname(join(root, relative)), { recursive: true });
    copyFileSync(join(project, relative), join(root, relative));
  }
  symlinkSync(join(project, 'node_modules'), join(root, 'node_modules'));
  file = join(root, 'output/engine-channels/hosted-preview/preview.db');
  mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, sentinel);
  environment = { ...process.env, NODE_ENV: 'production', POLICYWATCHER_HOSTED_PREVIEW: '1',
    POLICYWATCHER_DEPLOYMENT_TARGET: 'staging', APP_URL: 'https://staging.policywatcher.online',
    NEXT_PUBLIC_APP_URL: 'https://staging.policywatcher.online', DATABASE_URL: `file:${file}`,
    POLICYWATCHER_ENGINE_V6: '1', POLICYWATCHER_ENGINE_CHANNELS: '1', POLICYWATCHER_ENGINE_PUBLICATION: '0', POLICYWATCHER_ENGINE_NOTIFICATIONS: '0' };
});
afterEach(() => { rmSync(root, { recursive: true, force: true }); });

function preflight() {
  return spawnSync(process.execPath, ['--import', 'tsx', join(root, 'scripts/hosted-preview-preflight.mjs')], {
    cwd: root, env: environment, encoding: 'utf8', timeout: 15_000,
  });
}
function unchanged() {
  expect(readFileSync(file, 'utf8')).toBe(sentinel);
  expect(readdirSync(dirname(file))).toEqual(['preview.db']);
}

describe('hosted preview managed-build preflight', () => {
  it('accepts a fresh manifest and exact isolated staging context without opening the DB', () => {
    const result = preflight();
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('implementation manifest verified');
    unchanged();
  });
  it.each([
    ['POLICYWATCHER_DEPLOYMENT_TARGET', 'production'], ['POLICYWATCHER_HOSTED_PREVIEW', ''],
    ['APP_URL', 'https://policywatcher.online'], ['NEXT_PUBLIC_APP_URL', 'https://policywatcher.online'],
    ['POLICYWATCHER_ENGINE_PUBLICATION', '1'], ['POLICYWATCHER_ENGINE_NOTIFICATIONS', '1'],
    ['POLICYWATCHER_ENGINE_V6', '0'], ['POLICYWATCHER_ENGINE_CHANNELS', '0'], ['NODE_ENV', 'development'],
  ])('rejects %s=%s without any DB effect', (name, value) => {
    environment[name] = value;
    const result = preflight(); expect(result.status).toBe(1);
    expect(result.stderr).toContain('hosted_preview_context_invalid'); unchanged();
  });
  it('rejects a different existing database without touching either file', () => {
    const production = join(root, 'production.db'); writeFileSync(production, 'retained production fixture');
    environment.DATABASE_URL = `file:${production}`;
    const result = preflight(); expect(result.status).toBe(1);
    expect(result.stderr).toContain('hosted_preview_context_invalid');
    expect(readFileSync(production, 'utf8')).toBe('retained production fixture'); unchanged();
  });
  it.each(['symlink', 'hardlink'])('rejects a %s alias before any database write', alias => {
    const production = join(root, 'production.db'); writeFileSync(production, sentinel); rmSync(file);
    if (alias === 'symlink') symlinkSync(production, file); else linkSync(production, file);
    const result = preflight(); expect(result.status).toBe(1);
    expect(result.stderr).toContain('hosted_preview_context_invalid');
    expect(readFileSync(production, 'utf8')).toBe(sentinel); unchanged();
  });
  it('rejects stale source identity before migrations could open the DB', () => {
    appendFileSync(join(root, 'src/lib/hostedPreview.ts'), '\n// isolated manifest drift fixture\n');
    const result = preflight(); expect(result.status).toBe(1);
    expect(result.stderr).toContain('hosted_preview_manifest_invalid'); unchanged();
  });
});
