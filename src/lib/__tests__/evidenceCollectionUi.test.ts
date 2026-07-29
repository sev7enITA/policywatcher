import { describe, expect, it } from 'vitest';
import {
  EVIDENCE_COLLECTION_LIMIT,
  emptyLocalEvidenceCollection,
  parseLocalEvidenceCollection,
} from '@/components/AddToCollectionButton';

function uuid(index: number): string {
  return `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`;
}

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
