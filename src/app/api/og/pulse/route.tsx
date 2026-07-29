import { NextRequest } from 'next/server';
import { ImageResponse } from 'next/og';
import EditorialImageCard from '@/components/pulse/EditorialImageCard';
import { PULSE_AS_OF, pulseStories } from '@/lib/editorialPulse';

export const runtime = 'nodejs';
export const revalidate = 86400;

export function GET(request: NextRequest) {
  return new ImageResponse(
    <EditorialImageCard eyebrow="PolicyWatcher Pulse" title="Verified story leads, packaged with their evidence boundaries" fact={`${pulseStories.length} human-approved leads · versioned Story Packs · reusable citations`} asOf={PULSE_AS_OF} boundary="Configured public evidence; not exhaustive coverage or legal advice." footer="policywatcher.online/pulse" logoUrl={new URL('/logo-mark.png', request.url).toString()} compact />,
    { width: 1200, height: 630 },
  );
}
