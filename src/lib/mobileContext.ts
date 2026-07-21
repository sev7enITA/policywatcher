export function shouldSuggestOnTheGo(input: {
  smallScreen: boolean;
  coarsePointer: boolean;
  viewportWidth: number;
}) {
  return input.smallScreen || (input.coarsePointer && input.viewportWidth < 920);
}
