/**
 * Diff format parsing utilities.
 *
 * PolicyChange.diff is stored in (currently) THREE different shapes depending
 * on which writer created the row. This module normalizes them all into a
 * single JsonChunk[] for rendering.
 *
 * Detected formats:
 *   1. JSON array  [{ value, added?, removed? }]   (written by /api/scrape)
 *   2. Unified git patch  (--- / +++ / @@ headers)  (written by cron createPatch)
 *   3. "Simple +/-"  (lines starting with + or -, no headers)
 *      (produced by the seed/mock generator — the current majority in the DB)
 *
 * Exported so both the DiffViewer component AND tests/scripts can use them.
 */

export interface JsonChunk {
  value: string;
  added?: boolean;
  removed?: boolean;
}

/**
 * Returns the chunk array if `diff` is a JSON-array-of-chunks string,
 * otherwise null. Never throws.
 */
export function tryParseJsonChunks(diff: string): JsonChunk[] | null {
  const trimmed = diff.trim();
  if (!trimmed.startsWith('[')) return null;
  try {
    const parsed = JSON.parse(trimmed);
    if (!Array.isArray(parsed)) return null;
    if (parsed.length > 0 && typeof parsed[0]?.value !== 'string') return null;
    return parsed as JsonChunk[];
  } catch {
    return null;
  }
}

/**
 * Parse a unified-diff patch string (cron format) into chunks.
 * Skips file headers (--- / +++) and hunk markers (@@ ... @@).
 */
export function parseUnifiedPatch(diff: string): JsonChunk[] {
  const lines = diff.split('\n');
  const chunks: JsonChunk[] = [];

  for (const line of lines) {
    if (
      line.startsWith('---') ||
      line.startsWith('+++') ||
      line.startsWith('Index:') ||
      line.startsWith('===================================================================')
    ) {
      continue;
    }
    if (line.startsWith('@@')) {
      chunks.push({ value: '\n' });
      continue;
    }
    if (line.startsWith('+')) {
      chunks.push({ value: line.substring(1) + '\n', added: true });
    } else if (line.startsWith('-')) {
      chunks.push({ value: line.substring(1) + '\n', removed: true });
    } else if (line.startsWith(' ')) {
      chunks.push({ value: line.substring(1) });
    } else {
      chunks.push({ value: line });
    }
  }
  return chunks;
}

/**
 * Main entry point: detect the format and return normalized chunks.
 * Handles all three known formats.
 */
export function parseDiff(diff: string): JsonChunk[] {
  if (!diff || !diff.trim()) return [];

  // Format 1: JSON array of chunks
  const jsonChunks = tryParseJsonChunks(diff);
  if (jsonChunks) return jsonChunks;

  // Format 2 & 3: line-based (unified patch OR simple +/-)
  // parseUnifiedPatch already handles both because it only looks at the
  // first character of each line.
  return parseUnifiedPatch(diff);
}
