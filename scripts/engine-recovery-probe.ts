/** Mass-expiry fault injection, not a natural wall-clock expiry observation. */
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { execFileSync, fork } from 'node:child_process';
async function main() {
  const [mode, directory] = process.argv.slice(2), out = resolve(directory || '');
  if (!['orchestrate', 'worker'].includes(mode) || !out.startsWith(resolve('output') + '/') || process.env.DATABASE_URL !== `file:${join(out, 'probe.db')}`
      || process.env.POLICYWATCHER_ENGINE_PUBLICATION !== '0' || process.env.POLICYWATCHER_ENGINE_NOTIFICATIONS !== '0') throw new Error('isolated_recovery_probe_required');
  if (mode === 'orchestrate') { await mkdir(out); execFileSync(process.execPath, ['scripts/hostinger-init-db.mjs'], { env: process.env, stdio: 'pipe' }); }
  const { db } = await import('../src/lib/db');
  const { recoverExpiredTasks, MAX_ATTEMPTS } = await import('../src/lib/engine/store');
  try {
    if (mode === 'worker') { const start = Date.now(); await recoverExpiredTasks(); process.send?.({ recoveryMs: Date.now() - start }); return; }
    for (const terminal of [false, true]) {
      const run = await db.engineRun.create({ data: { requestKey: `expired-${terminal}`, requestedBy: 'isolated-fault-injection', mode: 'observe', status: 'running', selected: 250 } });
      await db.engineTask.createMany({ data: Array.from({ length: 250 }, (_, i) => ({ id: `${terminal}-${i}`, key: `${run.id}-${i}`, runId: run.id,
        kind: 'fetch', stage: 'acquire', status: 'running', inputJson: '{}', attempt: terminal ? MAX_ATTEMPTS : 1, totalAttempts: terminal ? MAX_ATTEMPTS : 1,
        leaseToken: `expired-${terminal}-${i}`, leaseExpiresAt: new Date(Date.now() - 1_000) })) });
      await db.engineAttempt.createMany({ data: Array.from({ length: 250 }, (_, i) => ({ id: `attempt-${terminal}-${i}`, taskId: `${terminal}-${i}`, stage: 'acquire', generation: terminal ? MAX_ATTEMPTS : 1 })) });
    }
    const start = Date.now();
    const workers = await Promise.all(Array.from({ length: 4 }, () => new Promise<{ code: number | null; error: string; measurement: unknown }>((done, reject) => {
      const child = fork(resolve('scripts/engine-recovery-probe.ts'), ['worker', out], { env: process.env, execArgv: ['--import', 'tsx'], stdio: ['ignore', 'pipe', 'pipe', 'ipc'] });
      let error = '', measurement: unknown = null; child.stderr?.on('data', b => { error += b; }); child.once('message', m => { measurement = m; });
      child.once('error', reject); child.once('exit', code => done({ code, error, measurement }));
    })));
    const durationMs = Date.now() - start;
    const counts = { queued: await db.engineTask.count({ where: { status: 'queued' } }), failed: await db.engineTask.count({ where: { status: 'failed' } }),
      expiredAttempts: await db.engineAttempt.count({ where: { status: 'expired' } }), runningAttempts: await db.engineAttempt.count({ where: { status: 'running' } }),
      leases: await db.engineTask.count({ where: { leaseToken: { not: null } } }), completedErrorRuns: await db.engineRun.count({ where: { status: 'completed_with_errors' } }),
      changes: await db.policyChange.count(), outbox: await db.engineOutbox.count() };
    const passed = counts.queued === 250 && counts.failed === 250 && counts.expiredAttempts === 500 && counts.runningAttempts === 0 && counts.leases === 0
      && counts.completedErrorRuns === 1 && counts.changes === 0 && counts.outbox === 0 && workers.every(w => w.code === 0 && !w.error);
    const report = { observedAt: new Date().toISOString(), sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
      boundary: '500 synthetic expired leases injected in the past, 2 runs, 4 real processes on local Mac. No real network or natural expiry qualification.',
      passed, durationMs, recoveryUnderFiveSeconds: durationMs < 5000, counts, workers, integrity: await db.$queryRawUnsafe('PRAGMA integrity_check') };
    await writeFile(join(out, 'report.json'), JSON.stringify(report, null, 2), { flag: 'wx' }); console.log(JSON.stringify(report)); if (!passed) process.exitCode = 1;
  } finally { await db.$disconnect(); }
}
void main().catch(error => { console.error(error instanceof Error ? error.message : 'recovery_probe_failed'); process.exitCode = 1; });
