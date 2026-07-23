async function start() {
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
  const schemaCheck = spawnSync(
    'bash',
    ['scripts/hostinger-init-db.sh'],
    {
      cwd: __dirname,
      env: { ...process.env, POLICYWATCHER_SKIP_DB_BACKUP: '1' },
      stdio: 'inherit',
    }
  );
  if (schemaCheck.status !== 0) {
    throw new Error(`Database schema initialization failed with status ${schemaCheck.status ?? 'unknown'}.`);
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
  console.error('Failed to start Next.js server:', error);
  process.exit(1);
});
