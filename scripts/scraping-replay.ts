import { readFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { createRequire } from 'node:module';
import { sha256 } from '../src/lib/adaptiveAcquisition/evidence';
import { replayCorpus, type ReplayCorpus } from '../src/lib/adaptiveAcquisition/replay';
import { resolveLesson } from '../src/lib/adaptiveAcquisition/experience';
import type { ExtractionRecipe } from '../src/lib/adaptiveAcquisition/recipe';
import { writeImmutableJson } from '../src/lib/adaptiveAcquisition/storage';

async function main() {
  const { values } = parseArgs({ options: {
    corpus: { type: 'string', default: 'evals/scraping/corpus.synthetic.v1.json' },
    recipes: { type: 'string', default: 'evals/scraping/recipes.v1.json' },
    out: { type: 'string' },
  } });
  if (!values.out) throw new Error('Usage: tsx scripts/scraping-replay.ts --out RECEIPT_DIRECTORY [--corpus FILE --recipes FILE]');
  const corpus = JSON.parse(await readFile(values.corpus!, 'utf8')) as ReplayCorpus;
  const recipes = JSON.parse(await readFile(values.recipes!, 'utf8')) as ExtractionRecipe[];
  const files = [
    'src/lib/scraper.ts', 'src/lib/sourceReliability.ts', 'src/lib/pdfPolicy.ts',
    'src/lib/extractionProfile.ts', 'src/lib/extractionProfile.generated.json', 'src/lib/acquisitionScope.ts',
    ...['evidence', 'recipe', 'replay', 'experience', 'outcome', 'storage'].map((name) => `src/lib/adaptiveAcquisition/${name}.ts`),
    'scripts/scraping-replay.ts', 'package-lock.json', 'evals/scraping/tsconfig.json',
  ];
  const provenance: Record<string, string> = { nodeVersion: sha256(process.version) };
  for (const file of files) provenance[file] = sha256(await readFile(file, 'utf8'));
  const require = createRequire(resolve('scripts/scraping-replay.ts'));
  for (const dependency of ['cheerio', 'tldts', 'unpdf']) {
    provenance[`runtime:${dependency}:entry`] = sha256(await readFile(require.resolve(dependency), 'utf8'));
  }
  const receipt = await replayCorpus(corpus, recipes, provenance);
  await mkdir(values.out, { recursive: true });
  await writeImmutableJson(join(values.out, `${receipt.receiptId}.receipt.json`), receipt);
  const now = new Date(receipt.generatedAt);
  const lessons = receipt.candidates.map((candidate) => {
    const evidenceCaseIds = candidate.cases.filter((item) => item.applied).map((item) => item.caseId);
    if (!evidenceCaseIds.length) return null;
    return resolveLesson({
      schemaVersion: 1,
      claim: `Recipe ${candidate.recipe.id}@${candidate.recipe.revision}: ${candidate.decision} on the recorded corpus.`,
      scope: candidate.recipe.scope, recipeSha256: candidate.recipeSha256,
      receiptId: receipt.receiptId, evidenceCaseIds,
      expiresAt: new Date(now.getTime() + 30 * 86_400_000).toISOString(),
    }, (id) => id === receipt.receiptId ? receipt : undefined, now);
  }).filter((lesson) => lesson !== null);
  await writeImmutableJson(join(values.out, `${receipt.receiptId}.lessons.json`), lessons);
  console.log(JSON.stringify({
    receiptId: receipt.receiptId, corpusKind: receipt.corpusKind, cases: receipt.baseline.length,
    candidates: receipt.candidates.map(({ recipe, decision, wins, regressions, reasons }) =>
      ({ id: recipe.id, decision, wins, regressions, reasons })),
  }, null, 2));
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
