import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, '..');
const templateDirectory = path.join(
  repositoryRoot,
  'integrations',
  'power-platform',
  'policywatcher-v2'
);

function usage() {
  return [
    'Generate the PolicyWatcher v2 Power Platform connector package.',
    '',
    'Required:',
    '  --tenant-id <uuid>             Microsoft Entra tenant ID',
    '  --api-client-id <uuid>          Enterprise API application client ID',
    '  --connector-client-id <uuid>    Connector client application ID',
    '  --api-url <https-url>           Public gateway/origin URL, with or without /api/v2',
    '',
    'Optional:',
    '  --application-id-uri <uri>      Defaults to api://<api-client-id>',
    '  --environment-id <id>           Adds settings.json for paconn',
    '  --connector-id <id>             Existing connector ID for updates',
    '  --output-dir <path>             Defaults to artifacts/connectors/policywatcher-v2',
  ].join('\n');
}

function parseArguments(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--help' || argument === '-h') return { help: true };
    if (!argument.startsWith('--')) throw new Error(`Unexpected argument: ${argument}`);
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${argument}.`);
    values[argument.slice(2)] = value;
    index += 1;
  }
  return values;
}

function requiredUuid(values, name) {
  const value = values[name];
  if (!value || !UUID_RE.test(value)) throw new Error(`--${name} must be a UUID.`);
  return value.toLowerCase();
}

function normalizedApplicationIdUri(rawValue, apiClientId) {
  const value = rawValue || `api://${apiClientId}`;
  if (!/^api:\/\/[A-Za-z0-9._~:/-]+$/.test(value) && !/^https:\/\/[A-Za-z0-9._~:/-]+$/.test(value)) {
    throw new Error('--application-id-uri must use the api:// or https:// scheme.');
  }
  return value.replace(/\/$/, '');
}

function gatewayParts(rawValue) {
  if (!rawValue) throw new Error('--api-url is required.');
  let url;
  try {
    url = new URL(rawValue);
  } catch {
    throw new Error('--api-url must be a valid absolute URL.');
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
    throw new Error('--api-url must be a credential-free HTTPS URL without query or fragment.');
  }

  const suppliedPath = url.pathname.replace(/\/+$/, '');
  const basePath = suppliedPath.endsWith('/api/v2')
    ? suppliedPath
    : `${suppliedPath}/api/v2`;
  return {
    host: url.host,
    basePath: basePath.replace(/^$/, '/api/v2').replace(/\/{2,}/g, '/'),
  };
}

function renderTemplate(template, replacements) {
  let rendered = template;
  for (const [placeholder, value] of Object.entries(replacements)) {
    rendered = rendered.replaceAll(placeholder, value);
  }
  const unresolved = rendered.match(/__[A-Z0-9_]+__/g);
  if (unresolved) throw new Error(`Unresolved template values: ${[...new Set(unresolved)].join(', ')}`);
  return JSON.parse(rendered);
}

async function main() {
  const values = parseArguments(process.argv.slice(2));
  if (values.help) {
    console.log(usage());
    return;
  }

  const tenantId = requiredUuid(values, 'tenant-id');
  const apiClientId = requiredUuid(values, 'api-client-id');
  const connectorClientId = requiredUuid(values, 'connector-client-id');
  const applicationIdUri = normalizedApplicationIdUri(values['application-id-uri'], apiClientId);
  const readScopeUri = `${applicationIdUri}/policywatcher.read`;
  const gateway = gatewayParts(values['api-url']);
  const outputDirectory = path.resolve(
    repositoryRoot,
    values['output-dir'] || 'artifacts/connectors/policywatcher-v2'
  );

  const [definitionTemplate, propertiesTemplate] = await Promise.all([
    readFile(path.join(templateDirectory, 'apiDefinition.swagger.template.json'), 'utf8'),
    readFile(path.join(templateDirectory, 'apiProperties.template.json'), 'utf8'),
  ]);
  const replacements = {
    __API_HOST__: gateway.host,
    __API_BASE_PATH__: gateway.basePath,
    __TENANT_ID__: tenantId,
    __APPLICATION_ID_URI__: applicationIdUri,
    __READ_SCOPE_URI__: readScopeUri,
    __CONNECTOR_APP_CLIENT_ID__: connectorClientId,
  };

  const definition = renderTemplate(definitionTemplate, replacements);
  const properties = renderTemplate(propertiesTemplate, replacements);
  await mkdir(outputDirectory, { recursive: true });
  await Promise.all([
    writeFile(
      path.join(outputDirectory, 'apiDefinition.swagger.json'),
      `${JSON.stringify(definition, null, 2)}\n`,
      { mode: 0o600 }
    ),
    writeFile(
      path.join(outputDirectory, 'apiProperties.json'),
      `${JSON.stringify(properties, null, 2)}\n`,
      { mode: 0o600 }
    ),
  ]);

  if (values['environment-id']) {
    const settings = {
      connectorId: values['connector-id'] || '',
      environment: values['environment-id'],
      apiProperties: 'apiProperties.json',
      apiDefinition: 'apiDefinition.swagger.json',
      icon: path.join(repositoryRoot, 'public', 'logo-mark.png'),
      powerAppsUrl: 'https://api.powerapps.com',
      powerAppsApiVersion: '2016-11-01',
    };
    await writeFile(
      path.join(outputDirectory, 'settings.json'),
      `${JSON.stringify(settings, null, 2)}\n`,
      { mode: 0o600 }
    );
  }

  console.log(`Connector package generated at ${outputDirectory}`);
  console.log('No OAuth client secret was written. Supply it only to the import command or portal.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  console.error('');
  console.error(usage());
  process.exitCode = 1;
});
