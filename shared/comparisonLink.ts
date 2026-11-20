export interface ComparisonPair { before: string; after: string; from: number; to: number }
export const isDigest = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
export const isVersion = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
export function comparisonPath(id: string, pair: ComparisonPair, lang: 'en' | 'it') {
  return `/briefing/comparison/${encodeURIComponent(id)}?before=${pair.before}&after=${pair.after}&from=${pair.from}&to=${pair.to}&lang=${lang}`;
}
