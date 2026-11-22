import { insightSchema } from '../../../../../integrations/policy-as-code/insight-ir.mjs';

export const runtime = 'nodejs';

export function GET() {
  return Response.json(insightSchema, { headers: {
    'Content-Type': 'application/schema+json; charset=utf-8',
    'Cache-Control': 'public, max-age=3600', 'X-Content-Type-Options': 'nosniff',
  } });
}
