import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { existsSync, readFileSync } from 'node:fs';
import { GET as liveness } from '@/app/api/live/route';
import { proxy } from '../../proxy';

describe('assessment-driven surface hardening', () => {
  it('redirects unauthenticated administrative shells without exposing their client content', () => {
    for (const path of ['/admin', '/admin/explainability', '/admin/database']) {
      const response = proxy(new NextRequest(`https://policywatcher.online${path}`));
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('https://policywatcher.online/admin/login');
    }
    expect(proxy(new NextRequest('https://policywatcher.online/admin/login')).status).toBe(200);
  });

  it('provides credential-free process liveness without database or deployment details', async () => {
    const response = await liveness();
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store, max-age=0');
    expect(await response.json()).toEqual({ status: 'ok' });
  });

  it('distinguishes dashboard acquisition failures from an empty evidence state', () => {
    const dashboard = readFileSync('src/app/DashboardClient.tsx', 'utf8');
    expect(dashboard).toContain('setDashboardLoadError(true)');
    expect(dashboard).toContain('dashboardLoadError ?');
    expect(dashboard).toContain('This error is not being reported as an empty evidence state.');
    expect(dashboard).toContain('onClick={() => void fetchCompanies()}');
  });

  it('has explicit root loading and error boundaries', () => {
    expect(existsSync('src/app/error.tsx')).toBe(true);
    expect(existsSync('src/app/loading.tsx')).toBe(true);
    expect(readFileSync('src/app/error.tsx', 'utf8')).toContain('No missing evidence or healthy status is inferred');
  });

  it('keeps local assessment worktrees outside the application lint perimeter', () => {
    expect(readFileSync('eslint.config.mjs', 'utf8')).toContain('".claude/worktrees/**"');
  });
});
