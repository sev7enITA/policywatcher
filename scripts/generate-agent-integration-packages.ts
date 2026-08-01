import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { getAgentGatewayOpenApi } from '../src/lib/agentGateway';

const root = process.cwd();
const targets = [
  'integrations/google-agent-builder/policywatcher-evidence-tool/openapi.json',
  'integrations/amazon-quick/policywatcher-evidence-connector/openapi.json',
  'integrations/amazon-q-business/policywatcher-evidence-plugin/openapi.json',
];

async function main() {
  const body = `${JSON.stringify(getAgentGatewayOpenApi(), null, 2)}\n`;

  for (const relativePath of targets) {
    const absolutePath = path.join(root, relativePath);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, body, 'utf8');
    console.log(`Generated ${relativePath}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
