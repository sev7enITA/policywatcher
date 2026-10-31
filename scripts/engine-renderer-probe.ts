/** Bounded renderer-only follow-up for at most four blocked catalogue sources. No policy writes, AI or notifications. */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';

async function main() {
  const [corpusPath, outputPath, privateConfigPath] = process.argv.slice(2);
  if (!privateConfigPath || !resolve(privateConfigPath).startsWith(resolve('output') + '/') || !resolve(privateConfigPath).includes('/private/')) throw new Error('private_renderer_config_required');
  const renderer = JSON.parse(await readFile(privateConfigPath, 'utf8'));
  if (typeof renderer.RENDERER_URL !== 'string' || typeof renderer.RENDERER_SECRET !== 'string' || !renderer.RENDERER_SECRET) throw new Error('renderer_not_configured');
  process.env.RENDERER_URL = renderer.RENDERER_URL; process.env.RENDERER_SECRET = renderer.RENDERER_SECRET;
  if (!corpusPath || !outputPath || process.env.POLICYWATCHER_ENGINE_PUBLICATION === '1'
      || process.env.POLICYWATCHER_ENGINE_NOTIFICATIONS === '1') throw new Error('probe_arguments_or_boundary_invalid');
  const out = resolve(outputPath);
  if (!out.startsWith(resolve('output') + '/') || !process.env.DATABASE_URL?.startsWith('file:' + resolve('output') + '/')) {
    throw new Error('isolated_output_database_required');
  }
  const corpus = JSON.parse(await readFile(corpusPath, 'utf8')) as { id: string; url: string; expectedLanguage: string; format: string }[];
  if (!Array.isArray(corpus) || corpus.length < 1 || corpus.length > 4
      || corpus.some(s => !/^[a-z0-9-]{3,80}$/.test(s.id) || !['en', 'it'].includes(s.expectedLanguage)
        || !['html', 'pdf'].includes(s.format) || new URL(s.url).protocol !== 'https:')
      || new Set(corpus.map(s => s.id)).size !== corpus.length) throw new Error('invalid_probe_corpus');
  await mkdir(out, { recursive: false });
  const { acquireEngineTransport, hasLiveHostDrift, hasLivePathDrift } = await import('../src/lib/scraper');
  const { extractEngineBody } = await import('../src/lib/engine/acquisition');
  const { db } = await import('../src/lib/db');
  const hash = (body: string) => createHash('sha256').update(body).digest('hex');
  const rows: Record<string, unknown>[] = [];
  try {
    for (const source of corpus) {
      const attempts: Record<string, unknown>[] = [];
      const started = Date.now();
      for (const kind of ['rendered'] as const) {
        const attemptStart = Date.now();
        try {
          const result = await acquireEngineTransport(source.url, kind);
          const bodyFile = `${source.id}-${kind}.body.txt`;
          if (result.html) await writeFile(join(out, bodyFile), result.html, { flag: 'wx' });
          const drift = hasLiveHostDrift(source.url, result.finalUrl, kind) || hasLivePathDrift(source.url, result.finalUrl, kind);
          const attempt: Record<string, unknown> = { kind, observedAt: new Date().toISOString(), status: result.status,
            ok: result.ok, finalUrl: result.finalUrl, drift, durationMs: Date.now() - attemptStart,
            bodyBytes: Buffer.byteLength(result.html), bodyHash: hash(result.html), bodyFile: result.html ? bodyFile : null,
            transportError: result.error, validators: result.validators || {}, retryAfterMs: result.retryAfterMs };
          if (result.ok) {
            try {
              const extracted = extractEngineBody(result.html, source.url, result.validators?.contentLanguage);
              const extractedFile = `${source.id}-${kind}.extraction.json`;
              await writeFile(join(out, extractedFile), JSON.stringify(extracted, null, 2), { flag: 'wx' });
              Object.assign(attempt, { extraction: 'completed', extractedFile, textLength: extracted.document.text.length,
                textHash: extracted.document.hash, language: extracted.language || null, blockCount: extracted.document.blocks.length,
                headingCount: extracted.document.blocks.filter(b => b.kind === 'heading').length,
                languageMatches: extracted.language?.toLowerCase().split(/[-_]/)[0] === source.expectedLanguage });
            } catch (error) { attempt.extraction = 'rejected'; attempt.extractionError = error instanceof Error ? error.message : 'unknown'; }
          }
          attempts.push(attempt);
          if (result.status === 429 || result.status === 503 || (attempt.extraction === 'completed' && !drift)) break;
        } catch (error) {
          attempts.push({ kind, observedAt: new Date().toISOString(), durationMs: Date.now() - attemptStart,
            transportError: error instanceof Error ? error.message : 'unknown' });
        }
        await new Promise(done => setTimeout(done, 1500));
      }
      const row = { ...source, durationMs: Date.now() - started, assessment: 'transport_and_extraction_only_contract_not_yet_reviewed', attempts };
      rows.push(row);
      await writeFile(join(out, 'results.json'), JSON.stringify({ generatedAt: new Date().toISOString(),
        boundary: 'isolated local output; configured remote renderer; no policy writes, models, archives or notifications', sourceCount: corpus.length, completed: rows.length, rows }, null, 2));
      console.log(JSON.stringify({ id: source.id, attempts: attempts.map(a => ({ kind: a.kind, status: a.status, extraction: a.extraction,
        error: a.extractionError || a.transportError, chars: a.textLength, drift: a.drift, language: a.language })) }));
      await new Promise(done => setTimeout(done, 1500));
    }
  } finally { await db.$disconnect(); }
}
void main().catch(error => { console.error(error instanceof Error ? error.message : 'probe_failed'); process.exitCode = 1; });
