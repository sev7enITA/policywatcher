import { NextRequest, NextResponse } from 'next/server';
import {
  evidenceCollectionToCsv,
  evidenceCollectionToMarkdown,
  parseEvidenceCollectionQuery,
} from '@/lib/evidenceCollection';
import { getPublicEvidenceCollection } from '@/lib/evidenceCollectionData';
import { rateLimit } from '@/lib/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const COMMON_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
  'X-Content-Type-Options': 'nosniff',
};

const ERROR_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};

export async function GET(request: NextRequest) {
  const limited = rateLimit(request, {
    intervalMs: 60_000,
    max: 30,
    name: 'public-collection',
    logClientIp: false,
  });
  if (limited) {
    for (const [name, value] of Object.entries(ERROR_HEADERS)) limited.headers.set(name, value);
    return limited;
  }

  const parsed = parseEvidenceCollectionQuery(request.nextUrl.searchParams);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400, headers: ERROR_HEADERS });
  }

  try {
    const collection = await getPublicEvidenceCollection(parsed.changeIds);
    if (!collection) {
      return NextResponse.json(
        { error: 'The requested public evidence collection is not available.' },
        { status: 404, headers: ERROR_HEADERS },
      );
    }

    const filename = `PolicyWatcher_Evidence_Collection_${collection.collectionId}`;
    if (parsed.format === 'markdown') {
      return new NextResponse(evidenceCollectionToMarkdown(collection), {
        headers: {
          ...COMMON_HEADERS,
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}.md"`,
        },
      });
    }
    if (parsed.format === 'csv') {
      return new NextResponse(evidenceCollectionToCsv(collection), {
        headers: {
          ...COMMON_HEADERS,
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
        },
      });
    }

    return NextResponse.json(collection, {
      headers: {
        ...COMMON_HEADERS,
        'Content-Disposition': `attachment; filename="${filename}.json"`,
      },
    });
  } catch (error) {
    console.error('[Evidence Collection] Generation failed:', error);
    return NextResponse.json(
      { error: 'The evidence collection is temporarily unavailable.' },
      { status: 503, headers: ERROR_HEADERS },
    );
  }
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Accept',
      'Access-Control-Max-Age': '86400',
    },
  });
}
