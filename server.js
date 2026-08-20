const INTERNAL_STUDY_CONFIGURATION_ERROR = 'Confidential study configuration is unavailable.';

async function start() {
  // Hostinger supplies environment variables directly. Local production
  // previews rely on the ignored .env file, which Next's CLI would otherwise
  // load only after this bridge has completed its own startup checks.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { loadEnvConfig } = require('@next/env');
  loadEnvConfig(__dirname, false);

  // Validate the separately mounted confidential payload before any server or
  // database work begins. The validator deliberately emits one safe message
  // and never includes a configured path, JSON contents, or environment value.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { validateInternalStudyConfiguration } = require('./scripts/validate-internal-study-config.cjs');
  validateInternalStudyConfiguration(process.env);

  console.log('Starting Next.js production server via Hostinger bridge...');
  const configuredPort = process.env.PORT || '3000';
  const port = Number(configuredPort);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT value: ${configuredPort}`);
  }
  console.log('Port assigned by environment:', port);

  // Hostinger may launch server.js directly and therefore bypass npm's
  // prestart hook. Ensure the idempotent runtime schema before accepting
  // requests so a newly deployed workflow never depends on a manual SSH step.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { spawnSync } = require('node:child_process');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('node:fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('node:path');
  const deploymentTarget = (process.env.POLICYWATCHER_DEPLOYMENT_TARGET || '').trim().toLowerCase();
  const environmentGateCandidates = [
    path.join(__dirname, 'scripts', 'hostinger-environment-gate.mjs'),
    path.resolve(__dirname, '..', '.builds', 'last-source', 'scripts', 'hostinger-environment-gate.mjs'),
  ];
  const environmentGate = environmentGateCandidates.find((candidate) => fs.existsSync(candidate));
  if (!environmentGate) {
    throw new Error(`Hostinger environment gate not found. Checked: ${environmentGateCandidates.join(', ')}`);
  }
  const environmentCheck = spawnSync(
    process.execPath,
    [environmentGate, '--target', deploymentTarget, '--phase', 'runtime'],
    {
      cwd: path.resolve(path.dirname(environmentGate), '..'),
      env: process.env,
      stdio: 'inherit',
    }
  );
  if (environmentCheck.status !== 0) {
    throw new Error(`Hostinger environment gate failed with status ${environmentCheck.status ?? 'unknown'}.`);
  }

  const databasePreparationCandidates = [
    path.join(__dirname, 'scripts', 'prepare-database.sh'),
    // Hostinger's managed Next.js preset places build files in /nodejs while
    // retaining the uploaded source in the sibling .builds/last-source tree.
    path.resolve(__dirname, '..', '.builds', 'last-source', 'scripts', 'prepare-database.sh'),
  ];
  const databasePreparation = databasePreparationCandidates.find((candidate) => fs.existsSync(candidate));
  if (!databasePreparation) {
    throw new Error(`Database preparation script not found. Checked: ${databasePreparationCandidates.join(', ')}`);
  }
  const schemaCheck = spawnSync(
    'bash',
    [databasePreparation],
    {
      cwd: path.resolve(path.dirname(databasePreparation), '..'),
      env: { ...process.env, POLICYWATCHER_SKIP_DB_BACKUP: '1' },
      stdio: 'inherit',
    }
  );
  if (schemaCheck.status !== 0) {
    throw new Error(`Database schema initialization failed with status ${schemaCheck.status ?? 'unknown'}.`);
  }

  const evidenceActivationGateCandidates = [
    path.join(__dirname, 'scripts', 'gate-document-evidence-activation.ts'),
    path.resolve(__dirname, '..', '.builds', 'last-source', 'scripts', 'gate-document-evidence-activation.ts'),
  ];
  const evidenceActivationGate = evidenceActivationGateCandidates.find((candidate) => fs.existsSync(candidate));
  if (!evidenceActivationGate) {
    throw new Error(`Canonical evidence activation gate not found. Checked: ${evidenceActivationGateCandidates.join(', ')}`);
  }
  const tsxCandidates = [
    path.join(__dirname, 'node_modules', '.bin', 'tsx'),
    path.resolve(path.dirname(evidenceActivationGate), '..', 'node_modules', '.bin', 'tsx'),
  ];
  const tsxExecutable = tsxCandidates.find((candidate) => fs.existsSync(candidate));
  if (!tsxExecutable) {
    throw new Error(`Canonical evidence activation runtime is unavailable. Checked: ${tsxCandidates.join(', ')}`);
  }
  const evidenceActivationCheck = spawnSync(
    tsxExecutable,
    [evidenceActivationGate],
    {
      cwd: path.resolve(path.dirname(evidenceActivationGate), '..'),
      env: process.env,
      stdio: 'inherit',
    }
  );
  if (evidenceActivationCheck.status !== 0) {
    throw new Error(`Canonical evidence activation gate failed with status ${evidenceActivationCheck.status ?? 'unknown'}.`);
  }

  // Hostinger runs this bridge as CommonJS; keep require() for runtime compatibility.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const cli = require('next/dist/cli/next-start');
  // Next.js 16 expects an options object. Passing the legacy argv array makes
  // it ignore PORT and bind to a random port, which the Hostinger proxy cannot
  // reach.
  await cli.nextStart({ port });
}

start().catch((error) => {
  if (error instanceof Error && error.message === INTERNAL_STUDY_CONFIGURATION_ERROR) {
    console.error(`Failed to start Next.js server: ${INTERNAL_STUDY_CONFIGURATION_ERROR}`);
    process.exit(1);
  }
  console.error('Failed to start Next.js server:', error);
  process.exit(1);
});
