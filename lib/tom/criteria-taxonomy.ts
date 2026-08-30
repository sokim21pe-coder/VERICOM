/** Buyer Acquisition Criteria 최소 Taxonomy. 공식 산업분류 전체가 아니다. */

export type IndustryCanonical =
  | "ENERGY"
  | "BATTERY"
  | "SECONDARY_BATTERY"
  | "BMS"
  | "ESS"
  | "RECYCLING"
  | "AUTOMOTIVE"
  | "SEMICONDUCTOR"
  | "SOFTWARE"
  | "MANUFACTURING"
  | "HEALTHCARE"
  | "CONSUMER"
  | "OTHER";

export type OwnershipCanonical =
  | "FULL_ACQUISITION"
  | "CONTROL"
  | "MAJORITY"
  | "MINORITY"
  | "FLEXIBLE"
  | "UNDECIDED";

export type ListingCanonical =
  | "PRIVATE_ONLY"
  | "PUBLIC_ONLY"
  | "PUBLIC_OK"
  | "FLEXIBLE";

export type StructureCanonical =
  | "CASH"
  | "STAGED"
  | "EARNOUT"
  | "ROLLOVER"
  | "ASSET_DEAL"
  | "SHARE_DEAL"
  | "FLEXIBLE";

export type TimelineCategory = "DURATION" | "ASAP" | "YEAR_END" | "UNKNOWN";

export type ConstraintStrength = "HARD" | "SOFT" | "UNRESOLVED";

type AliasRule = {
  canonical: IndustryCanonical;
  aliases: string[];
  broader?: IndustryCanonical;
  asBusiness?: boolean;
};

const INDUSTRY_RULES: AliasRule[] = [
  {
    canonical: "SECONDARY_BATTERY",
    aliases: ["이차전지", "2차전지", "secondary battery", "secondary-battery"],
    broader: "BATTERY",
  },
  {
    canonical: "BMS",
    aliases: ["bms", "배터리 관리", "배터리관리"],
    broader: "BATTERY",
    asBusiness: true,
  },
  {
    canonical: "ESS",
    aliases: ["ess", "에너지저장", "에너지 저장"],
    broader: "ENERGY",
    asBusiness: true,
  },
  {
    canonical: "RECYCLING",
    aliases: ["재활용", "recycling", "폐배터리"],
    broader: "ENERGY",
  },
  {
    canonical: "BATTERY",
    aliases: ["배터리", "battery", "battery_related"],
    broader: "ENERGY",
  },
  {
    canonical: "AUTOMOTIVE",
    aliases: ["자동차", "automotive", "auto"],
  },
  {
    canonical: "SEMICONDUCTOR",
    aliases: ["반도체", "semiconductor"],
  },
  {
    canonical: "SOFTWARE",
    aliases: ["소프트웨어", "software", "saas"],
  },
  {
    canonical: "MANUFACTURING",
    aliases: ["제조", "manufacturing"],
  },
  {
    canonical: "HEALTHCARE",
    aliases: ["의료", "healthcare", "헬스케어"],
  },
  {
    canonical: "CONSUMER",
    aliases: ["소비재", "consumer"],
  },
  {
    canonical: "ENERGY",
    aliases: ["에너지", "energy"],
  },
];

const GEO_COUNTRY: { code: string; aliases: string[] }[] = [
  { code: "KR", aliases: ["한국", "대한민국", "korea", "south korea", "southkorea"] },
  { code: "JP", aliases: ["일본", "japan"] },
  { code: "US", aliases: ["미국", "usa", "us", "united states", "unitedstates"] },
  { code: "CN", aliases: ["중국", "china"] },
];

const GEO_REGION: { id: string; aliases: string[] }[] = [
  { id: "CAPITAL_AREA", aliases: ["수도권", "경기도"] },
  { id: "ASIA", aliases: ["아시아", "asia"] },
  { id: "EUROPE", aliases: ["유럽", "europe"] },
  { id: "SOUTHEAST_ASIA", aliases: ["동남아", "아세안", "asean"] },
];

function compact(text: string): string {
  return text.replace(/\s+/g, "").toLowerCase();
}

function aliasHits(hay: string, alias: string): boolean {
  const needle = compact(alias);
  if (!needle || !hay) return false;
  if (hay === needle) return true;
  if (needle.length <= 2) return false;
  return hay.includes(needle);
}

export function matchIndustryTerm(raw: string): {
  canonical: IndustryCanonical;
  broader?: IndustryCanonical;
  asBusiness: boolean;
  rule: string;
  confidence: number;
} | null {
  const hay = compact(raw);
  if (!hay) return null;
  for (const rule of INDUSTRY_RULES) {
    if (rule.aliases.some((alias) => aliasHits(hay, alias))) {
      const genericBattery =
        rule.canonical === "BATTERY" &&
        /배터리|battery/.test(hay) &&
        !/이차|2차|secondary/.test(hay);
      return {
        canonical: rule.canonical,
        broader: rule.broader,
        asBusiness: Boolean(rule.asBusiness),
        rule: `industry_alias:${rule.canonical}`,
        confidence: genericBattery ? 0.7 : 1,
      };
    }
  }
  return null;
}

export function matchGeography(raw: string): {
  type: "country" | "region";
  countryCode: string | null;
  region: string | null;
  rule: string;
  confidence: number;
} | null {
  const hay = compact(raw);
  for (const item of GEO_COUNTRY) {
    if (item.aliases.some((alias) => aliasHits(hay, alias))) {
      return {
        type: "country",
        countryCode: item.code,
        region: null,
        rule: `geo_country:${item.code}`,
        confidence: 1,
      };
    }
  }
  for (const item of GEO_REGION) {
    if (item.aliases.some((alias) => aliasHits(hay, alias))) {
      return {
        type: "region",
        countryCode: null,
        region: item.id,
        rule: `geo_region:${item.id}`,
        confidence: 1,
      };
    }
  }
  return null;
}

export function matchOwnership(raw: string): {
  canonical: OwnershipCanonical;
  percent: number | null;
  rule: string;
} | null {
  const text = raw.trim();
  if (!text || text === "UNKNOWN" || text === "SKIPPED") return null;
  const percentMatch = text.match(/(\d+(?:\.\d+)?)\s*%/);
  const percent =
    percentMatch && !/억/.test(text)
      ? Number(percentMatch[1])
      : null;

  if (
    text === "100_PERCENT" ||
    /100\s*%|전부\s*인수|지분\s*전부|풀\s*인수|full/i.test(text)
  ) {
    if (!/100\s*억/.test(text)) {
      return { canonical: "FULL_ACQUISITION", percent: percent ?? 100, rule: "ownership:full" };
    }
  }
  if (text === "CONTROL" || /경영권/.test(text)) {
    return { canonical: "CONTROL", percent, rule: "ownership:control" };
  }
  if (text === "MAJORITY" || /과반|majority/i.test(text)) {
    return { canonical: "MAJORITY", percent, rule: "ownership:majority" };
  }
  if (text === "MINORITY" || /소수\s*지분|minority/i.test(text)) {
    return { canonical: "MINORITY", percent, rule: "ownership:minority" };
  }
  if (text === "FLEXIBLE" || /상관없|flexible/i.test(text)) {
    return { canonical: "FLEXIBLE", percent, rule: "ownership:flexible" };
  }
  if (text === "UNDECIDED" || /미정|아직 모르/.test(text)) {
    return { canonical: "UNDECIDED", percent, rule: "ownership:undecided" };
  }
  return percent != null
    ? { canonical: percent >= 100 ? "FULL_ACQUISITION" : percent > 50 ? "MAJORITY" : "MINORITY", percent, rule: "ownership:percent" }
    : null;
}

export function matchListing(raw: string): ListingCanonical | null {
  const text = raw.trim();
  if (text === "PRIVATE_ONLY" || /비상장만|상장사\s*싫|상장은\s*싫|private\s*only/i.test(text)) {
    return "PRIVATE_ONLY";
  }
  if (text === "PUBLIC_ONLY" || /상장만|상장사만|listed\s*only/i.test(text)) {
    return "PUBLIC_ONLY";
  }
  if (text === "PUBLIC_OK" || /상장도\s*괜찮|상장사도/.test(text)) {
    return "PUBLIC_OK";
  }
  if (text === "FLEXIBLE" || /상관없|flex/i.test(text)) {
    return "FLEXIBLE";
  }
  return null;
}

export function matchStructure(raw: string): StructureCanonical | null {
  const text = raw.trim();
  if (text === "CASH" || /현금\s*인수|전액\s*현금|100%\s*cash/i.test(text)) return "CASH";
  if (text === "STAGED" || /staged|단계적/i.test(text)) return "STAGED";
  if (text === "EARNOUT" || /earn-?out/i.test(text)) return "EARNOUT";
  if (text === "ROLLOVER" || /rollover|롤오버/i.test(text)) return "ROLLOVER";
  if (text === "ASSET_DEAL" || /자산\s*인수|asset/i.test(text)) return "ASSET_DEAL";
  if (text === "SHARE_DEAL" || /주식\s*인수|share\s*deal/i.test(text)) return "SHARE_DEAL";
  if (text === "FLEXIBLE" || /상관없|flex/i.test(text)) return "FLEXIBLE";
  return null;
}

export function matchTimeline(raw: string): {
  category: TimelineCategory;
  durationMonths: number | null;
  rule: string;
} | null {
  const text = raw.trim();
  if (!text) return null;
  if (/아직 미정|미정|UNKNOWN|SKIPPED/.test(text)) {
    return { category: "UNKNOWN", durationMonths: null, rule: "timeline:unknown" };
  }
  if (/가능한 빨리|asap|즉시/i.test(text)) {
    return { category: "ASAP", durationMonths: null, rule: "timeline:asap" };
  }
  const months = text.match(/(\d+)\s*개월/);
  if (months) {
    return {
      category: "DURATION",
      durationMonths: Number(months[1]),
      rule: "timeline:duration_months",
    };
  }
  if (/올해/.test(text)) {
    return { category: "YEAR_END", durationMonths: null, rule: "timeline:year_end_raw" };
  }
  return null;
}

export function matchConstraintStrength(raw: string): ConstraintStrength {
  if (/이어야|필수|반드시|만 보고|만$|만 |제외/.test(raw)) return "HARD";
  if (/가능하면|정도면 좋|선호/.test(raw)) return "SOFT";
  return "UNRESOLVED";
}

export const BUYER_CRITERIA_KEYS = [
  "acquisition_objective",
  "target_industries",
  "target_businesses",
  "target_geographies",
  "target_revenue_min",
  "target_revenue_max",
  "target_ebitda_min",
  "target_ebitda_max",
  "investment_size_min",
  "investment_size_max",
  "ownership_preference",
  "acquisition_timeline",
  "profitability_requirement",
  "technology_requirements",
  "customer_requirements",
  "structure_preference",
  "listing_preference",
  "excluded_industries",
  "excluded_geographies",
  "excluded_companies",
  "deal_breakers",
  "management_retention_preference",
  "strategic_requirements",
  "debt_tolerance",
  "growth_preference",
] as const;

export const SELLER_MEMORY_KEYS = [
  "reason_for_sale",
  "sale_scope",
  "valuation_expectation",
  "seller_objective",
  "sale_readiness",
  "desired_timeline",
] as const;
