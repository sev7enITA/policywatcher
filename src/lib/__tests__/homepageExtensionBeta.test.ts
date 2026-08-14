import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const page = readFileSync('src/app/DashboardClient.tsx', 'utf8');
const release = readFileSync('src/lib/release.ts', 'utf8');

describe('homepage browser extension Beta launch strip', () => {
  it('uses centralized extension Beta release metadata', () => {
    expect(release).toContain("export type PolicyWatcherReleaseChannel = 'stable' | 'beta'");
    expect(release).toContain("POLICYWATCHER_RELEASE_CHANNEL_LABEL = 'BETA'");
    expect(release).toContain("POLICYWATCHER_BROWSER_EXTENSION_VERSION = '3.8.3-beta.3'");
    expect(release).toContain('POLICYWATCHER_BROWSER_EXTENSION_RELEASE_BADGE');
    expect(release).toContain('POLICYWATCHER_BROWSER_EXTENSION_RELEASE_STATUS');
    expect(page).toContain('POLICYWATCHER_BROWSER_EXTENSION_RELEASE_BADGE');
  });

  it('publishes bilingual, scoped extension-first copy', () => {
    expect(page).toContain('Estensione browser: dalla mail ai link reali');
    expect(page).toContain('Browser extension: from the email to real links');
    expect(page).toContain('legge localmente il testo visibile e i link presenti nella pagina');
    expect(page).toContain('reads visible text and page links locally');
    expect(page).toContain('Non è consulenza legale');
    expect(page).toContain('Not legal advice');
  });

  it('links to the extension surface and keeps a mobile paste fallback', () => {
    expect(page).toContain('href="/browser-extension"');
    expect(page).toContain('href="/what-changed#paste-notice"');
  });

  it('shows the centralized verified per-browser distribution summary', () => {
    expect(page).toContain('{POLICYWATCHER_BROWSER_EXTENSION_RELEASE_STATUS[lang]}');
    expect(page).not.toContain('Chrome · Edge · Safari: {POLICYWATCHER_BROWSER_EXTENSION_RELEASE_STATUS[lang]}');
    expect(page).not.toContain('Stabile in ${POLICYWATCHER_VERSION}');
    expect(page).not.toContain('Stable in ${POLICYWATCHER_VERSION}');
  });

  it('keeps the launch strip between Workspace Active and Observatory', () => {
    const workspace = page.indexOf('className={styles.workspacePanel}');
    const extension = page.indexOf('className={styles.extensionBetaStrip}');
    const observatory = page.indexOf('className={styles.observatoryTicker}');
    expect(workspace).toBeGreaterThan(-1);
    expect(extension).toBeGreaterThan(workspace);
    expect(observatory).toBeGreaterThan(extension);
  });

  it('removes the duplicated What changed release-map cards', () => {
    expect(page).not.toContain("title: 'Cosa è cambiato?'");
    expect(page).not.toContain("title: 'What changed?'");
  });
});
