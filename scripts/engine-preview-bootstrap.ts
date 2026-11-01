/** Bootstrap only a dedicated, empty Preview database from an explicit public catalog allowlist.
 * No subscribers, sessions, history, jobs, notifications or credentials are copied.
 * Usage: tsx scripts/engine-preview-bootstrap.ts --catalog public-catalog.json
 *   --database /absolute/approved/preview.db [--contracts contracts.json] [--overrides overrides.json]
 * --source-db /absolute/read-only-backup.db can replace --catalog; SQLite is opened read-only.
 */
import { createHash } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, writeFileSync, chmodSync } from 'node:fs';
import { dirname, isAbsolute, join, parse, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import { digest, parseSourceContract } from '../src/lib/engine/document';

const args = new Map<string, string>();
for (let i = 2; i < process.argv.length; i += 2) {
  const key = process.argv[i], value = process.argv[i + 1];
  if (!['--catalog', '--source-db', '--database', '--contracts', '--overrides'].includes(key) || !value || args.has(key)) throw new Error('invalid_bootstrap_arguments');
  args.set(key, value);
}
const sha = (data: string | Buffer) => createHash('sha256').update(data).digest('hex');
const text = (v: unknown, max = 2000): string => {
  if (typeof v !== 'string' || !v.trim() || v.length > max) throw new Error('invalid_catalog_text');
  return v;
};
const date = (v: unknown) => {
  const result = new Date(typeof v === 'number' ? v : text(v));
  if (!Number.isFinite(result.getTime())) throw new Error('invalid_catalog_date');
  return result;
};
function publicUrl(v: unknown): string {
  const value = text(v), url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || !url.hostname.includes('.') || /^(?:localhost|127\.|10\.|192\.168\.|0\.|\[)/.test(url.hostname)) throw new Error('invalid_catalog_public_url');
  return value;
}
function readJson(file: string) {
  const bytes = readFileSync(file);
  if (bytes.length > 100_000_000) throw new Error('catalog_too_large');
  return JSON.parse(bytes.toString('utf8'));
}
function noSymlink(path: string) {
  for (let current = path; current !== parse(current).root; current = dirname(current)) {
    if (existsSync(current) && lstatSync(current).isSymbolicLink()) throw new Error('preview_path_symlink_rejected');
  }
}
function readonlyCatalog(source: string) {
  if (!isAbsolute(source) || !existsSync(source)) throw new Error('source_database_required');
  const query = (sql: string) => {
    const result = spawnSync('sqlite3', ['-readonly', '-json', source, sql], { encoding: 'utf8', maxBuffer: 100_000_000 });
    if (result.status !== 0) throw new Error('readonly_catalog_export_failed');
    return JSON.parse(result.stdout || '[]');
  };
  return { schema: 'pw-preview-public-catalog-1',
    companies: query('SELECT id,name,slug,logo,industry,website FROM Company ORDER BY id'),
    policies: query(`SELECT p.id,p.companyId,p.name,p.type,p.url,p.retrievalUrl,p.jurisdiction,p.sourceMigrationPending,p.sourceMigrationRequestedAt,p.lastCheckDate,p.lastSuccessfulCheckDate,p.ingestionMethod,p.dataStatus,
      CASE WHEN p.ingestionMethod <> 'Seeded' AND p.dataStatus IN ('Available','Reviewed') AND EXISTS(SELECT 1 FROM PolicySnapshot s WHERE s.policyId=p.id AND s.publicEvidence=1 AND s.hash=p.currentHash AND s.text=p.currentText) THEN p.currentText ELSE '' END AS currentText,
      CASE WHEN p.ingestionMethod <> 'Seeded' AND p.dataStatus IN ('Available','Reviewed') AND EXISTS(SELECT 1 FROM PolicySnapshot s WHERE s.policyId=p.id AND s.publicEvidence=1 AND s.hash=p.currentHash AND s.text=p.currentText) THEN p.currentHash ELSE '' END AS currentHash
      FROM Policy p ORDER BY p.id`) };
}

async function main() {
  const requested = args.get('--database');
  const allowed = [resolve('output/engine-channels/hosted-preview/preview.db'), '/home/u847874844/domains/staging.policywatcher.online/policywatcher-preview/preview.db'];
  if (!requested || !isAbsolute(requested) || !allowed.includes(requested) || resolve(requested) !== requested) throw new Error('dedicated_preview_database_required');
  if (Boolean(args.get('--catalog')) === Boolean(args.get('--source-db'))) throw new Error('one_catalog_source_required');
  noSymlink(requested);
  const raw = args.has('--catalog') ? readJson(args.get('--catalog')!) : readonlyCatalog(args.get('--source-db')!);
  if (raw.schema !== 'pw-preview-public-catalog-1' || !Array.isArray(raw.companies) || !Array.isArray(raw.policies)
      || !raw.companies.length || raw.companies.length > 500 || !raw.policies.length || raw.policies.length > 5000) throw new Error('invalid_public_catalog');
  // Construct every record field by field. Unknown input properties never enter SQLite or the receipt.
  const companies = raw.companies.map((c: Record<string, unknown>) => ({ id: text(c.id, 100), name: text(c.name, 300),
    slug: text(c.slug, 120), logo: c.logo == null ? null : text(c.logo, 100), industry: text(c.industry, 300), website: publicUrl(c.website) }));
  const companyIds = new Set(companies.map((c: { id: string }) => c.id));
  if (companyIds.size !== companies.length) throw new Error('duplicate_company');
  const policies = raw.policies.map((p: Record<string, unknown>) => {
    const currentText = typeof p.currentText === 'string' ? p.currentText : '';
    if (currentText.length > 500_000 || (currentText && (sha(currentText) !== p.currentHash || p.ingestionMethod === 'Seeded' || !['Available', 'Reviewed'].includes(String(p.dataStatus))))) throw new Error('unverified_public_baseline');
    const companyId = text(p.companyId, 100);
    if (!companyIds.has(companyId)) throw new Error('missing_company');
    return { id: text(p.id, 100), companyId, name: text(p.name, 300), type: text(p.type, 100), url: publicUrl(p.url),
      retrievalUrl: p.retrievalUrl == null ? null : publicUrl(p.retrievalUrl), jurisdiction: text(p.jurisdiction, 100),
      currentText, currentHash: currentText ? String(p.currentHash) : sha(''),
      sourceMigrationPending: !currentText || Boolean(p.sourceMigrationPending),
      sourceMigrationRequestedAt: p.sourceMigrationRequestedAt == null ? null : date(p.sourceMigrationRequestedAt),
      dataStatus: currentText ? text(p.dataStatus, 100) : 'Configured', ingestionMethod: currentText ? text(p.ingestionMethod, 100) : 'Configured',
      lastCheckDate: date(p.lastCheckDate), lastSuccessfulCheckDate: date(p.lastSuccessfulCheckDate) };
  });
  const policyIds = new Set(policies.map((p: { id: string }) => p.id));
  if (policyIds.size !== policies.length) throw new Error('duplicate_policy');
  const overrides = args.has('--overrides') ? readJson(args.get('--overrides')!) : [];
  if (!Array.isArray(overrides) || overrides.length > 20) throw new Error('invalid_preview_overrides');
  const appliedOverrides = overrides.map((o: Record<string, unknown>) => {
    const policyId = text(o.policyId, 100), reason = text(o.reason, 2000);
    const policy = policies.find((p: { id: string }) => p.id === policyId);
    if (!policy || !Object.hasOwn(o, 'retrievalUrl')) throw new Error('invalid_preview_override_policy');
    const originalRetrievalUrl = policy.retrievalUrl;
    policy.retrievalUrl = o.retrievalUrl === null ? null : publicUrl(o.retrievalUrl);
    policy.sourceMigrationPending = true;
    return { policyId, originalRetrievalUrl, previewRetrievalUrl: policy.retrievalUrl || policy.url, reason };
  });
  const contractInput = args.has('--contracts') ? readJson(args.get('--contracts')!) : [];
  if (!Array.isArray(contractInput) || contractInput.length > policies.length) throw new Error('invalid_preview_contracts');
  const contracts = contractInput.map((c: Record<string, unknown>) => {
    const policyId = text(c.policyId, 100), reviewedBy = text(c.reviewedBy, 100), contract = parseSourceContract(c.contract);
    const policy = policies.find((p: { id: string }) => p.id === policyId);
    if (!policy || contract.sourceUrl !== (policy.retrievalUrl || policy.url)) throw new Error('contract_source_mismatch');
    if (Date.parse(contract.reviewedAt) > Date.now() + 300_000) throw new Error('future_contract_review');
    const contractJson = JSON.stringify(contract);
    return { policyId, reviewedBy, contractJson, contractHash: digest(contractJson) };
  });
  if (new Set(contracts.map(c => c.policyId)).size !== contracts.length) throw new Error('duplicate_contract');
  const inputHash = sha(JSON.stringify({ companies, policies, contracts, appliedOverrides }));
  const receiptPath = join(dirname(requested), 'bootstrap-receipt.json');
  if (existsSync(requested)) {
    const stat = lstatSync(requested);
    if (!stat.isFile() || stat.nlink !== 1) throw new Error('preview_database_alias_rejected');
    if (stat.size > 0) {
      // Never migrate, reset or overwrite an existing database. A matching receipt is a no-op.
      if (!existsSync(receiptPath) || readJson(receiptPath).inputHash !== inputHash) throw new Error('preview_database_already_exists');
      console.log(JSON.stringify({ state: 'already_initialized_no_changes', inputHash, database: requested }));
      return;
    }
  }
  mkdirSync(dirname(requested), { recursive: true, mode: 0o700 }); noSymlink(requested);
  if (realpathSync(dirname(requested)) !== dirname(requested)) throw new Error('preview_parent_alias_rejected');
  // The pinned SQLite schema engine expects the target file to exist on some hosts.
  if (!existsSync(requested)) writeFileSync(requested, '', { flag: 'wx', mode: 0o600 });
  const migration = spawnSync(process.execPath, [resolve('node_modules/prisma/build/index.js'), 'migrate', 'deploy', '--schema', resolve('prisma/schema.prisma')], {
    cwd: process.cwd(), env: { ...process.env, DATABASE_URL: `file:${requested}`, POLICYWATCHER_ENGINE_PUBLICATION: '0', POLICYWATCHER_ENGINE_NOTIFICATIONS: '0', POLICYWATCHER_ENGINE_BUILD_PHASE: '1' },
    encoding: 'utf8', maxBuffer: 5_000_000,
  });
  if (migration.status !== 0) throw new Error('preview_schema_migration_failed');
  chmodSync(requested, 0o600);
  const db = new PrismaClient({ datasources: { db: { url: `file:${requested}` } } });
  try {
    await db.$transaction(async tx => {
      if (await tx.company.count() || await tx.policy.count()) throw new Error('preview_database_not_empty');
      for (const c of companies) await tx.company.create({ data: c });
      for (const p of policies) await tx.policy.create({ data: p });
      for (const c of contracts) await tx.engineSourceContract.create({ data: c });
    }, { timeout: 60_000 });
    const tables = await db.$queryRawUnsafe<Array<{ name: string }>>("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
    const counts: Record<string, number> = {};
    for (const table of tables) {
      if (!/^[A-Za-z_][A-Za-z_0-9]*$/.test(table.name)) throw new Error('unexpected_schema_table');
      const result = await db.$queryRawUnsafe<Array<{ count: bigint }>>(`SELECT COUNT(*) AS count FROM "${table.name}"`);
      counts[table.name] = Number(result[0].count);
    }
    const unexpected = Object.entries(counts).filter(([name, count]) => count > 0 && !['Company', 'Policy', 'EngineSourceContract', '_prisma_migrations'].includes(name));
    if (unexpected.length) throw new Error('preview_non_allowlisted_data_present');
    const receipt = { schema: 'pw-preview-bootstrap-1', generatedAt: new Date().toISOString(), inputHash,
      companies: companies.length, configuredPolicies: policies.length, publicBaselinesIncluded: policies.filter((p: { currentText: string }) => p.currentText).length,
      reviewedContracts: contracts.length, reviewActors: [...new Set(contracts.map(c => c.reviewedBy))],
      copiedTables: ['Company', 'Policy', ...(contracts.length ? ['EngineSourceContract'] : [])],
      counts, appliedOverrides, publicationEnabled: false, notificationsEnabled: false,
      limitation: 'Public catalog and selected prior public text only; imported baseline text is not newly verified by Engine 6. Source contracts are scoped reviews, not corpus-wide completeness qualification.' };
    writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
    console.log(JSON.stringify(receipt));
  } finally { await db.$disconnect(); }
}
void main().catch(error => { console.error(error instanceof Error && /^[a-z_]+$/.test(error.message) ? error.message : 'preview_bootstrap_failed'); process.exitCode = 1; });
