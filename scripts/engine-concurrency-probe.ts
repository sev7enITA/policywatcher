/** Isolated synthetic persistence qualification. Never acquires live policies or sends AI/notifications. */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fork, execFileSync } from 'node:child_process';

async function main() {
  const [mode, directory] = process.argv.slice(2);
  const out = resolve(directory || '');
  if (!out.startsWith(resolve('output') + '/') || process.env.DATABASE_URL !== `file:${join(out, 'probe.db')}`
    || process.env.POLICYWATCHER_ENGINE_PUBLICATION !== '0' || process.env.POLICYWATCHER_ENGINE_NOTIFICATIONS !== '0') throw new Error('isolated_probe_required');
  if (mode === 'orchestrate') {
    await mkdir(out, { recursive: false });
    execFileSync(process.execPath, ['scripts/hostinger-init-db.mjs'], { env: process.env, stdio: 'pipe' });
  }
  const { db } = await import('../src/lib/db');
  const store = await import('../src/lib/engine/store');
  const { digest, structureDocument } = await import('../src/lib/engine/document');
  const text = '# Privacy Policy\n\n## Data use\n\nWe retain account data for 30 days.\n\n## Contact\n\nContact the privacy team for further information about this policy.';
  try {
    if (mode === 'crash') {
      const lease = await store.claimTask();
      if (!lease) throw new Error('crash_lease_missing');
      await writeFile(join(out, 'crash-lease.json'), JSON.stringify({ taskId: lease.id, token: lease.leaseToken, expires: lease.leaseExpiresAt, pid: process.pid }));
      process.send?.({ claimed: true });
      await new Promise(() => {});
    } else if (mode === 'worker') {
      const { workerStep } = await import('../src/lib/engine/pipeline');
      const start = Date.now(); let completedSteps = 0;
      const runId = (await readFile(join(out, 'run-id'), 'utf8')).trim();
      while (Date.now() - start < 420_000) {
        const active = await db.engineRun.findUniqueOrThrow({ where: { id: runId } });
        if (['completed', 'completed_with_errors'].includes(active.status)) break;
        const worked = await workerStep({
          acquire: async input => ({ artifactId: await store.putArtifact({ html: '<main>synthetic immutable fixture</main>', language: 'en', document: structureDocument(text) }),
            observedAt: new Date().toISOString(), source: 'synthetic-concurrency-probe', httpStatus: 200, finalUrl: input.sourceUrl,
            eligible: true, reasons: [], notModified: false, diagnostics: [] }),
          analysis: { analyze: async () => { throw new Error('model_must_not_run'); }, verify: async () => { throw new Error('model_must_not_run'); } },
        });
        if (worked) completedSteps++;
        else await new Promise(done => setTimeout(done, 250));
      }
      await writeFile(join(out, `worker-${process.pid}.json`), JSON.stringify({ pid: process.pid, completedSteps, durationMs: Date.now() - start }));
    } else if (mode === 'orchestrate') {
      const startedAt = new Date();
      const company = await db.company.create({ data: { name: 'Synthetic Concurrency Fixture', slug: 'synthetic-concurrency-fixture', website: 'https://example.com', industry: 'Synthetic test' } });
      await db.policy.createMany({ data: Array.from({ length: 500 }, (_, i) => ({ id: `probe-${i}`, companyId: company.id, name: `Synthetic ${i}`, type: 'privacy',
        url: `https://origin${i % 25}.example.com/policy/${i}`, currentHash: digest(text), currentText: text, lastCheckDate: new Date(0) })) });
      await db.engineSourceContract.createMany({ data: Array.from({ length: 500 }, (_, i) => {
        const contractJson = JSON.stringify({ schemaVersion: 1, sourceUrl: `https://origin${i % 25}.example.com/policy/${i}`, titleAliases: ['Privacy Policy'], requiredHeadings: ['Data use', 'Contact'],
          terminalText: 'Contact the privacy team for further information about this policy.', language: 'en', minimumChars: 100, maximumChars: 500000, preferredTransport: 'direct',
          reviewedAt: startedAt.toISOString(), reviewNote: 'Synthetic contract, no live source verification.' });
        return { policyId: `probe-${i}`, contractJson, contractHash: digest(contractJson), reviewedBy: 'synthetic-probe' };
      }) });
      const run = await store.enqueueRun({ requestKey: 'synthetic-concurrency-500', mode: 'observe', requestedBy: 'synthetic-probe', limit: 500, notificationMode: 'silent' });
      await writeFile(join(out, 'run-id'), run.id);
      const spawn = (kind: string) => fork(resolve('scripts/engine-concurrency-probe.ts'), [kind, out], { env: process.env, execArgv: ['--import', 'tsx'], stdio: ['ignore', 'pipe', 'pipe', 'ipc'] });
      const crash = spawn('crash');
      const killed = await new Promise<{ code: number | null; signal: string | null }>((done, reject) => {
        crash.once('error', reject); crash.once('message', () => crash.kill('SIGKILL')); crash.once('exit', (code, signal) => done({ code, signal }));
      });
      if (killed.signal !== 'SIGKILL') throw new Error('crash_probe_not_killed');
      const workers = Array.from({ length: 4 }, () => spawn('worker'));
      const results = await Promise.all(workers.map(child => new Promise<{ pid: number | undefined; code: number | null; error: string }>((done, reject) => {
        let error = ''; child.stderr?.on('data', b => { error += b.toString(); }); child.once('error', reject); child.once('exit', code => done({ pid: child.pid, code, error }));
      })));
      const final = await db.engineRun.findUniqueOrThrow({ where: { id: run.id } });
      const crashLease = JSON.parse(await readFile(join(out, 'crash-lease.json'), 'utf8'));
      const attempts = await db.engineAttempt.findMany({ where: { taskId: crashLease.taskId }, orderBy: { generation: 'asc' } });
      const counts = { tasks: await db.engineTask.count(), completed: await db.engineTask.count({ where: { status: 'completed' } }),
        reserved: await db.engineTask.count({ where: { activePolicyId: { not: null } } }), changes: await db.policyChange.count(), outbox: await db.engineOutbox.count(),
        policyMutations: await db.policy.count({ where: { OR: [{ currentHash: { not: digest(text) } }, { lastCheckDate: { not: new Date(0) } }] } }) };
      const integrity = await db.$queryRawUnsafe('PRAGMA integrity_check');
      const passed = final.status === 'completed' && counts.tasks === 1000 && counts.completed === 1000 && counts.reserved === 0
        && counts.changes === 0 && counts.outbox === 0 && counts.policyMutations === 0 && results.every(r => r.code === 0)
        && attempts.some(a => a.status === 'expired') && attempts.some(a => a.status === 'completed');
      const report = { startedAt, completedAt: new Date(), durationMs: Date.now() - startedAt.getTime(), passed,
        boundary: '500 synthetic records, 4 real Node processes, actual SIGKILL and natural lease expiry. No live retrieval, AI, publication or notification.',
        run: { id: final.id, status: final.status, selected: final.selected }, counts, workers: results, crash: { ...killed, taskId: crashLease.taskId, leaseExpires: crashLease.expires,
          attempts: attempts.map(a => ({ generation: a.generation, status: a.status, reason: a.reason })) }, integrity };
      await writeFile(join(out, 'report.json'), JSON.stringify(report, null, 2)); console.log(JSON.stringify(report));
      if (!passed) process.exitCode = 1;
    } else throw new Error('invalid_probe_mode');
  } finally { await db.$disconnect(); }
}
void main().catch(error => { console.error(error instanceof Error ? error.message : 'probe_failed'); process.exitCode = 1; });
