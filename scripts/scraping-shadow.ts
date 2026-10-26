import { parseArgs } from 'node:util';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { optionalShadowRuntime, type ShadowFileConfig } from '../src/lib/adaptiveAcquisition/shadowRuntime';

async function main() {
  const { values } = parseArgs({ options: { config: { type: 'string' } } });
  if (!values.config) throw new Error('Usage: tsx scripts/scraping-shadow.ts --config /absolute/shadow-config.json');
  const config: ShadowFileConfig = JSON.parse(await readFile(values.config, 'utf8'));
  const runtime = await optionalShadowRuntime(`cli-${randomUUID()}`, { configPath: values.config });
  // Fail before network activity if the operator's configuration cannot be loaded.
  // Disabled runtimes use the original scraper reference; no implicit full scan.
  const { scrapePolicyText } = await import('../src/lib/scraper');
  if (runtime.scrape === scrapePolicyText) throw new Error('shadow_configuration_unavailable');
  for (const target of config.targets.slice(0, config.maxObservations)) {
    const result = await runtime.scrape(target.url);
    console.log(JSON.stringify({ source: new URL(target.url).origin, status: result.status, outcome: result.outcome }));
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  const summary = await runtime.finish();
  console.log(JSON.stringify(summary));
  if (summary.errors || summary.persisted === 0 || ('summaryWriteFailed' in summary && summary.summaryWriteFailed)) process.exitCode = 1;
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
