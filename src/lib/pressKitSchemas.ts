const localized = {
  type: 'object',
  required: ['en', 'it'],
  properties: { en: { type: 'string' }, it: { type: 'string' } },
  additionalProperties: false,
} as const;

export const pressKitSchemas = {
  'press-kit': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: 'https://policywatcher.online/schemas/press-kit/v1',
    title: 'PolicyWatcher Press Kit payload',
    type: 'object',
    required: ['schema', 'schemaVersion', 'generatedAt', 'canonicalUrl', 'product', 'facts', 'claims', 'assets', 'packages', 'releases', 'boundaries'],
    properties: {
      schema: { const: 'https://policywatcher.online/schemas/press-kit/v1' },
      schemaVersion: { type: 'string' },
      generatedAt: { type: 'string', format: 'date' },
      canonicalUrl: { type: 'string', format: 'uri' },
      product: { type: 'object' }, facts: { type: 'array' }, claims: { type: 'array' }, assets: { type: 'array' }, packages: { type: 'array' }, releases: { type: 'array' }, boundaries: { type: 'array', items: { type: 'string' } },
    },
  },
  'press-kit-asset-manifest': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: 'https://policywatcher.online/schemas/press-kit-asset-manifest/v1',
    title: 'PolicyWatcher Press Kit asset manifest',
    type: 'object',
    required: ['schemaVersion', 'generatedAt', 'release', 'contentCredentials', 'assets'],
    properties: { schemaVersion: { type: 'string' }, generatedAt: { type: 'string', format: 'date' }, release: { type: 'string' }, contentCredentials: { const: 'not-attached' }, assets: { type: 'array', items: { type: 'object', required: ['filename', 'mediaType', 'bytes', 'sha256'], properties: { filename: { type: 'string' }, mediaType: { type: 'string' }, bytes: { type: 'integer', minimum: 0 }, sha256: { type: 'string', pattern: '^[a-f0-9]{64}$' }, creditLine: { type: 'string' }, rightsUrl: { type: 'string' } } } } },
  },
  'press-kit-package-manifest': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: 'https://policywatcher.online/schemas/press-kit-package-manifest/v1',
    title: 'PolicyWatcher Press Kit package manifest',
    type: 'object',
    required: ['schemaVersion', 'generatedAt', 'release', 'packages'],
    properties: { schemaVersion: { type: 'string' }, generatedAt: { type: 'string', format: 'date' }, release: { type: 'string' }, packages: { type: 'array', items: { type: 'object', required: ['locale', 'filename', 'bytes', 'sha256'], properties: { locale: { enum: ['en', 'it'] }, filename: { type: 'string' }, bytes: { type: 'integer' }, sha256: { type: 'string', pattern: '^[a-f0-9]{64}$' } } } } },
  },
  'press-kit-media-metadata': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: 'https://policywatcher.online/schemas/press-kit-media-metadata/v1',
    title: 'PolicyWatcher Press Kit media metadata',
    type: 'object',
    required: ['schemaVersion', 'standard', 'contentCredentials', 'assets'],
    properties: { schemaVersion: { type: 'string' }, standard: { const: 'IPTC Photo Metadata 2025.1' }, contentCredentials: { const: 'not-attached' }, vectorMasterAvailable: { type: 'boolean' }, assets: { type: 'object', additionalProperties: { type: 'object', properties: { title: localized, description: localized, alt: localized, usage: localized } } } },
  },
  'press-kit-data-snapshot': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: 'https://policywatcher.online/schemas/press-kit-data-snapshot/v1',
    title: 'PolicyWatcher configured-scope data snapshot',
    type: 'object',
    required: ['snapshotId', 'asOf', 'generatedAt', 'facts', 'boundary'],
    properties: { snapshotId: { type: 'string' }, asOf: { type: 'string', format: 'date' }, generatedAt: { type: 'string', format: 'date' }, facts: { type: 'array', items: { type: 'object', required: ['id', 'value', 'unit', 'scope'], properties: { id: { type: 'string' }, value: { type: 'string' }, unit: { type: 'string' }, scope: { type: 'string' } } } }, boundary: { type: 'string' } },
  },
} as const;
