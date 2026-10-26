import { mkdir, readFile, realpath, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { canonicalJson } from './evidence';

/** Never silently replace a receipt, snapshot or lesson. */
export async function writeImmutableJson(path: string, value: unknown): Promise<void> {
  const body = `${canonicalJson(value)}\n`;
  try { await writeFile(path, body, { flag: 'wx', mode: 0o600 }); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
    if (await readFile(path, 'utf8') !== body) throw new Error('immutable_artifact_conflict');
  }
}

export async function privateCaptureDirectory(directory: string, checkout: string): Promise<string> {
  const target = resolve(directory);
  const realCheckout = await realpath(checkout);
  const assertOutside = (path: string) => {
    const within = relative(realCheckout, path);
    if (!(within === '..' || within.startsWith(`..${sep}`) || isAbsolute(within))) {
      throw new Error('raw_capture_directory_must_be_outside_checkout');
    }
  };
  // Resolve the closest existing ancestor before creating anything. This also
  // catches an external-looking path whose parent is a symlink into checkout.
  let ancestor = target;
  while (true) {
    try {
      const actualAncestor = await realpath(ancestor);
      assertOutside(resolve(actualAncestor, relative(ancestor, target)));
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      const parent = dirname(ancestor);
      if (parent === ancestor) throw error;
      ancestor = parent;
    }
  }
  await mkdir(target, { recursive: true, mode: 0o700 });
  const realTarget = await realpath(target);
  assertOutside(realTarget);
  return realTarget;
}
