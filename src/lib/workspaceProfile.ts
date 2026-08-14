import {
  DEFAULT_EVIDENCE_DEPTH,
  DEFAULT_WORKSPACE_INTENT,
  normalizeEvidenceDepth,
  normalizeWorkspaceIntent,
  type EvidenceDepth,
  type WorkspaceIntent,
} from './dashboardComposer';

export interface WorkspaceProfile {
  intent: WorkspaceIntent;
  depth: EvidenceDepth;
  onTheGo: boolean;
}

export interface DecodedWorkspaceQuery {
  hasWorkspaceParams: boolean;
  intent: WorkspaceIntent | null;
  depth: EvidenceDepth | null;
}

export const DEFAULT_WORKSPACE_PROFILE: WorkspaceProfile = Object.freeze({
  intent: DEFAULT_WORKSPACE_INTENT,
  depth: DEFAULT_EVIDENCE_DEPTH,
  onTheGo: false,
});

function normalizeOnTheGo(intent: WorkspaceIntent, depth: EvidenceDepth, value: unknown): boolean {
  return value === true && intent === 'citizen' && depth === 'snapshot';
}

export function parseWorkspaceProfile(raw: string | null): WorkspaceProfile | null {
  if (!raw) return null;

  try {
    const candidate = JSON.parse(raw) as { intent?: unknown; depth?: unknown; onTheGo?: unknown };
    const intent = normalizeWorkspaceIntent(
      typeof candidate.intent === 'string' ? candidate.intent : null
    );
    const depth = normalizeEvidenceDepth(
      typeof candidate.depth === 'string' ? candidate.depth : null
    );
    if (!intent || !depth) return null;
    return { intent, depth, onTheGo: normalizeOnTheGo(intent, depth, candidate.onTheGo) };
  } catch {
    return null;
  }
}

export function serializeWorkspaceProfile(profile: WorkspaceProfile): string {
  return JSON.stringify({
    intent: profile.intent,
    depth: profile.depth,
    onTheGo: normalizeOnTheGo(profile.intent, profile.depth, profile.onTheGo),
  });
}

export function decodeWorkspaceQuery(search: string | URLSearchParams): DecodedWorkspaceQuery {
  const params = typeof search === 'string'
    ? new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
    : search;
  const hasWorkspaceParams = params.has('intent') || params.has('workspace') || params.has('depth');
  const intent = normalizeWorkspaceIntent(params.get('intent') || params.get('workspace'));
  const depth = normalizeEvidenceDepth(params.get('depth'));

  return { hasWorkspaceParams, intent, depth };
}

/** Produces canonical, stable query state while preserving unrelated filters. */
export function encodeWorkspaceQuery(
  search: string | URLSearchParams,
  profile: Pick<WorkspaceProfile, 'intent' | 'depth'>
): string {
  const params = typeof search === 'string'
    ? new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
    : new URLSearchParams(search);
  params.delete('workspace');
  params.set('intent', profile.intent);
  params.set('depth', profile.depth);
  params.sort();
  return params.toString();
}
