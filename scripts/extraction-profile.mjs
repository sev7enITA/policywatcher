import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import ts from 'typescript';

const hash = value => createHash('sha256').update(value).digest('hex');
// Scope the transform to its declaration dependency closure. Transport/metrics/UI
// edits and unrelated lockfile changes must not invalidate every source baseline.
function declarations(file, roots) {
  const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
  const nodes = new Map();
  for (const statement of source.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name) nodes.set(statement.name.text, statement);
    if (ts.isVariableStatement(statement)) for (const d of statement.declarationList.declarations) {
      if (ts.isIdentifier(d.name)) nodes.set(d.name.text, d);
    }
  }
  const selected = new Set();
  function visitName(name) {
    if (selected.has(name) || !nodes.has(name)) return;
    selected.add(name);
    function visit(node) { if (ts.isIdentifier(node)) visitName(node.text); ts.forEachChild(node, visit); }
    visit(nodes.get(name));
  }
  roots.forEach(name => { if (!nodes.has(name)) throw new Error(`Missing extraction root ${name}`); visitName(name); });
  return [...selected].sort().map(name => `${name}:${nodes.get(name).getText(source)}`).join('\n');
}
const files = {
  'scraper:transform': hash(declarations('src/lib/scraper.ts', ['validateContent', 'decodeBoundedDocumentBody'])),
  'engine:document': hash(declarations('src/lib/engine/document.ts', ['structureDocument', 'assessDocument'])),
  'engine:transform': hash(declarations('src/lib/engine/acquisition.ts', ['extractEngineBody', 'assessCapture'])),
  'sourceReliability:identity': hash(declarations('src/lib/sourceReliability.ts', ['buildAcquisitionKey'])),
  ...Object.fromEntries(['src/lib/pdfPolicy.ts', 'src/lib/acquisitionScope.ts'].map(file => [file, hash(readFileSync(file))])),
};
const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
const dependencies = {};
function dependency(name, parent = '') {
  let path = `${parent ? parent + '/' : ''}node_modules/${name}`;
  while (!lock.packages[path] && path.includes('/node_modules/')) path = path.slice(path.indexOf('/node_modules/') + 1);
  if (!lock.packages[path]) path = `node_modules/${name}`;
  const pkg = lock.packages[path];
  if (!pkg) throw new Error(`Missing extraction dependency ${name}`);
  if (dependencies[path]) return;
  dependencies[path] = { version: pkg.version, integrity: pkg.integrity };
  for (const child of Object.keys(pkg.dependencies || {}).sort()) dependency(child, path);
}
['cheerio', 'unpdf'].forEach(name => dependency(name));
const orderedDependencies = Object.fromEntries(Object.entries(dependencies).sort(([a], [b]) => a.localeCompare(b)));
const profile = { version: 2, files, dependencies: orderedDependencies, hash: hash(JSON.stringify([files, orderedDependencies])) };
const target = 'src/lib/extractionProfile.generated.json';
const rendered = JSON.stringify(profile, null, 2) + '\n';
if (process.argv.includes('--check')) {
  if (readFileSync(target, 'utf8') !== rendered) throw new Error('Extraction profile is stale. Run npm run extraction:profile.');
} else writeFileSync(target, rendered);
