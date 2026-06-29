console.log('Starting Next.js production server via Hostinger bridge...');
console.log('Port assigned by environment:', process.env.PORT || '3000');

try {
  // Hostinger runs this bridge as CommonJS; keep require() for runtime compatibility.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const cli = require('next/dist/cli/next-start');
  cli.nextStart(['-p', process.env.PORT || 3000]);
} catch (error) {
  console.error('Failed to start Next.js server:', error);
  process.exit(1);
}
