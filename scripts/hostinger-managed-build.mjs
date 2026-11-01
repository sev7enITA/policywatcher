#!/usr/bin/env node

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const APP_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const deploymentTarget = process.env.POLICYWATCHER_DEPLOYMENT_TARGET?.trim().toLowerCase();
const isManagedHostingerBuild = deploymentTarget === 'staging' || deploymentTarget === 'production';

function run(command, args, environment = process.env) {
  const completed = spawnSync(command, args, {
    cwd: APP_DIR,
    env: environment,
    stdio: 'inherit',
  });

  if (completed.error) throw completed.error;
  if (completed.status !== 0) {
    throw new Error(`${command} failed with status ${completed.status ?? 'unknown'}.`);
  }
}

if (isManagedHostingerBuild) {
  // Hostinger wraps next.config.ts to force standalone output. Restore only its
  // exact known wrapper around manifest-identical source before integrity checks.
  run(process.execPath, [path.join(APP_DIR, 'scripts', 'hostinger-normalize-next-config.mjs')]);
  // Next normally supplies NODE_ENV=production during build. Validate that
  // runtime context in a child before migrations; reject an explicit other mode.
  run(path.join(APP_DIR, 'node_modules', '.bin', 'tsx'), [
    path.join(APP_DIR, 'scripts', 'hosted-preview-preflight.mjs'),
  ], { ...process.env, NODE_ENV: process.env.NODE_ENV || 'production' });
  // hPanel's managed Next.js preset exposes only `npm run build` and bypasses
  // server.js. Validate the immutable promotion boundary before any database
  // write, then run the same idempotent, backup-first schema preparation used
  // by the guarded runtime bridge.
  run(process.execPath, [
    path.join(APP_DIR, 'scripts', 'hostinger-environment-gate.mjs'),
    '--target',
    deploymentTarget,
    '--phase',
    'build',
  ]);
  run('bash', [path.join(APP_DIR, 'scripts', 'prepare-database.sh')]);
  run(path.join(APP_DIR, 'node_modules', '.bin', 'tsx'), [
    path.join(APP_DIR, 'scripts', 'gate-document-evidence-activation.ts'),
  ]);
}

run(process.execPath, [path.join(APP_DIR, 'scripts', 'prisma-active-schema.mjs'), 'generate']);
run(process.execPath, [path.join(APP_DIR, 'scripts', 'engine-implementation-manifest.mjs'), '--check']);
run(path.join(APP_DIR, 'node_modules', '.bin', 'next'), ['build'], { ...process.env, POLICYWATCHER_ENGINE_BUILD_PHASE: '1' });
