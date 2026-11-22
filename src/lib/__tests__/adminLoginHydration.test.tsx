import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

import AdminLoginPage from '@/app/admin/login/page';

describe('admin login initial HTML', () => {
  it('does not accept credentials or submission before hydration attaches handlers', () => {
    const html = renderToStaticMarkup(<AdminLoginPage />);
    expect(html.match(/<input[^>]*disabled=""/g)).toHaveLength(2);
    expect(html.match(/<button[^>]*disabled=""/g)).toHaveLength(1);
    expect(html).toContain('aria-busy="true"');
  });

  it('explains the disabled controls accessibly and gives a no-JavaScript recovery path', () => {
    const html = renderToStaticMarkup(<AdminLoginPage />);
    expect(html).toContain('id="login-readiness" role="status"');
    expect(html.match(/aria-describedby="login-readiness"/g)).toHaveLength(2);
    expect(html).toContain('<noscript>JavaScript is required to sign in. Enable it and reload this page.</noscript>');
    expect(html).toContain('autoComplete="username"');
    expect(html).toContain('autoComplete="current-password"');
  });
});
