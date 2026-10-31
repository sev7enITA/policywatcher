/** Bounded, immutable daily observations. No production DB, models or delivery. */
import { mkdir, readFile, writeFile, readdir, unlink } from 'node:fs/promises';
import { resolve, join, relative } from 'node:path';
import { execFileSync, spawn } from 'node:child_process';
import { assessCampaign, qualificationDigest as hash, type CampaignManifest, type CampaignSource, type CampaignWindow, type CheckedWindow } from '../src/lib/engine/qualification';

const implementationFiles = ['scripts/engine-qualification-campaign.ts', 'scripts/engine-acquisition-probe.ts', 'src/lib/engine/qualification.ts', 'src/lib/engine/acquisition.ts', 'src/lib/engine/document.ts', 'src/lib/scraper.ts', 'src/lib/pdfPolicy.ts', 'src/lib/acquisitionScope.ts', 'src/lib/extractionProfile.generated.json'];
const json = async <T>(file: string) => JSON.parse(await readFile(file, 'utf8')) as T;
const save = (file: string, value: unknown, exclusive = false) => writeFile(file, JSON.stringify(value, null, 2) + '\n', { flag: exclusive ? 'wx' : 'w' });
async function implementationHash() {
  return hash(JSON.stringify(await Promise.all(implementationFiles.map(async p => [p, hash(await readFile(p))]))));
}
async function main() {
  const [mode, directory, corpusPath = 'evals/engine-v6/acquisition-corpus.json'] = process.argv.slice(2);
  if (!directory || !['init', 'capture', 'status'].includes(mode)) throw new Error('usage_init_capture_status_and_output_directory');
  const root = resolve(directory), boundary = resolve('output') + '/';
  if (!root.startsWith(boundary) || process.env.POLICYWATCHER_ENGINE_PUBLICATION === '1' || process.env.POLICYWATCHER_ENGINE_NOTIFICATIONS === '1') throw new Error('isolated_campaign_required');
  const manifestFile = join(root, 'manifest.json');
  if (mode === 'init') {
    const sources = await json<CampaignSource[]>(corpusPath);
    if (!Array.isArray(sources) || sources.length < 1 || sources.length > 30 || new Set(sources.map(s => s.id)).size !== sources.length
        || sources.some(s => !/^[a-z0-9-]{3,80}$/.test(s.id) || !['en', 'it'].includes(s.expectedLanguage) || !['html', 'pdf'].includes(s.format)
          || new URL(s.url).protocol !== 'https:' || new URL(s.url).username || new URL(s.url).password)) throw new Error('invalid_campaign_corpus');
    const profile = await json<{ hash: string }>('src/lib/extractionProfile.generated.json');
    const manifest: CampaignManifest = { schema: 'pw-engine-qualification-1', createdAt: new Date().toISOString(),
      sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), implementationHash: await implementationHash(), profileHash: profile.hash,
      corpusHash: hash(JSON.stringify(sources)), sources };
    assessCampaign(manifest, []);
    await mkdir(root, { recursive: false }); await mkdir(join(root, 'windows'));
    await save(manifestFile, manifest, true); await save(join(root, 'corpus.json'), sources, true);
    console.log(JSON.stringify({ initialized: relative(process.cwd(), root), sources: sources.length, manifestHash: hash(JSON.stringify(manifest)) }));
    return;
  }
  const manifest = await json<CampaignManifest>(manifestFile);
  const manifestHash = hash(JSON.stringify(manifest));
  if (manifest.corpusHash !== hash(JSON.stringify(await json(join(root, 'corpus.json'))))) throw new Error('frozen_corpus_changed');
  if (mode === 'capture') {
    if (await implementationHash() !== manifest.implementationHash) throw new Error('implementation_changed_start_new_cohort');
    const lock = join(root, 'capture.lock');
    await writeFile(lock, String(process.pid), { flag: 'wx' });
    try {
      const startedAt = new Date().toISOString(), id = startedAt.replace(/[:.]/g, '-');
      const dir = join(root, 'windows', id); await mkdir(dir);
      const capture = join(dir, 'capture');
      let output = '';
      const exit = await new Promise<{ code: number | null; signal: string | null }>((done, reject) => {
        const child = spawn(process.execPath, ['--no-network-family-autoselection', '--import', 'tsx', 'scripts/engine-acquisition-probe.ts', join(root, 'corpus.json'), capture], {
          env: { ...process.env, DATABASE_URL: `file:${join(dir, 'isolated.db')}`, POLICYWATCHER_ENGINE_PUBLICATION: '0', POLICYWATCHER_ENGINE_NOTIFICATIONS: '0' },
          stdio: ['ignore', 'pipe', 'pipe'], timeout: 900_000,
        });
        child.stdout.on('data', b => { output += b.toString(); }); child.stderr.on('data', b => { output += b.toString(); });
        child.once('error', reject); child.once('exit', (code, signal) => done({ code, signal }));
      });
      await writeFile(join(dir, 'probe.log'), output, { flag: 'wx' });
      type Attempt = { kind: string; observedAt: string; status: number; bodyFile: string; bodyHash: string; drift: boolean; extraction: string; textHash: string; languageMatches: boolean };
      let sourceReceipt: { completed: number; rows: Array<{ id: string; url: string; attempts: Attempt[] }> } = { completed: 0, rows: [] };
      try { sourceReceipt = await json(join(capture, 'results.json')); } catch { /* Interrupted evidence remains a failed window. */ }
      const window: CampaignWindow = { schema: 'pw-engine-window-1', id, manifestHash, implementationHash: await implementationHash(),
        startedAt, completedAt: new Date().toISOString(), mode: 'live', complete: exit.code === 0 && sourceReceipt.completed === manifest.sources.length,
        observations: [], failures: [], sourceReceiptHash: hash(JSON.stringify(sourceReceipt)) };
      const artifacts: Array<{ file: string; sha256: string }> = [];
      for (const source of manifest.sources) {
        const row = sourceReceipt.rows.find(r => r.id === source.id && r.url === source.url);
        const attempt = row?.attempts.find(a => a.status === 200 && a.extraction === 'completed' && !a.drift);
        if (!attempt) { window.failures.push({ id: source.id, reason: 'fresh_capture_missing_or_rejected' }); continue; }
        if (!/^[a-z0-9-]+\.body\.txt$/.test(attempt.bodyFile)) throw new Error('unsafe_payload_path');
        const bytes = await readFile(join(capture, attempt.bodyFile));
        if (hash(bytes) !== attempt.bodyHash) throw new Error('capture_hash_mismatch');
        artifacts.push({ file: 'capture/' + attempt.bodyFile, sha256: attempt.bodyHash });
        window.observations.push({ id: source.id, observedAt: attempt.observedAt, status: attempt.status, transport: attempt.kind, fresh: true,
          payloadHash: attempt.bodyHash, extractionCompleted: true, sourceDrift: attempt.drift, languageMatches: attempt.languageMatches, textHash: attempt.textHash });
      }
      // Every failed attempt remains in the original receipt, including a recovered retry.
      const receiptText = await readFile(join(capture, 'results.json')).catch(() => Buffer.from(''));
      if (receiptText.length) artifacts.push({ file: 'capture/results.json', sha256: hash(receiptText) });
      await save(join(dir, 'receipt.json'), { window, artifacts, exit }, true);
    } finally { await unlink(lock); }
  }
  const windows: CheckedWindow[] = [], unsealed: string[] = [];
  for (const name of (await readdir(join(root, 'windows'))).sort()) {
    if (!/^[0-9TZ-]+$/.test(name)) throw new Error('invalid_window_directory');
    const dir = join(root, 'windows', name);
    let receipt: { window: CampaignWindow; artifacts: Array<{ file: string; sha256: string }> };
    try { receipt = await json(join(dir, 'receipt.json')); } catch { unsealed.push(name); continue; }
    let integrityVerified = true;
    for (const a of receipt.artifacts) {
      const path = resolve(dir, a.file);
      if (!path.startsWith(dir + '/') || !/^[a-f0-9]{64}$/.test(a.sha256)) { integrityVerified = false; continue; }
      try { if (hash(await readFile(path)) !== a.sha256) integrityVerified = false; } catch { integrityVerified = false; }
    }
    try {
      const raw = await json<{ rows: Array<{ id: string; attempts: Array<{ bodyHash: string; observedAt: string; status: number; kind: string; extraction: string; textHash: string }> }> }>(join(dir, 'capture/results.json'));
      if (hash(JSON.stringify(raw)) !== receipt.window.sourceReceiptHash) integrityVerified = false;
      for (const o of receipt.window.observations) {
        if (!receipt.artifacts.some(a => a.sha256 === o.payloadHash) || !raw.rows.some(r => r.id === o.id && r.attempts.some(a => a.bodyHash === o.payloadHash && a.observedAt === o.observedAt && a.status === o.status && a.kind === o.transport && a.extraction === 'completed' && a.textHash === o.textHash))) integrityVerified = false;
      }
    } catch { integrityVerified = false; }
    windows.push({ window: receipt.window, integrityVerified });
  }
  const status = { ...assessCampaign(manifest, windows), unsealedWindows: unsealed, currentImplementationMatches: await implementationHash() === manifest.implementationHash };
  await save(join(root, 'status.json'), status); console.log(JSON.stringify(status, null, 2));
}
void main().catch(error => { console.error(error instanceof Error ? error.message : 'campaign_failed'); process.exitCode = 1; });
