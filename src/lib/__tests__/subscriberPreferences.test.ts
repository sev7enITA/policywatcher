import { describe, expect, it } from 'vitest';
import {
  normalizePreferenceKey,
  normalizePreferenceValue,
  splitPreferenceKeys,
} from '../subscriberPreferences';

describe('subscriberPreferences', () => {
  it('normalizes whitespace around compound preference values', () => {
    expect(normalizePreferenceValue('Cloud / SaaS')).toBe('Cloud/SaaS');
    expect(normalizePreferenceValue('  AI Provider  ')).toBe('AI Provider');
  });

  it('creates stable lowercase preference keys', () => {
    expect(normalizePreferenceKey('Cloud / SaaS')).toBe('cloud/saas');
    expect(normalizePreferenceKey(' Global ')).toBe('global');
  });

  it('splits comma-separated preference keys and removes empty entries', () => {
    expect(splitPreferenceKeys('EU, Cloud / SaaS, , FinTech')).toEqual([
      'eu',
      'cloud/saas',
      'fintech',
    ]);
  });
});
