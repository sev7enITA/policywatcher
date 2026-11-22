import { beforeEach, afterEach, describe, it, expect } from 'vitest';
import { mkdir, mkdtemp, readFile, rm, stat, symlink, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { writeQuarantinedEvidence, appendQuarantinedEvent } from '../../../scripts/lib/held129-evidence';
import { sha } from '../../../scripts/lib/held129';
let directory: string;
beforeEach(async () => { await mkdir('output', { recursive:true }); directory = await mkdtemp(join(resolve('output'),'quarantine-qa-')); });
afterEach(async () => { await rm(directory,{recursive:true,force:true}); });
const bodyName = 'a'.repeat(24) + '-rendered.body.txt';

describe('untrusted capture quarantine boundary', () => {
  it('preserves exact hostile HTML as nonexecutable private evidence with exclusive creation and roundtrip identity', async () => {
    const body = '<script>throw new Error("never_execute")</script>\u0000network evidence';
    const file = join(directory,bodyName); const receipt = await writeQuarantinedEvidence(directory,bodyName,body);
    expect(await readFile(file,'utf8')).toBe(body); expect(receipt.sha256).toBe(sha(body));
    expect(receipt.trust).toBe('untrusted_quarantined_evidence');
    await expect(writeQuarantinedEvidence(directory,bodyName,'replacement')).rejects.toThrow();
    expect(await readFile(file,'utf8')).toBe(body);
    // Observe the final permissions after all attempted writes; no stat-then-write sequence.
    expect((await stat(file)).mode & 0o777).toBe(0o600);
  });
  it.each(['payload.js','payload.php','page.html','../report.json','../../public/report.json'])('rejects remote-selected executable or escaping name %s', async name => {
    await expect(writeQuarantinedEvidence(directory,name,'payload')).rejects.toThrow('quarantine');
  });
  it('refuses a leaf symlink and a symlinked campaign directory without changing the target', async () => {
    const target = join(directory,'target.txt'); await writeFile(target,'original');
    const link = join(directory,bodyName); await symlink(target,link);
    await expect(writeQuarantinedEvidence(directory,bodyName,'replacement')).rejects.toThrow(); expect(await readFile(target,'utf8')).toBe('original');
    const alias = directory+'-alias'; await symlink(directory,alias);
    try { await expect(writeQuarantinedEvidence(alias,'report.json','payload')).rejects.toThrow('quarantine_directory'); }
    finally { await rm(alias); }
  });
  it('rejects a world-readable output folder and oversize content before writing', async () => {
    const publicDirectory = join(directory,'public-output'); await mkdir(publicDirectory,{mode:0o755});
    await expect(writeQuarantinedEvidence(publicDirectory,'report.json','payload')).rejects.toThrow('not_private');
    await expect(writeQuarantinedEvidence(directory,bodyName,Buffer.alloc(12_000_001))).rejects.toThrow('size_limit');
  });
  it('appends only a bounded private event journal and rejects symlink replacement', async () => {
    const file = join(directory,'events.ndjson'); await appendQuarantinedEvent(directory,'events.ndjson','{"step":1}\n'); await appendQuarantinedEvent(directory,'events.ndjson','{"step":2}\n');
    expect(await readFile(file,'utf8')).toBe('{"step":1}\n{"step":2}\n'); expect((await stat(file)).mode & 0o777).toBe(0o600);
    await expect(appendQuarantinedEvent(directory,'events.ndjson','x'.repeat(64_001))).rejects.toThrow('event_invalid');
    await rm(file); const target=join(directory,'keep.txt');await writeFile(target,'original');await symlink(target,file);
    await expect(appendQuarantinedEvent(directory,'events.ndjson','overwrite')).rejects.toThrow();expect(await readFile(target,'utf8')).toBe('original');
  });
});
