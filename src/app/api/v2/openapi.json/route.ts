import { NextResponse } from 'next/server';
import { getEnterpriseOpenApiDocument } from '@/lib/enterpriseOpenApi';

export function GET() {
  return NextResponse.json(getEnterpriseOpenApiDocument(), {
    headers: {
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
