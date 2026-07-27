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
import { isAuthorized } from '@/lib/auth';
import { getDatabaseDiagnostics } from '@/lib/databaseConfig';

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

  const database = await getDatabaseDiagnostics();

  let companyCount = 0;
  let queryOk = false;
  if (database.fileExists) {
    try {
      const { db } = await import('@/lib/db');
      companyCount = await db.company.count();
      queryOk = true;
    } catch {
      companyCount = -1; // error
    }
  }

  return NextResponse.json({
    status: queryOk ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    database: {
      configured: database.configured,
      directoryExists: database.directoryExists,
      directoryWritable: database.directoryWritable,
      exists: database.fileExists,
      sizeBytes: database.fileSizeBytes,
      companyCount,
    },
    process: {
      nodeEnv: process.env.NODE_ENV || 'undefined',
    }
  });
}
