import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const navigation = readFileSync('src/components/Navigation.tsx', 'utf8');
const dashboard = readFileSync('src/app/DashboardClient.tsx', 'utf8');
const dashboardStyles = readFileSync('src/app/Dashboard.module.css', 'utf8');
const termsGate = readFileSync('src/components/TermsGate.tsx', 'utf8');

describe('calm toolbar wiring', () => {
  it('makes the release identity a keyboard-accessible changelog button', () => {
    expect(navigation).toMatch(/<button[\s\S]*className=\{styles\.ribbonIdentity\}[\s\S]*onClick=\{onOpenChangelog\}/);
  });

  it('places an icon-only What Changed shortcut immediately before Search', () => {
    const notification = navigation.indexOf("renderCommand(whatChangedCommand, 'icon')");
    const search = navigation.indexOf('className={`${styles.commandButton} ${styles.searchButton}`}');
    expect(notification).toBeGreaterThan(0);
    expect(notification).toBeLessThan(search);
    expect(navigation).toContain('icon: MailSearch');
    expect(navigation).not.toContain("id: 'what-changed', label: t.whatChanged, tooltip: t.tooltips.whatChanged, icon: ShieldQuestion");
  });

  it('keeps workspace quick actions concise while preserving full command groups in More', () => {
    expect(navigation).toContain('getWorkspaceQuickActionIds(workspaceIntent)');
    expect(navigation).toContain('{groups.map((group) => (');
    expect(navigation).toContain("renderCommand(workspaceCommand, 'sheet')");
  });

  it('uses the required five-action mobile composition', () => {
    const mobile = navigation.slice(
      navigation.indexOf('<nav className={styles.mobileCommandBar}'),
      navigation.indexOf('{moreOpen && ('),
    );
    expect(mobile).toContain('whatChangedCommand');
    expect(mobile).toContain('workspaceCommand');
    expect(mobile).toContain('assistantCommand');
    expect(mobile).toContain('searchCommand');
    expect(mobile).toContain('mobileMoreButton');
  });
});

describe('first-visit Workspace Active wiring', () => {
  it('waits for terms acceptance before locking body scroll for the first-use composer', () => {
    expect(termsGate).toContain('onAcceptanceChange?: (accepted: boolean) => void;');
    expect(termsGate).toContain('onAcceptanceChange?.(true);');
    expect(termsGate).toContain('onAcceptanceChange?.(false);');
    expect(dashboard).toContain('onAcceptanceChange={setTermsAccessGranted}');
    expect(dashboard).toContain('if (!termsAccessGranted || !workspaceConfiguratorOpen || !workspaceFirstUseMode) return;');
    expect(dashboard).toContain('[closeWorkspaceComposer, termsAccessGranted, workspaceConfiguratorOpen, workspaceFirstUseMode]');
  });

  it('creates a three-lane operational home and collapses the long source ledger', () => {
    expect(dashboard).toContain('buildDashboardTodayItems');
    expect(dashboard).toContain('workflowTodayItems.map');
    expect(dashboard).toContain('workflowText.today');
    expect(dashboard).toContain('workflowText.continue');
    expect(dashboard).toContain('workflowText.explore');
    expect(dashboard).toContain('className={styles.sourceSuspensionDetails}');
    expect(dashboardStyles).toContain('.workflowGrid');
  });

  it('persists a distinct completion marker only after an explicit choice', () => {
    expect(dashboard).toContain('WORKSPACE_ONBOARDING_COMPLETED_KEY');
    expect(dashboard).toContain("JSON.stringify({ completed: true })");
    expect(dashboard).toContain('hasCompletedWorkspaceOnboarding(');
    expect(dashboard).toContain('parseWorkspaceProfile(');
    expect(dashboard).toContain('if (onboardingCompleted && saved)');
  });

  it('keeps URL presets authoritative without marking onboarding complete', () => {
    expect(dashboard).toContain('decodeWorkspaceQuery(window.location.search)');
    expect(dashboard).toContain('if (queryProfile.hasWorkspaceParams)');
    expect(dashboard).toContain('shouldOpenFirstUse = false');
    expect(dashboard).toContain('nextIntent = queryProfile.intent ?? nextIntent');
    expect(dashboard).not.toMatch(/if \(queryProfile\.hasWorkspaceParams\)[\s\S]{0,500}localStorage\.setItem\(WORKSPACE_ONBOARDING_COMPLETED_KEY/);
  });

  it('reveals one decision at a time and previews quick access before applying', () => {
    expect(dashboard).toContain('workspaceOnboardingStep === 0');
    expect(dashboard).toContain('workspaceOnboardingStep === 1');
    expect(dashboard).toContain('workspaceOnboardingStep === 2');
    expect(dashboard).toContain('{workspaceText.quickAccess}');
    expect(dashboard).toContain('draftQuickActions.map');
    expect(dashboard).toContain('{workspaceText.localPreferences}');
  });

  it('keeps the mobile entrance opaque and honors reduced-motion preferences', () => {
    expect(dashboard).toContain('initial={false}');
    expect(dashboard).toContain('useReducedMotion()');
    expect(dashboardStyles).toContain('@media (prefers-reduced-motion: reduce)');
    expect(dashboardStyles).toMatch(/\.workspaceConfiguratorDialog,[\s\S]*\.workspaceComposerOverlay[\s\S]*animation: none !important/);
  });

  it('defers the long evidence invariant on the first two narrow-screen steps', () => {
    expect(dashboard).toContain('className={styles.workspaceEvidenceInvariant}');
    expect(dashboardStyles).toContain('.workspacePrivacyNote[data-step="0"] .workspaceEvidenceInvariant');
    expect(dashboardStyles).toContain('.workspacePrivacyNote[data-step="1"] .workspaceEvidenceInvariant');
  });

  it('keeps the final mobile invariant above the safe-area action row', () => {
    expect(dashboard).toContain('data-onboarding-step={workspaceFirstUseMode ? workspaceOnboardingStep : undefined}');
    expect(dashboard).toContain('className={styles.workspacePreviewInvariant}');
    expect(dashboardStyles).toContain('.workspaceConfiguratorDialog[data-onboarding-step="2"]');
    expect(dashboardStyles).toContain('padding-bottom: calc(116px + env(safe-area-inset-bottom))');
    expect(dashboardStyles).toContain('.workspacePrivacyNote[data-step="2"]');
  });
});
