import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, OPTIONS } from '@/app/api/press/coverage/route';
import {
  PRESS_COVERAGE_BOUNDARY,
  buildPressCoverageCitation,
  buildPressCoveragePayload,
  getPressCoverageSummary,
  pressCoverageRecords,
} from '@/lib/pressCoverage';
import { pressKitSchemas } from '@/lib/pressKitSchemas';

describe('public press coverage registry', () => {
  it('keeps one stable, source-linked record per public reference', () => {
    expect(pressCoverageRecords).toHaveLength(4);
    expect(new Set(pressCoverageRecords.map((record) => record.id)).size).toBe(4);
    for (const record of pressCoverageRecords) {
      expect(record.sourceUrl).toMatch(/^https:\/\//);
      expect(record.sourceUrl).not.toMatch(/[?&](utm_|rcm=)/);
      expect(record.publishedDate).toMatch(/^\d{4}-\d{2}$/);
      expect(record.datePrecision).toBe('month');
      expect(record.recordStatus).toBe('source-linked');
      expect(buildPressCoverageCitation(record)).toContain('(accessed [date]).');
    }
  });

  it('derives totals rather than publishing manual channel counts', () => {
    expect(getPressCoverageSummary()).toEqual({
      total: 4, sourceLinked: 4, editorial: 2, professionalPosts: 2, byLanguage: { en: 0, it: 4 },
    });
    const payload = buildPressCoveragePayload();
    expect(payload.summary.total).toBe(payload.records.length);
    expect(payload.boundary).toBe(PRESS_COVERAGE_BOUNDARY);
  });

  it('serves bounded JSON and CSV distributions with public cache controls', async () => {
    const json = GET(new NextRequest('https://policywatcher.online/api/press/coverage'));
    expect(json.status).toBe(200);
    expect(json.headers.get('cache-control')).toContain('s-maxage=3600');
    expect((await json.json()).records).toHaveLength(4);

    const csv = GET(new NextRequest('https://policywatcher.online/api/press/coverage?format=csv'));
    expect(csv.status).toBe(200);
    expect(csv.headers.get('content-type')).toContain('text/csv');
    expect(await csv.text()).toContain('coverage-toms-hardware-it-2026-07');

    const invalid = GET(new NextRequest('https://policywatcher.online/api/press/coverage?format=xml'));
    expect(invalid.status).toBe(400);
    const unknown = GET(new NextRequest('https://policywatcher.online/api/press/coverage?format=json&scope=all'));
    expect(unknown.status).toBe(400);
    expect(OPTIONS().status).toBe(204);
    expect(pressKitSchemas['press-coverage'].$id).toBe('https://policywatcher.online/schemas/press-coverage/v1');
  });
});
