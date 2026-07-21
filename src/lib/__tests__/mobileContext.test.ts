import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDeferredViewportEvaluator, shouldSuggestOnTheGo } from '../mobileContext';

afterEach(() => {
  vi.useRealTimers();
});

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
    expect(page).toContain('window.screen.orientation');
    expect(page).toContain("orientation.addEventListener('change', handleOrientation)");
    expect(page).toContain("window.addEventListener('orientationchange', handleOrientation)");
  });

  it('defers and coalesces orientation viewport reads', () => {
    vi.useFakeTimers();
    const evaluate = vi.fn();
    const evaluator = createDeferredViewportEvaluator(evaluate, 100);

    evaluator.schedule();
    evaluator.schedule();
    vi.advanceTimersByTime(99);
    expect(evaluate).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(evaluate).toHaveBeenCalledTimes(1);
  });

  it('cancels a pending viewport read during cleanup', () => {
    vi.useFakeTimers();
    const evaluate = vi.fn();
    const evaluator = createDeferredViewportEvaluator(evaluate, 100);

    evaluator.schedule();
    evaluator.cancel();
    vi.runAllTimers();
    expect(evaluate).not.toHaveBeenCalled();
  });
});
