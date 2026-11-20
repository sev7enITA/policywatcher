import { createHash } from 'node:crypto';
import {
  copyFileSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  utimesSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  Link,
  renderToFile,
} from '@react-pdf/renderer';

const root = path.resolve(import.meta.dirname, '..');
const press = path.join(root, 'public/press-kit');
const date = '2026-11-20';
const version = JSON.parse(
  readFileSync(path.join(root, 'package.json')),
).version;
const stamp = new Date(date + 'T12:00:00Z');
const site = 'https://policywatcher.online';
const edition = {
  en: {
    title: 'A guide to Policy Briefing',
    intro:
      'Filter by service and topic, then follow the matching words back to the published change and its source.',
    label:
      'Public release 5.5.0: 2 November 2026. Press edition: 20 November 2026.',
    sections: [
      [
        'Find a clause',
        'Choose a service and a topic. The briefing shows which words matched an excerpt or a summary. Read the comparison in context: “training” can also appear in a promise never to train on your data.',
      ],
      [
        'Review a supplier',
        'Keep the responsible role, due date and status in the current browser. Exports omit those notes by default. Only loaded pages are included. Shared assignments, a central audit log and automatic notifications are outside this workflow.',
      ],
      [
        'Press coverage',
        'The public register contains six references, including the original articles from Economy Magazine (19 November) and Fortune Italia (18 November).',
      ],
      [
        'Engine 6 research',
        'The private r3 preview is separate from the public scanner. The 17 November update records 397 of 500 extractions locally and 367 of 500 in an isolated hosted trial. These trials have yet to demonstrate daily throughput or semantic accuracy.',
      ],
    ],
    links: [
      'Open the briefing',
      'Read the press coverage',
      'See the research results',
    ],
  },
  it: {
    title: 'Guida al Briefing policy',
    intro:
      'Seleziona un servizio e un tema, poi risali dalle parole evidenziate al confronto fra versioni e alla fonte originale.',
    label:
      'Release pubblica 5.5.0 del 2 novembre 2026. Edizione stampa del 20 novembre 2026.',
    sections: [
      [
        'Trova una clausola',
        'Scegli un servizio e un tema. Il briefing mostra le parole trovate in un estratto o in una sintesi. Leggi il confronto nel suo contesto: «addestramento» può comparire anche in un impegno a escludere i tuoi dati.',
      ],
      [
        'Verifica un fornitore',
        'Conserva ruolo responsabile, scadenza e stato nel browser in uso. Le esportazioni escludono questi dati per impostazione predefinita. Il briefing riguarda le sole pagine caricate. Assegnazioni condivise, registro centrale e notifiche automatiche restano fuori da questo flusso.',
      ],
      [
        'Rassegna stampa',
        'Il registro pubblico comprende sei segnalazioni, tra cui gli articoli originali di Economy Magazine (19 novembre) e Fortune Italia (18 novembre).',
      ],
      [
        'Ricerca su Engine 6',
        'La preview privata r3 è separata dallo scanner pubblico. Il riepilogo del 17 novembre documenta 397 estrazioni su 500 in locale e 367 su 500 in una prova isolata sul server. La capacità giornaliera e la correttezza delle interpretazioni restano da dimostrare.',
      ],
    ],
    links: [
      'Apri il briefing',
      'Consulta la rassegna',
      'Leggi i risultati della ricerca',
    ],
  },
};
const file = (name) => path.join(press, name);
const manifest = JSON.parse(readFileSync(file('asset-manifest.json')));
const previous = JSON.parse(readFileSync(file('package-manifest.json')));
const revision = process.argv[2] || previous.distribution.revision;
if (!/^[a-f0-9]{40}$/.test(revision))
  throw Error('Supply an immutable Git revision for distribution.');
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const h = React.createElement;
const common = manifest.assets.filter((a) =>
  /^(policywatcher-logo-|policywatcher-wordmark-|fabrizio-degni-portrait-200.png$)/.test(
    a.filename,
  ),
);
manifest.assets = manifest.assets.filter(
  (asset) =>
    !Object.keys(edition).some((locale) =>
      [
        'policywatcher-fact-sheet-' + locale + '-' + date + '.txt',
        'policywatcher-fact-sheet-' + locale + '-' + date + '.pdf',
        'policywatcher-briefing-' + locale + '-' + date + '.webp',
      ].includes(asset.filename),
    ),
);
const packages = [];
for (const [lang, copy] of Object.entries(edition)) {
  const sheet = 'policywatcher-fact-sheet-' + lang + '-' + date;
  const screen = 'policywatcher-briefing-' + lang + '-' + date + '.webp';
  const links = [
    '/briefing',
    '/press',
    '/press-kit/releases/engine-six-progress-november-2026',
  ].map((p) => site + p + '?lang=' + lang);
  const plain =
    [
      'PolicyWatcher',
      copy.title,
      copy.label,
      '',
      copy.intro,
      '',
      ...copy.sections.flatMap((section) => [...section, '']),
      ...copy.links.map((label, i) => label + ' | ' + links[i]),
    ].join('\n') + '\n';
  writeFileSync(file(sheet + '.txt'), plain);
  const doc = h(
    Document,
    {
      title: copy.title,
      author: 'PolicyWatcher / Fabrizio Degni',
      language: lang,
      creationDate: stamp,
      modificationDate: stamp,
    },
    h(
      Page,
      {
        size: 'A4',
        style: {
          padding: 48,
          fontFamily: 'Helvetica',
          fontSize: 11,
          color: '#193247',
        },
      },
      h(Text, { style: { fontSize: 13, color: '#116760' } }, 'PolicyWatcher'),
      h(
        Text,
        {
          style: { fontFamily: 'Helvetica-Bold', fontSize: 29, marginTop: 14 },
        },
        copy.title,
      ),
      h(Text, { style: { fontSize: 9, marginTop: 9 } }, copy.label),
      h(Text, { style: { fontSize: 15, marginVertical: 18 } }, copy.intro),
      ...copy.sections.map(([title, body]) =>
        h(
          View,
          { key: title, style: { marginBottom: 14 } },
          h(
            Text,
            {
              style: {
                fontSize: 13,
                fontFamily: 'Helvetica-Bold',
                marginBottom: 4,
              },
            },
            title,
          ),
          h(Text, { style: { lineHeight: 1.4 } }, body),
        ),
      ),
      ...copy.links.map((label, i) =>
        h(
          Link,
          {
            key: label,
            src: links[i],
            style: { fontSize: 10, marginBottom: 5, color: '#116760' },
          },
          label,
        ),
      ),
    ),
  );
  await renderToFile(doc, file(sheet + '.pdf'));
  const assets = [
    [sheet + '.pdf', 'application/pdf'],
    [sheet + '.txt', 'text/plain'],
    [screen, 'image/webp'],
  ].map(([filename, mediaType]) => {
    const bytes = readFileSync(file(filename));
    return {
      filename,
      mediaType,
      dimensions: filename === screen ? '1280 x 900 px' : null,
      bytes: bytes.length,
      sha256: digest(bytes),
      creditLine: 'PolicyWatcher / Fabrizio Degni',
      rightsUrl: '/press-kit/LICENSE-ASSETS.md',
      metadataStandard: 'document-manifest',
      contentCredentials: 'not-attached',
    };
  });
  manifest.assets.push(...assets);
  const stage = mkdtempSync(path.join(tmpdir(), 'pw-editorial-'));
  try {
    const included = [...common, ...assets];
    const names = included.map((a) => a.filename);
    for (const name of [...names, 'LICENSE-ASSETS.md'])
      copyFileSync(file(name), path.join(stage, name));
    writeFileSync(
      path.join(stage, 'asset-manifest.json'),
      JSON.stringify(
        { ...manifest, generatedAt: date, release: version, assets: included },
        null,
        2,
      ) + '\n',
    );
    writeFileSync(
      path.join(stage, 'README.md'),
      [
        copy.title,
        copy.label,
        'PolicyWatcher / Fabrizio Degni',
        ...links,
        'LICENSE-ASSETS.md',
        'asset-manifest.json',
      ].join('\n') + '\n',
    );
    names.push('asset-manifest.json', 'LICENSE-ASSETS.md', 'README.md');
    for (const name of names) utimesSync(path.join(stage, name), stamp, stamp);
    const filename =
      'policywatcher-press-package-' + lang + '-' + date + '.zip';
    rmSync(file(filename), { force: true });
    execFileSync('zip', ['-X', '-q', file(filename), ...names.sort()], {
      cwd: stage,
      env: { ...process.env, TZ: 'UTC' },
    });
    const bytes = readFileSync(file(filename));
    packages.push({
      locale: lang,
      filename,
      href:
        previous.distribution.repository +
        '/raw/' +
        revision +
        '/public/press-kit/' +
        filename,
      distribution: 'github-repository',
      bytes: bytes.length,
      sha256: digest(bytes),
      generatedAt: date,
      version,
    });
  } finally {
    rmSync(stage, { recursive: true, force: true });
  }
}
writeFileSync(
  file('asset-manifest.json'),
  JSON.stringify(
    { ...manifest, generatedAt: date, release: version },
    null,
    2,
  ) + '\n',
);
writeFileSync(
  file('package-manifest.json'),
  JSON.stringify(
    {
      ...previous,
      generatedAt: date,
      release: version,
      currentProductRelease: version,
      distribution: { ...previous.distribution, revision },
      packages,
    },
    null,
    2,
  ) + '\n',
);
