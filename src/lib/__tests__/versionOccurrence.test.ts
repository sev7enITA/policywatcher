import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { createRequire } from 'node:module';
const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite') as {
  DatabaseSync: new (path: string) => { exec: (sql: string) => void; prepare: (sql: string) => { get: () => Record<string, unknown> }; close: () => void };
};
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { syncCanonicalPolicyGraph } from '../documentEvidenceSync';
import { syncVersionOccurrence } from '../versionOccurrence';
import { buildVersionPublicId as buildPublicId } from '../publicEvidenceIds';

const digest = (text: string) => createHash('sha256').update(text).digest('hex');
let directory: string;
let db: PrismaClient;
let sequence: number;
const document = { id: 'document', publicId: 'public-document' };
const date = new Date('2026-10-15T10:00:00Z');
const snapshot = (index: number, text: string) => ({
  id: `snapshot-${index}`, hash: digest(text), text,
  createdAt: new Date(date.getTime() + index * 1000), publicEvidence: true,
  sourceUrl: 'https://example.com/original', requestedUrl: 'https://example.com/api',
  finalUrl: 'https://example.com/api/v1', sourceProvenance: 'captured',
});

beforeEach(async () => {
  directory = mkdtempSync(join(tmpdir(), 'policywatcher-occurrence-'));
  const path = join(directory, 'test.db');
  const sqlite = new DatabaseSync(path);
  sqlite.exec(readFileSync('src/lib/__tests__/fixtures/dq-lineage-before.sql', 'utf8'));
  sqlite.exec(readFileSync('prisma/migrations/20261015160000_dq_lineage_occurrences/migration.sql', 'utf8'));
  sqlite.close();
  db = new PrismaClient({ datasources: { db: { url: `file:${path}` } } });
  await db.entity.create({ data: { id: 'entity', publicId: 'public-entity', canonicalKey: 'entity', name: 'Fixture' } });
  await db.document.create({ data: {
    ...document, entityId: 'entity', canonicalKey: 'document', title: 'Privacy', documentType: 'privacy', canonicalUrl: 'https://example.com/current',
  } });
  sequence = 0;
});
afterEach(async () => { await db?.$disconnect(); if (directory) rmSync(directory, { recursive: true, force: true }); });

function sync(value: ReturnType<typeof snapshot>, policyUrl = 'https://example.com/current') {
  return db.$transaction((tx) => syncVersionOccurrence(tx, { document, snapshot: value, policyUrl, nextSequence: () => ++sequence, buildPublicId }));
}

describe('content artifacts and immutable version occurrences', () => {
  it('migrates existing evidence without changing its public ID, URL or content reference', () => {
    const sqlite = new DatabaseSync(':memory:');
    try {
      sqlite.exec(readFileSync('src/lib/__tests__/fixtures/dq-lineage-before.sql', 'utf8'));
      sqlite.exec(`
        PRAGMA foreign_keys=ON;
        INSERT INTO "Entity" (id, publicId, canonicalKey, name, updatedAt) VALUES ('e', 'ent_existing', 'e', 'Fixture', CURRENT_TIMESTAMP);
        INSERT INTO "Document" (id, publicId, entityId, canonicalKey, title, documentType, canonicalUrl, updatedAt)
          VALUES ('d', 'doc_existing', 'e', 'd', 'Privacy', 'privacy', 'https://example.com/current', CURRENT_TIMESTAMP);
        INSERT INTO "Version" (id, publicId, documentId, sequence, contentHash, sourceUrl, capturedAt, effectiveAt, contentRef, contentText)
          VALUES ('v', 'ver_existing', 'd', 1, 'existing-hash', 'https://example.com/historic', CURRENT_TIMESTAMP, '2026-01-01', 'evidence://old', 'A');
      `);
      const before = sqlite.prepare('SELECT publicId, sourceUrl, capturedAt, effectiveAt, contentRef, contentText FROM Version').get();
      sqlite.exec(readFileSync('prisma/migrations/20261015160000_dq_lineage_occurrences/migration.sql', 'utf8'));
      expect(sqlite.prepare('SELECT publicId, sourceUrl, capturedAt, effectiveAt, contentRef, contentText FROM Version').get()).toEqual(before);
      expect(sqlite.prepare('SELECT sourceProvenance, contentArtifactHash FROM Version').get()).toEqual({ sourceProvenance: 'unknown', contentArtifactHash: null });
    } finally { sqlite.close(); }
  });

  it('stores A→B→A→B as four occurrences, two artifacts and three idempotent transitions', async () => {
    const snapshots = ['A', 'B', 'A', 'B'].map((text, index) => snapshot(index, text));
    for (let replay = 0; replay < 2; replay++) {
      const versions = [];
      for (const capture of snapshots) versions.push(await sync(capture));
      for (let index = 1; index < versions.length; index++) {
        const from = versions[index - 1]; const to = versions[index];
        await db.change.upsert({ where: { documentId_toVersionId: { documentId: document.id, toVersionId: to.id } },
          create: { publicId: `change-${from.publicId}-${to.publicId}`, documentId: document.id, fromVersionId: from.id, toVersionId: to.id, kind: 'detected', detectedAt: to.capturedAt }, update: {} });
      }
    }
    expect(await db.version.count()).toBe(4);
    expect(await db.contentArtifact.count()).toBe(2);
    expect(await db.change.count()).toBe(3);
    expect((await db.version.findMany({ orderBy: { sequence: 'asc' } })).map((version) => version.sequence)).toEqual([1, 2, 3, 4]);
  });

  it('projects a complete legacy A→B→A→B graph idempotently', async () => {
    await db.company.create({ data: { id: 'company', name: 'Fixture', slug: 'graph-fixture', industry: 'Test', website: 'https://example.com' } });
    await db.policy.create({ data: { id: 'policy', companyId: 'company', name: 'Privacy', type: 'privacy', url: 'https://example.com/privacy', currentText: 'B', currentHash: digest('B'), ingestionMethod: 'Direct Scrape' } });
    for (const [i, text] of ['A', 'B', 'A', 'B'].entries()) {
      const capture = snapshot(i, text);
      await db.policySnapshot.create({ data: { ...capture, policyId: 'policy', version: i + 1 } });
      if (i > 0) await db.policyChange.create({ data: {
        policyId: 'policy', oldSnapshotId: `snapshot-${i - 1}`, newSnapshotId: capture.id,
        diff: '[]', aiSummaryEn: 'Fixture', aiSummaryIt: 'Fixture', overallRisk: 'Low', overallScore: 1,
        remediationsJson: '[]', publicEvidence: true, publicPublishedAt: capture.createdAt,
        aiTrainingOptOut: 'Not assessed', aiDataScrapingRestricted: 'Not assessed', aiIpLicensing: 'Not assessed', aiPromptRetention: 'Not assessed', createdAt: capture.createdAt,
      } });
    }
    await db.$transaction(tx => syncCanonicalPolicyGraph(tx, 'policy'));
    const first = await db.version.findMany({ where: { document: { legacyPolicyId: 'policy' } }, orderBy: { sequence: 'asc' } });
    await db.policy.update({ where: { id: 'policy' }, data: { url: 'https://example.com/edited-configuration' } });
    await db.$transaction(tx => syncCanonicalPolicyGraph(tx, 'policy'));
    expect(await db.version.findMany({ where: { document: { legacyPolicyId: 'policy' } }, orderBy: { sequence: 'asc' } })).toEqual(first);
    expect(first).toHaveLength(4);
    expect(await db.contentArtifact.count()).toBe(2);
    expect(await db.change.count({ where: { kind: 'detected' } })).toBe(3);
  });

  it('preserves historical URL, effective date, content reference and public ID on replay', async () => {
    const capture = snapshot(0, 'A');
    const legacy = await db.version.create({ data: {
      publicId: buildPublicId(document.publicId, capture.hash), documentId: document.id, sequence: 1,
      contentHash: capture.hash, sourceUrl: 'https://example.com/historical', capturedAt: capture.createdAt,
      effectiveAt: date, contentRef: 'evidence://immutable-reference', contentText: 'A', legacySnapshotId: capture.id,
    } });
    sequence = 1;
    const result = await sync(capture, 'https://example.com/changed-administratively');
    expect(result.id).toBe(legacy.id);
    expect(result.publicId).toBe(legacy.publicId);
    expect(result.sourceUrl).toBe(legacy.sourceUrl);
    expect(result.effectiveAt).toEqual(date);
    expect(result.contentRef).toBe('evidence://immutable-reference');
    expect(result.sourceProvenance).toBe('unknown');
    expect(result.contentArtifactHash).toBe(capture.hash);
    const recurrence = await sync(snapshot(2, 'A'));
    expect(recurrence.publicId).not.toBe(legacy.publicId);
  });

  it('rejects altered content and capture times instead of rewriting evidence', async () => {
    const capture = snapshot(0, 'A');
    await sync(capture);
    await expect(sync({ ...capture, text: 'tampered' })).rejects.toThrow('canonical_content_hash_mismatch');
    await expect(sync({ ...capture, createdAt: new Date('2027-01-01') })).rejects.toThrow('immutable_evidence_conflict');
    expect(await db.version.count()).toBe(1);
  });

  it('labels legacy source reconstruction without claiming a verified historical URL', async () => {
    const capture = snapshot(0, 'A');
    const result = await sync({ ...capture, sourceUrl: undefined!, requestedUrl: undefined!, finalUrl: undefined!, sourceProvenance: 'unknown' });
    expect(result.sourceProvenance).toBe('reconstructed');
    expect(result.requestedUrl).toBeNull();
    expect(result.finalUrl).toBeNull();
  });
});
