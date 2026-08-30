import { InformationState } from "@/types/enums";
import type { TomIntentRouter } from "@/types/tom";
import {
  intentRouterLabel,
  mergeRoutedIntent,
  routeIntent,
  type RoutedIntent,
} from "@/lib/tom/intent-router";

export type ExtractedIntent = {
  router: TomIntentRouter;
  state: InformationState;
};

function toExtracted(routed: RoutedIntent): ExtractedIntent {
  return { router: routed.intent, state: routed.informationState };
}

function fromExtracted(item: ExtractedIntent): RoutedIntent {
  return {
    intent: item.router,
    value: item.router,
    source: "rule",
    confidence:
      item.state === InformationState.CONFIRMED
        ? 1
        : item.state === InformationState.ESTIMATED
          ? 0.8
          : 0,
    match:
      item.state === InformationState.CONFIRMED
        ? "exact"
        : item.state === InformationState.ESTIMATED
          ? "rule"
          : "none",
    informationState: item.state,
  };
}

/** 규칙 기반. LLM이 매각의사·숫자를 추정하지 않는다. */
export function extractIntentFromUtterance(text: string): ExtractedIntent {
  return toExtracted(routeIntent(text));
}

export function mergeExtractedIntent(
  previous: ExtractedIntent | null,
  incoming: ExtractedIntent,
): ExtractedIntent {
  return toExtracted(
    mergeRoutedIntent(
      previous ? fromExtracted(previous) : null,
      fromExtracted(incoming),
    ).next,
  );
}

export { intentRouterLabel };

export const informationStateLabel: Record<InformationState, string> = {
  [InformationState.CONFIRMED]: "확인됨",
  [InformationState.ESTIMATED]: "추정",
  [InformationState.UNKNOWN]: "미확인",
};
