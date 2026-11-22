/** Private quarantine for untrusted research evidence. These bytes must never be executed or served. */
import { constants } from 'node:fs';
import { lstat, open, realpath } from 'node:fs/promises';
import { basename, relative, resolve, sep } from 'node:path';
import { createHash } from 'node:crypto';
const MAX_EVIDENCE_BYTES = 12_000_000;
const names = /^(?:plan\.json|plan\.sha256|static-body-audit\.json|started\.json|report\.json|events\.ndjson|[a-f0-9]{24}(?:-rendered)?\.(?:body\.txt|receipt\.json|extraction\.json))$/;
const digest = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

async function evidencePath(directoryPath: string, name: string) {
  const output = resolve('output'), parent = resolve(directoryPath);
  const path = relative(output, parent);
  if (!path || path.startsWith('..' + sep) || path === '..' || resolve(output, path) !== parent || basename(name) !== name || !names.test(name)) throw Error('quarantine_path_or_filename_invalid');
  const target = resolve(parent, name);
  // Refuse symlinked campaign directories as well as symlinked leaf files.
  const components = relative(output, parent).split(sep).filter(Boolean);
  let directory = output;
  for (const component of ['', ...components]) {
    if (component) directory = resolve(directory, component);
    const stat = await lstat(directory);
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw Error('quarantine_directory_not_regular');
  }
  if (await realpath(parent) !== parent) throw Error('quarantine_directory_alias');
  const stat = await lstat(parent);
  if ((stat.mode & 0o077) !== 0) throw Error('quarantine_directory_not_private');
  return target;
}

export async function writeQuarantinedEvidence(directory: string, name: string, content: string | Buffer) {
  const target = await evidencePath(directory, name);
  const bytes = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf8');
  if (bytes.byteLength > MAX_EVIDENCE_BYTES) throw Error('quarantine_evidence_size_limit');
  // A descriptor pins the newly-created inode. O_EXCL + O_NOFOLLOW prevents replacement/leaf links.
  const handle = await open(target, constants.O_RDWR | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600);
  try {
    const stat = await handle.stat();
    if (!stat.isFile() || stat.nlink !== 1 || (stat.mode & 0o077) !== 0) throw Error('quarantine_inode_invalid');
    await handle.writeFile(bytes);
    await handle.sync();
    const copy = Buffer.alloc(bytes.length);
    let position = 0;
    while (position < copy.length) {
      const result = await handle.read(copy, position, copy.length - position, position);
      if (!result.bytesRead) throw Error('quarantine_short_read');
      position += result.bytesRead;
    }
    if (digest(copy) !== digest(bytes)) throw Error('quarantine_roundtrip_hash_mismatch');
    return { bytes: bytes.length, sha256: digest(bytes), trust: 'untrusted_quarantined_evidence' as const };
  } finally { await handle.close(); }
}

export async function appendQuarantinedEvent(directory: string, name: string, line: string) {
  if (name !== 'events.ndjson' || Buffer.byteLength(line) > 64_000) throw Error('quarantine_event_invalid');
  const target = await evidencePath(directory, name);
  const handle = await open(target, constants.O_WRONLY | constants.O_CREAT | constants.O_APPEND | constants.O_NOFOLLOW, 0o600);
  try {
    const stat = await handle.stat();
    if (!stat.isFile() || stat.nlink !== 1 || (stat.mode & 0o077) !== 0 || stat.size + Buffer.byteLength(line) > 1_000_000) throw Error('quarantine_event_file_invalid');
    await handle.writeFile(line);
    await handle.sync();
  } finally { await handle.close(); }
}
