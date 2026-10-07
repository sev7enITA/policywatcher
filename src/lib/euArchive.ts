import { sha256 } from './extractionProfile';
/** Independent metadata adapter. No OTA code, executable filters or policy texts are imported. */
export const EU_PROJECT = 991;
export const EU_REPO = 'https://code.europa.eu/dsa/terms-and-conditions-database/vlops-and-vloses/vlop-vlose-versions';
const API = `https://code.europa.eu/api/v4/projects/${EU_PROJECT}/repository`;
const PILOT = new Set(['Google', 'OpenAI', 'Meta']);
const SHA = /^[a-f0-9]{40}$/;
export type ExternalReference = {
  referenceKey: string; projectId: number; path: string; commitSha: string; blobId: string;
  recordedAt: Date; service: string; title: string; suggestedType: string;
  jurisdiction: string; language: string; referenceUrl: string; license: string; attribution: string;
};
type TreeEntry = { id: string; type: string; path: string };
type Commit = { id: string; committed_date: string };
export type ArchiveReader = (path: string) => Promise<unknown>;

export const readEuMetadata: ArchiveReader = async path => {
  // The only host is fixed; paths are constructed below, never supplied by callers.
  const response = await fetch(`${API}${path}`, {
    redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(20_000),
    headers: { Accept: 'application/json', 'User-Agent': 'PolicyWatcher-metadata-pilot/1.0' },
  });
  if (!response.ok) throw new Error(`eu_archive_http_${response.status}`);
  if (!response.body) throw new Error('eu_archive_empty_response');
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > 2_000_000) { await reader.cancel(); throw new Error('eu_archive_response_too_large'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
};

function commit(value: unknown): Commit {
  const c = value as Commit;
  if (!c || !SHA.test(c.id) || !Number.isFinite(Date.parse(c.committed_date))) throw new Error('eu_archive_invalid_commit');
  return c;
}
function entries(value: unknown): TreeEntry[] {
  if (!Array.isArray(value) || value.length > 100 || !value.every(x => x && SHA.test(x.id)
    && typeof x.path === 'string' && x.path.length <= 500 && !x.path.split('/').includes('..')
    && ['blob', 'tree'].includes(x.type))) throw new Error('eu_archive_invalid_tree');
  return value;
}
export function pilotDocument(path: string) {
  const parts = path.split('/');
  if (parts.length !== 2 || !PILOT.has(parts[0]) || !parts[1].endsWith('.md')) return null;
  const title = parts[1].slice(0, -3);
  const suggestedType = /privacy policy/i.test(title) ? 'privacy' : /terms of (use|services?)$/i.test(title) ? 'terms' : null;
  return suggestedType ? { service: parts[0], title, suggestedType, jurisdiction: /^EU /i.test(title) ? 'EU' : 'unconfirmed' } : null;
}

export async function discoverEuPilot(read: ArchiveReader = readEuMetadata) {
  const heads = await read('/commits?per_page=1');
  if (!Array.isArray(heads) || heads.length !== 1) throw new Error('eu_archive_missing_head');
  const head = commit(heads[0]);
  const license = await read(`/files/LICENSE?ref=${head.id}`) as { content?: string; encoding?: string };
  if (license.encoding !== 'base64' || typeof license.content !== 'string' || license.content.length > 50_000
    || sha256(Buffer.from(license.content, 'base64').toString('utf8')) !== 'f5b745ef98087f531e719ee8ca6a96809444573ecc7173c6fa68eaad39b3cc3f') {
    throw new Error('eu_archive_license_requires_review');
  }
  const tree: TreeEntry[] = []; let complete = false;
  for (let page = 1; page <= 20; page++) {
    const batch = entries(await read(`/tree?ref=${head.id}&recursive=true&per_page=100&page=${page}`));
    tree.push(...batch); if (batch.length < 100) { complete = true; break; }
  }
  if (!complete) throw new Error('eu_archive_catalog_truncated');
  const documents = tree.filter(x => x.type === 'blob' && pilotDocument(x.path));
  if (!documents.length) throw new Error('eu_archive_empty_pilot');
  if (documents.length > 30) throw new Error('eu_archive_pilot_scope_expanded');
  const references: ExternalReference[] = [];
  for (const doc of documents) {
    const metadata = pilotDocument(doc.path)!;
    const history = await read(`/commits?ref_name=${head.id}&path=${encodeURIComponent(doc.path)}&per_page=3`);
    if (!Array.isArray(history) || history.length > 3 || !history.length) throw new Error('eu_archive_missing_history');
    for (const raw of history) {
      const revision = commit(raw);
      // HEAD returns metadata headers only: use the tree instead to remain JSON-only and testable.
      const directory = entries(await read(`/tree?ref=${revision.id}&path=${encodeURIComponent(metadata.service)}&per_page=100`));
      const blob = directory.find(x => x.type === 'blob' && x.path === doc.path);
      if (!blob) throw new Error('eu_archive_missing_revision_blob');
      references.push({
        referenceKey: `${EU_PROJECT}:${doc.path}:${revision.id}`, projectId: EU_PROJECT,
        path: doc.path, commitSha: revision.id, blobId: blob.id, recordedAt: new Date(revision.committed_date),
        ...metadata, language: 'en',
        referenceUrl: `${EU_REPO}/-/blob/${revision.id}/${doc.path.split('/').map(encodeURIComponent).join('/')}`,
        license: 'CC-BY-4.0 (database); third-party text rights unconfirmed',
        attribution: 'European Commission, Digital Services Terms and Conditions Database; metadata selected and classified by PolicyWatcher.',
      });
    }
  }
  const coverage = [...PILOT].flatMap(service => ['privacy', 'terms'].map(type => ({ service, type,
    documents: documents.filter(d => { const m = pilotDocument(d.path)!; return m.service === service && m.suggestedType === type; }).length,
  })));
  return { head: head.id, documentCount: documents.length, coverage, references,
    historicalWindow: 'Up to 3 recorded revisions per pilot document; not a complete history.' };
}
