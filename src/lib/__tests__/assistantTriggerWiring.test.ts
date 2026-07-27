import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const dashboard = readFileSync('src/app/page.tsx', 'utf8');
const dashboardStyles = readFileSync('src/app/Dashboard.module.css', 'utf8');
const navigation = readFileSync('src/components/Navigation.tsx', 'utf8');
const commandPalette = readFileSync('src/components/CommandPalette.tsx', 'utf8');

describe('Policy Live Assistant entry points', () => {
  it('removes the legacy floating dashboard trigger and its exclusive styles', () => {
    expect(dashboard).not.toContain('MessageSquare');
    expect(dashboard).not.toContain('styles.chatTrigger');
    expect(dashboardStyles).not.toMatch(/\.chatTrigger(?:Icon)?\b/);
  });

  it('keeps desktop, mobile, and Workspace Controls commands on the shared callback', () => {
    expect(navigation).toMatch(/const assistantCommand:[\s\S]*?onClick: onOpenAssistant/);
    expect(navigation).toContain("renderCommand(assistantCommand, 'icon')");
    expect(navigation).toMatch(/<nav className=\{styles\.mobileCommandBar\}[\s\S]*?renderCommand\(assistantCommand\)/);
    expect(navigation).toMatch(/className=\{styles\.sheetSearchRow\}[\s\S]*?renderCommand\(assistantCommand, 'sheet'\)/);
    expect(dashboard).toMatch(/<Navigation[\s\S]*?onOpenAssistant=\{\(\) => setChatOpen\(true\)\}/);
  });

  it('keeps the Command Palette assistant action wired to the same dashboard state', () => {
    expect(commandPalette).toContain("id: 'act-assistant'");
    expect(commandPalette).toMatch(/id: 'act-assistant',[\s\S]*?run: \(\) => \{[\s\S]*?onOpenAssistant\(\)/);
    expect(dashboard).toMatch(/<CommandPalette[\s\S]*?onOpenAssistant=\{\(\) => setChatOpen\(true\)\}/);
    expect(dashboard).toMatch(/\{chatOpen && \([\s\S]*?<LiveAssistant/);
  });
});
