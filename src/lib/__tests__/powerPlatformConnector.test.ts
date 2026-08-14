import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { getEnterpriseOpenApiDocument } from '../enterpriseOpenApi';

const connectorDirectory = path.join(
  process.cwd(),
  'integrations',
  'power-platform',
  'policywatcher-v2'
);

function readJson(name: string) {
  return JSON.parse(readFileSync(path.join(connectorDirectory, name), 'utf8')) as Record<string, unknown>;
}

describe('Power Platform v2 connector package', () => {
  it('maps every connector action to an Enterprise API v2 operation', () => {
    const connector = readJson('apiDefinition.swagger.template.json') as {
      swagger: string;
      basePath: string;
      paths: Record<string, Record<string, { operationId: string }>>;
      definitions: Record<string, unknown>;
    };
    const enterprise = getEnterpriseOpenApiDocument({ APP_URL: 'https://policywatcher.example' });
    const enterprisePaths = new Set(Object.keys(enterprise.paths));
    const connectorOperations = Object.entries(connector.paths).flatMap(([connectorPath, methods]) =>
      Object.values(methods).map((operation) => ({
        path: `/api/v2${connectorPath}`,
        operationId: operation.operationId,
      }))
    );

    expect(connector.swagger).toBe('2.0');
    expect(connector.basePath).toBe('__API_BASE_PATH__');
    expect(connectorOperations).toHaveLength(6);
    expect(connectorOperations.every((operation) => enterprisePaths.has(operation.path))).toBe(true);
    expect(new Set(connectorOperations.map((operation) => operation.operationId)).size).toBe(6);
  });

  it('uses delegated Entra OAuth placeholders without storing a client secret', () => {
    const propertiesText = readFileSync(
      path.join(connectorDirectory, 'apiProperties.template.json'),
      'utf8'
    );
    const properties = JSON.parse(propertiesText) as {
      properties: {
        connectionParameters: {
          token: {
            oAuthSettings: {
              identityProvider: string;
              clientId: string;
              scopes: string[];
              redirectUrl: string;
            };
          };
        };
      };
    };
    const oauth = properties.properties.connectionParameters.token.oAuthSettings;

    expect(oauth).toMatchObject({
      identityProvider: 'aad',
      clientId: '__CONNECTOR_APP_CLIENT_ID__',
      scopes: ['__READ_SCOPE_URI__'],
      redirectUrl: 'https://global.consent.azure-apim.net/redirect',
    });
    expect(propertiesText).not.toMatch(/clientSecret|client_secret|__.*SECRET.*__/i);
  });

  it('does not declare forbidden raw evidence fields in connector outputs', () => {
    const definitionText = readFileSync(
      path.join(connectorDirectory, 'apiDefinition.swagger.template.json'),
      'utf8'
    );

    expect(definitionText).not.toMatch(/"(?:currentText|currentHash|textHash|finalUrl|adminNote|diff)"\s*:/);
  });
});
