/**
 * Safe parsers for the JSON-encoded structured AI fields stored on PolicyChange.
 * Always return a valid array (never throw), so the UI degrades gracefully for
 * older DB rows that don't have the new columns yet.
 */
import type { KeyPoint, RiskReason, Remediation } from '@/types';

export function parseKeyPoints(json: string | undefined | null): KeyPoint[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) return parsed as KeyPoint[];
  } catch {
    /* ignore */
  }
  return [];
}

export function parseRiskReasons(json: string | undefined | null): RiskReason[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) return parsed.slice(0, 3) as RiskReason[];
  } catch {
    /* ignore */
  }
  return [];
}

export function parseRemediations(json: string | undefined | null): Remediation[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) return parsed as Remediation[];
  } catch {
    /* ignore */
  }
  return [];
}
