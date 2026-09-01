import { InformationState } from "@/types/enums";

export const DISCOVERY_LAST_QUESTION_KEY = "discovery_last_question";

export type DiscoveryProfile = "SELLER" | "BUYER";

export type DiscoveryFieldId =
  | "seller_objective"
  | "reason_for_sale"
  | "sale_readiness"
  | "sale_scope"
  | "desired_timeline"
  | "valuation_expectation"
  | "company_name"
  | "industry"
  | "location"
  | "establishment"
  | "employees"
  | "key_products_services"
  | "key_customers"
  | "competitive_advantage"
  | "revenue"
  | "ebitda"
  | "operating_profit"
  | "cash"
  | "debt"
  | "net_debt"
  | "preferred_structure"
  | "management_retention"
  | "buyer_preference"
  | "excluded_buyers"
  | "confidentiality"
  | "special_conditions"
  | "acquisition_objective"
  | "target_industries"
  | "target_businesses"
  | "target_geographies"
  | "listing_preference"
  | "target_revenue_min"
  | "target_revenue_max"
  | "target_ebitda_min"
  | "target_ebitda_max"
  | "investment_size_min"
  | "investment_size_max"
  | "ownership_preference"
  | "structure_preference"
  | "acquisition_timeline"
  | "profitability_requirement"
  | "debt_tolerance"
  | "growth_preference"
  | "technology_requirements"
  | "customer_requirements"
  | "excluded_industries"
  | "excluded_geographies"
  | "excluded_companies"
  | "deal_breakers"
  | "management_retention_preference"
  | "strategic_requirements";

export type DiscoveryRequirement = "required" | "optional" | "context";

export type DiscoveryFieldDef = {
  id: DiscoveryFieldId;
  category: string;
  requirement: DiscoveryRequirement;
  priority: number;
  question: string;
  reason: string;
  profile?: DiscoveryProfile;
};

/** 숫자가 낮을수록 먼저 묻는다. context 필드는 DB에서 채우면 질문하지 않는다. */
export const SELLER_DISCOVERY_FIELDS: DiscoveryFieldDef[] = [
  {
    id: "reason_for_sale",
    category: "SELLER_OBJECTIVE",
    requirement: "required",
    priority: 1,
    question: "매각을 검토하시는 가장 큰 이유가 무엇인가요?",
    reason: "매각 배경이 이후 거래 구조와 Buyer 적합도를 가릅니다.",
  },
  {
    id: "seller_objective",
    category: "SELLER_OBJECTIVE",
    requirement: "optional",
    priority: 14,
    question: "이번 상담에서 가장 확인하고 싶은 것은 무엇인가요?",
    reason: "Seller가 원하는 결과를 맞춥니다.",
  },
  {
    id: "sale_readiness",
    category: "DEAL_FACT",
    requirement: "required",
    priority: 4,
    question: "지금은 정보를 알아보는 단계인가요, 아니면 매각을 비교적 구체적으로 검토 중이신가요?",
    reason: "의사 수준에 따라 다음 안내가 달라집니다. 확정 매각 의사로 저장하지 않습니다.",
  },
  {
    id: "sale_scope",
    category: "DEAL_FACT",
    requirement: "required",
    priority: 2,
    question: "전체 지분 매각을 생각하고 계신가요, 아니면 일부 지분 매각도 고려하시나요?",
    reason: "매각 범위는 이후 거래 구조의 출발점입니다.",
  },
  {
    id: "desired_timeline",
    category: "DEAL_FACT",
    requirement: "required",
    priority: 5,
    question: "희망하시는 매각 시점이 있으신가요?",
    reason: "일정은 준비·실사 범위와 맞출 때 필요합니다.",
  },
  {
    id: "valuation_expectation",
    category: "VALUATION_ASSUMPTION",
    requirement: "required",
    priority: 6,
    question: "생각하고 계신 희망 가격이나 가치 수준이 있으신가요?",
    reason: "기대 가격은 사용자 주장으로만 저장하며, 이번 단계에서 가치를 계산하지 않습니다.",
  },
  {
    id: "key_products_services",
    category: "COMPANY_FACT",
    requirement: "optional",
    priority: 7,
    question: "회사의 핵심 사업이나 주력 제품·서비스는 무엇인가요?",
    reason: "사업 이해가 다음 상담의 기준이 됩니다.",
  },
  {
    id: "revenue",
    category: "COMPANY_FACT",
    requirement: "optional",
    priority: 8,
    question: "최근 연간 매출은 대략 얼마인가요?",
    reason: "핵심 재무는 알려 주신 범위만 저장합니다. 추정해서 채우지 않습니다.",
  },
  {
    id: "ebitda",
    category: "COMPANY_FACT",
    requirement: "optional",
    priority: 9,
    question: "EBITDA(상각 전 영업이익)나 영업이익 규모를 알고 계신가요?",
    reason: "알려 주신 숫자만 저장합니다. 가치를 계산하지 않습니다.",
  },
  {
    id: "buyer_preference",
    category: "BUYER_CRITERIA",
    requirement: "optional",
    priority: 10,
    question: "선호하거나 피하고 싶은 인수자 유형이 있으신가요?",
    reason: "Buyer 선호·제외는 이후 접촉 범위에 영향을 줍니다.",
  },
  {
    id: "preferred_structure",
    category: "DEAL_FACT",
    requirement: "optional",
    priority: 11,
    question: "주식 매각, 자산 매각 등 생각하시는 거래 구조가 있으신가요?",
    reason: "구조 선호는 사용자 주장으로만 남깁니다.",
  },
  {
    id: "management_retention",
    category: "DEAL_FACT",
    requirement: "optional",
    priority: 12,
    question: "매각 이후 경영진이 남거나 지분을 일부 유지하는 방안도 열려 있으신가요?",
    reason: "잔류·rollover 의사는 이후 조건 논의에 필요합니다.",
  },
  {
    id: "confidentiality",
    category: "DEAL_RISK",
    requirement: "optional",
    priority: 13,
    question: "특별히 비밀로 지켜야 할 제약이나 조건이 있으신가요?",
    reason: "기밀 제약은 외부 접촉 전에 확인합니다.",
  },
  {
    id: "company_name",
    category: "COMPANY_FACT",
    requirement: "context",
    priority: 90,
    question: "회사 이름이 어떻게 되시나요?",
    reason: "회사명은 연결된 회사에서 먼저 읽습니다.",
  },
  {
    id: "industry",
    category: "COMPANY_FACT",
    requirement: "context",
    priority: 91,
    question: "주력 업종은 무엇인가요?",
    reason: "업종이 회사 프로필에 있으면 다시 묻지 않습니다.",
  },
  {
    id: "location",
    category: "COMPANY_FACT",
    requirement: "context",
    priority: 92,
    question: "본사나 주 사업장은 어디에 있나요?",
    reason: "DB에 없으면 나중에 받습니다.",
  },
  {
    id: "establishment",
    category: "COMPANY_FACT",
    requirement: "context",
    priority: 93,
    question: "설립 연도를 알고 계신가요?",
    reason: "DB에 없으면 필수 질문으로 올리지 않습니다.",
  },
  {
    id: "employees",
    category: "COMPANY_FACT",
    requirement: "context",
    priority: 94,
    question: "임직원 규모는 어느 정도인가요?",
    reason: "DB에 없으면 필수 질문으로 올리지 않습니다.",
  },
  {
    id: "key_customers",
    category: "COMPANY_FACT",
    requirement: "optional",
    priority: 20,
    question: "주요 고객은 어떤 곳인가요?",
    reason: "고객 구성은 이후 실사에서 중요해집니다.",
  },
  {
    id: "competitive_advantage",
    category: "COMPANY_FACT",
    requirement: "optional",
    priority: 21,
    question: "경쟁사 대비 강점이라고 보시는 점은 무엇인가요?",
    reason: "강점은 사용자 주장으로만 저장합니다.",
  },
  {
    id: "operating_profit",
    category: "COMPANY_FACT",
    requirement: "optional",
    priority: 22,
    question: "영업이익 규모를 알고 계신가요?",
    reason: "알려 주신 숫자만 저장합니다.",
  },
  {
    id: "cash",
    category: "COMPANY_FACT",
    requirement: "optional",
    priority: 23,
    question: "보유 현금(현금성 자산 포함) 규모를 알고 계신가요?",
    reason: "모르면 0으로 추정하지 않습니다.",
  },
  {
    id: "debt",
    category: "COMPANY_FACT",
    requirement: "optional",
    priority: 24,
    question: "이자부 차입금 규모를 알고 계신가요?",
    reason: "모르면 0으로 추정하지 않습니다.",
  },
  {
    id: "net_debt",
    category: "COMPANY_FACT",
    requirement: "optional",
    priority: 25,
    question: "순차입금(차입에서 현금을 뺀 값)을 대략이라도 알고 계신가요?",
    reason: "현금과 차입이 모두 있으면 계산합니다. 한쪽만 있으면 추정하지 않습니다.",
  },
  {
    id: "excluded_buyers",
    category: "BUYER_CRITERIA",
    requirement: "optional",
    priority: 26,
    question: "접촉을 원하지 않는 인수자가 있으신가요?",
    reason: "제외 대상은 Negative Memory로 남깁니다.",
  },
  {
    id: "special_conditions",
    category: "DEAL_RISK",
    requirement: "optional",
    priority: 27,
    question: "그 밖에 꼭 알려 두셔야 할 거래 조건이 있으신가요?",
    reason: "기타 제약을 놓치지 않기 위함입니다.",
  },
];

export const BUYER_DISCOVERY_FIELDS: DiscoveryFieldDef[] = [
  {
    id: "acquisition_objective",
    category: "BUYER_CRITERIA",
    requirement: "required",
    priority: 1,
    profile: "BUYER",
    question:
      "이번 인수에서 가장 중요한 목적은 무엇인가요? 예를 들어 사업확장, 기술확보, 신규시장 진입 등이 있습니다.",
    reason: "인수 목적이 Target 적합도의 출발점입니다.",
  },
  {
    id: "target_industries",
    category: "BUYER_CRITERIA",
    requirement: "required",
    priority: 2,
    profile: "BUYER",
    question: "어떤 산업의 회사를 찾고 계신가요?",
    reason: "관심 산업은 Buyer 회사 업종과 별개입니다.",
  },
  {
    id: "target_businesses",
    category: "BUYER_CRITERIA",
    requirement: "required",
    priority: 3,
    profile: "BUYER",
    question: "관심 있는 사업이나 제품·기술은 무엇인가요?",
    reason: "사업·제품 조건은 산업과 따로 저장합니다.",
  },
  {
    id: "target_geographies",
    category: "BUYER_CRITERIA",
    requirement: "required",
    priority: 4,
    profile: "BUYER",
    question: "인수 대상을 어느 지역에서 보고 계신가요?",
    reason: "지역은 복수 선택이 가능합니다.",
  },
  {
    id: "listing_preference",
    category: "BUYER_CRITERIA",
    requirement: "optional",
    priority: 5,
    profile: "BUYER",
    question: "상장사와 비상장사 중 선호가 있으신가요?",
    reason: "상장 여부는 이후 Matching 필터로 쓸 수 있습니다.",
  },
  {
    id: "target_revenue_min",
    category: "BUYER_CRITERIA",
    requirement: "optional",
    priority: 6,
    profile: "BUYER",
    question: "인수 대상의 매출 규모 범위가 있으신가요?",
    reason: "말씀하신 숫자만 저장하며 추정하지 않습니다.",
  },
  {
    id: "target_revenue_max",
    category: "BUYER_CRITERIA",
    requirement: "optional",
    priority: 7,
    profile: "BUYER",
    question: "매출 상한선이 있으신가요?",
    reason: "범위의 상한을 따로 저장합니다.",
  },
  {
    id: "investment_size_max",
    category: "BUYER_CRITERIA",
    requirement: "required",
    priority: 8,
    profile: "BUYER",
    question: "희망 투자금액 범위가 있으신가요?",
    reason: "투자 한도는 사용자 주장으로만 저장합니다.",
  },
  {
    id: "investment_size_min",
    category: "BUYER_CRITERIA",
    requirement: "optional",
    priority: 9,
    profile: "BUYER",
    question: "투자 가능한 최소 금액이 있으신가요?",
    reason: "하한이 있으면 범위로 남깁니다.",
  },
  {
    id: "ownership_preference",
    category: "BUYER_CRITERIA",
    requirement: "optional",
    priority: 10,
    profile: "BUYER",
    question:
      "지분은 어느 정도까지 인수하는 방향을 보고 계신가요? 예를 들어 100%, 경영권 지분, Majority, Minority 등이 있습니다.",
    reason: "지분 범위는 거래 구조를 가릅니다.",
  },
  {
    id: "acquisition_timeline",
    category: "BUYER_CRITERIA",
    requirement: "optional",
    priority: 11,
    profile: "BUYER",
    question: "인수를 검토하시는 시점이 있으신가요?",
    reason: "일정은 알려 주신 범위만 저장합니다.",
  },
  {
    id: "target_ebitda_min",
    category: "BUYER_CRITERIA",
    requirement: "optional",
    priority: 12,
    profile: "BUYER",
    question: "EBITDA(상각 전 영업이익)에서 보고 싶은 수준이 있으신가요?",
    reason: "수익성 숫자는 추정하지 않습니다.",
  },
  {
    id: "target_ebitda_max",
    category: "BUYER_CRITERIA",
    requirement: "optional",
    priority: 13,
    profile: "BUYER",
    question: "EBITDA 상한선이 있으신가요?",
    reason: "상한이 있으면 따로 저장합니다.",
  },
  {
    id: "profitability_requirement",
    category: "BUYER_CRITERIA",
    requirement: "optional",
    priority: 14,
    profile: "BUYER",
    question: "수익성이나 흑자 여부에서 꼭 보고 싶은 조건이 있으신가요?",
    reason: "재무조건은 사용자 주장으로만 남깁니다.",
  },
  {
    id: "debt_tolerance",
    category: "BUYER_CRITERIA",
    requirement: "optional",
    priority: 15,
    profile: "BUYER",
    question: "대상 회사의 부채에 대해 허용 가능한 수준이 있으신가요?",
    reason: "부채 허용 범위는 추정하지 않습니다.",
  },
  {
    id: "growth_preference",
    category: "BUYER_CRITERIA",
    requirement: "optional",
    priority: 16,
    profile: "BUYER",
    question: "성장성에서 보고 싶은 조건이 있으신가요?",
    reason: "성장 선호는 USER_CLAIM입니다.",
  },
  {
    id: "technology_requirements",
    category: "BUYER_CRITERIA",
    requirement: "optional",
    priority: 17,
    profile: "BUYER",
    question: "꼭 필요한 기술이나 IP가 있으신가요?",
    reason: "기술 요구는 Target 산업과 별개로 저장합니다.",
  },
  {
    id: "customer_requirements",
    category: "BUYER_CRITERIA",
    requirement: "optional",
    priority: 18,
    profile: "BUYER",
    question: "고객이나 매출 구조에서 보고 싶은 조건이 있으신가요?",
    reason: "고객 조건은 사용자 주장으로만 남깁니다.",
  },
  {
    id: "structure_preference",
    category: "BUYER_CRITERIA",
    requirement: "optional",
    priority: 19,
    profile: "BUYER",
    question:
      "선호하시는 거래 구조가 있으신가요? 예를 들어 현금 인수, Earn-out, Rollover, 자산/주식 거래 등이 있습니다.",
    reason: "구조 선호는 이후 협상 출발점입니다.",
  },
  {
    id: "excluded_industries",
    category: "BUYER_CRITERIA",
    requirement: "optional",
    priority: 20,
    profile: "BUYER",
    question: "보고 싶지 않은 산업이 있으신가요?",
    reason: "제외 산업은 Negative Memory입니다.",
  },
  {
    id: "excluded_geographies",
    category: "BUYER_CRITERIA",
    requirement: "optional",
    priority: 21,
    profile: "BUYER",
    question: "제외하고 싶은 지역이 있으신가요?",
    reason: "제외 지역은 복수 저장합니다.",
  },
  {
    id: "excluded_companies",
    category: "BUYER_CRITERIA",
    requirement: "optional",
    priority: 22,
    profile: "BUYER",
    question: "인수 검토에서 빼고 싶은 회사가 있으신가요?",
    reason: "제외 회사는 Deal Breaker와 구분합니다.",
  },
  {
    id: "deal_breakers",
    category: "BUYER_CRITERIA",
    requirement: "optional",
    priority: 23,
    profile: "BUYER",
    question: "이 조건이면 진행하지 않겠다 싶은 Deal Breaker가 있으신가요?",
    reason: "Deal Breaker는 이후 Hard Filter 후보입니다.",
  },
  {
    id: "management_retention_preference",
    category: "BUYER_CRITERIA",
    requirement: "optional",
    priority: 24,
    profile: "BUYER",
    question: "기존 경영진 잔류에 대한 선호가 있으신가요?",
    reason: "경영진 조건은 거래 구조와 맞춥니다.",
  },
  {
    id: "strategic_requirements",
    category: "BUYER_CRITERIA",
    requirement: "optional",
    priority: 25,
    profile: "BUYER",
    question: "그 밖에 꼭 맞추고 싶은 전략 조건이 있으신가요?",
    reason: "기타 전략 조건을 놓치지 않기 위함입니다.",
  },
];

const ALL_DISCOVERY_FIELDS: DiscoveryFieldDef[] = [
  ...SELLER_DISCOVERY_FIELDS.map((field) => ({
    ...field,
    profile: (field.profile ?? "SELLER") as DiscoveryProfile,
  })),
  ...BUYER_DISCOVERY_FIELDS,
];

export const MULTI_VALUE_DISCOVERY_FIELDS: DiscoveryFieldId[] = [
  "target_industries",
  "target_businesses",
  "target_geographies",
  "excluded_industries",
  "excluded_geographies",
  "excluded_companies",
  "deal_breakers",
];

export function fieldProfile(def: DiscoveryFieldDef): DiscoveryProfile {
  return def.profile ?? "SELLER";
}

export function askableFields(profile: DiscoveryProfile): DiscoveryFieldDef[] {
  return ALL_DISCOVERY_FIELDS.filter(
    (field) => fieldProfile(field) === profile && field.requirement !== "context",
  ).sort((a, b) => a.priority - b.priority);
}

export function requiredFields(profile: DiscoveryProfile): DiscoveryFieldDef[] {
  return askableFields(profile).filter((field) => field.requirement === "required");
}

export function isMultiValueField(id: DiscoveryFieldId): boolean {
  return MULTI_VALUE_DISCOVERY_FIELDS.includes(id);
}

/** Seller 호환. 새 코드는 askableFields(profile)를 사용한다. */
export const ASKABLE_DISCOVERY_FIELDS = askableFields("SELLER");

export const REQUIRED_DISCOVERY_FIELDS = requiredFields("SELLER");

export function fieldById(id: string): DiscoveryFieldDef | undefined {
  return ALL_DISCOVERY_FIELDS.find((field) => field.id === id);
}

export type MemoryCharacter = "FACT" | "USER_CLAIM" | "ASSUMPTION" | "INFERENCE";

export function encodeMemorySource(
  origin: string,
  character: MemoryCharacter,
): string {
  return `${origin}:${character}`;
}

export function parseMemorySource(source: string | null | undefined): {
  origin: string;
  character: MemoryCharacter;
} {
  if (!source) {
    return { origin: "unknown", character: "USER_CLAIM" };
  }
  const [origin, character] = source.split(":");
  if (
    character === "FACT" ||
    character === "USER_CLAIM" ||
    character === "ASSUMPTION" ||
    character === "INFERENCE"
  ) {
    return { origin: origin || "unknown", character };
  }
  return { origin: source, character: "USER_CLAIM" };
}

export function isKnownMemoryState(state: string | null | undefined): boolean {
  return state === InformationState.CONFIRMED || state === InformationState.ESTIMATED;
}

export function isSkippedMemoryState(
  state: string | null | undefined,
  value: string | null | undefined,
): boolean {
  if (state === InformationState.UNKNOWN) return true;
  const normalized = (value ?? "").trim().toUpperCase();
  return normalized === "UNKNOWN" || normalized === "SKIPPED";
}
