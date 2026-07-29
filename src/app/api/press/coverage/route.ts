import { NextRequest, NextResponse } from 'next/server';
import {
  buildPressCoverageCitation,
  buildPressCoveragePayload,
  pressCoverageRecords,
} from '@/lib/pressCoverage';
import { rateLimit } from '@/lib/rateLimit';

const PUBLIC_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
  'Cache-Control': 'public, max-age=60, s-maxage=3600, stale-while-revalidate=86400',
  'X-Content-Type-Options': 'nosniff',
  Vary: 'Origin',
};

function csvCell(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

function buildCsv(): string {
  const header = ['id', 'source_name', 'platform', 'kind', 'language', 'published_date', 'date_precision', 'record_status', 'title', 'title_status', 'summary', 'source_url', 'relationship', 'recorded_at', 'reviewed_at', 'citation'];
  const rows = pressCoverageRecords.map((record) => [
    record.id, record.sourceName, record.platform, record.kind, record.language,
    record.publishedDate, record.datePrecision, record.recordStatus, record.title,
    record.titleStatus, record.summary, record.sourceUrl, record.relationship,
    record.recordedAt, record.reviewedAt, buildPressCoverageCitation(record),
  ]);
  return `${[header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n')}\n`;
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: PUBLIC_HEADERS });
}

export function GET(request: NextRequest) {
  const limited = rateLimit(request, { intervalMs: 60_000, max: 60, name: 'press-coverage-registry' });
  if (limited) {
    for (const [key, value] of Object.entries(PUBLIC_HEADERS)) limited.headers.set(key, value);
    return limited;
  }

  const format = request.nextUrl.searchParams.get('format');
  const hasUnknownParameter = [...request.nextUrl.searchParams.keys()].some((key) => key !== 'format');
  if (hasUnknownParameter) {
    return NextResponse.json(
      { error: 'Unsupported query parameter. Only format is accepted.' },
      { status: 400, headers: PUBLIC_HEADERS },
    );
  }
  if (format && format !== 'json' && format !== 'csv') {
    return NextResponse.json(
      { error: 'Invalid format parameter. Supported values are json and csv.' },
      { status: 400, headers: PUBLIC_HEADERS },
    );
  }

  if (format === 'csv') {
    return new NextResponse(buildCsv(), {
      status: 200,
      headers: {
        ...PUBLIC_HEADERS,
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="policywatcher-coverage-registry-2026-07-29.csv"',
      },
    });
  }

  return NextResponse.json(buildPressCoveragePayload(), {
    headers: { ...PUBLIC_HEADERS, 'Content-Disposition': 'attachment; filename="policywatcher-coverage-registry-2026-07-29.json"' },
  });
}
