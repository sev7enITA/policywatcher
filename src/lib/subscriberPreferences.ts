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

export const MAX_SUBSCRIBER_EMAIL_LENGTH = 254;

export function normalizePreferenceValue(value: string): string {
  return value.trim().split('/').map((segment) => segment.trim()).join('/');
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

export function isValidSubscriberEmail(value: string): boolean {
  if (!value || value.length > MAX_SUBSCRIBER_EMAIL_LENGTH) return false;

  let atIndex = -1;
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (character.trim() === '') return false;
    if (character !== '@') continue;
    if (atIndex !== -1) return false;
    atIndex = index;
  }

  if (atIndex <= 0 || atIndex >= value.length - 1) return false;
  const domain = value.slice(atIndex + 1);
  const dotIndex = domain.indexOf('.');
  return dotIndex > 0 && dotIndex < domain.length - 1;
}
