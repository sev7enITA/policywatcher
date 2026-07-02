import { describe, expect, it } from 'vitest';
import { parseDiff, parseUnifiedPatch, tryParseJsonChunks } from '../diffParse';

describe('diffParse', () => {
  it('parses stored JSON chunks safely', () => {
    expect(tryParseJsonChunks('[{"value":"new text","added":true}]')).toEqual([
      { value: 'new text', added: true },
    ]);
    expect(tryParseJsonChunks('not json')).toBeNull();
    expect(tryParseJsonChunks('[{"bad":"shape"}]')).toBeNull();
  });

  it('normalizes unified patch lines into renderable chunks', () => {
    const chunks = parseUnifiedPatch('--- old\n+++ new\n@@ -1 +1 @@\n-old\n+new\n same');
    expect(chunks).toEqual([
      { value: '\n' },
      { value: 'old\n', removed: true },
      { value: 'new\n', added: true },
      { value: 'same' },
    ]);
  });

  it('routes simple plus/minus diffs through the same parser', () => {
    expect(parseDiff('+ added\n- removed')).toEqual([
      { value: ' added\n', added: true },
      { value: ' removed\n', removed: true },
    ]);
  });
});
