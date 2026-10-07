export const CHANGE_CONFIRMATION_PENDING_REASON = 'change_confirmation_pending';

export interface ChangeConfirmationLog {
  status?: string | null;
  reason?: string | null;
  textHash?: string | null;
  source?: string | null;
}

/**
 * A policy change is publishable only when the immediately preceding check of
 * that policy recorded the same candidate hash. Any intervening failure,
 * recovery to the baseline, or different candidate restarts confirmation.
 */
export function isConsecutiveChangeConfirmation(
  latestCheckLog: ChangeConfirmationLog | null | undefined,
  candidateHash: string,
  profileHash?: string,
): boolean {
  return latestCheckLog?.status === 'Needs Review'
    && latestCheckLog.reason === confirmationReason(profileHash)
    && (!profileHash || ['direct', 'http2', 'rendered'].includes(latestCheckLog.source || ''))
    && latestCheckLog.textHash === candidateHash;
}

export function confirmationReason(profileHash?: string) {
  return profileHash ? `${CHANGE_CONFIRMATION_PENDING_REASON}:${profileHash}` : CHANGE_CONFIRMATION_PENDING_REASON;
}

export function isPendingConfirmationReason(reason?: string | null): boolean {
  return reason === CHANGE_CONFIRMATION_PENDING_REASON
    || /^change_confirmation_pending:[a-f0-9]{64}$/.test(reason || '');
}
