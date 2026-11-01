/** Full configured catalogue, isolated acquisition/extraction only. No source approvals. */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

async function main() {
  const [cataloguePath, directory] = process.argv.slice(2);
  const out = resolve(directory || '');
  if (!cataloguePath || !out.startsWith(resolve('output') + '/') || process.env.DATABASE_URL !== `file:${join(out, 'isolated.db')}`
    || process.env.POLICYWATCHER_ENGINE_PUBLICATION !== '0' || process.env.POLICYWATCHER_ENGINE_NOTIFICATIONS !== '0') throw new Error('isolated_probe_required');
  const catalogueText = await readFile(cataloguePath, 'utf8');
  const catalogue = JSON.parse(catalogueText) as { rows: Array<{ id: string; retrievalUrl: string; url: string }> };
  if (!Array.isArray(catalogue.rows) || !catalogue.rows.length || catalogue.rows.length > 500 || new Set(catalogue.rows.map(r => r.id)).size !== catalogue.rows.length) throw new Error('invalid_catalogue');
  const endpoints = new Map<string, Set<string>>();
  for (const row of catalogue.rows) {
    const source = row.retrievalUrl || row.url, u = new URL(source);
    if (u.protocol !== 'https:' || u.username || u.password) throw new Error('invalid_source');
    u.hash = ''; const endpoint = u.href;
    const scopes = endpoints.get(endpoint) || new Set<string>(); scopes.add(source); endpoints.set(endpoint, scopes);
  }
  await mkdir(out, { recursive: false });
  const { acquireEngineTransport, hasLiveHostDrift, hasLivePathDrift } = await import('../src/lib/scraper');
  const { extractEngineBody } = await import('../src/lib/engine/acquisition');
  const { db } = await import('../src/lib/db');
  const hash = (body: string) => createHash('sha256').update(body).digest('hex');
  const startedAt = new Date(), deadline = Date.now() + 30 * 60_000;
  const groups = new Map<string, Array<[string, Set<string>]>>();
  for (const item of endpoints) { const origin = new URL(item[0]).origin; const group = groups.get(origin) || []; group.push(item); groups.set(origin, group); }
  const queue = [...groups], rows: Array<Record<string, unknown>> = [];
  const durations: number[] = []; let attemptsTotal = 0, successfulEndpoints = 0, extractedScopes = 0;
  try {
    const worker = async () => {
      let group: typeof queue[number] | undefined;
      while ((group = queue.shift())) {
        let originHeld = false;
        for (const [url, scopes] of group[1]) {
          const id = hash(url).slice(0, 24), start = Date.now(), attempts: Array<Record<string, unknown>> = [];
          const scopeResults: Array<Record<string, unknown>> = [];
          let body: string | null = null, contentLanguage: string | undefined;
          if (!originHeld && Date.now() < deadline) {
            for (const kind of ['direct', 'http2'] as const) {
              const began = Date.now(); attemptsTotal++;
              try {
                const result = await acquireEngineTransport(url, kind);
                const file = `${id}-${kind}.body.txt`;
                if (result.html) await writeFile(join(out, file), result.html, { flag: 'wx' });
                const drift = hasLiveHostDrift(url, result.finalUrl, kind) || hasLivePathDrift(url, result.finalUrl, kind);
                attempts.push({ kind, observedAt: new Date().toISOString(), status: result.status, ok: result.ok, finalUrl: result.finalUrl,
                  drift, durationMs: Date.now() - began, validators: result.validators, retryAfterMs: result.retryAfterMs,
                  bodyBytes: Buffer.byteLength(result.html), bodyHash: hash(result.html), bodyFile: result.html ? file : null, error: result.error });
                if (result.status === 429 || result.status === 503) { originHeld = true; break; }
                if (result.ok && result.status === 200 && !drift) { body = result.html; contentLanguage = result.validators?.contentLanguage; successfulEndpoints++; break; }
              } catch (error) { attempts.push({ kind, observedAt: new Date().toISOString(), durationMs: Date.now() - began, error: error instanceof Error ? error.message : 'transport_failed' }); }
              await new Promise(done => setTimeout(done, 1500));
            }
          }
          for (const source of scopes) {
            if (body === null) { scopeResults.push({ source, state: 'unavailable', reason: originHeld ? 'origin_backoff' : Date.now() >= deadline ? 'deadline' : 'transport_rejected' }); continue; }
            try {
              const extraction = extractEngineBody(body, source, contentLanguage);
              const file = `${hash(source).slice(0, 24)}.extraction.json`;
              await writeFile(join(out, file), JSON.stringify(extraction, null, 2), { flag: 'wx' });
              scopeResults.push({ source, state: 'held', extraction: 'completed', file, textHash: extraction.document.hash,
                textLength: extraction.document.text.length, blocks: extraction.document.blocks.length, language: extraction.language,
                reason: 'independent_completeness_and_source_contract_unreviewed' }); extractedScopes++;
            } catch (error) { scopeResults.push({ source, state: 'held', extraction: 'rejected', reason: error instanceof Error ? error.message : 'extraction_failed' }); }
          }
          const row = { id, url, durationMs: Date.now() - start, attempts, scopes: scopeResults };
          durations.push(row.durationMs); rows.push(row);
          await writeFile(join(out, `${id}.receipt.json`), JSON.stringify(row, null, 2), { flag: 'wx' });
          console.log(JSON.stringify({ completed: rows.length, total: endpoints.size, url, statuses: attempts.map(a => a.status || a.error), scopes: scopeResults.map(s => s.extraction || s.reason) }));
          await new Promise(done => setTimeout(done, 1500));
        }
      }
    };
    await Promise.all(Array.from({ length: 3 }, worker));
    durations.sort((a, b) => a - b);
    const report = { startedAt, completedAt: new Date(), durationMs: Date.now() - startedAt.getTime(),
      sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), catalogueHash: hash(catalogueText),
      boundary: 'Configured real catalogue from local Mac; 3 workers, one request per origin at a time, 1.5s pacing, origin held after 429/503. No models, renderer, contracts, production DB or delivery. Not 500-source or VPS qualification.',
      configuredPolicies: catalogue.rows.length, retrievalScopes: new Set(catalogue.rows.map(r => r.retrievalUrl || r.url)).size,
      httpEndpoints: endpoints.size, origins: groups.size, completedEndpoints: rows.length, attempts: attemptsTotal,
      successfulEndpoints, extractedScopes, sourceCompletenessQualified: false, productionQualified: false,
      endpointDurationMs: { p50: durations[Math.floor(durations.length * .5)], p95: durations[Math.min(durations.length - 1, Math.floor(durations.length * .95))] }, rows };
    await writeFile(join(out, 'report.json'), JSON.stringify(report, null, 2), { flag: 'wx' });
  } finally { await db.$disconnect(); }
}
void main().catch(error => { console.error(error instanceof Error ? error.message : 'probe_failed'); process.exitCode = 1; });
