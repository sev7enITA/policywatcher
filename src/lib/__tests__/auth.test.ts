import { afterEach, describe, expect, it, vi } from 'vitest';
import { isAuthorized } from '../auth';

function requestWithAuth(value?: string) {
  return new Request('https://policywatcher.test/api/health', {
    headers: value ? { Authorization: value } : undefined,
  });
}

describe('auth', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('rejects every request when API_SECRET is missing', () => {
    vi.stubEnv('API_SECRET', '');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(isAuthorized(requestWithAuth('Bearer anything'))).toBe(false);
    expect(warn).toHaveBeenCalledWith('[Auth] API_SECRET not set. Rejecting all requests.');
  });

  it('requires an exact bearer token match', () => {
    vi.stubEnv('API_SECRET', 'policy-secret');

    expect(isAuthorized(requestWithAuth('Bearer policy-secret'))).toBe(true);
    expect(isAuthorized(requestWithAuth('Bearer wrong-secret'))).toBe(false);
    expect(isAuthorized(requestWithAuth('Basic policy-secret'))).toBe(false);
    expect(isAuthorized(requestWithAuth('Bearer policy-secret extra'))).toBe(false);
    expect(isAuthorized(requestWithAuth())).toBe(false);
  });

  it('rejects same-prefix tokens without leaking length-timing shortcuts', () => {
    vi.stubEnv('API_SECRET', 'policy-secret');

    expect(isAuthorized(requestWithAuth('Bearer policy-secret-plus'))).toBe(false);
    expect(isAuthorized(requestWithAuth('Bearer policy-secre'))).toBe(false);
  });
});
