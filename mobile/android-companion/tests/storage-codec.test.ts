import { describe, expect, it } from 'vitest';
import { migratePreferences, readWithFallback } from '../src/domain/storageCodec';

describe('storage migration and fallback', () => {
  it('migrates v1 onboarding and clamps collection data', () => {
    const migrated = migratePreferences({
      version: 1,
      locale: 'en',
      onboardingSeen: true,
      watchlist: ['company_1', 123],
      collection: [{ changeId: 'local-id', title: 'Title', companyName: 'Company', status: 'unknown' }],
    });
    expect(migrated.version).toBe(2);
    expect(migrated.locale).toBe('en');
    expect(migrated.explainerDismissed).toBe(true);
    expect(migrated.watchlist).toEqual(['company_1']);
    expect(migrated.collection[0]?.status).toBe('unreviewed');
  });

  it('returns safe defaults when storage throws or contains malformed JSON', async () => {
    await expect(readWithFallback(async () => { throw new Error('disk unavailable'); }, { safe: true })).resolves.toEqual({ safe: true });
    await expect(readWithFallback(async () => '{bad json', ['fallback'])).resolves.toEqual(['fallback']);
  });
});
