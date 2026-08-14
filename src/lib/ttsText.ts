export const MAX_TTS_INPUT_CHARS = 20_000;
export const MAX_TTS_OUTPUT_CHARS = 5_000;

const MARKDOWN_MARKERS = new Set(['#', '*', '`', '_', '~']);

function stripCompletedDelimitedSegments(value: string, open: string, close: string): string {
  const output: string[] = [];
  let pending: string[] | null = null;

  for (const character of value) {
    if (pending) {
      pending.push(character);
      if (character === close) pending = null;
      continue;
    }
    if (character === open) {
      pending = [character];
      continue;
    }
    output.push(character);
  }

  if (pending) {
    for (const character of pending) output.push(character);
  }
  return output.join('');
}

function collapseWhitespace(value: string): string {
  const output: string[] = [];
  let pendingSpace = false;
  for (const character of value) {
    if (character.trim() === '') {
      pendingSpace = output.length > 0;
      continue;
    }
    if (pendingSpace) output.push(' ');
    output.push(character);
    pendingSpace = false;
  }
  return output.join('');
}

export function cleanTextForSpeech(value: string): string {
  const bounded = value.slice(0, MAX_TTS_INPUT_CHARS);
  const withoutLinks = stripCompletedDelimitedSegments(bounded, '[', ']');
  const withoutParentheticals = stripCompletedDelimitedSegments(withoutLinks, '(', ')');
  const formatted: string[] = [];

  for (let index = 0; index < withoutParentheticals.length; index += 1) {
    const character = withoutParentheticals[index];
    if (MARKDOWN_MARKERS.has(character)) continue;
    if (character === '\r' || character === '\n') {
      let lineBreaks = 1;
      while (
        index + 1 < withoutParentheticals.length
        && (withoutParentheticals[index + 1] === '\r' || withoutParentheticals[index + 1] === '\n')
      ) {
        lineBreaks += 1;
        index += 1;
      }
      formatted.push(lineBreaks > 1 ? '. ' : ' ');
      continue;
    }
    if (character === '-' && withoutParentheticals[index + 1] === ' ') {
      formatted.push('. ');
      index += 1;
      continue;
    }
    formatted.push(character);
  }

  return collapseWhitespace(formatted.join('')).slice(0, MAX_TTS_OUTPUT_CHARS);
}
