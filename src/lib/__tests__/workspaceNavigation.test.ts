import { describe, expect, it } from 'vitest';
import {
  getWorkspaceQuickActionIds,
  hasCompletedWorkspaceOnboarding,
} from '../workspaceNavigation';

describe('workspace-aware navigation', () => {
  it.each(['citizen', 'grc', 'research', 'builder'] as const)(
    'keeps %s quick access to a maximum of three commands',
    (intent) => {
      const commands = getWorkspaceQuickActionIds(intent);
      expect(commands).toHaveLength(3);
      expect(new Set(commands).size).toBe(commands.length);
    },
  );

  it('uses an explicit completion marker instead of inferring completion from a profile', () => {
    expect(hasCompletedWorkspaceOnboarding(null)).toBe(false);
    expect(hasCompletedWorkspaceOnboarding('{"intent":"citizen","depth":"snapshot"}')).toBe(false);
    expect(hasCompletedWorkspaceOnboarding('{"completed":true}')).toBe(true);
    expect(hasCompletedWorkspaceOnboarding('not-json')).toBe(false);
  });

  it('gives Builder a direct path to the public integration directory', () => {
    expect(getWorkspaceQuickActionIds('builder')).toContain('developers');
  });
});
