import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { linkSync, mkdirSync, mkdtempSync, realpathSync, renameSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assertHostedPreviewContext, hostedPreviewAvailable, hostedPreviewWorkspaceAvailable, isHostedPreview } from '../hostedPreview';

let root: string;
let database: string;
beforeEach(() => {
  root = realpathSync(mkdtempSync(join(tmpdir(), 'pw-hosted-boundary-')));
  database = join(root, 'output/engine-channels/hosted-preview/preview.db');
  mkdirSync(join(root, 'output/engine-channels/hosted-preview'), { recursive: true });
  writeFileSync(database, 'isolated-test-file');
  vi.spyOn(process, 'cwd').mockReturnValue(root);
  for (const [name, value] of Object.entries({ NODE_ENV: 'production', POLICYWATCHER_HOSTED_PREVIEW: '1',
    POLICYWATCHER_DEPLOYMENT_TARGET: 'staging', APP_URL: 'https://staging.policywatcher.online',
    NEXT_PUBLIC_APP_URL: 'https://staging.policywatcher.online', DATABASE_URL: `file:${database}`,
    POLICYWATCHER_ENGINE_V6: '1', POLICYWATCHER_ENGINE_CHANNELS: '1', POLICYWATCHER_ENGINE_PUBLICATION: '0', POLICYWATCHER_ENGINE_NOTIFICATIONS: '0' })) vi.stubEnv(name, value);
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); rmSync(root, { recursive: true, force: true }); });

describe('hosted preview execution boundary', () => {
  it('accepts only explicitly configured isolated production-mode staging execution', () => {
    expect(isHostedPreview()).toBe(true);
    expect(hostedPreviewAvailable()).toBe(true);
    expect(() => assertHostedPreviewContext()).not.toThrow();
  });
  it.each([
    ['NODE_ENV', 'development'], ['POLICYWATCHER_HOSTED_PREVIEW', '0'],
    ['POLICYWATCHER_DEPLOYMENT_TARGET', 'production'], ['APP_URL', 'https://policywatcher.online'],
    ['NEXT_PUBLIC_APP_URL', 'https://staging.policywatcher.online/'], ['POLICYWATCHER_ENGINE_V6', '0'],
    ['POLICYWATCHER_ENGINE_CHANNELS', '0'], ['POLICYWATCHER_ENGINE_PUBLICATION', '1'],
    ['POLICYWATCHER_ENGINE_NOTIFICATIONS', '1'], ['POLICYWATCHER_ENGINE_PUBLICATION', ''],
  ])('fails closed for %s=%s', (name, value) => {
    vi.stubEnv(name, value);
    expect(hostedPreviewAvailable()).toBe(false);
    expect(() => assertHostedPreviewContext()).toThrow('hosted_preview_context_invalid');
  });
  it('preserves report access when execution flags are deliberately disabled', () => {
    vi.stubEnv('POLICYWATCHER_ENGINE_CHANNELS', '0');
    expect(hostedPreviewWorkspaceAvailable()).toBe(true);
    expect(hostedPreviewAvailable()).toBe(false);
  });
  it.each(['file:./preview.db', 'file:/tmp/preview.db', 'file:/home/u847874844/domains/policywatcher.online/policywatcher-data/production.db', 'postgresql://localhost/test'])('rejects an unapproved database: %s', url => {
    vi.stubEnv('DATABASE_URL', url);
    expect(hostedPreviewAvailable()).toBe(false);
  });
  it('rejects a missing file, URL parameters and traversal aliases', () => {
    for (const url of [`file:${database}?mode=ro`, `file:${database}#alias`, `file:${database.replace('/preview.db', '/../hosted-preview/preview.db')}`]) {
      vi.stubEnv('DATABASE_URL', url); expect(hostedPreviewAvailable()).toBe(false);
    }
    vi.stubEnv('DATABASE_URL', `file:${database}`); rmSync(database);
    expect(hostedPreviewAvailable()).toBe(false);
  });
  it('rejects symlink and hardlink aliases to a production file', () => {
    const external = join(root, 'production.db'); writeFileSync(external, 'must-never-open');
    rmSync(database); symlinkSync(external, database);
    expect(hostedPreviewAvailable()).toBe(false);
    rmSync(database); linkSync(external, database);
    expect(hostedPreviewAvailable()).toBe(false);
  });
  it('rejects a directory symlink even when the filename is expected', () => {
    const original = join(root, 'output/engine-channels/hosted-preview');
    const outside = join(root, 'different-directory'); renameSync(original, outside); symlinkSync(outside, original);
    expect(hostedPreviewAvailable()).toBe(false);
  });
});
