const TRANSIENT_PRISMA_WRITE_CODES = new Set(['P1008', 'P2034']);
const UNAVAILABLE_PRISMA_CODES = new Set(['P1001', 'P1003', 'P1008', 'P2021', 'P2022', 'P2034']);
const TRANSIENT_POSTGRESQL_CODES = new Set(['40001', '40P01']);
const UNAVAILABLE_POSTGRESQL_CODES = new Set(['40001', '40P01', '53300', '57P01', '57P02', '57P03', 'ECONNREFUSED']);

function errorParts(error: unknown): { code: string; detail: string } {
  if (!error || typeof error !== 'object') return { code: '', detail: '' };
  const value = error as { code?: unknown; message?: unknown; meta?: unknown };
  return {
    code: String(value.code || '').toUpperCase(),
    detail: `${String(value.message || '')} ${JSON.stringify(value.meta || {})}`,
  };
}

export function isTransientDatabaseWriteContention(error: unknown): boolean {
  const { code, detail } = errorParts(error);
  return TRANSIENT_PRISMA_WRITE_CODES.has(code)
    || TRANSIENT_POSTGRESQL_CODES.has(code)
    || /database is locked|sqlite_busy|operation timed out|serialization failure|could not serialize|deadlock detected/i.test(detail);
}

export function isDatabaseStorageUnavailable(error: unknown): boolean {
  const { code, detail } = errorParts(error);
  return UNAVAILABLE_PRISMA_CODES.has(code)
    || UNAVAILABLE_POSTGRESQL_CODES.has(code)
    || /no such (?:table|column)|does not exist|unable to open database file|database is locked|readonly database|database disk image is malformed|connection refused|connection terminated|too many connections|serialization failure|could not serialize|deadlock detected/i.test(detail);
}
