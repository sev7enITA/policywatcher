import { describe, expect, it } from 'vitest';
import { extractPolicyText } from '../scraper';
import { structureDocument } from '../engine/document';

const context = '<h1>Privacy Policy</h1><p>We collect personal data for account services. Your privacy rights include access, deletion and consent controls. Contact the privacy team for details.</p>';

describe.each([false, true])('table evidence (ordered blocks: %s)', preserveNestedBlockOrder => {
  it('preserves literal backslashes next to pipes, at cell boundaries and in headers', () => {
    const html = `<main>${context}<table>
      <tr><th>Rule\\|scope</th><th>Allowed</th></tr>
      <tr><td>path\\record</td><td>No</td></tr>
      <tr><td>a\\|b</td><td>No</td></tr>
      <tr><td>a\\\\|b</td><td>No</td></tr>
      <tr><td>trailing\\</td><td>No</td></tr>
      <tr><td>literal &#92; and &#124;</td><td>🛡️</td></tr>
    </table></main>`;
    const text = extractPolicyText(html, 'https://example.com/privacy', { minimumTextLength: 100, preserveNestedBlockOrder });
    const document = structureDocument(text);
    expect(document.blocks.filter(b => b.kind === 'table').map(b => b.text)).toEqual([
      String.raw`| Rule\\\|scope | Allowed |`,
      String.raw`| path\\record | No |`,
      String.raw`| a\\\|b | No |`,
      String.raw`| a\\\\\|b | No |`,
      String.raw`| trailing\\ | No |`,
      String.raw`| literal \\ and \| | 🛡️ |`,
    ]);
    for (const block of document.blocks) expect(text.slice(block.start, block.end)).toBe(block.text);
  });

  it('retains ordinary cells, repeated negatives, empty cells and span evidence', () => {
    const html = `<main>${context}<table><tr><th>Use</th><th>Allowed</th><th>Notes</th></tr>
      <tr><td>Training | analytics</td><td>No</td><td></td></tr>
      <tr><td colspan="2">No</td><td>30 days</td></tr></table></main>`;
    const text = extractPolicyText(html, 'https://example.com/privacy', { minimumTextLength: 100, preserveNestedBlockOrder });
    expect(text).toContain('| Use | Allowed | Notes |\n| Training \\| analytics | No |  |\n| No [colspan=2; rowspan=1] | 30 days |');
    expect(extractPolicyText(html, 'https://example.com/privacy', { minimumTextLength: 100, preserveNestedBlockOrder })).toBe(text);
  });
});
