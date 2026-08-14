import { describe, expect, it } from 'vitest';
import { cleanTextForSpeech } from '../ttsText';

describe('cleanTextForSpeech', () => {
  it('removes completed markdown groups and keeps readable text', () => {
    const cleaned = cleanTextForSpeech('# Policy update\n\n[private link](https://example.test)\n- Retention changed');

    expect(cleaned).toContain('Policy update');
    expect(cleaned).toContain('Retention changed');
    expect(cleaned).not.toContain('private link');
    expect(cleaned).not.toContain('example.test');
  });

  it('bounds adversarial unmatched delimiters without catastrophic backtracking', () => {
    const cleaned = cleanTextForSpeech(`${'['.repeat(100_000)}safe`);

    expect(cleaned).toHaveLength(5_000);
  });
});
