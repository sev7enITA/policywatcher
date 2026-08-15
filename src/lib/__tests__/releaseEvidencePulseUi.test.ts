import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { RELEASE_EVIDENCE_LEDGER, getReleaseEvidencePulse } from '@/lib/releasePulse';
import { PULSE_DESK_AS_OF, pulseStories } from '@/lib/editorialPulse';

const read = (path: string) => readFileSync(path, 'utf8');

describe('release evidence pulse UI', () => {
  it('reuses the canonical ledger for the homepage and full Pulse visual', () => {
    const component = read('src/components/ReleaseEvidencePulse.tsx');
    const visual = read('src/components/pulse/PulseEvidenceVisual.tsx');
    expect(component).toContain('getReleaseEvidencePulse()');
    expect(component).toContain('RELEASE_EVIDENCE_LEDGER.claimBoundary');
    expect(component).toContain("variant = 'full'");
    expect(visual).toContain("story.visualKind === 'release-impact'");
    expect(visual).toContain("variant={compact ? 'compact' : 'full'}");
  });

  it('mounts the compact pulse between the workflow hub and extension promotion', () => {
    const dashboard = read('src/app/DashboardClient.tsx');
    const workflow = dashboard.indexOf('className={styles.workflowHub}');
    const pulse = dashboard.indexOf('<ReleaseEvidencePulse locale={lang} variant="compact" />');
    const extension = dashboard.indexOf('className={styles.extensionBetaStrip}');
    expect(workflow).toBeGreaterThan(-1);
    expect(pulse).toBeGreaterThan(workflow);
    expect(extension).toBeGreaterThan(pulse);
  });

  it('keeps the homepage variant a bounded teaser with one explicit full-story route', () => {
    const component = read('src/components/ReleaseEvidencePulse.tsx');
    const css = read('src/components/ReleaseEvidencePulse.module.css');
    expect(component).toContain("variant === 'compact' ? (");
    expect(component).toContain('<details className={`${styles.receipt} ${styles.compactReceipt}`}>');
    expect(component).toContain('<summary className={styles.compactSummary}>');
    expect(component).toContain('className={styles.compactReceiptBody}');
    expect(component).toContain('href="/pulse/two-week-release-impact"');
    expect(component).toContain('Inspect the full 14-day record');
    expect(css).toContain('.pulseCompact .releaseRail button');
    expect(css).toContain('min-height: 52px');
    expect(css).toContain('.pulseCompact .ledgerBoundary code');
  });

  it('publishes one bilingual, bounded and source-linked release-impact story', () => {
    const story = pulseStories.find((candidate) => candidate.slug === 'two-week-release-impact');
    const releases = getReleaseEvidencePulse();
    expect(story?.visualKind).toBe('release-impact');
    expect(story?.asOf).toBe(RELEASE_EVIDENCE_LEDGER.window.end);
    expect(story?.headline.it).toBe('Cosa è cambiato. Cosa ha sbloccato. Cosa resta da provare.');
    expect(story?.boundary.it).toContain('conformità legale');
    expect(story?.boundary.it).toContain('disponibilità continua');
    expect(PULSE_DESK_AS_OF).toBe(RELEASE_EVIDENCE_LEDGER.window.end);
    expect(story?.facts.map((fact) => fact.value)).toEqual([
      String(releases.length),
      String(RELEASE_EVIDENCE_LEDGER.window.inclusiveDays),
      String(releases.reduce((total, release) => total + release.evidence.length, 0)),
    ]);
    expect(story?.sourceLinks.map((source) => source.href)).toEqual([
      '/api/v1/release-evidence',
      '/press-kit/releases/evidence-release-control-plane-3-9-0-beta-42',
      '/infographics',
      '/press-kit/releases',
    ]);
    expect(story?.boundary.en).toBe(RELEASE_EVIDENCE_LEDGER.claimBoundary);
  });

  it('keeps native selection, focus, reduced-motion and progressive transition contracts explicit', () => {
    const component = read('src/components/ReleaseEvidencePulse.tsx');
    const css = read('src/components/ReleaseEvidencePulse.module.css');
    expect(component).toContain('aria-pressed={selectedRelease.version === release.version}');
    expect(component).toContain('aria-live="polite"');
    expect(component).toContain("window.matchMedia('(prefers-reduced-motion: reduce)')");
    expect(component).toContain('transitionDocument.startViewTransition');
    expect(component).toContain("version: 'Versione'");
    expect(component).toContain("date: 'Data'");
    expect(component).toContain("wave: 'Ondata'");
    expect(component).toContain("headline: 'Cosa è cambiato. Cosa ha sbloccato. Cosa resta da provare.'");
    expect(css).toContain('min-height: 44px');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(css).toContain('@media (max-width: 340px)');
  });
});
