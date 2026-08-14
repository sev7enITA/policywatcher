import { NextRequest } from 'next/server';
import { ImageResponse } from 'next/og';
import EditorialImageCard from '@/components/pulse/EditorialImageCard';
import { pressKitReleases } from '@/lib/pressKit';

export const runtime = 'nodejs';
export const revalidate = 86400;

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const release = pressKitReleases.find((entry) => entry.slug === slug);
  if (!release) return new Response('Not found', { status: 404 });
  return new ImageResponse(
    <EditorialImageCard eyebrow={`${release.category} release · ${release.displayVersion}`} title={release.title.en} fact={release.summary.en} asOf={release.dateModified} boundary={release.boundaries[0].en} footer={`policywatcher.online/press-kit/releases/${release.slug}`} logoUrl={new URL('/logo-mark.png', request.url).toString()} compact />,
    { width: 1200, height: 630 },
  );
}
