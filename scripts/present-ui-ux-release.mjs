#!/usr/bin/env node

import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const scriptPath = path.join(repoRoot, 'docs/presentation-ui-ux-beta41-2026-08-07.md');
const requiredAssets = [
  'public/infographics/policywatcher-experience-map-er-sitemap-2026-08.webp',
  'docs/sitemap-er-2026-08-07.mmd',
  'docs/sitemap-er-2026-08-07.json',
];

await Promise.all(requiredAssets.map((asset) => access(path.join(repoRoot, asset))));
const script = await readFile(scriptPath, 'utf8');
const cues = [...script.matchAll(/^## (\d{2}:\d{2}) - (.+)$/gmu)].map((match) => ({
  time: match[1],
  title: match[2],
}));

if (cues.length < 5) throw new Error('Presentation script must contain at least five timed cues.');

console.log('PolicyWatcher UI/UX beta 41 - presentation run sheet');
console.log('----------------------------------------------------');
for (const cue of cues) console.log(`${cue.time}  ${cue.title}`);
console.log('----------------------------------------------------');
console.log(`Full script: ${scriptPath}`);
console.log(`Validated assets: ${requiredAssets.length}`);
