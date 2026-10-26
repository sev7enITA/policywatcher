import { readFile, stat, mkdir } from 'node:fs/promises';
import { join, isAbsolute } from 'node:path';
import { scrapePolicyText } from '../scraper';
import { digest, sha256 } from './evidence';
import { privateCaptureDirectory, writeImmutableJson } from './storage';
import { createShadowSession, validateShadowConfig, type ShadowConfig } from './shadow';

export interface ShadowFileConfig extends ShadowConfig { outputDirectory: string }

export async function shadowProvenance(checkout: string): Promise<Record<string, string>> {
  const files = ['src/lib/scraper.ts', 'src/lib/sourceReliability.ts', 'src/lib/pdfPolicy.ts',
    'src/lib/extractionProfile.ts', 'src/lib/extractionProfile.generated.json', 'src/lib/acquisitionScope.ts',
    ...['evidence', 'outcome', 'recipe', 'replay', 'shadow', 'shadowRuntime', 'storage']
      .map((name) => `src/lib/adaptiveAcquisition/${name}.ts`), 'package-lock.json'];
  const provenance: Record<string, string> = { nodeVersion: sha256(process.version) };
  for (const file of files) provenance[file] = sha256(await readFile(join(checkout, file), 'utf8'));
  return provenance;
}

/** Explicit configuration per scan. Missing/invalid configuration retains the baseline. */
export async function optionalShadowRuntime(runId: string, options: {
  configPath?: string;
  checkout?: string;
} = {}) {
  const configPath = options.configPath ?? process.env.POLICYWATCHER_SCRAPING_SHADOW_CONFIG;
  const checkout = options.checkout || process.cwd();
  const disabled = (mode: 'disabled' | 'configuration_error') => ({
    scrape: scrapePolicyText,
    finish: async () => ({ mode, attempted: 0, persisted: 0, errors: mode === 'configuration_error' ? 1 : 0 }),
  });
  if (!configPath) return disabled('disabled');
  try {
    if (!isAbsolute(configPath) || (await stat(configPath)).size > 65_536) throw new Error('invalid_shadow_config_file');
    const raw: ShadowFileConfig = JSON.parse(await readFile(configPath, 'utf8'));
    validateShadowConfig(raw);
    if (typeof raw.outputDirectory !== 'string' || !isAbsolute(raw.outputDirectory)) throw new Error('invalid_shadow_output');
    const directory = await privateCaptureDirectory(raw.outputDirectory, checkout);
    const provenance = await shadowProvenance(checkout);
    await mkdir(join(directory, 'captures'), { recursive: true, mode: 0o700 });
    await mkdir(join(directory, 'observations'), { recursive: true, mode: 0o700 });
    const config: ShadowConfig = { schemaVersion: 1, mode: 'shadow', maxObservations: raw.maxObservations,
      targets: raw.targets, recipes: raw.recipes };
    const session = createShadowSession({ runId, config, provenance, persist: async (capture, receipt) => {
      await writeImmutableJson(join(directory, 'captures', `${capture.captureId}.json`), capture);
      await writeImmutableJson(join(directory, 'observations', `${receipt.receiptId}.json`), receipt);
    } });
    let finished: Promise<ReturnType<typeof session.summary> & { summaryWriteFailed?: boolean }> | undefined;
    return {
      scrape: session.scrape,
      finish: () => {
        if (!finished) finished = (async () => {
          const summary = await session.close();
          const body = { schemaVersion: 1, runId, configSha256: digest(config), provenance, ...summary };
          try { await writeImmutableJson(join(directory, `${digest(body)}.summary.json`), body); }
          catch { return { ...summary, summaryWriteFailed: true }; }
          return summary;
        })();
        return finished;
      },
    };
  } catch {
    console.warn('[Scraping shadow] Configuration unavailable; baseline retained.');
    return disabled('configuration_error');
  }
}
