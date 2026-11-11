import { createCipheriv, randomBytes, scryptSync } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import {
  buildCompleteBackupPayload,
  COMPLETE_BACKUP_TABLES,
  decryptBackupFile,
  encryptBackupPayload,
  summarizeDecryptedBackup,
} from '../encryptedBackup';
import { EXPECTED_DATABASE_TABLES } from '../databaseReadiness';

function completeClient() {
  const delegates = Object.fromEntries(COMPLETE_BACKUP_TABLES.map(([table, delegate]) => [
    delegate,
    { findMany: vi.fn().mockResolvedValue([{ table }]) },
  ]));
  return Object.assign(delegates, { $transaction: vi.fn(async (work: (tx: typeof delegates) => Promise<unknown>) => work(delegates)) });
}

function legacyEncrypt(payload: unknown, password: string) {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = scryptSync(password, salt, 32);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = cipher.update(JSON.stringify(payload), 'utf8', 'hex') + cipher.final('hex');
  return [salt.toString('hex'), iv.toString('hex'), cipher.getAuthTag().toString('hex'), encrypted].join(':');
}

describe('complete encrypted backup', () => {
  it('exports every table in the authoritative database inventory', async () => {
    const client = completeClient();
    const payload = await buildCompleteBackupPayload(client, new Date('2026-08-20T10:00:00Z'));

    expect(COMPLETE_BACKUP_TABLES.map(([table]) => table)).toEqual([...EXPECTED_DATABASE_TABLES]);
    expect(payload.summary).toMatchObject({ tableCount: 47, totalRecords: 47 });
    expect(Object.keys(payload.data)).toHaveLength(47);
    for (const [, delegate] of COMPLETE_BACKUP_TABLES) {
      expect(client[delegate].findMany).toHaveBeenCalledOnce();
    }
  });

  it('still verifies a complete 5.0.0 backup with its historical 34-table inventory', async () => {
    const payload = await buildCompleteBackupPayload(completeClient());
    payload.applicationVersion = '5.0.0';
    delete payload.inventoryVersion;
    for (const key of Object.keys(payload.data).filter(key => key.startsWith('Engine'))) {
      delete payload.data[key]; delete payload.summary.counts[key];
    }
    delete payload.data.ContentArtifact;
    delete payload.summary.counts.ContentArtifact;
    payload.summary.tableCount = 34;
    payload.summary.totalRecords = 34;
    const password = 'historical backup test password';
    const encrypted = await encryptBackupPayload(payload, password);
    await expect(decryptBackupFile(encrypted, password)).resolves.toEqual(payload);
  });

  it('still verifies a pre-engine 35-table export from a release after 5.0.0', async () => {
    const payload = await buildCompleteBackupPayload(completeClient());
    payload.applicationVersion = '5.4.0';
    delete payload.inventoryVersion;
    for (const key of Object.keys(payload.data).filter(key => key.startsWith('Engine'))) {
      delete payload.data[key]; delete payload.summary.counts[key];
    }
    payload.summary.tableCount = 35;
    payload.summary.totalRecords = 35;
    const password = 'historical backup test password';
    await expect(decryptBackupFile(await encryptBackupPayload(payload, password), password)).resolves.toEqual(payload);
  });

  it('still verifies a historical engine-v6 export with exactly 45 tables', async () => {
    const payload = await buildCompleteBackupPayload(completeClient());
    payload.inventoryVersion = 'engine-v6';
    for (const key of ['EngineClaim', 'EngineClaimEvidence']) { delete payload.data[key]; delete payload.summary.counts[key]; }
    payload.summary.tableCount = 45;
    payload.summary.totalRecords = 45;
    const password = 'historical engine backup password';
    await expect(decryptBackupFile(await encryptBackupPayload(payload, password), password)).resolves.toEqual(payload);
  });

  it('labels new exports with the claim-ledger inventory and rejects mislabelled or tampered table sets', async () => {
    const password = 'inventory mismatch password';
    const current = await buildCompleteBackupPayload(completeClient());
    expect(current.inventoryVersion).toBe('engine-v6-claim-ledger');

    const oldLabelNewTables = await buildCompleteBackupPayload(completeClient());
    oldLabelNewTables.inventoryVersion = 'engine-v6';
    await expect(decryptBackupFile(await encryptBackupPayload(oldLabelNewTables, password), password)).rejects.toThrow('invalid_backup_payload');

    const newLabelMissingLedger = await buildCompleteBackupPayload(completeClient());
    for (const key of ['EngineClaim', 'EngineClaimEvidence']) { delete newLabelMissingLedger.data[key]; delete newLabelMissingLedger.summary.counts[key]; }
    newLabelMissingLedger.summary.tableCount = 45; newLabelMissingLedger.summary.totalRecords = 45;
    await expect(decryptBackupFile(await encryptBackupPayload(newLabelMissingLedger, password), password)).rejects.toThrow('invalid_backup_payload');

    const swapped = await buildCompleteBackupPayload(completeClient());
    swapped.inventoryVersion = 'engine-v6';
    delete swapped.data.EngineClaim; delete swapped.summary.counts.EngineClaim;
    delete swapped.data.Subscriber; delete swapped.summary.counts.Subscriber;
    swapped.summary.tableCount = 45; swapped.summary.totalRecords = 45;
    await expect(decryptBackupFile(await encryptBackupPayload(swapped, password), password)).rejects.toThrow('invalid_backup_payload');

    const unknownLabel = await buildCompleteBackupPayload(completeClient());
    (unknownLabel as { inventoryVersion: string }).inventoryVersion = 'engine-v7';
    await expect(decryptBackupFile(await encryptBackupPayload(unknownLabel, password), password)).rejects.toThrow('invalid_backup_payload');
  });

  it('round-trips the v2 envelope and records bounded cryptographic parameters', async () => {
    const payload = await buildCompleteBackupPayload(completeClient());
    const password = 'correct horse battery staple';
    const encrypted = await encryptBackupPayload(payload, password);
    const envelope = JSON.parse(encrypted) as Record<string, unknown>;

    expect(envelope).toMatchObject({
      format: 'policywatcher-encrypted-export',
      version: 2,
      encoding: 'base64',
      kdf: { name: 'scrypt', N: 32_768, r: 8, p: 1, keyLength: 32 },
      cipher: { name: 'aes-256-gcm', aad: 'policywatcher-encrypted-export:v2' },
    });
    await expect(decryptBackupFile(encrypted, password)).resolves.toEqual(payload);
    await expect(decryptBackupFile(encrypted, 'wrong password value')).rejects.toThrow();
  });

  it('rejects authenticated v2 payloads that are incomplete or internally inconsistent', async () => {
    const payload = await buildCompleteBackupPayload(completeClient());
    delete payload.data.Subscriber;
    const encrypted = await encryptBackupPayload(payload, 'correct horse battery staple');

    await expect(decryptBackupFile(encrypted, 'correct horse battery staple'))
      .rejects.toThrow('invalid_backup_payload');
  });

  it('keeps legacy v1 verification without relabelling partial exports as complete', async () => {
    const password = 'legacy backup password';
    const legacyPayload = {
      version: '3.9.0',
      exportedAt: '2026-08-01T00:00:00.000Z',
      summary: { companies: 1, policies: 2 },
      data: { companies: [{}], policies: [{}, {}] },
    };
    const decrypted = await decryptBackupFile(legacyEncrypt(legacyPayload, password), password);
    expect(summarizeDecryptedBackup(decrypted)).toMatchObject({
      version: '3.9.0',
      formatVersion: 1,
      scope: 'legacy-partial-export',
    });
  });
});

describe('snapshot export contract', () => {
  it('requires a transaction instead of silently exporting an inconsistent table sequence', async () => {
    await expect(buildCompleteBackupPayload({})).rejects.toThrow('backup_snapshot_transaction_required');
  });
  it('requests serializable isolation and never falls back if the snapshot transaction fails', async () => {
    const client = completeClient();
    client.$transaction.mockRejectedValueOnce(new Error('snapshot conflict'));
    await expect(buildCompleteBackupPayload(client)).rejects.toThrow('snapshot conflict');
    expect(client.$transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: 'Serializable', timeout: 60_000 });
  });
});
