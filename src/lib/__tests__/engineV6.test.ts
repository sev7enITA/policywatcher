import { beforeAll, beforeEach, afterAll, describe, it, expect, vi } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import { load } from 'cheerio';
import { digest, structureDocument, compareDocuments, assessDocument, parseSourceContract, type SourceContract } from '../engine/document';
import { validateClaims, validateVerification, validateModelPair, engineModelPair, modelEvidence, CLAIM_SCHEMA, type AnalysisInput, type ClaimSet, type AnalysisProvider } from '../engine/claims';
import type { CaptureBody, Observation } from '../engine/acquisition';
import type { TaskInput } from '../engine/store';

const dir = mkdtempSync(join(tmpdir(), 'pw-engine-v6-'));
const url = `file:${join(dir, 'engine.db')}`;
const database = new PrismaClient({ datasources: { db: { url } } });
const otherClient = new PrismaClient({ datasources: { db: { url } } });
let store: typeof import('../engine/store');
let pipeline: typeof import('../engine/pipeline');
let acquisition: typeof import('../engine/acquisition');
let outbox: typeof import('../engine/outbox');
const oldText = '# Privacy Policy\n\n## Data use\n\nWe respond to support questions within 30 days.\n\n## Contact\n\nContact the privacy team for information about this policy.';
const newText = oldText.replace('30 days', '60 days');
const fixtureUrl = 'https://example.com/privacy';
const contract: SourceContract = { schemaVersion: 1, sourceUrl: fixtureUrl, titleAliases: ['Privacy Policy'],
  requiredHeadings: ['Data use', 'Contact'], terminalText: 'Contact the privacy team for information about this policy.',
  language: 'en', minimumChars: 100, maximumChars: 500000, preferredTransport: 'direct',
  reviewedAt: '2026-10-31T00:00:00.000Z', reviewNote: 'Reviewed the complete synthetic fixture.' };
const receipt = { model: 'synthetic-test-provider', promptVersion: 'fixture-1', inputHash: digest('fixture-input'), outputHash: digest('fixture-output'), inputTokens: 0, outputTokens: 0 };

function grounded(input: AnalysisInput): ClaimSet {
  return { schema: CLAIM_SCHEMA, claims: [{ id: 'c1', operation: 'modified', category: 'content',
    textEn: 'The support response time changes from 30 to 60 days.', textIt: 'Il tempo di risposta alle richieste passa da 30 a 60 giorni.', impact: 4,
    deltaIds: input.deltas.map(d => d.id), evidence: input.deltas.map(d => ({ side: d.side,
      documentHash: d.side === 'old' ? input.old.hash : input.next.hash, start: d.block.start, end: d.block.end, quote: d.block.text })) }] };
}
const analysis: AnalysisProvider = {
  analyze: vi.fn(async input => ({ value: grounded(input), receipt })),
  verify: vi.fn(async (_input: AnalysisInput, claims: ClaimSet) => ({ value: { verdicts: claims.claims.map(c => ({ claimId: c.id, verdict: 'supported' as const, reason: 'Synthetic fixture verification.' })) }, receipt: { ...receipt, model: 'independent-test-provider' } })),
};
async function capture(text = newText, notModified = false): Promise<Observation> {
  const body: CaptureBody = { html: `<html lang="en"><main>${text}</main></html>`, document: structureDocument(text), language: 'en' };
  return { artifactId: await store.putArtifact(body), observedAt: new Date().toISOString(), source: 'direct', httpStatus: notModified ? 304 : 200,
    finalUrl: fixtureUrl, notModified, eligible: true, reasons: [], diagnostics: [] };
}
async function seed(suffix = '', sourceUrl = fixtureUrl) {
  const company = await database.company.create({ data: { name: `Fixture${suffix}`, slug: `fixture${suffix}`, website: 'https://example.com', industry: 'Technology' } });
  const policy = await database.policy.create({ data: { companyId: company.id, name: 'Privacy Policy', type: 'privacy', url: sourceUrl,
    currentHash: digest(oldText), currentText: oldText, lastCheckDate: new Date(0), lastSuccessfulCheckDate: new Date(0), ingestionMethod: 'Direct Scrape',
    snapshots: { create: { version: 1, text: oldText, hash: digest(oldText), publicEvidence: true } } } });
  const contractJson = JSON.stringify({ ...contract, sourceUrl });
  await database.engineSourceContract.create({ data: { policyId: policy.id, contractJson, contractHash: digest(contractJson), reviewedBy: 'fixture-admin' } });
  await database.extractionBaseline.create({ data: { policyId: policy.id, baselineHash: policy.currentHash, profileHash: store.engineExtractionProfileHash(sourceUrl),
    inputHash: digest(oldText), input: oldText, sourceUrl, capturedAt: new Date() } });
  return policy;
}
async function drain(dependencies: Partial<import('../engine/pipeline').EngineDependencies> = {}) {
  for (let i = 0; i < 40; i++) if (!await pipeline.workerStep({ acquire: async () => capture(), analysis, ...dependencies })) break;
}
async function readySecond(policyId: string, mode = 'publish') {
  await database.enginePolicyState.update({ where: store.stateKey(policyId, mode), data: { candidateObservedAt: new Date(Date.now() - store.CONFIRMATION_MS - 1000), nextDueAt: new Date(0) } });
  await database.engineOrigin.updateMany({ data: { nextAllowedAt: new Date(0) } });
}
async function run(requestKey: string, mode: 'publish' | 'observe' = 'publish') {
  return store.enqueueRun({ requestKey, mode, requestedBy: 'fixture-admin', notificationMode: 'subscribers' });
}
beforeAll(async () => {
  execFileSync(process.execPath, ['scripts/hostinger-init-db.mjs'], { env: { ...process.env, DATABASE_URL: url }, stdio: 'pipe' });
  vi.doMock('../db', () => ({ db: database }));
  store = await import('../engine/store'); pipeline = await import('../engine/pipeline');
  acquisition = await import('../engine/acquisition'); outbox = await import('../engine/outbox');
});
beforeEach(async () => {
  vi.stubEnv('POLICYWATCHER_SCANS_PAUSED', '0'); vi.stubEnv('POLICYWATCHER_ENGINE_PUBLICATION', '1'); vi.stubEnv('POLICYWATCHER_ENGINE_NOTIFICATIONS', '0');
  await database.engineRun.deleteMany(); await database.engineReview.deleteMany(); await database.engineOutbox.deleteMany();
  await database.engineSourceContract.deleteMany(); await database.enginePolicyState.deleteMany(); await database.engineOrigin.deleteMany();
  await database.engineHttpCache.deleteMany(); await database.engineArtifact.deleteMany(); await database.company.deleteMany();
  await database.engineAttempt.deleteMany(); await database.engineClaim.deleteMany();
  await database.subscriber.deleteMany(); vi.clearAllMocks();
});
afterAll(async () => { await database.$disconnect(); await otherClient.$disconnect(); vi.unstubAllEnvs(); rmSync(dir, { recursive: true, force: true }); });

describe('V6 evidence contracts', () => {
  it('requires an explicit distinct model configuration before any paid inference', () => {
    try {
      vi.stubEnv('POLICYWATCHER_ENGINE_ANALYST_MODEL', ''); vi.stubEnv('POLICYWATCHER_ENGINE_VERIFIER_MODEL', '');
      expect(engineModelPair).toThrow('analysis_model_configuration_required');
      vi.stubEnv('POLICYWATCHER_ENGINE_ANALYST_MODEL', 'test-analyst'); vi.stubEnv('POLICYWATCHER_ENGINE_VERIFIER_MODEL', 'models/TEST-ANALYST');
      expect(engineModelPair).toThrow('analysis_model_pair_not_independent');
      vi.stubEnv('POLICYWATCHER_ENGINE_VERIFIER_MODEL', 'https://unapproved.invalid/model');
      expect(engineModelPair).toThrow('analysis_model_configuration_invalid');
      vi.stubEnv('POLICYWATCHER_ENGINE_VERIFIER_MODEL', 'test-verifier');
      expect(engineModelPair()).toEqual({ analyst: 'test-analyst', verifier: 'test-verifier' });
    } finally { vi.unstubAllEnvs(); }
  });
  it('retains interleaved unstructured clauses and inline qualifiers in document order without duplication', () => {
    const html = `<html lang="en"><main><h1>Privacy Policy</h1><div>Effective <span>October 31, 2026</span>.</div><h2>Data use</h2><p>We respond to support questions within 30 days.</p><div>We may use <a href="/definitions">account data</a> <strong>only with consent.</strong><section><p>We do not sell medical records.</p></section>Except where a court requires disclosure.</div><pre>Example: request denied.</pre><h2>Contact</h2><p>${contract.terminalText}</p></main></html>`;
    const body = acquisition.extractEngineBody(html, fixtureUrl);
    const clauses = ['Effective October 31, 2026.', 'We may use account data only with consent.', 'We do not sell medical records.', 'Except where a court requires disclosure.', 'Example: request denied.'];
    let previous = -1;
    for (const clause of clauses) {
      expect(body.document.text.split(clause)).toHaveLength(2);
      const at = body.document.text.indexOf(clause); expect(at).toBeGreaterThan(previous); previous = at;
    }
    expect(body.html).toBe(html);
    expect(acquisition.assessCapture(body, contract, fixtureUrl).eligible).toBe(true);
  });
  it('retains table captions and native disclosure summaries without duplicating rows', () => {
    const html = `<html lang="en"><main><h1>Privacy Policy</h1><p>${'Context about the policy and the scope of these terms. '.repeat(3)}</p><table><caption>Adults only</caption><tr><th>Purpose</th><th>Consent</th></tr><tr><td>Training</td><td>No</td></tr></table><details><summary>Exception for children</summary><p>Training is never allowed for children.</p></details></main></html>`;
    const body = acquisition.extractEngineBody(html, fixtureUrl);
    for (const clause of ['Adults only', '| Training | No |', 'Exception for children', 'Training is never allowed for children.']) expect(body.document.text.split(clause)).toHaveLength(2);
    expect(body.document.text.indexOf('Adults only')).toBeLessThan(body.document.text.indexOf('| Purpose | Consent |'));
  });
  it('holds an otherwise matching page without an explicit document boundary', () => {
    const html = `<html lang="en"><body><h1>Privacy Policy</h1><h2>Data use</h2><p>We respond to support questions within 30 days.</p><div>We sell personal data.</div><h2>Contact</h2><p>${contract.terminalText}</p></body></html>`;
    expect(acquisition.assessCapture(acquisition.extractEngineBody(html, fixtureUrl), contract, fixtureUrl).reasons).toContain('document_scope_unverified');
  });
  it('holds multiple disconnected document roots instead of silently choosing only the longest', () => {
    const html = `<html lang="en"><main><h1>Privacy Policy</h1><h2>Data use</h2><p>We respond to support questions within 30 days.</p><h2>Contact</h2><p>${contract.terminalText}</p></main><article><p>Except that account data may be sold.</p></article></html>`;
    expect(acquisition.assessCapture(acquisition.extractEngineBody(html, fixtureUrl), contract, fixtureUrl).reasons).toContain('document_scope_ambiguous');
  });
  it('retains a table caption nested inside a semantic list item', () => {
    const html = `<html lang="en"><main><h1>Privacy Policy</h1><p>${'Context about the policy and the scope of these terms. '.repeat(3)}</p><ul><li>Uses:<table><caption>Adults only</caption><tr><th>Purpose</th><th>Consent</th></tr><tr><td>Training</td><td>No</td></tr></table></li></ul></main></html>`;
    expect(acquisition.extractEngineBody(html, fixtureUrl).document.text.split('Adults only')).toHaveLength(2);
  });
  it.each(['li', 'blockquote', 'dd'])('retains ordered clauses inside a compound %s without moving its final exception', tag => {
    const content = `<${tag}>Lead condition.<p>We share account records.</p>Except when consent is withdrawn.<p>We retain audit logs.</p>Only for thirty days.</${tag}>`;
    const html = `<html lang="en"><main><h1>Privacy Policy</h1><h2>Data use</h2>${tag === 'li' ? `<ul>${content}</ul>` : tag === 'dd' ? `<dl>${content}</dl>` : content}<h2>Contact</h2><p>${contract.terminalText}</p></main></html>`;
    const body = acquisition.extractEngineBody(html, fixtureUrl);
    let previous = -1;
    for (const clause of ['Lead condition.', 'We share account records.', 'Except when consent is withdrawn.', 'We retain audit logs.', 'Only for thirty days.']) {
      expect(body.document.text.split(clause)).toHaveLength(2);
      const at = body.document.text.indexOf(clause); expect(at).toBeGreaterThan(previous); previous = at;
    }
    expect(acquisition.assessCapture(body, contract, fixtureUrl).eligible).toBe(true);
  });
  it.each(['aside', 'footer', 'nav', 'div role="contentinfo"', 'div class="sidebar"', 'header', 'form', 'noscript', 'svg'])('holds unreviewed text removed from %s within the document', wrapper => {
    const html = `<html lang="en"><main><h1>Privacy Policy</h1><h2>Data use</h2><p>We respond to support questions within 30 days.</p><${wrapper} id="exception">Except that we may sell records.</${wrapper.split(' ')[0]}><h2>Contact</h2><p>${contract.terminalText}</p></main></html>`;
    const body = acquisition.extractEngineBody(html, fixtureUrl);
    expect(assessDocument(body.document, contract, fixtureUrl, 'en').eligible).toBe(true);
    expect(acquisition.assessCapture(body, contract, fixtureUrl).reasons).toContain('removed_document_content_unreviewed');
  });
  it('keeps a compound list lead across layout wrappers and emits nested headings once', () => {
    const html = `<html lang="en"><main><h1>Privacy Policy</h1><h2>Data use</h2><ul><li><span>a. </span><div>Only with consent:<ul><li>Account records are shared.</li></ul>Except when consent is withdrawn.</div></li><li><h3>Retention period</h3><p>Thirty days after account closure.</p></li></ul><h2>Contact</h2><p>${contract.terminalText}</p></main></html>`;
    const body = acquisition.extractEngineBody(html, fixtureUrl);
    expect(body.document.text).toContain('- a. Only with consent:');
    expect(body.document.text.split('Retention period')).toHaveLength(2);
    expect(body.document.text.indexOf('Account records are shared.')).toBeLessThan(body.document.text.indexOf('Except when consent is withdrawn.'));
  });
  it.each(['li', 'blockquote', 'dd'])('keeps separate layout clauses inside a compound %s', tag => {
    const content = `<${tag}><p>We keep account records for thirty days.</p><div>No sale.</div><div>Consent is required.</div></${tag}>`;
    const html = `<html lang="en"><main><h1>Privacy Policy</h1><h2>Data use</h2>${tag === 'li' ? `<ul>${content}</ul>` : tag === 'dd' ? `<dl>${content}</dl>` : content}<h2>Contact</h2><p>${contract.terminalText}</p></main></html>`;
    const body = acquisition.extractEngineBody(html, fixtureUrl);
    expect(body.document.blocks.some(b => b.text === 'No sale.')).toBe(true);
    expect(body.document.blocks.some(b => b.text === 'Consent is required.')).toBe(true);
  });
  it('retains own text when the selected fragment root is itself a semantic policy container', () => {
    const scopedUrl = fixtureUrl + '#scope';
    const html = `<html lang="en"><main><ul><li id="scope" class="policy-content">Only with consent.<h1>Privacy Policy</h1><h2>Data use</h2><p>We share account records.</p>Except when consent is withdrawn.<h2>Contact</h2><p>${contract.terminalText}</p></li></ul></main></html>`;
    const body = acquisition.extractEngineBody(html, scopedUrl);
    expect(body.document.text).toContain('Only with consent.');
    expect(body.document.text).toContain('Except when consent is withdrawn.');
    expect(body.document.text.indexOf('We share account records.')).toBeLessThan(body.document.text.indexOf('Except when consent is withdrawn.'));
    expect(acquisition.assessCapture(body, { ...contract, sourceUrl: scopedUrl }, scopedUrl).eligible).toBe(true);
  });
  it('emits one list marker per compound item, including paragraph-only items', () => {
    const html = `<html lang="en"><main><h1>Privacy Policy</h1><h2>Data use</h2><ul><li>Lead condition.<p>We share account records.</p>Except when consent is withdrawn.</li><li><p>We delete records after thirty days.</p></li></ul><h2>Contact</h2><p>${contract.terminalText}</p></main></html>`;
    const body = acquisition.extractEngineBody(html, fixtureUrl);
    expect(body.document.text).toContain('- Lead condition.');
    expect(body.document.text).not.toContain('- Except when consent is withdrawn.');
    expect(body.document.text).toContain('- We delete records after thirty days.');
  });
  it.each(['<main role="dialog">', '<div role="dialog"><article>'])('holds dialog scopes even when the dialog contains its document root: %s', opening => {
    const closing = opening.includes('<article>') ? '</article></div>' : '</main>';
    const html = `<html lang="en"><main><h1>Privacy Policy</h1><h2>Data use</h2><p>We respond to support questions within 30 days.</p><h2>Contact</h2><p>${contract.terminalText}</p></main>${opening}<p>Except that we may sell account records.</p>${closing}</html>`;
    expect(acquisition.assessCapture(acquisition.extractEngineBody(html, fixtureUrl), contract, fixtureUrl).reasons).toContain('dialog_document_scope_unverified');
  });
  it('scopes OneTrust fragments before recursion without importing adjacent notice sections', () => {
    const html = `<html lang="en"><main><div class="otnotice-content"><h1>Privacy Policy</h1><h2 id="data">Data use</h2><p>${'We keep account records only with valid consent. '.repeat(8)}</p><h2>Other terms</h2><p>${'UNRELATED TERMS MUST STAY OUTSIDE THE REQUESTED FRAGMENT. '.repeat(8)}</p></div></main></html>`;
    const body = acquisition.extractEngineBody(html, fixtureUrl + '#data');
    expect(body.document.text).toContain('We keep account records only with valid consent.');
    expect(body.document.text).not.toContain('UNRELATED TERMS');
    expect(body.document.text).not.toContain('# Privacy Policy');
  });
  it('retains an inline opt-out link with button semantics as part of the complete clause', () => {
    const html = `<html lang="en"><main><h1>Privacy Policy</h1><h2>Data use</h2><div>You may exercise your right via <a role="button" href="/optout">Do Not Sell My Personal Information</a> at any time.</div><h2>Contact</h2><p>${contract.terminalText}</p></main></html>`;
    const body = acquisition.extractEngineBody(html, fixtureUrl);
    expect(body.document.text).toContain('You may exercise your right via Do Not Sell My Personal Information at any time.');
    expect(acquisition.assessCapture(body, contract, fixtureUrl).eligible).toBe(true);
  });
  it.each(['button', 'span role="button"', 'select', 'span role="combobox"'])('holds unreviewed interactive text in %s instead of silently omitting it', wrapper => {
    const content = wrapper === 'select' ? '<option>No sale of personal data</option>' : 'No sale of personal data';
    const html = `<html lang="en"><main><h1>Privacy Policy</h1><h2>Data use</h2><div>Choose: <${wrapper}>${content}</${wrapper.split(' ')[0]}> to exercise your right.</div><h2>Contact</h2><p>${contract.terminalText}</p></main></html>`;
    expect(acquisition.assessCapture(acquisition.extractEngineBody(html, fixtureUrl), contract, fixtureUrl).reasons).toContain('interactive_document_content_unreviewed');
  });
  it('retains a verified disclosure label and its target without treating the control as unresolved UI', () => {
    const html = `<html lang="en"><main><h1>Privacy Policy</h1><h2>Data use</h2><button aria-expanded="false" aria-controls="disclosure">No sale of personal data</button><div id="disclosure" aria-hidden="true"><p>We do not sell account records.</p></div><h2>Contact</h2><p>${contract.terminalText}</p></main></html>`;
    const body = acquisition.extractEngineBody(html, fixtureUrl);
    expect(body.document.text).toContain('No sale of personal data');
    expect(acquisition.assessCapture(body, contract, fixtureUrl).eligible).toBe(true);
  });
  it.each(['policy-note', 'otnotice-content'])('does not narrow a resolved fragment to a nested %s container', className => {
    const html = `<html lang="en"><main><section id="scope"><h1>Privacy Policy</h1><h2>Data use</h2><p>We do not sell account records.</p><div class="${className}"><p>${'Identity verification applies to all requests. '.repeat(40)}</p></div><h2>Contact</h2><p>${contract.terminalText}</p></section><h2>Unrelated</h2><p>UNRELATED SECTION MUST BE EXCLUDED.</p></main></html>`;
    const sourceUrl = fixtureUrl + '#scope'; const body = acquisition.extractEngineBody(html, sourceUrl);
    expect(body.document.text).toContain('We do not sell account records.');
    expect(body.document.text).toContain(contract.terminalText);
    expect(body.document.text).not.toContain('UNRELATED SECTION');
    expect(acquisition.assessCapture(body, { ...contract, sourceUrl }, sourceUrl).eligible).toBe(true);
  });
  it('ignores script/style text in gates and titles without changing raw evidence or exclusion hashes', () => {
    const html = `<html lang="en"><main><h1><style>.fixture {color:red}</style>Privacy Policy</h1><aside><script>window.fixture = true;</script></aside><h2>Data use</h2><p>We respond to support questions within 30 days.</p><h2>Contact</h2><p>${contract.terminalText}</p></main></html>`;
    const body = acquisition.extractEngineBody(html, fixtureUrl);
    expect(body.html).toBe(html); expect(body.document.text).not.toContain('fixture');
    expect(body.document.text.split('# Privacy Policy')).toHaveLength(2);
    expect(acquisition.assessCapture(body, contract, fixtureUrl).eligible).toBe(true);
    const $ = load(html);
    const reviewed = parseSourceContract({ ...contract, reviewedExclusions: [{ selector: 'aside', htmlSha256: digest($.html($('aside'))), purpose: 'non_document_ui', reviewNote: 'Reviewed exact script-only interface container in this fixture.' }] });
    expect(acquisition.assessCapture(acquisition.extractEngineBody(html, fixtureUrl, undefined, reviewed), reviewed, fixtureUrl).eligible).toBe(true);
  });
  it.each(['<h2>Effective date: October 31, 2026</h2>', '<h1>Additional policy title</h1>'])('holds unresolved external document header content: %s', extra => {
    const html = `<html lang="en"><section><header><h1>Privacy Policy</h1>${extra}</header></section><main><h1>Privacy Policy</h1><h2>Data use</h2><p>We respond to support questions within 30 days.</p><h2>Contact</h2><p>${contract.terminalText}</p></main></html>`;
    expect(acquisition.assessCapture(acquisition.extractEngineBody(html, fixtureUrl), contract, fixtureUrl).eligible).toBe(false);
  });
  it('does not hold site chrome outside the document, and accepts an exact reviewed in-document exclusion', () => {
    const html = `<html lang="en"><main><h1>Privacy Policy</h1><h2>Data use</h2><p>We respond to support questions within 30 days.</p><aside id="ui">Related links</aside><h2>Contact</h2><p>${contract.terminalText}</p></main><footer>Site copyright</footer></html>`;
    const $ = load(html);
    const reviewed = parseSourceContract({ ...contract, reviewedExclusions: [{ selector: '#ui', htmlSha256: digest($.html($('#ui'))), purpose: 'non_document_ui', reviewNote: 'Reviewed these exact related navigation links as interface content.' }] });
    expect(acquisition.assessCapture(acquisition.extractEngineBody(html, fixtureUrl, undefined, reviewed), reviewed, fixtureUrl).eligible).toBe(true);
    expect(acquisition.assessCapture(acquisition.extractEngineBody(html.replace('Related links', 'New clause'), fixtureUrl, undefined, reviewed), reviewed, fixtureUrl).eligible).toBe(false);
  });
  it('requires resolved model identities and normalizes provider prefixes for verifier separation', () => {
    expect(validateModelPair(receipt, undefined)).toEqual(['verification_model_identity_missing']);
    expect(validateModelPair(receipt, { ...receipt, model: '   ' })).toEqual(['verification_model_identity_missing']);
    expect(validateModelPair(receipt, { ...receipt, model: `  models/${receipt.model.toUpperCase()}  ` })).toEqual(['verification_model_not_independent']);
    expect(validateModelPair(receipt, { ...receipt, model: 'independent-test-provider' })).toEqual([]);
  });
  it('retains a document header without importing the site banner', () => {
    const html = `<html lang="en"><header><h1>Site navigation</h1></header><main><article><header><h1>Privacy Policy</h1><nav>Document navigation links</nav></header><h2>Data use</h2><p>${'We retain records only for the documented purpose. '.repeat(4)}</p></article></main></html>`;
    const body = acquisition.extractEngineBody(html, fixtureUrl);
    expect(body.document.text).toContain('# Privacy Policy');
    expect(body.document.text).not.toContain('Site navigation');
    expect(body.document.text).not.toContain('Document navigation links');
    expect(body.extraction?.retainedDocumentHeaders).toBe(1);
    expect(body.html).toBe(html);
  });
  it('restores a unique semantic document title preceding the selected main content', () => {
    const html = `<html lang="it"><section><header><h1>Informativa sulla privacy</h1></header></section><main><h2>Introduzione</h2><p>${'Conserviamo i dati per le finalità indicate nel documento. '.repeat(4)}</p></main></html>`;
    const body = acquisition.extractEngineBody(html, fixtureUrl);
    expect(body.document.blocks[0].text).toBe('# Informativa sulla privacy');
    expect(body.extraction?.restoredTitleFromDom).toBe(true);
    expect(body.language).toBe('it');
  });
  it('retains explicitly controlled disclosure text but excludes unrelated hidden content', () => {
    const html = `<html lang="en"><nav><button aria-controls="menu" aria-expanded="false">Menu</button><div id="menu" aria-hidden="true"><p>Hidden site menu</p></div></nav><main><h1>Privacy Policy</h1><h2>Retention</h2><button aria-controls="retention" aria-expanded="false">Read retention</button><div id="retention" aria-hidden="true"><p>${'We retain account data for 30 days after account closure. '.repeat(4)}</p></div><div aria-hidden="true"><p>Unrelated hidden variant</p></div></main></html>`;
    const body = acquisition.extractEngineBody(html, fixtureUrl);
    expect(body.document.text).toContain('30 days after account closure');
    expect(body.document.text).not.toContain('Hidden site menu');
    expect(body.document.text).not.toContain('Unrelated hidden variant');
    expect(body.extraction?.retainedDisclosureIds).toEqual(['retention']);
  });
  it('does not expand ambiguous duplicate IDs or synthesize a heading from the HTML title', () => {
    const html = `<html lang="en"><head><title>Privacy Policy</title></head><main><h2>Data use</h2><p>${'Only visible verified document content should be compared. '.repeat(4)}</p><button aria-controls="duplicate" aria-expanded="false">More</button><div id="duplicate" aria-hidden="true"><p>Hidden A</p></div><div id="duplicate" aria-hidden="true"><p>Hidden B</p></div></main></html>`;
    const body = acquisition.extractEngineBody(html, fixtureUrl);
    expect(body.extraction?.retainedDisclosureIds).toEqual([]);
    expect(body.document.text).not.toContain('Hidden A');
    expect(body.document.text).not.toContain('Hidden B');
    expect(body.document.text).not.toContain('Privacy Policy');
  });
  it('holds unresolved hidden content and ambiguous controls even when the visible contract matches', () => {
    const visible = '<h1>Privacy Policy</h1><h2>Data use</h2><p>We respond to support questions within 30 days.</p><h2>Contact</h2><p>Contact the privacy team for information about this policy.</p>';
    const hidden = `<div id="extra" aria-hidden="true"><p>${'An additional binding clause is present here. '.repeat(4)}</p></div>`;
    for (const content of [
      `<main>${visible}${hidden}</main>`,
      `<div id="content">${visible}<button aria-controls="extra" aria-expanded="false">More</button>${hidden}</div>`,
      `<main>${visible}<button aria-controls="extra">More</button>${hidden}</main>`,
      `<main>${visible}<button aria-controls="extra" aria-expanded="false">More</button></main>${hidden}`,
    ]) {
      const body = acquisition.extractEngineBody(`<html lang="en">${content}</html>`, fixtureUrl);
      expect(assessDocument(body.document, contract, fixtureUrl, 'en').eligible).toBe(true);
      expect(acquisition.assessCapture(body, contract, fixtureUrl).eligible).toBe(false);
      expect(body.extraction?.issues?.length).toBeGreaterThan(0);
    }
  });
  it('supports semantic link disclosures and excludes known consent dialog chrome within main', () => {
    const html = `<html lang="en"><main><h1>Privacy Policy</h1><a aria-controls="details" aria-expanded="false">Details</a><div id="details" aria-hidden="true"><p>${'The policy retains records for thirty days. '.repeat(4)}</p></div><div role="dialog"><button aria-controls="cookies" aria-expanded="false">Consent</button><div id="cookies" aria-hidden="true"><p>${'Cookie user interface choice. '.repeat(10)}</p></div></div></main></html>`;
    const body = acquisition.extractEngineBody(html, fixtureUrl);
    expect(body.document.text).toContain('thirty days');
    expect(body.document.text).not.toContain('Cookie user interface');
    expect(body.extraction?.retainedDisclosureIds).toEqual(['details']);
    expect(body.extraction?.issues?.map(i => i.reason)).toEqual(['dialog_document_scope_unverified']);
  });
  it('flags unreviewed header metadata and never restores a bare brand h1', () => {
    const content = `<h2>Data use</h2><p>${'The legal document contains the binding policy terms. '.repeat(4)}</p>`;
    const body = acquisition.extractEngineBody(`<html lang="en"><article><header><h1>Privacy Policy</h1><p>Home > Legal > Privacy</p></header>${content}</article></html>`, fixtureUrl);
    expect(body.extraction?.issues?.map(i => i.reason)).toContain('document_header_metadata_unreviewed');
    const brand = acquisition.extractEngineBody(`<html lang="en"><h1>ACME</h1><main>${content}</main></html>`, fixtureUrl);
    expect(brand.document.text).not.toContain('ACME');
    expect(brand.extraction?.restoredTitleFromDom).toBe(false);
  });
  it.each(['We sell data.', 'Non vendiamo dati.', 'No.'])('holds short unresolved legal text inside the document: %s', clause => {
    const html = `<html lang="en"><main><h1>Privacy Policy</h1><h2>Data use</h2><p>We respond to support questions within 30 days.</p><div aria-hidden="true"><p>${clause}</p></div><h2>Contact</h2><p>${contract.terminalText}</p></main></html>`;
    const body = acquisition.extractEngineBody(html, fixtureUrl);
    expect(acquisition.assessCapture(body, contract, fixtureUrl).eligible).toBe(false);
    expect(body.extraction?.issues?.map(i => i.reason)).toContain('hidden_document_content_unresolved');
  });
  it('holds a short unreviewed dialog inside the legal document', () => {
    const html = `<html lang="en"><main><h1>Privacy Policy</h1><h2>Data use</h2><p>We respond to support questions within 30 days.</p><div role="dialog"><p>You waive class actions.</p></div><h2>Contact</h2><p>${contract.terminalText}</p></main></html>`;
    expect(acquisition.assessCapture(acquisition.extractEngineBody(html, fixtureUrl), contract, fixtureUrl).reasons).toContain('dialog_document_scope_unverified');
  });
  it('does not lose duplicate-ID ambiguity when the other ID is in removed chrome', () => {
    const html = `<html lang="en"><main><h1>Privacy Policy</h1><p>${'The visible policy is long enough for bounded extraction. '.repeat(4)}</p><button aria-controls="details" aria-expanded="false">Details</button><div id="details" aria-hidden="true"><p>Hidden clause</p></div></main><footer><div id="details">Duplicate target</div></footer></html>`;
    const body = acquisition.extractEngineBody(html, fixtureUrl);
    expect(body.extraction?.retainedDisclosureIds).toEqual([]);
    expect(body.extraction?.issues?.map(i => i.reason)).toContain('disclosure_target_ambiguous');
  });
  it('does not mark a hidden-content capture eligible or cacheable after all transports', async () => {
    const p = await seed('hidden');
    await run('hidden-acquisition');
    const fetch = await database.engineTask.findFirstOrThrow({ where: { kind: 'fetch' } });
    const input = JSON.parse(fetch.inputJson) as TaskInput;
    const html = `<html lang="en"><main><h1>Privacy Policy</h1><h2>Data use</h2><p>We respond to support questions within 30 days.</p><h2>Contact</h2><p>Contact the privacy team for information about this policy.</p><div aria-hidden="true"><p>${'An extra contractual clause was not extracted. '.repeat(4)}</p></div></main></html>`;
    const transport = vi.fn(async () => ({ ok: true, status: 200, finalUrl: p.url, html, error: '', validators: { etag: 'hidden-fixture' } }));
    const observation = await acquisition.acquire(input, transport);
    expect(transport).toHaveBeenCalledTimes(3);
    expect(observation.eligible).toBe(false);
    expect(observation.reasons).toContain('hidden_document_content_unresolved');
    expect(observation.artifactId).not.toBeNull();
    expect(observation.cache).toBeUndefined();
  });
  it('resolves only an exact reviewed non-document node and reopens review after any DOM change', () => {
    const ui = `<div id="ui" aria-hidden="true"><p>${'Interface text, not a policy provision. '.repeat(4)}</p></div>`;
    const html = `<html lang="en"><main><h1>Privacy Policy</h1><h2>Data use</h2><p>We respond to support questions within 30 days.</p><h2>Contact</h2><p>Contact the privacy team for information about this policy.</p>${ui}</main></html>`;
    const $ = load(html);
    const reviewed = parseSourceContract({ ...contract, reviewedExclusions: [{ selector: '#ui', htmlSha256: digest($.html($('#ui'))), purpose: 'non_document_ui', reviewNote: 'Reviewed exact non-document user-interface content.' }] });
    const body = acquisition.extractEngineBody(html, fixtureUrl, undefined, reviewed);
    expect(acquisition.assessCapture(body, reviewed, fixtureUrl).eligible).toBe(true);
    expect(body.document.text).not.toContain('Interface text');
    expect(body.html).toBe(html);
    expect(body.extraction?.appliedExclusions).toHaveLength(1);
    const changed = acquisition.extractEngineBody(html.replace('Interface text,', 'Modified interface text,'), fixtureUrl, undefined, reviewed);
    expect(acquisition.assessCapture(changed, reviewed, fixtureUrl).reasons).toContain('reviewed_exclusion_content_changed');
    const missing = acquisition.extractEngineBody(html.replace(ui, ''), fixtureUrl, undefined, reviewed);
    expect(acquisition.assessCapture(missing, reviewed, fixtureUrl).reasons).toContain('reviewed_exclusion_target_changed');
    expect(acquisition.assessCapture(acquisition.extractEngineBody(html, fixtureUrl), reviewed, fixtureUrl).reasons).toContain('reviewed_exclusion_context_mismatch');
  });
  it('refuses blanket exclusions, document containers and duplicated selector targets', () => {
    const html = `<html lang="en"><main><h1>Privacy Policy</h1><p>${'This is substantive document text which must not be waived. '.repeat(4)}</p><div class="ui">One</div><div class="ui">Two</div></main></html>`;
    const $ = load(html);
    expect(() => parseSourceContract({ ...contract, reviewedExclusions: [{ selector: '#ui', purpose: 'non_document_ui', reviewNote: 'Reviewed user interface metadata.' }] })).toThrow('invalid_reviewed_exclusion');
    for (const selector of ['main', '.ui']) {
      const reviewed = parseSourceContract({ ...contract, reviewedExclusions: [{ selector, htmlSha256: digest($.html($(selector).first())), purpose: 'non_document_ui', reviewNote: 'Synthetic attempted exclusion for the boundary test.' }] });
      const body = acquisition.extractEngineBody(html, fixtureUrl, undefined, reviewed);
      expect(body.extraction?.appliedExclusions).toEqual([]);
      expect(body.extraction?.issues?.some(i => i.reason.startsWith('reviewed_exclusion_'))).toBe(true);
      expect(body.document.text).toContain('substantive document text');
    }
  });
  it('requires explicit dialog-heading acknowledgement before excluding a complete reviewed UI dialog', () => {
    const html = `<html lang="en"><main><h1>Privacy Policy</h1><h2>Data use</h2><p>We respond to support questions within 30 days.</p><h2>Contact</h2><p>${contract.terminalText}</p><div id="consent" role="dialog"><h2>Cookie settings</h2><p>${'Interface controls for unrelated cookie preferences. '.repeat(4)}</p></div></main></html>`;
    const $ = load(html); const rule = { selector: '#consent', htmlSha256: digest($.html($('#consent'))), purpose: 'non_document_ui' as const, reviewNote: 'Reviewed this exact cookie-settings user-interface dialog.' };
    const base = parseSourceContract({ ...contract, reviewedExclusions: [rule] });
    expect(acquisition.extractEngineBody(html, fixtureUrl, undefined, base).extraction?.issues?.map(i => i.reason)).toContain('reviewed_exclusion_document_boundary');
    const reviewed = parseSourceContract({ ...contract, reviewedExclusions: [{ ...rule, dialogHeadings: ['Cookie settings'] }] });
    const body = acquisition.extractEngineBody(html, fixtureUrl, undefined, reviewed);
    expect(body.document.text).not.toContain('Cookie settings');
    expect(acquisition.assessCapture(body, reviewed, fixtureUrl).eligible).toBe(true);
    const mismatched = { ...reviewed, reviewedExclusions: [{ ...rule, dialogHeadings: ['Different heading'] }] };
    expect(acquisition.extractEngineBody(html, fixtureUrl, undefined, mismatched).extraction?.issues?.map(i => i.reason)).toContain('reviewed_exclusion_document_boundary');
  });
  it('does not inject an out-of-scope page title into a fragment-scoped document', () => {
    const html = `<html lang="en"><section><header><h1>All Policies</h1></header></section><main><section id="privacy"><h2>Privacy</h2><p>${'The scoped privacy section contains its own complete statement. '.repeat(4)}</p></section><section><h2>Other</h2><p>Unrelated terms.</p></section></main></html>`;
    const body = acquisition.extractEngineBody(html, `${fixtureUrl}#privacy`);
    expect(body.document.text).toContain('## Privacy');
    expect(body.document.text).not.toContain('All Policies');
    expect(body.document.text).not.toContain('Unrelated terms');
    expect(body.extraction?.restoredTitleFromDom).toBe(false);
  });
  it('rejects generic marketing despite policy keywords; rejects missing sections/language', () => {
    const marketing = structureDocument('# Privacy Course\n\nLearn privacy terms, personal data and rights. '.repeat(20));
    expect(assessDocument(marketing, contract, fixtureUrl, 'en').eligible).toBe(false);
    expect(assessDocument(structureDocument(oldText), contract, fixtureUrl, 'en').eligible).toBe(true);
    expect(assessDocument(structureDocument(oldText), contract, fixtureUrl).reasons).toContain('document_language_unverified');
    expect(assessDocument(structureDocument(oldText.replace('## Contact', '## Other')), contract, fixtureUrl, 'en').reasons).toContain('required_sections_missing');
    expect(() => parseSourceContract({ ...contract, minimumChars: 0 })).toThrow();
  });
  it('keeps short repeated table cells and exact UTF-16 offsets, including emoji', () => {
    const doc = structureDocument('# Privacy 🛡️\n\n| Use | Consent |\n| Ads | No |\n| AI | No |');
    expect(doc.blocks.filter(b => b.kind === 'table')).toHaveLength(3);
    for (const b of doc.blocks) expect(doc.text.slice(b.start, b.end)).toBe(b.text);
    expect(new Set(doc.blocks.map(b => b.id)).size).toBe(doc.blocks.length);
  });
  it('all-or-hold: invalid spans, missing deltas and verifier uncertainty block publication', () => {
    const input = { old: structureDocument(oldText), next: structureDocument(newText), deltas: compareDocuments(structureDocument(oldText), structureDocument(newText)).deltas };
    const claims = grounded(input);
    expect(validateClaims(claims, input).reasons).toEqual([]);
    claims.claims[0].evidence[0].quote = 'invented quote';
    expect(validateClaims(claims, input).reasons).toContain('claim_span_invalid');
    expect(validateClaims(claims, input).reasons).toContain('change_coverage_incomplete');
    expect(validateVerification({ verdicts: [{ claimId: 'c1', verdict: 'uncertain', reason: 'Ambiguous scope' }] }, grounded(input))).toEqual(['claim_uncertain']);
  });
  it('blocks the observed AWS date-role error', () => {
    const old = structureDocument('# Service Terms\n\nLast Updated: October 20, 2026');
    const next = structureDocument('# Service Terms\n\nLast Updated: October 29, 2026');
    const input = { old, next, deltas: compareDocuments(old, next).deltas };
    const claims = grounded(input); claims.claims[0].textEn = 'The new terms are effective October 29, 2026.';
    expect(validateClaims(claims, input).reasons).toContain('date_role_unsubstantiated');
  });
  it.each(['La legge applicabile è quella irlandese.', 'Il cliente ci manleva dalle pretese di terzi.', 'La giurisdizione esclusiva è irlandese.'])('routes sensitive Italian obligations to review despite a low model score: %s', clause => {
    const old = structureDocument('# Condizioni\n\nSi applicano le condizioni precedenti.');
    const next = structureDocument(`# Condizioni\n\n${clause}`);
    const input = { old, next, deltas: compareDocuments(old, next).deltas };
    const claims = grounded(input); claims.claims[0].impact = 1;
    expect(validateClaims(claims, input).highImpact).toBe(true);
  });
});

describe('V6 persistence, fencing and publication', () => {
  it('reconciles terminal runs left behind by a crash after the last task transaction', async () => {
    await seed();
    const interrupted = await run('crash-before-run-reconciliation', 'observe');
    await database.engineRun.update({ where: { id: interrupted.id }, data: { status: 'running' } });
    // Persisted state at the crash boundary: task commit succeeded, run commit did not.
    await database.engineTask.updateMany({ where: { runId: interrupted.id }, data: { status: 'failed', completedAt: new Date(), activePolicyId: null } });
    await store.recoverExpiredTasks();
    expect((await database.engineRun.findUniqueOrThrow({ where: { id: interrupted.id } })).status).toBe('completed_with_errors');
    expect(await store.claimTask()).toBeNull();
    expect(await database.policyChange.count()).toBe(0);
  });
  it('reconciles successful orphan runs but preserves active and cancelled runs', async () => {
    await seed(); const successful = await run('completed-before-crash', 'observe');
    await database.engineTask.updateMany({ where: { runId: successful.id }, data: { status: 'completed', activePolicyId: null } });
    const active = await run('still-active', 'observe');
    const cancelled = await database.engineRun.create({ data: { requestKey: 'already-cancelled', requestedBy: 'fixture', status: 'cancelled' } });
    await store.recoverExpiredTasks();
    expect((await database.engineRun.findUniqueOrThrow({ where: { id: successful.id } })).status).toBe('completed');
    expect((await database.engineRun.findUniqueOrThrow({ where: { id: active.id } })).status).toBe('queued');
    expect((await database.engineRun.findUniqueOrThrow({ where: { id: cancelled.id } })).status).toBe('cancelled');
  });
  it('persists removed-content uncertainty as a hard review gate before baseline, models or notifications', async () => {
    const policy = await seed();
    const html = `<html lang="en"><main><h1>Privacy Policy</h1><h2>Data use</h2><p>We respond to support questions within 60 days.</p><aside>Except that account records may be sold.</aside><h2>Contact</h2><p>${contract.terminalText}</p></main></html>`;
    const transport = vi.fn<import('../engine/acquisition').Transport>(async () => ({ ok: true, html, status: 200, finalUrl: fixtureUrl, error: '', validators: { etag: 'uncertain-v1' } }));
    await run('removed-content-review'); await drain({ acquire: input => acquisition.acquire(input, transport) });
    expect(transport).toHaveBeenCalledTimes(3);
    expect(analysis.analyze).not.toHaveBeenCalled(); expect(analysis.verify).not.toHaveBeenCalled();
    expect(await database.policyChange.count()).toBe(0); expect(await database.engineOutbox.count()).toBe(0);
    expect(await database.engineHttpCache.count()).toBe(0);
    expect((await database.policy.findUniqueOrThrow({ where: { id: policy.id } })).currentHash).toBe(digest(oldText));
    const review = await database.engineReview.findFirstOrThrow({ where: { policyId: policy.id, status: 'pending' } });
    expect(JSON.parse(review.reasonsJson)).toContain('removed_document_content_unreviewed');
    await expect(pipeline.approveReview(review.id, 'Human approval must not waive omitted unreviewed source text.', 'fixture-admin')).rejects.toThrow('review_hard_gate_unresolved');
  });
  it('holds a change when the verifier resolves to the same model as the analyst', async () => {
    const policy = await seed();
    const provider = { ...analysis, verify: async (input: AnalysisInput, claims: ClaimSet) => {
      const verified = await analysis.verify(input, claims);
      return { ...verified, receipt: { ...verified.receipt, model: `models/${receipt.model}` } };
    } };
    await run('same-model-first'); await drain({ analysis: provider });
    await readySecond(policy.id); await run('same-model-second'); await drain({ analysis: provider });
    expect(await database.policyChange.count()).toBe(0);
    expect(await database.engineOutbox.count()).toBe(0);
    const review = await database.engineReview.findFirstOrThrow({ where: { policyId: policy.id, status: 'pending' } });
    expect(JSON.parse(review.reasonsJson)).toContain('verification_model_not_independent');
    await expect(pipeline.approveReview(review.id, 'Human review cannot waive the missing independent model.', 'fixture-admin')).rejects.toThrow('review_hard_gate_unresolved');
  });
  it('deduplicates shared fetches and idempotency keys', async () => {
    await seed('a'); await seed('b');
    const first = await run('same-request'); const second = await run('same-request');
    expect(second.id).toBe(first.id);
    expect(await database.engineTask.count({ where: { kind: 'fetch' } })).toBe(1);
    expect(await database.engineTask.count({ where: { kind: 'policy' } })).toBe(2);
    const competing = await run('different-request');
    expect(competing.selected).toBe(0);
    expect(await database.engineTask.count({ where: { kind: 'policy' } })).toBe(2);
  });
  it('does not starve an eligible origin behind forty throttled fetches', async () => {
    const p = await seed();
    await database.policy.createMany({ data: Array.from({ length: 42 }, (_, i) => ({ companyId: p.companyId, name: `A${i}`, type: `a${i}`,
      url: `https://example.com/p${i}`, currentText: oldText, currentHash: digest(oldText), lastCheckDate: new Date(0) })) });
    await seed('other', 'https://example.org/privacy'); await run('origin-fairness');
    await database.engineOrigin.create({ data: { origin: 'https://example.com', nextAllowedAt: new Date(Date.now() + 120000) } });
    const claimed = await store.claimTask();
    expect(JSON.parse(claimed!.inputJson).origin).toBe('https://example.org');
  });
  it('rejects late completion after another client reclaims the expired lease', async () => {
    await seed(); await run('lease-test');
    const first = await store.claimTask(); expect(first).not.toBeNull();
    await otherClient.engineTask.update({ where: { id: first!.id }, data: { leaseExpiresAt: new Date(0) } });
    await otherClient.engineOrigin.updateMany({ data: { leaseExpiresAt: new Date(0) } });
    const second = await store.claimTask(); expect(second?.id).toBe(first!.id);
    expect(second!.leaseToken).not.toBe(first!.leaseToken);
    await expect(store.fenced(first!, tx => store.finishTask(tx, first!, { illegal: true }))).rejects.toThrow('engine_lease_lost');
    expect((await database.engineTask.findUniqueOrThrow({ where: { id: first!.id } })).leaseToken).toBe(second!.leaseToken);
  });
  it('rolls back writes if expiry occurs inside the transaction', async () => {
    const p = await seed(); await run('lease-mid-transaction'); const lease = await store.claimTask();
    await database.engineTask.update({ where: { id: lease!.id }, data: { leaseExpiresAt: new Date(Date.now() + 100) } });
    await expect(store.fenced(lease!, async tx => {
      await tx.policy.update({ where: { id: p.id }, data: { name: 'Must roll back' } });
      await new Promise(resolve => setTimeout(resolve, 150));
    })).rejects.toThrow('engine_lease_lost');
    expect((await database.policy.findUniqueOrThrow({ where: { id: p.id } })).name).toBe('Privacy Policy');
  });
  it('commits once after two independent captures, analysis and verification; queues notifications atomically', async () => {
    const p = await seed(); await run('first-observation'); await drain();
    expect(await database.policyChange.count()).toBe(0);
    await readySecond(p.id); await run('second-observation'); await drain();
    expect(await database.policyChange.count()).toBe(1);
    expect(await database.engineOutbox.count()).toBe(1);
    expect(await database.policySnapshot.count({ where: { policyId: p.id } })).toBe(2);
    expect((await database.policy.findUniqueOrThrow({ where: { id: p.id } })).currentHash).toBe(digest(newText));
    await drain(); expect(await database.policyChange.count()).toBe(1);
    expect(analysis.analyze).toHaveBeenCalledTimes(1); expect(analysis.verify).toHaveBeenCalledTimes(1);
  });
  it('persists the analysis checkpoint and retries verifier without re-fetch or re-analysis', async () => {
    const p = await seed(); await run('retry-first'); await drain(); await readySecond(p.id); await run('retry-second');
    const fetch = vi.fn(async () => capture()); let failed = false;
    const provider = { ...analysis, verify: vi.fn(async (input: AnalysisInput, claims: ClaimSet) => {
      if (!failed) { failed = true; throw new Error('fixture_verifier_timeout'); } return analysis.verify(input, claims);
    }) };
    await drain({ acquire: fetch, analysis: provider });
    const retry = await database.engineTask.findFirstOrThrow({ where: { stage: 'verify', status: 'queued' } });
    expect(retry.checkpointJson).toContain('synthetic-test-provider');
    await database.engineTask.update({ where: { id: retry.id }, data: { nextAttemptAt: new Date(0) } });
    await drain({ acquire: fetch, analysis: provider });
    expect(fetch).toHaveBeenCalledTimes(1); expect(analysis.analyze).toHaveBeenCalledTimes(1);
    expect(provider.verify).toHaveBeenCalledTimes(2); expect(await database.policyChange.count()).toBe(1);
  });
  it('never uses 304 as the second independent capture', async () => {
    const p = await seed(); await run('304-first'); await drain(); await readySecond(p.id); await run('304-second');
    await drain({ acquire: async () => capture(newText, true) });
    expect(await database.policyChange.count()).toBe(0);
    expect((await database.engineReview.findFirstOrThrow()).reasonsJson).toContain('conditional_response_cannot_confirm_change');
  });
  it('does not publish observed changes', async () => {
    const p = await seed(); await run('observe-first', 'observe'); await drain(); await readySecond(p.id, 'observe'); await run('observe-second', 'observe'); await drain();
    expect(await database.policyChange.count()).toBe(0); expect(await database.engineOutbox.count()).toBe(0);
    expect((await database.policy.findUniqueOrThrow({ where: { id: p.id } })).currentHash).toBe(digest(oldText));
    expect((await database.policy.findUniqueOrThrow({ where: { id: p.id } })).lastCheckDate.getTime()).toBe(0);
  });
  it('keeps high impact private until a recorded, evidence-valid approval', async () => {
    const p = await seed(); await run('impact-first'); await drain(); await readySecond(p.id); await run('impact-second');
    await drain({ analysis: { ...analysis, analyze: async input => { const value = grounded(input); value.claims[0].impact = 8; return { value, receipt }; } } });
    expect(await database.policyChange.count()).toBe(0);
    const review = await database.engineReview.findFirstOrThrow();
    const changeId = await pipeline.approveReview(review.id, 'Reviewed exact before and after clauses and their impact.', 'fixture-admin');
    expect(changeId).toBeTruthy(); expect(await database.policyChange.count()).toBe(1);
    expect(await pipeline.approveReview(review.id, 'Reviewed exact before and after clauses and their impact.', 'fixture-admin')).toBe(changeId);
    expect(await database.policyChange.count()).toBe(1);
  });
  it('holds baseline gaps; human approval cannot waive missing evidence', async () => {
    const p = await seed(); await database.extractionBaseline.delete({ where: { policyId: p.id } });
    await run('gap-run-test'); await drain(); const review = await database.engineReview.findFirstOrThrow();
    expect(review.reasonsJson).toContain('extraction_baseline_missing');
    await expect(pipeline.approveReview(review.id, 'I would like to approve this missing evidence.', 'fixture-admin')).rejects.toThrow('review_hard_gate_unresolved');
    expect(await database.policyChange.count()).toBe(0);
  });
  it('detects immutable artifact corruption', async () => {
    const id = await store.putArtifact({ content: 'fixture' });
    await database.engineArtifact.update({ where: { id }, data: { bodyJson: '{"content":"changed"}' } });
    await expect(store.readArtifact(id)).rejects.toThrow('artifact_integrity_failure');
  });
  it('plans a full 500-policy daily batch without requiring 500 network fetches', async () => {
    const p = await seed();
    await database.policy.createMany({ data: Array.from({ length: 499 }, (_, i) => ({ companyId: p.companyId, name: `Fixture ${i}`, type: `fixture-${i}`,
      url: fixtureUrl, currentText: oldText, currentHash: digest(oldText), lastCheckDate: new Date(0) })) });
    const planned = await run('scale-500'); expect(planned.selected).toBe(500);
    expect(await database.engineTask.count({ where: { kind: 'policy' } })).toBe(500);
    // One contracted source representation and one representation with no contract.
    expect(await database.engineTask.count({ where: { kind: 'fetch' } })).toBe(2);
  });
  it('fences a policy mutation made after analysis but before commit', async () => {
    const p = await seed(); await run('context-first'); await drain(); await readySecond(p.id); await run('context-second');
    const provider = { ...analysis, verify: async (input: AnalysisInput, claims: ClaimSet) => {
      await database.policy.update({ where: { id: p.id }, data: { jurisdiction: 'EU' } });
      return analysis.verify(input, claims);
    } };
    await drain({ analysis: provider });
    expect(await database.policyChange.count()).toBe(0); expect(await database.engineOutbox.count()).toBe(0);
    expect((await database.engineTask.findFirstOrThrow({ where: { stage: 'commit' } })).lastError).toBe('engine_context_changed');
  });
  it('retries one recipient without re-sending acknowledged recipients', async () => {
    const p = await seed(); await run('mail-first'); await drain(); await readySecond(p.id); await run('mail-second'); await drain();
    await database.subscriber.create({ data: { email: 'fixture@example.test', regions: 'Global', industries: 'Technology', frequency: 'INSTANT', isActive: true, confirmedAt: new Date() } });
    vi.stubEnv('POLICYWATCHER_ENGINE_NOTIFICATIONS', '1');
    const sender = vi.fn().mockResolvedValueOnce(false).mockResolvedValue(true);
    await outbox.outboxStep(sender); // atomic recipient fanout
    expect(await database.engineOutbox.count(), JSON.stringify(await database.engineOutbox.findMany())).toBe(2);
    await outbox.outboxStep(sender); // failed SMTP acknowledgment
    expect(sender).toHaveBeenCalledTimes(1);
    await database.engineOutbox.updateMany({ where: { status: 'pending' }, data: { nextAttemptAt: new Date(0) } });
    await outbox.outboxStep(sender); await outbox.outboxStep(sender);
    expect(sender).toHaveBeenCalledTimes(2);
    expect(sender.mock.calls[0][4]).toBe(sender.mock.calls[1][4]);
    expect(await database.engineOutbox.count({ where: { status: 'delivered' } })).toBe(2);
  });
  it('keeps candidate evidence during AI retries but records terminal failure and advances scheduling', async () => {
    const p = await seed(); await run('fail-first'); await drain(); await readySecond(p.id); await run('fail-second');
    const provider = { ...analysis, analyze: async () => { throw new Error('fixture_model_unavailable'); } };
    for (let i = 0; i < 3; i++) {
      await drain({ analysis: provider });
      await database.engineTask.updateMany({ where: { status: 'queued', stage: 'analyze' }, data: { nextAttemptAt: new Date(0) } });
    }
    const state = await database.enginePolicyState.findUniqueOrThrow({ where: store.stateKey(p.id, 'publish') });
    expect(state.candidateHash).toBe(digest(newText)); expect(state.nextDueAt.getTime()).toBeGreaterThan(Date.now());
    expect(await database.engineAttempt.count({ where: { stage: 'analyze', status: 'failed' } })).toBe(3);
    expect((await database.engineRun.findUniqueOrThrow({ where: { requestKey: 'fail-second' } })).status).toBe('completed_with_errors');
  });
});

describe('V6 representation cache and source fallback', () => {
  const html = `<html lang="en"><main><h1>Privacy Policy</h1><h2>Data use</h2><p>We respond to support questions within 30 days.</p><h2>Contact</h2><p>${contract.terminalText}</p></main></html>`;
  const makeInput = (): TaskInput => ({ mode: 'publish', sourceUrl: fixtureUrl, scopeHash: 'fixture', baselineHash: digest(oldText), profileHash: store.engineExtractionProfileHash(fixtureUrl),
    contractHash: digest(JSON.stringify(contract)), contract, forceFresh: false, origin: 'https://example.com' });
  it('timestamps each successful response after transport completion, including fallback', async () => {
    let receivedAt = 0;
    const transport = vi.fn<import('../engine/acquisition').Transport>(async (_url, source) => {
      await new Promise(resolve => setTimeout(resolve, 20)); receivedAt = Date.now();
      return { ok: source === 'http2', html: source === 'http2' ? html : '', status: source === 'http2' ? 200 : 500, finalUrl: fixtureUrl, error: '' };
    });
    const result = await acquisition.acquire(makeInput(), transport);
    expect(result.eligible).toBe(true); expect(result.source).toBe('http2');
    expect(Date.parse(result.observedAt)).toBeGreaterThanOrEqual(receivedAt);
  });
  it('retains an incomplete response timestamp when later transports fail', async () => {
    let receivedAt = 0, laterFailureAt = 0;
    const transport = vi.fn<import('../engine/acquisition').Transport>(async (_url, source) => {
      await new Promise(resolve => setTimeout(resolve, 20));
      if (source !== 'direct') { laterFailureAt = Date.now(); throw new Error('fixture_later_failure'); }
      receivedAt = Date.now();
      return { ok: true, html: html.replace('Privacy Policy', 'Other Policy'), status: 200, finalUrl: fixtureUrl, error: '' };
    });
    const result = await acquisition.acquire(makeInput(), transport);
    expect(result.eligible).toBe(false); expect(result.artifactId).not.toBeNull(); expect(result.source).toBe('direct');
    expect(Date.parse(result.observedAt)).toBeGreaterThanOrEqual(receivedAt);
    expect(Date.parse(result.observedAt)).toBeLessThan(laterFailureAt);
  });
  it('revalidates a complete cached representation with ETag and rejects reuse for pending candidates', async () => {
    const input = makeInput();
    const initial = vi.fn(async () => ({ ok: true, html, status: 200, finalUrl: fixtureUrl, error: '', validators: { etag: '"fixture-v1"' } }));
    const captured = await acquisition.acquire(input, initial);
    expect(captured.eligible).toBe(true); expect(await database.engineHttpCache.count()).toBe(0);
    await database.$transaction(tx => acquisition.saveRepresentation(tx, captured));
    const body = await store.readArtifact<CaptureBody>(captured.artifactId!); input.baselineHash = body.document.hash;
    expect(await database.engineHttpCache.count()).toBe(1);
    const next = vi.fn<import('../engine/acquisition').Transport>(async () => ({ ok: false, html: '', status: 304, finalUrl: fixtureUrl, error: '' }));
    const checked = await acquisition.acquire(input, next);
    expect(checked.notModified).toBe(true); expect(next.mock.calls[0][2]).toEqual({ etag: '"fixture-v1"', lastModified: undefined });
    const pending = await acquisition.acquire({ ...input, forceFresh: true }, next);
    expect(pending.eligible).toBe(false); expect(pending.notModified).toBe(false);
  });
  it('does not issue validators for a corrupt cached artifact or a Vary response', async () => {
    const input = makeInput();
    const initial = async () => ({ ok: true, html, status: 200, finalUrl: fixtureUrl, error: '', validators: { etag: '"v1"' } });
    const captured = await acquisition.acquire(input, initial);
    await database.$transaction(tx => acquisition.saveRepresentation(tx, captured));
    await database.engineArtifact.update({ where: { id: captured.artifactId! }, data: { bodyJson: '{}' } });
    const next = vi.fn<import('../engine/acquisition').Transport>(initial); await acquisition.acquire(input, next);
    expect(next.mock.calls[0][2]).toBeUndefined();
    expect(acquisition.cacheable({ ...await initial(), validators: { etag: '"v1"', vary: '*' } }, fixtureUrl)).toBe(false);
  });
  it('tries rendering when direct HTML passes legacy shape but fails the source contract', async () => {
    const transport = vi.fn(async (_url: string, source: string) => ({ ok: true,
      html: source === 'rendered' ? html : '<main><h1>Privacy courses</h1><p>' + 'Learn privacy policy terms and personal data. '.repeat(20) + '</p></main>',
      status: 200, finalUrl: fixtureUrl, error: '' }));
    const result = await acquisition.acquire(makeInput(), transport);
    expect(result.source).toBe('rendered'); expect(result.eligible).toBe(true); expect(transport).toHaveBeenCalledTimes(3);
  });
  it('stops on Retry-After and preserves origin cooldown', async () => {
    const transport = vi.fn(async () => ({ ok: false, html: '', status: 429, finalUrl: fixtureUrl, error: 'rate_limited', retryAfterMs: 120000 }));
    const result = await acquisition.acquire(makeInput(), transport);
    expect(transport).toHaveBeenCalledTimes(1); expect(result.retryAfterMs).toBe(120000);
    await seed(); await run('backoff-run'); await drain({ acquire: async () => result });
    expect((await database.engineOrigin.findUniqueOrThrow({ where: { origin: 'https://example.com' } })).nextAllowedAt.getTime()).toBeGreaterThan(Date.now() + 100000);
  });
  it('supports Italian evidence through reviewed identity instead of English keyword frequency', async () => {
    const itContract = { ...contract, titleAliases: ['Informativa sulla riservatezza'], requiredHeadings: ['Dati', 'Contatti'], language: 'it' as const,
      terminalText: 'Per ulteriori informazioni contattare il responsabile della protezione dei dati.' };
    const itHtml = `<html lang="it"><main><h1>Informativa sulla riservatezza</h1><h2>Dati</h2><p>Conserviamo i dati per trenta giorni.</p><h2>Contatti</h2><p>${itContract.terminalText}</p></main></html>`;
    const result = await acquisition.acquire({ ...makeInput(), contract: itContract }, async () => ({ ok: true, html: itHtml, status: 200, finalUrl: fixtureUrl, error: '' }));
    expect(result.eligible).toBe(true);
  });
});


describe('adjudicated Gemini and GLM review regressions', () => {
  it('separates headings, paragraphs, CRLF and asterisk lists without changing UTF-16 offsets', () => {
    const text = '# Privacy 🛡️\r\nParagraph first line\r\nwrapped line\r\n\r\n* No\r\n* No\r\n## GDPR\r\nFinal';
    const doc = structureDocument(text);
    expect(doc.blocks.map(b => b.kind)).toEqual(['heading', 'paragraph', 'list', 'list', 'heading', 'paragraph']);
    expect(doc.hash).toBe(digest(text));
    for (const block of doc.blocks) expect(text.slice(block.start, block.end)).toBe(block.text);
  });
  it('accepts short complete blocks and separate table header/row anchors', () => {
    const old = structureDocument('# A\n\n| Use | Consent |\n| Ads | No |\n| AI | No |');
    const next = structureDocument('# B\n\n| Use | Consent |\n| Ads | No |\n| AI | Yes |');
    const input = { old, next, deltas: compareDocuments(old, next).deltas };
    const value = grounded(input);
    for (const [side, doc] of [['old', old], ['new', next]] as const) {
      const header = doc.blocks[1]; value.claims[0].evidence.push({ side, documentHash: doc.hash, start: header.start, end: header.end, quote: header.text });
    }
    expect(validateClaims(value, input).reasons).toEqual([]);
  });
  it('retains full context only once in a large-document model request', () => {
    const old = structureDocument('# Policy\n\n' + Array.from({ length: 500 }, (_, i) => `Clause ${i}: ` + 'abc '.repeat(200)).join('\n\n'));
    const next = structureDocument(old.text.replace('Clause 250:', 'Clause 250 changed:'));
    const payload = modelEvidence({ old, next, deltas: compareDocuments(old, next).deltas });
    expect(JSON.stringify(payload).length).toBeLessThan(1_200_000);
    expect(payload.old.blocks.map(b => b.text)).toEqual(old.text.split('\n\n').map(text => text.trim()));
    expect(payload.deltas.every(d => 'blockId' in d && !('block' in d))).toBe(true);
  });
  it('skips network and preserves public state when a contract is missing; deduplicates configuration reviews', async () => {
    const p = await seed(); await database.engineSourceContract.delete({ where: { policyId: p.id } });
    const transport = vi.fn(async () => { throw new Error('must_not_fetch'); });
    for (const requestKey of ['no-contract-first', 'no-contract-second']) {
      await database.enginePolicyState.updateMany({ data: { nextDueAt: new Date(0) } });
      await database.engineOrigin.updateMany({ data: { nextAllowedAt: new Date(0) } });
      await run(requestKey); await drain({ acquire: input => acquisition.acquire(input, transport) });
    }
    expect(transport).not.toHaveBeenCalled(); expect(await database.engineReview.count()).toBe(1);
    const current = await database.policy.findUniqueOrThrow({ where: { id: p.id } });
    expect(current.dataStatus).toBe(p.dataStatus); expect(current.lastCheckDate.getTime()).toBe(0);
  });
  it('does not advance successful freshness while a changed candidate awaits confirmation', async () => {
    const p = await seed(); await run('available-pending'); await drain();
    const current = await database.policy.findUniqueOrThrow({ where: { id: p.id } });
    expect(current.dataStatus).toBe('Needs Review'); expect(current.lastSuccessfulCheckDate).toEqual(p.lastSuccessfulCheckDate);
    expect(current.currentHash).toBe(p.currentHash); expect(await database.policyChange.count()).toBe(0);
  });
  it('does not mutate a newer context from hold or terminal failure', async () => {
    const p = await seed(); await run('stale-hold');
    await drain({ acquire: async () => {
      await database.policy.update({ where: { id: p.id }, data: { jurisdiction: 'EU', dataStatus: 'Available' } });
      return { ...await capture(), eligible: false, reasons: ['required_sections_missing'] };
    } });
    const current = await database.policy.findUniqueOrThrow({ where: { id: p.id } });
    expect(current.dataStatus).toBe('Available'); expect(current.lastCheckDate.getTime()).toBe(0);
    expect(await database.engineReview.count()).toBe(0); expect(await database.policyCheckLog.count()).toBe(0);
    const task = await database.engineTask.findFirstOrThrow({ where: { kind: 'policy' } });
    expect(task.status).toBe('failed'); expect(task.attempt).toBe(1);
  });
  it('requires explicit approval of an extractor replay and publishes no provider-change event', async () => {
    const p = await seed();
    const html = `<html lang="en"><main><h1>Privacy Policy</h1><h2>Data use</h2><p>We respond to support questions within 30 days.</p><h2>Contact</h2><p>${contract.terminalText}</p></main></html>`;
    await database.extractionBaseline.update({ where: { policyId: p.id }, data: { profileHash: 'legacy-profile', input: html, inputHash: digest(html) } });
    await run('replay-review'); await drain();
    const review = await database.engineReview.findFirstOrThrow();
    expect(review.reasonsJson).toContain('parser_upgrade_requires_baseline_review');
    expect(await database.policySnapshot.count()).toBe(1);
    await pipeline.approveReview(review.id, 'Reviewed stored original HTML and every replayed section.', 'fixture-admin');
    expect(await database.policyChange.count()).toBe(0); expect(await database.engineOutbox.count()).toBe(0);
    expect((await database.extractionBaseline.findUniqueOrThrow({ where: { policyId: p.id } })).profileHash).toBe(store.engineExtractionProfileHash(fixtureUrl));
    expect((await database.engineReview.findUniqueOrThrow({ where: { id: review.id } })).status).toBe('approved');
  });
  it('requests two new baseline captures when reviewed UI cannot replay historical HTML', async () => {
    const p = await seed();
    const html = `<html lang="en"><main><h1>Privacy Policy</h1><h2>Data use</h2><p>We respond to support questions within 60 days.</p><h2>Contact</h2><p>${contract.terminalText}</p><div id="ui" aria-hidden="true"><p>${'Current interface metadata, outside the policy. '.repeat(4)}</p></div></main></html>`;
    const $ = load(html);
    const reviewed = parseSourceContract({ ...contract, reviewedExclusions: [{ selector: '#ui', htmlSha256: digest($.html($('#ui'))), purpose: 'non_document_ui', reviewNote: 'Reviewed the exact unrelated interface metadata.' }] });
    const contractJson = JSON.stringify(reviewed);
    await database.engineSourceContract.update({ where: { policyId: p.id }, data: { contractJson, contractHash: digest(contractJson) } });
    const oldHtml = html.replaceAll('Current interface', 'Historical interface').replace('60 days', '30 days');
    await database.extractionBaseline.update({ where: { policyId: p.id }, data: { profileHash: 'legacy-profile', input: oldHtml, inputHash: digest(oldHtml) } });
    const body = acquisition.extractEngineBody(html, fixtureUrl, undefined, reviewed);
    expect(acquisition.assessCapture(body, reviewed, fixtureUrl).eligible).toBe(true);
    const get = async (): Promise<Observation> => ({ artifactId: await store.putArtifact(body), observedAt: new Date().toISOString(), source: 'direct', httpStatus: 200,
      finalUrl: fixtureUrl, notModified: false, eligible: true, reasons: [], diagnostics: [] });
    await run('rebaseline-hold'); await drain({ acquire: get });
    const review = await database.engineReview.findFirstOrThrow();
    expect(review.reasonsJson).toBe(JSON.stringify(['parser_upgrade_rebaseline_required']));
    await expect(pipeline.approveReview(review.id, 'Cannot approve an incomplete historical replay.', 'fixture-admin')).rejects.toThrow('review_hard_gate_unresolved');
    const note = 'Reviewed the complete current source; retain history and request a newly confirmed baseline.';
    await pipeline.requestConfirmedRebaseline(review.id, note, 'fixture-admin');
    await pipeline.requestConfirmedRebaseline(review.id, note, 'fixture-admin');
    expect((await database.policy.findUniqueOrThrow({ where: { id: p.id } })).currentHash).toBe(p.currentHash);
    expect((await database.enginePolicyState.findUniqueOrThrow({ where: store.stateKey(p.id, 'publish') })).candidateHash).toBeNull();
    expect(await database.policySnapshot.count()).toBe(1);
    await database.engineOrigin.updateMany({ data: { nextAllowedAt: new Date(0) } });
    await run('rebaseline-fresh-one'); await drain({ acquire: get });
    expect(await database.policySnapshot.count()).toBe(1);
    await readySecond(p.id); await run('rebaseline-fresh-two'); await drain({ acquire: get });
    expect((await database.policy.findUniqueOrThrow({ where: { id: p.id } })).currentHash).toBe(body.document.hash);
    expect(await database.policySnapshot.count()).toBe(2);
    expect(await database.policyChange.count()).toBe(0); expect(await database.engineOutbox.count()).toBe(0);
    expect(analysis.analyze).not.toHaveBeenCalled();
    expect((await database.engineReview.findUniqueOrThrow({ where: { id: review.id } })).reviewNote).toBe(note);
  });
  it('refreshes stale evidence without deleting the previous review capture', async () => {
    const p = await seed(); await run('refresh-first'); await drain(); await readySecond(p.id); await run('refresh-second');
    const provider = { ...analysis, analyze: async (input: AnalysisInput) => { const value = grounded(input); value.claims[0].impact = 8; return { value, receipt }; } };
    await drain({ analysis: provider });
    const review = await database.engineReview.findFirstOrThrow(); const originalTask = await database.engineTask.findUniqueOrThrow({ where: { id: review.taskId } });
    const payload = JSON.parse(review.payloadJson); payload.checkpoint.observation.observedAt = new Date(Date.now() - 3 * store.DAILY_MS).toISOString();
    await database.engineReview.update({ where: { id: review.id }, data: { payloadJson: JSON.stringify(payload) } });
    await expect(pipeline.approveReview(review.id, 'Review delayed; older evidence must be refreshed.', 'fixture-admin')).rejects.toThrow('review_hard_gate_unresolved');
    await pipeline.closeReview(review.id, 'refresh', 'Obtain fresh source evidence before deciding.', 'fixture-admin');
    await database.engineOrigin.updateMany({ data: { nextAllowedAt: new Date(0) } });
    await run('refresh-third'); await drain({ analysis: provider }); await readySecond(p.id); await run('refresh-fourth'); await drain({ analysis: provider });
    const refreshed = await database.engineReview.findFirstOrThrow({ where: { policyId: p.id, status: 'pending' } });
    expect((await database.engineReview.findUniqueOrThrow({ where: { id: review.id } })).reviewNote).toBe('Obtain fresh source evidence before deciding.');
    expect(refreshed.status).toBe('pending'); expect(refreshed.taskId).not.toBe(review.taskId);
    expect((await database.engineTask.findUniqueOrThrow({ where: { id: review.taskId } })).checkpointJson).toBe(originalTask.checkpointJson);
    await pipeline.approveReview(refreshed.id, 'Fresh independent captures and impact verified.', 'fixture-admin');
    expect(await database.policyChange.count()).toBe(1);
  });
  it('retries transient acquisition without losing the pending candidate', async () => {
    const p = await seed(); await run('outage-first'); await drain(); await readySecond(p.id); await run('outage-second');
    const fetch = vi.fn(async () => ({ ...await capture(), artifactId: null, eligible: false, reasons: ['origin_backoff'], httpStatus: 429, retryAfterMs: 120000 }));
    await drain({ acquire: fetch });
    expect(await database.engineTask.count({ where: { kind: 'policy', status: 'blocked' } })).toBe(1);
    for (let i = 0; i < 2; i++) {
      await database.engineTask.updateMany({ where: { kind: 'fetch', status: 'queued' }, data: { nextAttemptAt: new Date(0) } });
      await database.engineOrigin.updateMany({ data: { nextAllowedAt: new Date(0) } }); await drain({ acquire: fetch });
    }
    expect(fetch).toHaveBeenCalledTimes(3);
    expect((await database.enginePolicyState.findUniqueOrThrow({ where: store.stateKey(p.id, 'publish') })).candidateHash).toBe(digest(newText));
  });
  it('does not deliver to unconfirmed subscribers and terminates the expired fifth outbox attempt', async () => {
    const p = await seed(); await run('consent-first'); await drain(); await readySecond(p.id); await run('consent-second'); await drain();
    await database.subscriber.create({ data: { email: 'unconfirmed@example.test', regions: 'Global', industries: 'Technology', frequency: 'INSTANT', isActive: true } });
    vi.stubEnv('POLICYWATCHER_ENGINE_NOTIFICATIONS', '1'); const sender = vi.fn().mockResolvedValue(true);
    await outbox.outboxStep(sender); await outbox.outboxStep(sender);
    expect(sender).not.toHaveBeenCalled(); expect(await database.engineOutbox.count()).toBe(1);
    await database.engineOutbox.updateMany({ data: { status: 'sending', attempt: 5, leaseToken: 'expired', leaseExpiresAt: new Date(0) } });
    await outbox.outboxStep(sender);
    expect((await database.engineOutbox.findFirstOrThrow()).status).toBe('failed');
  });
  it('requires two fresh observations for an explicit source migration even when the text hash is identical', async () => {
    const p = await seed(); await database.policy.update({ where: { id: p.id }, data: { sourceMigrationPending: true } });
    await run('migration-same-first'); await drain({ acquire: async () => capture(oldText) });
    expect((await database.policy.findUniqueOrThrow({ where: { id: p.id } })).sourceMigrationPending).toBe(true);
    await readySecond(p.id); await run('migration-same-second'); await drain({ acquire: async () => capture(oldText) });
    expect((await database.policy.findUniqueOrThrow({ where: { id: p.id } })).sourceMigrationPending).toBe(false);
    expect(await database.policyChange.count()).toBe(0);
  });
  it('does not process queued publication runs while the publication switch is off', async () => {
    await seed(); await run('disabled-publication'); vi.stubEnv('POLICYWATCHER_ENGINE_PUBLICATION', '0');
    expect(await store.claimTask()).toBeNull(); expect(await database.policyChange.count()).toBe(0);
  });
});


describe('final review isolation and history regressions', () => {
  it('keeps observation scheduling and candidates separate from publication state', async () => {
    const p = await seed(); await run('isolation-observe', 'observe'); await drain();
    expect(await database.enginePolicyState.findUnique({ where: store.stateKey(p.id, 'publish') })).toBeNull();
    const publish = await run('isolation-publish'); expect(publish.selected).toBe(1);
    await database.engineOrigin.updateMany({ data: { nextAllowedAt: new Date(0) } }); await drain();
    const state = await database.enginePolicyState.findUniqueOrThrow({ where: store.stateKey(p.id, 'publish') });
    await readySecond(p.id, 'observe'); await run('isolation-observe-unchanged', 'observe');
    await drain({ acquire: async () => capture(oldText) });
    expect(await database.enginePolicyState.findUniqueOrThrow({ where: store.stateKey(p.id, 'publish') })).toEqual(state);
    expect(await database.engineHttpCache.count()).toBe(0);
  });
  it('labels observe-only findings without adding an approvable production review', async () => {
    const p = await seed(); await run('observed-impact-first', 'observe'); await drain(); await readySecond(p.id, 'observe'); await run('observed-impact-second', 'observe');
    await drain({ analysis: { ...analysis, analyze: async input => { const value = grounded(input); value.claims[0].impact = 8; return { value, receipt }; } } });
    const review = await database.engineReview.findFirstOrThrow();
    expect(review.mode).toBe('observe'); expect(review.status).toBe('observed');
    await expect(pipeline.approveReview(review.id, 'Do not allow an observation-only run to publish.', 'fixture')).rejects.toThrow('review_not_pending');
    expect((await run('publish-after-observation')).selected).toBe(1);
  });
  it('keeps old review payloads immutable and only the newest dynamic capture pending', async () => {
    const p = await seed(); await database.extractionBaseline.delete({ where: { policyId: p.id } });
    await run('dynamic-first'); await drain(); const oldReview = await database.engineReview.findFirstOrThrow();
    await database.enginePolicyState.update({ where: store.stateKey(p.id, 'publish'), data: { nextDueAt: new Date(0) } });
    await database.engineOrigin.updateMany({ data: { nextAllowedAt: new Date(0) } }); await run('dynamic-second');
    await drain({ acquire: async () => {
      const result = await capture(); const body = await store.readArtifact<CaptureBody>(result.artifactId!);
      result.artifactId = await store.putArtifact({ ...body, html: body.html + '<!-- different dynamic nonce -->' }); return result;
    } });
    expect(await database.engineReview.count({ where: { status: 'pending' } })).toBe(1);
    const history = await database.engineReview.findUniqueOrThrow({ where: { id: oldReview.id } });
    expect(history.status).toBe('superseded'); expect(history.payloadJson).toBe(oldReview.payloadJson);
  });
  it('supersedes an obsolete review after a fresh unchanged capture', async () => {
    const p = await seed(); await database.extractionBaseline.delete({ where: { policyId: p.id } });
    await run('obsolete-first'); await drain();
    await database.enginePolicyState.update({ where: store.stateKey(p.id, 'publish'), data: { nextDueAt: new Date(0) } });
    await database.engineOrigin.updateMany({ data: { nextAllowedAt: new Date(0) } }); await run('obsolete-second'); await drain({ acquire: async () => capture(oldText) });
    expect(await database.engineReview.count({ where: { status: 'pending' } })).toBe(0);
    expect((await database.policy.findUniqueOrThrow({ where: { id: p.id } })).dataStatus).toBe('Available');
  });
  it('uses the header of the changed table, without crossing a blank-line table boundary', () => {
    const old = structureDocument('| First | Value |\n| Other | No |\n\n| Purpose | Consent |\n| AI | No |');
    const next = structureDocument(old.text.replace('| AI | No |', '| AI | Yes |'));
    const input = { old, next, deltas: compareDocuments(old, next).deltas }; const claims = grounded(input);
    for (const [side, doc] of [['old', old], ['new', next]] as const) {
      const header = doc.blocks[2]; claims.claims[0].evidence.push({ side, documentHash: doc.hash, start: header.start, end: header.end, quote: header.text });
    }
    expect(validateClaims(claims, input).reasons).toEqual([]);
  });
});


describe('operational release regressions', () => {
  it('cancels a paused publication run, fences the old worker, and frees policies for observation', async () => {
    await seed(); const runToCancel = await run('cancel-active-run'); const lease = await store.claimTask();
    vi.stubEnv('POLICYWATCHER_ENGINE_PUBLICATION', '0');
    expect((await run('blocked-observe', 'observe')).selected).toBe(0);
    await store.cancelRun(runToCancel.id, 'Stop remaining publication work and observe sources.', 'fixture-admin');
    expect((await run('unblocked-observe', 'observe')).selected).toBe(1);
    await expect(store.fenced(lease!, tx => store.finishTask(tx, lease!, { stale: true }))).rejects.toThrow('engine_lease_lost');
    expect((await database.engineRun.findUniqueOrThrow({ where: { id: runToCancel.id } })).status).toBe('cancelled');
  });
  it('approves a confirmed formatting baseline without announcing a provider change', async () => {
    const p = await seed(); const formatting = oldText.replace('## Data use', '### Data use');
    await run('formatting-first'); await drain({ acquire: async () => capture(formatting) });
    await readySecond(p.id); await run('formatting-second'); await drain({ acquire: async () => capture(formatting) });
    const review = await database.engineReview.findFirstOrThrow({ where: { status: 'pending' } });
    expect(review.reasonsJson).toContain('formatting_requires_baseline_review');
    await pipeline.approveReview(review.id, 'Reviewed identical clauses and the changed heading markup.', 'fixture-admin');
    const current = await database.policy.findUniqueOrThrow({ where: { id: p.id } });
    expect(current.currentHash).toBe(digest(formatting)); expect(current.dataStatus).toBe('Available');
    expect(await database.policyChange.count()).toBe(0); expect(await database.engineOutbox.count()).toBe(0);
  });
});

describe('claim ledger', () => {
  it.each(['supported', 'unsupported', 'uncertain', 'missing', 'same-model'] as const)('O2 observe/silent persists %s evidence without public effects (injected providers)', async verdict => {
    vi.stubEnv('POLICYWATCHER_ENGINE_PUBLICATION', '0');
    vi.stubEnv('POLICYWATCHER_ENGINE_NOTIFICATIONS', '0');
    const p = await seed();
    const before = await database.policy.findUniqueOrThrow({ where: { id: p.id } });
    const provider: AnalysisProvider = { ...analysis, verify: async (_input, claims) => ({
      value: { verdicts: verdict === 'missing' ? [] : claims.claims.map(c => ({ claimId: c.id,
        verdict: verdict === 'same-model' ? 'supported' : verdict,
        reason: 'Authored control outcome, not live semantic verification.' })) },
      receipt: { ...receipt, model: verdict === 'same-model' ? receipt.model : 'independent-test-provider' },
    }) };
    for (const index of [1, 2]) {
      await store.enqueueRun({ requestKey: `o2-${verdict}-${index}`, mode: 'observe', requestedBy: 'fixture-admin', notificationMode: 'silent' });
      await drain({ analysis: provider });
      // Test clock manipulation is synthetic control-flow evidence, never a live confirmation window.
      if (index === 1) await readySecond(p.id, 'observe');
    }
    const rows = await database.engineClaim.findMany({ include: { evidence: true } });
    expect(rows).toHaveLength(1);
    expect(rows[0].changeId).toBeNull(); expect(rows[0].approvedBy).toBeNull();
    expect(rows[0].verifierVerdict).toBe(verdict === 'missing' ? null : verdict === 'same-model' ? 'supported' : verdict);
    expect(rows[0].evidence).toHaveLength(2);
    for (const span of rows[0].evidence) {
      const doc = structureDocument(span.side === 'old' ? oldText : newText);
      expect(doc.text.slice(span.startOffset, span.endOffset)).toBe(span.quote);
      expect(span.documentHash).toBe(doc.hash);
    }
    if (verdict !== 'supported') {
      const review = await database.engineReview.findUniqueOrThrow({ where: { id: rows[0].reviewId! } });
      expect(review.mode).toBe('observe'); expect(review.status).toBe('observed');
      expect(review.reasonsJson).toContain(verdict === 'missing' ? 'verification_incomplete' : verdict === 'same-model' ? 'verification_model_not_independent' : `claim_${verdict}`);
    }
    expect(await database.policy.findUniqueOrThrow({ where: { id: p.id } })).toEqual(before);
    expect(await database.policyChange.count()).toBe(0);
    expect(await database.engineOutbox.count()).toBe(0);
  });
  const unsupported: AnalysisProvider = { ...analysis, verify: vi.fn(async (_input: AnalysisInput, claims: ClaimSet) => ({
    value: { verdicts: claims.claims.map(c => ({ claimId: c.id, verdict: 'unsupported' as const, reason: 'Quote is exact but does not entail the stated period.' })) },
    receipt: { ...receipt, model: 'independent-test-provider' } })) };
  async function twoCaptures(prefix: string, dependencies: Partial<import('../engine/pipeline').EngineDependencies> = {}) {
    const p = await seed(); await run(`${prefix}-first`); await drain(dependencies); await readySecond(p.id); await run(`${prefix}-second`); await drain(dependencies);
    return p;
  }
  it('records observed spans and an inferred interpretation for an automatic publication', async () => {
    const p = await twoCaptures('ledger-auto');
    const change = await database.policyChange.findFirstOrThrow();
    const rows = await database.engineClaim.findMany({ include: { evidence: true } });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ policyId: p.id, changeId: change.id, claimKey: 'c1', interpretationStatus: 'inferred', approvedBy: null,
      verifierVerdict: 'supported', analystModel: 'synthetic-test-provider', verifierModel: 'independent-test-provider' });
    const old = structureDocument(oldText), next = structureDocument(newText);
    for (const span of rows[0].evidence) {
      const doc = span.side === 'old' ? old : next;
      expect(span.status).toBe('observed'); expect(span.documentHash).toBe(doc.hash);
      expect(doc.text.slice(span.startOffset, span.endOffset)).toBe(span.quote); expect(span.quoteHash).toBe(digest(span.quote));
    }
    expect(JSON.parse(change.analysisEvidenceJson!).claims.claims[0].id).toBe('c1');
  });
  it('keeps an unsupported interpretation queryable beside its verbatim passage without publishing', async () => {
    await twoCaptures('ledger-unsupported', { analysis: unsupported });
    expect(await database.policyChange.count()).toBe(0);
    const review = await database.engineReview.findFirstOrThrow({ where: { status: 'pending' } });
    expect(review.reasonsJson).toContain('claim_unsupported');
    const { listClaimLedger } = await import('../engine/claimLedger');
    const { items: rows, nextCursor } = await listClaimLedger({ verdict: 'unsupported' });
    expect(rows).toHaveLength(1); expect(nextCursor).toBeNull();
    expect(rows[0]).toMatchObject({ reviewId: review.id, changeId: null, interpretationStatus: 'inferred' });
    expect(rows[0].evidence.map(e => e.quote)).toEqual(expect.arrayContaining(['We respond to support questions within 30 days.', 'We respond to support questions within 60 days.']));
    expect((await listClaimLedger({ verdict: 'supported' })).items).toHaveLength(0);
    await expect(pipeline.approveReview(review.id, 'Approval cannot waive an unsupported interpretation.', 'fixture-admin')).rejects.toThrow('review_hard_gate_unresolved');
    expect((await database.engineClaim.findFirstOrThrow()).interpretationStatus).toBe('inferred');
  });
  it('marks a high-impact interpretation approved only by the named reviewer, once', async () => {
    await twoCaptures('ledger-impact', { analysis: { ...analysis, analyze: async input => { const value = grounded(input); value.claims[0].impact = 8; return { value, receipt }; } } });
    const review = await database.engineReview.findFirstOrThrow({ where: { status: 'pending' } });
    expect(await database.engineClaim.findFirstOrThrow()).toMatchObject({ reviewId: review.id, interpretationStatus: 'inferred', changeId: null });
    const changeId = await pipeline.approveReview(review.id, 'Reviewed exact before and after clauses and their impact.', 'fixture-admin');
    const rows = await database.engineClaim.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ reviewId: review.id, changeId, interpretationStatus: 'approved', approvedBy: 'fixture-admin' });
    expect(await database.engineClaimEvidence.count()).toBe(2);
  });
  it('never records claims whose spans failed validation', async () => {
    await twoCaptures('ledger-invalid', { analysis: { ...analysis, analyze: async input => { const value = grounded(input); value.claims[0].evidence[0].quote = 'invented quote'; return { value, receipt }; } } });
    expect((await database.engineReview.findFirstOrThrow()).reasonsJson).toContain('claim_span_invalid');
    expect(await database.engineClaim.count()).toBe(0); expect(await database.engineClaimEvidence.count()).toBe(0);
  });
  it('records successful observe-mode claims privately, once, without public effects', async () => {
    const p = await seed(); await run('ledger-observe-first', 'observe'); await drain();
    await readySecond(p.id, 'observe'); await run('ledger-observe-second', 'observe'); await drain();
    const task = await database.engineTask.findFirstOrThrow({ where: { stage: 'commit', status: 'completed' } });
    expect(JSON.parse(task.resultJson!).outcome).toBe('observed_change_ready');
    const rows = await database.engineClaim.findMany({ include: { evidence: true } });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ taskId: task.id, policyId: p.id, changeId: null, reviewId: null, verifierVerdict: 'supported', interpretationStatus: 'inferred' });
    expect(rows[0].evidence).toHaveLength(2);
    expect(await database.policyChange.count()).toBe(0); expect(await database.engineOutbox.count()).toBe(0);
    expect((await database.policy.findUniqueOrThrow({ where: { id: p.id } })).currentHash).toBe(digest(oldText));
    await drain(); expect(await database.engineClaim.count()).toBe(1); expect(await database.engineClaimEvidence.count()).toBe(2);
  });
  it.each([
    ['overlength reason', (ids: string[]) => ids.map(claimId => ({ claimId, verdict: 'supported', reason: 'x'.repeat(2001) }))],
    ['duplicate verdict', (ids: string[]) => [...ids, ...ids].map(claimId => ({ claimId, verdict: 'supported', reason: 'Duplicate fixture verdict.' }))],
    ['missing verdict', () => []],
    ['malformed verdict value', (ids: string[]) => ids.map(claimId => ({ claimId, verdict: 'probably', reason: 'Malformed fixture verdict.' }))],
  ])('stores no verdict for invalid verifier output: %s', async (label, verdicts) => {
    const provider: AnalysisProvider = { ...analysis, verify: async (_input, claims) => ({
      value: { verdicts: verdicts(claims.claims.map(c => c.id)) } as unknown as import('../engine/claims').Verification,
      receipt: { ...receipt, model: 'independent-test-provider' } }) };
    await twoCaptures(`ledger-invalid-verdict-${label.replaceAll(' ', '-')}`, { analysis: provider });
    expect(await database.policyChange.count()).toBe(0);
    expect((await database.engineReview.findFirstOrThrow({ where: { status: 'pending' } })).reasonsJson).toMatch(/verification_(invalid|incomplete)/);
    const { listClaimLedger } = await import('../engine/claimLedger');
    expect((await listClaimLedger({ verdict: 'supported' })).items).toHaveLength(0);
    const missing = (await listClaimLedger({ verdict: 'missing' })).items;
    expect(missing).toHaveLength(1); expect(missing[0]).toMatchObject({ verifierVerdict: null, verifierReason: null });
  });
  it('pages the ledger with a stable cursor and no gaps or repeats', async () => {
    const tx = database as unknown as import('../engine/store').Tx;
    const { recordClaimLedger, listClaimLedger } = await import('../engine/claimLedger');
    const input = { old: structureDocument(oldText), next: structureDocument(newText), deltas: compareDocuments(structureDocument(oldText), structureDocument(newText)).deltas };
    for (let i = 0; i < 5; i++) await recordClaimLedger(tx, { taskId: `page-task-${i}`, policyId: 'page-policy', analysis: { value: grounded(input), receipt } });
    const seen: string[] = []; let cursor: string | null = null;
    do { const page: Awaited<ReturnType<typeof listClaimLedger>> = await listClaimLedger({ policyId: 'page-policy', take: 2, cursor }); seen.push(...page.items.map(r => r.id)); cursor = page.nextCursor; } while (cursor);
    expect(seen).toHaveLength(5); expect(new Set(seen).size).toBe(5);
    expect((await listClaimLedger({ policyId: 'page-policy', verdict: 'missing' })).items).toHaveLength(5);
  });
});

// New candidate tests, injected providers and isolated databases only.
describe('r4 external audit closure controls', () => {
  it.each(['observe', 'publish'] as const)('reuses an unchanged assessed candidate in %s without replacing review or duplicating claims', async mode => {
    const p = await seed();
    const provider: AnalysisProvider = { ...analysis, analyze: vi.fn(async input => {
      const value = grounded(input); if (mode === 'publish') value.claims[0].impact = 8;
      return { value, receipt };
    }) };
    await run(`reuse-${mode}-first`, mode); await drain({ analysis: provider });
    await readySecond(p.id, mode); await run(`reuse-${mode}-second`, mode); await drain({ analysis: provider });
    const originalClaims = await database.engineClaim.findMany();
    const originalReviews = await database.engineReview.findMany();
    for (let day = 0; day < 3; day++) {
      // Schedule additional lab cycles, not real elapsed observation days.
      await database.enginePolicyState.updateMany({ data: { nextDueAt: new Date(0) } });
      await database.engineOrigin.updateMany({ data: { nextAllowedAt: new Date(0) } });
      const batch = await run(`reuse-${mode}-repeat-${day}`, mode); await drain({ analysis: provider });
      const task = await database.engineTask.findFirstOrThrow({ where: { runId: batch.id, kind: 'policy' } });
      expect(JSON.parse(task.resultJson!).outcome).toBe('assessment_already_recorded');
    }
    expect(provider.analyze).toHaveBeenCalledTimes(1);
    expect(analysis.verify).toHaveBeenCalledTimes(1);
    expect(await database.engineClaim.findMany()).toEqual(originalClaims);
    expect(await database.engineReview.findMany()).toEqual(originalReviews);
    expect(await database.policyChange.count()).toBe(0);
    expect(await database.engineOutbox.count()).toBe(0);
  });
  it.each(['analysis_output_incomplete', 'analysis_output_invalid_json', 'analysis_context_budget_exceeded'])('holds %s once and reuses the decision on the same content', async code => {
    const p = await seed();
    const provider: AnalysisProvider = { ...analysis, analyze: vi.fn(async () => { throw new Error(code); }) };
    await run(`error-${code}-first`, 'observe'); await drain({ analysis: provider });
    await readySecond(p.id, 'observe'); await run(`error-${code}-second`, 'observe'); await drain({ analysis: provider });
    const review = await database.engineReview.findFirstOrThrow();
    expect(JSON.parse(review.reasonsJson)).toEqual([code]);
    await database.enginePolicyState.updateMany({ data: { nextDueAt: new Date(0) } });
    await database.engineOrigin.updateMany({ data: { nextAllowedAt: new Date(0) } });
    await run(`error-${code}-third`, 'observe'); await drain({ analysis: provider });
    expect(provider.analyze).toHaveBeenCalledTimes(1);
    expect(await database.engineReview.count()).toBe(1);
    expect(await database.policyChange.count()).toBe(0);
  });
  it('preserves sanitized provider status and bounded Retry-After in the durable retry', async () => {
    const { EngineModelError } = await import('../engine/failures');
    const p = await seed(); await run('provider-first', 'observe'); await drain();
    await readySecond(p.id, 'observe'); await run('provider-second', 'observe');
    const before = Date.now();
    await drain({ analysis: { ...analysis, verify: async () => { throw new EngineModelError('model_http_503', 300_000); } } });
    const task = await database.engineTask.findFirstOrThrow({ where: { stage: 'verify' } });
    expect(task.status).toBe('queued'); expect(task.lastError).toBe('model_http_503');
    expect(task.nextAttemptAt.getTime()).toBeGreaterThanOrEqual(before + 300_000);
    expect((await database.engineAttempt.findFirstOrThrow({ where: { taskId: task.id, status: 'failed' } })).reason).toBe('model_http_503');
  });
  it('holds quota exhaustion without spending three attempts or permanently memoizing a quota failure', async () => {
    const { EngineModelError } = await import('../engine/failures');
    const p = await seed(); await run('quota-first', 'observe'); await drain();
    await readySecond(p.id, 'observe'); await run('quota-second', 'observe');
    const verify = vi.fn(async () => { throw new EngineModelError('model_http_429'); });
    await drain({ analysis: { ...analysis, verify } });
    expect(verify).toHaveBeenCalledTimes(1);
    expect((await database.engineReview.findFirstOrThrow()).reasonsJson).toContain('model_http_429');
    expect((await database.enginePolicyState.findUniqueOrThrow({ where: store.stateKey(p.id, 'observe') })).assessedKey).toBeNull();
  });
  it('does not treat a pending high-impact review as a successful public freshness update', async () => {
    const p = await seed(); await run('freshness-first'); await drain();
    const before = await database.policy.findUniqueOrThrow({ where: { id: p.id } });
    await readySecond(p.id); await run('freshness-second');
    await drain({ analysis: { ...analysis, analyze: async input => { const value = grounded(input); value.claims[0].impact = 8; return { value, receipt }; } } });
    const after = await database.policy.findUniqueOrThrow({ where: { id: p.id } });
    expect(after.dataStatus).toBe('Needs Review'); expect(after.lastSuccessfulCheckDate).toEqual(before.lastSuccessfulCheckDate);
  });
});

describe('r4 conservative mandatory-review categories', () => {
  it.each([
    ['Training is disabled.', 'Training is enabled.'],
    ['We do not sell personal data.', 'We may sell personal data with consent.'],
    ['We retain records for 30 days.', 'We retain records for 60 days.'],
    ['Conserviamo i dati per 30 giorni.', 'Conserviamo i dati per 60 giorni.'],
    ['Addestramento disabilitato.', 'Addestramento abilitato.'],
    ['Nessuna condivisione dei dati.', 'Condivisione dei dati con terzi.'],
    ['Content licensing is limited.', 'Content licensing is perpetual.'],
    ['Arbitration is optional.', 'Arbitration is mandatory.'],
    ['Liability is unlimited.', 'Liability is limited.'],
    ['Governed by the laws of Italy.', 'Governed by the laws of Ireland.'],
    ['We cannot terminate your account.', 'We may terminate your account.'],
  ])('requires review independently of impact score: %s', (before, after) => {
    const old = structureDocument(`# Policy\n\n${before}`), next = structureDocument(`# Policy\n\n${after}`);
    const input = { old, next, deltas: compareDocuments(old, next).deltas };
    const claims = grounded(input); claims.claims[0].impact = 1;
    const validation = validateClaims(claims, input);
    expect(validation.reasons).toEqual([]); expect(validation.highImpact).toBe(true);
  });
  it('exports an isolated populated database inside a serializable snapshot, without a restore claim', async () => {
    await seed();
    const { buildCompleteBackupPayload } = await import('../encryptedBackup');
    const result = await buildCompleteBackupPayload(database);
    expect(result.data.Policy).toHaveLength(1);
    expect(result.provenance?.consistency).toBe('serializable-transaction');
    expect(result.restoreMode).toBe('verification-only');
  });
});

describe('r4 memo invalidation and terminal isolation', () => {
  it('invalidates the assessed content on a new candidate and does not reuse old claims', async () => {
    const p = await seed(); await run('invalidate-first', 'observe'); await drain();
    await readySecond(p.id, 'observe'); await run('invalidate-second', 'observe'); await drain();
    const firstState = await database.enginePolicyState.findUniqueOrThrow({ where: store.stateKey(p.id, 'observe') });
    const updated = newText.replace('60 days', '90 days');
    await readySecond(p.id, 'observe'); await run('invalidate-third', 'observe'); await drain({ acquire: async () => capture(updated) });
    expect(analysis.analyze).toHaveBeenCalledTimes(1);
    await readySecond(p.id, 'observe'); await run('invalidate-fourth', 'observe'); await drain({ acquire: async () => capture(updated) });
    expect(analysis.analyze).toHaveBeenCalledTimes(2);
    const secondState = await database.enginePolicyState.findUniqueOrThrow({ where: store.stateKey(p.id, 'observe') });
    expect(secondState.assessedKey).not.toBe(firstState.assessedKey);
    expect(await database.engineClaim.count()).toBe(2);
  });
  it('retains a review on terminal model failure and preserves every policy field in observe mode', async () => {
    const p = await seed(); const before = await database.policy.findUniqueOrThrow({ where: { id: p.id } });
    await run('terminal-first', 'observe'); await drain(); await readySecond(p.id, 'observe'); await run('terminal-second', 'observe');
    const { EngineModelError } = await import('../engine/failures');
    const dependencies = { analysis: { ...analysis, verify: async () => { throw new EngineModelError('model_http_504'); } } };
    for (let attempt = 0; attempt < 3; attempt++) {
      await database.engineTask.updateMany({ where: { kind: 'policy' }, data: { nextAttemptAt: new Date(0) } });
      await drain(dependencies);
    }
    const failed = await database.engineTask.findFirstOrThrow({ where: { status: 'failed', kind: 'policy' } });
    expect(failed.lastError).toBe('model_http_504');
    expect((await database.engineReview.findFirstOrThrow()).reasonsJson).toContain('model_http_504');
    expect(await database.policy.findUniqueOrThrow({ where: { id: p.id } })).toEqual(before);
    expect(await database.engineOutbox.count()).toBe(0);
  });
});

// Regression sequence from the independent pre-merge review, not a live campaign.
describe('r4 interleaved acquisition holds', () => {
  it.each(['observe', 'publish'] as const)('re-raises semantic review after an acquisition hold in %s', async mode => {
    const p = await seed();
    const high = { ...analysis, analyze: async (input: AnalysisInput) => { const value = grounded(input); value.claims[0].impact = 8; return { value, receipt }; } };
    await run('interleave-first', mode); await drain({ analysis: high });
    await readySecond(p.id, mode); await run('interleave-second', mode); await drain({ analysis: high });
    await readySecond(p.id, mode); await run('interleave-failure', mode);
    await drain({ acquire: async () => ({ ...await capture(), eligible: false, reasons: ['acquisition_failed'] }), analysis: high });
    for (const key of ['recover-first', 'recover-second']) {
      await readySecond(p.id, mode); await run(key, mode); await drain({ analysis: high });
    }
    const reviews = await database.engineReview.findMany({ where: { policyId: p.id, status: { in: ['pending', 'observed'] } } });
    expect(reviews.some(review => review.reasonsJson.includes('high_impact_review_required'))).toBe(true);
  });
});

describe('r4 patch review expiry and recovery controls', () => {
  it('reassesses expired captured evidence automatically', async () => {
    const p = await seed(); await run('expiry-first', 'observe'); await drain();
    await readySecond(p.id, 'observe'); await run('expiry-second', 'observe'); await drain();
    const state = await database.enginePolicyState.findUniqueOrThrow({ where: store.stateKey(p.id, 'observe') });
    const task = await database.engineTask.findUniqueOrThrow({ where: { id: state.assessedTaskId! } });
    const checkpoint = JSON.parse(task.checkpointJson!); checkpoint.observation.observedAt = new Date(Date.now() - 3 * store.DAILY_MS).toISOString();
    await database.engineTask.update({ where: { id: task.id }, data: { checkpointJson: JSON.stringify(checkpoint) } });
    for (const key of ['expiry-third', 'expiry-fourth']) { await readySecond(p.id, 'observe'); await run(key, 'observe'); await drain(); }
    expect(analysis.analyze).toHaveBeenCalledTimes(2);
  });
  it('does not memoize missing provider identity as a permanent content decision', async () => {
    const p = await seed(); await run('identity-first', 'observe'); await drain();
    await readySecond(p.id, 'observe'); await run('identity-second', 'observe');
    await drain({ analysis: { ...analysis, verify: async (input, claims) => ({ ...await analysis.verify(input, claims), receipt: { ...receipt, model: '' } }) } });
    expect((await database.enginePolicyState.findUniqueOrThrow({ where: store.stateKey(p.id, 'observe') })).assessedKey).toBeNull();
    for (const key of ['identity-third', 'identity-fourth']) { await readySecond(p.id, 'observe'); await run(key, 'observe'); await drain(); }
    expect((await database.enginePolicyState.findUniqueOrThrow({ where: store.stateKey(p.id, 'observe') })).assessedKey).not.toBeNull();
  });
  it('holds the first transport mismatch without advancing public successful freshness', async () => {
    const p = await seed(); await run('transport-first'); await drain();
    await readySecond(p.id); await run('transport-second');
    await drain({ acquire: async () => ({ ...await capture(), source: 'rendered' }) });
    expect((await database.engineReview.findFirstOrThrow({ where: { status: 'pending' } })).reasonsJson).toContain('confirmation_transport_changed');
    expect((await database.policy.findUniqueOrThrow({ where: { id: p.id } })).lastSuccessfulCheckDate).toEqual(p.lastSuccessfulCheckDate);
    expect(analysis.analyze).not.toHaveBeenCalled();
  });
  it('preserves repeated terminal failures but keeps only one active review', async () => {
    const p = await seed(); await run('failures-first', 'observe'); await drain();
    const { EngineModelError } = await import('../engine/failures');
    for (const key of ['failures-second', 'failures-third']) {
      await readySecond(p.id, 'observe'); await run(key, 'observe');
      for (let attempt = 0; attempt < 3; attempt++) {
        await database.engineTask.updateMany({ where: { kind: 'policy' }, data: { nextAttemptAt: new Date(0) } });
        await drain({ analysis: { ...analysis, verify: async () => { throw new EngineModelError('model_http_504'); } } });
      }
    }
    expect(await database.engineReview.count({ where: { status: 'observed' } })).toBe(1);
    expect(await database.engineReview.count({ where: { status: 'superseded' } })).toBe(1);
    expect(await database.engineTask.count({ where: { kind: 'policy', status: 'failed' } })).toBe(2);
  });
});

it('reassesses a stale-evidence hold on new captures', async () => {
  const p = await seed(); await run('stale-decision-first', 'observe'); await drain();
  await readySecond(p.id, 'observe'); const r = await run('stale-decision-second', 'observe');
  let task = await database.engineTask.findFirstOrThrow({ where: { runId: r.id, kind: 'policy' } });
  for (let i = 0; i < 12 && task.stage !== 'commit'; i++) {
    await pipeline.workerStep({ acquire: async () => capture(), analysis });
    task = await database.engineTask.findUniqueOrThrow({ where: { id: task.id } });
  }
  expect(task.stage).toBe('commit');
  const checkpoint = JSON.parse(task.checkpointJson!); checkpoint.observation.observedAt = new Date(Date.now() - 3 * store.DAILY_MS).toISOString();
  await database.engineTask.update({ where: { id: task.id }, data: { checkpointJson: JSON.stringify(checkpoint) } });
  await drain();
  expect((await database.engineReview.findFirstOrThrow()).reasonsJson).toContain('evidence_stale');
  expect((await database.enginePolicyState.findUniqueOrThrow({ where: store.stateKey(p.id, 'observe') })).assessedKey).toBeNull();
  for (const key of ['stale-decision-third', 'stale-decision-fourth']) { await readySecond(p.id, 'observe'); await run(key, 'observe'); await drain(); }
  expect((await database.enginePolicyState.findUniqueOrThrow({ where: store.stateKey(p.id, 'observe') })).assessedKey).not.toBeNull();
});
