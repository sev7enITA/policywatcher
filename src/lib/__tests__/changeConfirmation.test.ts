import { describe, expect, it } from 'vitest';
import {
  CHANGE_CONFIRMATION_PENDING_REASON,
  isConsecutiveChangeConfirmation,
} from '../changeConfirmation';

describe('isConsecutiveChangeConfirmation', () => {
  it('confirms the same candidate hash from the immediately preceding scan', () => {
    expect(isConsecutiveChangeConfirmation({
      status: 'Needs Review',
      reason: CHANGE_CONFIRMATION_PENDING_REASON,
      textHash: 'candidate-hash',
    }, 'candidate-hash')).toBe(true);
  });

  it('restarts confirmation when the candidate hash changes', () => {
    expect(isConsecutiveChangeConfirmation({
      status: 'Needs Review',
      reason: CHANGE_CONFIRMATION_PENDING_REASON,
      textHash: 'first-hash',
    }, 'second-hash')).toBe(false);
  });

  it('does not confirm after an intervening unavailable or ordinary check', () => {
    expect(isConsecutiveChangeConfirmation({
      status: 'Unavailable',
      reason: 'http_503',
      textHash: null,
    }, 'candidate-hash')).toBe(false);
    expect(isConsecutiveChangeConfirmation({
      status: 'Available',
      reason: null,
      textHash: 'candidate-hash',
    }, 'candidate-hash')).toBe(false);
  });
});
