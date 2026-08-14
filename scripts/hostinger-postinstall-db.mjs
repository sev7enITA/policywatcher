#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  console.log('DATABASE_URL is not available during install; database initialization is deferred to runtime.');
  process.exit(0);
}

if (!databaseUrl.startsWith('file:')) {
  console.log('Non-SQLite DATABASE_URL detected; SQLite initialization is not required.');
  process.exit(0);
}

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const initializer = path.join(appDir, 'scripts', 'hostinger-init-db.sh');
if (!fs.existsSync(initializer)) {
  console.error(`Database initializer is missing: ${initializer}`);
  process.exit(1);
}

const result = spawnSync('bash', [initializer], {
  cwd: appDir,
  env: { ...process.env, POLICYWATCHER_SKIP_DB_BACKUP: '1' },
  stdio: 'inherit',
});

if (result.error) {
  console.error('Unable to start the database initializer:', result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
