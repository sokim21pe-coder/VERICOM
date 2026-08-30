import { InformationState } from "@/types/enums";
import type { DiscoveryFieldId } from "@/lib/tom/discovery-fields";
import { fieldById } from "@/lib/tom/discovery-fields";

export type DiscoveryCapture = {
  field: DiscoveryFieldId;
  value: string;
  informationState: InformationState;
  skipped: boolean;
};

const DECLINE_NEEDLES = [
  "모르겠다",
  "모르겠어",
  "잘 모르",
  "아직 모르",
  "나중에",
  "아직 미정",
  "미정이야",
  "미정입니다",
  "다음에",
  "건너뛰",
  "스킵",
];

const REVERSE_NEEDLES = [
  "몇 개월",
  "얼마나 걸리",
  "보통 매각",
  "어떻게 하",
  "왜 ",
  "무슨 뜻",
  "뭔가요",
  "인가요?",
  "나요?",
  "까요?",
];

const CONTINUE_NEEDLES = ["계속 상담", "이어서", "다음으로", "다음 질문"];

export function isContinuationUtterance(text: string): boolean {
  return CONTINUE_NEEDLES.some((needle) => text.includes(needle));
}

export function isDeclineUtterance(text: string): boolean {
  const compact = text.replace(/\s+/g, "");
  return DECLINE_NEEDLES.some((needle) => compact.includes(needle.replace(/\s+/g, "")));
}

export function isReverseQuestion(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (isDeclineUtterance(trimmed)) return false;
  if (/[?？]/.test(trimmed)) return true;
  return REVERSE_NEEDLES.some((needle) => trimmed.includes(needle));
}

function capture(
  field: DiscoveryFieldId,
  value: string,
  skipped = false,
): DiscoveryCapture {
  return {
    field,
    value: skipped ? "UNKNOWN" : value,
    informationState: skipped ? InformationState.UNKNOWN : InformationState.CONFIRMED,
    skipped,
  };
}

function parseEokAmounts(text: string): number[] {
  const amounts: number[] = [];
  const re = /(\d+(?:\.\d+)?)\s*억/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) != null) {
    const n = Number(match[1]);
    if (Number.isFinite(n)) amounts.push(Math.round(n * 100_000_000));
  }
  return amounts;
}

function hasEbitdaCue(text: string): boolean {
  return /ebitda|에비타|상각\s*전/i.test(text);
}

function hasRevenueCue(text: string): boolean {
  return /매출|수익|턴오버/i.test(text);
}

export function extractDiscoveryFromMessage(input: {
  text: string;
  lastQuestion: DiscoveryFieldId | null;
}): {
  captures: DiscoveryCapture[];
  declinedLast: boolean;
  reverseQuestion: boolean;
} {
  const text = input.text.trim();
  const captures: DiscoveryCapture[] = [];
  const declinedLast = Boolean(input.lastQuestion && isDeclineUtterance(text));
  const reverseQuestion = isReverseQuestion(text);
  const continuation = isContinuationUtterance(text);
  const acceptLastFallback =
    Boolean(input.lastQuestion) &&
    !declinedLast &&
    !reverseQuestion &&
    !continuation &&
    text.length >= 2;

  if (!text) {
    return { captures, declinedLast: false, reverseQuestion: false };
  }

  if (/후계|승계|가업/.test(text)) {
    captures.push(capture("reason_for_sale", "succession"));
    captures.push(capture("seller_objective", "succession"));
  } else if (/은퇴|은퇴하/.test(text)) {
    captures.push(capture("reason_for_sale", "retirement"));
  } else if (/성장|규모 확대|투자 유치/.test(text) && input.lastQuestion === "reason_for_sale") {
    captures.push(capture("reason_for_sale", text.slice(0, 200)));
  } else if (
    input.lastQuestion === "reason_for_sale" &&
    acceptLastFallback &&
    !/매각하고\s*싶/.test(text)
  ) {
    captures.push(capture("reason_for_sale", text.slice(0, 200)));
  }

  if (/탐색|알아보|정보만|아직 고민/.test(text)) {
    captures.push(capture("sale_readiness", "EXPLORING"));
  } else if (/구체적으로 검토|준비 중|준비중/.test(text)) {
    captures.push(capture("sale_readiness", "CONSIDERING"));
  } else if (/바로 진행|적극적으로|지금 매각/.test(text)) {
    captures.push(capture("sale_readiness", "READY"));
  } else if (input.lastQuestion === "sale_readiness" && acceptLastFallback) {
    captures.push(capture("sale_readiness", text.slice(0, 80)));
  }

  if (/전체\s*지분|100\s*%|전부\s*매각|지분\s*전부/.test(text)) {
    captures.push(capture("sale_scope", "100_PERCENT"));
  } else if (/과반|경영권|majority/i.test(text)) {
    captures.push(capture("sale_scope", "MAJORITY"));
  } else if (/일부\s*지분|소수\s*지분|minority/i.test(text)) {
    captures.push(capture("sale_scope", "MINORITY"));
  } else if (/자산\s*매각|영업양도|asset/i.test(text)) {
    captures.push(capture("sale_scope", "ASSET"));
  } else if (input.lastQuestion === "sale_scope" && acceptLastFallback) {
    captures.push(capture("sale_scope", text.slice(0, 80)));
  }

  if (
    input.lastQuestion === "desired_timeline" &&
    acceptLastFallback
  ) {
    captures.push(capture("desired_timeline", text.slice(0, 120)));
  } else if (/올해|내년|상반기|하반기|\d+\s*개월/.test(text) && !reverseQuestion) {
    captures.push(capture("desired_timeline", text.slice(0, 120)));
  }

  if (
    input.lastQuestion === "valuation_expectation" &&
    acceptLastFallback
  ) {
    captures.push(capture("valuation_expectation", text.slice(0, 120)));
  } else if (/희망\s*가|가치는|밸류|가격은/.test(text) && parseEokAmounts(text).length > 0) {
    captures.push(capture("valuation_expectation", text.slice(0, 120)));
  }

  const amounts = parseEokAmounts(text);
  if (amounts.length > 0) {
    if (hasRevenueCue(text) && hasEbitdaCue(text) && amounts.length >= 2) {
      captures.push(capture("revenue", String(amounts[0])));
      captures.push(capture("ebitda", String(amounts[1])));
    } else if (hasEbitdaCue(text)) {
      captures.push(capture("ebitda", String(amounts[0])));
    } else if (hasRevenueCue(text) || input.lastQuestion === "revenue") {
      captures.push(capture("revenue", String(amounts[0])));
      if (hasEbitdaCue(text) && amounts[1] != null) {
        captures.push(capture("ebitda", String(amounts[1])));
      }
    } else if (input.lastQuestion === "ebitda") {
      captures.push(capture("ebitda", String(amounts[0])));
    } else if (input.lastQuestion === "valuation_expectation") {
      captures.push(capture("valuation_expectation", String(amounts[0])));
    }
  }

  if (
    input.lastQuestion === "key_products_services" &&
    acceptLastFallback
  ) {
    captures.push(capture("key_products_services", text.slice(0, 200)));
  }
  if (
    input.lastQuestion === "buyer_preference" &&
    acceptLastFallback
  ) {
    captures.push(capture("buyer_preference", text.slice(0, 200)));
  }
  if (
    input.lastQuestion === "preferred_structure" &&
    acceptLastFallback
  ) {
    captures.push(capture("preferred_structure", text.slice(0, 120)));
  }
  if (
    input.lastQuestion === "management_retention" &&
    acceptLastFallback
  ) {
    captures.push(capture("management_retention", text.slice(0, 120)));
  }
  if (
    input.lastQuestion === "confidentiality" &&
    acceptLastFallback
  ) {
    captures.push(capture("confidentiality", text.slice(0, 200)));
  }
  if (
    input.lastQuestion === "seller_objective" &&
    acceptLastFallback &&
    !captures.some((item) => item.field === "seller_objective")
  ) {
    captures.push(capture("seller_objective", text.slice(0, 200)));
  }

  if (declinedLast && input.lastQuestion && fieldById(input.lastQuestion)) {
    if (!captures.some((item) => item.field === input.lastQuestion)) {
      captures.push(capture(input.lastQuestion, "UNKNOWN", true));
    }
  }

  const unique = new Map<DiscoveryFieldId, DiscoveryCapture>();
  for (const item of captures) {
    unique.set(item.field, item);
  }

  return {
    captures: [...unique.values()],
    declinedLast,
    reverseQuestion: reverseQuestion && unique.size === 0,
  };
}

export function reverseQuestionAnswer(lastQuestion: DiscoveryFieldId | null): string {
  if (lastQuestion === "desired_timeline") {
    return "중소·중견 비상장 M&A는 준비 상태와 실사 범위 등에 따라 기간이 크게 달라질 수 있습니다. 미국 미드마켓도 딜마다 일정이 달라, 하나의 표준 개월 수로 단정하지 않습니다.";
  }
  if (lastQuestion === "valuation_expectation") {
    return "희망 가격은 참고 의견일 뿐이고, 이번 단계에서는 기업가치를 계산하거나 확정하지 않습니다.";
  }
  if (lastQuestion === "sale_scope") {
    return "전체 지분, 일부 지분, 자산 매각은 세금·계약·승계 조건이 달라질 수 있어 선호를 먼저 여쭙습니다.";
  }
  return "질문해 주셔서 감사합니다. 일반론으로만 안내하며, 실제 딜 경험이나 확정 일정을 가진 것처럼 말씀드리지 않습니다.";
}
