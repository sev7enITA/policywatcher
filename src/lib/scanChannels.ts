import { createHash, randomUUID } from 'node:crypto';
import { readFileSync, realpathSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import profile from './extractionProfile.generated.json';

export type ScanChannel = 'stable' | 'preview' | 'compare';
export type ChannelRequest = { channel: ScanChannel; requestKey: string; limit: number; companySlug?: string };
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
const implementationFiles = ['src/lib/scanChannels.ts', 'src/lib/engine/store.ts', 'src/lib/engine/pipeline.ts',
  'src/lib/engine/comparison.ts', 'src/lib/engine/acquisition.ts', 'src/lib/engine/document.ts',
  'src/lib/engine/claims.ts', 'src/app/api/cron/check-all/route.ts', 'src/lib/scraper.ts', 'package-lock.json'];

function currentImplementationHash(): string | null {
  try { return hash(JSON.stringify(implementationFiles.map(file => [file, hash(readFileSync(resolve(file), 'utf8'))]))); }
  catch { return null; }
}
const loadedImplementationHash = currentImplementationHash();
export function channelImplementationHash(): string | null {
  return loadedImplementationHash === currentImplementationHash() ? loadedImplementationHash : null;
}

/** Read access survives disabled execution flags and code changes, in the same isolated workspace. */
export function isolatedChannelWorkspace(): boolean {
  if (process.env.NODE_ENV === 'production') return false;
  const url = process.env.DATABASE_URL || '';
  if (!url.startsWith('file:') || /[?#]/.test(url)) return false;
  try {
    const root = realpathSync(resolve('output/engine-channels'));
    const database = realpathSync(resolve(url.slice(5)));
    return database.startsWith(root + sep);
  } catch { return false; }
}

/** The first release is deliberately confined to a dedicated local SQLite copy. */
export function experimentalChannelsAvailable(): boolean {
  return isolatedChannelWorkspace() && process.env.POLICYWATCHER_ENGINE_CHANNELS === '1'
    && process.env.POLICYWATCHER_ENGINE_V6 === '1' && process.env.POLICYWATCHER_ENGINE_PUBLICATION === '0'
    && process.env.POLICYWATCHER_ENGINE_NOTIFICATIONS === '0' && channelImplementationHash() !== null;
}

export function scanChannelCapabilities() {
  const experimental = experimentalChannelsAvailable();
  return { defaultChannel: 'stable' as const, stable: process.env.POLICYWATCHER_ENGINE_V6 !== '1' || experimental,
    preview: experimental, compare: experimental, comparisonScope: 'same-capture-extraction' as const,
    reason: experimental ? null : 'Preview and comparison are not enabled here. They are being qualified in an isolated local workspace.' };
}

export function parseChannelRequest(body: Record<string, unknown>): ChannelRequest {
  const channel = body.channel ?? 'stable';
  if (!['stable', 'preview', 'compare'].includes(String(channel))) throw new Error('invalid_scan_channel');
  const limit = body.limit ?? 5;
  if (typeof limit !== 'number' || !Number.isInteger(limit) || limit < 1 || limit > 50) throw new Error('invalid_batch_limit');
  const requestKey = body.requestKey ?? randomUUID();
  if (typeof requestKey !== 'string' || !/^[\w:.\-]{8,150}$/.test(requestKey)) throw new Error('invalid_request_key');
  if (body.notificationMode !== undefined && body.notificationMode !== 'silent') throw new Error('manual_channels_are_silent');
  if (body.mode !== undefined && body.mode !== 'observe') throw new Error('channel_cannot_enable_publication');
  const companySlug = body.companySlug === undefined ? undefined : typeof body.companySlug === 'string' ? body.companySlug.trim().toLowerCase() : null;
  if (companySlug === null || (companySlug && !/^[a-z0-9-]{1,120}$/.test(companySlug))) throw new Error('invalid_company_scope');
  return { channel: channel as ScanChannel, requestKey, limit, ...(companySlug ? { companySlug } : {}) };
}

export function channelRequestFingerprint(request: Omit<ChannelRequest, 'requestKey'>): string {
  return hash(JSON.stringify([request.channel, request.limit, request.companySlug || null]));
}
export type ChannelMetadata = ReturnType<typeof channelMetadata>;
export function channelMetadata(request: Omit<ChannelRequest, 'requestKey'>) {
  return { schema: 'pw-scan-channel-1' as const, channel: request.channel,
    requestFingerprint: channelRequestFingerprint(request), limit: request.limit, companySlug: request.companySlug || null,
    implementationHash: channelImplementationHash(), extractionProfileHash: profile.hash,
    stableVersion: '5.2.0', previewVersion: 'pw-engine-6.0.0-alpha.1',
    requestedModels: { analyst: process.env.POLICYWATCHER_ENGINE_ANALYST_MODEL || null, verifier: process.env.POLICYWATCHER_ENGINE_VERIFIER_MODEL || null },
    comparisonScope: request.channel === 'compare' ? 'same-capture-extraction' : null,
    modelComparisonPerformed: false, notificationMode: 'silent' as const };
}

export function assertChannelWorkerContext(metadata: ChannelMetadata, mode: string, notificationMode: string) {
  if (!experimentalChannelsAvailable() || mode !== 'observe' || notificationMode !== 'silent'
      || !['preview', 'compare'].includes(metadata.channel)
      || metadata.implementationHash !== channelImplementationHash()
      || metadata.requestedModels.analyst !== (process.env.POLICYWATCHER_ENGINE_ANALYST_MODEL || null)
      || metadata.requestedModels.verifier !== (process.env.POLICYWATCHER_ENGINE_VERIFIER_MODEL || null)) throw new Error('channel_context_changed');
}
