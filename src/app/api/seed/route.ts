/**
 * PolicyWatcher - Database Seed API
 *
 * @route GET /api/seed?secret=<API_SECRET>
 *
 * Triggers `prisma db push` followed by `prisma db seed` in the background.
 * Designed for first-time deployment: initialises the SQLite database and
 * populates it with the default set of monitored companies and policies.
 *
 * The work is spawned asynchronously so the HTTP response returns immediately,
 * avoiding reverse-proxy timeouts (e.g. on Hostinger).
 *
 * @auth    Query-parameter `secret` must match the `API_SECRET` env var.
 *          Completely blocked in production (`NODE_ENV=production` → 403).
 * @rateLimit None (protected by secret + env gate).
 *
 * @returns {{ success: boolean, message: string, details: { dbPath, cwd } }}
 */
import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

/**
 * Initiates background database seeding.
 *
 * Guards: rejects production environments and unauthenticated callers.
 * On success, kicks off Prisma CLI commands via `execSync` inside a
 * microtask (`Promise.resolve().then(...)`) and returns a 200 immediately.
 *
 * @param request - The incoming request with `?secret=` query param.
 * @returns JSON acknowledgement, or 401/403 on auth/env failure.
 */
export async function GET(request: NextRequest) {
  // Block in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Seed endpoint is disabled in production.' },
      { status: 403 }
    );
  }

  // Authorization check (deny by default)
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
    } catch (bgError: any) {
      console.error('[Seed API] Background seeding failed:', bgError);
      console.error('[Seed API] Command output was:', bgError.stdout?.toString() || bgError.message);
    }
  });

  return NextResponse.json({
    success: true,
    message: 'Procedura avviata in background con successo! Attendi circa 15-20 secondi e poi ricarica la homepage per vedere i dati delle aziende.',
    details: {
      dbPath,
      cwd
    }
  });
}
