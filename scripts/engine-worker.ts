/** Run beside the database owner. Never point SQLite at a network-mounted file. */
import { workerStep } from '../src/lib/engine/pipeline';
import { outboxStep } from '../src/lib/engine/outbox';
import { engineEnabled } from '../src/lib/engine/store';
import { experimentalChannelsAvailable } from '../src/lib/scanChannels';
import { db } from '../src/lib/db';

async function main() {
  if (!engineEnabled() || !process.env.DATABASE_URL) throw new Error('Explicit ENGINE_V6 and DATABASE_URL are required');
  if (process.env.POLICYWATCHER_ENGINE_CHANNELS === '1' && !experimentalChannelsAvailable()) {
    console.error('[Engine] Channel worker requires the repository root, isolated SQLite database, development environment, and publication/notifications disabled. No task was claimed.');
    throw new Error('channel_worker_context_invalid');
  }
  let stopping = false;
  process.on('SIGTERM', () => { stopping = true; });
  process.on('SIGINT', () => { stopping = true; });
  const once = process.argv.includes('--once');
  do {
    const worked = await workerStep();
    const delivered = await outboxStep();
    if (!worked && !delivered && !once) await new Promise(resolve => setTimeout(resolve, 2000));
  } while (!once && !stopping);
}
void main().catch(() => { console.error('[Engine] Worker stopped; inspect durable task status.'); process.exitCode = 1; })
  .finally(() => db.$disconnect());
