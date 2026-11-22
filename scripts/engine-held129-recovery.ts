/** Selective rendered follow-up of a fresh129-scope static wave; never refetches direct/HTTP2. */
import { readFile, writeFile, mkdir, appendFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { sha, deriveHeld129, bodyReceiptMatches, scopeReasons, renderDecision, type PriorEndpoint, assertFreshStaticWindow, verifyImplementationFiles, activeChallenge } from './lib/held129';
const baselineFiles = ['catalogue', 'followup-report', 'case-results', 'context'];
const expectedHashes = ['f5ce32a4d3772be90eaa0eaee2c9481124a1403b3b94408afc5f6c325f045e81', '4fb0a00029283f7ac7660c5cf77761a2e10f3c9c40696da448e2249d18e0e353', '58dbc54a104def16b9d4acb24ee58285c90e3e260449f2771fa444b8d16b4823', '54c987a55f494af04baef95c40d898d2f15070553363db7f2ca77e5f5c202de4'];
const harnessFiles = ['scripts/engine-held129-recovery.ts', 'scripts/lib/held129.ts'];
const boundary = 'Fresh129-scope static wave plus separate serial rendered follow-up. Earlier4 extractions remain held for completeness. No direct/HTTP2 refetch, model inference, contract approval, baseline, policy writes, publication, notification or500/day qualification.';
const freshWrite = (file: string, value: unknown) => writeFile(file, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
function option(name: string) { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : undefined; }
async function fingerprints() { return Object.fromEntries(await Promise.all(harnessFiles.map(async file => [file, sha(await readFile(file))]))); }
async function rendererConfig() {
  const file = resolve(option('--renderer-config') || '');
  if (!file.includes('/output/') || !file.includes('/private/')) throw Error('explicit_private_renderer_config_required');
  const config = JSON.parse(await readFile(file, 'utf8')); const url = new URL(config.RENDERER_URL);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || typeof config.RENDERER_SECRET !== 'string' || config.RENDERER_SECRET.length < 32) throw Error('renderer_config_invalid');
  return { url: url.href.replace(/\/$/, ''), origin: url.origin, secret: config.RENDERER_SECRET as string };
}
async function staticInputs() {
  const folder = resolve(option('--static') || '');
  if (!folder.includes('/output/')) throw Error('isolated_static_wave_required');
  const bytes = await readFile(join(folder, 'report.json')); const report = JSON.parse(bytes.toString());
  const catalogueBytes = await readFile(option('--catalogue') || ''); const catalogue = JSON.parse(catalogueBytes.toString());
  if (report.catalogueHash !== sha(catalogueBytes) || report.configuredPolicies !== 129 || report.retrievalScopes !== 129 || report.completedEndpoints !== 129 || report.rows.length !== 129 || !Number.isFinite(Date.parse(report.startedAt)) || !Number.isFinite(Date.parse(report.completedAt))) throw Error('fresh_static_report_not_complete_or_bound');
  assertFreshStaticWindow(report.startedAt, report.completedAt);
  const sources = report.rows.flatMap((r: PriorEndpoint) => r.scopes.map(s => s.source));
  if (sources.length !== 129 || new Set(sources).size !== 129 || new Set(report.rows.map((r: PriorEndpoint) => r.url)).size !== 129) throw Error('static_scope_or_endpoint_duplicates');
  return { folder, bytes, report, catalogueBytes, catalogue };
}
export async function prepare(out: string) {
  const base = resolve('docs/reports/engine-v6-remote133-2026-11-21');
  const texts = await Promise.all(baselineFiles.map(name => readFile(join(base, name + '.json'), 'utf8')));
  if (texts.some((text, i) => sha(text) !== expectedHashes[i])) throw Error('frozen_baseline_hash_mismatch');
  const [catalogue, oldReport, cases] = texts.map(text => JSON.parse(text)); const derived = deriveHeld129(catalogue.rows, oldReport.rows, cases);
  const input = await staticInputs(); const renderer = await rendererConfig();
  if (new Set(input.catalogue.rows.map((r: { retrievalUrl: string }) => r.retrievalUrl)).size !== 129 || input.catalogue.rows.some((r: { retrievalUrl: string }) => !derived.rows.some(d => d.retrievalUrl === r.retrievalUrl))) throw Error('static129_not_original_residual_set');
  const { detectBlockPage, detectSoft404, hasLiveHostDrift, hasLivePathDrift } = await import('../src/lib/scraper');
  const selections = [], bodyAudit = []; const originHeld = new Set<string>();
  for (const endpoint of input.report.rows as PriorEndpoint[]) if (endpoint.attempts.some(a => a.status === 429 || a.status === 503)) originHeld.add(new URL(endpoint.url).origin);
  for (const source of derived.rows) {
    const matches = (input.report.rows as PriorEndpoint[]).filter(e => e.scopes.some(s => s.source === source.retrievalUrl));
    if (matches.length !== 1) throw Error('fresh_static_scope_denominator_mismatch');
    const endpoint = matches[0]; const scope = endpoint.scopes.find(s => s.source === source.retrievalUrl)!;
    const row: Record<string, unknown> = { id: sha(source.retrievalUrl).slice(0, 24), catalogueId: source.id, source: source.retrievalUrl, category: source.category, priorReason: source.priorReason, languageExpectation: 'unknown', selected: false, reason: 'no_verified_current_body' };
    if (scope.extraction === 'completed') row.reason = 'fresh_static_extraction_already_observed';
    else if (originHeld.has(new URL(source.retrievalUrl).origin)) row.reason = 'fresh_origin_backoff';
    else if (endpoint.attempts.some(a => [401, 403, 404, 410, 451].includes(a.status || 0))) row.reason = 'fresh_http_denial_no_browser_bypass';
    else {
      const attempt = [...endpoint.attempts].reverse().find(a => a.bodyFile);
      if (attempt?.bodyFile && /^[a-f0-9]{24}-(?:direct|http2|rendered)\.body\.txt$/.test(attempt.bodyFile)) {
        try {
          const bytes = await readFile(join(input.folder, attempt.bodyFile));
          const verified = bodyReceiptMatches(bytes, attempt, input.report.startedAt, input.report.completedAt);
          bodyAudit.push({ source: source.retrievalUrl, bodyFile: attempt.bodyFile, expectedHash: attempt.bodyHash, actualHash: sha(bytes), observedAt: attempt.observedAt, verified });
          if (verified) {
            const html = bytes.toString(); const result = attempt as typeof attempt & { finalUrl?: string; ok?: boolean };
            const finalUrl = result.finalUrl || endpoint.url;
            const sourceScope = scopeReasons(source.retrievalUrl, finalUrl, html);
            const decision = renderDecision({ status: attempt.status || 0, html, source: source.retrievalUrl,
              blocked: activeChallenge(html) || detectBlockPage(html), soft404: detectSoft404(html), extractionCompleted: false,
              drift: hasLiveHostDrift(source.retrievalUrl, finalUrl, 'direct') || hasLivePathDrift(source.retrievalUrl, finalUrl, 'direct') || sourceScope.some(r => ['path_identity_unreviewed', 'source_selector_drift'].includes(r)) });
            Object.assign(row, { selected: decision.eligible, reason: decision.reason, staticScopeReasons: sourceScope, staticBodyFile: attempt.bodyFile, staticBodyHash: attempt.bodyHash, staticObservedAt: attempt.observedAt });
          } else row.reason = 'fresh_body_hash_or_window_mismatch';
        } catch { row.reason = 'fresh_body_missing_or_unreadable'; }
      }
    }
    selections.push(row);
  }
  let admitted = 0; for (const row of selections) if (row.selected && ++admitted > 32) { row.selected = false; row.reason = 'render_budget'; }
  const implementation = await verifyImplementationFiles();
  const sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  const plan = { schema: 'pw-held129-render-followup-1', preparedAt: new Date().toISOString(), sourceCommit, implementation, harnessHashes: await fingerprints(), baselineHashes: expectedHashes,
    staticReportHash: sha(input.bytes), staticSourceCommit: input.report.sourceCommit, staticCatalogueHash: sha(input.catalogueBytes), rendererOrigin: renderer.origin, rendererEndpoint: renderer.url,
    excluded: derived.excluded, denominator: 129, origins: 69, maxRendered: 32, renderConcurrency: 1, pacingMs: 1500, maximumRunMs: 45 * 60_000, boundary, selections };
  await mkdir(out, { recursive: false }); await freshWrite(join(out, 'plan.json'), plan);
  await writeFile(join(out, 'plan.sha256'), sha(await readFile(join(out, 'plan.json'))) + '\n', { flag: 'wx' });
  await freshWrite(join(out, 'static-body-audit.json'), { boundary: 'Only bodies bound to this fresh static report are considered; old16/21November DOM never supplies rendering signals.', rows: bodyAudit });
  console.log(JSON.stringify({ prepared: true, denominator: 129, selected: selections.filter(s => s.selected).length, planHash: sha(JSON.stringify(plan)), rendererConcurrent: 1, models: 0, publication: 0 }));
}
export async function run(out: string) {
  if (process.env.DATABASE_URL !== `file:${join(out, 'isolated.db')}` || process.env.POLICYWATCHER_ENGINE_PUBLICATION !== '0' || process.env.POLICYWATCHER_ENGINE_NOTIFICATIONS !== '0' || process.env.POLICYWATCHER_QA_LIVE_CONFIRMED !== '1') throw Error('explicit_live_isolated_boundary_required');
  const planBytes = await readFile(join(out, 'plan.json'));
  if (sha(planBytes) !== (await readFile(join(out, 'plan.sha256'), 'utf8')).trim()) throw Error('selection_manifest_changed');
  const plan = JSON.parse(planBytes.toString()); const input = await staticInputs(); const renderer = await rendererConfig();
  const implementation = await verifyImplementationFiles();
  const sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  if (plan.schema !== 'pw-held129-render-followup-1' || plan.denominator !== 129 || plan.selections.length !== 129 || plan.sourceCommit !== sourceCommit || plan.implementation !== implementation || plan.staticReportHash !== sha(input.bytes) || plan.staticCatalogueHash !== sha(input.catalogueBytes) || plan.rendererOrigin !== renderer.origin || plan.rendererEndpoint !== renderer.url || JSON.stringify(plan.harnessHashes) !== JSON.stringify(await fingerprints())) throw Error('frozen_context_changed_new_cohort_required');
  for (const row of plan.selections) if (row.selected && sha(await readFile(join(input.folder, row.staticBodyFile))) !== row.staticBodyHash) throw Error('selected_static_body_changed');
  process.env.RENDERER_URL = renderer.url; process.env.RENDERER_SECRET = renderer.secret;
  for (const key of ['GEMINI_API_KEY', 'GOOGLE_API_KEY', 'OPENROUTER_API_KEY', 'OPENAI_API_KEY']) delete process.env[key];
  await freshWrite(join(out, 'started.json'), { at: new Date().toISOString(), sourceCommit, planHash: sha(JSON.stringify(plan)), boundary });
  const { acquireEngineTransport, hasLiveHostDrift, hasLivePathDrift, detectBlockPage, detectSoft404 } = await import('../src/lib/scraper');
  const { extractEngineBody } = await import('../src/lib/engine/acquisition'); const { db } = await import('../src/lib/db');
  const rows: Array<Record<string, unknown>> = []; const started = Date.now(); let attempts = 0, serviceHeld = false;
  const originsHeld = new Set<string>(), rendererDenied = new Set<string>();
  try {
    for (const selection of plan.selections) {
      const origin = new URL(selection.source).origin;
      const row: Record<string, unknown> = { ...selection, state: 'held', fullyQualified: false, renderAttempted: false };
      if (selection.selected && !serviceHeld && !originsHeld.has(origin) && !rendererDenied.has(origin) && attempts < plan.maxRendered && Date.now() - started < plan.maximumRunMs) {
        const began = Date.now(); row.startedAt = new Date().toISOString(); row.renderAttempted = true; attempts++;
        try {
          const result = await acquireEngineTransport(selection.source, 'rendered');
          const bodyFile = result.html ? `${selection.id}-rendered.body.txt` : null;
          if (Buffer.byteLength(result.html) > 6_000_000) throw Error('rendered_body_limit');
          if (bodyFile) { await writeFile(join(out, bodyFile), result.html, { flag: 'wx' }); if (sha(await readFile(join(out, bodyFile))) !== sha(result.html)) throw Error('rendered_body_hash_verification_failed'); }
          const drift = hasLiveHostDrift(selection.source, result.finalUrl, 'rendered') || hasLivePathDrift(selection.source, result.finalUrl, 'rendered');
          const blocked = result.html ? activeChallenge(result.html) || detectBlockPage(result.html) : null, soft404 = result.html ? detectSoft404(result.html) : false;
          Object.assign(row, { observedAt: new Date().toISOString(), status: result.status, ok: result.ok, finalUrl: result.finalUrl, bodyFile, bodyBytes: Buffer.byteLength(result.html), bodyHash: sha(result.html), bodyHashVerified: Boolean(bodyFile), bodyRepresentation: 'rendered_DOM_not_original_HTTP_or_PDF', validators: result.validators || {}, drift, blockReason: blocked, soft404, error: (result.error || '').replaceAll(renderer.secret, '[REDACTED]'), scopeReasons: result.html ? scopeReasons(selection.source, result.finalUrl, result.html) : [] });
          if ((result.status === 429 || result.status === 503) && result.error) { serviceHeld = true; row.reason = 'renderer_service_backoff'; }
          else if (result.status === 429 || result.status === 503) { originsHeld.add(origin); row.reason = 'origin_backoff'; }
          else if (result.error === 'domain_not_allowed') { rendererDenied.add(origin); row.reason = 'renderer_domain_not_configured'; }
          else if (!result.ok || result.status !== 200 || drift || blocked || soft404) row.reason = 'rendered_transport_identity_or_content_hold';
          else {
            try {
              const body = extractEngineBody(result.html, selection.source, result.validators?.contentLanguage);
              const file = `${selection.id}-rendered.extraction.json`; await freshWrite(join(out, file), body);
              Object.assign(row, { extraction: 'completed', extractionFile: file, textHash: body.document.hash, textLength: body.document.text.length, blocks: body.document.blocks.length, observedLanguage: body.language || null, languageExpectation: 'unknown', extractionIssues: body.extraction?.issues || [], reason: 'extraction_observed_identity_language_completeness_unqualified' });
            } catch (error) { row.extraction = 'rejected'; row.reason = error instanceof Error ? error.message : 'extraction_failed'; }
          }
        } catch (error) { row.reason = (error instanceof Error ? error.message : 'render_failed').replaceAll(renderer.secret, '[REDACTED]'); }
        row.durationMs = Date.now() - began; row.completedAt = new Date().toISOString();
        await freshWrite(join(out, `${selection.id}-rendered.receipt.json`), row);
        await new Promise(done => setTimeout(done, plan.pacingMs));
      } else if (selection.selected) row.reason = serviceHeld ? 'not_attempted_renderer_service_backoff' : originsHeld.has(origin) ? 'not_attempted_origin_backoff' : rendererDenied.has(origin) ? 'not_attempted_renderer_domain_not_configured' : 'not_attempted_budget_or_deadline';
      rows.push(row); await freshWrite(join(out, `${selection.id}.receipt.json`), row);
      await appendFile(join(out, 'events.ndjson'), JSON.stringify({ at: new Date().toISOString(), completed: rows.length, denominator: 129, attempted: attempts, reason: row.reason }) + '\n');
      console.log(JSON.stringify({ completed: rows.length, denominator: 129, attempted: attempts, extracted: rows.filter(r => r.extraction === 'completed').length, reason: row.reason }));
    }
    await freshWrite(join(out, 'report.json'), { startedAt: new Date(started).toISOString(), completedAt: new Date().toISOString(), durationMs: Date.now() - started, sourceCommit, implementation, staticSourceCommit: plan.staticSourceCommit, staticReportHash: plan.staticReportHash, boundary, denominator: 129, origins: 69, completed: rows.length, selected: plan.selections.filter((s: { selected: boolean }) => s.selected).length, renderedAttempts: attempts, extractionObservedScopes: rows.filter(r => r.extraction === 'completed').length, fullyQualifiedScopes: 0, sourceCompletenessQualified: false, productionQualified: false, rows });
  } finally { await db.$disconnect(); }
}
export async function main() {
  const out = resolve(option('--out') || '');
  if (!out.startsWith(resolve('output') + '/')) throw Error('isolated_output_required');
  if (process.argv.includes('--prepare')) await prepare(out);
  else if (process.argv.includes('--run')) await run(out);
  else throw Error('prepare_or_run_required');
}
if (import.meta.url === pathToFileURL(resolve(process.argv[1] || '')).href) void main().catch(error => { console.error(error instanceof Error ? error.message : 'campaign_failed'); process.exitCode = 1; });
