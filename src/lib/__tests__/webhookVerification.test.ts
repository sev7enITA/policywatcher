import { describe, expect, it } from 'vitest';
import {
  WEBHOOK_TEST_VECTOR,
  WEBHOOK_TOLERANCE_SECONDS,
  computeWebhookSignature,
  getWebhookVerificationKit,
  parseWebhookSignatureHeader,
  verifyWebhookSignature,
} from '../webhookVerification';

describe('webhook verification readiness contract', () => {
  it('publishes a reproducible public test vector', () => {
    const computed = computeWebhookSignature(
      WEBHOOK_TEST_VECTOR.secret,
      WEBHOOK_TEST_VECTOR.timestamp,
      WEBHOOK_TEST_VECTOR.payload,
    );
    expect(WEBHOOK_TEST_VECTOR.signatureHeader).toBe(`v1=${computed}`);
    expect(WEBHOOK_TEST_VECTOR.signedPayload).toBe(
      `${WEBHOOK_TEST_VECTOR.timestamp}.${WEBHOOK_TEST_VECTOR.payload}`,
    );
  });

  it('accepts the vector at its recorded time and rejects body or signature changes', () => {
    const base = {
      secret: WEBHOOK_TEST_VECTOR.secret,
      timestamp: WEBHOOK_TEST_VECTOR.timestamp,
      rawBody: WEBHOOK_TEST_VECTOR.payload,
      signatureHeader: WEBHOOK_TEST_VECTOR.signatureHeader,
      nowSeconds: WEBHOOK_TEST_VECTOR.timestamp,
    };
    expect(verifyWebhookSignature(base)).toEqual({ valid: true, code: 'valid', signatureVersion: 'v1' });
    expect(verifyWebhookSignature({ ...base, rawBody: `${base.rawBody} ` })).toMatchObject({
      valid: false,
      code: 'signature_mismatch',
    });
    expect(verifyWebhookSignature({ ...base, signatureHeader: `v1=${'0'.repeat(64)}` })).toMatchObject({
      valid: false,
      code: 'signature_mismatch',
    });
  });

  it('fails closed on malformed headers and timestamps outside tolerance', () => {
    const base = {
      secret: WEBHOOK_TEST_VECTOR.secret,
      timestamp: WEBHOOK_TEST_VECTOR.timestamp,
      rawBody: WEBHOOK_TEST_VECTOR.payload,
      signatureHeader: WEBHOOK_TEST_VECTOR.signatureHeader,
    };
    expect(parseWebhookSignatureHeader(`V1=${'a'.repeat(64)}`)).toBeNull();
    expect(parseWebhookSignatureHeader(`v1=${'A'.repeat(64)}`)).toBeNull();
    expect(verifyWebhookSignature({ ...base, secret: '', nowSeconds: base.timestamp })).toMatchObject({
      valid: false,
      code: 'invalid_secret',
    });
    expect(verifyWebhookSignature({ ...base, timestamp: 0 })).toMatchObject({
      valid: false,
      code: 'invalid_timestamp',
    });
    expect(
      verifyWebhookSignature({
        ...base,
        nowSeconds: WEBHOOK_TEST_VECTOR.timestamp + WEBHOOK_TOLERANCE_SECONDS + 1,
      }),
    ).toMatchObject({ valid: false, code: 'timestamp_outside_tolerance' });
  });

  it('keeps delivery capabilities outside the downloadable kit', () => {
    const kit = getWebhookVerificationKit();
    expect(kit).toMatchObject({
      status: 'readiness-contract',
      deliveryAvailable: false,
      algorithm: 'HMAC-SHA256',
      signatureVersion: 'v1',
      testVector: {
        verificationMode: 'signature-compatibility-only',
        freshnessReferenceSeconds: WEBHOOK_TEST_VECTOR.timestamp,
      },
      conformanceSuite: {
        href: '/api/v1/webhook-conformance-suite',
        caseCount: 8,
      },
    });
    expect(kit.testVectorInstructions.join(' ')).toMatch(/static vector only.*clock fixed/i);
    expect(kit.testVectorInstructions.join(' ')).toMatch(/do not disable timestamp freshness/i);
    expect(JSON.stringify(kit.boundary)).toMatch(/does not provide public subscriptions/i);
    expect(JSON.stringify(kit)).not.toMatch(/deliveryAvailable":true|productionSecret/i);
  });
});
