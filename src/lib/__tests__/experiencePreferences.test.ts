import { describe, expect, it } from 'vitest';
import { composeDashboard } from '../dashboardComposer';
import {
  getExperienceNextAction,
  getExperiencePresentation,
  parseExperiencePreferences,
} from '../experiencePreferences';

describe('experience preferences', () => {
  it('parses only complete allowlisted browser preferences', () => {
    expect(parseExperiencePreferences('{"preset":"focus","motion":"reduced"}')).toEqual({
      preset: 'focus',
      motion: 'reduced',
    });
    expect(parseExperiencePreferences('{"preset":"hidden","motion":"system"}')).toBeNull();
    expect(parseExperiencePreferences('{bad json')).toBeNull();
  });

  it('keeps balanced presentation aligned with the workspace composition', () => {
    const workspace = composeDashboard('research', 'operational');
    expect(getExperiencePresentation('balanced', workspace)).toEqual({
      density: workspace.density,
      view: workspace.view,
      showStats: workspace.showStats,
      showMarketPulse: workspace.showMarketPulse,
    });
  });

  it('reduces secondary modules in focus mode without changing the workspace contract', () => {
    const workspace = composeDashboard('grc', 'forensic');
    expect(getExperiencePresentation('focus', workspace)).toEqual({
      density: 'comfortable',
      view: 'focus',
      showStats: false,
      showMarketPulse: false,
    });
    expect(workspace.visibleModules).toContain('sourceQuality');
  });

  it('maps each workspace to a deterministic next action', () => {
    expect(getExperienceNextAction('citizen').href).toContain('/what-changed');
    expect(getExperienceNextAction('grc').href).toBe('#source-quality');
    expect(getExperienceNextAction('research').href).toBe('/observatory');
    expect(getExperienceNextAction('builder').href).toBe('/developers');
  });
});
