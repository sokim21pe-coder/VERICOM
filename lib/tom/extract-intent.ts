import { InformationState } from "@/types/enums";
import type { TomIntentRouter } from "@/types/tom";

export type ExtractedIntent = {
  router: TomIntentRouter;
  state: InformationState;
};

const patterns: { router: TomIntentRouter; state: InformationState; needles: string[] }[] =
  [
    {
      router: "FUNDRAISE",
      state: InformationState.CONFIRMED,
      needles: ["투자유치", "투자 유치", "자금조달", "펀딩"],
    },
    {
      router: "SUCCESSION",
      state: InformationState.CONFIRMED,
      needles: ["승계", "가업"],
    },
    {
      router: "PARTNERSHIP",
      state: InformationState.CONFIRMED,
      needles: ["파트너십", "제휴", "조인트벤처", "공동사업"],
    },
    {
      router: "SELL",
      state: InformationState.CONFIRMED,
      needles: ["매각하고", "매각 하", "회사를 팔", "지분 매각", "엑시트"],
    },
    {
      router: "BUY",
      state: InformationState.CONFIRMED,
      needles: ["인수할", "인수 하", "회사를 사", "매수", "인수하고"],
    },
    {
      router: "UNDECIDED",
      state: InformationState.CONFIRMED,
      needles: ["모르겠어", "무엇부터", "아직 결정", "잘 모르겠"],
    },
    {
      router: "SELL",
      state: InformationState.ESTIMATED,
      needles: ["기업가치", "회사 가치", "얼마", "밸류"],
    },
    {
      router: "BUY",
      state: InformationState.ESTIMATED,
      needles: ["찾고 있", "타깃", "인수 후보"],
    },
  ];

function includesNeedle(text: string, needle: string): boolean {
  return text.includes(needle);
}

/** 규칙 기반. LLM이 매각의사·숫자를 추정하지 않는다. */
export function extractIntentFromUtterance(text: string): ExtractedIntent {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return { router: "UNDECIDED", state: InformationState.UNKNOWN };
  }

  for (const rule of patterns) {
    if (rule.needles.some((needle) => includesNeedle(normalized, needle))) {
      return { router: rule.router, state: rule.state };
    }
  }

  return { router: "UNDECIDED", state: InformationState.UNKNOWN };
}

export function mergeExtractedIntent(
  previous: ExtractedIntent | null,
  incoming: ExtractedIntent,
): ExtractedIntent {
  if (!previous) return incoming;

  if (incoming.state === InformationState.CONFIRMED) {
    return incoming;
  }

  if (previous.state === InformationState.CONFIRMED) {
    return previous;
  }

  if (
    incoming.state === InformationState.ESTIMATED &&
    previous.state !== InformationState.ESTIMATED
  ) {
    return incoming;
  }

  if (previous.state === InformationState.ESTIMATED) {
    return previous;
  }

  return incoming;
}

export const intentRouterLabel: Record<TomIntentRouter, string> = {
  SELL: "기업 매각",
  BUY: "기업 인수",
  FUNDRAISE: "투자유치",
  SUCCESSION: "승계",
  PARTNERSHIP: "파트너십",
  UNDECIDED: "아직 결정 전",
};

export const informationStateLabel: Record<InformationState, string> = {
  [InformationState.CONFIRMED]: "확인됨",
  [InformationState.ESTIMATED]: "추정",
  [InformationState.UNKNOWN]: "미확인",
};
