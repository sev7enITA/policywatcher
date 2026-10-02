import { expect, it } from 'vitest';
import { smtpConfiguration } from '@/lib/smtpConfiguration';
const env = { SMTP_HOST: 'smtp.hostinger.com', SMTP_PORT: '465', SMTP_USER: 'fixture@example.test', SMTP_PASS: 'fixture-only' };
it('uses implicit TLS for Hostinger 465', () => expect(smtpConfiguration(env)).toMatchObject({ port: 465, secure: true }));
it('requires STARTTLS on 587', () => expect(smtpConfiguration({ ...env, SMTP_PORT: '587' })).toMatchObject({ secure: false, requireTLS: true }));
it('rejects partially numeric ports', () => expect(() => smtpConfiguration({ ...env, SMTP_PORT: '465oops' })).toThrow());
it('does not enable delivery with incomplete credentials', () => expect(smtpConfiguration({ ...env, SMTP_PASS: undefined })).toBeNull());
