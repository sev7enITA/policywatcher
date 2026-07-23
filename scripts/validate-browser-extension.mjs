#!/usr/bin/env node

import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const extensionDir = join(root, 'browser-extension');
const manifest = JSON.parse(readFileSync(join(extensionDir, 'manifest.json'), 'utf8'));
const appPackage = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const prerelease = appPackage.version.match(/^(\d+\.\d+\.\d+)-beta\.(\d+)$/);
const extensionPrerelease = manifest.version_name?.match(/^(\d+\.\d+\.\d+) Beta (\d+)$/);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(name) {
  return readFileSync(join(extensionDir, name), 'utf8');
}

function sameMembers(actual, expected) {
  return Array.isArray(actual)
    && actual.length === expected.length
    && [...actual].sort().every((value, index) => value === [...expected].sort()[index]);
}

const runtimeFiles = [
  'manifest.json',
  'popup.html',
  'popup.css',
  'popup.js',
  'service-worker.js',
  '_locales/en/messages.json',
  '_locales/it/messages.json',
  'icons/icon-16.png',
  'icons/icon-32.png',
  'icons/icon-48.png',
  'icons/icon-128.png',
];

for (const file of runtimeFiles) {
  assert(statSync(join(extensionDir, file)).isFile(), `Missing runtime file: ${file}`);
}

assert(manifest.manifest_version === 3, 'The extension must use Manifest V3');
assert(prerelease, 'PolicyWatcher extension packages require a numbered beta prerelease');
assert(extensionPrerelease, 'Beta extension version_name must identify its numbered beta');
const [, baseVersion, appBetaNumber] = prerelease;
const [, extensionBaseVersion, extensionBetaNumber] = extensionPrerelease;
assert(extensionBaseVersion === baseVersion, 'Extension and application base versions must match');
assert(
  manifest.version === `${extensionBaseVersion}.${extensionBetaNumber}`,
  'Extension numeric version must match its displayed beta version'
);
assert(
  Number(extensionBetaNumber) <= Number(appBetaNumber),
  'Extension beta cannot be newer than the application beta'
);
assert(sameMembers(manifest.permissions, ['activeTab', 'scripting']), 'Permissions must be exactly activeTab and scripting');
assert(sameMembers(manifest.host_permissions, ['https://www.policywatcher.online/*']), 'Host permission must be limited to policywatcher.online');
assert(manifest.background?.service_worker === 'service-worker.js', 'Manifest must register the packaged service worker');
assert(manifest.action?.default_popup === 'popup.html', 'Manifest must register the popup');
assert(manifest.content_security_policy?.extension_pages === "script-src 'self'; object-src 'self'; base-uri 'none'", 'Extension CSP is not the reviewed policy');

const scripts = ['popup.js', 'service-worker.js'].map((file) => ({ file, source: read(file) }));
for (const { file, source } of scripts) {
  assert(!/\b(?:eval|Function)\s*\(/.test(source), `${file} contains dynamic code execution`);
  assert(!/\.innerHTML\s*=|insertAdjacentHTML|document\.write\s*\(/.test(source), `${file} contains unsafe HTML rendering`);
  assert(!/https?:\/\/(?!www\.policywatcher\.online)/.test(source), `${file} contains an unapproved network origin`);
}

const popup = read('popup.js');
const popupHtml = read('popup.html');
const worker = read('service-worker.js');
assert(!/\bfetch\s*\(/.test(popup), 'Popup must not perform network requests');
assert(/chrome\.scripting\.executeScript/.test(popup), 'Popup must use temporary active-tab script injection');
assert(/rawDiscarded:\s*true/.test(popup), 'Local scanner must explicitly report raw-content disposal');
assert(!/chrome\.storage|indexedDB|localforage/.test(popup), 'Popup must not persist notice content or inquiry history');
assert(/id="beta-info-button"/.test(popupHtml) && /class="beta-warning"/.test(popupHtml), 'Popup must expose persistent and first-use Beta notices');
assert(/Stai usando una versione BETA/.test(popup) && /You are using a BETA version/.test(popup), 'Popup Beta warning must be localized in Italian and English');
assert(/confidential, health, financial, employment or authentication communications/.test(popup), 'Popup Beta warning must include safe-testing boundaries');
assert(/const API_URL = 'https:\/\/www\.policywatcher\.online\/api\/policy-inquiries'/.test(worker), 'Service worker API destination is not pinned');
assert(/credentials:\s*'omit'/.test(worker), 'Service worker must omit credentials');
assert(/redirect:\s*'error'/.test(worker), 'Service worker must reject redirects');

const allowedKeys = [
  'companyName', 'senderDomain', 'sourceUrl', 'noticeDate', 'effectiveDate',
  'policyTypes', 'lang', 'honeypot',
];
for (const key of allowedKeys) assert(worker.includes(`'${key}'`), `Service worker allowlist is missing ${key}`);
for (const forbidden of ['rawText', 'messageBody', 'emailAddress', 'recipient', 'subject', 'fingerprint', 'attachment']) {
  assert(!worker.includes(`'${forbidden}'`), `Service worker references forbidden payload field ${forbidden}`);
}

for (const locale of ['en', 'it']) {
  const messages = JSON.parse(read(join('_locales', locale, 'messages.json')));
  assert(messages.extensionName?.message && messages.extensionDescription?.message && messages.actionTitle?.message, `Locale ${locale} is incomplete`);
  assert(/BETA$/.test(messages.extensionName.message), `Locale ${locale} name must identify the beta`);
  assert(/^BETA:/.test(messages.extensionDescription.message), `Locale ${locale} description must identify the beta`);
  assert(/BETA/.test(messages.actionTitle.message), `Locale ${locale} action title must identify the beta`);
}

console.log(`Browser extension ${manifest.version} validation passed (${runtimeFiles.length} runtime files).`);
