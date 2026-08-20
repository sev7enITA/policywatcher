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
  return Object.fromEntries(COMPLETE_BACKUP_TABLES.map(([table, delegate]) => [
    delegate,
    { findMany: vi.fn().mockResolvedValue([{ table }]) },
  ]));
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
    expect(payload.summary).toMatchObject({ tableCount: 31, totalRecords: 31 });
    expect(Object.keys(payload.data)).toHaveLength(31);
    for (const [, delegate] of COMPLETE_BACKUP_TABLES) {
      expect(client[delegate].findMany).toHaveBeenCalledOnce();
    }
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
