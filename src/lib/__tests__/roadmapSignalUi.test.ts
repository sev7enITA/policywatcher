import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function read(path: string) {
  return readFileSync(path, 'utf8');
}

describe('roadmap community signal UI contract', () => {
  it('filters candidates and opens the local composer instead of a direct issue link', () => {
    const roadmap = read('src/app/roadmap/RoadmapClient.tsx');
    expect(roadmap).toContain('Search candidates');
    expect(roadmap).toContain('Implementation state');
    expect(roadmap).toContain('Clear filters');
    expect(roadmap).toContain('No candidate data is available');
    expect(roadmap).toContain('No candidates match these filters');
    expect(roadmap).toContain('openCandidateSignal(feature.title, feature.track)');
    expect(roadmap).not.toContain('/issues/new?title=');
  });

  it('keeps draft handling local and GitHub handoff explicit', () => {
    const composer = read('src/app/roadmap/RoadmapSignalComposer.tsx');
    expect(composer).toContain('role="dialog"');
    expect(composer).toContain('aria-modal="true"');
    expect(composer).toContain("event.key === 'Escape'");
    expect(composer).toContain("event.key !== 'Tab'");
    expect(composer).toContain('ROADMAP_SIGNAL_STORAGE_KEY');
    expect(composer).toContain('Reset and delete local draft');
    expect(composer).toContain('Open reviewed proposal on GitHub');
    expect(composer).toContain('Copy proposal');
    expect(composer).toContain('PolicyWatcher does not receive these contents');
    expect(composer).toContain('GitHub availability, authentication and repository permissions are external');
  });

  it('retains the four-stage dossier and mobile-safe actions', () => {
    const composer = read('src/app/roadmap/RoadmapSignalComposer.tsx');
    const css = read('src/app/roadmap/roadmap.module.css');
    expect(composer).toContain("const stepNames = ['Need', 'Evidence', 'Limits', 'Review']");
    expect(composer).toContain('className={styles.dossierRail}');
    expect(css).toContain('env(safe-area-inset-bottom)');
    expect(css).toMatch(/\.composerNext[\s\S]*?min-height: 44px/);
  });
});
