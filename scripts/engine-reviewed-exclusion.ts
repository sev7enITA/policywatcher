/** Draft an exact DOM exclusion for local review; never saves a contract. */
import { readFile, realpath, stat } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { load } from 'cheerio';

async function main() {
  const [file, selector] = process.argv.slice(2);
  if (!file || !selector || selector.length > 300 || /:(?:has|contains|matches|not)\s*\(/i.test(selector)) throw new Error('capture_and_bounded_selector_required');
  const path = await realpath(resolve(file));
  const allowed = await realpath(resolve('output'));
  if (!path.startsWith(allowed + sep) || (await stat(path)).size > 5_000_000) throw new Error('bounded_local_capture_required');
  const raw = await readFile(path, 'utf8');
  const $ = load(raw); const node = $(selector);
  if (node.length !== 1 || node.is('html, body, main, article, [role="main"], h1, h2, h3, h4, h5, h6')
    || node.find('main, article, [role="main"]').length
    || (!node.is('[role="dialog"]') && node.find('h1,h2,h3,h4,h5,h6').length)) throw new Error('one_non_document_node_required');
  console.log(JSON.stringify({ status: 'draft_requires_review', sourceFile: file,
    warning: 'Inspect the original capture and document boundary. This draft is invalid until a reviewer supplies a substantive reviewNote. No contract was saved.',
    textPreview: node.text().replace(/\s+/g, ' ').trim().slice(0, 600),
    rule: { selector, htmlSha256: createHash('sha256').update($.html(node)).digest('hex'), purpose: 'non_document_ui', reviewNote: '',
      ...(node.is('[role="dialog"]') ? { dialogHeadings: node.find('h1,h2,h3,h4,h5,h6').map((_, h) => $(h).text().replace(/\s+/g, ' ').trim()).get() } : {}) } }, null, 2));
}
void main().catch(error => { console.error(error instanceof Error ? error.message : 'proposal_failed'); process.exitCode = 1; });
