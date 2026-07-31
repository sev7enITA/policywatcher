import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const layout = readFileSync('src/app/admin/layout.tsx', 'utf8');
const styles = readFileSync('src/app/admin/admin.module.css', 'utf8');

describe('shared admin shell accessibility and orientation', () => {
  it('provides a keyboard skip link and stable protected-content target', () => {
    expect(layout).toContain('href="#admin-main-content"');
    expect(layout).toContain('Skip to protected content');
    expect(layout).toContain('id="admin-main-content"');
    expect(layout).toContain('tabIndex={-1}');
    expect(styles).toMatch(/\.skipLink\s*\{[\s\S]*?transform:/);
    expect(styles).toMatch(/\.skipLink:focus-visible\s*\{[\s\S]*?transform:\s*translateY\(0\)/);
  });

  it('makes loading and verification failure states explicit and accessible', () => {
    expect(layout).toContain('role="status"');
    expect(layout).toContain('aria-live="polite"');
    expect(layout).toContain('aria-label="Verifying admin session"');
    expect(layout).toContain('Verifying admin session...');
    expect(layout).toContain('role="alert"');
    expect(layout).toContain('Unable to verify session');
    expect(layout).toContain('Back to login');
  });

  it('states role and current route without changing role-based filtering', () => {
    expect(layout).toContain("role === 'admin' ? 'Admin role' : 'Auditor role'");
    expect(layout).toContain('styles.mobileHeaderRole');
    expect(layout).toContain("!item.adminOnly || role === 'admin'");
    expect(layout).toContain('aria-current={isActive(item.href)');
    expect(layout).toContain('Current admin route: ${currentRouteTitle}');
    expect(styles).toMatch(/\.navLinkActive\s*\{[\s\S]*?border-left-color:\s*currentColor/);
    expect(styles).toMatch(/\.mobileCurrentRoute\s*\{[\s\S]*?overflow-wrap:\s*anywhere/);
  });

  it('keeps shell controls at least 44px high with visible keyboard focus', () => {
    for (const selector of ['.navLink', '.logoutButton', '.mobileNavTrigger']) {
      expect(styles).toMatch(new RegExp(`\\${selector}\\s*\\{[\\s\\S]*?min-height:\\s*44px`));
    }
    expect(styles).toMatch(/\.mobileNavClose\s*\{[\s\S]*?width:\s*44px;[\s\S]*?height:\s*44px/);
    expect(styles).toContain('.navLink:focus-visible');
    expect(styles).toContain('.logoutButton:focus-visible');
    expect(styles).toContain('.mobileNavTrigger:focus-visible');
    expect(styles).toContain('.mobileNavClose:focus-visible');
  });

  it('keeps shared secondary shell text at twelve pixels or larger', () => {
    for (const selector of ['.logoTextSub', '.roleBadge', '.navSection', '.navCount', '.mobileHeaderRole', '.mobileCurrentRoute']) {
      expect(styles).toMatch(new RegExp(`\\${selector}\\s*\\{[\\s\\S]*?font-size:\\s*0\\.75rem`));
    }
  });

  it('preserves drawer focus containment, Escape, scroll lock and focus return', () => {
    expect(layout).toContain("event.key === 'Escape'");
    expect(layout).toContain("event.key !== 'Tab'");
    expect(layout).toContain("document.body.style.overflow = 'hidden'");
    expect(layout).toContain('document.body.style.overflow = previousOverflow');
    expect(layout).toContain('triggerElement?.focus()');
    expect(layout).toContain('aria-modal="true"');
    expect(layout).toContain('closeRef={mobileCloseRef}');
  });
});
