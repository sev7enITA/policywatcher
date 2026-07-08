import fs from 'fs';
import path from 'path';

const OUT_DIR = path.join(process.cwd(), 'docs/media/policywatcher-architecture-infographics');
const SVG_DIR = path.join(OUT_DIR, 'slides');
const PNG_DIR = path.join(OUT_DIR, 'png');
const W = 1920;
const H = 1080;

fs.mkdirSync(SVG_DIR, { recursive: true });
fs.mkdirSync(PNG_DIR, { recursive: true });

const palette = {
  ink: '#101827',
  navy: '#162033',
  slate: '#526071',
  muted: '#7b8797',
  line: '#d7e0ea',
  paper: '#f7f9fc',
  white: '#ffffff',
  violet: '#6658f6',
  violet2: '#8b80ff',
  cyan: '#10b8d7',
  teal: '#16a085',
  green: '#14b878',
  amber: '#f39a18',
  red: '#ef4444',
  blue: '#2563eb',
};

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function baseDefs() {
  return `
  <defs>
    <linearGradient id="brandStroke" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="${palette.violet}"/>
      <stop offset="0.48" stop-color="${palette.cyan}"/>
      <stop offset="1" stop-color="${palette.green}"/>
    </linearGradient>
    <linearGradient id="warmStroke" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="${palette.amber}"/>
      <stop offset="1" stop-color="${palette.red}"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="20" flood-color="#132033" flood-opacity="0.13"/>
    </filter>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#132033" flood-opacity="0.09"/>
    </filter>
    <pattern id="grid" width="64" height="64" patternUnits="userSpaceOnUse">
      <path d="M64 0H0V64" fill="none" stroke="#dfe7f0" stroke-width="1" opacity="0.48"/>
      <path d="M32 0V64M0 32H64" fill="none" stroke="#ecf1f6" stroke-width="1" opacity="0.65"/>
    </pattern>
    <marker id="arrow" markerWidth="12" markerHeight="12" refX="9" refY="6" orient="auto">
      <path d="M2 2 L10 6 L2 10 Z" fill="${palette.violet}"/>
    </marker>
    <marker id="arrowCyan" markerWidth="12" markerHeight="12" refX="9" refY="6" orient="auto">
      <path d="M2 2 L10 6 L2 10 Z" fill="${palette.cyan}"/>
    </marker>
    <marker id="arrowAmber" markerWidth="12" markerHeight="12" refX="9" refY="6" orient="auto">
      <path d="M2 2 L10 6 L2 10 Z" fill="${palette.amber}"/>
    </marker>
  </defs>`;
}

function css() {
  return `
  <style>
    svg { background: ${palette.paper}; }
    .grid-bg { fill: url(#grid); opacity: .8; }
    .brand { font-family: Arial, Helvetica, sans-serif; }
    .serif { font-family: Georgia, serif; }
    .kicker { font-size: 24px; letter-spacing: 3px; text-transform: uppercase; fill: ${palette.violet}; font-weight: 800; }
    .title { font-size: 58px; font-weight: 850; fill: ${palette.ink}; letter-spacing: 0; }
    .subtitle { font-size: 25px; fill: ${palette.slate}; font-weight: 520; }
    .small { font-size: 18px; fill: ${palette.slate}; font-weight: 520; }
    .micro { font-size: 14px; fill: ${palette.muted}; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
    .node-title { font-size: 24px; fill: ${palette.ink}; font-weight: 820; }
    .node-sub { font-size: 18px; fill: ${palette.slate}; font-weight: 500; }
    .panel { fill: rgba(255,255,255,.92); stroke: ${palette.line}; stroke-width: 2; rx: 8; filter: url(#shadow); }
    .soft-panel { fill: rgba(255,255,255,.82); stroke: ${palette.line}; stroke-width: 2; rx: 8; filter: url(#soft); }
    .dark-panel { fill: ${palette.navy}; stroke: rgba(255,255,255,.16); stroke-width: 2; rx: 8; filter: url(#shadow); }
    .dark-title { fill: #fff; font-size: 25px; font-weight: 820; }
    .dark-sub { fill: #bdc9da; font-size: 17px; font-weight: 520; }
    .chip { fill: #eef1ff; stroke: #c8c3ff; stroke-width: 1.5; rx: 18; }
    .chip-text { fill: ${palette.violet}; font-size: 16px; font-weight: 800; }
    .wire { fill: none; stroke: ${palette.violet}; stroke-width: 4; stroke-linecap: round; marker-end: url(#arrow); }
    .wire-cyan { fill: none; stroke: ${palette.cyan}; stroke-width: 4; stroke-linecap: round; marker-end: url(#arrowCyan); }
    .wire-amber { fill: none; stroke: ${palette.amber}; stroke-width: 4; stroke-linecap: round; marker-end: url(#arrowAmber); }
    .faint-wire { fill: none; stroke: #c9d5e4; stroke-width: 3; stroke-linecap: round; }
    .pulse { animation: pulse 2.8s ease-in-out infinite; transform-origin: center; }
    .flow { stroke-dasharray: 12 18; animation: flow 5s linear infinite; }
    .float { animation: float 6s ease-in-out infinite; }
    .draw { stroke-dasharray: 900; stroke-dashoffset: 900; animation: draw 1.9s ease forwards; }
    @keyframes flow { to { stroke-dashoffset: -180; } }
    @keyframes pulse { 0%,100% { opacity: .65; transform: scale(1); } 50% { opacity: 1; transform: scale(1.035); } }
    @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
    @keyframes draw { to { stroke-dashoffset: 0; } }
  </style>`;
}

function svgShell({ id, kicker, title, subtitle, body }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="${id}-title ${id}-desc">
  <title id="${id}-title">${esc(title)}</title>
  <desc id="${id}-desc">${esc(subtitle)}</desc>
  ${baseDefs()}
  ${css()}
  <rect width="${W}" height="${H}" fill="${palette.paper}"/>
  <rect class="grid-bg" width="${W}" height="${H}"/>
  <g class="brand">
    ${brandHeader(kicker, title, subtitle)}
    ${body}
    ${footer()}
  </g>
</svg>`;
}

function wrapWords(text, maxChars) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function brandMark(x, y, scale = 1) {
  return `
  <g transform="translate(${x} ${y}) scale(${scale})">
    <rect x="0" y="0" width="54" height="54" rx="12" fill="#eef1ff" stroke="#cbc7ff" stroke-width="2"/>
    <path d="M15 35c7-18 19-18 24 0" fill="none" stroke="${palette.violet}" stroke-width="4" stroke-linecap="round"/>
    <circle cx="27" cy="22" r="8" fill="none" stroke="${palette.cyan}" stroke-width="4"/>
    <path d="M15 39h24" stroke="${palette.green}" stroke-width="4" stroke-linecap="round"/>
  </g>`;
}

function brandHeader(kicker, title, subtitle) {
  const titleLines = wrapWords(title, 34).slice(0, 2);
  const subtitleLines = wrapWords(subtitle, 68).slice(0, 2);
  const titleSvg = titleLines
    .map((line, i) => `<text x="94" y="${180 + i * 54}" class="title">${esc(line)}</text>`)
    .join('');
  const subtitleStart = titleLines.length > 1 ? 276 : 244;
  const subtitleSvg = subtitleLines
    .map((line, i) => `<text x="98" y="${subtitleStart + i * 30}" class="subtitle">${esc(line)}</text>`)
    .join('');
  return `
  ${brandMark(94, 64, 1)}
  <text x="165" y="86" class="micro">PolicyWatcher v3.5.1</text>
  <text x="165" y="124" class="kicker">${esc(kicker)}</text>
  ${titleSvg}
  ${subtitleSvg}
  <line x1="94" y1="324" x2="1826" y2="324" stroke="#d8e1ec" stroke-width="2"/>
  <rect x="1590" y="72" width="236" height="48" rx="24" fill="#ffffff" stroke="#d8e1ec" stroke-width="2"/>
  <circle cx="1622" cy="96" r="7" fill="${palette.green}"/>
  <text x="1640" y="102" class="small" style="font-weight:800; fill:${palette.ink};">Evidence-first diagrams</text>`;
}

function footer() {
  return `
  <text x="94" y="1014" class="micro">Source-backed evidence mapping, not certification</text>
  <text x="1826" y="1014" class="micro" text-anchor="end">Architecture infographics</text>`;
}

function panel(x, y, w, h, title, lines, color = palette.violet, dark = false) {
  const lineText = lines.map((line, i) => `<text x="${x + 28}" y="${y + 78 + i * 28}" class="${dark ? 'dark-sub' : 'node-sub'}">${esc(line)}</text>`).join('');
  return `
  <g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" class="${dark ? 'dark-panel' : 'soft-panel'}"/>
    <rect x="${x}" y="${y}" width="8" height="${h}" rx="4" fill="${color}"/>
    <text x="${x + 28}" y="${y + 42}" class="${dark ? 'dark-title' : 'node-title'}">${esc(title)}</text>
    ${lineText}
  </g>`;
}

function chip(x, y, text, w = 160, color = palette.violet) {
  return `
  <g>
    <rect x="${x}" y="${y}" width="${w}" height="38" rx="19" fill="#fff" stroke="${color}" stroke-width="2"/>
    <circle cx="${x + 22}" cy="${y + 19}" r="6" fill="${color}"/>
    <text x="${x + 38}" y="${y + 25}" class="chip-text" style="fill:${color};">${esc(text)}</text>
  </g>`;
}

function arrow(x1, y1, x2, y2, cls = 'wire', label = '') {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  return `
  <path d="M${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}" class="${cls} flow"/>
  ${label ? `<rect x="${midX - 86}" y="${midY - 21}" width="172" height="34" rx="17" fill="#fff" stroke="#d8e1ec"/><text x="${midX}" y="${midY + 3}" text-anchor="middle" class="micro">${esc(label)}</text>` : ''}`;
}

function iconGlobe(cx, cy, color = palette.violet) {
  return `<g transform="translate(${cx - 28} ${cy - 28})">
    <circle cx="28" cy="28" r="24" fill="none" stroke="${color}" stroke-width="4"/>
    <path d="M4 28h48M28 4c-9 9-9 39 0 48M28 4c9 9 9 39 0 48" fill="none" stroke="${color}" stroke-width="3"/>
  </g>`;
}

function iconServer(cx, cy, color = palette.violet) {
  return `<g transform="translate(${cx - 30} ${cy - 28})">
    <rect x="4" y="6" width="52" height="18" rx="5" fill="none" stroke="${color}" stroke-width="4"/>
    <rect x="4" y="32" width="52" height="18" rx="5" fill="none" stroke="${color}" stroke-width="4"/>
    <circle cx="44" cy="15" r="3" fill="${color}"/><circle cx="44" cy="41" r="3" fill="${color}"/>
  </g>`;
}

function iconShield(cx, cy, color = palette.green) {
  return `<g transform="translate(${cx - 30} ${cy - 32})">
    <path d="M30 5l22 8v18c0 16-10 25-22 31C18 56 8 47 8 31V13l22-8z" fill="none" stroke="${color}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M19 32l8 8 16-18" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  </g>`;
}

function iconDatabase(cx, cy, color = palette.cyan) {
  return `<g transform="translate(${cx - 30} ${cy - 32})">
    <ellipse cx="30" cy="14" rx="23" ry="9" fill="none" stroke="${color}" stroke-width="4"/>
    <path d="M7 14v36c0 5 10 9 23 9s23-4 23-9V14" fill="none" stroke="${color}" stroke-width="4"/>
    <path d="M7 32c0 5 10 9 23 9s23-4 23-9" fill="none" stroke="${color}" stroke-width="3"/>
  </g>`;
}

function iconCpu(cx, cy, color = palette.amber) {
  return `<g transform="translate(${cx - 30} ${cy - 30})">
    <rect x="14" y="14" width="32" height="32" rx="6" fill="none" stroke="${color}" stroke-width="4"/>
    <rect x="23" y="23" width="14" height="14" rx="3" fill="${color}" opacity=".22" stroke="${color}" stroke-width="3"/>
    <path d="M4 20h10M4 30h10M4 40h10M46 20h10M46 30h10M46 40h10M20 4v10M30 4v10M40 4v10M20 46v10M30 46v10M40 46v10" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
  </g>`;
}

function slideSystem() {
  const body = `
    <rect x="106" y="336" width="1708" height="600" rx="8" class="panel"/>
    <path d="M960 420l180 104v208L960 836 780 732V524z" fill="#ffffff" stroke="url(#brandStroke)" stroke-width="7" filter="url(#shadow)" class="pulse"/>
    ${brandMark(903, 552, 2.1)}
    <text x="960" y="750" text-anchor="middle" class="node-title">PolicyWatcher Core</text>
    <text x="960" y="784" text-anchor="middle" class="node-sub">Next.js app, APIs, evidence gate</text>

    ${panel(160, 380, 340, 145, 'Public workspace', ['Dashboard, timeline, signals', 'Public evidence only'], palette.violet)}
    ${panel(160, 690, 340, 145, 'Admin and auditor', ['Cron Manager, Dataset QA', 'Review and VPS operations'], palette.cyan)}
    ${panel(1420, 380, 340, 145, 'Policy sources', ['Official legal pages', 'Provider-owned documents'], palette.green)}
    ${panel(1420, 690, 340, 145, 'External intelligence', ['Gemini structured analysis', 'Wayback and Common Crawl'], palette.amber)}
    ${panel(725, 358, 470, 120, 'Production database', ['SQLite evidence store outside the deployed app root'], palette.cyan)}

    ${arrow(500, 452, 785, 566, 'wire', 'read')}
    ${arrow(500, 762, 785, 728, 'wire-cyan', 'operate')}
    ${arrow(1138, 566, 1420, 452, 'wire-cyan', 'fetch')}
    ${arrow(1138, 728, 1420, 762, 'wire-amber', 'analyze')}
    <path d="M960 478V836" class="faint-wire draw"/>
    ${iconGlobe(440, 350, palette.violet)}
    ${iconShield(440, 660, palette.cyan)}
    ${iconDatabase(1164, 410, palette.cyan)}
    ${iconCpu(1720, 660, palette.amber)}
  `;
  return svgShell({
    id: 'system-context',
    kicker: 'System context',
    title: 'One evidence workspace, multiple controlled services',
    subtitle: 'PolicyWatcher connects public inspection, admin operations, source retrieval, AI-assisted analysis and QA logs.',
    body,
  });
}

function slideTopology() {
  const body = `
    <rect x="106" y="332" width="820" height="600" rx="8" class="panel"/>
    <rect x="994" y="332" width="820" height="600" rx="8" class="panel"/>
    <text x="152" y="392" class="node-title">Hostinger application runtime</text>
    <text x="1040" y="392" class="node-title">VPS companion runtime</text>
    ${chip(152, 420, 'policywatcher.online', 230, palette.violet)}
    ${chip(1040, 420, '187.124.184.225', 220, palette.cyan)}

    ${panel(152, 500, 315, 118, 'Next.js app', ['Public UI, admin UI', 'API routes'], palette.violet)}
    ${panel(555, 500, 315, 118, 'SQLite DB', ['production.db', 'persistent data path'], palette.cyan)}
    ${panel(152, 680, 315, 118, 'Environment', ['Secrets stay server-side', 'DATABASE_URL, API keys'], palette.amber)}
    ${panel(555, 680, 315, 118, 'Public gate', ['publicEvidence', 'dataStatus filters'], palette.green)}

    ${panel(1040, 500, 315, 118, 'nginx + TLS', ['render and ops domains', 'reverse proxy'], palette.cyan)}
    ${panel(1448, 500, 315, 118, 'Renderer service', ['Playwright DOM retrieval', 'Bearer auth'], palette.violet)}
    ${panel(1040, 680, 315, 118, 'Operations agent', ['HMAC signed controls', 'backup and rollback'], palette.green)}
    ${panel(1448, 680, 315, 118, 'Versioned current', ['symlink release layout', 'packages and backups'], palette.amber)}

    ${arrow(467, 559, 555, 559, 'wire-cyan')}
    ${arrow(467, 740, 555, 740, 'wire-amber')}
    ${arrow(870, 560, 1040, 560, 'wire', 'render')}
    ${arrow(870, 742, 1040, 742, 'wire-cyan', 'ops')}
    ${arrow(1355, 559, 1448, 559, 'wire')}
    ${arrow(1355, 742, 1448, 742, 'wire-amber')}
  `;
  return svgShell({
    id: 'deployment-topology',
    kicker: 'Deployment topology',
    title: 'Separated application and retrieval control planes',
    subtitle: 'The app serves users and stores evidence; the VPS runs browser retrieval and controlled recovery operations.',
    body,
  });
}

function slideCascade() {
  const stages = [
    ['Direct', 'Hostinger HTTP', palette.violet, 'Socket-pinned client', 'SSRF and drift checks'],
    ['HTTP/2', 'Hostinger fallback', palette.cyan, 'Explicit h2 transport', 'Status and body validation'],
    ['Rendered', 'VPS Playwright', palette.green, 'DOM after script render', 'Bearer protected service'],
    ['Wayback', 'Archive recovery', palette.amber, 'Freshness guarded', 'Timestamp evidence'],
    ['Common Crawl', 'Archive recovery', palette.red, 'WARC recovery', 'Last fallback path'],
  ];
  const cards = stages.map((s, i) => {
    const x = 145 + i * 345;
    return `
      <g class="float" style="animation-delay:${i * 0.25}s">
        <rect x="${x}" y="430" width="275" height="310" rx="8" class="soft-panel"/>
        <rect x="${x}" y="430" width="275" height="9" rx="4" fill="${s[2]}"/>
        <circle cx="${x + 56}" cy="505" r="30" fill="${s[2]}" opacity=".13"/>
        <text x="${x + 56}" y="515" text-anchor="middle" class="node-title" style="fill:${s[2]};">${i + 1}</text>
        <text x="${x + 30}" y="585" class="node-title">${esc(s[0])}</text>
        <text x="${x + 30}" y="620" class="node-sub">${esc(s[1])}</text>
        <line x1="${x + 30}" y1="648" x2="${x + 245}" y2="648" stroke="#dce5ef"/>
        <text x="${x + 30}" y="690" class="node-sub">${esc(s[3])}</text>
        <text x="${x + 30}" y="724" class="node-sub">${esc(s[4])}</text>
      </g>
      ${i < stages.length - 1 ? `<path d="M${x + 275} 585H${x + 345}" class="wire flow"/>` : ''}`;
  }).join('');
  const body = `
    <rect x="106" y="334" width="1708" height="596" rx="8" class="panel"/>
    ${cards}
    <rect x="324" y="800" width="1272" height="66" rx="8" fill="#111827"/>
    <text x="360" y="841" class="dark-sub">Each strategy records outcome, HTTP status where available, rejection or failure reason, final URL and escalation path.</text>
    ${chip(144, 352, 'accept only substantive text', 270, palette.green)}
    ${chip(440, 352, 'suspend uncertain feeds', 250, palette.amber)}
    ${chip(710, 352, 'do not fabricate content', 250, palette.red)}
  `;
  return svgShell({
    id: 'ingestion-cascade',
    kicker: 'Ingestion cascade',
    title: 'Five retrieval strategies, one evidence decision',
    subtitle: 'A scan escalates only when the previous strategy fails, rejects, or produces incomplete source evidence.',
    body,
  });
}

function slideEvidenceGate() {
  const body = `
    <rect x="106" y="334" width="1708" height="596" rx="8" class="panel"/>
    <path d="M350 390H1570L1370 820H550z" fill="#fff" stroke="#d7e0ea" stroke-width="3" filter="url(#soft)"/>
    <path d="M430 460H1490" stroke="${palette.violet}" stroke-width="7" stroke-linecap="round"/>
    <path d="M500 560H1420" stroke="${palette.cyan}" stroke-width="7" stroke-linecap="round"/>
    <path d="M580 660H1340" stroke="${palette.green}" stroke-width="7" stroke-linecap="round"/>
    <path d="M665 760H1255" stroke="${palette.amber}" stroke-width="7" stroke-linecap="round"/>

    <text x="960" y="438" text-anchor="middle" class="node-title">Configured policy source</text>
    <text x="960" y="538" text-anchor="middle" class="node-title">dataStatus is Available or Reviewed</text>
    <text x="960" y="638" text-anchor="middle" class="node-title">publicEvidence snapshot exists</text>
    <text x="960" y="738" text-anchor="middle" class="node-title">publicEvidence change or baseline view</text>
    <text x="960" y="848" text-anchor="middle" class="title" style="font-size:38px;">Public exposure only after evidence gates pass</text>

    ${panel(140, 740, 320, 120, 'Suspended branch', ['Partial, Needs Review, Unavailable', 'Admin-only until review'], palette.red)}
    ${panel(1460, 740, 320, 120, 'Public branch', ['Dashboard, timeline, reports', 'Evidence-gated APIs'], palette.green)}
    ${arrow(530, 720, 460, 785, 'wire-amber')}
    ${arrow(1320, 720, 1460, 785, 'wire-cyan')}
    ${iconShield(960, 900, palette.green)}
  `;
  return svgShell({
    id: 'evidence-gate',
    kicker: 'Evidence gate',
    title: 'Public views are filtered by source confidence',
    subtitle: 'The database may contain pending, suspended and admin-only records; public routes expose only eligible evidence.',
    body,
  });
}

function slideRebaseline() {
  const body = `
    <rect x="106" y="334" width="1708" height="596" rx="8" class="panel"/>
    ${panel(150, 450, 330, 140, 'Verified first fetch', ['Substantive official source', 'Text hash and check log'], palette.green)}
    <path d="M620 410h680v180H620z" fill="#fff" stroke="url(#brandStroke)" stroke-width="4" rx="8" filter="url(#soft)"/>
    <text x="960" y="468" text-anchor="middle" class="node-title">Seed-only eligibility check</text>
    <text x="960" y="512" text-anchor="middle" class="node-sub">No source-evidence logs, no public snapshots, no reviewed change history</text>
    ${panel(610, 700, 360, 130, 'Re-baseline path', ['Replace placeholder history', 'No PolicyChange, no alert'], palette.cyan)}
    ${panel(1110, 700, 360, 130, 'Normal comparison', ['Hash changed means AI analysis', 'Public change only from evidence'], palette.violet)}
    ${arrow(480, 520, 620, 500, 'wire-cyan')}
    ${arrow(800, 590, 790, 700, 'wire-cyan', 'seed-only')}
    ${arrow(1120, 590, 1260, 700, 'wire', 'not seed-only')}
    <rect x="700" y="855" width="520" height="48" rx="24" fill="#fff7ed" stroke="#fed7aa"/>
    <text x="960" y="886" text-anchor="middle" class="small" style="fill:${palette.amber}; font-weight:850;">The timeline remains change-only, no placeholder-to-real-text events.</text>
  `;
  return svgShell({
    id: 'rebaseline-workflow',
    kicker: 'Re-baseline workflow',
    title: 'First real evidence does not become a false change',
    subtitle: 'The system protects historical evidence by separating initial baseline creation from market movement.',
    body,
  });
}

function slideQaLoop() {
  const centerX = 960;
  const centerY = 620;
  const items = [
    [960, 380, 'Inventory', ['Configured company', 'and policy sources'], palette.violet],
    [1310, 500, 'Scan', ['Least-recently checked', 'or targeted slug'], palette.cyan],
    [1310, 740, 'Evidence', ['HTTP status, hash', 'final URL, length'], palette.green],
    [960, 860, 'QA Review', ['Open, reviewed', 'ignored with reason'], palette.amber],
    [610, 740, 'Remediate', ['Fix source URL', 'or suspend explicitly'], palette.red],
    [610, 500, 'Publish Gate', ['publicEvidence', 'dataStatus filters'], palette.green],
  ];
  const nodes = items.map(([x, y, title, lines, color]) => panel(x - 150, y - 65, 300, 130, title, lines, color)).join('');
  const body = `
    <rect x="106" y="334" width="1708" height="596" rx="8" class="panel"/>
    <circle cx="${centerX}" cy="${centerY}" r="285" fill="none" stroke="#d7e0ea" stroke-width="18"/>
    <circle cx="${centerX}" cy="${centerY}" r="285" fill="none" stroke="url(#brandStroke)" stroke-width="8" stroke-dasharray="60 36" class="flow"/>
    ${nodes}
    <circle cx="${centerX}" cy="${centerY}" r="118" fill="#ffffff" stroke="url(#brandStroke)" stroke-width="5" filter="url(#shadow)"/>
    ${iconShield(centerX, centerY - 22, palette.green)}
    <text x="${centerX}" y="${centerY + 68}" text-anchor="middle" class="node-title">Dataset QA</text>
    <text x="${centerX}" y="${centerY + 99}" text-anchor="middle" class="node-sub">control loop</text>
  `;
  return svgShell({
    id: 'dataset-qa-loop',
    kicker: 'Dataset QA lifecycle',
    title: 'Quality is an operating loop, not a static badge',
    subtitle: 'PolicyWatcher records source diagnostics, review decisions and remediation actions before public exposure.',
    body,
  });
}

function slideAdminOps() {
  const body = `
    <rect x="106" y="334" width="1708" height="596" rx="8" class="panel"/>
    <rect x="150" y="395" width="740" height="435" rx="8" class="dark-panel"/>
    <text x="195" y="455" class="dark-title">Admin control plane</text>
    <text x="195" y="492" class="dark-sub">Authenticated operations, audit logs and QA controls</text>
    ${panel(195, 540, 280, 98, 'Cron Manager', ['batch scans, live diagnostics'], palette.cyan, true)}
    ${panel(545, 540, 280, 98, 'Dataset QA', ['findings, reviews, CSV export'], palette.green, true)}
    ${panel(195, 680, 280, 98, 'Company Registry', ['source CRUD, non-public until scan'], palette.amber, true)}
    ${panel(545, 680, 280, 98, 'Access Logs', ['login events, config errors'], palette.violet, true)}

    <rect x="1030" y="395" width="740" height="435" rx="8" class="soft-panel"/>
    <text x="1076" y="455" class="node-title">VPS services</text>
    <text x="1076" y="492" class="node-sub">Separate operational services outside Hostinger</text>
    ${panel(1076, 540, 280, 98, 'Renderer VPS', ['health, active renders, smoke'], palette.violet)}
    ${panel(1426, 540, 280, 98, 'Ops Agent', ['HMAC status, backup, rollback'], palette.green)}
    ${panel(1076, 680, 280, 98, 'Versioned current', ['symlink releases'], palette.cyan)}
    ${panel(1426, 680, 280, 98, 'Recovery store', ['packages and backups'], palette.amber)}
    ${arrow(890, 610, 1030, 610, 'wire-cyan', 'status')}
    ${arrow(890, 742, 1030, 742, 'wire-amber', 'ops')}
  `;
  return svgShell({
    id: 'admin-vps-ops',
    kicker: 'Admin and VPS operations',
    title: 'A control room for scans, QA and recovery',
    subtitle: 'The admin panel operates the dataset and monitors companion services without exposing shell access.',
    body,
  });
}

function slideDataModel() {
  const body = `
    <rect x="106" y="334" width="1708" height="596" rx="8" class="panel"/>
    ${panel(160, 400, 290, 112, 'Company', ['name, slug, industry', 'website'], palette.violet)}
    ${panel(560, 400, 290, 112, 'Policy', ['url, jurisdiction', 'status, ingestion method'], palette.cyan)}
    ${panel(960, 400, 290, 112, 'Snapshot', ['version, hash', 'publicEvidence'], palette.green)}
    ${panel(1360, 400, 290, 112, 'PolicyChange', ['diff, AI summary', 'risk, KPIs, evidence'], palette.amber)}
    ${panel(560, 650, 290, 112, 'CheckLog', ['source, HTTP status', 'final URL, text length'], palette.green)}
    ${panel(960, 650, 290, 112, 'RegionImpact', ['EU, US, Global', 'Individual, Enterprise'], palette.violet)}
    ${panel(1360, 650, 290, 112, 'Review Logs', ['QA decisions', 'access events'], palette.red)}
    ${arrow(450, 456, 560, 456, 'wire')}
    ${arrow(850, 456, 960, 456, 'wire-cyan')}
    ${arrow(1250, 456, 1360, 456, 'wire-amber')}
    ${arrow(705, 512, 705, 650, 'wire-cyan')}
    ${arrow(1105, 512, 1105, 650, 'wire')}
    ${arrow(1505, 512, 1505, 650, 'wire-amber')}
    <rect x="176" y="820" width="1568" height="54" rx="8" fill="#eef1ff" stroke="#c8c3ff"/>
    <text x="960" y="854" text-anchor="middle" class="small" style="fill:${palette.violet}; font-weight:850;">The model separates configured inventory, retrieval evidence, snapshots, public changes, regional impact and audit history.</text>
  `;
  return svgShell({
    id: 'data-model',
    kicker: 'Data model',
    title: 'Evidence is stored as linked operational records',
    subtitle: 'The schema keeps inventory, source telemetry, snapshots, changes and review history separate.',
    body,
  });
}

function slideSecurity() {
  const body = `
    <rect x="106" y="334" width="1708" height="596" rx="8" class="panel"/>
    <rect x="164" y="410" width="420" height="390" rx="8" fill="#fff" stroke="${palette.line}" stroke-width="2"/>
    <rect x="750" y="410" width="420" height="390" rx="8" fill="#fff" stroke="${palette.line}" stroke-width="2"/>
    <rect x="1336" y="410" width="420" height="390" rx="8" fill="#fff" stroke="${palette.line}" stroke-width="2"/>
    ${iconGlobe(374, 500, palette.violet)}
    ${iconShield(960, 500, palette.green)}
    ${iconServer(1546, 500, palette.cyan)}
    <text x="374" y="590" text-anchor="middle" class="node-title">Public boundary</text>
    <text x="374" y="628" text-anchor="middle" class="node-sub">read-only, evidence-gated</text>
    <text x="374" y="662" text-anchor="middle" class="node-sub">no seeded data in production</text>
    <text x="960" y="590" text-anchor="middle" class="node-title">Admin boundary</text>
    <text x="960" y="628" text-anchor="middle" class="node-sub">session cookie and roles</text>
    <text x="960" y="662" text-anchor="middle" class="node-sub">review and access logs</text>
    <text x="1546" y="590" text-anchor="middle" class="node-title">Retrieval boundary</text>
    <text x="1546" y="628" text-anchor="middle" class="node-sub">SSRF guard and URL validation</text>
    <text x="1546" y="662" text-anchor="middle" class="node-sub">sanitized external errors</text>
    ${arrow(584, 610, 750, 610, 'wire-cyan', 'auth')}
    ${arrow(1170, 610, 1336, 610, 'wire', 'server-side secrets')}
    <rect x="420" y="845" width="1080" height="54" rx="8" fill="#ecfeff" stroke="#a5f3fc"/>
    <text x="960" y="879" text-anchor="middle" class="small" style="fill:#0e7490; font-weight:850;">Public inspection, admin authority and retrieval capability remain separate trust zones.</text>
  `;
  return svgShell({
    id: 'security-boundaries',
    kicker: 'Security boundaries',
    title: 'Trust is enforced at route, data and service boundaries',
    subtitle: 'Secrets stay server-side, admin operations are logged, and retrieval paths are constrained.',
    body,
  });
}

function slideKpiLifecycle() {
  const body = `
    <rect x="106" y="334" width="1708" height="596" rx="8" class="panel"/>
    ${panel(145, 465, 310, 145, 'Verified baseline', ['Source-backed snapshot', 'No fake change event'], palette.green)}
    ${panel(545, 465, 310, 145, 'Assessment pending', ['Valid baseline, no KPI yet', 'Visible in admin QA'], palette.amber)}
    ${panel(945, 465, 310, 145, 'Real change', ['Hash differs from baseline', 'Gemini structured analysis'], palette.violet)}
    ${panel(1345, 465, 310, 145, 'KPI matrix', ['15 normalized fields', 'Public only when assessed'], palette.cyan)}
    ${arrow(455, 538, 545, 538, 'wire-amber')}
    ${arrow(855, 538, 945, 538, 'wire')}
    ${arrow(1255, 538, 1345, 538, 'wire-cyan')}
    <g transform="translate(250 730)">
      ${['Data', 'Sharing', 'Retention', 'Deletion', 'Transfer', 'AI opt-out', 'Ownership', 'Algo', 'Auto', 'Bias', 'Consent', 'Compliance', 'Breach', 'Audit', 'Moderation'].map((label, i) => {
        const x = (i % 5) * 282;
        const y = Math.floor(i / 5) * 56;
        const colors = [palette.violet, palette.cyan, palette.green, palette.amber, palette.red];
        return `<rect x="${x}" y="${y}" width="240" height="36" rx="18" fill="#fff" stroke="${colors[i % colors.length]}" stroke-width="2"/><text x="${x + 120}" y="${y + 24}" text-anchor="middle" class="micro" style="fill:${colors[i % colors.length]};">${esc(label)}</text>`;
      }).join('')}
    </g>
  `;
  return svgShell({
    id: 'kpi-lifecycle',
    kicker: 'KPI lifecycle',
    title: 'Baseline evidence and KPI assessment are separate states',
    subtitle: 'The matrix is populated by source-backed AI assessments, not by seeded placeholders or unverified defaults.',
    body,
  });
}

const slides = [
  ['01-system-context.svg', 'System Context', slideSystem()],
  ['02-deployment-topology.svg', 'Runtime Deployment Topology', slideTopology()],
  ['03-ingestion-cascade.svg', 'Policy Ingestion Cascade', slideCascade()],
  ['04-evidence-gate.svg', 'Evidence Gate', slideEvidenceGate()],
  ['05-rebaseline-workflow.svg', 'Re-baseline Workflow', slideRebaseline()],
  ['06-dataset-qa-loop.svg', 'Dataset QA Loop', slideQaLoop()],
  ['07-admin-vps-ops.svg', 'Admin and VPS Operations', slideAdminOps()],
  ['08-data-model.svg', 'Data Model', slideDataModel()],
  ['09-security-boundaries.svg', 'Security Boundaries', slideSecurity()],
  ['10-kpi-lifecycle.svg', 'KPI Assessment Lifecycle', slideKpiLifecycle()],
];

const customPngSlides = [
  ['png/11-view-correlation-matrix.png', 'View Correlation Matrix'],
  ['png/12-unified-evidence-flow.png', 'Unified Evidence Flow'],
  ['png/13-control-trust-map.png', 'Control and Trust Map'],
];

const presentationSlides = [
  ...slides.map(([fileName, title]) => ({
    source: `slides/${fileName}`,
    title,
    downloadLabel: 'Download SVG',
  })),
  ...customPngSlides.map(([source, title]) => ({
    source,
    title,
    downloadLabel: 'Download PNG',
  })),
];

for (const [fileName, , svg] of slides) {
  fs.writeFileSync(path.join(SVG_DIR, fileName), svg, 'utf8');
}

const indexCards = presentationSlides.map(({ source, title, downloadLabel }, index) => `
  <article class="card" id="slide-${index + 1}">
    <div class="card-head">
      <span>${String(index + 1).padStart(2, '0')}</span>
      <h2>${esc(title)}</h2>
      <a href="${source}" download>${downloadLabel}</a>
    </div>
    <img src="${source}" alt="${esc(title)} infographic" loading="${index < 2 ? 'eager' : 'lazy'}">
  </article>`).join('\n');

const deckFrames = presentationSlides.map(({ source, title }, index) => `
  <section class="frame" data-title="${esc(title)}">
    <img src="${source}" alt="${esc(title)}">
    <div class="frame-label"><span>${String(index + 1).padStart(2, '0')}</span>${esc(title)}</div>
  </section>`).join('\n');

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>PolicyWatcher Architecture Infographics</title>
  <style>
    :root {
      --ink: ${palette.ink};
      --paper: ${palette.paper};
      --line: ${palette.line};
      --violet: ${palette.violet};
      --cyan: ${palette.cyan};
      --green: ${palette.green};
      --amber: ${palette.amber};
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #eef3f8;
      color: var(--ink);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    header {
      min-height: 42vh;
      display: grid;
      align-content: end;
      padding: 72px clamp(24px, 6vw, 110px);
      background:
        linear-gradient(90deg, rgba(102,88,246,.14), rgba(16,184,215,.12), rgba(20,184,120,.12)),
        repeating-linear-gradient(0deg, transparent 0 63px, rgba(16,24,39,.07) 64px),
        repeating-linear-gradient(90deg, transparent 0 63px, rgba(16,24,39,.07) 64px),
        #f8fbff;
      border-bottom: 1px solid var(--line);
    }
    .eyebrow {
      letter-spacing: .22em;
      text-transform: uppercase;
      color: var(--violet);
      font-weight: 850;
      font-size: 13px;
    }
    h1 {
      max-width: 1120px;
      margin: 18px 0 16px;
      font-size: clamp(42px, 6vw, 92px);
      line-height: .96;
      letter-spacing: 0;
    }
    .intro {
      max-width: 900px;
      font-size: 20px;
      line-height: 1.5;
      color: #526071;
      margin: 0;
    }
    .toolbar {
      position: sticky;
      top: 0;
      z-index: 10;
      display: flex;
      gap: 12px;
      overflow-x: auto;
      padding: 14px clamp(24px, 6vw, 110px);
      background: rgba(247,249,252,.86);
      backdrop-filter: blur(18px);
      border-bottom: 1px solid var(--line);
    }
    .toolbar a {
      white-space: nowrap;
      text-decoration: none;
      color: var(--ink);
      font-weight: 750;
      border: 1px solid var(--line);
      background: white;
      padding: 9px 13px;
      border-radius: 8px;
    }
    main {
      padding: 36px clamp(18px, 4vw, 70px) 80px;
    }
    .card {
      max-width: 1500px;
      margin: 0 auto 44px;
      background: white;
      border: 1px solid var(--line);
      border-radius: 8px;
      box-shadow: 0 18px 50px rgba(16,24,39,.10);
      overflow: hidden;
    }
    .card-head {
      display: flex;
      align-items: center;
      gap: 18px;
      padding: 18px 22px;
      border-bottom: 1px solid var(--line);
    }
    .card-head span {
      color: var(--violet);
      font-weight: 900;
      letter-spacing: .16em;
    }
    .card-head h2 {
      margin: 0;
      flex: 1;
      font-size: 18px;
    }
    .card-head a {
      color: var(--violet);
      font-weight: 800;
      text-decoration: none;
    }
    .card img {
      display: block;
      width: 100%;
      height: auto;
      background: var(--paper);
    }
    .deck {
      display: grid;
      gap: 36px;
      max-width: 1600px;
      margin: 0 auto 70px;
    }
    .frame {
      position: relative;
      aspect-ratio: 16 / 9;
      overflow: hidden;
      border-radius: 8px;
      border: 1px solid var(--line);
      background: white;
      box-shadow: 0 20px 60px rgba(16,24,39,.14);
    }
    .frame img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .frame-label {
      position: absolute;
      left: 20px;
      bottom: 20px;
      display: flex;
      gap: 10px;
      align-items: center;
      padding: 10px 14px;
      color: white;
      background: rgba(16,24,39,.78);
      border: 1px solid rgba(255,255,255,.18);
      border-radius: 8px;
      font-weight: 800;
      backdrop-filter: blur(10px);
    }
    .frame-label span { color: #a5f3fc; letter-spacing: .12em; }
    @media (max-width: 760px) {
      header { padding: 54px 22px; }
      main { padding: 24px 12px 60px; }
      .card-head { align-items: flex-start; flex-direction: column; }
      .toolbar { padding-inline: 12px; }
    }
  </style>
</head>
<body>
  <header>
    <div class="eyebrow">PolicyWatcher v3.5.1</div>
    <h1>Architecture and workflow infographics</h1>
    <p class="intro">A visual set for explaining retrieval, evidence gates, Dataset QA, admin operations, VPS services, data model and KPI lifecycle without certification claims.</p>
  </header>
  <nav class="toolbar">
    ${presentationSlides.map(({ title }, index) => `<a href="#slide-${index + 1}">${String(index + 1).padStart(2, '0')} ${esc(title)}</a>`).join('\n    ')}
  </nav>
  <main>
    ${indexCards}
    <section class="deck" aria-label="Presentation frames">
      ${deckFrames}
    </section>
  </main>
</body>
</html>`;

fs.writeFileSync(path.join(OUT_DIR, 'index.html'), html, 'utf8');

const deckHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>PolicyWatcher Architecture Deck</title>
  <style>
    html, body { margin: 0; width: 100%; height: 100%; overflow: hidden; background: #101827; font-family: Inter, system-ui, sans-serif; }
    .track { height: 100vh; display: flex; overflow-x: auto; scroll-snap-type: x mandatory; scroll-behavior: smooth; }
    section { flex: 0 0 100vw; height: 100vh; display: grid; place-items: center; scroll-snap-align: start; position: relative; }
    img { width: 100vw; height: 100vh; object-fit: contain; background: #f7f9fc; }
    .hud { position: fixed; left: 28px; right: 28px; bottom: 22px; display: flex; justify-content: space-between; align-items: center; color: white; pointer-events: none; }
    .hud span { background: rgba(16,24,39,.72); border: 1px solid rgba(255,255,255,.2); padding: 10px 14px; border-radius: 8px; backdrop-filter: blur(12px); font-weight: 800; }
  </style>
</head>
<body>
  <div class="track">
    ${presentationSlides.map(({ source, title }, index) => `<section><img src="${source}" alt="${esc(title)}"><div class="hud"><span>${String(index + 1).padStart(2, '0')} ${esc(title)}</span><span>Scroll horizontally</span></div></section>`).join('\n    ')}
  </div>
</body>
</html>`;

fs.writeFileSync(path.join(OUT_DIR, 'deck.html'), deckHtml, 'utf8');

console.log(`Generated ${slides.length} SVG infographics in ${SVG_DIR}`);
console.log(`Integrated ${customPngSlides.length} custom PNG slides from ${PNG_DIR}`);
console.log(`Gallery: ${path.join(OUT_DIR, 'index.html')}`);
console.log(`Deck: ${path.join(OUT_DIR, 'deck.html')}`);
