import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'node:crypto';
import { POLICYWATCHER_VERSION } from './release';

export const ENCRYPTED_BACKUP_FORMAT = 'policywatcher-encrypted-export';
export const ENCRYPTED_BACKUP_FORMAT_VERSION = 2;
export const MIN_BACKUP_PASSWORD_LENGTH = 12;
export const MAX_BACKUP_PASSWORD_LENGTH = 256;

const KDF_PARAMETERS = { name: 'scrypt', N: 32_768, r: 8, p: 1, keyLength: 32 } as const;
const SCRYPT_MAX_MEMORY_BYTES = 64 * 1024 * 1024;
const BACKUP_AAD = 'policywatcher-encrypted-export:v2';

export const COMPLETE_BACKUP_TABLES = [
  ['Entity', 'entity'],
  ['Document', 'document'],
  ['Version', 'version'],
  ['Change', 'change'],
  ['Provision', 'provision'],
  ['Company', 'company'],
  ['PolicyDiscoveryJob', 'policyDiscoveryJob'],
  ['PolicyInquiry', 'policyInquiry'],
  ['PolicyDiscoveryCandidate', 'policyDiscoveryCandidate'],
  ['Policy', 'policy'],
  ['PolicyCheckLog', 'policyCheckLog'],
  ['ScanRun', 'scanRun'],
  ['SourceRetrieval', 'sourceRetrieval'],
  ['SourceRemediationIssue', 'sourceRemediationIssue'],
  ['HistoricalSourceReference', 'historicalSourceReference'],
  ['PolicySnapshot', 'policySnapshot'],
  ['PolicyChange', 'policyChange'],
  ['WebhookDelivery', 'webhookDelivery'],
  ['WebhookDeliveryAttempt', 'webhookDeliveryAttempt'],
  ['DatasetQaIssueReview', 'datasetQaIssueReview'],
  ['AdminReviewLog', 'adminReviewLog'],
  ['SourceOnboardingBatch', 'sourceOnboardingBatch'],
  ['SourceOnboardingItem', 'sourceOnboardingItem'],
  ['AdminAccessLog', 'adminAccessLog'],
  ['InvestorAccessGrant', 'investorAccessGrant'],
  ['InvestorAccessEvent', 'investorAccessEvent'],
  ['PressMetricEvent', 'pressMetricEvent'],
  ['AdminDashboardMetricEvent', 'adminDashboardMetricEvent'],
  ['AiModelInvocation', 'aiModelInvocation'],
  ['RegionImpact', 'regionImpact'],
  ['Subscriber', 'subscriber'],
] as const;

type BackupDelegate = { findMany(args?: Record<string, never>): Promise<unknown[]> };
type BackupClient = Record<string, BackupDelegate>;

export interface CompleteBackupPayload {
  formatVersion: 2;
  applicationVersion: string;
  exportedAt: string;
  scope: 'complete-application-export';
  restoreMode: 'verification-only';
  summary: {
    tableCount: number;
    totalRecords: number;
    counts: Record<string, number>;
  };
  data: Record<string, unknown[]>;
}

interface BackupEnvelopeV2 {
  format: typeof ENCRYPTED_BACKUP_FORMAT;
  version: typeof ENCRYPTED_BACKUP_FORMAT_VERSION;
  encoding: 'base64';
  kdf: typeof KDF_PARAMETERS & { salt: string };
  cipher: {
    name: 'aes-256-gcm';
    iv: string;
    authTag: string;
    aad: typeof BACKUP_AAD;
  };
  ciphertext: string;
}

function deriveKey(password: string, salt: Buffer, parameters = KDF_PARAMETERS): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, parameters.keyLength, {
      N: parameters.N,
      r: parameters.r,
      p: parameters.p,
      maxmem: SCRYPT_MAX_MEMORY_BYTES,
    }, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

function isValidPassword(password: unknown): password is string {
  return typeof password === 'string'
    && password.length >= MIN_BACKUP_PASSWORD_LENGTH
    && password.length <= MAX_BACKUP_PASSWORD_LENGTH;
}

export async function buildCompleteBackupPayload(
  client: unknown,
  now = new Date(),
): Promise<CompleteBackupPayload> {
  const delegates = client as BackupClient;
  const data: Record<string, unknown[]> = {};
  const counts: Record<string, number> = {};

  // Sequential reads cap peak query concurrency and preserve a deterministic
  // table order in the portable export.
  for (const [tableName, delegateName] of COMPLETE_BACKUP_TABLES) {
    const delegate = delegates[delegateName];
    if (!delegate || typeof delegate.findMany !== 'function') {
      throw new Error(`backup_delegate_unavailable:${tableName}`);
    }
    const records = await delegate.findMany();
    data[tableName] = records;
    counts[tableName] = records.length;
  }

  return {
    formatVersion: ENCRYPTED_BACKUP_FORMAT_VERSION,
    applicationVersion: POLICYWATCHER_VERSION,
    exportedAt: now.toISOString(),
    scope: 'complete-application-export',
    restoreMode: 'verification-only',
    summary: {
      tableCount: COMPLETE_BACKUP_TABLES.length,
      totalRecords: Object.values(counts).reduce((total, count) => total + count, 0),
      counts,
    },
    data,
  };
}

export async function encryptBackupPayload(payload: CompleteBackupPayload, password: string): Promise<string> {
  if (!isValidPassword(password)) throw new Error('invalid_backup_password');

  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = await deriveKey(password, salt);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(Buffer.from(BACKUP_AAD, 'utf8'));
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(payload), 'utf8'),
    cipher.final(),
  ]);

  const envelope: BackupEnvelopeV2 = {
    format: ENCRYPTED_BACKUP_FORMAT,
    version: ENCRYPTED_BACKUP_FORMAT_VERSION,
    encoding: 'base64',
    kdf: { ...KDF_PARAMETERS, salt: salt.toString('base64') },
    cipher: {
      name: 'aes-256-gcm',
      iv: iv.toString('base64'),
      authTag: cipher.getAuthTag().toString('base64'),
      aad: BACKUP_AAD,
    },
    ciphertext: ciphertext.toString('base64'),
  };
  return JSON.stringify(envelope);
}

function decodeExactBase64(value: unknown, expectedBytes?: number): Buffer {
  if (typeof value !== 'string' || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) {
    throw new Error('invalid_backup_encoding');
  }
  const buffer = Buffer.from(value, 'base64');
  if (expectedBytes !== undefined && buffer.length !== expectedBytes) {
    throw new Error('invalid_backup_encoding');
  }
  return buffer;
}

function validateCompleteBackupPayload(payload: unknown): CompleteBackupPayload {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('invalid_backup_payload');
  }
  const value = payload as Record<string, unknown>;
  const summary = value.summary;
  const data = value.data;
  if (
    value.formatVersion !== ENCRYPTED_BACKUP_FORMAT_VERSION
    || typeof value.applicationVersion !== 'string'
    || typeof value.exportedAt !== 'string'
    || Number.isNaN(Date.parse(value.exportedAt))
    || value.scope !== 'complete-application-export'
    || value.restoreMode !== 'verification-only'
    || !summary
    || typeof summary !== 'object'
    || Array.isArray(summary)
    || !data
    || typeof data !== 'object'
    || Array.isArray(data)
  ) {
    throw new Error('invalid_backup_payload');
  }

  const summaryValue = summary as Record<string, unknown>;
  const counts = summaryValue.counts;
  if (!counts || typeof counts !== 'object' || Array.isArray(counts)) {
    throw new Error('invalid_backup_payload');
  }
  const countValues = counts as Record<string, unknown>;
  const dataValues = data as Record<string, unknown>;
  const expectedTables = COMPLETE_BACKUP_TABLES.map(([tableName]) => tableName);
  if (
    summaryValue.tableCount !== expectedTables.length
    || Object.keys(dataValues).length !== expectedTables.length
    || Object.keys(countValues).length !== expectedTables.length
  ) {
    throw new Error('invalid_backup_payload');
  }

  let totalRecords = 0;
  for (const tableName of expectedTables) {
    const records = dataValues[tableName];
    const count = countValues[tableName];
    if (!Array.isArray(records) || !Number.isSafeInteger(count) || count !== records.length) {
      throw new Error('invalid_backup_payload');
    }
    totalRecords += records.length;
  }
  if (summaryValue.totalRecords !== totalRecords) {
    throw new Error('invalid_backup_payload');
  }

  return value as unknown as CompleteBackupPayload;
}

async function decryptV2(envelope: BackupEnvelopeV2, password: string): Promise<CompleteBackupPayload> {
  if (
    envelope.format !== ENCRYPTED_BACKUP_FORMAT
    || envelope.version !== ENCRYPTED_BACKUP_FORMAT_VERSION
    || envelope.encoding !== 'base64'
    || envelope.kdf?.name !== KDF_PARAMETERS.name
    || envelope.kdf.N !== KDF_PARAMETERS.N
    || envelope.kdf.r !== KDF_PARAMETERS.r
    || envelope.kdf.p !== KDF_PARAMETERS.p
    || envelope.kdf.keyLength !== KDF_PARAMETERS.keyLength
    || envelope.cipher?.name !== 'aes-256-gcm'
    || envelope.cipher.aad !== BACKUP_AAD
  ) {
    throw new Error('unsupported_backup_parameters');
  }

  const salt = decodeExactBase64(envelope.kdf.salt, 16);
  const iv = decodeExactBase64(envelope.cipher.iv, 12);
  const authTag = decodeExactBase64(envelope.cipher.authTag, 16);
  const ciphertext = decodeExactBase64(envelope.ciphertext);
  const key = await deriveKey(password, salt);
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAAD(Buffer.from(BACKUP_AAD, 'utf8'));
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  return validateCompleteBackupPayload(JSON.parse(plaintext));
}

async function decryptLegacyV1(input: string, password: string): Promise<unknown> {
  const parts = input.split(':');
  if (parts.length !== 4 || parts.some((part) => !/^[a-f0-9]+$/i.test(part))) {
    throw new Error('invalid_legacy_backup');
  }
  const [saltHex, ivHex, authTagHex, encryptedHex] = parts;
  const salt = Buffer.from(saltHex, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  if (salt.length !== 16 || iv.length !== 12 || authTag.length !== 16) {
    throw new Error('invalid_legacy_backup');
  }
  const key = await new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, 32, (error, result) => error ? reject(error) : resolve(result));
  });
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  const plaintext = decipher.update(encryptedHex, 'hex', 'utf8') + decipher.final('utf8');
  return JSON.parse(plaintext) as unknown;
}

export async function decryptBackupFile(input: string, password: string): Promise<unknown> {
  if (!isValidPassword(password)) throw new Error('invalid_backup_password');
  const normalized = input.trim();
  if (normalized.startsWith('{')) {
    return decryptV2(JSON.parse(normalized) as BackupEnvelopeV2, password);
  }
  return decryptLegacyV1(normalized, password);
}

export function summarizeDecryptedBackup(payload: unknown) {
  if (!payload || typeof payload !== 'object') throw new Error('invalid_backup_payload');
  const value = payload as Record<string, unknown>;
  if (value.formatVersion === ENCRYPTED_BACKUP_FORMAT_VERSION) {
    validateCompleteBackupPayload(value);
  }
  const summary = value.summary;
  if (!summary || typeof summary !== 'object') throw new Error('invalid_backup_payload');
  return {
    version: typeof value.applicationVersion === 'string'
      ? value.applicationVersion
      : typeof value.version === 'string' ? value.version : 'unknown',
    exportedAt: typeof value.exportedAt === 'string' ? value.exportedAt : null,
    formatVersion: value.formatVersion === 2 ? 2 : 1,
    scope: value.scope === 'complete-application-export' ? value.scope : 'legacy-partial-export',
    summary,
  };
}
