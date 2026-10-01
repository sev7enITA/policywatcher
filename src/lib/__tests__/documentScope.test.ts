import { describe, it, expect } from 'vitest';
import type { Company, Policy } from '@/types';
import { DOCUMENT_TYPES, parseDocumentTypes, typeBalancedScore, documentCoverage } from '../documentScope';
import { buildDashboardViewModel } from '../dashboardViewModel';
import { DEFAULT_DASHBOARD_SHARE_STATE, decodeDashboardShareQuery, encodeDashboardShareQuery } from '../dashboardShareState';
import { reduceDashboardFilterState } from '../dashboardActions';
import { buildDashboardCsvArtifact } from '../exporters';
const policy = (type: string, score?: number): Policy => ({ id: `${type}-${score}`, name: `${type} policy`, type, jurisdiction: 'EU', changes: score ? [{ overallScore: score, overallRisk: score >= 7 ? 'High' : 'Low', createdAt: '2026-10-01T10:00:00Z', regionImpacts: [] }] : [] }) as unknown as Policy;
const companies = [
 { id: 'a', name: 'A', industry: 'Tech Giant', policies: [policy('privacy', 2), policy('terms', 9)] },
 { id: 'b', name: 'B', industry: 'Tech Giant', policies: [policy('terms', 7)] },
 { id: 'c', name: 'C', industry: 'Tech Giant', policies: [policy('privacy')] },
] as Company[];
describe('global document scope', () => {
 it('parses deterministic multi-select and defaults to all', () => { expect(parseDocumentTypes('terms,privacy')).toEqual(['privacy','terms']); expect(parseDocumentTypes(null)).toEqual(DOCUMENT_TYPES); });
 it.each(['', 'foo', 'privacy,foo', 'privacy,privacy'])('rejects invalid explicit scope %s', value => expect(parseDocumentTypes(value)).toBeNull());
 it('filters policy inputs before applying risk and search', () => {
   const view = buildDashboardViewModel(companies, { ...DEFAULT_DASHBOARD_SHARE_STATE, documentTypes: ['privacy'], risk: 'High' });
   expect(view.companies).toHaveLength(0);
   expect(buildDashboardViewModel(companies, { ...DEFAULT_DASHBOARD_SHARE_STATE, documentTypes: ['privacy'], search: 'terms' }).companies).toHaveLength(0);
 });
 it('retains companies missing selected documentation with explicit coverage', () => {
   const view = buildDashboardViewModel(companies, { ...DEFAULT_DASHBOARD_SHARE_STATE, documentTypes: ['privacy'] });
   expect(view.companies).toHaveLength(3);
   expect(view.companies.find(c => c.id === 'b')!.policies).toHaveLength(0);
   expect(view.manifest.documentCoverage.b.missingTypes).toEqual(['privacy']);
   expect(view.manifest.documentCoverage.c.unassessedTypes).toEqual(['privacy']);
 });
 it('preserves type scope and coverage in CSV, including unassessed baselines', () => {
   const view = buildDashboardViewModel(companies, { ...DEFAULT_DASHBOARD_SHARE_STATE, documentTypes: ['privacy'] });
   const artifact = buildDashboardCsvArtifact(view, { generatedAt: '2026-10-01', policyWatcherRelease: 'test', language: 'en' });
   expect(artifact.rows.filter(r => r.RecordType === 'policy').map(r => r.DocumentType)).toEqual(['privacy','privacy']);
   expect(artifact.rows.find(r => r.Company === 'C')!.OverallScore).toBe('');
   expect(artifact.manifest.filters.documentTypes).toEqual(['privacy']);
   expect(artifact.manifest.documentCoverage.b.complete).toBe(false);
 });
 it('weights types equally despite extra URLs and keeps missing scores null', () => {
   expect(typeBalancedScore([policy('privacy', 2), policy('privacy', 2), policy('terms', 8)])).toBe(5);
   expect(typeBalancedScore([policy('privacy')])).toBeNull();
   expect(typeBalancedScore([])).toBeNull();
 });
 it('sorts absent assessments after assessed scores in both directions', () => {
   for (const sortBy of ['risk-asc', 'risk-desc'] as const) expect(buildDashboardViewModel(companies, { ...DEFAULT_DASHBOARD_SHARE_STATE, documentTypes: ['privacy'], sortBy }).companies[0].id).toBe('a');
 });
 it('round-trips shared URLs without leaking excluded types', () => {
   const query = encodeDashboardShareQuery('?intent=research', { ...DEFAULT_DASHBOARD_SHARE_STATE, documentTypes: ['terms', 'privacy'] });
   expect(decodeDashboardShareQuery(query).state.documentTypes).toEqual(['privacy','terms']);
   expect(query).toContain('intent=research');
   expect(encodeDashboardShareQuery(query, DEFAULT_DASHBOARD_SHARE_STATE)).not.toContain('documents=');
 });
 it('resets the global scope, and rejects an empty selection', () => {
   const state = reduceDashboardFilterState(DEFAULT_DASHBOARD_SHARE_STATE, { type:'setFilter', source:'filters', target:'documentTypes', value:['privacy'] });
   expect(state.documentTypes).toEqual(['privacy']);
   expect(reduceDashboardFilterState(state, { type:'setFilter', source:'filters', target:'documentTypes', value:[] })).toBe(state);
   expect(reduceDashboardFilterState(state, { type:'resetFilters', source:'filters', target:'allFilters' }).documentTypes).toEqual(DOCUMENT_TYPES);
 });
 it('reports completeness only when every requested type is assessed', () => {
   expect(documentCoverage([policy('privacy', 2), policy('terms')], ['privacy','terms']).complete).toBe(false);
 });
});
