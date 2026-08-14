import { createHmac, timingSafeEqual } from 'node:crypto';

export const WEBHOOK_SIGNATURE_VERSION = 'v1' as const;
export const WEBHOOK_VERIFICATION_KIT_VERSION = '1.0.0' as const;
export const WEBHOOK_CONFORMANCE_SUITE_VERSION = '1.0.0' as const;
export const WEBHOOK_TOLERANCE_SECONDS = 300;
export const WEBHOOK_VERIFICATION_BOUNDARY =
  'This public kit defines a candidate receiver-verification contract and deterministic test vector. A separate deployment-configured pilot can send signed public change events to allowlisted HTTPS destinations with a persistent outbox and bounded retries. PolicyWatcher does not provide public subscriptions, endpoint self-service, automatic key rotation, guaranteed delivery or an SLA.';

const TEST_SECRET = 'whsec_test_policywatcher_public_vector_v1';
const TEST_TIMESTAMP = 1_785_326_400;
const TEST_EVENT_ID = 'pwe_7d94a2e87c1f1af16a93';
const TEST_PAYLOAD =
  '{"eventId":"pwe_7d94a2e87c1f1af16a93","eventType":"policy.change.published","schemaVersion":"1.0.0","occurredAt":"2026-07-29T12:00:00.000Z","subject":{"changeId":"11111111-1111-4111-8111-111111111111"},"links":{"change":"https://policywatcher.online/change/11111111-1111-4111-8111-111111111111","evidence":"https://policywatcher.online/evidence/11111111-1111-4111-8111-111111111111"}}';
const TEST_SIGNATURE = '72b5cde210f2adf69d92fcb65a9a236a327ec67d5032f6ef9277485cbec964ba';

export function buildWebhookSignedPayload(timestamp: number, rawBody: string): string {
  return `${timestamp}.${rawBody}`;
}

export function computeWebhookSignature(secret: string, timestamp: number, rawBody: string): string {
  return createHmac('sha256', secret)
    .update(buildWebhookSignedPayload(timestamp, rawBody), 'utf8')
    .digest('hex');
}

export function parseWebhookSignatureHeader(header: string): string | null {
  const match = /^v1=([a-f0-9]{64})$/.exec(header);
  return match?.[1] ?? null;
}

export type WebhookVerificationResult =
  | { valid: true; code: 'valid'; signatureVersion: typeof WEBHOOK_SIGNATURE_VERSION }
  | {
      valid: false;
      code:
        | 'invalid_secret'
        | 'invalid_timestamp'
        | 'timestamp_outside_tolerance'
        | 'invalid_signature_header'
        | 'signature_mismatch';
    };

export type WebhookVerificationCode = WebhookVerificationResult['code'];

export interface WebhookVerificationInput {
  secret: string;
  timestamp: number;
  rawBody: string;
  signatureHeader: string;
  nowSeconds?: number;
  toleranceSeconds?: number;
}

export function verifyWebhookSignature(input: WebhookVerificationInput): WebhookVerificationResult {
  if (input.secret.length === 0) {
    return { valid: false, code: 'invalid_secret' };
  }

  if (!Number.isSafeInteger(input.timestamp) || input.timestamp <= 0) {
    return { valid: false, code: 'invalid_timestamp' };
  }

  const supplied = parseWebhookSignatureHeader(input.signatureHeader);
  if (!supplied) return { valid: false, code: 'invalid_signature_header' };

  const nowSeconds = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  const toleranceSeconds = input.toleranceSeconds ?? WEBHOOK_TOLERANCE_SECONDS;
  if (
    !Number.isSafeInteger(nowSeconds) ||
    !Number.isSafeInteger(toleranceSeconds) ||
    toleranceSeconds < 0 ||
    Math.abs(nowSeconds - input.timestamp) > toleranceSeconds
  ) {
    return { valid: false, code: 'timestamp_outside_tolerance' };
  }

  const expected = computeWebhookSignature(input.secret, input.timestamp, input.rawBody);
  const suppliedBuffer = Buffer.from(supplied, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');
  if (suppliedBuffer.length !== expectedBuffer.length || !timingSafeEqual(suppliedBuffer, expectedBuffer)) {
    return { valid: false, code: 'signature_mismatch' };
  }

  return { valid: true, code: 'valid', signatureVersion: WEBHOOK_SIGNATURE_VERSION };
}

export const WEBHOOK_TEST_VECTOR = Object.freeze({
  id: 'policywatcher-hmac-sha256-v1-public-vector',
  verificationMode: 'signature-compatibility-only',
  secretClassification: 'public-test-only',
  secret: TEST_SECRET,
  timestamp: TEST_TIMESTAMP,
  freshnessReferenceSeconds: TEST_TIMESTAMP,
  eventId: TEST_EVENT_ID,
  payload: TEST_PAYLOAD,
  signedPayload: buildWebhookSignedPayload(TEST_TIMESTAMP, TEST_PAYLOAD),
  signatureHeader: `${WEBHOOK_SIGNATURE_VERSION}=${TEST_SIGNATURE}`,
});

export const WEBHOOK_TEST_VECTOR_INSTRUCTIONS = Object.freeze([
  'Use the exact public test secret, timestamp and raw payload bytes shown in the vector.',
  `For this static vector only, evaluate freshness with the verification clock fixed at ${TEST_TIMESTAMP}.`,
  'Do not disable timestamp freshness or replay protection for production deliveries.',
]);

export interface WebhookConformanceCase {
  id: string;
  title: string;
  purpose: string;
  expectedCode: WebhookVerificationCode;
  input: WebhookVerificationInput;
}

const canonicalConformanceInput = Object.freeze({
  secret: WEBHOOK_TEST_VECTOR.secret,
  timestamp: WEBHOOK_TEST_VECTOR.timestamp,
  rawBody: WEBHOOK_TEST_VECTOR.payload,
  signatureHeader: WEBHOOK_TEST_VECTOR.signatureHeader,
  nowSeconds: WEBHOOK_TEST_VECTOR.freshnessReferenceSeconds,
  toleranceSeconds: WEBHOOK_TOLERANCE_SECONDS,
});

export const WEBHOOK_CONFORMANCE_CASES: readonly WebhookConformanceCase[] = Object.freeze([
  Object.freeze({
    id: 'canonical-valid',
    title: 'Accept the canonical vector',
    purpose: 'Confirms exact HMAC-SHA256 construction over the recorded timestamp and raw body.',
    expectedCode: 'valid',
    input: canonicalConformanceInput,
  }),
  Object.freeze({
    id: 'empty-secret',
    title: 'Reject an empty secret',
    purpose: 'Confirms fail-closed secret validation before digest construction.',
    expectedCode: 'invalid_secret',
    input: Object.freeze({ ...canonicalConformanceInput, secret: '' }),
  }),
  Object.freeze({
    id: 'zero-timestamp',
    title: 'Reject a zero timestamp',
    purpose: 'Confirms that the receiver accepts only positive integer Unix timestamps.',
    expectedCode: 'invalid_timestamp',
    input: Object.freeze({ ...canonicalConformanceInput, timestamp: 0 }),
  }),
  Object.freeze({
    id: 'stale-timestamp',
    title: 'Reject a stale timestamp',
    purpose: 'Confirms enforcement immediately outside the candidate 300-second tolerance.',
    expectedCode: 'timestamp_outside_tolerance',
    input: Object.freeze({
      ...canonicalConformanceInput,
      nowSeconds: WEBHOOK_TEST_VECTOR.timestamp + WEBHOOK_TOLERANCE_SECONDS + 1,
    }),
  }),
  Object.freeze({
    id: 'unsupported-version',
    title: 'Reject an unsupported signature version',
    purpose: 'Confirms strict parsing of the lowercase v1 signature prefix.',
    expectedCode: 'invalid_signature_header',
    input: Object.freeze({
      ...canonicalConformanceInput,
      signatureHeader: WEBHOOK_TEST_VECTOR.signatureHeader.replace(/^v1=/, 'v2='),
    }),
  }),
  Object.freeze({
    id: 'uppercase-digest',
    title: 'Reject an uppercase digest',
    purpose: 'Confirms the canonical lowercase hexadecimal encoding contract.',
    expectedCode: 'invalid_signature_header',
    input: Object.freeze({
      ...canonicalConformanceInput,
      signatureHeader: `${WEBHOOK_SIGNATURE_VERSION}=${WEBHOOK_TEST_VECTOR.signatureHeader.slice(3).toUpperCase()}`,
    }),
  }),
  Object.freeze({
    id: 'body-byte-mutation',
    title: 'Reject a raw-body byte mutation',
    purpose: 'Confirms that whitespace and exact raw-body bytes remain signature material.',
    expectedCode: 'signature_mismatch',
    input: Object.freeze({
      ...canonicalConformanceInput,
      rawBody: `${WEBHOOK_TEST_VECTOR.payload} `,
    }),
  }),
  Object.freeze({
    id: 'digest-mutation',
    title: 'Reject a digest mutation',
    purpose: 'Confirms rejection of a well-formed but nonmatching signature value.',
    expectedCode: 'signature_mismatch',
    input: Object.freeze({
      ...canonicalConformanceInput,
      signatureHeader: `${WEBHOOK_SIGNATURE_VERSION}=6${WEBHOOK_TEST_VECTOR.signatureHeader.slice(4)}`,
    }),
  }),
]);

export function runWebhookConformanceCase(testCase: WebhookConformanceCase) {
  const result = verifyWebhookSignature(testCase.input);
  return {
    id: testCase.id,
    expectedCode: testCase.expectedCode,
    actualCode: result.code,
    passed: result.code === testCase.expectedCode,
  } as const;
}

export function getWebhookConformanceSuite() {
  return {
    schema: 'https://policywatcher.online/schemas/webhook-conformance-suite/v1',
    suiteVersion: WEBHOOK_CONFORMANCE_SUITE_VERSION,
    contractVersion: WEBHOOK_VERIFICATION_KIT_VERSION,
    status: 'public-test-fixture' as const,
    executionMode: 'local-receiver' as const,
    deliveryAvailable: false,
    caseCount: WEBHOOK_CONFORMANCE_CASES.length,
    cases: WEBHOOK_CONFORMANCE_CASES.map((testCase) => ({
      ...testCase,
      input: { ...testCase.input },
    })),
    expectedSummary: {
      passed: WEBHOOK_CONFORMANCE_CASES.length,
      failed: 0,
    },
    boundary:
      'This suite tests deterministic compatibility with the candidate receiver contract. It does not test endpoint identity, production secret custody, network delivery, retry behavior, replay storage, availability or implementation security outside these cases.',
  } as const;
}

export function runWebhookConformanceSuite() {
  const results = WEBHOOK_CONFORMANCE_CASES.map(runWebhookConformanceCase);
  return {
    suiteVersion: WEBHOOK_CONFORMANCE_SUITE_VERSION,
    contractVersion: WEBHOOK_VERIFICATION_KIT_VERSION,
    passed: results.filter((result) => result.passed).length,
    failed: results.filter((result) => !result.passed).length,
    results,
  } as const;
}

export const WEBHOOK_PRODUCTION_CHECKLIST = Object.freeze([
  'Read the exact raw request bytes before JSON parsing or body transformation.',
  'Resolve a tenant-owned secret from a managed secret store; never use the public test secret.',
  `Reject timestamps outside the configured tolerance; the candidate default is ${WEBHOOK_TOLERANCE_SECONDS} seconds.`,
  'Compare signatures with a constant-time primitive.',
  'Store accepted event IDs or nonces for a bounded replay-protection window.',
  'Support overlapping active secrets during controlled key rotation.',
  'Record bounded delivery outcomes without logging secrets or raw private payloads.',
]);

export const WEBHOOK_NODE_EXAMPLE = `import { createHmac, timingSafeEqual } from 'node:crypto';

const timestamp = request.headers.get('PolicyWatcher-Timestamp');
const signature = request.headers.get('PolicyWatcher-Signature');
const eventId = request.headers.get('PolicyWatcher-Event-Id');
const rawBody = Buffer.from(await request.arrayBuffer());

if (!/^\\d+$/.test(timestamp ?? '') || !/^v1=[a-f0-9]{64}$/.test(signature ?? '')) {
  throw new Error('Invalid webhook headers');
}

const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
if (age > 300) throw new Error('Stale webhook timestamp');

const expected = createHmac('sha256', process.env.POLICYWATCHER_WEBHOOK_SECRET)
  .update(\`\${timestamp}.\`, 'utf8')
  .update(rawBody)
  .digest('hex');
const supplied = signature.slice(3);

if (!timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(supplied, 'hex'))) {
  throw new Error('Invalid webhook signature');
}

// Check eventId in a bounded replay store before processing.`;

export const WEBHOOK_PYTHON_EXAMPLE = `import hashlib
import hmac
import os
import re
import time

timestamp = request.headers["PolicyWatcher-Timestamp"]
signature = request.headers["PolicyWatcher-Signature"]
event_id = request.headers["PolicyWatcher-Event-Id"]
raw_body = request.get_data(cache=False, as_text=False)

if not timestamp.isdigit() or re.fullmatch(r"v1=[a-f0-9]{64}", signature) is None:
    raise ValueError("Invalid webhook headers")
if abs(int(time.time()) - int(timestamp)) > 300:
    raise ValueError("Stale webhook timestamp")

message = timestamp.encode() + b"." + raw_body
expected = hmac.new(
    os.environ["POLICYWATCHER_WEBHOOK_SECRET"].encode(),
    message,
    hashlib.sha256,
).hexdigest()

if not hmac.compare_digest(expected, signature[3:]):
    raise ValueError("Invalid webhook signature")

# Check event_id in a bounded replay store before processing.`;

export function getWebhookVerificationKit() {
  return {
    schema: 'https://policywatcher.online/schemas/webhook-verification-kit/v1',
    kitVersion: WEBHOOK_VERIFICATION_KIT_VERSION,
    status: 'readiness-contract' as const,
    deliveryAvailable: false,
    algorithm: 'HMAC-SHA256' as const,
    signatureVersion: WEBHOOK_SIGNATURE_VERSION,
    signedPayloadFormat: '{unix_timestamp}.{raw_request_body}',
    headers: {
      eventId: 'PolicyWatcher-Event-Id',
      timestamp: 'PolicyWatcher-Timestamp',
      signature: 'PolicyWatcher-Signature',
    },
    candidateTimestampToleranceSeconds: WEBHOOK_TOLERANCE_SECONDS,
    testVector: WEBHOOK_TEST_VECTOR,
    testVectorInstructions: [...WEBHOOK_TEST_VECTOR_INSTRUCTIONS],
    conformanceSuite: {
      href: '/api/v1/webhook-conformance-suite',
      schema: 'https://policywatcher.online/schemas/webhook-conformance-suite/v1',
      caseCount: WEBHOOK_CONFORMANCE_CASES.length,
    },
    receiverRequirements: [...WEBHOOK_PRODUCTION_CHECKLIST],
    examples: {
      node: WEBHOOK_NODE_EXAMPLE,
      python: WEBHOOK_PYTHON_EXAMPLE,
    },
    boundary: WEBHOOK_VERIFICATION_BOUNDARY,
  } as const;
}

export type WebhookVerificationKit = ReturnType<typeof getWebhookVerificationKit>;
