/** Explicit continuation of a deadline-limited synthetic run. Original report is immutable. */
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fork, execFileSync } from 'node:child_process';
async function main() {
  const out = resolve(process.argv[2] || '');
  if (!out.startsWith(resolve('output') + '/') || process.env.DATABASE_URL !== `file:${join(out, 'probe.db')}`
      || process.env.POLICYWATCHER_ENGINE_PUBLICATION !== '1' || process.env.POLICYWATCHER_ENGINE_NOTIFICATIONS !== '0') throw new Error('isolated_resume_required');
  const prior = JSON.parse(await readFile(join(out, 'report.json'), 'utf8'));
  if (prior.passed || prior.run.selected !== 500 || prior.counts.tasks !== 1000) throw new Error('expected_incomplete_synthetic_run');
  const { db } = await import('../src/lib/db');
  const startedAt = new Date(); const sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  try {
    if (await db.policy.count() !== 500 || await db.policy.count({ where: { id: { startsWith: 'probe-' }, company: { slug: 'synthetic-concurrency-fixture' } } }) !== 500) throw new Error('unexpected_fixture_database');
    const initial = await db.policy.findMany({ select: { id: true, currentHash: true, currentText: true } });
    const workers = await Promise.all(Array.from({ length: 4 }, () => new Promise<{ code: number | null; error: string }>((done, reject) => {
      const child = fork(resolve('scripts/engine-publish-capacity-probe.ts'), ['worker', out], { env: process.env, execArgv: ['--import', 'tsx'], stdio: ['ignore', 'pipe', 'pipe', 'ipc'] });
      let error = ''; child.stderr?.on('data', b => { error += b; }); child.once('error', reject); child.once('exit', code => done({ code, error }));
    })));
    const run = await db.engineRun.findUniqueOrThrow({ where: { id: prior.run.id } });
    const policies = await db.policy.findMany({ select: { id: true, currentHash: true, currentText: true } });
    const logs = await db.policyCheckLog.findMany({ select: { policyId: true, reasonCode: true } });
    const counts = { tasks: await db.engineTask.count(), completed: await db.engineTask.count({ where: { status: 'completed' } }),
      reserved: await db.engineTask.count({ where: { activePolicyId: { not: null } } }), changes: await db.policyChange.count(), snapshots: await db.policySnapshot.count(),
      outbox: await db.engineOutbox.count(), reviews: await db.engineReview.count(), anchors: await db.extractionBaseline.count(),
      logs: logs.length, uniqueVerifiedPolicies: new Set(logs.filter(l => l.reasonCode === 'verified_unchanged').map(l => l.policyId)).size,
      unchangedOutcomes: await db.engineTask.count({ where: { kind: 'policy', resultJson: { contains: '"outcome":"unchanged"' } } }),
      policyMutations: policies.filter(p => !initial.some(a => a.id === p.id && a.currentHash === p.currentHash && a.currentText === p.currentText)).length };
    const passed = run.status === 'completed' && counts.tasks === 1000 && counts.completed === 1000 && counts.reserved === 0 && counts.changes === 0
      && counts.snapshots === 0 && counts.outbox === 0 && counts.reviews === 0 && counts.anchors === 500 && counts.logs === 500 && counts.uniqueVerifiedPolicies === 500
      && counts.unchangedOutcomes === 500 && counts.policyMutations === 0 && workers.every(w => w.code === 0 && !w.error);
    const report = { startedAt, completedAt: new Date(), sourceCommit, priorPhasePassed: prior.passed, priorPhaseDurationMs: prior.durationMs,
      durationMs: Date.now() - startedAt.getTime(), totalElapsedIncludingInterventionMs: Date.now() - Date.parse(prior.startedAt), passed,
      boundary: 'Explicit resumed experiment on the original synthetic database. Initial c12c60a run exceeded its 12-minute harness deadline; this continuation uses the recorded later engine commit. Not an uninterrupted throughput benchmark, Internet workload, or VPS qualification.',
      counts, workers, runStatus: run.status, integrity: await db.$queryRawUnsafe('PRAGMA integrity_check') };
    await writeFile(join(out, 'resume-report.json'), JSON.stringify(report, null, 2), { flag: 'wx' }); console.log(JSON.stringify(report)); if (!passed) process.exitCode = 1;
  } finally { await db.$disconnect(); }
}
void main().catch(error => { console.error(error instanceof Error ? error.message : 'resume_failed'); process.exitCode = 1; });
