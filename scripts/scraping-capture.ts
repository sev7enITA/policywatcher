import { parseArgs } from 'node:util';
import { join } from 'node:path';
import { scrapePolicyText } from '../src/lib/scraper';
import { privateCaptureDirectory, writeImmutableJson } from '../src/lib/adaptiveAcquisition/storage';

async function main() {
  const { values } = parseArgs({ options: {
    url: { type: 'string' }, out: { type: 'string' }, language: { type: 'string' }, jurisdiction: { type: 'string' },
  } });
  if (!values.url || !values.out || !values.language || !values.jurisdiction) {
    throw new Error('Usage: tsx scripts/scraping-capture.ts --url URL --out PRIVATE_DIRECTORY --language en --jurisdiction EU');
  }
  const directory = await privateCaptureDirectory(values.out, process.cwd());
  const captureIds: string[] = [];
  const result = await scrapePolicyText(values.url, { onRawCapture: async (capture) => {
    await writeImmutableJson(join(directory, `${capture.captureId}.json`), capture);
    captureIds.push(capture.captureId);
  } });
  const failedCaptures = result.rawCaptureSummary?.failed || 0;
  const index = {
    schemaVersion: 1, observedAt: new Date().toISOString(), captureIds, failedCaptures,
    language: values.language, jurisdiction: values.jurisdiction,
    labelStatus: 'unreviewed', outcome: result.outcome, rawCaptureSummary: result.rawCaptureSummary,
  };
  await writeImmutableJson(join(directory, `acquisition-${Date.now()}.json`), index);
  console.log(JSON.stringify({ captures: captureIds.length, failedCaptures, outcome: result.outcome }));
  if (failedCaptures || !captureIds.length) process.exitCode = 1;
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
