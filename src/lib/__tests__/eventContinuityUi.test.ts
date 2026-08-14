import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const page = readFileSync('src/app/developers/event-continuity/page.tsx', 'utf8');
const client = readFileSync(
  'src/app/developers/event-continuity/EventContinuityClient.tsx',
  'utf8',
);
const styles = readFileSync(
  'src/app/developers/event-continuity/event-continuity.module.css',
  'utf8',
);
const developers = readFileSync('src/app/developers/page.tsx', 'utf8');

describe('event feed continuity public workbench', () => {
  it('states the polling, storage and evidence boundaries without absolute claims', () => {
    expect(page).toContain('Browser-local checkpoint');
    expect(page).toContain('Polling only');
    expect(page).toContain('Evidence-gated');
    expect(page).toContain('not proof of exhaustive monitoring');
    expect(page).toContain('No endpoint registration, webhook subscription');
    expect(page).not.toMatch(/guaranteed|complete coverage|real-time|zero gaps/i);
  });

  it('fetches only after explicit inspect or resume actions and never auto-retries', () => {
    expect(client).toContain("const requestFeed = async (mode: RequestMode)");
    expect(client).toContain("onClick={() => void requestFeed('initial')}");
    expect(client).toContain("onClick={() => void requestFeed('resume')}");
    expect(client).toContain("credentials: 'omit'");
    expect(client).toContain('No automatic retry was attempted');
    const effect = client.slice(client.indexOf('useEffect(() =>'), client.indexOf('const requestFeed'));
    expect(effect).not.toMatch(/\bfetch\s*\(/);
  });

  it('uses strict browser-local checkpoint helpers for save, import and export', () => {
    expect(client).toContain('EVENT_CONTINUITY_STORAGE_KEY');
    expect(client).toContain('parseEventContinuityCheckpoint(await file.text())');
    expect(client).toContain('serializeEventContinuityCheckpoint(checkpoint)');
    expect(client).toContain('createEventContinuityCheckpoint(payload, previousCheckpoint)');
    expect(client).toContain('window.localStorage.setItem');
    expect(client).toContain('new Blob');
    expect(client).toContain('navigator.clipboard.writeText(checkpoint.cursor)');
  });

  it('renders explicit report metrics, findings and a bounded event ledger', () => {
    expect(client).toContain('report.metrics.received');
    expect(client).toContain('report.metrics.unique');
    expect(client).toContain('report.metrics.duplicates');
    expect(client).toContain('report.metrics.orderedChronologically');
    expect(client).toContain('report.metrics.initialWindowTruncated');
    expect(client).toContain('report.metrics.resumedFromCheckpoint');
    expect(client).toContain('events.slice(0, 12)');
    expect(client).toContain('event.links.evidence');
  });

  it('provides accessible request state, controls and mobile containment', () => {
    expect(client).toContain('role="status"');
    expect(client).toContain('aria-live="polite"');
    expect(client).toContain('disabled={requestState === \'loading\'}');
    expect(client).toContain('aria-label="Public event ledger"');
    expect(styles).toMatch(/min-height:\s*44px/);
    expect(styles).toMatch(/@media\s*\(max-width:\s*780px\)/);
    expect(styles).toMatch(/@media\s*\(max-width:\s*520px\)/);
    expect(styles).toMatch(/\.checkpointRail\s*\{[\s\S]*?grid-template-columns/);
    expect(styles).toMatch(/\.ledgerTable tbody td\s*\{[\s\S]*?display:\s*grid/);
  });

  it('adds a clear route from the developer directory without presenting the lab as another API', () => {
    expect(developers).toContain('href="/developers/event-continuity"');
    expect(developers).toContain('Six machine endpoints and one continuity workbench.');
    expect(developers).toContain('The six API endpoints accept `GET`');
  });
});
