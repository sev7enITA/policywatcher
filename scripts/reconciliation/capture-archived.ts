// Reconstruct a new static DOM observation from retained HTTP bodies. No publisher requests.
import fs from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { chromium } from 'playwright';
import { extractEngineBody } from '../../src/lib/engine/acquisition';
import { capturePassages, digest } from './passages.mjs';

async function main() {
  const [sourceLog, directory, output] = process.argv.slice(2);
  const rows = fs.readFileSync(sourceLog, 'utf8').trim().split('\n').map(line => JSON.parse(line));
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE || undefined });
  const context = await browser.newContext({ javaScriptEnabled: false, serviceWorkers: 'block', offline: true });
  const sources = [];
  const unavailable = [];
  try {
    for (const row of rows) {
      const bytes = fs.readFileSync(path.join(directory, row.id + '.body'));
      if (digest(bytes) !== row.decodedBodySha) throw Error('Capture hash mismatch ' + row.id);
      if (!row.textSha) {
        unavailable.push({ id: row.id, url: row.url, status: row.status, payloadSha256: row.decodedBodySha });
        continue;
      }
      const extraction = extractEngineBody(bytes.toString('utf8'), row.url).document.text;
      if (digest(extraction) !== row.textSha) throw Error('Extraction changed ' + row.id);
      const page = await context.newPage();
      await page.setContent(bytes.toString('utf8'), { waitUntil: 'domcontentloaded' });
      const reference = await page.evaluate(fragment => {
        const root = fragment ? document.getElementById(fragment) : document.querySelector('main, article, [role=main]');
        const passages = [];
        if (root) {
          const selector = 'p, li, td, th';
          for (const el of root.querySelectorAll<HTMLElement>(selector)) {
            if (!el.checkVisibility({ visibilityProperty: true, opacityProperty: true }) || el.querySelector(selector)) continue;
            const text = el.innerText.trim();
            if (text.length < 35) continue;
            const parts = [];
            for (let node: Element | null = el; node; node = node.parentElement) {
              const index = node.parentElement ? Array.from(node.parentElement.children).indexOf(node) + 1 : 1;
              parts.unshift(node.tagName.toLowerCase() + ':nth-child(' + index + ')');
            }
            passages.push({ locator: parts.join(' > '), text });
          }
        }
        return { root: root?.tagName ?? null, passages };
      }, decodeURIComponent(new URL(row.url).hash.slice(1)));
      sources.push({ id: row.id, url: row.url, capturedAt: row.at, payloadSha256: row.decodedBodySha,
        extractionSha256: row.textSha, root: reference.root, bundle: capturePassages(extraction, reference.passages) });
      await page.close();
    }
    fs.writeFileSync(output, gzipSync(JSON.stringify({ browser: browser.version(), mode: 'archived HTML, scripts and network disabled', sources, unavailable })), { flag: 'wx' });
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
