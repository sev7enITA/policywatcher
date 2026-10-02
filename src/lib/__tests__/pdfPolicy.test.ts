import { describe, expect, it } from 'vitest';
import { gzipSync } from 'node:zlib';
import { extractPdfPolicyHtml } from '../pdfPolicy';
import { decodeBoundedDocumentBody, validateContent } from '../scraper';

// Tiny valid PDF, with a computed xref, exercises the actual parser offline.
function document(text: string): Buffer {
  const lines = text.match(/.{1,75}(?:\s|$)/g) || [text];
  const stream = `BT /F1 10 Tf 12 TL 30 700 Td ${lines.map(line => `(${line.replace(/[\\()]/g, '\\$&')}) Tj T*`).join(' ')} ET`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, i) => { offsets.push(Buffer.byteLength(pdf)); pdf += `${i + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map(o => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf);
}

describe('official PDF policy ingestion', () => {
  it('extracts text without interpreting document markup', async () => {
    const html = await extractPdfPolicyHtml(document('Privacy policy: <script>personal data & rights</script>'));
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>');
    expect(html).toContain('personal data &amp; rights');
  });
  it('supports compressed CDN PDFs and applies the shared evidence validation', async () => {
    const content = 'Privacy Policy. We collect personal data and process your information. You have rights to deletion. Contact us about data protection. '.repeat(8);
    const pdf = document(content);
    const html = await decodeBoundedDocumentBody(gzipSync(pdf), 'gzip', 'application/pdf');
    const binaryHtml = await decodeBoundedDocumentBody(pdf, '', 'application/octet-stream');
    expect(binaryHtml).toBe(html);
    const result = await validateContent(html);
    expect(result.ok).toBe(true);
    const short = await validateContent(await extractPdfPolicyHtml(document('Welcome')));
    expect(short.ok).toBe(false);
  });
  it('rejects malformed, oversized and non-PDF binary payloads', async () => {
    await expect(extractPdfPolicyHtml(Buffer.from('not a pdf'))).rejects.toThrow('invalid_pdf_signature');
    await expect(extractPdfPolicyHtml(Buffer.from('%PDF- broken'))).rejects.toThrow();
    await expect(extractPdfPolicyHtml(new Uint8Array(5_000_001))).rejects.toThrow('pdf_body_too_large');
    await expect(decodeBoundedDocumentBody(Buffer.from('binary'), '', 'application/octet-stream')).rejects.toThrow('unsupported_content_type');
    await expect(decodeBoundedDocumentBody(Buffer.from('<html>Error</html>'), '', 'application/pdf')).rejects.toThrow('invalid_pdf_signature');
  });
  it('retains unchanged HTML decoding', async () => {
    const html = '<html><body>Privacy &amp; data</body></html>';
    expect(await decodeBoundedDocumentBody(gzipSync(html), 'gzip', 'text/html; charset=utf-8')).toBe(html);
  });
});
