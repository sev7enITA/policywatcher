#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.resolve(import.meta.dirname, '..');
const SOURCE_PATH = path.join(ROOT, 'data', 'releases', 'release-evidence-ledger.v1.json');
const BACKGROUND_PATH = path.join(ROOT, 'public', 'press-kit', 'policywatcher-release-evidence-pulse-background-2026-08-15.png');
const OUTPUT_DIR = path.join(ROOT, 'public', 'press-kit');
const MEDIA_DIR = path.join(ROOT, 'docs', 'media', 'policywatcher-release-evidence-pulse');
const ledger = JSON.parse(readFileSync(SOURCE_PATH, 'utf8'));
if (!existsSync(BACKGROUND_PATH)) throw new Error(`Missing disclosed editorial background: ${path.relative(ROOT, BACKGROUND_PATH)}`);

mkdirSync(OUTPUT_DIR, { recursive: true });
mkdirSync(MEDIA_DIR, { recursive: true });

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

const copy = {
  en: {
    eyebrow: 'POLICYWATCHER / RELEASE EVIDENCE PULSE',
    title: 'Two weeks of releases. One evidence trail.',
    lead: 'What changed, what each release unlocked and what remains unproven.',
    releases: 'release clusters', days: 'inclusive days', waves: 'coordinated waves',
    impact: 'Implementation impact', boundary: 'Boundary',
    footer: 'Implementation inventory and observed evaluation evidence only. Not adoption, legal compliance, continuous availability or user outcomes.',
    source: 'Canonical source: policywatcher.online/api/v1/release-evidence',
  },
  it: {
    eyebrow: 'POLICYWATCHER / RELEASE EVIDENCE PULSE',
    window: 'FINESTRA DI EVIDENZA DI 14 GIORNI',
    title: 'Due settimane di release. Un\'unica traccia di evidenza.',
    lead: 'Cosa è cambiato, cosa ha abilitato ogni release e cosa resta non provato.',
    releases: 'cluster release', days: 'giorni inclusivi', waves: 'wave coordinate',
    impact: 'Impatto implementativo', boundary: 'Limite',
    footer: 'Solo inventario implementativo ed evidenze di valutazione osservate. Non adozione, conformità legale, disponibilità continua o risultati utente.',
    source: 'Fonte canonica: policywatcher.online/api/v1/release-evidence',
  },
};

const backgroundRelativeUrl = '../../../public/press-kit/policywatcher-release-evidence-pulse-background-2026-08-15.png';

function renderHtml(locale) {
  const t = copy[locale];
  const cards = ledger.releases.map((release, index) => {
    const metrics = release.metrics.map((metric) => `<li><strong>${escapeHtml(metric.value)}</strong><span>${escapeHtml(metric.label[locale])}</span></li>`).join('');
    return `<article class="release-card" data-wave="${escapeHtml(release.wave)}">
      <header><span class="index">0${index + 1}</span><div><time>${escapeHtml(release.date)}</time><b>${escapeHtml(release.displayVersion)}</b></div></header>
      <h2>${escapeHtml(release.title[locale])}</h2>
      <p class="impact"><span>${t.impact}</span>${escapeHtml(release.impact[locale])}</p>
      <ul>${metrics}</ul>
      <p class="boundary"><span>${t.boundary}</span>${escapeHtml(release.boundary[locale])}</p>
    </article>`;
  }).join('');

  return `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(t.title)}</title><style>
    *{box-sizing:border-box}html,body{margin:0;width:1200px;min-height:1500px;background:#f7f8f6;color:#111827;font-family:Arial,Helvetica,sans-serif}body{position:relative;overflow:hidden}.background{position:absolute;inset:0;background:url('${backgroundRelativeUrl}') center/cover no-repeat;opacity:.33;filter:saturate(.9);z-index:0}.page{position:relative;z-index:1;width:1200px;min-height:1500px;padding:74px 72px 48px;display:flex;flex-direction:column}.topline{display:flex;justify-content:space-between;align-items:center;padding-bottom:18px;border-bottom:2px solid #111827;font:700 17px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em}.topline span:last-child{color:#526276;letter-spacing:.04em}.hero{display:grid;grid-template-columns:1fr 330px;gap:44px;padding:42px 0 34px}.eyebrow{margin:0 0 16px;color:#146c6a;font:800 16px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.13em}.hero h1{max-width:720px;margin:0;font:800 64px/.94 Arial,Helvetica,sans-serif;letter-spacing:-.055em}.lead{max-width:700px;margin:20px 0 0;color:#48576a;font-size:23px;line-height:1.35}.summary{display:grid;grid-template-columns:repeat(3,1fr);align-self:end;border:1px solid #aebcb8;background:rgba(255,255,255,.86)}.summary div{padding:18px 14px;border-right:1px solid #aebcb8}.summary div:last-child{border-right:0}.summary strong{display:block;color:#146c6a;font:800 35px/1 Arial,Helvetica,sans-serif}.summary span{display:block;margin-top:8px;color:#526276;font:700 11px/1.25 ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase;letter-spacing:.06em}.cards{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;flex:1}.release-card{position:relative;display:flex;flex-direction:column;min-height:300px;padding:18px 20px 16px;border:1px solid #b6c1bd;background:rgba(255,255,255,.93);box-shadow:0 8px 22px rgba(17,24,39,.045)}.release-card:before{content:"";position:absolute;inset:0 auto 0 0;width:5px;background:#146c6a}.release-card[data-wave="distribution"]:before,.release-card[data-wave="experience"]:before{background:#3f55a6}.release-card[data-wave="assurance"]:before{background:#b45309}.release-card header{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}.release-card .index{color:#83908d;font:800 13px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.08em}.release-card header div{text-align:right}.release-card time,.release-card header b{display:block;font:700 12px/1.25 ui-monospace,SFMono-Regular,Menlo,monospace}.release-card time{color:#66736f}.release-card header b{margin-top:3px;color:#146c6a}.release-card h2{margin:14px 0 10px;max-width:90%;font-size:24px;line-height:1.04;letter-spacing:-.025em}.release-card p{margin:0;color:#344255;font-size:13px;line-height:1.36}.release-card p>span{display:block;margin-bottom:4px;color:#526276;font:800 9px/1.1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.09em;text-transform:uppercase}.release-card ul{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:13px 0;padding:0;list-style:none}.release-card li{min-height:55px;padding:7px;border:1px solid #d3dad7;background:#f7f9f7}.release-card li strong{display:block;color:#111827;font-size:20px;line-height:1}.release-card li span{display:block;margin-top:4px;color:#5b6877;font-size:9px;line-height:1.15;text-transform:uppercase}.release-card .boundary{margin-top:auto;padding-top:10px;border-top:1px solid #d8b98e;color:#6b4a20;font-size:10.5px;line-height:1.32}.release-card .boundary>span{color:#a05e06}.footer{display:grid;grid-template-columns:1fr auto;gap:32px;align-items:end;margin-top:24px;padding-top:18px;border-top:2px solid #111827}.footer p{max-width:760px;margin:0;color:#536171;font-size:13px;line-height:1.4}.footer code{font:700 10px/1.3 ui-monospace,SFMono-Regular,Menlo,monospace;color:#146c6a}.hash{overflow-wrap:anywhere}.brand{font-size:18px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;text-align:right}.brand small{display:block;margin-top:6px;color:#697573;font:600 10px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:0;text-transform:none}
    .footer code{display:block;margin-top:5px}
  </style></head><body><div class="background" aria-hidden="true"></div><main class="page">
    <div class="topline"><span>${escapeHtml(t.eyebrow)}</span><span>${escapeHtml(ledger.window.start)} / ${escapeHtml(ledger.window.end)}</span></div>
    <section class="hero"><div><p class="eyebrow">${escapeHtml(t.window ?? '14-DAY EVIDENCE WINDOW')}</p><h1>${escapeHtml(t.title)}</h1><p class="lead">${escapeHtml(t.lead)}</p></div><div class="summary"><div><strong>${ledger.releases.length}</strong><span>${escapeHtml(t.releases)}</span></div><div><strong>${ledger.window.inclusiveDays}</strong><span>${escapeHtml(t.days)}</span></div><div><strong>3</strong><span>${escapeHtml(t.waves)}</span></div></div></section>
    <section class="cards">${cards}</section>
    <footer class="footer"><div><p>${escapeHtml(t.footer)}</p><code>${escapeHtml(t.source)}</code><code class="hash">sha256:${escapeHtml(ledger.integrity.digest)}</code></div><div class="brand">PolicyWatcher<small>Evidence first / v${escapeHtml(ledger.currentRelease)}</small></div></footer>
  </main></body></html>`;
}

function run(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`${command} failed: ${result.stderr || result.stdout}`);
}

const browser = await chromium.launch({ headless: true });
try {
  for (const locale of ['en', 'it']) {
    const htmlPath = path.join(MEDIA_DIR, `index.${locale}.html`);
    const pngPath = path.join(OUTPUT_DIR, `policywatcher-release-evidence-pulse-${locale}-2026-08-15.png`);
    const webpPath = path.join(OUTPUT_DIR, `policywatcher-release-evidence-pulse-${locale}-2026-08-15.webp`);
    writeFileSync(htmlPath, renderHtml(locale));
    const context = await browser.newContext({ viewport: { width: 1200, height: 1500 }, deviceScaleFactor: 2, colorScheme: 'light', reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'load' });
    await page.screenshot({ path: pngPath, fullPage: true, animations: 'disabled' });
    await context.close();
    run('cwebp', ['-quiet', '-q', '90', '-m', '6', pngPath, '-o', webpPath]);
  }
} finally {
  await browser.close();
}

process.stdout.write(`Generated bilingual release evidence infographic assets from ${path.relative(ROOT, SOURCE_PATH)}.\n`);
