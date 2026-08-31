import { InformationState } from "@/types/enums";
import type { DiscoveryFieldId, DiscoveryProfile } from "@/lib/tom/discovery-fields";
import { fieldById } from "@/lib/tom/discovery-fields";
import {
  encodeMultiCriterion,
  encodeNumericCriterion,
  isVagueAmount,
  parseEokAmounts,
  parseEokRange,
} from "@/lib/tom/criteria-value";

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
  "몇 배",
  "몇배",
  "얼마나 걸리",
  "보통 매각",
  "보통 이런",
  "어떻게 하",
  "왜 ",
  "무슨 뜻",
  "뭔가요",
  "인가요?",
  "나요?",
  "까요?",
  "거래돼",
  "거래되",
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

function hasEbitdaCue(text: string): boolean {
  return /ebitda|에비타|상각\s*전/i.test(text);
}

function hasRevenueCue(text: string): boolean {
  return /매출|수익|턴오버/i.test(text);
}

function hasInvestmentCue(text: string): boolean {
  return /투자|티켓|한도|가능\s*금|까지|생각하고|여력|예산/.test(text);
}

function numericValue(krw: number | null, raw: string): string {
  return encodeNumericCriterion({ krw, raw: raw.slice(0, 200) });
}

function multiValue(values: string[], raw: string): string {
  return encodeMultiCriterion({ values, raw: raw.slice(0, 200) });
}

const OBJECTIVE_RULES: { needle: RegExp; value: string }[] = [
  { needle: /수직계열/, value: "vertical_integration" },
  { needle: /수평확장|수평\s*확장/, value: "horizontal_expansion" },
  { needle: /신규시장|새\s*시장/, value: "new_market" },
  { needle: /기술확보|기술\s*확보/, value: "technology_acquisition" },
  { needle: /고객확보|고객\s*확보/, value: "customer_acquisition" },
  { needle: /생산능력|캐파|capa/i, value: "production_capacity" },
  { needle: /bolt-?on/i, value: "bolt_on" },
  { needle: /platform/i, value: "platform_acquisition" },
  { needle: /재무적\s*투자|재무투자/, value: "financial_investment" },
  { needle: /사업확장|사업\s*확장/, value: "business_expansion" },
];

const GEO_TOKENS: { needle: RegExp; value: string }[] = [
  { needle: /한국|국내|대한민국|korea/i, value: "한국" },
  { needle: /일본|japan/i, value: "일본" },
  { needle: /미국|usa|미국내/i, value: "미국" },
  { needle: /중국|china/i, value: "중국" },
  { needle: /유럽|europe/i, value: "유럽" },
  { needle: /동남아|아세안|asean/i, value: "동남아" },
];

function extractGeographies(text: string): string[] {
  return GEO_TOKENS.filter((item) => item.needle.test(text)).map((item) => item.value);
}

function extractBuyerCaptures(input: {
  text: string;
  lastQuestion: DiscoveryFieldId | null;
  acceptLastFallback: boolean;
  reverseQuestion: boolean;
}): DiscoveryCapture[] {
  const text = input.text;
  const captures: DiscoveryCapture[] = [];
  const last = input.lastQuestion;
  const fallback = input.acceptLastFallback;

  for (const rule of OBJECTIVE_RULES) {
    if (rule.needle.test(text)) {
      captures.push(capture("acquisition_objective", rule.value));
      break;
    }
  }
  if (
    last === "acquisition_objective" &&
    fallback &&
    !captures.some((item) => item.field === "acquisition_objective")
  ) {
    captures.push(capture("acquisition_objective", text.slice(0, 200)));
  }

  if (/bms/i.test(text) || /배터리\s*관리/.test(text)) {
    captures.push(capture("target_businesses", multiValue(["BMS"], text)));
  }
  if (/ess/i.test(text)) {
    const existing = captures.find((item) => item.field === "target_businesses");
    if (existing) {
      existing.value = multiValue(["BMS", "ESS"], text);
    } else {
      captures.push(capture("target_businesses", multiValue(["ESS"], text)));
    }
  }
  if (/배터리/.test(text) && !/폐배터리/.test(text)) {
    captures.push(
      capture("target_industries", multiValue(["battery_related"], text)),
    );
  }

  if (
    last === "target_businesses" &&
    fallback &&
    !captures.some((item) => item.field === "target_businesses")
  ) {
    captures.push(capture("target_businesses", multiValue([text.slice(0, 80)], text)));
  }
  if (
    last === "target_industries" &&
    fallback &&
    !captures.some((item) => item.field === "target_industries")
  ) {
    captures.push(capture("target_industries", multiValue([text.slice(0, 80)], text)));
  }

  const geos = extractGeographies(text);
  if (geos.length > 0) {
    captures.push(capture("target_geographies", multiValue(geos, text)));
  } else if (last === "target_geographies" && fallback) {
    captures.push(capture("target_geographies", multiValue([text.slice(0, 80)], text)));
  }

  if (/비상장만|비상장\s*만|비상장사만|상장사\s*싫|상장은\s*싫|private\s*only/i.test(text)) {
    captures.push(capture("listing_preference", "PRIVATE_ONLY"));
  } else if (/상장만|상장사만|listed\s*only/i.test(text)) {
    captures.push(capture("listing_preference", "PUBLIC_ONLY"));
  } else if (/상장도\s*괜찮|상장사도/.test(text)) {
    captures.push(capture("listing_preference", "PUBLIC_OK"));
  } else if (/상장.*상관없|비상장.*상관없|listing.*flex/i.test(text)) {
    captures.push(capture("listing_preference", "FLEXIBLE"));
  } else if (last === "listing_preference" && fallback) {
    captures.push(capture("listing_preference", text.slice(0, 80)));
  }

  if (/100\s*%|전부\s*인수|지분\s*전부/.test(text) && !/100\s*억/.test(text)) {
    captures.push(capture("ownership_preference", "100_PERCENT"));
  } else if (/경영권/.test(text)) {
    captures.push(capture("ownership_preference", "CONTROL"));
  } else if (/majority/i.test(text) || /과반/.test(text)) {
    captures.push(capture("ownership_preference", "MAJORITY"));
  } else if (/minority/i.test(text) || /소수\s*지분/.test(text)) {
    captures.push(capture("ownership_preference", "MINORITY"));
  } else if (/지분.*상관없|flexible/i.test(text) && last === "ownership_preference") {
    captures.push(capture("ownership_preference", "FLEXIBLE"));
  } else if (/미정|아직 모르/.test(text) && last === "ownership_preference") {
    captures.push(capture("ownership_preference", "UNDECIDED"));
  } else if (last === "ownership_preference" && fallback) {
    captures.push(capture("ownership_preference", text.slice(0, 80)));
  }

  if (/earn-?out/i.test(text)) {
    captures.push(capture("structure_preference", "EARNOUT"));
  } else if (/rollover/i.test(text) || /롤오버/.test(text)) {
    captures.push(capture("structure_preference", "ROLLOVER"));
  } else if (/자산\s*인수|asset\s*deal/i.test(text)) {
    captures.push(capture("structure_preference", "ASSET_DEAL"));
  } else if (/주식\s*인수|share\s*deal/i.test(text)) {
    captures.push(capture("structure_preference", "SHARE_DEAL"));
  } else if (/현금\s*인수|100%\s*cash|전액\s*현금/i.test(text)) {
    captures.push(capture("structure_preference", "CASH"));
  } else if (/staged|단계적\s*인수/i.test(text)) {
    captures.push(capture("structure_preference", "STAGED"));
  } else if (last === "structure_preference" && fallback) {
    captures.push(capture("structure_preference", text.slice(0, 120)));
  }

  if (
    (last === "acquisition_timeline" && fallback) ||
    (/올해|내년|상반기|하반기|\d+\s*개월/.test(text) &&
      !input.reverseQuestion &&
      (last === "acquisition_timeline" || /인수\s*시점|언제/.test(text)))
  ) {
    captures.push(capture("acquisition_timeline", text.slice(0, 120)));
  }

  const lastFallbackFields: DiscoveryFieldId[] = [
    "profitability_requirement",
    "debt_tolerance",
    "growth_preference",
    "technology_requirements",
    "customer_requirements",
    "excluded_industries",
    "excluded_geographies",
    "excluded_companies",
    "deal_breakers",
    "management_retention_preference",
    "strategic_requirements",
  ];
  if (last && lastFallbackFields.includes(last) && fallback) {
    const multiLast =
      last === "excluded_industries" ||
      last === "excluded_geographies" ||
      last === "excluded_companies" ||
      last === "deal_breakers";
    captures.push(
      capture(last, multiLast ? multiValue([text.slice(0, 120)], text) : text.slice(0, 200)),
    );
  }

  if (isVagueAmount(text) && !input.reverseQuestion) {
    const vagueField: DiscoveryFieldId =
      last === "investment_size_min" || last === "investment_size_max"
        ? last
        : last === "target_revenue_min" || last === "target_revenue_max"
          ? last
          : hasInvestmentCue(text)
            ? "investment_size_max"
            : hasRevenueCue(text)
              ? "target_revenue_min"
              : last && last.startsWith("target_ebitda")
                ? last
                : "investment_size_max";
    if (hasInvestmentCue(text) || hasRevenueCue(text) || last === vagueField) {
      captures.push(capture(vagueField, numericValue(null, text)));
    }
  }

  const range = parseEokRange(text);
  const amounts = parseEokAmounts(text);
  if (!input.reverseQuestion && (range || amounts.length > 0)) {
    const raw = text.slice(0, 200);
    const lastEbitda =
      last === "target_ebitda_min" || last === "target_ebitda_max";
    const lastRevenue =
      last === "target_revenue_min" || last === "target_revenue_max";
    const lastInvest =
      last === "investment_size_min" || last === "investment_size_max";
    if (
      hasEbitdaCue(text) ||
      (lastEbitda && !hasInvestmentCue(text) && !hasRevenueCue(text))
    ) {
      if (range) {
        captures.push(capture("target_ebitda_min", numericValue(range.minKrw, raw)));
        captures.push(capture("target_ebitda_max", numericValue(range.maxKrw, raw)));
      } else if (amounts[0] != null) {
        const field: DiscoveryFieldId =
          last === "target_ebitda_max" || /이하|까지|상한/.test(text)
            ? "target_ebitda_max"
            : "target_ebitda_min";
        captures.push(capture(field, numericValue(amounts[0], raw)));
      }
    } else if (hasRevenueCue(text) || (lastRevenue && !hasInvestmentCue(text))) {
      if (range) {
        captures.push(capture("target_revenue_min", numericValue(range.minKrw, raw)));
        captures.push(capture("target_revenue_max", numericValue(range.maxKrw, raw)));
      } else if (amounts[0] != null) {
        const field: DiscoveryFieldId =
          last === "target_revenue_max" || /이하|까지|상한/.test(text)
            ? "target_revenue_max"
            : "target_revenue_min";
        captures.push(capture(field, numericValue(amounts[0], raw)));
      }
    } else if (hasInvestmentCue(text) || lastInvest) {
      if (range) {
        captures.push(capture("investment_size_min", numericValue(range.minKrw, raw)));
        captures.push(capture("investment_size_max", numericValue(range.maxKrw, raw)));
      } else if (amounts[0] != null) {
        const field: DiscoveryFieldId =
          last === "investment_size_min" || /이상|하한/.test(text)
            ? "investment_size_min"
            : "investment_size_max";
        captures.push(capture(field, numericValue(amounts[0], raw)));
      }
    }
  }

  return captures;
}

function extractSellerCaptures(input: {
  text: string;
  lastQuestion: DiscoveryFieldId | null;
  acceptLastFallback: boolean;
  reverseQuestion: boolean;
}): DiscoveryCapture[] {
  const text = input.text;
  const captures: DiscoveryCapture[] = [];

  if (/후계|승계|가업/.test(text)) {
    captures.push(capture("reason_for_sale", "succession"));
    captures.push(capture("seller_objective", "succession"));
  } else if (/은퇴|은퇴하/.test(text)) {
    captures.push(capture("reason_for_sale", "retirement"));
  } else if (/성장|규모 확대|투자 유치/.test(text) && input.lastQuestion === "reason_for_sale") {
    captures.push(capture("reason_for_sale", text.slice(0, 200)));
  } else if (
    input.lastQuestion === "reason_for_sale" &&
    input.acceptLastFallback &&
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
  } else if (input.lastQuestion === "sale_readiness" && input.acceptLastFallback) {
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
  } else if (input.lastQuestion === "sale_scope" && input.acceptLastFallback) {
    captures.push(capture("sale_scope", text.slice(0, 80)));
  }

  if (input.lastQuestion === "desired_timeline" && input.acceptLastFallback) {
    captures.push(capture("desired_timeline", text.slice(0, 120)));
  } else if (/올해|내년|상반기|하반기|\d+\s*개월/.test(text) && !input.reverseQuestion) {
    captures.push(capture("desired_timeline", text.slice(0, 120)));
  }

  if (input.lastQuestion === "valuation_expectation" && input.acceptLastFallback) {
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

  if (input.lastQuestion === "key_products_services" && input.acceptLastFallback) {
    captures.push(capture("key_products_services", text.slice(0, 200)));
  }
  if (input.lastQuestion === "buyer_preference" && input.acceptLastFallback) {
    captures.push(capture("buyer_preference", text.slice(0, 200)));
  }
  if (input.lastQuestion === "preferred_structure" && input.acceptLastFallback) {
    captures.push(capture("preferred_structure", text.slice(0, 120)));
  }
  if (input.lastQuestion === "management_retention" && input.acceptLastFallback) {
    captures.push(capture("management_retention", text.slice(0, 120)));
  }
  if (input.lastQuestion === "confidentiality" && input.acceptLastFallback) {
    captures.push(capture("confidentiality", text.slice(0, 200)));
  }
  if (
    input.lastQuestion === "seller_objective" &&
    input.acceptLastFallback &&
    !captures.some((item) => item.field === "seller_objective")
  ) {
    captures.push(capture("seller_objective", text.slice(0, 200)));
  }

  return captures;
}

export function extractDiscoveryFromMessage(input: {
  text: string;
  lastQuestion: DiscoveryFieldId | null;
  profile?: DiscoveryProfile;
}): {
  captures: DiscoveryCapture[];
  declinedLast: boolean;
  reverseQuestion: boolean;
} {
  const text = input.text.trim();
  const profile = input.profile ?? "SELLER";
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
    return { captures: [], declinedLast: false, reverseQuestion: false };
  }

  const captures =
    profile === "BUYER"
      ? extractBuyerCaptures({
          text,
          lastQuestion: input.lastQuestion,
          acceptLastFallback,
          reverseQuestion,
        })
      : extractSellerCaptures({
          text,
          lastQuestion: input.lastQuestion,
          acceptLastFallback,
          reverseQuestion,
        });

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
  if (
    lastQuestion === "investment_size_max" ||
    lastQuestion === "investment_size_min" ||
    lastQuestion === "target_ebitda_min" ||
    lastQuestion === "target_revenue_min"
  ) {
    return "거래 배수는 업종·규모·성장성·거래 구조에 따라 달라집니다. 지금은 특정 배수나 가격을 제시하지 않습니다.";
  }
  return "질문해 주셔서 감사합니다. 일반론으로만 안내하며, 실제 딜 경험이나 확정 일정을 가진 것처럼 말씀드리지 않습니다.";
}
