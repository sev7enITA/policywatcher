import { describe, expect, it } from 'vitest';
import { filterNavigationItems, NAVIGATION_GROUPS, navigationGroupFor } from '../navigationDirectory';
import { getWorkspaceQuickActionIds } from '../workspaceNavigation';

const commandIds = [
  'per-te', 'associations', 'timeline', 'observatory', 'leaderboard', 'matrix', 'export', 'methodology', 'how-to',
  'subscribe', 'changelog', 'language', 'about', 'knowledge', 'developers', 'integrations', 'showcase', 'press-kit',
  'atlas', 'feature-atlas', 'roadmap', 'trust', 'what-changed', 'workspace', 'assistant', 'search',
];
const commands = commandIds.map((id) => ({ id, label: id }));

describe('navigation directory reachability and bilingual discovery', () => {
  it('preserves every existing action in the unfiltered directory exactly once', () => {
    const visible = filterNavigationItems(commands, '');
    const rendered = NAVIGATION_GROUPS.flatMap((group) => visible.filter((item) => navigationGroupFor(item.id) === group));
    expect(new Set(rendered.map((item) => item.id))).toEqual(new Set(commandIds));
    expect(rendered).toHaveLength(26);
  });

  it.each(['citizen', 'grc', 'research', 'builder'] as const)('keeps all %s shortcuts discoverable', (role) => {
    for (const id of getWorkspaceQuickActionIds(role)) expect(commandIds).toContain(id);
  });

  it('shows only the chosen task when browsing but searches all tasks when typing', () => {
    expect(filterNavigationItems(commands, '', 'monitor').map((item) => item.id)).not.toContain('export');
    expect(filterNavigationItems(commands, 'esporta', 'monitor').map((item) => item.id)).toEqual(['export']);
    expect(filterNavigationItems(commands, 'CSV', 'understand').map((item) => item.id)).toEqual(['export']);
  });

  it('finds tools by either language, including accented terms and multiple words', () => {
    expect(filterNavigationItems(commands, 'qualità').map((item) => item.id)).toEqual(['trust']);
    expect(filterNavigationItems(commands, 'quality').map((item) => item.id)).toEqual(['trust']);
    expect(filterNavigationItems(commands, '  aziende   policy ').map((item) => item.id)).toEqual(['knowledge', 'search']);
    expect(filterNavigationItems(commands, 'notifiche').map((item) => item.id)).toEqual(['subscribe']);
    expect(filterNavigationItems(commands, 'alerts').map((item) => item.id)).toEqual(['subscribe']);
  });

  it('uses visible labels and descriptions and returns an honest empty result', () => {
    expect(filterNavigationItems([{ id: 'new-tool', label: 'Read the source', tooltip: 'Original policy text' }], 'original')).toHaveLength(1);
    expect(filterNavigationItems(commands, 'unavailable-special-tool')).toEqual([]);
    expect(filterNavigationItems(commands, '   ', 'compare').map((item) => item.id)).toEqual(['timeline', 'leaderboard', 'matrix', 'export', 'what-changed']);
  });
});
