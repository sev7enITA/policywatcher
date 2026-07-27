export type DashboardActionGraphSource = 'filters' | 'commandPalette' | 'regionHeatMap';
export type DashboardControlId =
  | 'industry'
  | 'risk'
  | 'region'
  | 'perspective'
  | 'dateRange'
  | 'search'
  | 'regionalContext'
  | 'allFilters';
export type DashboardActionKind = 'setFilter' | 'setContext' | 'resetFilters';

export interface DashboardActionGraphNode {
  readonly id: string;
  readonly kind: 'module' | 'surface' | 'control';
}

export interface DashboardActionGraphEdge {
  readonly id: string;
  readonly action: DashboardActionKind;
  readonly source: string;
  readonly target: string;
}

export interface DashboardActionGraph {
  readonly id: string;
  readonly nodes: Readonly<Record<string, DashboardActionGraphNode>>;
  readonly edges: readonly DashboardActionGraphEdge[];
}

export interface DashboardActionGraphIssue {
  code:
    | 'graph.node_key_mismatch'
    | 'graph.edge_id_duplicate'
    | 'graph.edge_id_not_deterministic'
    | 'graph.source_unknown'
    | 'graph.target_unknown'
    | 'graph.self_loop'
    | 'graph.cycle';
  path: string;
  message: string;
}

export function dashboardActionSourceNodeId(source: DashboardActionGraphSource): string {
  if (source === 'filters') return 'module.filters';
  if (source === 'commandPalette') return 'surface.commandPalette';
  if (source === 'regionHeatMap') return 'visual.regionHeatMap';
  return `unknown.${String(source)}`;
}

export function dashboardActionTargetNodeId(target: DashboardControlId): string {
  return `control.${target}`;
}

export function dashboardActionEdgeId(
  action: DashboardActionKind,
  source: string,
  target: string
): string {
  return `${action}:${source}->${target}`;
}

function edge(
  action: DashboardActionKind,
  source: DashboardActionGraphSource,
  target: DashboardControlId
): DashboardActionGraphEdge {
  const sourceId = dashboardActionSourceNodeId(source);
  const targetId = dashboardActionTargetNodeId(target);
  return Object.freeze({
    id: dashboardActionEdgeId(action, sourceId, targetId),
    action,
    source: sourceId,
    target: targetId,
  });
}

const nodes = [
  { id: 'module.filters', kind: 'module' },
  { id: 'surface.commandPalette', kind: 'surface' },
  { id: 'visual.regionHeatMap', kind: 'surface' },
  { id: 'control.industry', kind: 'control' },
  { id: 'control.risk', kind: 'control' },
  { id: 'control.region', kind: 'control' },
  { id: 'control.perspective', kind: 'control' },
  { id: 'control.dateRange', kind: 'control' },
  { id: 'control.search', kind: 'control' },
  { id: 'control.regionalContext', kind: 'control' },
  { id: 'control.allFilters', kind: 'control' },
] as const satisfies readonly DashboardActionGraphNode[];

export const DASHBOARD_ACTION_GRAPH: DashboardActionGraph = Object.freeze({
  id: 'policywatcher.dashboard.actions.v1',
  nodes: Object.freeze(
    Object.fromEntries(nodes.map((node) => [node.id, Object.freeze({ ...node })]))
  ),
  edges: Object.freeze([
    edge('setFilter', 'filters', 'industry'),
    edge('setFilter', 'filters', 'risk'),
    edge('setFilter', 'filters', 'region'),
    edge('setFilter', 'filters', 'perspective'),
    edge('setFilter', 'filters', 'dateRange'),
    edge('setFilter', 'filters', 'search'),
    edge('resetFilters', 'filters', 'allFilters'),
    edge('setFilter', 'commandPalette', 'industry'),
    edge('setFilter', 'commandPalette', 'risk'),
    edge('setFilter', 'commandPalette', 'region'),
    edge('setFilter', 'commandPalette', 'perspective'),
    edge('resetFilters', 'commandPalette', 'allFilters'),
    edge('setContext', 'regionHeatMap', 'regionalContext'),
  ]),
});

export function validateDashboardActionGraph(graph: DashboardActionGraph): DashboardActionGraphIssue[] {
  const issues: DashboardActionGraphIssue[] = [];

  for (const [key, node] of Object.entries(graph.nodes)) {
    if (key !== node.id) {
      issues.push({
        code: 'graph.node_key_mismatch',
        path: `nodes.${key}.id`,
        message: `Node key ${key} does not match id ${node.id}.`,
      });
    }
  }

  const seenEdges = new Set<string>();
  for (const [index, graphEdge] of graph.edges.entries()) {
    if (seenEdges.has(graphEdge.id)) {
      issues.push({
        code: 'graph.edge_id_duplicate',
        path: `edges.${index}.id`,
        message: `Duplicate edge id ${graphEdge.id}.`,
      });
    }
    seenEdges.add(graphEdge.id);

    const expectedId = dashboardActionEdgeId(
      graphEdge.action,
      graphEdge.source,
      graphEdge.target
    );
    if (graphEdge.id !== expectedId) {
      issues.push({
        code: 'graph.edge_id_not_deterministic',
        path: `edges.${index}.id`,
        message: `Edge ${graphEdge.id} must use deterministic id ${expectedId}.`,
      });
    }
    if (!graph.nodes[graphEdge.source]) {
      issues.push({
        code: 'graph.source_unknown',
        path: `edges.${index}.source`,
        message: `Unknown edge source ${graphEdge.source}.`,
      });
    }
    if (!graph.nodes[graphEdge.target]) {
      issues.push({
        code: 'graph.target_unknown',
        path: `edges.${index}.target`,
        message: `Unknown edge target ${graphEdge.target}.`,
      });
    }
    if (graphEdge.source === graphEdge.target) {
      issues.push({
        code: 'graph.self_loop',
        path: `edges.${index}`,
        message: `Self-loop detected on ${graphEdge.source}.`,
      });
    }
  }

  const adjacency = new Map<string, string[]>();
  for (const graphEdge of graph.edges) {
    if (!graph.nodes[graphEdge.source] || !graph.nodes[graphEdge.target]) continue;
    adjacency.set(graphEdge.source, [...(adjacency.get(graphEdge.source) || []), graphEdge.target]);
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  let cycleDetected = false;

  const visit = (nodeId: string): void => {
    if (cycleDetected || visited.has(nodeId)) return;
    if (visiting.has(nodeId)) {
      cycleDetected = true;
      return;
    }
    visiting.add(nodeId);
    for (const target of adjacency.get(nodeId) || []) visit(target);
    visiting.delete(nodeId);
    visited.add(nodeId);
  };

  for (const nodeId of Object.keys(graph.nodes)) visit(nodeId);
  if (cycleDetected) {
    issues.push({
      code: 'graph.cycle',
      path: 'edges',
      message: 'The dashboard action graph contains a cycle.',
    });
  }

  return issues;
}

export const DASHBOARD_ACTION_GRAPH_ISSUES = validateDashboardActionGraph(DASHBOARD_ACTION_GRAPH);

if (DASHBOARD_ACTION_GRAPH_ISSUES.length > 0) {
  throw new Error(
    `Invalid built-in dashboard action graph: ${DASHBOARD_ACTION_GRAPH_ISSUES
      .map((issue) => `${issue.path}: ${issue.message}`)
      .join('; ')}`
  );
}

export function isDashboardActionEdgeAllowed(
  action: DashboardActionKind,
  source: DashboardActionGraphSource,
  target: DashboardControlId
): boolean {
  const edgeId = dashboardActionEdgeId(
    action,
    dashboardActionSourceNodeId(source),
    dashboardActionTargetNodeId(target)
  );
  return DASHBOARD_ACTION_GRAPH.edges.some((graphEdge) => graphEdge.id === edgeId);
}
