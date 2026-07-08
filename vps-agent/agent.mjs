/**
 * PolicyWatcher VPS Operations Agent
 * =================================
 *
 * Separate operations service for the renderer VPS. It exposes only
 * allowlisted operational actions: health, status, logs, fixed smoke test,
 * backup, verified local-package update, and rollback.
 *
 * Security boundaries:
 * - No shell endpoint.
 * - No arbitrary command execution.
 * - No URL input for smoke tests or package downloads.
 * - Mutating operations are serialized with a global lock.
 * - Admin calls use HMAC + timestamp + nonce anti-replay.
 * - Backups always exclude .env and node_modules.
 */

import { createServer } from 'http';
import { createHash, createHmac, randomUUID, timingSafeEqual } from 'crypto';
import { createReadStream } from 'fs';
import {
  access,
  cp,
  mkdir,
  readdir,
  readFile,
  realpath,
  rename,
  rm,
  stat,
  symlink,
  writeFile,
  lstat,
} from 'fs/promises';
import { realpathSync } from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath, pathToFileURL } from 'url';

const AGENT_VERSION = '0.1.0';
const SERVICE_NAME = 'policywatcher-vps-agent';
function isMainModule() {
  if (!process.argv[1]) return false;
  try {
    return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1]);
  } catch {
    return import.meta.url === pathToFileURL(process.argv[1]).href;
  }
}
const IS_MAIN_MODULE = isMainModule();

const CONFIG = {
  port: Number(process.env.PORT || 8791),
  secret: process.env.VPS_AGENT_SECRET || '',
  rendererRoot: process.env.RENDERER_ROOT || '/opt/policywatcher-renderer',
  rendererService: process.env.RENDERER_SERVICE || 'policywatcher-renderer.service',
  rendererHealthUrl: process.env.RENDERER_HEALTH_URL || 'http://127.0.0.1:8787/healthz',
  rendererRenderUrl: process.env.RENDERER_RENDER_URL || 'http://127.0.0.1:8787/render',
  rendererSecret: process.env.RENDERER_SECRET || '',
  smokeUrl: process.env.AGENT_SMOKE_URL || 'https://example.com',
  systemctlBin: process.env.SYSTEMCTL_BIN || '/usr/bin/systemctl',
  npmBin: process.env.NPM_BIN || '/usr/bin/npm',
  tarBin: process.env.TAR_BIN || '/usr/bin/tar',
  unzipBin: process.env.UNZIP_BIN || '/usr/bin/unzip',
  maxBodyBytes: Number(process.env.MAX_BODY_BYTES || 16_384),
  authSkewMs: Number(process.env.AUTH_SKEW_MS || 300_000),
  backupRetention: Number(process.env.BACKUP_RETENTION || 10),
};

const PATHS = {
  current: process.env.RENDERER_CURRENT_LINK || path.join(CONFIG.rendererRoot, 'current'),
  versions: process.env.RENDERER_VERSIONS_DIR || path.join(CONFIG.rendererRoot, 'versions'),
  packages: process.env.RENDERER_PACKAGES_DIR || path.join(CONFIG.rendererRoot, 'packages'),
  backups: process.env.RENDERER_BACKUPS_DIR || path.join(CONFIG.rendererRoot, 'backups'),
  stateFile: process.env.AGENT_STATE_FILE || path.join(CONFIG.rendererRoot, 'agent-state', 'state.json'),
  operationsLog: process.env.AGENT_OPERATIONS_LOG || path.join(CONFIG.rendererRoot, 'agent-logs', 'operations.jsonl'),
};

const nonceCache = new Map();
let operationLock = null;

if (!CONFIG.secret && IS_MAIN_MODULE) {
  console.error('VPS_AGENT_SECRET is required. Refusing to start an open operations agent.');
  process.exit(1);
}

function nowIso() {
  return new Date().toISOString();
}

function jsonResponse(res, code, body) {
  const payload = JSON.stringify(body);
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
    'Cache-Control': 'no-store',
  });
  res.end(payload);
}

function sha256Text(value) {
  return createHash('sha256').update(value).digest('hex');
}

function hmacSignature(method, requestPath, timestamp, nonce, rawBody) {
  const bodyHash = sha256Text(rawBody || '');
  const canonical = `${method.toUpperCase()}\n${requestPath}\n${timestamp}\n${nonce}\n${bodyHash}`;
  return createHmac('sha256', CONFIG.secret).update(canonical).digest('hex');
}

function secureEqual(left, right) {
  const a = Buffer.from(String(left || ''), 'utf8');
  const b = Buffer.from(String(right || ''), 'utf8');
  if (a.length !== b.length) {
    timingSafeEqual(Buffer.alloc(Math.max(a.length, b.length, 1)), Buffer.alloc(Math.max(a.length, b.length, 1)));
    return false;
  }
  return timingSafeEqual(a, b);
}

function cleanupNonceCache() {
  const cutoff = Date.now() - CONFIG.authSkewMs;
  for (const [nonce, seenAt] of nonceCache.entries()) {
    if (seenAt < cutoff) nonceCache.delete(nonce);
  }
}

function verifyAuth(req, rawBody) {
  const timestamp = req.headers['x-policywatcher-timestamp'];
  const nonce = req.headers['x-policywatcher-nonce'];
  const signature = req.headers['x-policywatcher-signature'];

  if (!timestamp || !nonce || !signature) {
    return { ok: false, reason: 'missing_auth_headers' };
  }

  const timestampMs = Date.parse(String(timestamp));
  if (!Number.isFinite(timestampMs) || Math.abs(Date.now() - timestampMs) > CONFIG.authSkewMs) {
    return { ok: false, reason: 'stale_or_invalid_timestamp' };
  }

  cleanupNonceCache();
  if (nonceCache.has(String(nonce))) {
    return { ok: false, reason: 'replayed_nonce' };
  }

  const expected = hmacSignature(req.method || 'GET', req.url || '/', String(timestamp), String(nonce), rawBody);
  if (!secureEqual(expected, String(signature))) {
    return { ok: false, reason: 'invalid_signature' };
  }

  nonceCache.set(String(nonce), Date.now());
  return { ok: true };
}

function readBody(req, limit = CONFIG.maxBodyBytes) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error('body_too_large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function ensureBaseDirectories() {
  await Promise.all([
    mkdir(PATHS.versions, { recursive: true }),
    mkdir(PATHS.packages, { recursive: true }),
    mkdir(PATHS.backups, { recursive: true }),
    mkdir(path.dirname(PATHS.stateFile), { recursive: true }),
    mkdir(path.dirname(PATHS.operationsLog), { recursive: true }),
  ]);
}

async function readState() {
  try {
    const text = await readFile(PATHS.stateFile, 'utf8');
    return JSON.parse(text);
  } catch {
    return {
      state: 'ready',
      currentVersion: null,
      previousVersion: null,
      lastOperation: null,
      updatedAt: nowIso(),
    };
  }
}

async function writeState(nextState) {
  await mkdir(path.dirname(PATHS.stateFile), { recursive: true });
  await writeFile(PATHS.stateFile, JSON.stringify({ ...nextState, updatedAt: nowIso() }, null, 2));
}

async function appendOperation(event) {
  await mkdir(path.dirname(PATHS.operationsLog), { recursive: true });
  const entry = {
    id: randomUUID(),
    at: nowIso(),
    service: SERVICE_NAME,
    ...event,
  };
  await writeFile(PATHS.operationsLog, `${JSON.stringify(entry)}\n`, { flag: 'a' });
  return entry;
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: { ...process.env, ...(options.env || {}) },
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString('utf8');
      if (stdout.length > 64_000) stdout = stdout.slice(-64_000);
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString('utf8');
      if (stderr.length > 64_000) stderr = stderr.slice(-64_000);
    });
    child.on('error', (error) => {
      resolve({ ok: false, code: -1, stdout, stderr: error.message });
    });
    child.on('close', (code) => {
      resolve({ ok: code === 0, code: code ?? -1, stdout, stderr });
    });
  });
}

async function withOperationLock(operation, task) {
  if (operationLock) {
    const error = new Error('operation_locked');
    error.statusCode = 423;
    error.lock = operationLock;
    throw error;
  }
  operationLock = { operation, startedAt: nowIso() };
  try {
    return await task();
  } finally {
    operationLock = null;
  }
}

async function fetchJson(url, options = {}, timeoutMs = 8_000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();
  try {
    const response = await fetch(url, {
      ...options,
      cache: 'no-store',
      signal: controller.signal,
    });
    const text = await response.text();
    let payload = null;
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
    return {
      ok: response.ok,
      httpStatus: response.status,
      latencyMs: Date.now() - started,
      payload,
      textLength: text.length,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function getCurrentTarget() {
  try {
    const linkStat = await lstat(PATHS.current);
    if (!linkStat.isSymbolicLink()) {
      return { ok: false, reason: 'current_is_not_symlink', path: PATHS.current };
    }
    const target = await realpath(PATHS.current);
    return { ok: true, path: target, version: path.basename(target) };
  } catch {
    return { ok: false, reason: 'current_not_configured', path: PATHS.current };
  }
}

async function getRendererHealth() {
  try {
    const result = await fetchJson(CONFIG.rendererHealthUrl, { method: 'GET' }, 8_000);
    return {
      ok: result.ok && result.payload?.ok === true,
      httpStatus: result.httpStatus,
      latencyMs: result.latencyMs,
      payload: result.payload,
      error: result.ok ? null : `renderer_health_http_${result.httpStatus}`,
    };
  } catch (error) {
    return {
      ok: false,
      httpStatus: null,
      latencyMs: null,
      payload: null,
      error: error instanceof Error ? error.message : 'renderer_health_failed',
    };
  }
}

async function runSmokeTest() {
  if (!CONFIG.rendererSecret) {
    return {
      ok: false,
      sourceUrl: CONFIG.smokeUrl,
      error: 'renderer_secret_not_configured',
      testedAt: nowIso(),
    };
  }

  try {
    const result = await fetchJson(
      CONFIG.rendererRenderUrl,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${CONFIG.rendererSecret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: CONFIG.smokeUrl }),
      },
      30_000
    );
    const htmlLength = typeof result.payload?.html === 'string' ? result.payload.html.length : 0;
    const ok = result.ok && htmlLength > 100;
    return {
      ok,
      sourceUrl: CONFIG.smokeUrl,
      httpStatus: result.httpStatus,
      latencyMs: result.latencyMs,
      finalUrl: result.payload?.finalUrl || null,
      renderedStatus: result.payload?.status ?? null,
      htmlLength,
      error: ok ? null : result.payload?.error || `smoke_http_${result.httpStatus}`,
      testedAt: nowIso(),
    };
  } catch (error) {
    return {
      ok: false,
      sourceUrl: CONFIG.smokeUrl,
      error: error instanceof Error ? error.message : 'smoke_failed',
      testedAt: nowIso(),
    };
  }
}

async function sha256File(filePath) {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    const stream = createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

function isSafeArchiveEntry(entry) {
  if (!entry || entry.startsWith('/') || entry.includes('\0')) return false;
  const normalized = path.posix.normalize(entry);
  if (normalized === '..' || normalized.startsWith('../')) return false;
  const parts = normalized.split('/');
  return !parts.some((part) => part === '.env' || part === '.env.local' || part.startsWith('.env.'));
}

async function listArchiveEntries(packagePath) {
  if (packagePath.endsWith('.zip')) {
    const result = await runCommand(CONFIG.unzipBin, ['-Z1', packagePath]);
    if (!result.ok) throw new Error('archive_list_failed');
    return result.stdout.split('\n').map((line) => line.trim()).filter(Boolean);
  }
  if (packagePath.endsWith('.tar.gz') || packagePath.endsWith('.tgz')) {
    const result = await runCommand(CONFIG.tarBin, ['-tzf', packagePath]);
    if (!result.ok) throw new Error('archive_list_failed');
    return result.stdout.split('\n').map((line) => line.trim()).filter(Boolean);
  }
  throw new Error('unsupported_package_type');
}

async function extractArchive(packagePath, targetDir) {
  await mkdir(targetDir, { recursive: true });
  if (packagePath.endsWith('.zip')) {
    const result = await runCommand(CONFIG.unzipBin, ['-q', packagePath, '-d', targetDir]);
    if (!result.ok) throw new Error('archive_extract_failed');
    return;
  }
  if (packagePath.endsWith('.tar.gz') || packagePath.endsWith('.tgz')) {
    const result = await runCommand(CONFIG.tarBin, ['-xzf', packagePath, '-C', targetDir]);
    if (!result.ok) throw new Error('archive_extract_failed');
    return;
  }
  throw new Error('unsupported_package_type');
}

async function findPackageByChecksum(expectedSha256) {
  const files = await readdir(PATHS.packages, { withFileTypes: true }).catch(() => []);
  const candidates = files
    .filter((item) => item.isFile())
    .map((item) => path.join(PATHS.packages, item.name))
    .filter((file) => file.endsWith('.zip') || file.endsWith('.tar.gz') || file.endsWith('.tgz'));

  for (const candidate of candidates) {
    const digest = await sha256File(candidate);
    if (digest.toLowerCase() === expectedSha256.toLowerCase()) {
      return { path: candidate, sha256: digest };
    }
  }

  return null;
}

async function copyExtractedRenderer(stagingDir, versionDir) {
  const direct = path.join(stagingDir, 'server.mjs');
  const nested = path.join(stagingDir, 'renderer', 'server.mjs');
  let sourceDir = null;

  if (await exists(direct)) {
    sourceDir = stagingDir;
  } else if (await exists(nested)) {
    sourceDir = path.join(stagingDir, 'renderer');
  } else {
    const entries = await readdir(stagingDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && await exists(path.join(stagingDir, entry.name, 'server.mjs'))) {
        sourceDir = path.join(stagingDir, entry.name);
        break;
      }
    }
  }

  if (!sourceDir) throw new Error('renderer_entrypoint_missing');
  if (!await exists(path.join(sourceDir, 'package.json'))) throw new Error('renderer_package_missing');
  if (await exists(path.join(sourceDir, '.env'))) throw new Error('env_file_in_package');

  await cp(sourceDir, versionDir, {
    recursive: true,
    errorOnExist: true,
    force: false,
    filter: (src) => {
      const base = path.basename(src);
      return base !== '.env' && !base.startsWith('.env.') && base !== 'node_modules';
    },
  });
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function createBackup(reason = 'manual') {
  const current = await getCurrentTarget();
  if (!current.ok) throw new Error(current.reason);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupName = `renderer-${current.version || 'current'}-${timestamp}.tar.gz`;
  const backupPath = path.join(PATHS.backups, backupName);
  await mkdir(PATHS.backups, { recursive: true });

  const result = await runCommand(CONFIG.tarBin, [
    '-czf',
    backupPath,
    '--exclude=.env',
    '--exclude=.env.*',
    '--exclude=node_modules',
    '-C',
    current.path,
    '.',
  ]);

  if (!result.ok) throw new Error('backup_failed');
  await enforceBackupRetention();
  await appendOperation({ type: 'backup', status: 'ok', reason, backup: backupName, currentVersion: current.version });
  return {
    ok: true,
    backup: backupName,
    path: backupPath,
    currentVersion: current.version,
    createdAt: nowIso(),
  };
}

async function enforceBackupRetention() {
  const files = await readdir(PATHS.backups, { withFileTypes: true }).catch(() => []);
  const backups = [];
  for (const item of files) {
    if (!item.isFile() || !item.name.endsWith('.tar.gz')) continue;
    const filePath = path.join(PATHS.backups, item.name);
    const fileStat = await stat(filePath);
    backups.push({ filePath, mtimeMs: fileStat.mtimeMs });
  }
  backups.sort((a, b) => b.mtimeMs - a.mtimeMs);
  for (const stale of backups.slice(CONFIG.backupRetention)) {
    await rm(stale.filePath, { force: true });
  }
}

async function switchCurrent(versionDir) {
  const currentStat = await lstat(PATHS.current).catch(() => null);
  if (currentStat && !currentStat.isSymbolicLink()) {
    throw new Error('current_is_not_symlink');
  }

  const tmpLink = `${PATHS.current}.next-${process.pid}`;
  await rm(tmpLink, { force: true });
  await symlink(versionDir, tmpLink);
  await rename(tmpLink, PATHS.current);
}

async function restartRenderer() {
  const result = await runCommand(CONFIG.systemctlBin, ['restart', CONFIG.rendererService]);
  if (!result.ok) throw new Error('renderer_restart_failed');
}

function validateVersion(value) {
  return typeof value === 'string' && /^[0-9A-Za-z._-]{1,64}$/.test(value);
}

function validateSha256(value) {
  return typeof value === 'string' && /^[a-fA-F0-9]{64}$/.test(value);
}

async function updateRenderer({ version, sha256 }) {
  if (!validateVersion(version)) throw new Error('invalid_version');
  if (!validateSha256(sha256)) throw new Error('invalid_sha256');

  return withOperationLock('update', async () => {
    const previous = await getCurrentTarget();
    const state = await readState();
    const versionDir = path.join(PATHS.versions, version);
    const stagingDir = path.join(PATHS.versions, `.staging-${version}-${process.pid}`);

    if (await exists(versionDir)) throw new Error('version_already_exists');

    await appendOperation({ type: 'update', status: 'started', version });
    await writeState({ ...state, state: 'updating', lastOperation: { type: 'update', version, startedAt: nowIso() } });

    try {
      await createBackup('pre-update');
      const pkg = await findPackageByChecksum(sha256);
      if (!pkg) throw new Error('package_not_found_for_checksum');

      const entries = await listArchiveEntries(pkg.path);
      if (!entries.length) throw new Error('archive_empty');
      if (!entries.every(isSafeArchiveEntry)) throw new Error('unsafe_archive_entry');

      await rm(stagingDir, { recursive: true, force: true });
      await extractArchive(pkg.path, stagingDir);
      await copyExtractedRenderer(stagingDir, versionDir);

      const install = await runCommand(CONFIG.npmBin, ['install', '--omit=dev'], { cwd: versionDir });
      if (!install.ok) throw new Error('npm_install_failed');

      await switchCurrent(versionDir);
      await restartRenderer();
      const smoke = await runSmokeTest();
      if (!smoke.ok) throw new Error('post_update_smoke_failed');

      const nextState = {
        state: 'ready',
        currentVersion: version,
        previousVersion: previous.ok ? previous.version : state.currentVersion,
        lastOperation: { type: 'update', status: 'ok', version, completedAt: nowIso() },
      };
      await writeState(nextState);
      await appendOperation({ type: 'update', status: 'ok', version, package: path.basename(pkg.path), sha256 });
      return { ok: true, version, smoke, previousVersion: nextState.previousVersion };
    } catch (error) {
      await appendOperation({ type: 'update', status: 'failed', version, error: error.message });
      const rollback = await attemptRollback(previous);
      await rm(versionDir, { recursive: true, force: true }).catch(() => {});
      if (!rollback.ok) {
        await writeState({
          state: 'manual_intervention_required',
          currentVersion: state.currentVersion,
          previousVersion: previous.ok ? previous.version : state.previousVersion,
          lastOperation: {
            type: 'update',
            status: 'rollback_failed',
            version,
            error: error.message,
            rollbackError: rollback.error,
            completedAt: nowIso(),
          },
        });
        throw new Error('update_failed_rollback_failed');
      }

      await writeState({
        state: 'ready',
        currentVersion: previous.ok ? previous.version : state.currentVersion,
        previousVersion: state.previousVersion,
        lastOperation: { type: 'update', status: 'rolled_back', version, error: error.message, completedAt: nowIso() },
      });
      throw new Error('update_failed_rolled_back');
    } finally {
      await rm(stagingDir, { recursive: true, force: true }).catch(() => {});
    }
  });
}

async function attemptRollback(previous) {
  if (!previous.ok || !previous.path) {
    return { ok: false, error: 'no_previous_version' };
  }
  try {
    await switchCurrent(previous.path);
    await restartRenderer();
    const smoke = await runSmokeTest();
    if (!smoke.ok) return { ok: false, error: 'rollback_smoke_failed' };
    await appendOperation({ type: 'rollback', status: 'ok', version: previous.version, automatic: true });
    return { ok: true, version: previous.version, smoke };
  } catch (error) {
    await appendOperation({ type: 'rollback', status: 'failed', version: previous.version, automatic: true, error: error.message });
    return { ok: false, error: error.message };
  }
}

async function rollbackRenderer() {
  return withOperationLock('rollback', async () => {
    const state = await readState();
    if (!state.previousVersion) throw new Error('previous_version_not_available');
    const previousPath = path.join(PATHS.versions, state.previousVersion);
    if (!await exists(previousPath)) throw new Error('previous_version_missing');

    await appendOperation({ type: 'rollback', status: 'started', version: state.previousVersion, automatic: false });
    try {
      await switchCurrent(previousPath);
      await restartRenderer();
      const smoke = await runSmokeTest();
      if (!smoke.ok) throw new Error('rollback_smoke_failed');
      await writeState({
        state: 'ready',
        currentVersion: state.previousVersion,
        previousVersion: state.currentVersion,
        lastOperation: { type: 'rollback', status: 'ok', version: state.previousVersion, completedAt: nowIso() },
      });
      await appendOperation({ type: 'rollback', status: 'ok', version: state.previousVersion, automatic: false });
      return { ok: true, version: state.previousVersion, smoke };
    } catch (error) {
      await writeState({
        ...state,
        state: 'manual_intervention_required',
        lastOperation: { type: 'rollback', status: 'failed', error: error.message, completedAt: nowIso() },
      });
      await appendOperation({ type: 'rollback', status: 'failed', version: state.previousVersion, automatic: false, error: error.message });
      throw new Error('rollback_failed_manual_intervention_required');
    }
  });
}

async function readCappedLogs() {
  const maxBytes = 64 * 1024;
  const maxLines = 200;
  try {
    const fileStat = await stat(PATHS.operationsLog);
    const start = Math.max(0, fileStat.size - maxBytes);
    const stream = createReadStream(PATHS.operationsLog, { start });
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const text = Buffer.concat(chunks).toString('utf8');
    return text.split('\n').filter(Boolean).slice(-maxLines);
  } catch {
    return [];
  }
}

async function statusPayload() {
  await ensureBaseDirectories();
  const [state, current, rendererHealth] = await Promise.all([
    readState(),
    getCurrentTarget(),
    getRendererHealth(),
  ]);
  return {
    ok: state.state !== 'manual_intervention_required',
    service: SERVICE_NAME,
    agentVersion: AGENT_VERSION,
    state: state.state,
    locked: operationLock,
    renderer: {
      current,
      health: rendererHealth,
      serviceName: CONFIG.rendererService,
    },
    paths: {
      rendererRoot: CONFIG.rendererRoot,
      current: PATHS.current,
      packages: PATHS.packages,
      backups: PATHS.backups,
    },
    lastOperation: state.lastOperation,
    generatedAt: nowIso(),
  };
}

async function routeAuthenticated(req, res, rawBody) {
  const auth = verifyAuth(req, rawBody);
  if (!auth.ok) {
    return jsonResponse(res, 401, { error: auth.reason });
  }

  const url = new URL(req.url || '/', 'http://127.0.0.1');

  try {
    if (req.method === 'GET' && url.pathname === '/version') {
      return jsonResponse(res, 200, {
        ok: true,
        service: SERVICE_NAME,
        agentVersion: AGENT_VERSION,
        rendererService: CONFIG.rendererService,
        generatedAt: nowIso(),
      });
    }

    if (req.method === 'GET' && url.pathname === '/status') {
      return jsonResponse(res, 200, await statusPayload());
    }

    if (req.method === 'GET' && url.pathname === '/logs') {
      return jsonResponse(res, 200, { ok: true, lines: await readCappedLogs(), capped: { maxLines: 200, maxBytes: 64 * 1024 } });
    }

    if (req.method === 'POST' && url.pathname === '/smoke-test') {
      const result = await runSmokeTest();
      await appendOperation({ type: 'smoke-test', status: result.ok ? 'ok' : 'failed', error: result.error || null });
      return jsonResponse(res, result.ok ? 200 : 502, result);
    }

    if (req.method === 'POST' && url.pathname === '/backup') {
      const result = await withOperationLock('backup', () => createBackup('manual'));
      return jsonResponse(res, 200, result);
    }

    if (req.method === 'POST' && url.pathname === '/update') {
      const body = rawBody ? JSON.parse(rawBody) : {};
      const result = await updateRenderer({ version: body.version, sha256: body.sha256 });
      return jsonResponse(res, 200, result);
    }

    if (req.method === 'POST' && url.pathname === '/rollback') {
      const result = await rollbackRenderer();
      return jsonResponse(res, 200, result);
    }

    return jsonResponse(res, 404, { error: 'not_found' });
  } catch (error) {
    const code = error.statusCode || (error.message === 'operation_locked' ? 423 : 500);
    await appendOperation({ type: 'request', status: 'failed', path: url.pathname, error: error.message }).catch(() => {});
    return jsonResponse(res, code, {
      ok: false,
      error: error.message || 'agent_error',
      lock: error.lock,
    });
  }
}

const server = createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/healthz') {
    const state = await readState();
    return jsonResponse(res, state.state === 'manual_intervention_required' ? 503 : 200, {
      ok: state.state !== 'manual_intervention_required',
      service: SERVICE_NAME,
      agentVersion: AGENT_VERSION,
      state: state.state,
      locked: operationLock,
      uptimeSeconds: Math.round(process.uptime()),
    });
  }

  let rawBody = '';
  try {
    rawBody = req.method === 'GET' ? '' : await readBody(req);
  } catch {
    return jsonResponse(res, 413, { error: 'body_too_large' });
  }

  return routeAuthenticated(req, res, rawBody);
});

if (IS_MAIN_MODULE) {
  await ensureBaseDirectories();
  server.listen(CONFIG.port, () => {
    console.log(`[VPS Agent] Listening on :${CONFIG.port}`);
  });

  process.on('SIGTERM', () => {
    server.close(() => process.exit(0));
  });
}

export {
  hmacSignature,
  isSafeArchiveEntry,
  validateSha256,
  validateVersion,
};
