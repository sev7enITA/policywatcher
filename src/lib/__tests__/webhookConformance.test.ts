import { describe, expect, it } from 'vitest';
import {
  WEBHOOK_CONFORMANCE_CASES,
  WEBHOOK_CONFORMANCE_SUITE_VERSION,
  getWebhookConformanceSuite,
  runWebhookConformanceSuite,
} from '../webhookVerification';

describe('webhook receiver conformance suite', () => {
  it('publishes one deterministic case for every receiver decision path', () => {
    const suite = getWebhookConformanceSuite();
    expect(suite.suiteVersion).toBe(WEBHOOK_CONFORMANCE_SUITE_VERSION);
    expect(suite.caseCount).toBe(8);
    expect(new Set(suite.cases.map((testCase) => testCase.id)).size).toBe(8);
    expect(new Set(suite.cases.map((testCase) => testCase.expectedCode))).toEqual(new Set([
      'valid',
      'invalid_secret',
      'invalid_timestamp',
      'timestamp_outside_tolerance',
      'invalid_signature_header',
      'signature_mismatch',
    ]));
  });

  it('passes every canonical positive and negative case', () => {
    const result = runWebhookConformanceSuite();
    expect(result).toMatchObject({ passed: WEBHOOK_CONFORMANCE_CASES.length, failed: 0 });
    expect(result.results.every((testCase) => testCase.passed)).toBe(true);
  });

  it('keeps delivery and production assurance outside the fixture', () => {
    const suite = getWebhookConformanceSuite();
    expect(suite.deliveryAvailable).toBe(false);
    expect(suite.boundary).toMatch(/does not test endpoint identity/i);
    expect(suite.boundary).toMatch(/network delivery/i);
  });
});
