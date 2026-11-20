export interface ComparisonPair { before: string; after: string }
export const isDigest = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
export function comparisonPath(id: string, pair: ComparisonPair, lang: 'en' | 'it') {
  return `/briefing/comparison/${encodeURIComponent(id)}?before=${pair.before}&after=${pair.after}&lang=${lang}`;
}
