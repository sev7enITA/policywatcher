#!/usr/bin/env node

import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const extensionPath = join(repositoryRoot, 'browser-extension');
const releaseVersion = JSON.parse(readFileSync(join(repositoryRoot, 'package.json'), 'utf8')).version;
const profilePath = mkdtempSync(join(tmpdir(), 'policywatcher-extension-profile-'));
const evidencePath = process.env.POLICYWATCHER_EVIDENCE_DIR
  ? resolve(process.env.POLICYWATCHER_EVIDENCE_DIR)
  : mkdtempSync(join(tmpdir(), 'policywatcher-extension-evidence-'));
const startedAt = new Date();
let context;

function assertRuntimeSources() {
  for (const file of ['manifest.json', 'popup.html', 'popup.js', 'service-worker.js']) {
    assert.ok(existsSync(join(extensionPath, file)), `Missing extension runtime source: ${file}`);
  }
}

try {
  assertRuntimeSources();
  mkdirSync(evidencePath, { recursive: true });
  context = await chromium.launchPersistentContext(profilePath, {
    channel: 'chromium',
    headless: true,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  });

  const serviceWorker = context.serviceWorkers()[0]
    || await context.waitForEvent('serviceworker', { timeout: 15_000 });
  const extensionId = new URL(serviceWorker.url()).hostname;
  assert.match(extensionId, /^[a-p]{32}$/, 'Chromium did not assign a valid extension ID');

  const page = await context.newPage();
  await page.setViewportSize({ width: 390, height: 650 });
  await page.goto(`chrome-extension://${extensionId}/popup.html`, { waitUntil: 'domcontentloaded' });

  await page.locator('#disclosure-view').waitFor({ state: 'visible' });
  await page.getByText('BETA', { exact: true }).first().waitFor({ state: 'visible' });
  await page.locator('#continue-button').click();
  await page.locator('#capture-view').waitFor({ state: 'visible' });
  await page.locator('#manual-button').click();
  await page.locator('#review-view').waitFor({ state: 'visible' });
  await page.locator('#manual-confirmation').waitFor({ state: 'visible' });
  await page.waitForFunction(() => getComputedStyle(document.querySelector('#review-view')).opacity === '1');

  const screenshotPath = join(evidencePath, 'extension-popup-smoke.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  const evidence = {
    product: 'PolicyWatcher Browser Extension',
    channel: 'beta',
    releaseVersion,
    manifestVersion: await page.evaluate(() => chrome.runtime.getManifest().manifest_version),
    extensionVersion: await page.evaluate(() => chrome.runtime.getManifest().version),
    extensionId,
    browserVersion: await context.browser()?.version(),
    checks: {
      serviceWorkerLoaded: true,
      disclosureRendered: true,
      betaLabelVisible: true,
      captureFlowOpened: true,
      manualReviewOpened: true,
      privacyBoundaryVisible: true,
    },
    startedAt: startedAt.toISOString(),
    completedAt: new Date().toISOString(),
    screenshot: screenshotPath,
  };
  writeFileSync(join(evidencePath, 'extension-popup-smoke.json'), `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify(evidence, null, 2));
} finally {
  await context?.close();
  rmSync(profilePath, { recursive: true, force: true });
}
