/** Convert a text PDF into inert HTML for the shared policy evidence gate. */
export async function extractPdfPolicyHtml(bytes: Uint8Array): Promise<string> {
  if (bytes.byteLength > 5_000_000) throw new Error('pdf_body_too_large');
  if (new TextDecoder().decode(bytes.subarray(0, 5)) !== '%PDF-') {
    throw new Error('invalid_pdf_signature');
  }
  const { getDocumentProxy, extractText } = await import('unpdf');
  const pdf = await getDocumentProxy(new Uint8Array(bytes), {
    useSystemFonts: false,
  });
  try {
    if (pdf.numPages > 250) throw new Error('pdf_page_limit_exceeded');
    const { text } = await extractText(pdf, { mergePages: true });
    if (!text.trim()) throw new Error('pdf_has_no_extractable_text');
    if (text.length > 5_000_000) throw new Error('pdf_text_too_large');
    const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<html><body><article>${text.split(/\n+/).map(line => `<p>${escape(line)}</p>`).join('')}</article></body></html>`;
  } finally {
    await pdf.loadingTask.destroy();
  }
}
