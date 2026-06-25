console.log('Starting Next.js production server via Hostinger bridge...');
console.log('Port assigned by environment:', process.env.PORT || '3000');

try {
  const cli = require('next/dist/cli/next-start');
  cli.nextStart(['-p', process.env.PORT || 3000]);
} catch (error) {
  console.error('Failed to start Next.js server:', error);
  process.exit(1);
}
