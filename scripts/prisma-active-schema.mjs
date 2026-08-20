#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import {
  POSTGRESQL_SCHEMA_PATH,
  SQLITE_SCHEMA_PATH,
  detectDatabaseProvider,
  materializePostgresqlSchema,
  normalizeDatabaseUrl,
} from './database-provider.mjs';

const require = createRequire(import.meta.url);
const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd(), process.env.NODE_ENV !== 'production');

const command = process.argv[2];
const supportedCommands = new Set(['generate', 'validate', 'migrate-deploy', 'schema-path']);

if (!supportedCommands.has(command)) {
  console.error('Usage: node scripts/prisma-active-schema.mjs <generate|validate|migrate-deploy|schema-path>');
  process.exit(1);
}

const databaseUrl = normalizeDatabaseUrl(process.env.DATABASE_URL);
const provider = detectDatabaseProvider(databaseUrl);
if (provider === 'unknown') {
  console.error('DATABASE_URL must use file:, postgresql://, or postgres://.');
  process.exit(1);
}

const schemaPath = provider === 'postgresql'
  ? path.resolve(materializePostgresqlSchema())
  : path.resolve(SQLITE_SCHEMA_PATH);

if (command === 'schema-path') {
  process.stdout.write(`${provider === 'postgresql' ? POSTGRESQL_SCHEMA_PATH : SQLITE_SCHEMA_PATH}\n`);
  process.exit(0);
}

const prismaCli = path.resolve('node_modules/prisma/build/index.js');
if (!fs.existsSync(prismaCli)) {
  console.error('The lockfile-installed Prisma CLI is unavailable. Run npm ci first.');
  process.exit(1);
}

const prismaArgs = command === 'migrate-deploy'
  ? ['migrate', 'deploy', '--schema', schemaPath]
  : [command, '--schema', schemaPath];
const childEnvironment = { ...process.env, DATABASE_URL: databaseUrl };

if (command === 'migrate-deploy' && provider === 'postgresql') {
  const directUrl = normalizeDatabaseUrl(process.env.DIRECT_URL);
  const directProvider = detectDatabaseProvider(directUrl);
  if (directProvider !== 'postgresql') {
    console.error('DIRECT_URL must be a direct PostgreSQL connection for migration deployment.');
    process.exit(1);
  }
  childEnvironment.DATABASE_URL = directUrl;
}

const result = spawnSync(process.execPath, [prismaCli, ...prismaArgs], {
  cwd: process.cwd(),
  env: childEnvironment,
  stdio: 'inherit',
});

if (result.error) {
  console.error('Unable to start the pinned Prisma CLI.');
  process.exit(1);
}
process.exit(result.status ?? 1);
