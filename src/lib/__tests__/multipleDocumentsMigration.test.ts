import { describe, expect, it } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('multiple official documents per company and document type', () => {
  it('preserves existing rows and permits distinct sources while rejecting exact duplicates', () => {
    const db = new DatabaseSync(':memory:');
    try {
      db.exec('CREATE TABLE Policy (id TEXT PRIMARY KEY, companyId TEXT, type TEXT, jurisdiction TEXT, url TEXT); CREATE UNIQUE INDEX Policy_companyId_type_jurisdiction_key ON Policy(companyId,type,jurisdiction);');
      const insert = db.prepare('INSERT INTO Policy VALUES(?,?,?,?,?)');
      insert.run('existing', 'company', 'privacy', 'Global', 'https://example.com/privacy');
      const migration = readFileSync(resolve('prisma/migrations/20261002050000_multiple_documents_per_type/migration.sql'), 'utf8');
      db.exec(migration);
      db.exec(migration); // Hostinger bootstrap plus Prisma replay is safe.
      insert.run('supplemental', 'company', 'privacy', 'Global', 'https://example.com/health-privacy');
      expect(db.prepare('SELECT id FROM Policy ORDER BY id').all()).toEqual([{ id: 'existing' }, { id: 'supplemental' }]);
      expect(() => insert.run('duplicate', 'company', 'privacy', 'Global', 'https://example.com/privacy')).toThrow(/UNIQUE/);
    } finally { db.close(); }
  });
});
