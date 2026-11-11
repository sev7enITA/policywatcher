/** Bounded diagnostics only: never persist provider messages, prompts or credentials. */
export class EngineModelError extends Error {
  constructor(code: string, readonly retryAfterMs = 0) { super(code); this.name = 'EngineModelError'; }
}
export function modelFailure(error: unknown): EngineModelError {
  if (error instanceof EngineModelError) return error;
  const value = error && typeof error === 'object' ? error as { status?: unknown; name?: unknown; headers?: unknown; message?: unknown } : {};
  const status = typeof value.status === 'number' && Number.isInteger(value.status) ? value.status : 0;
  // Retry-After is optional SDK metadata. No guesses from free-form messages.
  const headers = value.headers instanceof Headers ? value.headers : null;
  const raw = headers?.get('retry-after');
  const seconds = raw && /^\d+$/.test(raw) ? Number(raw) : 0;
  const delay = Math.min(86_400_000, Math.max(0, seconds * 1000));
  if (status >= 400 && status <= 599) return new EngineModelError(`model_http_${status}`, delay);
  if (typeof value.message === 'string' && /parameter is (?:only supported|not supported)/i.test(value.message)) return new EngineModelError('model_request_invalid');
  if (value.name === 'AbortError' || value.name === 'TimeoutError') return new EngineModelError('model_deadline_exceeded');
  return new EngineModelError('model_transport_error');
}
export const REVIEW_FAILURES = new Set([
  'analysis_context_budget_exceeded', 'analysis_output_budget_exceeded', 'analysis_output_incomplete',
  'analysis_output_invalid_json', 'comparison_budget_exceeded', 'document_size_out_of_bounds', 'artifact_size_limit',
  'analysis_model_configuration_required', 'analysis_model_configuration_invalid', 'analysis_model_pair_not_independent',
  'analysis_credentials_unavailable', 'model_request_invalid', 'model_http_400', 'model_http_401', 'model_http_403', 'model_http_404', 'model_http_429',
]);
// Quota/access failures are review holds for this run, but not a permanent content decision.
export const REASSESSABLE_FAILURES = new Set([
  'evidence_stale', 'verification_model_identity_missing', 'verification_model_not_independent',
  'analysis_model_configuration_required', 'analysis_model_configuration_invalid', 'analysis_model_pair_not_independent',
  'analysis_credentials_unavailable', 'model_request_invalid', 'model_http_400', 'model_http_401', 'model_http_403', 'model_http_404', 'model_http_429',
]);
