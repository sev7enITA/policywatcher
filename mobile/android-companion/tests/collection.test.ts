import { describe, expect, it } from 'vitest';
import { addCollectionItem, buildCollectionUrl, canonicalizeChangeIds, COLLECTION_LIMIT, parseCollectionParam, type CollectionItem } from '../src/domain/collection';

function uuid(index: number) {
  return `00000000-0000-4000-8000-${index.toString(16).padStart(12, '0')}`;
}

function item(index: number): CollectionItem {
  return { changeId: uuid(index), title: `Private title ${index}`, companyName: 'Local company', status: 'reviewing', addedAt: '2026-08-18T10:20:00.000Z' };
}

describe('collection codec', () => {
  it('canonicalizes valid UUIDs, lowercases and removes duplicates', () => {
    expect(canonicalizeChangeIds([uuid(1).toUpperCase(), uuid(1), uuid(2)])).toEqual([uuid(1), uuid(2)]);
  });

  it('rejects malformed or oversized deep-link lists', () => {
    expect(parseCollectionParam('not-a-uuid')).toBeNull();
    expect(canonicalizeChangeIds(Array.from({ length: COLLECTION_LIMIT + 1 }, (_, index) => uuid(index)))).toBeNull();
  });

  it('enforces the 12-item limit when adding locally', () => {
    const full = Array.from({ length: COLLECTION_LIMIT }, (_, index) => item(index));
    expect(addCollectionItem(full, item(99))).toHaveLength(COLLECTION_LIMIT);
  });

  it('builds an ID-only canonical handoff URL', () => {
    const url = buildCollectionUrl('https://policywatcher.online', [item(1), item(2)]);
    expect(url).toBe(`https://policywatcher.online/collections?changes=${uuid(1)}%2C${uuid(2)}`);
    expect(url).not.toContain('Private');
    expect(url).not.toContain('reviewing');
  });
});
