export type InterfaceLanguage = 'en' | 'it';
export const LANGUAGE_PREFERENCE_COOKIE = 'policywatcher-language';

export function supportedLanguage(value: unknown): InterfaceLanguage | null {
  return value === 'en' || value === 'it' ? value : null;
}

/** Match the user's ordered browser preferences against the available translations. */
export function browserLanguage(languages: string | readonly string[] = []): InterfaceLanguage {
  const entries = (typeof languages === 'string' ? languages.split(',') : languages)
    .map((entry, index) => {
      const [tag, ...parameters] = entry.trim().split(';');
      const weight = parameters.find((parameter) => parameter.trim().startsWith('q='));
      return { language: supportedLanguage(tag.toLowerCase().split(/[-_]/)[0]),
        weight: weight ? Number(weight.trim().slice(2)) : 1, index };
    })
    .filter((entry) => entry.language && Number.isFinite(entry.weight) && entry.weight > 0 && entry.weight <= 1)
    .sort((a, b) => b.weight - a.weight || a.index - b.index);
  return entries[0]?.language ?? 'en';
}

export function requestLanguage(query: unknown, preference: unknown, acceptLanguage: string | null): InterfaceLanguage {
  return supportedLanguage(query) ?? supportedLanguage(preference) ?? browserLanguage(acceptLanguage ?? '');
}
