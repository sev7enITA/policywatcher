import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { geoMercator, geoNaturalEarth1, geoPath } from 'd3-geo';
import sharp from 'sharp';
import { feature } from 'topojson-client';
import { CIVIC_DIRECTORY_REVIEWED_AT, CIVIC_ORGANIZATIONS } from '../src/lib/civicOrganizations';
import { GLOBAL_COUNTRIES, type GlobalCountryCode } from '../src/lib/globalContext';

const WIDTH = 1200;
const HEIGHT = 1500;
const OUT_DIR = path.join(process.cwd(), 'public', 'infographics');
const LOGO_PATH = path.join(process.cwd(), 'public', 'press-kit', 'policywatcher-wordmark-dark-2400x600.png');
const WORLD_PATH = path.join(process.cwd(), 'node_modules', 'world-atlas', 'countries-110m.json');

const COLORS = {
  paper: '#f5f2e9',
  panel: '#fffdf8',
  ink: '#102039',
  muted: '#566477',
  teal: '#146c6a',
  tealSoft: '#dcecea',
  indigo: '#38418a',
  indigoSoft: '#e4e6f3',
  rust: '#9a4932',
  land: '#dedfd9',
  border: '#a8b3b8',
  rule: '#cbd1ce',
};

type Point = {
  code: Exclude<GlobalCountryCode, 'all'>;
  lon: number;
  lat: number;
};

const COUNTRY_POINTS: readonly Point[] = [
  { code: 'at', lon: 14.1, lat: 47.6 },
  { code: 'au', lon: 134, lat: -25 },
  { code: 'br', lon: -52, lat: -10 },
  { code: 'ca', lon: -106, lat: 56 },
  { code: 'ch', lon: 8.2, lat: 46.8 },
  { code: 'cz', lon: 15.5, lat: 49.8 },
  { code: 'de', lon: 10.5, lat: 51 },
  { code: 'dk', lon: 10, lat: 56 },
  { code: 'es', lon: -3.5, lat: 40 },
  { code: 'fi', lon: 26, lat: 64 },
  { code: 'fr', lon: 2, lat: 46 },
  { code: 'gb', lon: -3, lat: 55 },
  { code: 'gh', lon: -1.2, lat: 7.9 },
  { code: 'ie', lon: -8, lat: 53 },
  { code: 'in', lon: 79, lat: 22 },
  { code: 'it', lon: 12.5, lat: 42.5 },
  { code: 'nl', lon: 5.5, lat: 52.3 },
  { code: 'no', lon: 10, lat: 62 },
  { code: 'nz', lon: 172, lat: -41 },
  { code: 'pl', lon: 19, lat: 52 },
  { code: 'pt', lon: -8, lat: 39.5 },
  { code: 'se', lon: 16, lat: 62 },
  { code: 'us', lon: -98, lat: 38 },
  { code: 'za', lon: 24, lat: -29 },
];

const countryName = (code: string) => GLOBAL_COUNTRIES.find((entry) => entry.code === code)?.label ?? code.toUpperCase();
const esc = (value: string) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const svgText = (
  x: number,
  y: number,
  content: string,
  options: { size?: number; weight?: number; fill?: string; anchor?: 'start' | 'middle' | 'end'; spacing?: number } = {},
) => `<text x="${x}" y="${y}" font-family="Verdana, Arial, sans-serif" font-size="${options.size ?? 24}" font-weight="${options.weight ?? 400}" fill="${options.fill ?? COLORS.ink}" text-anchor="${options.anchor ?? 'start'}" letter-spacing="${options.spacing ?? 0}">${esc(content)}</text>`;

const multiline = (
  x: number,
  y: number,
  lines: readonly string[],
  options: { size?: number; weight?: number; fill?: string; lineHeight?: number; anchor?: 'start' | 'middle' | 'end' } = {},
) => lines.map((line, index) => svgText(x, y + index * (options.lineHeight ?? 30), line, options)).join('');

const roundedRect = (x: number, y: number, width: number, height: number, fill = COLORS.panel, stroke = COLORS.rule, radius = 14) =>
  `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;

const documentShell = (body: string, logoData: string) => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${COLORS.paper}"/>
  <path d="M0 0H1200V20H0Z" fill="${COLORS.teal}"/>
  <path d="M0 20H360V27H0Z" fill="${COLORS.indigo}"/>
  <image href="data:image/png;base64,${logoData}" x="70" y="52" width="420" height="105" preserveAspectRatio="xMinYMid meet"/>
  ${body}
</svg>`;

function getCoverage() {
  const national = CIVIC_ORGANIZATIONS.filter((organization) => organization.scope === 'national');
  const counts = new Map<string, { total: number; digital: number }>();
  for (const organization of national) {
    const current = counts.get(organization.country) ?? { total: 0, digital: 0 };
    current.total += 1;
    if (organization.types.includes('digital-rights') || organization.types.includes('privacy-data')) current.digital += 1;
    counts.set(organization.country, current);
  }
  return { national, counts };
}

function buildWorkflowSvg(logoData: string) {
  const steps = [
    ['DAY 0', 'INTRODUCTION', '5W overview', '5W infographic', 'Explore the directory', 'Qualified visits'],
    ['DAY 2', 'COVERAGE', 'Coverage and filters', 'Technical infographic', 'Copy a filtered view', 'Filter and source opens'],
    ['DAY 4', 'COUNTRY VIEW', 'One country view', 'Filtered directory crop', 'Select the next country', 'Country-specific responses'],
    ['DAY 7', 'CONTRIBUTION', 'Submit or correct', 'Contribution section crop', 'Open the contribution path', 'User-initiated email drafts'],
    ['DAY 10', 'METHOD', 'Evidence workflow', 'Evidence workflow crop', 'Inspect source and method', 'Verification-source opens'],
  ] as const;

  const rows = steps.map((step, index) => {
    const y = 458 + index * 154;
    const accent = index % 2 === 0 ? COLORS.teal : COLORS.indigo;
    return `
      <line x1="150" y1="${y - 36}" x2="150" y2="${y + 118}" stroke="${COLORS.rule}" stroke-width="3"/>
      <circle cx="150" cy="${y + 46}" r="30" fill="${accent}"/>
      ${svgText(150, y + 55, String(index + 1), { size: 25, weight: 700, fill: '#ffffff', anchor: 'middle' })}
      ${roundedRect(208, y - 12, 922, 124)}
      ${svgText(238, y + 20, step[0], { size: 15, weight: 700, fill: accent, spacing: 1.4 })}
      ${svgText(238, y + 54, step[1], { size: 16, weight: 700, fill: COLORS.muted, spacing: 1.1 })}
      ${svgText(238, y + 88, step[2], { size: 29, weight: 700 })}
      ${svgText(570, y + 18, 'ASSET', { size: 12, weight: 700, fill: COLORS.muted, spacing: 1 })}
      ${svgText(570, y + 47, step[3], { size: 17, weight: 600 })}
      ${svgText(570, y + 74, 'CTA', { size: 12, weight: 700, fill: COLORS.muted, spacing: 1 })}
      ${svgText(570, y + 101, step[4], { size: 17, weight: 600, fill: accent })}
      ${svgText(895, y + 18, 'MEASURE', { size: 12, weight: 700, fill: COLORS.muted, spacing: 1 })}
      ${multiline(895, y + 47, step[5].split(' / '), { size: 16, weight: 600, lineHeight: 23 })}
    `;
  }).join('');

  const body = `
    ${svgText(1130, 84, 'CIVIC COMMUNICATIONS · EN', { size: 15, weight: 700, fill: COLORS.indigo, anchor: 'end', spacing: 1.2 })}
    ${svgText(70, 222, 'Editorial posting workflow', { size: 58, weight: 700 })}
    ${multiline(70, 272, [
      'Five posts, each focused on one function.',
      'A Day 0–Day 10 sequence for directory, coverage, context, contribution and method.',
    ], { size: 22, weight: 500, fill: COLORS.muted, lineHeight: 34 })}

    ${roundedRect(70, 350, 320, 76, COLORS.tealSoft, COLORS.teal)}
    ${svgText(98, 382, '5 POSTS', { size: 28, weight: 700, fill: COLORS.teal })}
    ${svgText(98, 408, 'one function per post', { size: 14, weight: 600, fill: COLORS.muted })}
    ${roundedRect(410, 350, 320, 76, COLORS.indigoSoft, COLORS.indigo)}
    ${svgText(438, 382, '10 DAYS', { size: 28, weight: 700, fill: COLORS.indigo })}
    ${svgText(438, 408, 'spaced editorial sequence', { size: 14, weight: 600, fill: COLORS.muted })}
    ${roundedRect(750, 350, 380, 76, '#f2e6df', COLORS.rust)}
    ${svgText(778, 382, '2 CORE INFOGRAPHICS', { size: 25, weight: 700, fill: COLORS.rust })}
    ${svgText(778, 408, '5W overview + technical view', { size: 14, weight: 600, fill: COLORS.muted })}

    ${rows}

    ${roundedRect(70, 1230, 1060, 190, COLORS.ink, COLORS.ink, 16)}
    ${svgText(100, 1267, 'PUBLICATION CHECK', { size: 14, weight: 700, fill: '#8fd2ca', spacing: 1.4 })}
    ${svgText(100, 1305, 'DRAFT  →  NATIVE ASSET  →  ALT TEXT  →  SOURCE-RELEVANT MENTIONS', { size: 20, weight: 700, fill: '#ffffff' })}
    ${svgText(100, 1341, '→  TRUST BOUNDARY  →  PRECISE REPLY', { size: 20, weight: 700, fill: '#ffffff' })}
    ${svgText(100, 1380, 'Measure visits, source opens, copied views and user-initiated drafts separately from impressions.', { size: 15, weight: 500, fill: '#cbd5e1' })}
    ${svgText(100, 1407, 'Inclusion does not imply partnership or endorsement.  ·  policywatcher.online/en/associations', { size: 14, weight: 600, fill: '#cbd5e1' })}
  `;
  return documentShell(body, logoData);
}

async function buildMapSvg(logoData: string) {
  const topology = JSON.parse(await readFile(WORLD_PATH, 'utf8'));
  const countries = feature(topology, topology.objects.countries) as unknown as GeoJSON.FeatureCollection;
  const projection = geoNaturalEarth1().fitExtent([[74, 486], [1126, 815]], countries);
  const pathGenerator = geoPath(projection);
  const worldPaths = countries.features.map((country) => `<path d="${pathGenerator(country) ?? ''}" fill="${COLORS.land}" stroke="${COLORS.border}" stroke-width="0.65"/>`).join('');

  const { national, counts } = getCoverage();
  const digitalTotal = CIVIC_ORGANIZATIONS.filter((organization) => organization.types.includes('digital-rights') || organization.types.includes('privacy-data')).length;
  const europeanCodes = new Set(GLOBAL_COUNTRIES.filter((country) => country.region === 'europe').map((country) => country.code));
  const europeTotal = [...counts].filter(([code]) => europeanCodes.has(code as never)).reduce((sum, [, value]) => sum + value.total, 0);
  const nonEurope = COUNTRY_POINTS.filter((point) => !europeanCodes.has(point.code));

  const worldMarkers = nonEurope.map((point) => {
    const projected = projection([point.lon, point.lat]);
    const value = counts.get(point.code)?.total ?? 0;
    if (!projected || value === 0) return '';
    const [x, y] = projected;
    const r = 9 + Math.sqrt(value) * 5;
    const alignLeft = point.code === 'nz';
    const labelX = alignLeft ? x - r - 8 : x + r + 8;
    const anchor = alignLeft ? 'end' : 'start';
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="${COLORS.teal}" fill-opacity="0.9" stroke="#ffffff" stroke-width="2"/>
      ${svgText(x, y + 5, String(value), { size: 15, weight: 700, fill: '#ffffff', anchor: 'middle' })}
      ${svgText(labelX, y - 3, countryName(point.code), { size: 13, weight: 700, anchor })}
      ${svgText(labelX, y + 15, `${value} listing${value === 1 ? '' : 's'}`, { size: 11, weight: 600, fill: COLORS.muted, anchor })}`;
  }).join('');

  const europePoint = projection([12, 52]);
  const europeMarker = europePoint ? `<circle cx="${europePoint[0]}" cy="${europePoint[1]}" r="32" fill="${COLORS.indigo}" stroke="#ffffff" stroke-width="3"/>
    ${svgText(europePoint[0], europePoint[1] + 6, String(europeTotal), { size: 19, weight: 700, fill: '#ffffff', anchor: 'middle' })}
    ${svgText(europePoint[0] + 42, europePoint[1] - 3, 'Europe', { size: 14, weight: 700 })}
    ${svgText(europePoint[0] + 42, europePoint[1] + 16, 'expanded below', { size: 11, weight: 600, fill: COLORS.muted })}` : '';

  const insetProjection = geoMercator().center([11, 52]).scale(340).translate([410, 1020]);
  const insetPath = geoPath(insetProjection);
  const insetPaths = countries.features.map((country) => `<path d="${insetPath(country) ?? ''}" fill="${COLORS.land}" stroke="${COLORS.border}" stroke-width="0.65"/>`).join('');
  const europeMarkers = COUNTRY_POINTS.filter((point) => europeanCodes.has(point.code)).map((point) => {
    const projected = insetProjection([point.lon, point.lat]);
    const value = counts.get(point.code)?.total ?? 0;
    if (!projected || value === 0) return '';
    const [x, y] = projected;
    const r = 5 + Math.sqrt(value) * 3.1;
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="${COLORS.indigo}" fill-opacity="0.92" stroke="#ffffff" stroke-width="1.5"/>
      ${svgText(x, y + 4, String(value), { size: 10, weight: 700, fill: '#ffffff', anchor: 'middle' })}`;
  }).join('');

  const europeRows = [...counts]
    .filter(([code]) => europeanCodes.has(code as never))
    .sort((a, b) => b[1].total - a[1].total || countryName(a[0]).localeCompare(countryName(b[0])))
    .map(([code, value], index) => {
      const col = index < 8 ? 0 : 1;
      const row = index % 8;
      const x = 790 + col * 190;
      const y = 900 + row * 32;
      const countX = x + (col === 0 ? 165 : 140);
      return `${svgText(x, y, countryName(code), { size: 13, weight: 600 })}${svgText(countX, y, String(value.total), { size: 13, weight: 700, fill: COLORS.indigo, anchor: 'end' })}`;
    }).join('');

  const body = `
    ${svgText(1130, 84, 'CIVIC DIRECTORY · DATA VIEW', { size: 15, weight: 700, fill: COLORS.indigo, anchor: 'end', spacing: 1.2 })}
    ${svgText(70, 220, 'World coverage of the current civic directory', { size: 42, weight: 700 })}
    ${multiline(70, 265, [
      'Country clusters show national listings. Global and regional networks are reported separately.',
      `Research snapshot reviewed ${new Date(`${CIVIC_DIRECTORY_REVIEWED_AT}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}.`,
    ], { size: 20, weight: 500, fill: COLORS.muted, lineHeight: 31 })}

    ${roundedRect(70, 340, 245, 78, COLORS.tealSoft, COLORS.teal)}
    ${svgText(94, 375, String(CIVIC_ORGANIZATIONS.length), { size: 31, weight: 700, fill: COLORS.teal })}
    ${svgText(150, 374, 'TOTAL', { size: 15, weight: 700, fill: COLORS.teal })}
    ${svgText(94, 400, 'organizations', { size: 13, weight: 600, fill: COLORS.muted })}
    ${roundedRect(335, 340, 245, 78, COLORS.panel, COLORS.rule)}
    ${svgText(359, 375, String(national.length), { size: 31, weight: 700 })}
    ${svgText(415, 374, 'NATIONAL', { size: 15, weight: 700 })}
    ${svgText(359, 400, 'country listings', { size: 13, weight: 600, fill: COLORS.muted })}
    ${roundedRect(600, 340, 245, 78, COLORS.indigoSoft, COLORS.indigo)}
    ${svgText(624, 375, String(counts.size), { size: 31, weight: 700, fill: COLORS.indigo })}
    ${svgText(680, 374, 'COUNTRIES', { size: 15, weight: 700, fill: COLORS.indigo })}
    ${svgText(624, 400, 'with national records', { size: 13, weight: 600, fill: COLORS.muted })}
    ${roundedRect(865, 340, 265, 78, '#f2e6df', COLORS.rust)}
    ${svgText(889, 375, String(digitalTotal), { size: 31, weight: 700, fill: COLORS.rust })}
    ${svgText(945, 374, 'DIGITAL / PRIVACY', { size: 13, weight: 700, fill: COLORS.rust })}
    ${svgText(889, 400, 'specialists in total catalog', { size: 12, weight: 600, fill: COLORS.muted })}

    ${roundedRect(70, 443, 1060, 386, COLORS.panel, COLORS.rule)}
    ${svgText(94, 474, 'WORLD VIEW · BUBBLE AREA REPRESENTS NATIONAL LISTING COUNT', { size: 13, weight: 700, fill: COLORS.muted, spacing: 0.8 })}
    <g>${worldPaths}</g>
    <g>${worldMarkers}${europeMarker}</g>

    ${roundedRect(70, 850, 680, 320, COLORS.panel, COLORS.rule)}
    ${svgText(94, 881, `EUROPE INSET · ${europeTotal} NATIONAL LISTINGS`, { size: 13, weight: 700, fill: COLORS.indigo, spacing: 0.8 })}
    <clipPath id="europe-clip"><rect x="82" y="892" width="656" height="264" rx="9"/></clipPath>
    <g clip-path="url(#europe-clip)">${insetPaths}${europeMarkers}</g>

    ${roundedRect(770, 850, 360, 320, COLORS.panel, COLORS.rule)}
    ${svgText(790, 881, 'EUROPE · COUNTRY COUNTS', { size: 13, weight: 700, fill: COLORS.indigo, spacing: 0.8 })}
    ${europeRows}
    ${svgText(790, 1150, 'Circle labels on map = listings', { size: 11, weight: 600, fill: COLORS.muted })}

    ${roundedRect(70, 1192, 1060, 116, COLORS.ink, COLORS.ink, 14)}
    ${svgText(96, 1227, 'GLOBAL / REGIONAL NETWORKS · NOT ASSIGNED TO ONE COUNTRY', { size: 13, weight: 700, fill: '#8fd2ca', spacing: 1 })}
    ${svgText(96, 1262, 'GLOBAL  Consumers International', { size: 18, weight: 700, fill: '#ffffff' })}
    ${svgText(490, 1262, 'EUROPE  BEUC · European Digital Rights (EDRi)', { size: 18, weight: 700, fill: '#ffffff' })}
    ${svgText(96, 1290, '3 records: 1 global network + 2 European networks', { size: 13, weight: 500, fill: '#cbd5e1' })}

    ${roundedRect(70, 1330, 1060, 108, '#efece4', COLORS.rule, 12)}
    ${multiline(92, 1362, [
      'METHOD  Marker position = approximate country centroid, not an office address. Counts describe the current source-backed catalog and are not exhaustive.',
      'Association data: PolicyWatcher Civic directory v1 · Basemap: Natural Earth 110m via world-atlas · Projection: Natural Earth 1.',
      'Inclusion does not imply partnership or endorsement.  ·  policywatcher.online/en/associations',
    ], { size: 12, weight: 600, fill: COLORS.muted, lineHeight: 25 })}
  `;
  return documentShell(body, logoData);
}

async function render(name: string, svg: string) {
  const svgPath = path.join(OUT_DIR, `${name}.svg`);
  const pngPath = path.join(OUT_DIR, `${name}.png`);
  await writeFile(svgPath, svg);
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(pngPath);
  return { svgPath, pngPath };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const logoData = (await readFile(LOGO_PATH)).toString('base64');
  const workflow = await render(
    'policywatcher-civic-editorial-workflow-2026-08-18',
    buildWorkflowSvg(logoData),
  );
  const map = await render(
    'policywatcher-civic-world-coverage-map-2026-08-18',
    await buildMapSvg(logoData),
  );
  console.log(JSON.stringify({ workflow, map }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
