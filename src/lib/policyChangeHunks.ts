import { diffLines, diffWordsWithSpace, type ChangeObject } from 'diff';

export interface ChangeHunk {
  oldStart: number;
  oldEnd: number;
  newStart: number;
  newEnd: number;
  precision?: 'block';
}

const MAX_WORD_INPUT = 500_000;
const MAX_REFINEMENT_INPUT = 24_000;
const WORD_EDIT_LIMIT = 512;
// A conservative bound on the cumulative edit search across changed blocks.
const REFINEMENT_WORK = 32 * WORD_EDIT_LIMIT ** 2;

function hunksFromParts(parts: ChangeObject<string>[], oldOffset = 0, newOffset = 0): ChangeHunk[] {
  const hunks: ChangeHunk[] = [];
  let active: ChangeHunk | undefined;
  for (const part of parts) {
    if (part.added || part.removed) {
      if (!active) {
        active = { oldStart: oldOffset, oldEnd: oldOffset, newStart: newOffset, newEnd: newOffset };
        hunks.push(active);
      }
      if (part.removed) oldOffset += part.value.length;
      if (part.added) newOffset += part.value.length;
      active.oldEnd = oldOffset;
      active.newEnd = newOffset;
    } else {
      active = undefined;
      oldOffset += part.value.length;
      newOffset += part.value.length;
    }
  }
  return hunks;
}

function narrowBlock(oldText: string, newText: string, hunk: ChangeHunk): ChangeHunk {
  let { oldStart, oldEnd, newStart, newEnd } = hunk;
  while (oldStart < oldEnd && newStart < newEnd && oldText[oldStart] === newText[newStart]) {
    oldStart++;
    newStart++;
  }
  while (oldStart < oldEnd && newStart < newEnd && oldText[oldEnd - 1] === newText[newEnd - 1]) {
    oldEnd--;
    newEnd--;
  }
  return {
    oldStart, oldEnd, newStart, newEnd,
    ...(oldStart < oldEnd && newStart < newEnd ? { precision: 'block' as const } : {}),
  };
}

/** Return ordered ranges into the original strings. Text between ranges is identical on both sides. */
export function compareSnapshotText(oldText: string, newText: string): ChangeHunk[] {
  const words = Math.max(oldText.length, newText.length) <= MAX_WORD_INPUT
    ? diffWordsWithSpace(oldText, newText, { maxEditLength: WORD_EDIT_LIMIT })
    : undefined;
  if (words) return hunksFromParts(words);

  const lines = diffLines(oldText, newText, { maxEditLength: 1024 });
  // If line alignment also exhausts its budget, retain the exact matching edges
  // and expose the remaining window as a block that requires review.
  const blocks = lines ? hunksFromParts(lines) : [{
    oldStart: 0, oldEnd: oldText.length, newStart: 0, newEnd: newText.length,
  }];
  let workLeft = REFINEMENT_WORK;
  return blocks.flatMap(region => {
    const block = narrowBlock(oldText, newText, region);
    if (!block.precision) return [block];

    const inputSize = block.oldEnd - block.oldStart + block.newEnd - block.newStart;
    const maxEditLength = Math.min(WORD_EDIT_LIMIT, inputSize);
    const work = maxEditLength ** 2;
    if (inputSize <= MAX_REFINEMENT_INPUT && work <= workLeft) {
      workLeft -= work;
      const exact = diffWordsWithSpace(oldText.slice(block.oldStart, block.oldEnd),
        newText.slice(block.newStart, block.newEnd), { maxEditLength });
      if (exact) return hunksFromParts(exact, block.oldStart, block.newStart);
    }
    return [block];
  });
}
