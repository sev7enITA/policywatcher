import { buildPressKitPayload } from '@/lib/pressKit';

export const dynamic = 'force-static';

export function GET() {
  return Response.json(buildPressKitPayload(), {
    headers: {
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      'Content-Disposition': 'inline; filename="policywatcher-press-kit.json"',
    },
  });
}
