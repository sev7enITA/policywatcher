#!/usr/bin/env node

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sitemapPath = path.join(repoRoot, 'src/app/sitemap.ts');
const docsDir = path.join(repoRoot, 'docs');

const DOMAINS = [
  {
    id: 'monitor',
    label: 'Monitor',
    relation: 'ORIENTA',
    routes: ['/', '/observatory', '/timeline', '/what-changed', '/leaderboard'],
  },
  {
    id: 'evidence',
    label: 'Evidence',
    relation: 'PUBBLICA',
    routes: ['/evidence', '/collections'],
  },
  {
    id: 'civic',
    label: 'Civic',
    relation: 'ORIENTA',
    routes: ['/associazioni'],
  },
  {
    id: 'trust-method',
    label: 'Trust & Method',
    relation: 'VERIFICA',
    routes: ['/trust', '/trust/residency', '/methodology/confidence', '/security', '/privacy', '/terms'],
  },
  {
    id: 'build-integrate',
    label: 'Build & Integrate',
    relation: 'PUBBLICA',
    routes: ['/developers', '/developers/event-continuity', '/developers/webhook-readiness', '/integrations', '/browser-extension'],
  },
  {
    id: 'communicate',
    label: 'Communicate',
    relation: 'PUBBLICA',
    routes: ['/press', '/press-kit', '/pulse', '/press-kit/releases', '/press-kit/data', '/press-kit/reference', '/press-kit/corrections', '/press-kit/glossary'],
  },
  {
    id: 'understand',
    label: 'Understand',
    relation: 'SPIEGA',
    routes: ['/showcase', '/atlas', '/feature-atlas', '/infographics', '/roadmap', '/about'],
  },
];

const DYNAMIC_FAMILIES = [
  { id: 'change', domain: 'monitor', route: '/change/{changeId}', entity: 'PolicyChange' },
  { id: 'knowledge', domain: 'evidence', route: '/knowledge → /companies/{slug} → /policies/{policyId}', entity: 'Company + Policy' },
  { id: 'release', domain: 'communicate', route: '/press-kit/releases/{slug}', entity: 'PressRelease' },
  { id: 'pulse', domain: 'communicate', route: '/pulse/{slug}', entity: 'PulseStory' },
];

function extractStaticRoutes(source) {
  const staticBlock = source.match(/const staticEntries:[\s\S]*?= \[([\s\S]*?)\n  \];/u)?.[1];
  if (!staticBlock) throw new Error('Unable to locate static sitemap entries.');
  return [...staticBlock.matchAll(/url: `\$\{BASE_URL\}(\/[^`]*)`/gu)].map((match) => match[1]);
}

function buildMermaid(staticRoutes) {
  const domainRows = DOMAINS.map((domain) => `  DOMAIN_${domain.id.replaceAll('-', '_')} {
    string id "${domain.id}"
    string label "${domain.label}"
    int static_routes "${domain.routes.length}"
    string relationship "${domain.relation}"
  }`).join('\n');

  const relationships = DOMAINS.map((domain) => (
    `  EXPERIENCE ||--o{ DOMAIN_${domain.id.replaceAll('-', '_')} : "${domain.relation}"`
  )).join('\n');

  return `erDiagram
  EXPERIENCE {
    string product "PolicyWatcher"
    string region "Global context"
    string language "EN or IT"
    string workspace "Intent + depth"
  }
  STATIC_ROUTE {
    string pathname
    string change_frequency
    float priority
  }
  DYNAMIC_FAMILY {
    string route_pattern
    string entity_type
    string evidence_gate
  }
${domainRows}
${relationships}
  EXPERIENCE ||--o{ STATIC_ROUTE : "espone ${staticRoutes.length} entry"
  EXPERIENCE ||--o{ DYNAMIC_FAMILY : "indicizza ${DYNAMIC_FAMILIES.length} famiglie"
  STATIC_ROUTE }o--|| DYNAMIC_FAMILY : "conduce a"
`;
}

function buildMarkdown(staticRoutes) {
  const domainSections = DOMAINS.map((domain) => (
    `### ${domain.label}\n\nRelazione con l’esperienza: **${domain.relation}**.\n\n${domain.routes.map((route) => `- \`${route}\``).join('\n')}`
  )).join('\n\n');

  const dynamicRows = DYNAMIC_FAMILIES.map((family) => (
    `| ${family.id} | \`${family.route}\` | ${family.entity} | ${DOMAINS.find((domain) => domain.id === family.domain)?.label} |`
  )).join('\n');

  return `# PolicyWatcher sitemap ER – agosto 2026

Il modello separa l’esperienza globale dai sette domini informativi. Le **${staticRoutes.length} route statiche** provengono direttamente da \`src/app/sitemap.ts\`; le quattro famiglie dinamiche descrivono entità indicizzate solo quando superano i rispettivi gate pubblici.

## Grafo ER

\`\`\`mermaid
${buildMermaid(staticRoutes)}\`\`\`

## Domini e route

${domainSections}

## Famiglie dinamiche

| Famiglia | Pattern | Entità | Dominio |
| --- | --- | --- | --- |
${dynamicRows}

## Asset editoriale

- PNG sorgente: \`public/infographics/policywatcher-experience-map-er-sitemap-2026-08.png\`
- WebP ottimizzato: \`public/infographics/policywatcher-experience-map-er-sitemap-2026-08.webp\`

Il poster rappresenta l’architettura editoriale; il file Mermaid e l’inventario JSON restano la fonte esatta per route e relazioni.
`;
}

const source = await readFile(sitemapPath, 'utf8');
const staticRoutes = extractStaticRoutes(source);
const categorizedRoutes = DOMAINS.flatMap((domain) => domain.routes);
const missing = staticRoutes.filter((route) => !categorizedRoutes.includes(route));
const extra = categorizedRoutes.filter((route) => !staticRoutes.includes(route));

if (new Set(staticRoutes).size !== staticRoutes.length) {
  throw new Error('Static sitemap contains duplicate routes.');
}
if (missing.length || extra.length) {
  throw new Error(`Sitemap taxonomy drift. Missing: ${missing.join(', ') || 'none'}. Extra: ${extra.join(', ') || 'none'}.`);
}
if (staticRoutes.length !== 33 || DOMAINS.length !== 7 || DYNAMIC_FAMILIES.length !== 4) {
  throw new Error(`Unexpected map cardinality: ${staticRoutes.length} static, ${DOMAINS.length} domains, ${DYNAMIC_FAMILIES.length} dynamic families.`);
}

await mkdir(docsDir, { recursive: true });
await Promise.all([
  writeFile(path.join(docsDir, 'sitemap-er-2026-08-07.mmd'), `${buildMermaid(staticRoutes)}\n`),
  writeFile(path.join(docsDir, 'sitemap-er-2026-08-07.md'), buildMarkdown(staticRoutes)),
  writeFile(path.join(docsDir, 'sitemap-er-2026-08-07.json'), `${JSON.stringify({
    generatedAt: '2026-08-07',
    staticRouteCount: staticRoutes.length,
    domainCount: DOMAINS.length,
    dynamicFamilyCount: DYNAMIC_FAMILIES.length,
    domains: DOMAINS,
    dynamicFamilies: DYNAMIC_FAMILIES,
  }, null, 2)}\n`),
]);

console.log(`Generated sitemap ER: ${staticRoutes.length} static routes, ${DOMAINS.length} domains, ${DYNAMIC_FAMILIES.length} dynamic families.`);
