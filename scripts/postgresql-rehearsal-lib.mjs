import { createHash } from 'node:crypto';

export const REHEARSAL_ACK = 'I_UNDERSTAND_THIS_WRITES_TO_A_DISPOSABLE_POSTGRESQL_DATABASE';
export const SENSITIVE_DATA_ACK = 'I_APPROVE_SENSITIVE_DATA_IN_THIS_ISOLATED_REHEARSAL';
export const SAFE_DATABASE_NAME_PATTERN = /(?:^|[_-])(rehearsal|staging|test|testing|ci|sandbox|preview)(?:[_-]|$)/i;

const SCALAR_TYPES = new Set([
  'String', 'Boolean', 'Int', 'BigInt', 'Float', 'Decimal', 'DateTime', 'Json', 'Bytes',
]);

export function normalizeUrl(value) {
  if (typeof value !== 'string') return '';
  let normalized = value.trim();
  if (
    normalized.length >= 2
    && ((normalized.startsWith('"') && normalized.endsWith('"'))
      || (normalized.startsWith("'") && normalized.endsWith("'")))
  ) {
    normalized = normalized.slice(1, -1).trim();
  }
  return normalized;
}

export function parsePostgresqlTarget(value) {
  const normalized = normalizeUrl(value);
  let parsed;
  try {
    parsed = new URL(normalized);
  } catch {
    throw new Error('REHEARSAL_TARGET_URL_INVALID');
  }
  if (!['postgresql:', 'postgres:'].includes(parsed.protocol)) {
    throw new Error('REHEARSAL_TARGET_MUST_BE_POSTGRESQL');
  }

  const databaseName = decodeURIComponent(parsed.pathname.replace(/^\//, '')).trim();
  if (!/^[A-Za-z0-9_.-]+$/.test(databaseName) || !SAFE_DATABASE_NAME_PATTERN.test(databaseName)) {
    throw new Error('REHEARSAL_TARGET_NAME_MUST_SIGNAL_ISOLATION');
  }
  const schema = parsed.searchParams.get('schema') || 'public';
  if (schema !== 'public') throw new Error('REHEARSAL_TARGET_SCHEMA_MUST_BE_PUBLIC');

  const identity = `${parsed.protocol}//${parsed.hostname.toLowerCase()}:${parsed.port || '5432'}/${databaseName}?schema=${schema}`;
  return {
    url: normalized,
    databaseName,
    schema,
    fingerprint: createHash('sha256').update(identity).digest('hex'),
  };
}

export function assertRehearsalSafety({ targetUrl, directUrl, acknowledgment, includeSensitive, sensitiveAcknowledgment }) {
  const target = parsePostgresqlTarget(targetUrl);
  const direct = parsePostgresqlTarget(directUrl || targetUrl);
  if (target.databaseName !== direct.databaseName || target.schema !== direct.schema) {
    throw new Error('REHEARSAL_DIRECT_TARGET_MISMATCH');
  }
  if (acknowledgment !== REHEARSAL_ACK) throw new Error('REHEARSAL_ACK_REQUIRED');
  if (includeSensitive && sensitiveAcknowledgment !== SENSITIVE_DATA_ACK) {
    throw new Error('REHEARSAL_SENSITIVE_DATA_ACK_REQUIRED');
  }
  return { target, direct };
}

function parseModelBlocks(schema) {
  return [...schema.matchAll(/^model\s+(\w+)\s+\{([\s\S]*?)^\}/gm)]
    .map((match) => ({ name: match[1], body: match[2] }));
}

export function parsePrismaModels(schema) {
  const blocks = parseModelBlocks(schema);
  const modelNames = new Set(blocks.map((block) => block.name));

  return blocks.map((block) => {
    const fields = [];
    const dependencies = new Set();
    let compoundId = [];

    for (const rawLine of block.body.split('\n')) {
      const line = rawLine.trim();
      if (!line || line.startsWith('//')) continue;
      if (line.startsWith('@@id(')) {
        const match = line.match(/@@id\(\[([^\]]+)\]/);
        compoundId = match ? match[1].split(',').map((field) => field.trim()) : [];
        continue;
      }
      if (line.startsWith('@@')) continue;

      const [name, declaredType] = line.split(/\s+/, 3);
      if (!name || !declaredType) continue;
      const type = declaredType.replace(/[?\[\]]/g, '');
      if (modelNames.has(type)) {
        if (line.includes('@relation(') && line.includes('fields:') && type !== block.name) dependencies.add(type);
        continue;
      }
      if (!SCALAR_TYPES.has(type)) throw new Error(`UNSUPPORTED_PRISMA_SCALAR:${block.name}.${name}:${type}`);
      fields.push({
        name,
        type,
        optional: declaredType.endsWith('?'),
        id: /(?:^|\s)@id(?:\s|$|\()/.test(line),
      });
    }

    const idFields = fields.filter((field) => field.id).map((field) => field.name);
    return {
      name: block.name,
      delegate: `${block.name[0].toLowerCase()}${block.name.slice(1)}`,
      fields,
      idFields: idFields.length > 0 ? idFields : compoundId,
      dependencies: [...dependencies],
    };
  });
}

export function orderModelsByDependencies(models) {
  const byName = new Map(models.map((model) => [model.name, model]));
  const visiting = new Set();
  const visited = new Set();
  const result = [];

  function visit(model) {
    if (visited.has(model.name)) return;
    if (visiting.has(model.name)) throw new Error(`CYCLIC_MODEL_DEPENDENCY:${model.name}`);
    visiting.add(model.name);
    for (const dependencyName of model.dependencies) {
      const dependency = byName.get(dependencyName);
      if (!dependency) throw new Error(`UNKNOWN_MODEL_DEPENDENCY:${model.name}:${dependencyName}`);
      visit(dependency);
    }
    visiting.delete(model.name);
    visited.add(model.name);
    result.push(model);
  }

  for (const model of models) visit(model);
  return result;
}

function normalizeDate(value, fieldLabel) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  const candidate = typeof value === 'bigint'
    ? Number(value)
    : typeof value === 'string' && /^-?\d+$/.test(value.trim())
      ? Number(value)
      : value;
  const date = new Date(candidate);
  if (Number.isNaN(date.getTime())) throw new Error(`INVALID_DATETIME:${fieldLabel}`);
  return date;
}

function normalizeFieldValue(field, value, modelName) {
  if (value === null || value === undefined) {
    if (!field.optional && value === undefined) throw new Error(`MISSING_FIELD:${modelName}.${field.name}`);
    return null;
  }
  if (field.type === 'DateTime') return normalizeDate(value, `${modelName}.${field.name}`);
  if (field.type === 'Boolean') return typeof value === 'boolean' ? value : Number(value) !== 0;
  if (field.type === 'Int' || field.type === 'Float') return Number(value);
  if (field.type === 'BigInt') return typeof value === 'bigint' ? value : BigInt(value);
  if (field.type === 'Decimal') return String(value);
  if (field.type === 'Json' && typeof value === 'string') {
    try { return JSON.parse(value); } catch { throw new Error(`INVALID_JSON:${modelName}.${field.name}`); }
  }
  if (field.type === 'String') return typeof value === 'string' ? value : String(value);
  return value;
}

export function normalizeModelRow(model, row) {
  return Object.fromEntries(model.fields.map((field) => [
    field.name,
    normalizeFieldValue(field, row[field.name], model.name),
  ]));
}

function canonicalJson(value) {
  if (Array.isArray(value)) return value.map(canonicalJson);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, canonicalJson(value[key])]),
    );
  }
  return value;
}

function canonicalValue(value) {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return { date: value.toISOString() };
  if (typeof value === 'bigint') return { bigint: value.toString() };
  if (value instanceof Uint8Array) return { bytes: Buffer.from(value).toString('base64') };
  if (typeof value === 'object') return { json: JSON.stringify(canonicalJson(value)) };
  return value;
}

export function digestModelRows(model, rows) {
  const normalizedRows = rows.map((row) => normalizeModelRow(model, row));
  const keyFields = model.idFields.length > 0 ? model.idFields : model.fields.map((field) => field.name);
  normalizedRows.sort((left, right) => {
    const leftKey = JSON.stringify(keyFields.map((field) => canonicalValue(left[field])));
    const rightKey = JSON.stringify(keyFields.map((field) => canonicalValue(right[field])));
    return leftKey.localeCompare(rightKey);
  });

  const digest = createHash('sha256');
  for (const row of normalizedRows) {
    digest.update(JSON.stringify(model.fields.map((field) => canonicalValue(row[field.name]))));
    digest.update('\n');
  }
  return digest.digest('hex');
}
