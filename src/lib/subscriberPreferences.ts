export const SUBSCRIBER_REGIONS = ['EU', 'US', 'Global'] as const;

export const SUBSCRIBER_INDUSTRIES = [
  'Tech Giant',
  'FinTech',
  'AI Provider',
  'Social Media',
  'Cloud/SaaS',
  'E-Commerce',
] as const;

export const SUBSCRIBER_FREQUENCIES = ['INSTANT', 'WEEKLY'] as const;

export function normalizePreferenceValue(value: string): string {
  return value.trim().replace(/\s*\/\s*/g, '/');
}

export function normalizePreferenceKey(value: string): string {
  return normalizePreferenceValue(value).toLowerCase();
}

export function splitPreferenceKeys(value: string): string[] {
  return value
    .split(',')
    .map((item) => normalizePreferenceKey(item))
    .filter(Boolean);
}
