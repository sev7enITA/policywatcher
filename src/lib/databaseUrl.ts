import path from 'path';

const DEFAULT_SQLITE_PATH = path.join(/*turbopackIgnore: true*/ process.cwd(), 'prisma', 'dev.db');

export function configuredDatabaseUrl(): string | null {
  const value = process.env.DATABASE_URL;
  if (typeof value !== 'string') return null;
  let trimmed = value.trim();

  if (trimmed.startsWith('DATABASE_URL=')) {
    trimmed = trimmed.slice('DATABASE_URL='.length).trim();
  }

  if (
    trimmed.length >= 2 &&
    ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'")))
  ) {
    trimmed = trimmed.slice(1, -1).trim();
  }

  return trimmed || null;
}

function normalizeSqliteUrl(url: string): string {
  if (!url.startsWith('file:')) return url;

  const rawPath = url.slice('file:'.length);
  if (!rawPath.startsWith('./') && !rawPath.startsWith('../')) return url;

  const absolutePath = path.resolve(/*turbopackIgnore: true*/ process.cwd(), 'prisma', rawPath);
  return `file:${absolutePath}`;
}

export function getDatabaseUrl(): string {
  const configured = configuredDatabaseUrl();
  if (configured) return normalizeSqliteUrl(configured);
  return `file:${DEFAULT_SQLITE_PATH}`;
}

export function getSqliteFilePath(databaseUrl = getDatabaseUrl()): string | null {
  if (!databaseUrl.startsWith('file:')) return null;

  const rawPath = databaseUrl.slice('file:'.length);
  if (rawPath.startsWith('///')) return `/${rawPath.slice(3)}`;
  if (rawPath.startsWith('/')) return rawPath;
  if (rawPath.startsWith('./') || rawPath.startsWith('../')) {
    return path.resolve(/*turbopackIgnore: true*/ process.cwd(), 'prisma', rawPath);
  }

  return path.resolve(/*turbopackIgnore: true*/ process.cwd(), rawPath);
}
