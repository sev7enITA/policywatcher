import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  buildChangePublicId,
  buildDocumentPublicId,
  buildEntityPublicId,
  buildProvisionPublicId,
  buildVersionPublicId,
} from '@/lib/publicEvidenceIds';
import {
  getProvisionTaxon,
  isProvisionAssessment,
  isProvisionTaxonomyKey,
  PROVISION_ASSESSMENTS,
  PROVISION_TAXONOMY_BOUNDARY,
  PROVISION_TAXONOMY_KEYS,
  PROVISION_TAXONOMY_VERSION,
} from '@/lib/provisionTaxonomy';

describe('canonical document evidence model', () => {
  it('derives stable opaque IDs through the complete hierarchy', () => {
    const entity = buildEntityPublicId('openai');
    const document = buildDocumentPublicId(entity, 'terms:global');
    const version = buildVersionPublicId(document, 'sha256:abc123');
    const baseline = buildChangePublicId(document, null, version);
    const provision = buildProvisionPublicId(baseline, 'ai_training', 0);

    expect(entity).toMatch(/^ent_[a-f0-9]{32}$/);
    expect(document).toMatch(/^doc_[a-f0-9]{32}$/);
    expect(version).toMatch(/^ver_[a-f0-9]{32}$/);
    expect(baseline).toMatch(/^chg_[a-f0-9]{32}$/);
    expect(provision).toMatch(/^prv_[a-f0-9]{32}$/);
    expect(buildProvisionPublicId(baseline, 'ai_training', 0)).toBe(provision);
    expect(buildProvisionPublicId(baseline, 'ai_training', 1)).not.toBe(provision);
    expect(provision).not.toContain('openai');
  });

  it('rejects ambiguous or invalid public-ID inputs', () => {
    expect(() => buildEntityPublicId('   ')).toThrow('Invalid stable public ID input');
    expect(() => buildProvisionPublicId('chg_valid', 'liability', -1)).toThrow('non-negative');
    expect(buildEntityPublicId('cafe\u0301')).toBe(buildEntityPublicId('café'));
  });

  it('ships the exact initial versioned taxonomy without legal-conclusion claims', () => {
    expect(PROVISION_TAXONOMY_VERSION).toBe('1.0.0');
    expect(PROVISION_TAXONOMY_KEYS).toEqual([
      'ai_training',
      'data_sharing',
      'retention',
      'arbitration',
      'content_licensing',
      'liability',
    ]);
    expect(PROVISION_ASSESSMENTS).toEqual([
      'present',
      'absent',
      'conditional',
      'unclear',
      'not_assessed',
    ]);
    expect(getProvisionTaxon('content_licensing').label.it).toBe('Licenza sui contenuti');
    expect(isProvisionTaxonomyKey('arbitration')).toBe(true);
    expect(isProvisionTaxonomyKey('compliance')).toBe(false);
    expect(isProvisionAssessment('conditional')).toBe(true);
    expect(isProvisionAssessment('compliant')).toBe(false);
    expect(PROVISION_TAXONOMY_BOUNDARY).toMatch(/not a legal conclusion/i);
  });

  it('keeps Prisma, SQLite migration and both fallback initializers aligned', () => {
    const schema = readFileSync('prisma/schema.prisma', 'utf8');
    const migration = readFileSync(
      'prisma/migrations/20260820100000_document_evidence_model/migration.sql',
      'utf8',
    );
    const nodeFallback = readFileSync('scripts/hostinger-init-db.mjs', 'utf8');
    const pythonFallback = readFileSync('scripts/hostinger-init-db.py', 'utf8');
    const models = ['Entity', 'Document', 'Version', 'Change', 'Provision'];

    for (const model of models) {
      expect(schema).toContain(`model ${model} {`);
      expect(schema.match(new RegExp(`model ${model} \\{[\\s\\S]*?publicId\\s+String\\s+@unique`)))
        .toBeTruthy();
      expect(migration).toContain(`CREATE TABLE "${model}"`);
      expect(nodeFallback).toContain(`CREATE TABLE IF NOT EXISTS "${model}"`);
      expect(pythonFallback).toContain(`CREATE TABLE IF NOT EXISTS "${model}"`);
    }

    expect(schema).toContain('entity         Entity');
    expect(schema).toContain('document         Document');
    expect(schema).toContain('toVersion            Version');
    expect(schema).toContain('change          Change');
    expect(schema).toContain('contentRef       String?');
    expect(schema).toContain('contentText      String?');
    expect(migration).toContain('"contentRef" TEXT');
    expect(migration).toContain('Provision_changeId_fkey');
  });
});
