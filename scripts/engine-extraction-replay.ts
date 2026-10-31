/** Offline inclusion audit of bounded saved captures. Never a completeness oracle. */
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { load } from 'cheerio';
import type { AnyNode } from 'domhandler';
import { digest } from '../src/lib/engine/document';

async function main() {
  const [input, output] = process.argv.slice(2).map(p => resolve(p));
  const boundary = resolve('output') + '/';
  if (!input?.startsWith(boundary) || !output?.startsWith(boundary) || input === output
      || !process.env.DATABASE_URL?.startsWith('file:' + boundary)
      || process.env.POLICYWATCHER_ENGINE_PUBLICATION === '1' || process.env.POLICYWATCHER_ENGINE_NOTIFICATIONS === '1') throw new Error('isolated_replay_required');
  type Attempt = { extraction?: string; bodyFile?: string; bodyHash?: string; observedAt: string; status?: number };
  const captures = JSON.parse(await readFile(join(input, 'results.json'), 'utf8')) as { rows: Array<{ id: string; url: string; attempts: Attempt[] }> };
  if (!Array.isArray(captures.rows) || captures.rows.length < 1 || captures.rows.length > 30) throw new Error('replay_budget_exceeded');
  await mkdir(output, { recursive: false });
  const { extractEngineBody } = await import('../src/lib/engine/acquisition');
  const { engineExtractionProfileHash } = await import('../src/lib/engine/store');
  const { db } = await import('../src/lib/db');
  const normalize = (s: string) => s.normalize('NFKC').replace(/\s+/g, ' ').trim();
  const rows = [];
  try {
    for (const row of captures.rows) {
      if (!/^[a-z0-9-]{3,80}$/.test(row.id) || new URL(row.url).protocol !== 'https:') throw new Error('invalid_replay_source');
      const attempt = row.attempts.find(a => a.extraction === 'completed');
      if (!attempt) { rows.push({ id: row.id, result: 'no_successful_capture' }); continue; }
      if (!attempt.bodyFile || !/^[a-z0-9-]+\.body\.txt$/.test(attempt.bodyFile)) throw new Error('invalid_capture_path');
      const file = join(input, attempt.bodyFile);
      if ((await stat(file)).size > 5_000_000) throw new Error('replay_payload_too_large');
      const html = await readFile(file, 'utf8');
      if (digest(html) !== attempt.bodyHash) throw new Error('capture_integrity_failed');
      // No source contract is inferred or approved by this diagnostic.
      const body = extractEngineBody(html, row.url);
      const text = normalize(body.document.text), $ = load(html);
      const roots = $('main,article,[role="main"]').filter((_, node) => !$(node).parents('main,article,[role="main"]').length);
      const root = roots.length ? roots.first() : $('body');
      const seen = new Set<string>(); let checkedTextNodes = 0;
      const missing: Array<{ chars: number; sha256: string; tag?: string }> = [];
      function visit(node: AnyNode) {
        if (node.type === 'text') {
          const value = normalize(node.data);
          if (value.length < 12 || seen.has(value)) return;
          seen.add(value);
          const parent = $(node).parent();
          if (parent.closest('script,style,noscript,svg,nav,header,footer,[role="dialog"],button,form').length) return;
          checkedTextNodes++;
          if (!text.includes(value)) missing.push({ chars: value.length, sha256: digest(value), tag: parent[0]?.name });
        } else if ('children' in node) for (const child of node.children) visit(child);
      }
      root.each((_, node) => { visit(node); });
      await writeFile(join(output, `${row.id}.extraction.json`), JSON.stringify(body, null, 2));
      rows.push({ id: row.id, url: row.url, observedAt: attempt.observedAt, bodyHash: attempt.bodyHash,
        profileHash: engineExtractionProfileHash(row.url), textHash: body.document.hash, textChars: body.document.text.length,
        extraction: body.extraction, heuristicAudit: { explicitRoots: roots.length, checkedTextNodes, missingCount: missing.length, missing } });
    }
    const report = { generatedAt: new Date().toISOString(),
      boundary: 'Offline replay, no new observation. Deduplicated normalized text-node inclusion (>=12 characters) in first main/article/role-main, otherwise body; excludes known UI. Ignores occurrence counts and short/missing source text. Zero misses is not complete policy validation. No provider contract or public baseline changed.', rows };
    await writeFile(join(output, 'report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ sources: rows.length, output }));
  } finally { await db.$disconnect(); }
}
void main().catch(error => { console.error(error instanceof Error ? error.message : 'replay_failed'); process.exitCode = 1; });
