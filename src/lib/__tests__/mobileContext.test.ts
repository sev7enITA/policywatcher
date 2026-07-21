import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { shouldSuggestOnTheGo } from '../mobileContext';

describe('mobile context', () => {
  it('uses viewport and pointer context without requiring motion sensors', () => {
    expect(shouldSuggestOnTheGo({ smallScreen: true, coarsePointer: false, viewportWidth: 1200 })).toBe(true);
    expect(shouldSuggestOnTheGo({ smallScreen: false, coarsePointer: true, viewportWidth: 800 })).toBe(true);
    expect(shouldSuggestOnTheGo({ smallScreen: false, coarsePointer: true, viewportWidth: 1200 })).toBe(false);
  });

  it('does not register a continuous device-motion listener on the landing page', () => {
    const page = readFileSync('src/app/page.tsx', 'utf8');
    expect(page).not.toContain('devicemotion');
    expect(page).not.toContain('DeviceMotionEvent');
  });
});
