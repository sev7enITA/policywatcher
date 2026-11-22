import { NextRequest, NextResponse } from 'next/server';
import { getPublicInsight } from '@/lib/policyAsCodeData';
import { rateLimit } from '@/lib/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HEADERS = {
  'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow',
  'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer',
};

/** Public evidence only. There is no POST, import, activation or private mode. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ changeId: string }> }) {
  const limited = rateLimit(request, { intervalMs: 60_000, max: 30, name: 'public-insight', logClientIp: false });
  if (limited) {
    for (const [key, value] of Object.entries(HEADERS)) limited.headers.set(key, value);
    return limited;
  }
  const { changeId } = await params;
  const missing = () => NextResponse.json({ error: 'Insight not found.' }, { status: 404, headers: HEADERS });
  if (!UUID.test(changeId)) return missing();
  if ([...request.nextUrl.searchParams.keys()].length) {
    return NextResponse.json({ error: 'Query parameters are not supported.' }, { status: 400, headers: HEADERS });
  }
  try {
    const insight = await getPublicInsight(changeId);
    if (!insight || insight.visibility !== 'public') return missing();
    return NextResponse.json(insight, { headers: { ...HEADERS,
      'Link': '<https://policywatcher.online/schemas/insight-ir/0.1.0>; rel="describedby"; type="application/schema+json"',
      'Content-Disposition': `attachment; filename="PolicyWatcher_Insight_${changeId.toLowerCase()}.json"`,
    } });
  } catch {
    // Deliberately no raw exception, quote, ID, URL or request body in logs.
    return NextResponse.json({ error: 'Insight is temporarily unavailable.' }, { status: 503, headers: HEADERS });
  }
}
