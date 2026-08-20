import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');
const route = '/admin/competitive-analysis';

function relativeLuminance(hex: string): number {
  const channels = hex.slice(1).match(/.{2}/g)?.map((channel) => parseInt(channel, 16) / 255) ?? [];
  const linear = channels.map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrast(foreground: string, background: string): number {
  const values = [relativeLuminance(foreground), relativeLuminance(background)].sort((left, right) => right - left);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

describe('valutazione competitiva riservata', () => {
  it('autorizza Admin e Auditor prima di importare il loader riservato', () => {
    const page = read('src/app/admin/competitive-analysis/page.tsx');
    const cookieCheck = page.indexOf('await cookies()');
    const verification = page.indexOf('verifySessionToken');
    const rejection = page.indexOf("redirect('/admin/login')");
    const loader = page.indexOf("await import('@/lib/competitiveAnalysisServer')");
    const privateMemo = page.indexOf('const decisionLanes');

    expect(cookieCheck).toBeGreaterThan(-1);
    expect(verification).toBeGreaterThan(-1);
    expect(rejection).toBeGreaterThan(verification);
    expect(loader).toBeGreaterThan(rejection);
    expect(privateMemo).toBeGreaterThan(rejection);
    expect(page).toContain("session.role !== 'admin' && session.role !== 'auditor'");
    expect(page).toContain("session.role === 'admin'");
    expect(page).toContain('L’Auditor consulta score e storico senza modificare il ledger.');
  });

  it('ricontrolla una sessione Admin e ricalcola senza payload client prima dello snapshot', () => {
    const action = read('src/app/admin/competitive-analysis/actions.ts');
    expect(action).toContain("'use server'");
    expect(action).toContain('export async function recordCompetitiveSnapshot()');
    expect(action).toContain('await cookies()');
    expect(action).toContain("session.role !== 'admin'");
    expect(action).toContain("await import('@/lib/competitiveAnalysisServer')");
    expect(action).toContain('await loadCompetitiveAnalysis()');
    expect(action).toContain('analysis.currentSnapshot');
    expect(action).toContain('revalidatePath(ROUTE)');
    expect(action.indexOf('redirect(`${ROUTE}?snapshot=${outcome}`)')).toBeGreaterThan(action.indexOf('} catch {'));
  });

  it('usa Prisma server-only, esclude waze e registra snapshot idempotenti nel Review Log', () => {
    const server = read('src/lib/competitiveAnalysisServer.ts');
    const scoring = read('src/lib/competitiveAnalysis.ts');
    expect(server).toContain("import 'server-only'");
    expect(server).toContain("const FIXTURE_COMPANY_SLUG = 'waze'");
    expect(server).toContain('db.company.findMany');
    expect(server).toContain('db.adminReviewLog.findMany');
    expect(server).toContain('transaction.adminReviewLog.findFirst');
    expect(server).toContain('targetId: input.snapshot.fingerprint');
    expect(server).not.toContain('fetch(');
    expect(scoring).toContain("COMPETITIVE_SNAPSHOT_TARGET_TYPE = 'CompetitiveAnalysisSnapshot'");
    expect(scoring).toContain("COMPETITIVE_SNAPSHOT_ACTION = 'competitive_analysis_snapshot_created'");
  });

  it('è dinamica, non cacheabile e esclusa dall’indicizzazione', () => {
    const page = read('src/app/admin/competitive-analysis/page.tsx');
    expect(page).toContain("export const dynamic = 'force-dynamic'");
    expect(page).toContain('export const revalidate = 0');
    expect(page).toContain("export const fetchCache = 'force-no-store'");
    expect(page).toContain('noStore()');
    expect(page).toContain('index: false');
    expect(page).toContain('follow: false');
    expect(page).toContain('noarchive: true');
    expect(page).toContain('nocache: true');
    expect(page).toContain('noimageindex: true');
  });

  it('espone cockpit, missing state, matrice, trend e impatti dinamici in italiano', () => {
    const page = read('src/app/admin/competitive-analysis/page.tsx');
    expect(page).toContain('Valutazione live · ricalcolata');
    expect(page).toContain('Registra snapshot');
    expect(page).toContain('Ricalcola ora');
    expect(page).toContain('La spina dorsale dei divari');
    expect(page).toContain('Dalla configurazione all’analisi pubblica');
    expect(page).toContain('Il peso è escluso: un dato mancante non viene trasformato in zero.');
    expect(page).toContain('Undici dimensioni, formule visibili');
    expect(page).toContain('Nessuno snapshot registrato');
    expect(page).toContain('Il gap pesato ordina la risposta');
    expect(page).toContain('Proteggere');
    expect(page).toContain('Colmare');
    expect(page).toContain('Non imitare');
    expect(page).toContain('aria-label="Avviso di riservatezza"');
    expect(page).toContain('aria-label="Tabella scorrevole degli score competitivi"');
    expect(page).toContain('target="_blank" rel="noopener noreferrer"');
  });

  it('non rappresenta dati assenti come parità o zero e mantiene il radar accessibile', () => {
    const page = read('src/app/admin/competitive-analysis/page.tsx');
    expect(page).toContain('<figure className={styles.gapSpine}>');
    expect(page).toContain('Confronto accessibile dei tre assi');
    expect(page).not.toContain('className={styles.gapSpine} role="img"');
    expect(page).toContain('delta !== null');
    expect(page).toContain('Scostamento non calcolabile');
    expect(page).toContain('Percentuale non calcolabile: denominatore non disponibile.');
    expect(page).toContain('percentage !== null');
    expect(page).not.toContain('`${percentage ?? 0}%');
  });

  it('localizza gli assi tramite il catalogo condiviso', () => {
    const page = read('src/app/admin/competitive-analysis/page.tsx');
    const scoring = read('src/lib/competitiveAnalysis.ts');
    const server = read('src/lib/competitiveAnalysisServer.ts');
    expect(scoring).toContain('export const COMPETITIVE_AXIS_LABELS');
    expect(scoring).toContain("market: 'Mercato e corpus'");
    expect(scoring).toContain("evidence: 'Evidence control'");
    expect(scoring).toContain("operations: 'Prodotto e operazioni'");
    expect(server).toContain('axisLabels: COMPETITIVE_AXIS_LABELS');
    expect(page).toContain('analysis.axisLabels[row.axis]');
    expect(page).not.toContain('{row.axis}</small>');
  });

  it('resta nella navigazione Admin e assente dalle superfici pubbliche', () => {
    const layout = read('src/app/admin/layout.tsx');
    const guides = read('src/lib/adminGuides.ts');
    expect(layout).toContain("label: 'Analisi competitiva'");
    expect(layout).toContain(`href: '${route}'`);
    expect(guides).toContain(`'${route}'`);
    expect(guides).toContain('Indice direzionale');
    expect(guides).toContain('Snapshot auditabile');
    expect(existsSync('src/app/competitive-analysis/page.tsx')).toBe(false);

    const publicSources = [
      read('src/app/sitemap.ts'),
      read('src/app/llms.txt/route.ts'),
      read('src/lib/publicSections.ts'),
      read('src/components/PublicHeader.tsx'),
      read('src/components/Footer.tsx'),
    ].join('\n');
    expect(publicSources).not.toContain('/competitive-analysis');
  });

  it('mantiene contratti responsive, dark mode, stampa e accessibilità', () => {
    const page = read('src/app/admin/competitive-analysis/page.tsx');
    const css = read('src/app/admin/competitive-analysis/competitive-analysis.module.css');
    const printCss = css.slice(css.indexOf('@media print'));
    expect(page).toContain('role="region"');
    expect(page).toContain('tabIndex={0}');
    expect(page).toContain('<table');
    expect(css).toContain('.gapSpine');
    expect(css).toContain('.liveFunnel');
    expect(css).toContain('.trendTimeline');
    expect(css).toContain('overflow-x: auto');
    expect(css).toContain('.sectionIndex { top: 58px; }');
    expect(css).toContain('.page section { scroll-margin-top: 118px; }');
    expect(css).toContain('@media (max-width: 720px)');
    expect(css).toContain('@media (prefers-color-scheme: dark)');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(css).toContain('@media print');
    expect(printCss).toContain('--memo-footer-text: #626e69');
    expect(printCss).toContain('.gapSpine');
    expect(printCss).toContain('.comparisonTable details > :not(summary) { display: block !important; }');
    expect(printCss).toContain('.comparisonTable details summary { display: none; }');
    expect(printCss).toContain('.comparisonTable thead { display: table-header-group; }');
    expect(printCss).toContain('font-size: 8.5pt');
  });

  it('mantiene il testo muted light-mode sopra la soglia WCAG AA', () => {
    const css = read('src/app/admin/competitive-analysis/competitive-analysis.module.css');
    const paper = css.match(/--memo-paper: (#[0-9a-f]{6});/)?.[1];
    const muted = css.match(/--memo-muted: (#[0-9a-f]{6});/)?.[1];
    expect(paper).toBeDefined();
    expect(muted).toBeDefined();
    expect(contrast(muted!, paper!)).toBeGreaterThanOrEqual(4.5);
  });
});
