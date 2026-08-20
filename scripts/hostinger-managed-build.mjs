#!/usr/bin/env node

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const APP_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const deploymentTarget = process.env.POLICYWATCHER_DEPLOYMENT_TARGET?.trim().toLowerCase();
const isManagedHostingerBuild = deploymentTarget === 'staging' || deploymentTarget === 'production';

function run(command, args) {
  const completed = spawnSync(command, args, {
    cwd: APP_DIR,
    env: process.env,
    stdio: 'inherit',
  });

  if (completed.error) throw completed.error;
  if (completed.status !== 0) {
    throw new Error(`${command} failed with status ${completed.status ?? 'unknown'}.`);
  }
}

if (isManagedHostingerBuild) {
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
run(path.join(APP_DIR, 'node_modules', '.bin', 'next'), ['build']);
