import { NextResponse } from 'next/server';
import { pressKitSchemas } from '@/lib/pressKitSchemas';

export const dynamic = 'force-static';

type SchemaName = keyof typeof pressKitSchemas;

export function generateStaticParams() {
  return Object.keys(pressKitSchemas).map((schema) => ({ schema }));
}

export async function GET(_request: Request, context: { params: Promise<{ schema: string }> }) {
  const { schema } = await context.params;
  if (!(schema in pressKitSchemas)) return NextResponse.json({ error: 'Schema not found.' }, { status: 404 });
  return NextResponse.json(pressKitSchemas[schema as SchemaName], { headers: { 'Cache-Control': 'public, max-age=86400, immutable' } });
}
