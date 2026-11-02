#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { POLICYWATCHER_DISTRIBUTION_CHANNEL } from '../src/lib/distribution.ts';
import { assertHostedPreviewContext } from '../src/lib/hostedPreview.ts';

const appDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');

try {
  const { version } = JSON.parse(readFileSync(join(appDirectory, 'package.json'), 'utf8'));
  if (typeof version !== 'string') throw new Error('release_version_missing');
  if (POLICYWATCHER_DISTRIBUTION_CHANNEL === 'private-preview' || version.includes('-preview')) {
    // Reuse the runtime boundary before migration/backup tools can open any DB.
    // This module imports no Prisma, worker, pipeline or Next runtime code.
    assertHostedPreviewContext();
    const manifest = spawnSync(process.execPath, [join(appDirectory, 'scripts/engine-implementation-manifest.mjs'), '--check'], {
      cwd: appDirectory,
      env: process.env,
      stdio: 'inherit',
    });
    if (manifest.error || manifest.status !== 0) throw new Error('hosted_preview_manifest_invalid');
    console.log('[Hosted preview preflight] Isolated staging context and implementation manifest verified.');
  }
} catch (error) {
  console.error('[Hosted preview preflight]', error instanceof Error ? error.message : 'preflight_failed');
  process.exitCode = 1;
}
