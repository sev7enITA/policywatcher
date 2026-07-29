/* eslint-disable @next/next/no-img-element */
import { NextRequest } from 'next/server';
import { ImageResponse } from 'next/og';
import EditorialImageCard from '@/components/pulse/EditorialImageCard';
import { PULSE_AS_OF, pulseLaunchKit } from '@/lib/editorialPulse';

export const runtime = 'nodejs';
export const revalidate = 86400;

export async function GET(request: NextRequest, { params }: { params: Promise<{ asset: string }> }) {
  const { asset } = await params;
  if (asset === 'product-hunt-thumbnail') {
    return new ImageResponse(
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#10213d' }}>
        <img src={new URL('/logo-mark.png', request.url).toString()} width="132" height="132" alt="" />
      </div>,
      { width: 240, height: 240 },
    );
  }
  if (asset !== 'product-hunt-gallery') return new Response('Not found', { status: 404 });
  return new ImageResponse(
    <EditorialImageCard eyebrow="Product launch asset" title="Trace public policy changes back to evidence" fact={pulseLaunchKit.productHunt.description} asOf={PULSE_AS_OF} boundary="Configured scope; AI-assisted assessments are not legal advice." footer="policywatcher.online/pulse" logoUrl={new URL('/logo-mark.png', request.url).toString()} compact />,
    { width: 1270, height: 760 },
  );
}
