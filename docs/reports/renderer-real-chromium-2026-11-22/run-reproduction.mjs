// Manual, one-source network probe. Uses only already installed Chromium; never downloads.
import { mkdtemp, mkdir, symlink, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const directory = dirname(fileURLToPath(import.meta.url));
const repository = resolve(directory, '../../..');
assert(existsSync(chromium.executablePath()), 'Chromium must already be installed; this probe does not install it.');
const scratch = await mkdtemp(join(tmpdir(), 'policywatcher-renderer-real-'));
const output = join(scratch, 'output/renderer-1.2.1/real-chromium');
await mkdir(output, { recursive: true });
await symlink(join(repository, 'renderer'), join(scratch, 'renderer'), 'dir');
console.log(JSON.stringify({ scratch, scope: 'manual real-browser probe; no user profile' }));
let log = '';
let timedOut = false;
let force;
const child = spawn(process.execPath, [join(directory, 'fixture.mjs')], { cwd: scratch, stdio: ['ignore', 'pipe', 'pipe'] });
child.stdout.on('data', chunk => { log += chunk; });
child.stderr.on('data', chunk => { log += chunk; });
const deadline = setTimeout(() => {
  timedOut = true;
  child.kill('SIGTERM');
  force = setTimeout(() => child.kill('SIGKILL'), 5000);
}, 150000);
let exit;
try {
  exit = await new Promise((accept, reject) => { child.once('error', reject); child.once('close', (code, signal) => accept({ code, signal })); });
} finally {
  clearTimeout(deadline);
  clearTimeout(force);
  await writeFile(join(output, 'run.log'), log);
}
await writeFile(join(output, 'child-exit.json'), JSON.stringify(exit));
const receiptPath = join(output, 'receipt.json');
const receipt = JSON.parse(await readFile(receiptPath, 'utf8'));
assert(!timedOut, 'Probe deadline exceeded; inspect the owned process and retained log.');
assert.equal(exit.code, 0);
// The real SIGTERM handler exits0 even after an earlier fixture assertion fails.
// Therefore the JSON semantic verdict and every expected stage are mandatory.
assert.equal(receipt.status, 'passed_real_local_browser_and_admission');
assert.equal(receipt.initialReady.status, 200);
assert.equal(receipt.partialBodyActive, 1);
assert.equal(receipt.concurrentAttempt.status, 429);
assert.equal(receipt.externalRender.outerStatus, 200);
assert.equal(receipt.externalRender.sourceStatus, 200);
assert.equal(receipt.externalRender.exampleDomainObserved, true);
assert.equal(receipt.finalReady.active, 0);
console.log(JSON.stringify({ status: receipt.status, receiptPath, exit, externalTestSource: 'https://example.com', remoteVpsQualification: false }));
