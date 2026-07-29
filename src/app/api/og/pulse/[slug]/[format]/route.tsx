import { NextRequest } from 'next/server';
import { ImageResponse } from 'next/og';
import EditorialImageCard from '@/components/pulse/EditorialImageCard';
import { getPulseStory, pulseBeatLabels, pulseCardDimensions, type PulseCardFormat, type PulseLocale } from '@/lib/editorialPulse';

export const runtime = 'nodejs';
export const revalidate = 86400;

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string; format: string }> }) {
  const { slug, format: rawFormat } = await params;
  const story = getPulseStory(slug);
  if (!story || !(rawFormat in pulseCardDimensions)) return new Response('Not found', { status: 404 });
  const format = rawFormat as PulseCardFormat;
  const lang: PulseLocale = request.nextUrl.searchParams.get('lang') === 'it' ? 'it' : 'en';
  const dimensions = pulseCardDimensions[format];
  const logoUrl = new URL('/logo-mark.png', request.url).toString();
  return new ImageResponse(
    <EditorialImageCard
      eyebrow={`${pulseBeatLabels[story.beat][lang]} · Verified story lead`}
      title={story.headline[lang]}
      fact={`${story.facts[0].value} · ${story.facts[0].label[lang]}`}
      asOf={story.asOf}
      boundary={story.boundary[lang]}
      footer={`policywatcher.online/pulse/${story.slug} · Story Pack v${story.version}`}
      logoUrl={logoUrl}
      tall={format === 'feed' || format === 'story' || format === 'square'}
      compact={format === 'og'}
    />,
    { width: dimensions.width, height: dimensions.height },
  );
}
