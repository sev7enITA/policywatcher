import type { WorkspaceIntent } from './dashboardComposer';

export type WorkspaceCommandId =
  | 'timeline'
  | 'observatory'
  | 'leaderboard'
  | 'developers'
  | 'atlas'
  | 'trust'
  | 'matrix'
  | 'export'
  | 'subscribe';

const WORKSPACE_QUICK_ACTIONS: Record<WorkspaceIntent, readonly WorkspaceCommandId[]> = {
  citizen: ['timeline', 'leaderboard', 'subscribe'],
  grc: ['timeline', 'matrix', 'export'],
  research: ['timeline', 'observatory', 'atlas'],
  builder: ['developers', 'observatory', 'trust'],
};

/** Keep the command ribbon calm and deterministic for every workspace. */
export function getWorkspaceQuickActionIds(intent: WorkspaceIntent): readonly WorkspaceCommandId[] {
  return WORKSPACE_QUICK_ACTIONS[intent];
}

export const WORKSPACE_ONBOARDING_COMPLETED_KEY = 'pw_workspace_onboarding_completed_v1';

export function hasCompletedWorkspaceOnboarding(raw: string | null): boolean {
  if (!raw) return false;

  try {
    return (JSON.parse(raw) as { completed?: unknown }).completed === true;
  } catch {
    return false;
  }
}
