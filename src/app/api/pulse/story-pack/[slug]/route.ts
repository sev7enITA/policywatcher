import { NextRequest } from 'next/server';
import { getPulseStory, type PulseLocale } from '@/lib/editorialPulse';
import { buildDeterministicStoryZip } from '@/lib/storyPack';

export const revalidate = 86400;

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = getPulseStory(slug);
  if (!story) return new Response('Story not found.', { status: 404 });
  const lang: PulseLocale = request.nextUrl.searchParams.get('lang') === 'it' ? 'it' : 'en';
  const version = request.nextUrl.searchParams.get('version');
  if (version && version !== story.version) return new Response('Story Pack version not found.', { status: 404 });
  const bytes = buildDeterministicStoryZip(story, lang);
  const body = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  return new Response(body, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="policywatcher-${story.slug}-v${story.version}-${lang}.zip"`,
      'Cache-Control': 'public, max-age=3600, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
