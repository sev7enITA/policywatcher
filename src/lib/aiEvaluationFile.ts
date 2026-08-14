import { realpath, stat } from 'fs/promises';
import { isAbsolute, relative, resolve } from 'path';

export async function resolveEvaluationInput(rootDirectory: string, requestedPath: string): Promise<string> {
  const candidate = resolve(requestedPath);
  const [realRoot, realCandidate] = await Promise.all([
    realpath(resolve(rootDirectory)),
    realpath(candidate),
  ]);
  const containment = relative(realRoot, realCandidate);
  if (containment.startsWith('..') || isAbsolute(containment)) {
    throw new Error('Golden-set input must be contained by the repository evaluation directory.');
  }
  if (!realCandidate.toLowerCase().endsWith('.json') || !(await stat(realCandidate)).isFile()) {
    throw new Error('Golden-set input must be a JSON file.');
  }
  return candidate;
}
