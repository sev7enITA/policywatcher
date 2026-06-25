/**
 * PolicyWatcher - Executive PDF Report API
 *
 * GET /api/report/[policyId]?lang=en|it
 *
 * Generates a one-page branded A4 PDF (server-side via @react-pdf/renderer)
 * for board / legal reporting. The PDF is NEVER fabricated: it renders the
 * latest stored analysis for the policy. If no analysis exists yet, it
 * returns a clear 404 instead of an empty report.
 *
 * Response: application/pdf (inline): browsers show it; "Save as" works.
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

import { rateLimit } from '@/lib/rateLimit';

// renderToBuffer is only available in a Node runtime (not edge). We force it.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Generates and returns a branded A4 PDF for a specific policy.
 *
 * Lazy-imports `@react-pdf/renderer` and the `ExecutiveReport` component
 * so the heavy PDF dependencies are only loaded on-demand. The generated
 * buffer is streamed back as `application/pdf` with an inline disposition
 * so browsers display it directly.
 *
 * @param request  - The incoming request with optional `?lang=en|it`.
 * @param params   - Route params promise containing `{ policyId: string }`.
 * @returns A PDF binary response, 404 if the policy/analysis is missing, or 500 on error.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ policyId: string }> }
) {
  const limited = rateLimit(request, { intervalMs: 60_000, max: 60, name: 'public-get' });
  if (limited) return limited;

  try {
    const { policyId } = await params;
    const { searchParams } = new URL(request.url);
    const lang = (searchParams.get('lang') as 'en' | 'it') || 'en';

    const policy = await db.policy.findUnique({
      where: { id: policyId },
      include: {
        company: true,
        changes: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { regionImpacts: true },
        },
      },
    });

    if (!policy) {
      return NextResponse.json(
        { error: 'Policy non trovata.' },
        { status: 404 }
      );
    }

    const latestChange = policy.changes[0];
    if (!latestChange) {
      // No analysis available: do NOT fabricate a report.
      return NextResponse.json(
        {
          error:
            lang === 'it'
              ? 'Nessuna analisi disponibile per questa policy. Esegui prima una scansione.'
              : 'No analysis available for this policy. Run a scan first.',
        },
        { status: 404 }
      );
    }

    // Lazy-import the renderer + document component so the heavy PDF libs
    // are only loaded when this route is actually hit.
    const { renderToBuffer } = await import('@react-pdf/renderer');
    const ExecutiveReport = (await import('@/pdf/ExecutiveReport')).default;

    const screeningDate = latestChange.createdAt
      .toISOString()
      .split('T')[0];

    const buffer = await renderToBuffer(
      <ExecutiveReport
        companyName={policy.company.name}
        policyName={policy.name}
        change={latestChange as never}
        lang={lang}
        screeningDate={screeningDate}
        policyUrl={policy.url}
      />
    );

    const safeName = policy.company.name.replace(/[^a-z0-9]/gi, '_');
    const filename = `PolicyWatcher_${safeName}_${screeningDate}.pdf`;

    // renderToBuffer returns a Node Buffer; convert to a Blob which
    // NextResponse reliably accepts as BodyInit across TS lib versions.
    const pdfBlob = new Blob([new Uint8Array(buffer)], {
      type: 'application/pdf',
    });

    return new NextResponse(pdfBlob, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error generating PDF report:', error);
    return NextResponse.json(
      {
        error: 'Errore durante la generazione del PDF.',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
