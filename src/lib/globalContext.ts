export const GLOBAL_CONTEXT_SCHEMA = 'policywatcher.global-context.v1' as const;
export const GLOBAL_CONTEXT_STORAGE_KEY = 'policywatcher:global-context:v1' as const;
export const GLOBAL_CONTEXT_EVENT = 'policywatcher:global-context-change' as const;

export type GlobalRegion =
  | 'global'
  | 'europe'
  | 'north-america'
  | 'latin-america'
  | 'asia-pacific'
  | 'africa';

export type GlobalCountryCode =
  | 'all'
  | 'al' | 'at' | 'be' | 'bg' | 'hr' | 'cy' | 'cz' | 'dk' | 'fi' | 'fr'
  | 'de' | 'gr' | 'hu' | 'is' | 'ie' | 'it' | 'lv' | 'lt' | 'lu' | 'mk'
  | 'mt' | 'nl' | 'no' | 'pl' | 'pt' | 'ro' | 'sk' | 'si' | 'es' | 'se'
  | 'ch' | 'gb' | 'us' | 'ca' | 'br' | 'in' | 'au' | 'nz' | 'za' | 'gh'
  | 'ke' | 'ng';

export type PlatformLanguagePreference = 'auto' | 'en' | 'it';
export type PlatformLanguage = Exclude<PlatformLanguagePreference, 'auto'>;

export interface GlobalContext {
  version: 1;
  region: GlobalRegion;
  country: GlobalCountryCode;
  language: PlatformLanguagePreference;
}
export interface GlobalCountryOption {
  code: Exclude<GlobalCountryCode, 'all'>;
  region: Exclude<GlobalRegion, 'global'>;
  label: string;
  nativeLabel: string;
}

export const GLOBAL_REGION_LABELS: Readonly<Record<GlobalRegion, { en: string; it: string }>> = Object.freeze({
  global: { en: 'Global', it: 'Globale' },
  europe: { en: 'Europe', it: 'Europa' },
  'north-america': { en: 'North America', it: 'Nord America' },
  'latin-america': { en: 'Latin America', it: 'America Latina' },
  'asia-pacific': { en: 'Asia-Pacific', it: 'Asia-Pacifico' },
  africa: { en: 'Africa', it: 'Africa' },
});

export const GLOBAL_COUNTRIES: readonly GlobalCountryOption[] = Object.freeze([
  { code: 'al', region: 'europe', label: 'Albania', nativeLabel: 'Shqipëri' },
  { code: 'at', region: 'europe', label: 'Austria', nativeLabel: 'Österreich' },
  { code: 'be', region: 'europe', label: 'Belgium', nativeLabel: 'België / Belgique' },
  { code: 'bg', region: 'europe', label: 'Bulgaria', nativeLabel: 'България' },
  { code: 'hr', region: 'europe', label: 'Croatia', nativeLabel: 'Hrvatska' },
  { code: 'cy', region: 'europe', label: 'Cyprus', nativeLabel: 'Κύπρος' },
  { code: 'cz', region: 'europe', label: 'Czech Republic', nativeLabel: 'Česko' },
  { code: 'dk', region: 'europe', label: 'Denmark', nativeLabel: 'Danmark' },
  { code: 'fi', region: 'europe', label: 'Finland', nativeLabel: 'Suomi' },
  { code: 'fr', region: 'europe', label: 'France', nativeLabel: 'France' },
  { code: 'de', region: 'europe', label: 'Germany', nativeLabel: 'Deutschland' },
  { code: 'gr', region: 'europe', label: 'Greece', nativeLabel: 'Ελλάδα' },
  { code: 'hu', region: 'europe', label: 'Hungary', nativeLabel: 'Magyarország' },
  { code: 'is', region: 'europe', label: 'Iceland', nativeLabel: 'Ísland' },
  { code: 'ie', region: 'europe', label: 'Ireland', nativeLabel: 'Ireland' },
  { code: 'it', region: 'europe', label: 'Italy', nativeLabel: 'Italia' },
  { code: 'lv', region: 'europe', label: 'Latvia', nativeLabel: 'Latvija' },
  { code: 'lt', region: 'europe', label: 'Lithuania', nativeLabel: 'Lietuva' },
  { code: 'lu', region: 'europe', label: 'Luxembourg', nativeLabel: 'Lëtzebuerg' },
  { code: 'mk', region: 'europe', label: 'North Macedonia', nativeLabel: 'Северна Македонија' },
  { code: 'mt', region: 'europe', label: 'Malta', nativeLabel: 'Malta' },
  { code: 'nl', region: 'europe', label: 'Netherlands', nativeLabel: 'Nederland' },
  { code: 'no', region: 'europe', label: 'Norway', nativeLabel: 'Norge' },
  { code: 'pl', region: 'europe', label: 'Poland', nativeLabel: 'Polska' },
  { code: 'pt', region: 'europe', label: 'Portugal', nativeLabel: 'Portugal' },
  { code: 'ro', region: 'europe', label: 'Romania', nativeLabel: 'România' },
  { code: 'sk', region: 'europe', label: 'Slovakia', nativeLabel: 'Slovensko' },
  { code: 'si', region: 'europe', label: 'Slovenia', nativeLabel: 'Slovenija' },
  { code: 'es', region: 'europe', label: 'Spain', nativeLabel: 'España' },
  { code: 'se', region: 'europe', label: 'Sweden', nativeLabel: 'Sverige' },
  { code: 'ch', region: 'europe', label: 'Switzerland', nativeLabel: 'Schweiz / Suisse' },
  { code: 'gb', region: 'europe', label: 'United Kingdom', nativeLabel: 'United Kingdom' },
  { code: 'us', region: 'north-america', label: 'United States', nativeLabel: 'United States' },
  { code: 'ca', region: 'north-america', label: 'Canada', nativeLabel: 'Canada' },
  { code: 'br', region: 'latin-america', label: 'Brazil', nativeLabel: 'Brasil' },
  { code: 'in', region: 'asia-pacific', label: 'India', nativeLabel: 'India' },
  { code: 'au', region: 'asia-pacific', label: 'Australia', nativeLabel: 'Australia' },
  { code: 'nz', region: 'asia-pacific', label: 'New Zealand', nativeLabel: 'Aotearoa New Zealand' },
  { code: 'za', region: 'africa', label: 'South Africa', nativeLabel: 'South Africa' },
  { code: 'gh', region: 'africa', label: 'Ghana', nativeLabel: 'Ghana' },
  { code: 'ke', region: 'africa', label: 'Kenya', nativeLabel: 'Kenya' },
  { code: 'ng', region: 'africa', label: 'Nigeria', nativeLabel: 'Nigeria' },
]);

const REGIONS = new Set<GlobalRegion>(Object.keys(GLOBAL_REGION_LABELS) as GlobalRegion[]);
const COUNTRIES = new Set<GlobalCountryCode>(['all', ...GLOBAL_COUNTRIES.map((country) => country.code)]);
const LANGUAGES = new Set<PlatformLanguagePreference>(['auto', 'en', 'it']);

export const DEFAULT_GLOBAL_CONTEXT: Readonly<GlobalContext> = Object.freeze({
  version: 1,
  region: 'global',
  country: 'all',
  language: 'auto',
});

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function countryRegion(country: GlobalCountryCode): GlobalRegion {
  if (country === 'all') return 'global';
  return GLOBAL_COUNTRIES.find((option) => option.code === country)?.region ?? 'global';
}

export function normalizeGlobalContext(value: Partial<GlobalContext>): GlobalContext {
  const requestedRegion = REGIONS.has(value.region as GlobalRegion)
    ? value.region as GlobalRegion
    : DEFAULT_GLOBAL_CONTEXT.region;
  const country = COUNTRIES.has(value.country as GlobalCountryCode)
    ? value.country as GlobalCountryCode
    : 'all';
  const language = LANGUAGES.has(value.language as PlatformLanguagePreference)
    ? value.language as PlatformLanguagePreference
    : 'auto';
  const inferredRegion = countryRegion(country);
  const region = country === 'all'
    ? requestedRegion
    : inferredRegion;

  return { version: 1, region, country, language };
}

export function parseGlobalContext(raw: string | null): GlobalContext | null {
  if (!raw || raw.length > 2_000) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!isPlainObject(value)) return null;
    const allowed = new Set(['version', 'region', 'country', 'language']);
    if (Object.keys(value).some((key) => !allowed.has(key)) || value.version !== 1) return null;
    if (!REGIONS.has(value.region as GlobalRegion)) return null;
    if (!COUNTRIES.has(value.country as GlobalCountryCode)) return null;
    if (!LANGUAGES.has(value.language as PlatformLanguagePreference)) return null;
    return normalizeGlobalContext(value as Partial<GlobalContext>);
  } catch {
    return null;
  }
}

export function resolvePlatformLanguage(
  context: GlobalContext,
  browserLanguage = '',
): PlatformLanguage {
  if (context.language !== 'auto') return context.language;
  if (context.country === 'it') return 'it';
  if (context.country !== 'all') return 'en';
  return browserLanguage.toLocaleLowerCase('en').startsWith('it') ? 'it' : 'en';
}

export function resolveDashboardRegion(context: GlobalContext): 'EU' | 'US' | 'Global' {
  if (context.country === 'us') return 'US';
  if (context.region === 'europe') return 'EU';
  return 'Global';
}

export function globalContextLabel(context: GlobalContext, lang: PlatformLanguage): string {
  if (context.country !== 'all') {
    const country = GLOBAL_COUNTRIES.find((option) => option.code === context.country);
    if (country) return `${context.country.toUpperCase()} · ${lang === 'it' ? country.nativeLabel : country.label}`;
  }
  return GLOBAL_REGION_LABELS[context.region][lang];
}

export function readStoredGlobalContext(): GlobalContext {
  if (typeof window === 'undefined') return { ...DEFAULT_GLOBAL_CONTEXT };
  try {
    return parseGlobalContext(window.localStorage.getItem(GLOBAL_CONTEXT_STORAGE_KEY))
      ?? { ...DEFAULT_GLOBAL_CONTEXT };
  } catch {
    return { ...DEFAULT_GLOBAL_CONTEXT };
  }
}

export function storeGlobalContext(context: Partial<GlobalContext>): GlobalContext {
  const normalized = normalizeGlobalContext(context);
  if (typeof window === 'undefined') return normalized;
  try {
    window.localStorage.setItem(GLOBAL_CONTEXT_STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    // The setting remains active in this tab through the custom event.
  }
  window.dispatchEvent(new CustomEvent<GlobalContext>(GLOBAL_CONTEXT_EVENT, { detail: normalized }));
  return normalized;
}
