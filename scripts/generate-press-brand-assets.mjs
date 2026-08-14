import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const pressDir = path.resolve('public/press-kit');

function run(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`${command} failed: ${result.stderr || result.stdout}`);
}

const originalPortrait = path.join(pressDir, 'fabrizio-degni-portrait-200.png');
const officialPortrait = path.join(pressDir, 'fabrizio-degni-portrait-2400-source-upscale.png');
run('magick', [originalPortrait, '-filter', 'Lanczos', '-resize', '2400x2400', '-strip', officialPortrait]);

const aiSource = path.join(pressDir, 'fabrizio-degni-portrait-ai-restored-source.png');
if (existsSync(aiSource)) {
  run('magick', [aiSource, '-filter', 'Lanczos', '-resize', '2400x2400', '-strip', path.join(pressDir, 'fabrizio-degni-portrait-2400-ai-restored.png')]);
}

const markSource = path.join(pressDir, 'policywatcher-logo-mark-512.png');
const printPng = path.join(pressDir, 'policywatcher-logo-mark-2400.png');
run('magick', [markSource, '-filter', 'Lanczos', '-resize', '2400x2400', '-strip', printPng]);

const data = readFileSync(printPng).toString('base64');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="2400" height="2400" viewBox="0 0 2400 2400" role="img" aria-labelledby="title desc">
  <title id="title">PolicyWatcher logo mark</title>
  <desc id="desc">Self-contained editorial SVG container using the owned raster logo mark. This is not a native vector-path master.</desc>
  <metadata>PolicyWatcher / Fabrizio Degni; editorial use subject to https://policywatcher.online/press-kit/LICENSE-ASSETS.md; embedded raster source; no native vector-path master; Content Credentials not attached.</metadata>
  <image width="2400" height="2400" href="data:image/png;base64,${data}"/>
</svg>\n`;
writeFileSync(path.join(pressDir, 'policywatcher-logo-editorial-container.svg'), svg);
const epsPath = path.join(pressDir, 'policywatcher-logo-editorial-container.eps');
run('magick', [printPng, '-alpha', 'remove', '-strip', '-compress', 'jpeg', '-quality', '90', `eps2:${epsPath}`]);
const sanitizedEps = readFileSync(epsPath, 'latin1')
  .replace(/^%%Title:.*$/m, '%%Title: (PolicyWatcher logo editorial container)')
  .replace(/^%%CreationDate:.*$/m, '%%CreationDate: (2026-08-01)');
writeFileSync(epsPath, sanitizedEps, 'latin1');

console.log('Generated 2400px portrait and logo editorial containers. SVG/EPS contain raster artwork and are not native vector-path masters.');
