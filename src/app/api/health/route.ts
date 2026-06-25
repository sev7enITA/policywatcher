/**
 * PolicyWatcher - Health Check API
 *
 * @route GET /api/health?secret=<API_SECRET>
 *
 * Returns a diagnostic JSON payload including environment variable status,
 * database file existence/size, record counts, and Node.js version.
 * Used for deployment verification and monitoring dashboards.
 *
 * @auth    Query-parameter secret must match the `API_SECRET` env var.
 * @rateLimit None (protected by secret).
 *
 * @returns {{ status, timestamp, environment, database, process }}
 */
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

/**
 * Performs a lightweight health check of the running instance.
 *
 * Validates the `secret` query parameter, then inspects the SQLite database
 * file and env vars to build a status report. The DB count uses -1 as a
 * sentinel value to indicate a query error.
 *
 * @param request - The incoming request with `?secret=` query param.
 * @returns JSON status object or a 401 if the secret is missing/invalid.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.API_SECRET;
  const url = new URL(request.url);
  const paramSecret = url.searchParams.get('secret');

  if (!secret || !paramSecret || paramSecret !== secret) {
    return NextResponse.json(
      { error: 'Unauthorized.' },
      { status: 401 }
    );
  }

  const cwd = process.cwd();
  const dbPath = path.join(cwd, 'prisma', 'dev.db');
  const dbExists = fs.existsSync(dbPath);

  let companyCount = 0;
  if (dbExists) {
    try {
      const { db } = await import('@/lib/db');
      companyCount = await db.company.count();
    } catch (e) {
      companyCount = -1; // error
    }
  }

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY ? 'SET' : 'NOT SET',
      API_SECRET: process.env.API_SECRET ? 'SET' : 'NOT SET',
      SMTP_HOST: process.env.SMTP_HOST ? 'SET' : 'NOT SET',
      NODE_ENV: process.env.NODE_ENV || 'undefined',
    },
    database: {
      path: dbPath,
      exists: dbExists,
      sizeBytes: dbExists ? fs.statSync(dbPath).size : 0,
      companyCount,
    },
    process: {
      cwd,
      nodeVersion: process.version,
    }
  });
}
