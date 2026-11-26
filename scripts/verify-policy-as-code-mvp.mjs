#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'output', 'policy-as-code-mvp-20261122');
fs.mkdirSync(output, { recursive: true });
if (process.platform !== 'darwin') throw new Error('This offline wrapper requires macOS sandbox-exec. The test files themselves are portable.');
const profile = path.join(output, 'deny-network.sb');
fs.writeFileSync(profile, '(version 1)\n(allow default)\n(deny network*)\n');
const cases = [
  ['network-denial', process.execPath, ['-e', `const net=require('node:net');const s=net.createServer();s.on('error',e=>{if(['EPERM','EACCES'].includes(e.code)){console.log('TCP denied by OS');process.exit(0)}process.exit(2)});s.listen(0,'127.0.0.1',()=>{s.close();process.exit(1)});`]],
  ['contract-and-adversarial', process.execPath, ['--test', 'integrations/policy-as-code/contract.test.mjs', 'integrations/policy-as-code/adversarial.test.mjs']],
  ['export-api-roundtrip', process.execPath, ['node_modules/vitest/vitest.mjs', 'run',
    'src/lib/__tests__/policyAsCode.test.ts', 'src/lib/__tests__/policyAsCodeApi.test.ts',
    'src/lib/__tests__/policyAsCodeAdversarial.test.ts', 'src/lib/__tests__/policyAsCodeRoundtrip.test.ts',
    'src/lib/__tests__/evidencePacket.test.ts', 'src/lib/__tests__/evidencePacketApi.test.ts',
    'src/lib/__tests__/publicChangeEvents.test.ts', 'src/lib/__tests__/agentGateway.test.ts', '--reporter=verbose']],
];
const checks = [];
for (const [name, command, args] of cases) {
  const started = Date.now();
  const result = spawnSync('/usr/bin/sandbox-exec', ['-f', profile, command, ...args], { cwd: root, encoding: 'utf8', timeout: 120_000 });
  fs.writeFileSync(path.join(output, `${name}.log`), `${result.stdout ?? ''}${result.stderr ?? ''}`);
  checks.push({ name, exitCode: result.status, passed: result.status === 0 && !result.error, elapsedMs: Date.now() - started });
  console.log(`${name}: ${checks.at(-1).passed ? 'PASS' : 'FAIL'}`);
  if (!checks.at(-1).passed) break;
}
const receipt = { schemaVersion: '1.0.0', checkedAt: new Date().toISOString(), network: 'OS denied, including child processes',
  checks, passed: checks.length === cases.length && checks.every(check => check.passed),
  qualificationBoundary: 'Synthetic/mocked data; no live enterprise import, source completeness or 500-policy qualification.',
  deploymentPerformed: false, executionAuthorized: false };
fs.writeFileSync(path.join(output, 'offline-receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
if (!receipt.passed) process.exitCode = 1;
