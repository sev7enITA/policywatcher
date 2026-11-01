import { afterEach, describe, expect, it, vi } from 'vitest';
import { appendFile, link, mkdir, mkdtemp, open, readFile, rename, rm, symlink, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { readBoundedEvidenceFile, readBoundedEvidenceFileSync, readBoundedEvidenceHandle } from '../../../scripts/lib/boundedEvidenceFile';

const directories: string[] = [];
async function fixture(content = 'original evidence') {
  const directory = await mkdtemp(join(tmpdir(), 'pw-evidence-fd-')); directories.push(directory);
  const path = join(directory, 'capture.txt'); await writeFile(path, content);
  return { directory, path };
}
afterEach(async () => { vi.restoreAllMocks(); await Promise.all(directories.splice(0).map(path => rm(path, { recursive: true, force: true }))); });

describe('descriptor-bound evidence reads', () => {
  it('retains the opened evidence when the pathname is replaced before reading', async () => {
    const { directory, path } = await fixture();
    const handle = await open(path, 'r');
    try {
      await rename(path, join(directory, 'preserved.txt'));
      await writeFile(path, 'replacement must not be read');
      expect((await readBoundedEvidenceHandle(handle, 100)).toString()).toBe('original evidence');
    } finally { await handle.close(); }
  });

  it('rejects growth beyond the byte budget after descriptor metadata was inspected', async () => {
    const { path } = await fixture('small'); const handle = await open(path, 'r');
    const stat = handle.stat.bind(handle);
    vi.spyOn(handle, 'stat').mockImplementationOnce(async () => {
      const initial = await stat(); await appendFile(path, 'a'.repeat(100)); return initial;
    });
    try { await expect(readBoundedEvidenceHandle(handle, 10)).rejects.toThrow('evidence_file_too_large'); }
    finally { await handle.close(); }
  });

  it('accepts the exact byte limit and rejects an already oversized capture', async () => {
    const { path } = await fixture('12345');
    expect((await readBoundedEvidenceFile(path, 5)).toString()).toBe('12345');
    await expect(readBoundedEvidenceFile(path, 4)).rejects.toThrow('evidence_file_too_large');
    expect(() => readBoundedEvidenceFileSync(path, 4)).toThrow('evidence_file_too_large');
  });

  it('rejects symbolic links, hard links and directory inputs', async () => {
    const { directory, path } = await fixture(); const alias = join(directory, 'alias.txt');
    await symlink(path, alias);
    await expect(readBoundedEvidenceFile(alias, 100)).rejects.toThrow();
    expect(() => readBoundedEvidenceFileSync(alias, 100)).toThrow();
    await rm(alias); await link(path, alias);
    await expect(readBoundedEvidenceFile(path, 100)).rejects.toThrow('regular_single_link_evidence_required');
    await expect(readBoundedEvidenceFile(directory, 100)).rejects.toThrow('regular_single_link_evidence_required');
  });

  it('rejects a FIFO without waiting for a writer', async () => {
    const { directory } = await fixture(); const fifo = join(directory, 'capture.pipe');
    const result = spawnSync('mkfifo', [fifo]); expect(result.status).toBe(0);
    await expect(readBoundedEvidenceFile(fifo, 100)).rejects.toThrow('regular_single_link_evidence_required');
  });
});

describe('preview bootstrap exclusive initialization', () => {
  it('refuses an existing empty database instead of racing an initializer', async () => {
    const { directory } = await fixture();
    const { realpath } = await import('node:fs/promises');
    const canonical = await realpath(directory), parent = join(canonical, 'output/engine-channels/hosted-preview');
    await mkdir(parent, { recursive: true, mode: 0o700 });
    const database = join(parent, 'preview.db'); await writeFile(database, '');
    const catalog = join(canonical, 'catalog.json');
    await writeFile(catalog, JSON.stringify({ schema: 'pw-preview-public-catalog-1',
      companies: [{ id: 'fixture-company', name: 'Fixture', slug: 'fixture', logo: null, industry: 'Testing', website: 'https://example.com' }],
      policies: [{ id: 'fixture-policy', companyId: 'fixture-company', name: 'Policy', type: 'terms', url: 'https://example.com/terms', jurisdiction: 'Global',
        currentText: '', currentHash: '', sourceMigrationPending: false, lastCheckDate: '2026-01-01', lastSuccessfulCheckDate: '2026-01-01' }],
    }));
    const result = spawnSync(process.execPath, [resolve('node_modules/tsx/dist/cli.mjs'), resolve('scripts/engine-preview-bootstrap.ts'),
      '--catalog', catalog, '--database', database], { cwd: canonical, encoding: 'utf8', timeout: 10_000 });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('preview_database_initialization_in_progress');
    expect((await readFile(database)).length).toBe(0);
  });
});
