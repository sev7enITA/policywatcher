import { describe, expect, it } from 'vitest';
import {
  DASHBOARD_ACTION_GRAPH,
  DASHBOARD_ACTION_GRAPH_ISSUES,
  dashboardActionEdgeId,
  isDashboardActionEdgeAllowed,
  validateDashboardActionGraph,
  type DashboardActionGraph,
} from '../dashboardActionGraph';

describe('dashboard action graph', () => {
  it('ships an immutable acyclic graph', () => {
    expect(DASHBOARD_ACTION_GRAPH_ISSUES).toEqual([]);
    expect(Object.isFrozen(DASHBOARD_ACTION_GRAPH)).toBe(true);
    expect(Object.isFrozen(DASHBOARD_ACTION_GRAPH.edges)).toBe(true);
    expect(isDashboardActionEdgeAllowed('setFilter', 'filters', 'search')).toBe(true);
    expect(isDashboardActionEdgeAllowed('setFilter', 'commandPalette', 'search')).toBe(false);
  });

  it('detects cycles before an interaction graph can be used', () => {
    const first = dashboardActionEdgeId('setFilter', 'node.a', 'node.b');
    const second = dashboardActionEdgeId('setFilter', 'node.b', 'node.a');
    const cyclic: DashboardActionGraph = {
      id: 'cyclic',
      nodes: {
        'node.a': { id: 'node.a', kind: 'surface' },
        'node.b': { id: 'node.b', kind: 'control' },
      },
      edges: [
        { id: first, action: 'setFilter', source: 'node.a', target: 'node.b' },
        { id: second, action: 'setFilter', source: 'node.b', target: 'node.a' },
      ],
    };

    expect(validateDashboardActionGraph(cyclic)).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'graph.cycle' })])
    );
  });

  it('rejects missing targets and non-deterministic edge IDs', () => {
    const invalid: DashboardActionGraph = {
      id: 'invalid',
      nodes: { source: { id: 'source', kind: 'surface' } },
      edges: [
        { id: 'random-id', action: 'setFilter', source: 'source', target: 'missing' },
      ],
    };

    expect(validateDashboardActionGraph(invalid).map((issue) => issue.code)).toEqual(
      expect.arrayContaining(['graph.edge_id_not_deterministic', 'graph.target_unknown'])
    );
  });
});
