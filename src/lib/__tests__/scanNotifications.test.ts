import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ recipients: vi.fn(), alert: vi.fn(), suspension: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: { subscriber: { findMany: mocks.recipients } } }));
vi.mock('@/lib/mailer', () => ({ sendPolicyChangeAlert: mocks.alert, sendSourceSuspensionAdminAlert: mocks.suspension, maskEmailForLog: () => 'masked' }));
import { deliverScanNotifications } from '../scanNotifications';
import type { ChangedPolicySummary, SourceSuspensionAlert } from '../mailer';
const changed = [{ region: 'EU', industry: 'FinTech' }] as ChangedPolicySummary[];
const unavailable = [{ policyId: 'test-only' }] as SourceSuspensionAlert[];
describe('scan notification policy', () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.recipients.mockResolvedValue([{ email: 'subscriber@example.test', regions: 'EU', industries: 'FinTech', unsubscribeToken: 'test-only' }]); });
  it('suppresses recipient lookup and both email paths even with changes and unavailable sources', async () => {
    await deliverScanNotifications('silent', changed, unavailable);
    expect(mocks.recipients).not.toHaveBeenCalled();
    expect(mocks.alert).not.toHaveBeenCalled();
    expect(mocks.suspension).not.toHaveBeenCalled();
  });
  it('retains subscribed-region filtering and admin alerts in subscriber mode', async () => {
    await deliverScanNotifications('subscribers', changed, unavailable);
    expect(mocks.recipients).toHaveBeenCalledWith({ where: { isActive: true, frequency: 'INSTANT' } });
    expect(mocks.alert).toHaveBeenCalledTimes(1);
    expect(mocks.suspension).toHaveBeenCalledTimes(1);
    mocks.alert.mockClear();
    await deliverScanNotifications('subscribers', [{ region: 'US', industry: 'FinTech' }] as ChangedPolicySummary[], []);
    expect(mocks.alert).not.toHaveBeenCalled();
  });
});
