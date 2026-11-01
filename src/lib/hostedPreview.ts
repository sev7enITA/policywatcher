import { realpathSync, statSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';
import { POLICYWATCHER_RELEASE_CHANNEL } from './release';

export const HOSTED_PREVIEW_ORIGIN = 'https://staging.policywatcher.online';
const HOSTED_DATABASE = '/home/u847874844/domains/staging.policywatcher.online/policywatcher-preview/preview.db';

/** Deployment intent is separate from whether execution is currently safe. */
export function isHostedPreview(): boolean {
  return process.env.POLICYWATCHER_HOSTED_PREVIEW === '1'
    || (process.env.NODE_ENV === 'production' && POLICYWATCHER_RELEASE_CHANNEL === 'preview');
}

/** Also permits private report reads after execution flags are disabled. */
export function hostedPreviewWorkspaceAvailable(): boolean {
  if (process.env.POLICYWATCHER_HOSTED_PREVIEW !== '1' || process.env.NODE_ENV !== 'production'
      || process.env.POLICYWATCHER_DEPLOYMENT_TARGET !== 'staging'
      || process.env.APP_URL !== HOSTED_PREVIEW_ORIGIN
      || process.env.NEXT_PUBLIC_APP_URL !== HOSTED_PREVIEW_ORIGIN) return false;
  const url = process.env.DATABASE_URL || '';
  if (!url.startsWith('file:') || /[?#]/.test(url)) return false;
  const database = url.slice(5);
  if (!isAbsolute(database) || resolve(database) !== database) return false;
  const localDatabase = join(/* turbopackIgnore: true */ process.cwd(), 'output/engine-channels/hosted-preview/preview.db');
  if (database !== HOSTED_DATABASE && database !== localDatabase) return false;
  try {
    // Reject symlink aliases in the file or any parent directory, and hardlinks.
    // The file must already exist; the guard never creates or migrates a DB.
    const information = statSync(/* turbopackIgnore: true */ database);
    return realpathSync(/* turbopackIgnore: true */ database) === database
      && information.isFile() && information.nlink === 1;
  } catch { return false; }
}

export function hostedPreviewAvailable(): boolean {
  return hostedPreviewWorkspaceAvailable()
    && process.env.POLICYWATCHER_ENGINE_CHANNELS === '1'
    && process.env.POLICYWATCHER_ENGINE_V6 === '1'
    && process.env.POLICYWATCHER_ENGINE_PUBLICATION === '0'
    && process.env.POLICYWATCHER_ENGINE_NOTIFICATIONS === '0';
}

export function assertHostedPreviewContext(): void {
  if (!hostedPreviewAvailable()) throw new Error('hosted_preview_context_invalid');
}
