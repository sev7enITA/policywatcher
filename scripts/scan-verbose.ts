#!/usr/bin/env npx tsx
/**
 * CLI — Verbose Policy Scanner
 *
 * Usage:
 *   npx tsx scripts/scan-verbose.ts
 *
 * Runs a full policy scan with colored terminal output showing
 * real-time progress for each policy being processed.
 *
 * This calls runFullScan() directly (no HTTP, no auth needed).
 */

import { runFullScan } from '../src/app/api/cron/check-all/route';

// ANSI color helpers
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bgBlue: '\x1b[44m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgRed: '\x1b[41m',
  white: '\x1b[37m',
};

function timestamp(): string {
  return new Date().toISOString().substring(11, 19);
}

console.log(`\n${c.bgBlue}${c.white}${c.bold} 🔍 PolicyWatcher — Full Scan ${c.reset}\n`);
console.log(`${c.gray}Started at ${new Date().toISOString()}${c.reset}\n`);

const startTime = Date.now();

runFullScan((progress) => {
  const ts = `${c.gray}[${timestamp()}]${c.reset}`;

  switch (progress.phase) {
    case 'start':
      console.log(`${ts} ${c.cyan}${c.bold}▶ ${progress.message}${c.reset}`);
      console.log(`${c.gray}${'─'.repeat(70)}${c.reset}`);
      break;

    case 'policy_start':
      process.stdout.write(
        `${ts} ${c.dim}${String(progress.current).padStart(3)}/${progress.total}${c.reset}  ${c.blue}⟳${c.reset} ${progress.message}  `
      );
      break;

    case 'policy_done': {
      // Clear the "Scraping..." line and replace with result
      process.stdout.write('\r\x1b[K');
      const idx = `${c.dim}${String(progress.current).padStart(3)}/${progress.total}${c.reset}`;

      if (progress.status === 'unchanged') {
        console.log(`${ts} ${idx}  ${c.green}✓${c.reset} ${c.gray}${progress.company} — ${progress.policy}: unchanged${c.reset}`);
      } else if (progress.status === 'changed') {
        console.log(`${ts} ${idx}  ${c.yellow}${c.bold}⚠ ${progress.company} — ${progress.policy}: CHANGED${c.reset}`);
      } else if (progress.status === 'error') {
        console.log(`${ts} ${idx}  ${c.red}${c.bold}✗ ${progress.company} — ${progress.policy}: ERROR${c.reset}`);
        if (progress.message.includes('(')) {
          const errorDetail = progress.message.substring(progress.message.indexOf('('));
          console.log(`${ts}       ${c.red}${c.dim}  ${errorDetail}${c.reset}`);
        }
      } else if (progress.status === 'unavailable') {
        console.log(`${ts} ${idx}  ${c.magenta}⊘ ${progress.company} — ${progress.policy}: unavailable${c.reset}`);
      } else if (progress.status === 'invalid') {
        console.log(`${ts} ${idx}  ${c.red}⊘ ${progress.company} — ${progress.policy}: invalid URL${c.reset}`);
      } else {
        console.log(`${ts} ${idx}  ${c.gray}  ${progress.message}${c.reset}`);
      }
      break;
    }

    case 'notify':
      console.log(`${ts} ${c.cyan}📧 ${progress.message}${c.reset}`);
      break;

    case 'complete':
      console.log(`${ts} ${c.green}${c.bold}✅ ${progress.message}${c.reset}`);
      break;
  }
})
  .then((result) => {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n${c.gray}${'─'.repeat(70)}${c.reset}`);
    console.log(`${c.bgGreen}${c.white}${c.bold} SCAN COMPLETE ${c.reset}  ${c.dim}(${elapsed}s)${c.reset}\n`);

    console.log(`  ${c.bold}Checked${c.reset}      ${result.checked}`);
    console.log(`  ${c.yellow}${c.bold}Changed${c.reset}      ${result.changed}`);
    console.log(`  ${c.red}${c.bold}Errors${c.reset}       ${result.errors}`);
    console.log(`  ${c.magenta}Unavailable${c.reset}  ${result.unavailable}`);
    console.log(`  ${c.red}Invalid${c.reset}      ${result.invalid}`);
    console.log('');

    process.exit(result.errors > 0 ? 1 : 0);
  })
  .catch((err) => {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error(`\n${c.bgRed}${c.white}${c.bold} SCAN FAILED ${c.reset}  ${c.dim}(${elapsed}s)${c.reset}`);
    console.error(`${c.red}${err.message || err}${c.reset}\n`);
    process.exit(2);
  });
