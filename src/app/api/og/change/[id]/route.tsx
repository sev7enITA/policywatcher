/**
 * Dynamic OG image for a PolicyChange — /api/og/change/[id]
 *
 * Generates a branded 1200×630 PNG showing: company name, policy name,
 * risk gauge (colored score + bar), TL;DR snippet, PolicyWatcher branding.
 *
 * This is the single highest-leverage addition for social sharing: LinkedIn
 * and Twitter render OG images as visual cards, dramatically increasing CTR
 * vs text-only cards.
 *
 * Runtime: nodejs (ImageResponse works on node in Next 16, and we need Prisma).
 */
import { NextRequest } from 'next/server';
import { ImageResponse } from 'next/og';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
// OG images for the same change are stable — cache aggressively.
export const revalidate = 3600;

const UUID_RE = /^[a-f0-9-]{36}$/i;

function scoreColorHex(score: number): { bg: string; fg: string } {
  if (score >= 7) return { bg: '#dc2626', fg: '#fef2f2' };
  if (score >= 4) return { bg: '#d97706', fg: '#fffbeb' };
  return { bg: '#059669', fg: '#ecfdf5' };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Fast reject on junk
  if (!UUID_RE.test(id)) {
    return new Response('Not found', { status: 404 });
  }

  const change = await db.policyChange.findUnique({
    where: { id },
    select: {
      overallRisk: true,
      overallScore: true,
      tldrEn: true,
      tldrIt: true,
      aiSummaryEn: true,
      aiSummaryIt: true,
      createdAt: true,
      policy: {
        select: {
          name: true,
          type: true,
          company: { select: { name: true, industry: true } },
        },
      },
    },
  });

  if (!change) {
    return new Response('Not found', { status: 404 });
  }

  const score = change.overallScore;
  const colors = scoreColorHex(score);
  const companyName = change.policy.company.name;
  const policyName = change.policy.name;
  const industry = change.policy.company.industry;
  const tldr = (change.tldrEn || change.aiSummaryEn?.split('.')[0] || '').trim();
  const date = change.createdAt.toISOString().split('T')[0];
  const riskLabel = change.overallRisk.toUpperCase();

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
          color: '#ffffff',
          padding: '60px 70px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Brand row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 40,
          }}
        >
          <div style={{ display: 'flex', fontSize: 28, fontWeight: 800 }}>
            {`PolicyWatcher`}
          </div>
          <div style={{ display: 'flex', fontSize: 16, color: '#94a3b8', fontFamily: 'monospace' }}>
            {date}
          </div>
        </div>

        {/* Score + content row */}
        <div style={{ display: 'flex', gap: 50, flex: 1, alignItems: 'center' }}>
          {/* Score */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              minWidth: 220,
            }}
          >
            <div style={{ display: 'flex', fontSize: 110, fontWeight: 800, color: colors.bg }}>
              {`${score}/10`}
            </div>
            <div
              style={{
                display: 'flex',
                marginTop: 16,
                padding: '8px 24px',
                borderRadius: 999,
                background: colors.bg,
                color: colors.fg,
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              {`${riskLabel} RISK`}
            </div>
          </div>

          {/* Text content */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ display: 'flex', fontSize: 52, fontWeight: 800, marginBottom: 12 }}>
              {companyName}
            </div>
            <div style={{ display: 'flex', fontSize: 22, color: '#94a3b8', marginBottom: 28 }}>
              {`${policyName} · ${industry}`}
            </div>
            <div style={{ display: 'flex', fontSize: 24, lineHeight: 1.4, color: '#e2e8f0' }}>
              {`${tldr.substring(0, 170)}${tldr.length > 170 ? '…' : ''}`}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            marginTop: 30,
            paddingTop: 20,
            borderTop: '1px solid rgba(255,255,255,0.1)',
            fontSize: 14,
            color: '#64748b',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex' }}>
            {`policywatcher.online/change/${id.substring(0, 8)}`}
          </div>
          <div style={{ display: 'flex' }}>{`Alpha · AI-assisted · Not legal advice`}</div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
