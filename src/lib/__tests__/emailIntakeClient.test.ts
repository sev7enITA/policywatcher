import { describe, expect, it } from 'vitest';
import {
  LOCAL_EMAIL_MAX_FILE_BYTES,
  parseEmailFileLocally,
} from '../emailIntakeClient';

function bytes(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

describe('local MIME email intake', () => {
  it('decodes a plain forwarded email into non-personal clues', () => {
    const parsed = parseEmailFileLocally(bytes([
      'From: Waze <noreply@waze.com>',
      'To: Fabrizio <fabrizio@example.test>',
      'Date: Fri, 10 Jul 2026 02:59:00 +0000',
      'Subject: Updated terms and privacy policy',
      'Content-Type: text/plain; charset=utf-8',
      '',
      'The Waze Team',
      'Our updated Terms take effect on 1 August 2026.',
      'Read our privacy policy at https://www.waze.com/legal/privacy?token=private#notice',
    ].join('\r\n')));

    expect(parsed.bodyFormat).toBe('plain');
    expect(parsed.clues).toMatchObject({
      companyHint: 'Waze',
      senderDomain: 'waze.com',
      sourceUrl: 'https://www.waze.com/legal/privacy',
    });
    expect(parsed.clues.policyTypes).toEqual(expect.arrayContaining(['privacy', 'terms']));
    expect(parsed.clues.noticeDate).toContain('2026-07-10');
    expect(parsed.clues.effectiveDate).toContain('2026-08-01');
    expect(parsed.visibleText).not.toContain('fabrizio@example.test');
    expect(JSON.stringify(parsed.clues)).not.toContain('Updated terms and privacy policy');
  });

  it('prefers plain text in multipart alternatives and ignores attachments', () => {
    const parsed = parseEmailFileLocally(bytes([
      'From: Acme Privacy <privacy@acme.example>',
      'Subject: =?UTF-8?Q?Informativa_sulla_privacy?=',
      'Content-Type: multipart/mixed; boundary="outer"',
      '',
      '--outer',
      'Content-Type: multipart/alternative; boundary="alternative"',
      '',
      '--alternative',
      'Content-Type: text/plain; charset=utf-8',
      'Content-Transfer-Encoding: quoted-printable',
      '',
      'Il team di Acme=0AAbbiamo aggiornato la privacy policy.',
      '--alternative',
      'Content-Type: text/html; charset=utf-8',
      '',
      '<p>Duplicate HTML body</p>',
      '--alternative--',
      '--outer',
      'Content-Type: application/pdf; name="private.pdf"',
      'Content-Disposition: attachment; filename="private.pdf"',
      'Content-Transfer-Encoding: base64',
      '',
      'cHJpdmF0ZQ==',
      '--outer--',
    ].join('\r\n')));

    expect(parsed.bodyFormat).toBe('plain');
    expect(parsed.visibleText).toContain('Abbiamo aggiornato la privacy policy.');
    expect(parsed.visibleText).not.toContain('Duplicate HTML body');
    expect(parsed.visibleText).not.toContain('private.pdf');
    expect(parsed.ignoredAttachments).toBe(1);
    expect(parsed.clues.companyHint).toBe('Acme');
  });

  it('uses a sanitized HTML fallback and preserves a cleaned policy URL', () => {
    const parsed = parseEmailFileLocally(bytes([
      'From: Contoso <legal@contoso.example>',
      'Content-Type: text/html; charset=utf-8',
      'Content-Transfer-Encoding: quoted-printable',
      '',
      '<style>body{display:none}</style><p>The Contoso Team</p>',
      '<p>We updated our Terms.</p>',
      '<a href=3D"https://contoso.example/legal/terms?recipient=private">Read terms</a>',
      '<script>private@example.test</script>',
    ].join('\r\n')));

    expect(parsed.bodyFormat).toBe('html');
    expect(parsed.visibleText).not.toContain('display:none');
    expect(parsed.visibleText).not.toContain('private@example.test');
    expect(parsed.clues.companyHint).toBe('Contoso');
    expect(parsed.clues.sourceUrl).toBe('https://contoso.example/legal/terms');
  });

  it('rejects empty, oversized and attachment-only messages', () => {
    expect(() => parseEmailFileLocally(new Uint8Array())).toThrow('EMAIL_FILE_TOO_LARGE');
    expect(() => parseEmailFileLocally(new Uint8Array(LOCAL_EMAIL_MAX_FILE_BYTES + 1)))
      .toThrow('EMAIL_FILE_TOO_LARGE');
    expect(() => parseEmailFileLocally(bytes([
      'Content-Type: application/pdf; name="only.pdf"',
      'Content-Disposition: attachment; filename="only.pdf"',
      '',
      'not-a-message',
    ].join('\r\n')))).toThrow('EMAIL_TEXT_UNAVAILABLE');
    expect(() => parseEmailFileLocally(bytes([
      'Content-Type: message/rfc822',
      "Content-Disposition: inline; filename*=utf-8''forwarded.eml",
      '',
      'Content-Type: text/plain',
      '',
      'The Acme Team updated its privacy policy.',
    ].join('\r\n')))).toThrow('EMAIL_TEXT_UNAVAILABLE');
  });

  it('fails closed on excessive MIME nesting', () => {
    let entity = 'Content-Type: text/plain\r\n\r\nTeam Acme updated its privacy policy.';
    for (let index = 0; index < 8; index += 1) {
      entity = `Content-Type: message/rfc822\r\n\r\n${entity}`;
    }
    expect(() => parseEmailFileLocally(bytes(entity))).toThrow('INVALID_EMAIL_FILE');
  });
});
