import { NextResponse } from 'next/server';

export async function GET() {
  // Safely expose environment keys and string properties (lengths/definitions)
  // to debug the Hostinger environment loader.
  const adminUser = process.env.ADMIN_USER;
  const adminPass = process.env.ADMIN_PASSWORD;

  return NextResponse.json({
    adminUser: {
      defined: typeof adminUser !== 'undefined',
      value: adminUser || null,
      length: adminUser?.length || 0,
      startsWithQuote: adminUser?.startsWith("'") || adminUser?.startsWith('"') || false,
    },
    adminPassword: {
      defined: typeof adminPass !== 'undefined',
      length: adminPass?.length || 0,
      startsWithQuote: adminPass?.startsWith("'") || adminPass?.startsWith('"') || false,
      endsWithQuote: adminPass?.endsWith("'") || adminPass?.endsWith('"') || false,
    },
    sessionSecret: {
      defined: typeof process.env.SESSION_HMAC_SECRET !== 'undefined',
      length: process.env.SESSION_HMAC_SECRET?.length || 0,
    },
    apiSecret: {
      defined: typeof process.env.API_SECRET !== 'undefined',
      length: process.env.API_SECRET?.length || 0,
    },
    nodeEnv: process.env.NODE_ENV || null,
    workingDir: process.cwd(),
  });
}
