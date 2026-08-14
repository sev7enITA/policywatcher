import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');

describe('admin dashboard reduction', () => {
  it('keeps P0 modules and removes recovery mutations and expanded secondary cards from the dashboard', () => {
    const dashboard = read('src/app/admin/page.tsx');

    expect(dashboard).toContain('<OperationalActionCenter');
    expect(dashboard).toContain('<LiveStatusCards');
    expect(dashboard).toContain('<PublicationReadinessFunnel');
    expect(dashboard).toContain('compactEvidencePanel');
    expect(dashboard).toContain('systemStatusBar');
    expect(dashboard).toContain('/admin/database#environment-readiness');
    expect(dashboard).not.toContain("fetch('/api/admin/export-encrypted'");
    expect(dashboard).not.toContain("fetch('/api/admin/decrypt-backup'");
    expect(dashboard).not.toContain('pressMetricCard');
    expect(dashboard).not.toContain('Backup &amp; Security Tools');
    expect(dashboard).toContain('riskProfileTableDisclosure');
    expect(dashboard).toContain('Policy changes grouped by current overall risk profile');
  });

  it('moves administrator recovery controls to Database while keeping Auditor output non-interactive', () => {
    const database = read('src/app/admin/database/page.tsx');
    const recovery = read('src/app/admin/database/DatabaseRecoveryTools.tsx');
    const exportRoute = read('src/app/api/admin/export-encrypted/route.ts');
    const verifyRoute = read('src/app/api/admin/decrypt-backup/route.ts');

    expect(database).toContain('<DatabaseRecoveryTools role={role} />');
    expect(database).toContain('id="environment-readiness"');
    expect(recovery).toContain('id="database-recovery"');
    expect(recovery).toContain("if (role === 'auditor')");
    expect(recovery).toContain('Auditor access is read-only');
    expect(recovery).toContain("fetch('/api/admin/export-encrypted'");
    expect(recovery).toContain("fetch('/api/admin/decrypt-backup'");
    expect(exportRoute).toContain("session.role !== 'admin'");
    expect(verifyRoute).toContain("session.role !== 'admin'");
  });

  it('uses only the sanitized presence contract in both protected summaries', () => {
    const metrics = read('src/app/api/admin/metrics/route.ts');
    const readinessRoute = read('src/app/api/admin/database-readiness/route.ts');
    const helper = read('src/lib/databaseReadiness.ts');

    expect(metrics).toContain('environmentReadiness: buildEnvironmentReadiness()');
    expect(metrics).not.toContain("GEMINI_API_KEY: process.env.GEMINI_API_KEY");
    expect(readinessRoute).toContain('{ ...report, role: session.role }');
    expect(helper).toContain('ENVIRONMENT_READINESS_VARIABLES');
    expect(helper).toContain("status: environment[name] ? 'SET' as const : 'NOT SET' as const");
  });
});
