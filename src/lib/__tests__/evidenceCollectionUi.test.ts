import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  EVIDENCE_COLLECTION_LIMIT,
  emptyLocalEvidenceCollection,
  parseLocalEvidenceCollection,
} from '@/components/AddToCollectionButton';

function uuid(index: number): string {
  return `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`;
}

const read = (path: string) => readFileSync(path, 'utf8');

describe('browser-local evidence collection state', () => {
  it('starts empty without creating server or identity state', () => {
    expect(emptyLocalEvidenceCollection()).toEqual({
      version: 1,
      title: '',
      selectedIds: [],
      reviewStates: {},
    });
  });

  it('rejects corrupt, unsupported and oversized storage values', () => {
    expect(parseLocalEvidenceCollection(null)).toBeNull();
    expect(parseLocalEvidenceCollection('{broken')).toBeNull();
    expect(parseLocalEvidenceCollection(JSON.stringify({ version: 2, selectedIds: [] }))).toBeNull();
    expect(parseLocalEvidenceCollection('x'.repeat(8001))).toBeNull();
  });

  it('normalizes, deduplicates and bounds selected public UUIDs', () => {
    const ids = Array.from({ length: EVIDENCE_COLLECTION_LIMIT + 2 }, (_, index) => uuid(index + 1));
    const parsed = parseLocalEvidenceCollection(JSON.stringify({
      version: 1,
      title: 'A'.repeat(100),
      selectedIds: [ids[0].toUpperCase(), ...ids, 'not-a-change-id'],
      reviewStates: {
        [ids[0]]: 'reviewed',
        [ids[1]]: 'invalid',
        'not-a-change-id': 'reviewing',
      },
    }));

    expect(parsed?.selectedIds).toHaveLength(EVIDENCE_COLLECTION_LIMIT);
    expect(parsed?.selectedIds[0]).toBe(ids[0]);
    expect(parsed?.title).toHaveLength(80);
    expect(parsed?.reviewStates).toEqual({ [ids[0]]: 'reviewed' });
  });
});

describe('evidence collection UI adjustments', () => {
  it('keeps evidence before the ledger and exposes reciprocal mobile navigation', () => {
    const source = read('src/app/collections/CollectionsClient.tsx');
    const styles = read('src/app/collections/collections.module.css');

    expect(source.indexOf('className={styles.register}')).toBeLessThan(source.indexOf('className={styles.ledger}'));
    expect(source).toContain('View collection · {selectedIds.length}/{EVIDENCE_COLLECTION_LIMIT}');
    expect(source).toContain('Back to evidence register');
    expect(styles).not.toContain('order: -1');
    expect(styles).not.toContain('.register:focus, .ledger:focus { outline: none; }');
    expect(styles).toContain('.register:focus-visible, .ledger:focus-visible');
  });

  it('progressively discloses search and export actions', () => {
    const source = read('src/app/collections/CollectionsClient.tsx');

    expect(source).toContain('!catalogUnavailable && records.length > 0');
    expect(source).toContain('selectedRecords.length > 0 &&');
    expect(source).not.toContain('aria-disabled');
    expect(source).toContain('Open Evidence Packets');
    expect(source).toContain('Read publication methodology');
  });

  it('places evidence data and public v1 endpoints before explanatory or pilot content', () => {
    const evidence = read('src/app/evidence/page.tsx');
    const developers = read('src/app/developers/page.tsx');

    expect(evidence.indexOf('id="evidence-register"')).toBeLessThan(evidence.indexOf('className={styles.spineSection}'));
    expect(evidence).toContain('Build an evidence collection');
    expect(developers.indexOf('id="endpoints"')).toBeLessThan(developers.indexOf('enterprise-api-heading'));
    expect(developers).toContain('30/min collections');
    expect(developers).toContain('<Footer lang="en" variant="compact" />');
    expect(read('src/app/integrations/page.tsx')).toContain('<Footer lang="en" variant="compact" />');
  });
});
