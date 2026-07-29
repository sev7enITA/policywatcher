import { pulseLaunchKit } from '@/lib/editorialPulse';

export function GET() {
  return Response.json(pulseLaunchKit, {
    headers: {
      'Content-Disposition': 'attachment; filename="policywatcher-launch-kit-v1.0.0.json"',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
