export function shouldSuggestOnTheGo(input: {
  smallScreen: boolean;
  coarsePointer: boolean;
  viewportWidth: number;
}) {
  return input.smallScreen || (input.coarsePointer && input.viewportWidth < 920);
}

export function createDeferredViewportEvaluator(evaluate: () => void, delayMs = 100) {
  let timer: ReturnType<typeof setTimeout> | null = null;

  return {
    schedule() {
      if (timer !== null) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        evaluate();
      }, delayMs);
    },
    cancel() {
      if (timer !== null) clearTimeout(timer);
      timer = null;
    },
  };
}
