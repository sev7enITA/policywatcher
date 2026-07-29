import { NextRequest } from 'next/server';
import { ImageResponse } from 'next/og';
import EditorialImageCard from '@/components/pulse/EditorialImageCard';
import { pressKitDataSnapshots } from '@/lib/pressKit';

export const runtime = 'nodejs';
export const revalidate = 86400;

export function GET(request: NextRequest) {
  const snapshot = pressKitDataSnapshots[0];
  return new ImageResponse(
    <EditorialImageCard eyebrow="Editorial Data Room" title={snapshot.title.en} fact={`${snapshot.files.map((file) => file.format).join(' · ')} · dated public distributions`} asOf={snapshot.asOf} boundary={snapshot.boundary.en} footer="policywatcher.online/press-kit/data" logoUrl={new URL('/logo-mark.png', request.url).toString()} compact />,
    { width: 1200, height: 630 },
  );
}
