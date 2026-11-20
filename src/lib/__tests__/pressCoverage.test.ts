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
    expect(pressCoverageRecords).toHaveLength(6);
    expect(new Set(pressCoverageRecords.map((record) => record.id)).size).toBe(6);
    for (const record of pressCoverageRecords) {
      expect(record.sourceUrl).toMatch(/^https:\/\//);
      expect(record.sourceUrl).not.toMatch(/[?&](utm_|rcm=)/);
      expect(record.publishedDate).toMatch(record.datePrecision === 'day' ? /^\d{4}-\d{2}-\d{2}$/ : /^\d{4}-\d{2}$/);
      expect(record.recordStatus).toBe('source-linked');
      expect(buildPressCoverageCitation(record)).toContain('(accessed [date]).');
    }
  });

  it('derives totals rather than publishing manual channel counts', () => {
    expect(getPressCoverageSummary()).toEqual({
      total: 6, sourceLinked: 6, editorial: 4, professionalPosts: 2, byLanguage: { en: 0, it: 6 },
    });
    const payload = buildPressCoveragePayload();
    expect(payload.records.slice(0, 2).map(record => [record.sourceName, record.dateLabel])).toEqual([
      ['Economy Magazine', '19 novembre 2026'], ['Fortune Italia', '18 novembre 2026'],
    ]);
    expect(payload.records.slice(2).every(record => record.reviewedAt === '2026-07-29')).toBe(true);
    expect(payload.summary.total).toBe(payload.records.length);
    expect(payload.boundary).toBe(PRESS_COVERAGE_BOUNDARY);
  });

  it('serves bounded JSON and CSV distributions with public cache controls', async () => {
    const json = GET(new NextRequest('https://policywatcher.online/api/press/coverage'));
    expect(json.status).toBe(200);
    expect(json.headers.get('cache-control')).toContain('s-maxage=3600');
    expect((await json.json()).records).toHaveLength(6);

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
