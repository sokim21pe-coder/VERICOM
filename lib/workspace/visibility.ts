import { DealRole, InformationState, PlatformRole } from "@/types/enums";
import type { CurrentContext } from "@/types/context";
import type { TomMemoryItem, TomMessage } from "@/types/tom";
import {
  INTENT_MEMORY_KEY,
  intentRouterLabel,
} from "@/lib/tom/intent-router";
import {
  parseMultiCriterion,
  parseNumericCriterion,
} from "@/lib/tom/criteria-value";
import {
  classifyDiscoveryFields,
  discoveryProfileFrom,
  getNextBestQuestion,
  type DiscoveryContextFacts,
} from "@/lib/tom/question-policy";
import {
  fieldById,
  isSkippedMemoryState,
  type DiscoveryFieldId,
  type DiscoveryProfile,
} from "@/lib/tom/discovery-fields";
import type { NormalizedAcquisitionCriteria } from "@/lib/tom/normalize-acquisition-criteria";
import {
  formatKrwEok,
  formatNormalizedCriteriaSummary,
} from "@/lib/tom/normalize-acquisition-criteria";
import {
  formatKrwEokLabel,
  type NormalizedFinancialAmount,
  type NormalizedFinancialInputs,
} from "@/lib/valuation/normalize-financial-inputs";
import type {
  BenchmarkApprovalStatus,
  ValuationCalculation,
  ValuationCalculationStatus,
} from "@/types/valuation";
import {
  sellerLevel0Presentation,
  type SellerLevel0Presentation,
} from "@/lib/valuation/seller-level0-presentation";
import { sellerLevel1Presentation } from "@/lib/valuation/seller-level1-presentation";

export const SELLER_HOME_FIELDS: { id: DiscoveryFieldId; label: string }[] = [
  { id: "reason_for_sale", label: "매각 이유" },
  { id: "sale_scope", label: "매각 범위" },
  { id: "desired_timeline", label: "희망 시점" },
  { id: "valuation_expectation", label: "기대 가치" },
];

export const BUYER_HOME_FIELDS: { id: DiscoveryFieldId; label: string }[] = [
  { id: "acquisition_objective", label: "인수 목적" },
  { id: "target_industries", label: "관심 산업" },
  { id: "target_geographies", label: "관심 지역" },
  { id: "investment_size_max", label: "투자 한도" },
  { id: "listing_preference", label: "상장 여부" },
  { id: "target_businesses", label: "관심 사업" },
];

const INDUSTRY_KO: Record<string, string> = {
  ENERGY: "에너지",
  BATTERY: "배터리",
  SECONDARY_BATTERY: "이차전지",
  BMS: "BMS",
  ESS: "ESS",
  RECYCLING: "재활용",
  AUTOMOTIVE: "자동차",
  SEMICONDUCTOR: "반도체",
  SOFTWARE: "소프트웨어",
  MANUFACTURING: "제조",
  HEALTHCARE: "헬스케어",
  CONSUMER: "소비재",
  OTHER: "기타",
};

const OWNERSHIP_KO: Record<string, string> = {
  FULL_ACQUISITION: "100% 인수",
  CONTROL: "경영권",
  MAJORITY: "과반",
  MINORITY: "소수 지분",
  FLEXIBLE: "유연",
  UNDECIDED: "미정",
};

const LISTING_KO: Record<string, string> = {
  PRIVATE_ONLY: "비상장",
  PUBLIC_ONLY: "상장",
  PUBLIC_OK: "상장·비상장",
  FLEXIBLE: "상장 여부 무관",
};

const STRUCTURE_KO: Record<string, string> = {
  CASH: "현금 인수",
  STAGED: "단계적 인수",
  EARNOUT: "Earn-out",
  ROLLOVER: "Rollover",
  ASSET_DEAL: "자산 거래",
  SHARE_DEAL: "주식 거래",
  FLEXIBLE: "유연",
};

const COUNTRY_KO: Record<string, string> = {
  KR: "한국",
  JP: "일본",
  US: "미국",
  CN: "중국",
};

export type FieldPresence = "입력" | "미확인" | "미입력";

export type VisibleField = {
  id: string;
  label: string;
  presence: FieldPresence;
  value: string | null;
};

export type NextAction = {
  label: string;
  href: string;
  detail: string;
};

export type ValuationVisibility = SellerLevel0Presentation;

export type MatchingVisibility = {
  statusLabel: "인수조건 정리 완료" | "Matching Engine 준비 전" | "미입력";
  copy: string;
  recommendedCompanies: never[];
};

export function platformRoleLabel(role: PlatformRole | null): string {
  if (role === PlatformRole.SELLER_USER) return "매각 담당";
  if (role === PlatformRole.BUYER_USER) return "인수 담당";
  if (role === PlatformRole.EXPERT_USER) return "전문가";
  if (role === PlatformRole.INTERNAL_DEAL_MANAGER) return "Internal";
  if (role === PlatformRole.ADMIN) return "Admin";
  return "미선택";
}

export function dealRoleLabel(role: DealRole | null): string {
  if (role === DealRole.SELLER_OWNER) return "매각 책임";
  if (role === DealRole.SELLER_OPERATOR) return "매각 실무";
  if (role === DealRole.BUYER_OWNER) return "인수 책임";
  if (role === DealRole.BUYER_OPERATOR) return "인수 실무";
  if (role === DealRole.SELLER_ADVISOR) return "매각 자문";
  if (role === DealRole.BUYER_ADVISOR) return "인수 자문";
  if (role === DealRole.EXPERT) return "전문가";
  if (role === DealRole.INTERNAL_MANAGER) return "Internal";
  return "미선택";
}

export function discoveryFactsFromContext(
  context: CurrentContext | null,
  intent: "sell" | "buy",
): DiscoveryContextFacts {
  return {
    companyName: context?.company?.name ?? null,
    industry: context?.company?.industry ?? null,
    platformRole: context?.platformRole ?? null,
    dealId: context?.deal?.id ?? null,
    dealRole: context?.dealRole ?? null,
    dealStage: null,
    conversationIntent: intent,
    profile: discoveryProfileFrom(context?.platformRole ?? null, intent),
  };
}

export function displayMemoryValue(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const trimmed = value.trim();
  if (trimmed === "UNKNOWN" || trimmed === "SKIPPED") return null;
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    const numeric = parseNumericCriterion(trimmed);
    if (numeric?.raw) return numeric.raw;
    const multi = parseMultiCriterion(trimmed);
    if (multi.raw) return multi.raw;
    return null;
  }
  return trimmed;
}

export function fieldPresence(
  memories: TomMemoryItem[],
  fieldId: DiscoveryFieldId,
  known: Set<DiscoveryFieldId>,
): FieldPresence {
  const row = memories.find((item) => item.key === fieldId);
  if (known.has(fieldId)) return "입력";
  if (isSkippedMemoryState(row?.informationState, row?.value)) return "미확인";
  if (row?.informationState === InformationState.UNKNOWN) return "미확인";
  return "미입력";
}

export function visibleDiscoveryFields(input: {
  memories: TomMemoryItem[];
  context: DiscoveryContextFacts;
  fields: { id: DiscoveryFieldId; label: string }[];
  profile: DiscoveryProfile;
}): VisibleField[] {
  const { known } = classifyDiscoveryFields({
    memories: input.memories,
    context: input.context,
    profile: input.profile,
  });
  return input.fields.map((field) => {
    const row = input.memories.find((item) => item.key === field.id);
    const presence = fieldPresence(input.memories, field.id, known);
    return {
      id: field.id,
      label: field.label,
      presence,
      value: presence === "입력" ? displayMemoryValue(row?.value) : null,
    };
  });
}

export function recentSavedMemories(
  memories: TomMemoryItem[],
  profile: DiscoveryProfile,
  limit = 4,
): VisibleField[] {
  const rows: VisibleField[] = [];
  for (const item of memories) {
    if (item.key === INTENT_MEMORY_KEY) {
      const router = item.value as keyof typeof intentRouterLabel;
      const label = intentRouterLabel[router];
      if (label) {
        rows.push({
          id: item.key,
          label: "상담 방향",
          presence: "입력",
          value: label,
        });
      }
      continue;
    }
    const def = fieldById(item.key);
    if (!def || (def.profile ?? "SELLER") !== profile) continue;
    if (def.requirement === "context") continue;
    const value = displayMemoryValue(item.value);
    if (!value) continue;
    if (isSkippedMemoryState(item.informationState, item.value)) continue;
    rows.push({
      id: item.key,
      label: discoveryFieldLabel(def.id),
      presence: "입력",
      value,
    });
  }
  return rows.slice(-limit);
}

function discoveryFieldLabel(id: DiscoveryFieldId): string {
  const home =
    SELLER_HOME_FIELDS.find((field) => field.id === id) ??
    BUYER_HOME_FIELDS.find((field) => field.id === id);
  if (home) return home.label;
  const def = fieldById(id);
  return def?.question.replace(/\?$/, "") ?? id;
}

export function financialAmountLabel(amount: NormalizedFinancialAmount): {
  presence: FieldPresence;
  value: string | null;
} {
  if (amount.unresolved) {
    return { presence: "미확인", value: amount.raw || null };
  }
  if (amount.krw != null) {
    return { presence: "입력", value: formatKrwEokLabel(amount.krw) };
  }
  return { presence: "미입력", value: null };
}

export function financialNormalizationStatus(
  inputs: NormalizedFinancialInputs | null,
): "준비 완료" | "재무 입력 정리 중" | "데이터 없음" {
  if (!inputs) return "데이터 없음";
  if (inputs.completeness.knownInputs === 0) return "데이터 없음";
  if (inputs.completeness.missingForLevel0.length > 0) return "재무 입력 정리 중";
  return "준비 완료";
}

export function valuationVisibility(input: {
  hasConversation: boolean;
  financials: NormalizedFinancialInputs | null;
  status: ValuationCalculationStatus | null;
  copy: string | null;
  result?: ValuationCalculation | null;
  benchmarkApproval?: BenchmarkApprovalStatus | null;
}): ValuationVisibility {
  return sellerLevel0Presentation({
    hasConversation: input.hasConversation,
    financials: input.financials,
    status: input.status,
    result: input.result ?? null,
    copy: input.copy,
    benchmarkApproval: input.benchmarkApproval ?? null,
  });
}

export function valuationLevel1Visibility(input: {
  hasConversation: boolean;
  financials: NormalizedFinancialInputs | null;
  status: ValuationCalculationStatus | null;
  copy: string | null;
  result?: ValuationCalculation | null;
  benchmarkApproval?: BenchmarkApprovalStatus | null;
}): ValuationVisibility {
  return sellerLevel1Presentation({
    hasConversation: input.hasConversation,
    financials: input.financials,
    status: input.status,
    result: input.result ?? null,
    copy: input.copy,
    benchmarkApproval: input.benchmarkApproval ?? null,
  });
}

export function matchingVisibility(
  criteria: NormalizedAcquisitionCriteria | null,
): MatchingVisibility {
  if (!criteria || criteria.completeness.requiredKnown === 0) {
    return {
      statusLabel: "미입력",
      copy: "인수조건을 먼저 정리합니다. 추천 회사는 표시하지 않습니다.",
      recommendedCompanies: [],
    };
  }
  if (criteria.completeness.missingRequired.length === 0) {
    return {
      statusLabel: "인수조건 정리 완료",
      copy: "인수조건 정리가 끝났습니다. Matching Engine 준비 전입니다. 추천 회사는 아직 없습니다.",
      recommendedCompanies: [],
    };
  }
  return {
    statusLabel: "Matching Engine 준비 전",
    copy: "인수조건을 이어서 정리할 수 있습니다. Matching Engine 준비 전이며 추천 회사는 표시하지 않습니다.",
    recommendedCompanies: [],
  };
}

export function readableCriteriaRows(
  criteria: NormalizedAcquisitionCriteria | null,
): VisibleField[] {
  if (!criteria) {
    return [
      { id: "industry", label: "관심 산업", presence: "미입력", value: null },
      { id: "geo", label: "관심 지역", presence: "미입력", value: null },
      { id: "cap", label: "투자 한도", presence: "미입력", value: null },
      { id: "listing", label: "상장 여부", presence: "미입력", value: null },
    ];
  }
  const industries = criteria.industries
    .map((item) => INDUSTRY_KO[item.canonical ?? ""] ?? item.raw)
    .filter(Boolean);
  const geos = criteria.geographies.map((item) => {
    if (item.countryCode && COUNTRY_KO[item.countryCode]) {
      return COUNTRY_KO[item.countryCode];
    }
    return item.region || item.raw;
  });
  const cap =
    criteria.investmentRange.maxKrw != null
      ? formatKrwEok(criteria.investmentRange.maxKrw)
      : criteria.investmentRange.unresolved
        ? criteria.investmentRange.raw
        : null;
  const listing = criteria.listingPreference
    ? LISTING_KO[criteria.listingPreference.canonical]
    : null;
  const ownership = criteria.ownershipPreferences
    .map((item) => OWNERSHIP_KO[item.canonical] ?? item.raw)
    .filter(Boolean);
  const structure = criteria.structurePreferences
    .map((item) => STRUCTURE_KO[item.canonical] ?? item.raw)
    .filter(Boolean);

  return [
    {
      id: "objective",
      label: "인수 목적",
      presence: criteria.acquisitionObjective ? "입력" : "미입력",
      value: criteria.acquisitionObjective,
    },
    {
      id: "industry",
      label: "관심 산업",
      presence: industries.length ? "입력" : "미입력",
      value: industries.length ? industries.join(" · ") : null,
    },
    {
      id: "geo",
      label: "관심 지역",
      presence: geos.length ? "입력" : "미입력",
      value: geos.length ? geos.join(" · ") : null,
    },
    {
      id: "cap",
      label: "투자 한도",
      presence: cap ? (criteria.investmentRange.unresolved ? "미확인" : "입력") : "미입력",
      value: cap,
    },
    {
      id: "listing",
      label: "상장 여부",
      presence: listing ? "입력" : "미입력",
      value: listing ?? null,
    },
    {
      id: "ownership",
      label: "지분 선호",
      presence: ownership.length ? "입력" : "미입력",
      value: ownership.length ? ownership.join(" · ") : null,
    },
    {
      id: "structure",
      label: "거래 구조",
      presence: structure.length ? "입력" : "미입력",
      value: structure.length ? structure.join(" · ") : null,
    },
  ];
}

export function sellerNextAction(input: {
  hasConversation: boolean;
  userMessageCount: number;
  nextQuestion: string | null;
  requiredKnown: number;
  requiredTotal: number;
  valuation: ValuationVisibility;
}): NextAction {
  if (!input.hasConversation || input.userMessageCount === 0) {
    return {
      label: "TOM 상담 시작",
      href: "/consult?intent=sell",
      detail: "매각 배경과 회사 상황을 한 질문씩 정리합니다.",
    };
  }
  if (input.nextQuestion && input.requiredKnown < input.requiredTotal) {
    return {
      label: "TOM 상담 이어가기",
      href: "/consult?intent=sell",
      detail: input.nextQuestion,
    };
  }
  if (
    input.valuation.statusLabel === "재무정보 입력 필요" ||
    input.valuation.statusLabel === "데이터 없음"
  ) {
    return {
      label: "재무 입력 이어가기",
      href: "/consult?intent=sell",
      detail: "매출·이익 등 알려 주신 숫자만 저장합니다. 추정하지 않습니다.",
    };
  }
  if (input.valuation.statusLabel === "비교배수 확인 필요") {
    return {
      label: "가치평가 상태 보기",
      href: "/seller/valuation",
      detail: "재무는 정리되었습니다. 검증된 비교배수가 필요합니다.",
    };
  }
  if (input.valuation.statusLabel === "Indicative EV 계산됨") {
    return {
      label: "가치평가 결과 보기",
      href: "/seller/valuation",
      detail: "승인된 비교배수로 계산된 기업가치(EV) 범위입니다.",
    };
  }
  return {
    label: "자료실 열기",
    href: "/seller/docs",
    detail: "회사 비공개 자료를 이어서 정리할 수 있습니다.",
  };
}

export function buyerNextAction(input: {
  hasConversation: boolean;
  userMessageCount: number;
  nextQuestion: string | null;
  requiredKnown: number;
  requiredTotal: number;
  matching: MatchingVisibility;
}): NextAction {
  if (!input.hasConversation || input.userMessageCount === 0) {
    return {
      label: "TOM 상담 시작",
      href: "/consult?intent=buy",
      detail: "인수 목적과 조건을 한 질문씩 정리합니다.",
    };
  }
  if (input.nextQuestion && input.requiredKnown < input.requiredTotal) {
    return {
      label: "TOM 상담 이어가기",
      href: "/consult?intent=buy",
      detail: input.nextQuestion,
    };
  }
  if (input.matching.statusLabel === "인수조건 정리 완료") {
    return {
      label: "인수조건 확인",
      href: "/buyer/criteria",
      detail: "Matching Engine 준비 전입니다. 추천 회사는 아직 없습니다.",
    };
  }
  return {
    label: "인수조건 이어서 정리",
    href: "/consult?intent=buy",
    detail: "필요한 항목을 한 번에 하나만 여쭙습니다.",
  };
}

export function consultPurpose(intent: "sell" | "buy"): string {
  return intent === "buy"
    ? "기업 인수 조건을 정리하는 상담입니다. 확정 인수 의사가 아닙니다."
    : "기업 매각 검토를 정리하는 상담입니다. 확정 매각 의사가 아닙니다.";
}

export function consultStillNeeded(
  memories: TomMemoryItem[],
  context: DiscoveryContextFacts,
  profile: DiscoveryProfile,
  limit = 3,
): string[] {
  const next = getNextBestQuestion({ memories, context, profile });
  const { known, skipped } = classifyDiscoveryFields({
    memories,
    context,
    profile,
  });
  const fields =
    profile === "SELLER" ? SELLER_HOME_FIELDS : BUYER_HOME_FIELDS;
  const needed = fields
    .filter((field) => !known.has(field.id) && !skipped.has(field.id))
    .map((field) => field.label);
  if (next && !needed.includes(discoveryFieldLabel(next.field))) {
    return [discoveryFieldLabel(next.field), ...needed].slice(0, limit);
  }
  return needed.slice(0, limit);
}

export function latestUserMessage(messages: TomMessage[]): TomMessage | null {
  return [...messages].reverse().find((item) => item.authorRole === "user") ?? null;
}

export function latestTomMessage(messages: TomMessage[]): TomMessage | null {
  return [...messages].reverse().find((item) => item.authorRole === "tom") ?? null;
}

export function criteriaSummaryOrEmpty(
  criteria: NormalizedAcquisitionCriteria | null,
): string {
  if (!criteria) return "아직 정규화된 인수조건이 없습니다.";
  return formatNormalizedCriteriaSummary(criteria);
}
