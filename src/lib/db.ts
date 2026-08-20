/**
 * @module db
 *
 * Singleton Prisma client for PolicyWatcher.
 *
 * Uses the global-object caching pattern recommended by Next.js to prevent
 * multiple PrismaClient instances from being created during development
 * hot-reloads.  The SQLite database path is resolved dynamically so that
 * it works regardless of the working directory at runtime.
 */

import { PrismaClient } from '@prisma/client';
import { getDatabaseProvider, getDatabaseUrl } from './databaseUrl';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const dbUrl = getDatabaseUrl();

/**
 * Shared PrismaClient instance.
 * Reuses an existing client from the global scope in development to
 * avoid exhausting database connections during Next.js hot-reloads.
 */
export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: ['error'],
  });

// Cache the client on the global object in non-production environments
// so that hot-reloads do not create additional connections.
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

/**
 * SQLite busy_timeout is connection-scoped, unlike persistent WAL mode. Start
 * its configuration as soon as the singleton is created so it is queued before
 * request work on Prisma's SQLite connection. PostgreSQL needs no PRAGMA.
 */
export const databaseRuntimeConfiguration = getDatabaseProvider(dbUrl) === 'sqlite'
  ? db.$queryRawUnsafe<Array<Record<string, unknown>>>('PRAGMA busy_timeout = 5000')
  : Promise.resolve(0);

void databaseRuntimeConfiguration.catch((error) => {
  console.error('[Database] Runtime contention configuration failed:', error instanceof Error ? error.message : 'unknown_error');
});
