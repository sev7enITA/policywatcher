import { describe, expect, it, vi } from 'vitest';
import { gzipSync } from 'node:zlib';
import { extractPdfPolicyHtml } from '../pdfPolicy';
import { decodeBoundedDocumentBody, scrapePolicyText, validateContent } from '../scraper';
import { createShadowSession, type ShadowReceipt } from '../adaptiveAcquisition/shadow';
import { digest, type RawCapture } from '../adaptiveAcquisition/evidence';

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
  it('retains PDF extraction lineage and baseline output during private shadow replay', async () => {
    vi.stubEnv('POLICYWATCHER_EXTRACTION_GUARD', '1');
    try {
      const url = 'https://8.8.8.8/legal/privacy.pdf';
      const content = 'Privacy Policy. We collect personal data and process your information. You have rights to deletion. Contact us about data protection. '.repeat(8);
      const html = await decodeBoundedDocumentBody(document(content), '', 'application/pdf');
      const options = { controlledFallbacks: { skipDelays: true, direct: async () => ({ ok: true, html, status: 200, finalUrl: url, error: '' }) } };
      const baseline = await scrapePolicyText(url, options);
      let saved: { capture: RawCapture; receipt: ShadowReceipt } | undefined;
      const session = createShadowSession({ runId: 'pdf-baseline', provenance: { test: digest('pdf-baseline') },
        config: { schemaVersion: 1, mode: 'shadow', maxObservations: 1,
          targets: [{ url, language: 'en', jurisdiction: 'EU' }],
          recipes: [{ schemaVersion: 1, id: 'article', revision: 1, scope: { origin: 'https://8.8.8.8', pathPrefix: '/legal', language: 'en', jurisdiction: 'EU' }, rootSelector: 'article' }] },
        persist: async (capture, receipt) => { saved = { capture, receipt }; } });
      const result = await session.scrape(url, options);
      expect(result.status).toBe('ok');
      expect(result.extraction).toEqual(baseline.extraction);
      expect(result.extraction?.input).toBe(html);
      expect(result.text).toBe(baseline.text); expect(result.hash).toBe(baseline.hash);
      expect(result).not.toHaveProperty('rawCaptureSummary');
      expect(saved?.capture.bodyKind).toBe('decoded_document_html');
      expect(saved?.receipt.baseline.agreement).toBe('accepted_match');
      expect(saved?.receipt.livePromotionAllowed).toBe(false);
      expect(await session.close()).toMatchObject({ attempted: 1, persisted: 1, baselineMismatches: 0 });
    } finally { vi.unstubAllEnvs(); }
  });
});
