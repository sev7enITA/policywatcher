import { NextRequest } from 'next/server';
import { ImageResponse } from 'next/og';
import EditorialImageCard from '@/components/pulse/EditorialImageCard';
import { POLICYWATCHER_RELEASE_DATE } from '@/lib/release';

export const runtime = 'nodejs';
export const revalidate = 86400;

export function GET(request: NextRequest) {
  return new ImageResponse(
    <EditorialImageCard
      eyebrow="Verified public policy changes"
      title="Public evidence before interpretation"
      fact="Company policies · verified baselines · published changes · canonical source links"
      asOf={POLICYWATCHER_RELEASE_DATE}
      boundary="Evidence-gated monitoring; not legal advice or a compliance determination."
      footer="policywatcher.online"
      logoUrl={new URL('/logo-mark.png', request.url).toString()}
      compact
    />,
    { width: 1200, height: 630 },
  );
}
