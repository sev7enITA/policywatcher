import { mkdtemp, mkdir, rm, symlink, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { resolveEvaluationInput } from '../aiEvaluationFile';

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe('resolveEvaluationInput', () => {
  it('accepts JSON files contained by the frozen evaluation directory', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'policywatcher-eval-'));
    temporaryDirectories.push(directory);
    const root = join(directory, 'evals');
    const candidate = join(root, 'golden.json');
    await mkdir(root);
    await writeFile(candidate, '{}');

    await expect(resolveEvaluationInput(root, candidate)).resolves.toBe(candidate);
  });

  it('rejects traversal and symlink escapes before reading evaluation content', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'policywatcher-eval-'));
    temporaryDirectories.push(directory);
    const root = join(directory, 'evals');
    const outside = join(directory, 'outside.json');
    const linked = join(root, 'linked.json');
    await mkdir(root);
    await writeFile(outside, '{"secret":true}');
    await symlink(outside, linked);

    await expect(resolveEvaluationInput(root, outside)).rejects.toThrow(/contained/i);
    await expect(resolveEvaluationInput(root, linked)).rejects.toThrow(/contained/i);
  });
});
