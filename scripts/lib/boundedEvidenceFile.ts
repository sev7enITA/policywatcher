/** Read a regular evidence file through one descriptor; pathname replacement cannot redirect the read. */
import { constants, closeSync, fstatSync, openSync, readSync } from 'node:fs';
import { open, type FileHandle } from 'node:fs/promises';

const flags = constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK;
function assertFile(stat: { isFile(): boolean; nlink: number; size: number }, maximumBytes: number) {
  if (!Number.isSafeInteger(maximumBytes) || maximumBytes < 1 || !stat.isFile() || stat.nlink !== 1) throw new Error('regular_single_link_evidence_required');
  if (stat.size > maximumBytes) throw new Error('evidence_file_too_large');
}

export async function readBoundedEvidenceHandle(handle: FileHandle, maximumBytes: number): Promise<Buffer> {
  assertFile(await handle.stat(), maximumBytes);
  // Read at most budget + 1 even if the same inode grows after fstat.
  const bytes = Buffer.alloc(maximumBytes + 1);
  let offset = 0;
  while (offset < bytes.length) {
    const result = await handle.read(bytes, offset, bytes.length - offset, offset);
    if (!result.bytesRead) break;
    offset += result.bytesRead;
  }
  if (offset > maximumBytes) throw new Error('evidence_file_too_large');
  return bytes.subarray(0, offset);
}

export async function readBoundedEvidenceFile(file: string, maximumBytes: number): Promise<Buffer> {
  const handle = await open(file, flags);
  try { return await readBoundedEvidenceHandle(handle, maximumBytes); }
  finally { await handle.close(); }
}

export function readBoundedEvidenceFileSync(file: string, maximumBytes: number): Buffer {
  const descriptor = openSync(file, flags);
  try {
    assertFile(fstatSync(descriptor), maximumBytes);
    const bytes = Buffer.alloc(maximumBytes + 1);
    let offset = 0;
    while (offset < bytes.length) {
      const read = readSync(descriptor, bytes, offset, bytes.length - offset, offset);
      if (!read) break;
      offset += read;
    }
    if (offset > maximumBytes) throw new Error('evidence_file_too_large');
    return bytes.subarray(0, offset);
  } finally { closeSync(descriptor); }
}
