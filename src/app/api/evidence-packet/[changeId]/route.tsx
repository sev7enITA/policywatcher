import { NextRequest, NextResponse } from 'next/server';
import { getPublicEvidencePacket } from '@/lib/evidencePacketData';
import { rateLimit } from '@/lib/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
  'X-Content-Type-Options': 'nosniff',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ changeId: string }> },
) {
  const limited = rateLimit(request, { intervalMs: 60_000, max: 60, name: 'public-evidence-packet' });
  if (limited) return limited;

  const { changeId } = await params;
  if (!UUID_RE.test(changeId)) {
    return NextResponse.json({ error: 'Evidence packet not found.' }, { status: 404 });
  }

  const unknownParameter = [...request.nextUrl.searchParams.keys()].some((key) => key !== 'format');
  const formatValues = request.nextUrl.searchParams.getAll('format');
  const format = formatValues[0] || 'json';
  if (unknownParameter || formatValues.length > 1 || (format !== 'json' && format !== 'pdf')) {
    return NextResponse.json(
      { error: 'Only format=json or format=pdf is supported.' },
      { status: 400 },
    );
  }

  try {
    const packet = await getPublicEvidencePacket(changeId);
    if (!packet || packet.publicationGate !== 'published') {
      return NextResponse.json({ error: 'Evidence packet not found.' }, { status: 404 });
    }

    const safeCompany = packet.company.name.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '');
    const baseFilename = `PolicyWatcher_Evidence_${safeCompany}_${packet.changeId}`;

    if (format === 'pdf') {
      const [{ renderToBuffer }, EvidencePacketReport] = await Promise.all([
        import('@react-pdf/renderer'),
        import('@/pdf/EvidencePacketReport').then((module) => module.default),
      ]);
      const buffer = await renderToBuffer(<EvidencePacketReport packet={packet} />);
      return new NextResponse(new Blob([new Uint8Array(buffer)], { type: 'application/pdf' }), {
        headers: {
          ...CACHE_HEADERS,
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${baseFilename}.pdf"`,
        },
      });
    }

    return NextResponse.json(packet, {
      headers: {
        ...CACHE_HEADERS,
        'Content-Disposition': `attachment; filename="${baseFilename}.json"`,
      },
    });
  } catch (error) {
    console.error('[Evidence Packet] Generation failed:', error);
    return NextResponse.json({ error: 'Evidence packet is temporarily unavailable.' }, { status: 503 });
  }
}
