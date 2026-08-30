import { InformationState } from "@/types/enums";
import type { TomIntentRouter } from "@/types/tom";

export type IntentMatchKind = "exact" | "rule" | "none";

export type RoutedIntent = {
  intent: TomIntentRouter;
  value: TomIntentRouter;
  source: "rule";
  confidence: number;
  match: IntentMatchKind;
  informationState: InformationState;
};

const EXACT_CONFIDENCE = 1.0;
const RULE_CONFIDENCE = 0.8;
const UNKNOWN_CONFIDENCE = 0;

type IntentRule = {
  intent: TomIntentRouter;
  informationState: InformationState;
  exact: string[];
  needles: string[];
};

/**
 * 더 구체적인 규칙을 앞에 둔다.
 * 매각 확정 의사·정확한 숫자 등 Critical Fact는 여기서 만들지 않는다.
 */
const RULES: IntentRule[] = [
  {
    intent: "DOCUMENT",
    informationState: InformationState.CONFIRMED,
    exact: ["티저를 만들고 싶다", "티저를 만들고 싶습니다", "티저를 만들고 싶어요"],
    needles: ["티저를 만들", "티저 만들", "티저 작성", "티저부터"],
  },
  {
    intent: "VALUATION",
    informationState: InformationState.ESTIMATED,
    exact: [
      "내 회사 가치가 궁금하다",
      "내 회사 가치가 궁금합니다",
      "내 회사 가치가 궁금해요",
    ],
    needles: ["가치가 궁금", "기업가치", "회사 가치", "밸류에이션", "기업 가치"],
  },
  {
    intent: "FUNDRAISE",
    informationState: InformationState.CONFIRMED,
    exact: ["투자유치를 하고 싶다", "투자유치를 하고 싶습니다"],
    needles: ["투자유치", "투자 유치", "자금조달", "펀딩"],
  },
  {
    intent: "SUCCESSION",
    informationState: InformationState.CONFIRMED,
    exact: ["승계를 하고 싶다", "승계를 하고 싶습니다"],
    needles: ["승계", "가업"],
  },
  {
    intent: "PARTNERSHIP",
    informationState: InformationState.CONFIRMED,
    exact: ["파트너십을 하고 싶다", "파트너십을 하고 싶습니다"],
    needles: ["파트너십", "제휴", "조인트벤처", "공동사업"],
  },
  {
    intent: "DEAL_PROGRESS",
    informationState: InformationState.CONFIRMED,
    exact: ["거래 진행이 궁금하다", "딜 진행이 궁금합니다"],
    needles: ["딜 진행", "거래 진행", "진행 상황", "거래 상황"],
  },
  {
    intent: "SELL",
    informationState: InformationState.CONFIRMED,
    exact: [
      "회사를 매각하고 싶다",
      "회사를 매각하고 싶습니다",
      "회사를 매각하고 싶어요",
      "기업을 팔고 싶다",
      "기업을 팔고 싶습니다",
      "기업을 팔고 싶어요",
      "인수자를 찾고 싶다",
      "인수자를 찾고 싶습니다",
      "인수자를 찾고 싶어요",
    ],
    needles: [
      "매각하고",
      "매각 하",
      "회사를 팔",
      "기업을 팔",
      "지분 매각",
      "엑시트",
      "인수자를 찾",
    ],
  },
  {
    intent: "BUY",
    informationState: InformationState.CONFIRMED,
    exact: [
      "기업을 인수하고 싶다",
      "기업을 인수하고 싶습니다",
      "기업을 인수하고 싶어요",
    ],
    needles: ["인수하고", "인수할", "인수 하", "회사를 사", "매수"],
  },
  {
    intent: "UNDECIDED",
    informationState: InformationState.CONFIRMED,
    exact: ["아직 결정하지 않았다", "아직 결정하지 않았습니다"],
    needles: ["모르겠어", "무엇부터", "아직 결정", "잘 모르겠"],
  },
  {
    intent: "GENERAL_MA",
    informationState: InformationState.CONFIRMED,
    exact: ["인수합병이 궁금하다", "m&a가 궁금합니다"],
    needles: ["인수합병", "m&a", "엠앤에이"],
  },
];

export const INTENT_MEMORY_KEY = "intent_router";

export function normalizeIntentText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function compactForMatch(text: string): string {
  return normalizeIntentText(text)
    .replace(/[.!?。…,~]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function unknownIntent(): RoutedIntent {
  return {
    intent: "UNKNOWN",
    value: "UNKNOWN",
    source: "rule",
    confidence: UNKNOWN_CONFIDENCE,
    match: "none",
    informationState: InformationState.UNKNOWN,
  };
}

/** 규칙 기반 Intent Router. LLM을 호출하지 않는다. */
export function routeIntent(text: string): RoutedIntent {
  const normalized = normalizeIntentText(text);
  if (!normalized) return unknownIntent();

  const compact = compactForMatch(normalized);

  for (const rule of RULES) {
    if (rule.exact.some((phrase) => compact === compactForMatch(phrase))) {
      return {
        intent: rule.intent,
        value: rule.intent,
        source: "rule",
        confidence: EXACT_CONFIDENCE,
        match: "exact",
        informationState: rule.informationState,
      };
    }
  }

  for (const rule of RULES) {
    if (rule.needles.some((needle) => compact.includes(compactForMatch(needle)))) {
      return {
        intent: rule.intent,
        value: rule.intent,
        source: "rule",
        confidence: RULE_CONFIDENCE,
        match: "rule",
        informationState: rule.informationState,
      };
    }
  }

  return unknownIntent();
}

export function shouldReplaceIntent(
  previous: RoutedIntent | null,
  incoming: RoutedIntent,
): boolean {
  if (!previous) return incoming.intent !== "UNKNOWN" || incoming.confidence > 0;
  if (incoming.intent === previous.intent) {
    return incoming.confidence >= previous.confidence;
  }
  if (incoming.intent === "UNKNOWN") return false;
  if (previous.intent === "UNKNOWN") return true;
  if (incoming.confidence > previous.confidence) return true;
  if (
    incoming.informationState === InformationState.CONFIRMED &&
    previous.informationState !== InformationState.CONFIRMED
  ) {
    return true;
  }
  return false;
}

export function mergeRoutedIntent(
  previous: RoutedIntent | null,
  incoming: RoutedIntent,
): { next: RoutedIntent; changed: boolean } {
  if (!previous) {
    return { next: incoming, changed: true };
  }
  if (!shouldReplaceIntent(previous, incoming)) {
    return { next: previous, changed: false };
  }
  const same =
    previous.intent === incoming.intent &&
    previous.confidence === incoming.confidence &&
    previous.informationState === incoming.informationState;
  return { next: incoming, changed: !same };
}

export const intentRouterLabel: Record<TomIntentRouter, string> = {
  SELL: "기업 매각",
  BUY: "기업 인수",
  FUNDRAISE: "투자유치",
  SUCCESSION: "승계",
  PARTNERSHIP: "파트너십",
  VALUATION: "기업가치 문의",
  DEAL_PROGRESS: "거래 진행",
  DOCUMENT: "문서",
  GENERAL_MA: "일반 M&A",
  UNDECIDED: "아직 결정 전",
  UNKNOWN: "미분류",
};

export function replyForIntent(intent: TomIntentRouter): string {
  if (intent === "SELL") {
    return "매각을 검토 중이시군요.\n회사 기본정보부터 확인하겠습니다.";
  }
  if (intent === "BUY") {
    return "인수 검토로 이해했습니다.\n찾고 계신 조건을 알려 주세요.";
  }
  if (intent === "VALUATION") {
    return "기업가치 문의로 이해했습니다.\n이번 단계에서는 가치를 계산하지 않습니다. 상담 방향부터 확인하겠습니다.";
  }
  if (intent === "DOCUMENT") {
    return "문서 요청으로 이해했습니다.\n티저·NDA 작성은 후속 단계입니다.";
  }
  if (intent === "FUNDRAISE") {
    return "투자유치 검토로 이해했습니다.\n회사 기본정보부터 확인하겠습니다.";
  }
  if (intent === "SUCCESSION") {
    return "승계 검토로 이해했습니다.\n회사 기본정보부터 확인하겠습니다.";
  }
  if (intent === "PARTNERSHIP") {
    return "파트너십 검토로 이해했습니다.\n원하시는 협력 형태를 알려 주세요.";
  }
  if (intent === "DEAL_PROGRESS") {
    return "거래 진행 문의로 이해했습니다.\n현재 단계는 상담 기록 저장입니다.";
  }
  if (intent === "GENERAL_MA") {
    return "M&A 일반 문의로 이해했습니다.\n매각, 인수, 기업가치 중 어디에 가까운지 알려 주세요.";
  }
  if (intent === "UNDECIDED") {
    return "아직 방향을 정하지 않으셨군요.\n매각, 인수, 기업가치 중 가까운 쪽을 알려 주세요.";
  }
  return "말씀해 주신 내용을 저장했습니다.\n매각, 인수, 기업가치 중 어디에 가까운지 알려 주세요.";
}

export function parseRoutedIntent(
  value: string | null | undefined,
  informationState?: string | null,
  confidence?: number | null,
): RoutedIntent | null {
  if (!value) return null;
  const intent = value as TomIntentRouter;
  if (!(intent in intentRouterLabel)) return null;
  const state =
    informationState === InformationState.CONFIRMED
      ? InformationState.CONFIRMED
      : informationState === InformationState.ESTIMATED
        ? InformationState.ESTIMATED
        : intent === "UNKNOWN"
          ? InformationState.UNKNOWN
          : InformationState.UNKNOWN;
  const conf =
    typeof confidence === "number" && Number.isFinite(confidence)
      ? confidence
      : intent === "UNKNOWN"
        ? UNKNOWN_CONFIDENCE
        : RULE_CONFIDENCE;
  return {
    intent,
    value: intent,
    source: "rule",
    confidence: conf,
    match: conf >= EXACT_CONFIDENCE ? "exact" : conf > 0 ? "rule" : "none",
    informationState: state,
  };
}
