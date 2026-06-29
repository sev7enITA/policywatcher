/**
 * PolicyWatcher - Database Seed API
 *
 * @route POST /api/seed
 *
 * Triggers `prisma db push` followed by `prisma db seed` in the background.
 * Designed for first-time deployment: initialises the SQLite database and
 * populates it with the default set of monitored companies and policies.
 *
 * The work is spawned asynchronously so the HTTP response returns immediately,
 * avoiding reverse-proxy timeouts (e.g. on Hostinger).
 *
 * @auth    Bearer token via `Authorization` header and explicit
 *          ALLOW_DATABASE_SEED_ENDPOINT=true. Completely blocked in production.
 * @rateLimit None (protected by secret + env gate).
 *
 * @returns {{ success: boolean, message: string }}
 */
import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { isAuthorized } from '@/lib/auth';

/**
 * Initiates background database seeding.
 *
 * Guards: rejects production environments and unauthenticated callers.
 * On success, kicks off Prisma CLI commands via `execSync` inside a
 * microtask (`Promise.resolve().then(...)`) and returns a 200 immediately.
 *
 * @param request - The incoming request with bearer token.
 * @returns JSON acknowledgement, or 401/403 on auth/env failure.
 */
export async function POST(request: NextRequest) {
  // Block in production
  if (process.env.NODE_ENV === 'production' || process.env.ALLOW_DATABASE_SEED_ENDPOINT !== 'true') {
    return NextResponse.json(
      { error: 'Seed endpoint is disabled in production.' },
      { status: 403 }
    );
  }

  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: 'Unauthorized.' },
      { status: 401 }
    );
  }

  const cwd = process.cwd();
  const dbPath = path.join(cwd, 'prisma', 'dev.db');
  const dbUrl = `file:${dbPath}`;

  // Ensure the prisma directory exists
  const prismaDir = path.join(cwd, 'prisma');
  if (!fs.existsSync(prismaDir)) {
    fs.mkdirSync(prismaDir, { recursive: true });
  }

  // Run the seeding logic in the background to prevent Hostinger reverse proxy timeouts (503 Service Unavailable)
  Promise.resolve().then(() => {
    try {
      console.log('[Seed API] Starting background database setup...');
      
      // Run db push
      console.log('[Seed API] Running prisma db push...');
      const pushOutput = execSync('npx prisma db push --accept-data-loss 2>&1', {
        cwd,
        env: {
          ...process.env,
          DATABASE_URL: dbUrl,
        },
      });
      console.log('[Seed API] Push Output:', pushOutput.toString());

      // Run db seed
      console.log('[Seed API] Running prisma db seed...');
      const seedOutput = execSync('npx prisma db seed 2>&1', {
        cwd,
        env: {
          ...process.env,
          DATABASE_URL: dbUrl,
        },
      });
      console.log('[Seed API] Seed Output:', seedOutput.toString());
      console.log('[Seed API] Database successfully initialized and seeded in background!');
    } catch (bgError: unknown) {
      console.error('[Seed API] Background seeding failed:', bgError);
      if (bgError instanceof Error) {
        console.error('[Seed API] Command output was:', bgError.message);
      }
    }
  });

  return NextResponse.json({
    success: true,
    message: 'Database seed procedure started in the background.'
  });
}
