#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import React from 'react';
import { Document, Page, StyleSheet, Text, View, renderToFile } from '@react-pdf/renderer';

const ROOT = path.resolve(import.meta.dirname, '..');
const PRESS_DIR = path.join(ROOT, 'public', 'press-kit');
const releaseSource = readFileSync(path.join(ROOT, 'src', 'lib', 'release.ts'), 'utf8');
const RELEASE_DATE = releaseSource.match(/POLICYWATCHER_RELEASE_DATE = '([^']+)'/)?.[1];
if (!RELEASE_DATE) throw new Error('Unable to read POLICYWATCHER_RELEASE_DATE from src/lib/release.ts');
const RELEASE_NAME = releaseSource.match(/POLICYWATCHER_RELEASE_NAME = '([^']+)'/)?.[1];
if (!RELEASE_NAME) throw new Error('Unable to read POLICYWATCHER_RELEASE_NAME from src/lib/release.ts');
const VERSION = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version;
const CANONICAL_URL = 'https://policywatcher.online/press-kit';
const REPOSITORY_URL = 'https://github.com/sev7enITA/policywatcher';
const GITHUB_PRESS_DISTRIBUTION_REVISION = 'd02b90489dd58d7884dbf14dcb1d52ad12a5ed07';
const GITHUB_PRESS_DOWNLOAD_BASE_URL = `${REPOSITORY_URL}/raw/${GITHUB_PRESS_DISTRIBUTION_REVISION}/public/press-kit`;
const RIGHTS_URL = `${CANONICAL_URL}/LICENSE-ASSETS.md`;
const CREDIT = 'PolicyWatcher / Fabrizio Degni';
const CAMPAIGN_VERSION = '3.9.0-beta.27';
const CAMPAIGN_RELEASE_NAME = 'Admin Operational Readiness';
const CAMPAIGN_DATE = '2026-08-01';

const CAMPAIGN_DOCUMENTS = [
  ['docs/press-release-3.9.0-beta.27-en.md', 'policywatcher-beta27-press-release-en.md', 'text/markdown'],
  ['docs/press-release-3.9.0-beta.27-it.md', 'policywatcher-beta27-press-release-it.md', 'text/markdown'],
  ...['en', 'it', 'fr', 'de', 'es', 'pt-br'].map((locale) => [`docs/press-campaign-beta27/pitch-${locale}.md`, `policywatcher-beta27-pitch-${locale}.md`, 'text/markdown']),
  ...[
    'eu-uk-en', 'north-america-en', 'italy-it', 'france-fr', 'dach-de', 'iberia-latam-es',
    'brazil-pt-br', 'apac-en', 'africa-mena-en',
  ].map((region) => [`docs/press-campaign-beta27/regional-one-page-${region}.md`, `policywatcher-beta27-regional-brief-${region}.md`, 'text/markdown']),
  ['docs/press-campaign-beta27/hard-questions-faq-en.md', 'policywatcher-beta27-hard-questions-faq-en.md', 'text/markdown'],
  ['docs/press-campaign-beta27/hard-questions-faq-it.md', 'policywatcher-beta27-hard-questions-faq-it.md', 'text/markdown'],
  ['docs/press-campaign-beta27/spokesperson-sheet-en.md', 'policywatcher-beta27-spokesperson-sheet-en.md', 'text/markdown'],
  ['docs/press-campaign-beta27/spokesperson-sheet-it.md', 'policywatcher-beta27-spokesperson-sheet-it.md', 'text/markdown'],
  ['docs/press-campaign-beta27/claims-freeze-beta27.json', 'policywatcher-beta27-claims-freeze.json', 'application/json'],
  ['docs/press-campaign-beta27/claims-freeze-beta27.md', 'policywatcher-beta27-claims-freeze.md', 'text/markdown'],
  ['docs/press-campaign-beta27/claims-freeze-beta27.sha256', 'policywatcher-beta27-claims-freeze.sha256', 'text/plain'],
  ['docs/press-campaign-beta27/campaign-registry-beta27.json', 'policywatcher-beta27-campaign-registry.json', 'application/json'],
  ['docs/press-campaign-beta27/demo-video-transcript-en.md', 'policywatcher-beta27-demo-transcript-en.md', 'text/markdown'],
  ['docs/press-campaign-beta27/demo-video-narration-en.txt', 'policywatcher-beta27-demo-narration-en.txt', 'text/plain'],
  ['docs/press-campaign-beta27/demo-video-en.srt', 'policywatcher-beta27-demo-en.srt', 'application/x-subrip'],
  ['docs/press-campaign-beta27/demo-video-it.srt', 'policywatcher-beta27-demo-it.srt', 'application/x-subrip'],
  ['docs/press-campaign-beta27/screenshot-register-beta27.md', 'policywatcher-beta27-screenshot-register.md', 'text/markdown'],
  ['docs/press-campaign-beta27/translation-review-register.md', 'policywatcher-beta27-translation-review-register.md', 'text/markdown'],
];

mkdirSync(PRESS_DIR, { recursive: true });

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', ...options });
  if (result.status !== 0) throw new Error(`${command} failed: ${result.stderr || result.stdout}`);
}

function sha256(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

function xml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
}

function buildXmp(meta) {
  const assetDate = meta.date || RELEASE_DATE;
  return `<?xpacket begin="\uFEFF" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="PolicyWatcher press asset generator">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about=""
   xmlns:dc="http://purl.org/dc/elements/1.1/"
   xmlns:xmp="http://ns.adobe.com/xap/1.0/"
   xmlns:xmpRights="http://ns.adobe.com/xap/1.0/rights/"
   xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/"
   xmlns:Iptc4xmpCore="http://iptc.org/std/Iptc4xmpCore/1.0/xmlns/">
   <dc:title><rdf:Alt><rdf:li xml:lang="x-default">${xml(meta.title.en)}</rdf:li><rdf:li xml:lang="en">${xml(meta.title.en)}</rdf:li><rdf:li xml:lang="it">${xml(meta.title.it)}</rdf:li></rdf:Alt></dc:title>
   <dc:description><rdf:Alt><rdf:li xml:lang="x-default">${xml(meta.description.en)}</rdf:li><rdf:li xml:lang="en">${xml(meta.description.en)}</rdf:li><rdf:li xml:lang="it">${xml(meta.description.it)}</rdf:li></rdf:Alt></dc:description>
   <dc:creator><rdf:Seq><rdf:li>${xml(meta.creator)}</rdf:li></rdf:Seq></dc:creator>
   <dc:rights><rdf:Alt><rdf:li xml:lang="x-default">Copyright ${xml(meta.creator)}. Editorial use subject to ${xml(RIGHTS_URL)}. Content Credentials are not attached.</rdf:li></rdf:Alt></dc:rights>
   <xmp:CreateDate>${assetDate}T12:00:00+02:00</xmp:CreateDate>
   <xmp:ModifyDate>${assetDate}T12:00:00+02:00</xmp:ModifyDate>
   <xmpRights:WebStatement>${xml(RIGHTS_URL)}</xmpRights:WebStatement>
   <xmpRights:UsageTerms><rdf:Alt><rdf:li xml:lang="en">${xml(meta.usage.en)}</rdf:li><rdf:li xml:lang="it">${xml(meta.usage.it)}</rdf:li></rdf:Alt></xmpRights:UsageTerms>
   <photoshop:Credit>${xml(meta.credit)}</photoshop:Credit>
   <Iptc4xmpCore:AltTextAccessibility><rdf:Alt><rdf:li xml:lang="en">${xml(meta.alt.en)}</rdf:li><rdf:li xml:lang="it">${xml(meta.alt.it)}</rdf:li></rdf:Alt></Iptc4xmpCore:AltTextAccessibility>
   <Iptc4xmpCore:ExtDescrAccessibility><rdf:Alt><rdf:li xml:lang="en">${xml(meta.description.en)}</rdf:li><rdf:li xml:lang="it">${xml(meta.description.it)}</rdf:li></rdf:Alt></Iptc4xmpCore:ExtDescrAccessibility>
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
}

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const output = Buffer.alloc(12 + data.length);
  output.writeUInt32BE(data.length, 0);
  typeBuffer.copy(output, 4);
  data.copy(output, 8);
  output.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 8 + data.length);
  return output;
}

function injectPngXmp(filePath, xmp) {
  const source = readFileSync(filePath);
  const signature = source.subarray(0, 8);
  const chunks = [];
  let offset = 8;
  while (offset < source.length) {
    const length = source.readUInt32BE(offset);
    const type = source.toString('ascii', offset + 4, offset + 8);
    const end = offset + 12 + length;
    const raw = source.subarray(offset, end);
    const data = source.subarray(offset + 8, offset + 8 + length);
    const isExistingXmp = type === 'iTXt' && data.toString('utf8', 0, Math.min(data.length, 64)).startsWith('XML:com.adobe.xmp\0');
    if (!isExistingXmp && type !== 'IEND') chunks.push(raw);
    if (type === 'IEND') break;
    offset = end;
  }
  const keyword = Buffer.from('XML:com.adobe.xmp', 'utf8');
  const data = Buffer.concat([keyword, Buffer.alloc(5), Buffer.from(xmp, 'utf8')]);
  writeFileSync(filePath, Buffer.concat([signature, ...chunks, pngChunk('iTXt', data), pngChunk('IEND', Buffer.alloc(0))]));
}

function injectJpegXmp(filePath, xmp) {
  const source = readFileSync(filePath);
  if (source[0] !== 0xff || source[1] !== 0xd8) throw new Error(`Not a JPEG: ${filePath}`);
  const header = Buffer.from('http://ns.adobe.com/xap/1.0/\0', 'ascii');
  const payload = Buffer.concat([header, Buffer.from(xmp, 'utf8')]);
  if (payload.length + 2 > 65535) throw new Error(`XMP packet too large for JPEG APP1: ${filePath}`);
  const app1 = Buffer.alloc(payload.length + 4);
  app1[0] = 0xff;
  app1[1] = 0xe1;
  app1.writeUInt16BE(payload.length + 2, 2);
  payload.copy(app1, 4);

  const kept = [source.subarray(0, 2)];
  let offset = 2;
  while (offset < source.length) {
    if (source[offset] !== 0xff) {
      kept.push(source.subarray(offset));
      break;
    }
    const marker = source[offset + 1];
    if (marker === 0xda || marker === 0xd9) {
      kept.push(source.subarray(offset));
      break;
    }
    const length = source.readUInt16BE(offset + 2);
    const end = offset + 2 + length;
    const segment = source.subarray(offset, end);
    const isExistingXmp = marker === 0xe1 && segment.subarray(4, 4 + header.length).equals(header);
    if (!isExistingXmp) kept.push(segment);
    offset = end;
  }
  writeFileSync(filePath, Buffer.concat([kept[0], app1, ...kept.slice(1)]));
}

const facts = [
  { id: 'monitored-companies', value: '16', unit: 'configured monitored companies', scope: 'Excludes the WAZE admin-onboarding fixture; not exhaustive market coverage.' },
  { id: 'configured-sectors', value: '6', unit: 'configured sectors', scope: 'Sector labels organize the monitored inventory.' },
  { id: 'canonical-kpis', value: '15', unit: 'canonical KPIs', scope: 'Privacy, AI governance and ethics; unavailable assessments are Not assessed.' },
  { id: 'editorial-languages', value: 'EN / IT', unit: 'editorial languages', scope: 'Press kit and selected guidance surfaces.' },
];

function wrapWords(value, maxCharacters = 48) {
  const lines = [];
  let line = '';
  for (const word of value.split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > maxCharacters && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

function writeDataSnapshot() {
  const jsonPath = path.join(PRESS_DIR, `policywatcher-configured-scope-${RELEASE_DATE}.json`);
  const csvPath = path.join(PRESS_DIR, `policywatcher-configured-scope-${RELEASE_DATE}.csv`);
  const svgPath = path.join(PRESS_DIR, `policywatcher-configured-scope-${RELEASE_DATE}.svg`);
  const pngPath = path.join(PRESS_DIR, `policywatcher-configured-scope-${RELEASE_DATE}.png`);
  writeFileSync(jsonPath, `${JSON.stringify({ schema: 'https://policywatcher.online/schemas/press-kit-data-snapshot/v1', snapshotId: `configured-scope-${RELEASE_DATE}`, asOf: RELEASE_DATE, generatedAt: RELEASE_DATE, canonicalUrl: `${CANONICAL_URL}/data`, facts, boundary: 'Configured product inventory and method; not exhaustive market coverage or measured compliance.' }, null, 2)}\n`);
  const csv = ['id,value,unit,scope,as_of', ...facts.map((fact) => [fact.id, fact.value, fact.unit, fact.scope, RELEASE_DATE].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))].join('\n');
  writeFileSync(csvPath, `${csv}\n`);
  const cards = facts.map((fact, index) => {
    const x = 80 + (index % 2) * 720;
    const y = 250 + Math.floor(index / 2) * 360;
    const scopeLines = wrapWords(fact.scope).map((line, lineIndex) => `<text x="42" y="${190 + lineIndex * 28}" font-family="Arial, sans-serif" font-size="20" fill="#50627a">${xml(line)}</text>`).join('');
    return `<g transform="translate(${x} ${y})"><rect width="640" height="280" rx="28" fill="#ffffff" stroke="#cad9dc"/><text x="42" y="94" font-family="Arial, sans-serif" font-size="64" font-weight="700" fill="#10223b">${xml(fact.value)}</text><text x="42" y="145" font-family="Arial, sans-serif" font-size="25" font-weight="700" fill="#146c6a">${xml(fact.unit.toUpperCase())}</text>${scopeLines}</g>`;
  }).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1520" height="1040" viewBox="0 0 1520 1040"><metadata>Snapshot configured-scope-${RELEASE_DATE}; PolicyWatcher; editorial use subject to ${RIGHTS_URL}; Content Credentials not attached.</metadata><rect width="1520" height="1040" fill="#f2efe8"/><text x="80" y="92" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#146c6a">POLICYWATCHER · CONFIGURED SCOPE</text><text x="80" y="165" font-family="Arial, sans-serif" font-size="52" font-weight="700" fill="#10223b">Product facts with stated boundaries</text><text x="80" y="205" font-family="Arial, sans-serif" font-size="22" fill="#50627a">Snapshot ${RELEASE_DATE} · Verify current status at ${CANONICAL_URL}</text>${cards}<text x="80" y="995" font-family="Arial, sans-serif" font-size="18" fill="#50627a">Configured inventory and method; not exhaustive coverage, legal advice or compliance certification.</text></svg>`;
  writeFileSync(svgPath, svg);
  run('magick', ['-font', '/System/Library/Fonts/Supplemental/Arial.ttf', svgPath, '-strip', '-define', 'png:exclude-chunks=date,time', pngPath]);
}

function generateWordmarks() {
  const mark = path.join(PRESS_DIR, 'policywatcher-logo-mark-512.png');
  const font = '/System/Library/Fonts/Supplemental/Arial Bold.ttf';
  run('magick', ['-size', '2400x600', 'xc:none', '(', mark, '-resize', '480x480', ')', '-geometry', '+60+60', '-composite', '-font', font, '-pointsize', '205', '-fill', '#10223b', '-gravity', 'west', '-annotate', '+620+0', 'POLICYWATCHER', '-strip', '-define', 'png:exclude-chunks=date,time', path.join(PRESS_DIR, 'policywatcher-wordmark-dark-2400x600.png')]);
  run('magick', ['-size', '2400x600', 'xc:#10223b', '(', mark, '-resize', '480x480', ')', '-geometry', '+60+60', '-composite', '-font', font, '-pointsize', '205', '-fill', '#ffffff', '-gravity', 'west', '-annotate', '+620+0', 'POLICYWATCHER', '-strip', '-define', 'png:exclude-chunks=date,time', path.join(PRESS_DIR, 'policywatcher-wordmark-light-on-navy-2400x600.png')]);
}

const mediaMetadata = {
  'policywatcher-logo-mark-512.png': { title: { en: 'PolicyWatcher logo mark', it: 'Marchio PolicyWatcher' }, description: { en: 'Owned square PolicyWatcher logo mark on a transparent background.', it: 'Marchio quadrato PolicyWatcher proprietario su sfondo trasparente.' }, alt: { en: 'PolicyWatcher shield and eye logo mark', it: 'Marchio PolicyWatcher con scudo e occhio' }, usage: { en: 'Use without changing proportions or implying endorsement.', it: 'Usare senza cambiare le proporzioni o implicare endorsement.' }, creator: 'Fabrizio Degni', credit: CREDIT },
  'policywatcher-logo-square-1024.jpg': { title: { en: 'PolicyWatcher square artwork', it: 'Artwork quadrato PolicyWatcher' }, description: { en: 'Owned high-resolution square PolicyWatcher artwork.', it: 'Artwork quadrato PolicyWatcher proprietario ad alta risoluzione.' }, alt: { en: 'Square PolicyWatcher brand artwork', it: 'Artwork quadrato del brand PolicyWatcher' }, usage: { en: 'Crop only with clear space around the central mark.', it: 'Ritagliare mantenendo spazio libero intorno al marchio centrale.' }, creator: 'Fabrizio Degni', credit: CREDIT },
  'fabrizio-degni-portrait-200.png': { title: { en: 'Fabrizio Degni portrait', it: 'Ritratto di Fabrizio Degni' }, description: { en: 'Owned 200 by 200 pixel founder portrait, suitable only for small digital placements.', it: 'Ritratto proprietario del fondatore da 200 per 200 pixel, adatto solo a piccoli usi digitali.' }, alt: { en: 'Portrait of Fabrizio Degni', it: 'Ritratto di Fabrizio Degni' }, usage: { en: 'Do not upscale for print.', it: 'Non ingrandire per la stampa.' }, creator: 'Fabrizio Degni', credit: 'Fabrizio Degni' },
  'fabrizio-degni-portrait-2400-source-upscale.png': { title: { en: 'Fabrizio Degni source-faithful press portrait', it: 'Ritratto stampa fedele alla fonte di Fabrizio Degni' }, description: { en: 'Owned 2400 by 2400 pixel Lanczos upscale of the 200-pixel source portrait. No facial detail was generated; source detail remains limited.', it: 'Upscale Lanczos proprietario 2400 per 2400 del ritratto sorgente da 200 pixel. Non sono stati generati dettagli del volto; il dettaglio sorgente resta limitato.' }, alt: { en: 'Black-and-white portrait of Fabrizio Degni', it: 'Ritratto in bianco e nero di Fabrizio Degni' }, usage: { en: 'Preferred source-faithful high-resolution placement; disclose that original detail is limited.', it: 'Versione ad alta risoluzione preferita e fedele alla fonte; dichiarare che il dettaglio originale e limitato.' }, creator: 'Fabrizio Degni', credit: 'Fabrizio Degni' },
  'fabrizio-degni-portrait-2400-ai-restored.png': { title: { en: 'Fabrizio Degni AI-restored portrait variant', it: 'Variante restaurata con AI del ritratto di Fabrizio Degni' }, description: { en: 'AI-assisted restoration generated from the owned 200-pixel source portrait and supplied only as a disclosed editorial variant.', it: 'Restauro assistito da AI generato dal ritratto proprietario da 200 pixel e fornito esclusivamente come variante editoriale dichiarata.' }, alt: { en: 'AI-restored black-and-white portrait variant of Fabrizio Degni', it: 'Variante in bianco e nero restaurata con AI del ritratto di Fabrizio Degni' }, usage: { en: 'Do not present as the unaltered source photograph; label AI-assisted restoration when published.', it: 'Non presentare come fotografia sorgente inalterata; indicare il restauro assistito da AI in caso di pubblicazione.' }, creator: 'Fabrizio Degni', credit: 'Fabrizio Degni' },
  'policywatcher-logo-mark-2400.png': { title: { en: 'PolicyWatcher high-resolution logo mark', it: 'Marchio PolicyWatcher ad alta risoluzione' }, description: { en: 'Owned 2400-pixel raster enlargement of the PolicyWatcher logo mark for editorial placement.', it: 'Ingrandimento raster proprietario da 2400 pixel del marchio PolicyWatcher per uso editoriale.' }, alt: { en: 'PolicyWatcher shield and eye logo mark', it: 'Marchio PolicyWatcher con scudo e occhio' }, usage: { en: 'Do not describe as a native vector master or imply endorsement.', it: 'Non descrivere come master vettoriale nativo o implicare endorsement.' }, creator: 'Fabrizio Degni', credit: CREDIT },
  'policywatcher-beta27-evidence-console-2026-08-01.png': { date: '2026-08-01', title: { en: 'Beta 27 public Knowledge layer', it: 'Knowledge layer pubblico Beta 27' }, description: { en: 'Server-rendered public policy reference layer with publication boundary and explicit empty evidence state.', it: 'Layer di riferimento pubblico renderizzato lato server con limite di pubblicazione e stato vuoto esplicito.' }, alt: { en: 'PolicyWatcher public Knowledge layer', it: 'Knowledge layer pubblico PolicyWatcher' }, usage: { en: 'The captured empty state is not a healthy-data claim.', it: 'Lo stato vuoto acquisito non e una dichiarazione di dati healthy.' }, creator: 'Fabrizio Degni', credit: CREDIT },
  'policywatcher-beta27-release-record-2026-08-01.png': { date: '2026-08-01', title: { en: 'Beta 27 release record', it: 'Record release Beta 27' }, description: { en: 'Dated Admin Operational Readiness release record with implemented changes and boundaries.', it: 'Record datato Admin Operational Readiness con modifiche implementate e limiti.' }, alt: { en: 'PolicyWatcher Beta 27 release record', it: 'Record release PolicyWatcher Beta 27' }, usage: { en: 'Release inventory is not measured outcome, certification or adoption.', it: 'L inventario release non e risultato misurato, certificazione o adozione.' }, creator: 'Fabrizio Degni', credit: CREDIT },
  'policywatcher-beta27-press-kit-2026-08-01.png': { date: '2026-08-01', title: { en: 'Beta 27 Press Kit', it: 'Press Kit Beta 27' }, description: { en: 'Evidence-oriented Press Kit with dated product status, action routes and extension boundaries.', it: 'Press Kit orientato alle evidenze con stato datato, azioni e limiti dell estensione.' }, alt: { en: 'PolicyWatcher Beta 27 Press Kit interface', it: 'Interfaccia Press Kit PolicyWatcher Beta 27' }, usage: { en: 'Verify the live Press Kit before later publication.', it: 'Verificare il Press Kit live prima di pubblicazioni successive.' }, creator: 'Fabrizio Degni', credit: CREDIT },
  'policywatcher-beta27-pulse-2026-08-01.png': { date: '2026-08-01', title: { en: 'Beta 27 Pulse', it: 'Pulse Beta 27' }, description: { en: 'Reviewed editorial leads with visible facts, source boundaries and reusable evidence formats.', it: 'Lead editoriali revisionati con dati, limiti delle fonti e formati di evidenza riutilizzabili.' }, alt: { en: 'PolicyWatcher Pulse verified leads interface', it: 'Interfaccia dei lead verificati PolicyWatcher Pulse' }, usage: { en: 'Verified means the configured editorial contract, not independent validation.', it: 'Verificato indica il contratto editoriale configurato, non validazione indipendente.' }, creator: 'Fabrizio Degni', credit: CREDIT },
  'policywatcher-beta27-data-room-2026-08-01.png': { date: '2026-08-01', title: { en: 'Beta 27 Data Room', it: 'Data Room Beta 27' }, description: { en: 'Dated configured-scope snapshot with citation, formats and reuse boundary.', it: 'Snapshot datato del perimetro configurato con citazione, formati e limiti di riuso.' }, alt: { en: 'PolicyWatcher editorial Data Room interface', it: 'Interfaccia Data Room editoriale PolicyWatcher' }, usage: { en: 'Configured inventory and method; not exhaustive coverage or measured compliance.', it: 'Inventario e metodo configurati; non copertura esaustiva o conformita misurata.' }, creator: 'Fabrizio Degni', credit: CREDIT },
  'policywatcher-two-week-progress-2026-07-26.png': { date: '2026-07-26', title: { en: 'Two-week product progress infographic', it: 'Infografica progressi di due settimane' }, description: { en: 'English infographic summarizing the product development cycle through 26 July 2026.', it: 'Infografica in inglese che sintetizza il ciclo di sviluppo fino al 26 luglio 2026.' }, alt: { en: 'PolicyWatcher two-week product progress infographic', it: 'Infografica PolicyWatcher sui progressi di due settimane' }, usage: { en: 'Historical summary; pair with current release metadata.', it: 'Sintesi storica; accompagnare con i metadata della release corrente.' }, creator: 'Fabrizio Degni', credit: CREDIT },
  'policywatcher-feature-atlas-2026-07-27.png': { date: '2026-07-27', title: { en: 'Feature Intelligence Atlas screenshot', it: 'Screenshot Feature Intelligence Atlas' }, description: { en: 'Product screenshot of the capability and dependency atlas captured on 27 July 2026.', it: 'Screenshot dell atlante di funzionalita e dipendenze acquisito il 27 luglio 2026.' }, alt: { en: 'PolicyWatcher Feature Intelligence Atlas interface', it: 'Interfaccia Feature Intelligence Atlas di PolicyWatcher' }, usage: { en: 'Figures are inventory and qualitative release labels.', it: 'I dati sono inventario ed etichette qualitative di release.' }, creator: 'Fabrizio Degni', credit: CREDIT },
  'policywatcher-release-impact-2026-07-27.png': { date: '2026-07-27', title: { en: 'Release Impact screenshot', it: 'Screenshot Release Impact' }, description: { en: 'Product screenshot of the release-outcome and residual-risk map captured on 27 July 2026.', it: 'Screenshot della mappa di esiti release e rischi residui acquisito il 27 luglio 2026.' }, alt: { en: 'PolicyWatcher Release Impact interface', it: 'Interfaccia Release Impact di PolicyWatcher' }, usage: { en: 'Categorical KPI and KRI labels are not measured outcomes.', it: 'Le etichette KPI e KRI categoriche non sono risultati misurati.' }, creator: 'Fabrizio Degni', credit: CREDIT },
  'policywatcher-wordmark-dark-2400x600.png': { title: { en: 'PolicyWatcher dark wordmark', it: 'Wordmark scuro PolicyWatcher' }, description: { en: 'PolicyWatcher raster wordmark for light editorial backgrounds.', it: 'Wordmark raster PolicyWatcher per sfondi editoriali chiari.' }, alt: { en: 'PolicyWatcher logo and dark wordmark', it: 'Logo PolicyWatcher e wordmark scuro' }, usage: { en: 'Use on light backgrounds without altering proportions.', it: 'Usare su sfondi chiari senza alterare le proporzioni.' }, creator: 'Fabrizio Degni', credit: CREDIT },
  'policywatcher-wordmark-light-on-navy-2400x600.png': { title: { en: 'PolicyWatcher light wordmark on navy', it: 'Wordmark chiaro PolicyWatcher su blu navy' }, description: { en: 'PolicyWatcher raster wordmark supplied on a navy editorial background.', it: 'Wordmark raster PolicyWatcher fornito su sfondo editoriale blu navy.' }, alt: { en: 'PolicyWatcher logo and light wordmark on navy', it: 'Logo PolicyWatcher e wordmark chiaro su blu navy' }, usage: { en: 'Use without changing the supplied background or proportions.', it: 'Usare senza cambiare lo sfondo fornito o le proporzioni.' }, creator: 'Fabrizio Degni', credit: CREDIT },
  [`policywatcher-configured-scope-${RELEASE_DATE}.png`]: { title: { en: 'Configured scope data card', it: 'Scheda dati del perimetro configurato' }, description: { en: 'Press-ready snapshot of configured monitored companies, sectors, canonical KPIs and editorial languages.', it: 'Snapshot per la stampa di aziende monitorate, settori, KPI canonici e lingue editoriali configurati.' }, alt: { en: 'Four PolicyWatcher configured-scope facts with their limitations', it: 'Quattro dati sul perimetro configurato di PolicyWatcher con i relativi limiti' }, usage: { en: 'Publish with the snapshot date and stated boundary.', it: 'Pubblicare con la data dello snapshot e il limite dichiarato.' }, creator: 'Fabrizio Degni', credit: CREDIT },
};

const pdfStyles = StyleSheet.create({ page: { padding: 44, fontSize: 10, color: '#10223b', fontFamily: 'Helvetica' }, kicker: { color: '#146c6a', fontSize: 9, marginBottom: 10 }, title: { fontSize: 25, marginBottom: 8 }, lead: { color: '#50627a', fontSize: 11, lineHeight: 1.45, marginBottom: 20 }, card: { border: '1 solid #cad9dc', borderRadius: 8, padding: 12, marginBottom: 9 }, value: { fontSize: 18, marginBottom: 3 }, label: { fontSize: 10, color: '#146c6a', marginBottom: 3 }, boundary: { fontSize: 8, color: '#50627a', lineHeight: 1.35 }, footer: { position: 'absolute', left: 44, right: 44, bottom: 36, fontSize: 8, color: '#50627a' } });

async function writeFactSheets() {
  const localized = {
    en: { title: 'PolicyWatcher press fact sheet', lead: 'Configured product facts with explicit scope and reuse boundaries.', releaseLabel: 'Current release', labels: ['configured monitored companies', 'configured sectors', 'canonical KPIs', 'editorial languages'], scopes: facts.map((fact) => fact.scope), boundary: 'Not legal advice, compliance certification or exhaustive market coverage.' },
    it: { title: 'Scheda stampa PolicyWatcher', lead: 'Dati configurati sul prodotto con perimetro e limiti di riuso espliciti.', releaseLabel: 'Release corrente', labels: ['aziende monitorate configurate', 'settori configurati', 'KPI canonici', 'lingue editoriali'], scopes: ['Esclude la fixture WAZE per l onboarding amministrativo; non e copertura esaustiva.', 'Le etichette di settore organizzano l inventario monitorato.', 'Privacy, governance AI ed etica; le valutazioni non disponibili sono Non valutato.', 'Press kit e alcune pagine guida selezionate.'], boundary: 'Non e consulenza legale, certificazione di conformita o copertura esaustiva del mercato.' },
  };
  for (const locale of ['en', 'it']) {
    const copy = localized[locale];
    const txt = [`${copy.title}`, `Version ${VERSION} · ${RELEASE_DATE}`, `${copy.releaseLabel}: ${RELEASE_NAME}`, '', copy.lead, '', ...facts.flatMap((fact, index) => [`${fact.value}: ${copy.labels[index]}`, copy.scopes[index], '']), `Boundary: ${copy.boundary}`, `Current source: ${CANONICAL_URL}`].join('\n');
    writeFileSync(path.join(PRESS_DIR, `policywatcher-fact-sheet-${locale}-${RELEASE_DATE}.txt`), `${txt}\n`);
    const fixedDocumentDate = new Date(`${RELEASE_DATE}T12:00:00Z`);
    const document = React.createElement(Document, {
      author: 'Fabrizio Degni',
      creator: 'PolicyWatcher press package generator',
      producer: 'PolicyWatcher',
      title: copy.title,
      subject: 'Dated PolicyWatcher product facts and reuse boundaries',
      creationDate: fixedDocumentDate,
      modificationDate: fixedDocumentDate,
    }, React.createElement(Page, { size: 'A4', style: pdfStyles.page },
      React.createElement(Text, { style: pdfStyles.kicker }, `POLICYWATCHER · ${VERSION} · ${RELEASE_DATE}`),
      React.createElement(Text, { style: pdfStyles.title }, copy.title),
      React.createElement(Text, { style: pdfStyles.lead }, copy.lead),
      React.createElement(View, { style: pdfStyles.card }, React.createElement(Text, { style: pdfStyles.label }, copy.releaseLabel), React.createElement(Text, { style: pdfStyles.value }, RELEASE_NAME)),
      ...facts.map((fact, index) => React.createElement(View, { key: fact.id, style: pdfStyles.card }, React.createElement(Text, { style: pdfStyles.value }, fact.value), React.createElement(Text, { style: pdfStyles.label }, copy.labels[index]), React.createElement(Text, { style: pdfStyles.boundary }, copy.scopes[index]))),
      React.createElement(Text, { style: pdfStyles.boundary }, copy.boundary),
      React.createElement(Text, { style: pdfStyles.footer }, `${CANONICAL_URL} · info@policywatcher.online`)
    ));
    await renderToFile(document, path.join(PRESS_DIR, `policywatcher-fact-sheet-${locale}-${RELEASE_DATE}.pdf`));
  }
}

function dimensions(filePath) {
  const result = spawnSync('identify', ['-format', '%w x %h px', filePath], { encoding: 'utf8' });
  return result.status === 0 && result.stdout ? result.stdout : null;
}

function manifestEntry(filename, mediaType, metadataStandard = 'document-manifest') {
  const filePath = path.join(PRESS_DIR, filename);
  const isImage = mediaType.startsWith('image/');
  return { filename, mediaType, dimensions: isImage ? dimensions(filePath) : null, bytes: statSync(filePath).size, sha256: sha256(filePath), creditLine: mediaMetadata[filename]?.credit || CREDIT, rightsUrl: '/press-kit/LICENSE-ASSETS.md', metadataStandard, contentCredentials: 'not-attached' };
}

function writeReadme(locale, target) {
  const title = locale === 'en' ? 'PolicyWatcher press package' : 'Pacchetto stampa PolicyWatcher';
  const body = locale === 'en'
    ? `This package is the immutable ${CAMPAIGN_VERSION} ${CAMPAIGN_RELEASE_NAME} campaign set dated ${CAMPAIGN_DATE}. It contains owned editorial assets, a dated fact sheet, press releases, multiregion pitch drafts, regional briefs, hard-questions FAQ, spokesperson sheets, the claims freeze, campaign cohort registry, an 87-second demo with English and Italian subtitles, captions, credits, usage terms and integrity checks. French, German, Spanish and Brazilian Portuguese copy requires native human review before distribution. The live product can be newer than this campaign package; verify current facts at the canonical Press Kit before publication. Content Credentials are not attached.`
    : `Questo pacchetto e il set di campagna immutabile ${CAMPAIGN_VERSION} ${CAMPAIGN_RELEASE_NAME}, datato ${CAMPAIGN_DATE}. Contiene asset editoriali proprietari, scheda dati datata, comunicati, pitch multiregione, schede regionali, FAQ critica, schede portavoce, claims freeze, registro delle campagne, demo di 87 secondi con sottotitoli inglesi e italiani, didascalie, crediti, condizioni d uso e controlli di integrita. I testi francese, tedesco, spagnolo e portoghese brasiliano richiedono revisione umana madrelingua prima della distribuzione. Il prodotto live puo essere successivo a questo pacchetto; verificare i dati correnti nel Press Kit canonico prima della pubblicazione. Le Content Credentials non sono allegate.`;
  writeFileSync(target, `# ${title}\n\nCampaign version: ${CAMPAIGN_VERSION}\nCampaign date: ${CAMPAIGN_DATE}\nCurrent product version at generation: ${VERSION}\nGenerated: ${RELEASE_DATE}\nCanonical source: ${CANONICAL_URL}\n\n${body}\n`);
}

function createPackages(assetManifest) {
  const commonFiles = assetManifest.assets.map((entry) => entry.filename).filter((filename) => !filename.includes('fact-sheet-en-') && !filename.includes('fact-sheet-it-'));
  const packages = [];
  for (const locale of ['en', 'it']) {
    const stage = mkdtempSync(path.join(tmpdir(), `policywatcher-press-${locale}-`));
    try {
      const filenames = [...commonFiles, `policywatcher-fact-sheet-${locale}-${RELEASE_DATE}.txt`, `policywatcher-fact-sheet-${locale}-${RELEASE_DATE}.pdf`];
      for (const filename of filenames) copyFileSync(path.join(PRESS_DIR, filename), path.join(stage, filename));
      copyFileSync(path.join(PRESS_DIR, 'asset-manifest.json'), path.join(stage, 'asset-manifest.json'));
      copyFileSync(path.join(PRESS_DIR, 'media-metadata.json'), path.join(stage, 'media-metadata.json'));
      copyFileSync(path.join(PRESS_DIR, 'LICENSE-ASSETS.md'), path.join(stage, 'LICENSE-ASSETS.md'));
      writeReadme(locale, path.join(stage, 'README.md'));
      for (const filename of [...filenames, 'asset-manifest.json', 'media-metadata.json', 'LICENSE-ASSETS.md', 'README.md']) utimesSync(path.join(stage, filename), new Date(`${RELEASE_DATE}T12:00:00Z`), new Date(`${RELEASE_DATE}T12:00:00Z`));
      const packageFilename = `policywatcher-press-package-${locale}-${RELEASE_DATE}.zip`;
      const packagePath = path.join(PRESS_DIR, packageFilename);
      if (existsSync(packagePath)) rmSync(packagePath);
      const ordered = [...filenames, 'asset-manifest.json', 'media-metadata.json', 'LICENSE-ASSETS.md', 'README.md'].sort();
      run('zip', ['-q', '-X', packagePath, ...ordered], { cwd: stage });
      packages.push({ locale, filename: packageFilename, href: `${GITHUB_PRESS_DOWNLOAD_BASE_URL}/${packageFilename}`, distribution: 'github-repository', bytes: statSync(packagePath).size, sha256: sha256(packagePath), generatedAt: RELEASE_DATE, version: CAMPAIGN_VERSION });
    } finally {
      rmSync(stage, { recursive: true, force: true });
    }
  }
  writeFileSync(path.join(PRESS_DIR, 'package-manifest.json'), `${JSON.stringify({ schema: 'https://policywatcher.online/schemas/press-kit-package-manifest/v1', schemaVersion: '1.1.0', generatedAt: RELEASE_DATE, release: CAMPAIGN_VERSION, currentProductRelease: VERSION, distribution: { provider: 'github-repository', repository: REPOSITORY_URL, revision: GITHUB_PRESS_DISTRIBUTION_REVISION, boundary: 'Downloads are pinned to the Git commit containing these packages. Verify the package SHA-256 before use.' }, packages }, null, 2)}\n`);
}

async function main() {
  for (const [source, filename] of CAMPAIGN_DOCUMENTS) copyFileSync(path.join(ROOT, source), path.join(PRESS_DIR, filename));
  generateWordmarks();
  writeDataSnapshot();
  await writeFactSheets();
  for (const [filename, metadata] of Object.entries(mediaMetadata)) {
    const filePath = path.join(PRESS_DIR, filename);
    const packet = buildXmp(metadata);
    if (filename.endsWith('.png')) injectPngXmp(filePath, packet);
    else if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) injectJpegXmp(filePath, packet);
  }
  writeFileSync(path.join(PRESS_DIR, 'media-metadata.json'), `${JSON.stringify({ schema: 'https://policywatcher.online/schemas/press-kit-media-metadata/v1', schemaVersion: '1.0.0', generatedAt: RELEASE_DATE, standard: 'IPTC Photo Metadata 2025.1', contentCredentials: 'not-attached', vectorMasterAvailable: false, vectorBoundary: 'No native vector master is currently supplied. Raster wordmarks must not be represented as vector artwork.', assets: mediaMetadata }, null, 2)}\n`);

  const fileDefinitions = [
    ['policywatcher-logo-mark-512.png', 'image/png', 'IPTC Photo Metadata 2025.1'],
    ['policywatcher-logo-square-1024.jpg', 'image/jpeg', 'IPTC Photo Metadata 2025.1'],
    ['policywatcher-wordmark-dark-2400x600.png', 'image/png', 'IPTC Photo Metadata 2025.1'],
    ['policywatcher-wordmark-light-on-navy-2400x600.png', 'image/png', 'IPTC Photo Metadata 2025.1'],
    ['fabrizio-degni-portrait-200.png', 'image/png', 'IPTC Photo Metadata 2025.1'],
    ['fabrizio-degni-portrait-2400-source-upscale.png', 'image/png', 'IPTC Photo Metadata 2025.1'],
    ['fabrizio-degni-portrait-2400-ai-restored.png', 'image/png', 'IPTC Photo Metadata 2025.1'],
    ['policywatcher-logo-mark-2400.png', 'image/png', 'IPTC Photo Metadata 2025.1'],
    ['policywatcher-logo-editorial-container.svg', 'image/svg+xml', 'document-manifest'],
    ['policywatcher-logo-editorial-container.eps', 'application/postscript', 'document-manifest'],
    ['policywatcher-beta27-evidence-console-2026-08-01.png', 'image/png', 'IPTC Photo Metadata 2025.1'],
    ['policywatcher-beta27-release-record-2026-08-01.png', 'image/png', 'IPTC Photo Metadata 2025.1'],
    ['policywatcher-beta27-press-kit-2026-08-01.png', 'image/png', 'IPTC Photo Metadata 2025.1'],
    ['policywatcher-beta27-pulse-2026-08-01.png', 'image/png', 'IPTC Photo Metadata 2025.1'],
    ['policywatcher-beta27-data-room-2026-08-01.png', 'image/png', 'IPTC Photo Metadata 2025.1'],
    ['policywatcher-beta27-demo-2026-08-01.mp4', 'video/mp4', 'document-manifest'],
    ['policywatcher-two-week-progress-2026-07-26.png', 'image/png', 'IPTC Photo Metadata 2025.1'],
    ['policywatcher-feature-atlas-2026-07-27.png', 'image/png', 'IPTC Photo Metadata 2025.1'],
    ['policywatcher-release-impact-2026-07-27.png', 'image/png', 'IPTC Photo Metadata 2025.1'],
    [`policywatcher-configured-scope-${RELEASE_DATE}.png`, 'image/png', 'IPTC Photo Metadata 2025.1'],
    [`policywatcher-configured-scope-${RELEASE_DATE}.svg`, 'image/svg+xml', 'document-manifest'],
    [`policywatcher-configured-scope-${RELEASE_DATE}.csv`, 'text/csv', 'document-manifest'],
    [`policywatcher-configured-scope-${RELEASE_DATE}.json`, 'application/json', 'document-manifest'],
    ['policywatcher-fact-sheet-2026-07-27.md', 'text/markdown', 'document-manifest'],
    [`policywatcher-fact-sheet-en-${RELEASE_DATE}.txt`, 'text/plain', 'document-manifest'],
    [`policywatcher-fact-sheet-it-${RELEASE_DATE}.txt`, 'text/plain', 'document-manifest'],
    [`policywatcher-fact-sheet-en-${RELEASE_DATE}.pdf`, 'application/pdf', 'document-manifest'],
    [`policywatcher-fact-sheet-it-${RELEASE_DATE}.pdf`, 'application/pdf', 'document-manifest'],
    ['LICENSE-ASSETS.md', 'text/markdown', 'document-manifest'],
    ...CAMPAIGN_DOCUMENTS.map(([, filename, mediaType]) => [filename, mediaType, 'document-manifest']),
  ];
  const manifest = { $schema: 'https://policywatcher.online/schemas/press-kit-asset-manifest/v1', schemaVersion: '2.0.0', generatedAt: RELEASE_DATE, release: VERSION, contentCredentials: 'not-attached', metadataStandard: 'IPTC Photo Metadata 2025.1', vectorMasterAvailable: false, integrityBoundary: 'SHA-256 checksums establish downloaded-file integrity only. They do not establish semantic truth, authorship provenance or endorsement.', assets: fileDefinitions.map(([filename, mediaType, standard]) => manifestEntry(filename, mediaType, standard)) };
  writeFileSync(path.join(PRESS_DIR, 'asset-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  createPackages(manifest);
  process.stdout.write(`Generated ${manifest.assets.length} press assets and 2 localized packages for ${VERSION}.\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error}\n`);
  process.exitCode = 1;
});
