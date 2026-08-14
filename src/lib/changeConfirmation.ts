export const CHANGE_CONFIRMATION_PENDING_REASON = 'change_confirmation_pending';

export interface ChangeConfirmationLog {
  status?: string | null;
  reason?: string | null;
  textHash?: string | null;
}

/**
 * A policy change is publishable only when the immediately preceding check of
 * that policy recorded the same candidate hash. Any intervening failure,
 * recovery to the baseline, or different candidate restarts confirmation.
 */
export function isConsecutiveChangeConfirmation(
  latestCheckLog: ChangeConfirmationLog | null | undefined,
  candidateHash: string,
): boolean {
  return latestCheckLog?.status === 'Needs Review'
    && latestCheckLog.reason === CHANGE_CONFIRMATION_PENDING_REASON
    && latestCheckLog.textHash === candidateHash;
}
