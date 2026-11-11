import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const hash = value => createHash('sha256').update(value).digest('hex');
const target = 'src/lib/engineImplementation.generated.json';
const files = [
  'package.json', 'package-lock.json', 'prisma/schema.prisma',
  'scripts/engine-implementation-manifest.mjs', 'scripts/engine-worker.ts',
  'scripts/hostinger-managed-build.mjs', 'scripts/hostinger-environment-gate.mjs', 'scripts/hosted-preview-preflight.mjs',
  'scripts/hostinger-normalize-next-config.mjs',
  'src/instrumentation.ts', 'src/lib/scanChannels.ts', 'src/lib/hostedPreview.ts', 'src/lib/db.ts', 'src/lib/databaseUrl.ts',
  'src/lib/scraper.ts', 'src/lib/extractionProfile.ts', 'src/lib/extractionProfile.generated.json',
  'src/lib/acquisitionScope.ts', 'src/lib/sourceReliability.ts', 'src/lib/pdfPolicy.ts',
  'src/app/api/admin/cron-status/route.ts', 'src/app/api/admin/engine/route.ts',
  'src/app/api/cron/check-all/route.ts',
  'src/proxy.ts', 'next.config.ts',
  'src/lib/encryptedBackup.ts', 'src/lib/databaseReadiness.ts',
  'scripts/hostinger-init-db.mjs', 'scripts/hostinger-init-db.py',
];
function collect(directory) {
  for (const entry of readdirSync(join(root, directory), { withFileTypes: true })) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) collect(path);
    else if (entry.isFile() && /\.(?:ts|sql|toml)$/.test(entry.name)) files.push(path);
  }
}
collect('src/lib/engine');
collect('prisma/migrations');
collect('prisma/postgresql/migrations');
// Follow local TypeScript imports (including dynamic imports) so a changed
// acquisition, authentication or model dependency cannot retain the identity.
const closure = new Set();
function include(file) {
  if (file === target || closure.has(file)) return;
  closure.add(file);
  if (!/\.tsx?$/.test(file)) return;
  for (const imported of ts.preProcessFile(readFileSync(join(root, file), 'utf8'), true, true).importedFiles) {
    const name = imported.fileName;
    const base = name.startsWith('@/') ? `src/${name.slice(2)}`
      : name.startsWith('.') ? join(dirname(file), name) : null;
    if (!base) continue;
    const dependency = [base, `${base}.ts`, `${base}.tsx`, `${base}.json`, `${base}/index.ts`]
      .find(candidate => existsSync(join(root, candidate)) && /\.(?:tsx?|json)$/.test(candidate));
    if (!dependency) throw new Error(`Unresolved implementation dependency: ${file} -> ${name}`);
    include(dependency);
  }
}
files.forEach(include);
const entries = [...closure].sort().map(file => [file, hash(readFileSync(join(root, file)))]);
const manifest = { schema: 'pw-engine-implementation-1', files: entries, hash: hash(JSON.stringify(entries)) };
const rendered = `${JSON.stringify(manifest, null, 2)}\n`;
if (process.argv.includes('--check')) {
  if (readFileSync(join(root, target), 'utf8') !== rendered) {
    throw new Error('Engine implementation manifest is stale. Run node scripts/engine-implementation-manifest.mjs.');
  }
} else writeFileSync(join(root, target), rendered);
