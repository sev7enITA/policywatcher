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
import { getDatabaseUrl } from './databaseUrl';

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
