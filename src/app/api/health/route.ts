/**
 * PolicyWatcher - Health Check API
 *
 * @route GET /api/health
 *
 * Returns a minimal diagnostic JSON payload for deployment verification.
 * Used for deployment verification and monitoring dashboards.
 *
 * @auth    Bearer token via `Authorization` header.
 * @rateLimit None (protected by secret).
 *
 * @returns {{ status, timestamp, environment, database, process }}
 */
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { isAuthorized } from '@/lib/auth';

/**
 * Performs a lightweight health check of the running instance.
 *
 * Validates the bearer token, then checks whether the database file exists and
 * can be queried. It intentionally avoids returning filesystem paths or env
 * var inventories.
 *
 * @param request - The incoming request with a bearer token.
 * @returns JSON status object or a 401 if the secret is missing/invalid.
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
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
    } catch {
      companyCount = -1; // error
    }
  }

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: {
      exists: dbExists,
      companyCount,
    },
    process: {
      nodeEnv: process.env.NODE_ENV || 'undefined',
    }
  });
}
