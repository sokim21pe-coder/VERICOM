import type { TomMemoryItem } from "@/types/tom";
import {
  parseKrwExpression,
  parseMultiCriterion,
  parseNumericCriterion,
  type ParsedKrwExpression,
} from "@/lib/tom/criteria-value";
import {
  BUYER_CRITERIA_KEYS,
  SELLER_MEMORY_KEYS,
  matchConstraintStrength,
  matchGeography,
  matchIndustryTerm,
  matchListing,
  matchOwnership,
  matchStructure,
  matchTimeline,
  type ConstraintStrength,
  type IndustryCanonical,
  type ListingCanonical,
  type OwnershipCanonical,
  type StructureCanonical,
  type TimelineCategory,
} from "@/lib/tom/criteria-taxonomy";

export type CriteriaProvenance = {
  sourceMemoryKey: string;
  rawValue: string;
  normalizedValue: string;
  normalizationRule: string;
  confidence: number;
};

export type NormalizedTerm = {
  canonical: IndustryCanonical | null;
  raw: string;
  confidence: number;
  broaderCategory: IndustryCanonical | null;
  constraint: ConstraintStrength;
  provenance: CriteriaProvenance;
};

export type NormalizedGeography = {
  type: "country" | "region" | "unresolved";
  countryCode: string | null;
  region: string | null;
  raw: string;
  constraint: ConstraintStrength;
  provenance: CriteriaProvenance;
};

export type NormalizedMoneyRange = {
  minKrw: number | null;
  maxKrw: number | null;
  currency: "KRW";
  raw: string;
  unresolved: boolean;
  constraint: ConstraintStrength;
  provenance: CriteriaProvenance | null;
};

export type NormalizedOwnership = {
  canonical: OwnershipCanonical;
  percent: number | null;
  raw: string;
  constraint: ConstraintStrength;
  provenance: CriteriaProvenance;
};

export type NormalizedListing = {
  canonical: ListingCanonical;
  raw: string;
  constraint: ConstraintStrength;
  provenance: CriteriaProvenance;
};

export type NormalizedStructure = {
  canonical: StructureCanonical;
  raw: string;
  constraint: ConstraintStrength;
  provenance: CriteriaProvenance;
};

export type NormalizedTimeline = {
  category: TimelineCategory;
  durationMonths: number | null;
  raw: string;
  provenance: CriteriaProvenance;
};

export type CriteriaCompleteness = {
  requiredKnown: number;
  requiredTotal: number;
  missingRequired: string[];
};

export type NormalizedAcquisitionCriteria = {
  buyerCompanyId: string | null;
  conversationId: string;
  acquisitionObjective: string | null;
  industries: NormalizedTerm[];
  businesses: NormalizedTerm[];
  geographies: NormalizedGeography[];
  revenueRange: NormalizedMoneyRange;
  ebitdaRange: NormalizedMoneyRange;
  investmentRange: NormalizedMoneyRange;
  ownershipPreferences: NormalizedOwnership[];
  structurePreferences: NormalizedStructure[];
  listingPreference: NormalizedListing | null;
  technologyRequirements: NormalizedTerm[];
  customerRequirements: { raw: string; provenance: CriteriaProvenance }[];
  excludedIndustries: NormalizedTerm[];
  excludedGeographies: NormalizedGeography[];
  excludedCompanies: { raw: string; provenance: CriteriaProvenance }[];
  dealBreakers: { raw: string; provenance: CriteriaProvenance }[];
  acquisitionTimeline: NormalizedTimeline | null;
  managementRetentionPreference: { raw: string; provenance: CriteriaProvenance } | null;
  sourceMemoryKeys: string[];
  normalizationWarnings: string[];
  completeness: CriteriaCompleteness;
};

const REQUIRED_KEYS = [
  "acquisition_objective",
  "target_industries",
  "target_businesses",
  "target_geographies",
  "investment_size_max",
] as const;

const BUYER_KEY_SET = new Set<string>(BUYER_CRITERIA_KEYS);
const SELLER_KEY_SET = new Set<string>(SELLER_MEMORY_KEYS);

const COUNTRY_LABEL: Record<string, string> = {
  KR: "한국",
  JP: "일본",
  US: "미국",
  CN: "중국",
};

const LISTING_LABEL: Record<ListingCanonical, string> = {
  PRIVATE_ONLY: "비상장",
  PUBLIC_ONLY: "상장",
  PUBLIC_OK: "상장·비상장",
  FLEXIBLE: "상장 여부 무관",
};

export type NormalizeAcquisitionCriteriaInput = {
  memories: TomMemoryItem[];
  conversationId: string;
  buyerCompanyId: string | null;
};

function memoryMap(memories: TomMemoryItem[]): Map<string, TomMemoryItem> {
  const map = new Map<string, TomMemoryItem>();
  for (const item of memories) {
    if (BUYER_KEY_SET.has(item.key)) {
      map.set(item.key, item);
    }
  }
  return map;
}

function knownValue(item: TomMemoryItem | undefined): boolean {
  if (!item?.value?.trim()) return false;
  const value = item.value.trim();
  if (value === "UNKNOWN" || value === "SKIPPED") return false;
  if (item.informationState === "UNKNOWN") return false;
  return true;
}

function provenance(
  key: string,
  raw: string,
  normalized: string,
  rule: string,
  confidence: number,
): CriteriaProvenance {
  return {
    sourceMemoryKey: key,
    rawValue: raw,
    normalizedValue: normalized,
    normalizationRule: rule,
    confidence,
  };
}

function tokensFromMemory(item: TomMemoryItem | undefined): { values: string[]; raw: string } {
  if (!item?.value) return { values: [], raw: "" };
  return parseMultiCriterion(item.value);
}

function dedupeTerms(items: NormalizedTerm[]): NormalizedTerm[] {
  const seen = new Set<string>();
  const result: NormalizedTerm[] = [];
  for (const item of items) {
    const id = item.canonical ?? `raw:${item.raw.toLowerCase()}`;
    if (seen.has(id)) continue;
    seen.add(id);
    result.push(item);
  }
  return result;
}

function dedupeGeos(items: NormalizedGeography[]): NormalizedGeography[] {
  const seen = new Set<string>();
  const result: NormalizedGeography[] = [];
  for (const item of items) {
    const id =
      item.type === "country" && item.countryCode
        ? `country:${item.countryCode}`
        : item.type === "region" && item.region
          ? `region:${item.region}`
          : `raw:${item.raw.toLowerCase()}`;
    if (seen.has(id)) continue;
    seen.add(id);
    result.push(item);
  }
  return result;
}

function normalizeIndustryTokens(
  item: TomMemoryItem | undefined,
  warnings: string[],
): { industries: NormalizedTerm[]; businesses: NormalizedTerm[] } {
  const industries: NormalizedTerm[] = [];
  const businesses: NormalizedTerm[] = [];
  if (!item?.value || !knownValue(item)) return { industries, businesses };
  const parsed = tokensFromMemory(item);
  for (const raw of parsed.values.length ? parsed.values : parsed.raw ? [parsed.raw] : []) {
    const match = matchIndustryTerm(raw);
    const constraint = (() => {
      const fromToken = matchConstraintStrength(raw);
      if (fromToken !== "UNRESOLVED") return fromToken;
      return matchConstraintStrength(parsed.raw);
    })();
    if (!match) {
      warnings.push(`${item.key}:unresolved_term:${raw}`);
      const term: NormalizedTerm = {
        canonical: null,
        raw,
        confidence: 0,
        broaderCategory: null,
        constraint,
        provenance: provenance(item.key, raw, "UNRESOLVED", "industry_unresolved", 0),
      };
      industries.push(term);
      continue;
    }
    const term: NormalizedTerm = {
      canonical: match.canonical,
      raw,
      confidence: match.confidence,
      broaderCategory: match.broader ?? null,
      constraint,
      provenance: provenance(item.key, raw, match.canonical, match.rule, match.confidence),
    };
    if (match.asBusiness) {
      businesses.push(term);
      if (match.broader) {
        industries.push({
          ...term,
          canonical: match.broader,
          broaderCategory: null,
          provenance: provenance(
            item.key,
            raw,
            match.broader,
            `${match.rule}:broader`,
            Math.min(match.confidence, 0.8),
          ),
        });
      }
    } else {
      industries.push(term);
    }
  }
  return { industries: dedupeTerms(industries), businesses: dedupeTerms(businesses) };
}

function normalizeGeoTokens(
  item: TomMemoryItem | undefined,
  warnings: string[],
): NormalizedGeography[] {
  if (!item?.value || !knownValue(item)) return [];
  const parsed = tokensFromMemory(item);
  const geos: NormalizedGeography[] = [];
  for (const raw of parsed.values.length ? parsed.values : parsed.raw ? [parsed.raw] : []) {
    const match = matchGeography(raw);
    const constraint = (() => {
      const fromToken = matchConstraintStrength(raw);
      if (fromToken !== "UNRESOLVED") return fromToken;
      return matchConstraintStrength(parsed.raw);
    })();
    if (!match) {
      warnings.push(`${item.key}:unresolved_geo:${raw}`);
      geos.push({
        type: "unresolved",
        countryCode: null,
        region: null,
        raw,
        constraint,
        provenance: provenance(item.key, raw, "UNRESOLVED", "geo_unresolved", 0),
      });
      continue;
    }
    geos.push({
      type: match.type,
      countryCode: match.countryCode,
      region: match.region,
      raw,
      constraint,
      provenance: provenance(
        item.key,
        raw,
        match.countryCode ?? match.region ?? "UNRESOLVED",
        match.rule,
        match.confidence,
      ),
    });
  }
  return dedupeGeos(geos);
}

function emptyRange(): NormalizedMoneyRange {
  return {
    minKrw: null,
    maxKrw: null,
    currency: "KRW",
    raw: "",
    unresolved: false,
    constraint: "UNRESOLVED",
    provenance: null,
  };
}

function applyBound(
  range: NormalizedMoneyRange,
  parsed: ParsedKrwExpression,
  role: "min" | "max" | "either",
  key: string,
  warnings: string[],
): NormalizedMoneyRange {
  const constraint = matchConstraintStrength(parsed.raw);
  const next: NormalizedMoneyRange = {
    ...range,
    raw: [range.raw, parsed.raw].filter(Boolean).join(" | "),
    constraint: range.constraint === "HARD" || constraint === "HARD" ? "HARD" : constraint,
  };
  if (parsed.unresolved) {
    next.unresolved = true;
    warnings.push(`${key}:${parsed.warning ?? "unresolved_amount"}`);
    next.provenance = provenance(key, parsed.raw, "UNRESOLVED", parsed.warning ?? "unresolved_amount", 0);
    return next;
  }
  if (parsed.minKrw != null) next.minKrw = parsed.minKrw;
  if (parsed.maxKrw != null) next.maxKrw = parsed.maxKrw;
  if (parsed.valueKrw != null) {
    if (role === "min") next.minKrw = parsed.valueKrw;
    else if (role === "max") next.maxKrw = parsed.valueKrw;
    else if (next.minKrw == null && next.maxKrw == null) {
      next.minKrw = parsed.valueKrw;
      next.maxKrw = parsed.valueKrw;
    }
  }
  const normalized =
    next.minKrw != null || next.maxKrw != null
      ? `${next.minKrw ?? ""}-${next.maxKrw ?? ""}KRW`
      : "UNRESOLVED";
  next.provenance = provenance(key, parsed.raw, normalized, "krw_eok", 1);
  return next;
}

function moneyFromField(
  item: TomMemoryItem | undefined,
  role: "min" | "max" | "either",
  range: NormalizedMoneyRange,
  warnings: string[],
): NormalizedMoneyRange {
  if (!item?.value || !knownValue(item)) return range;
  const stored = parseNumericCriterion(item.value);
  const parsed = parseKrwExpression(item.value);
  if (stored?.krw != null && parsed.valueKrw == null && parsed.minKrw == null && parsed.maxKrw == null) {
    parsed.valueKrw = stored.krw;
    parsed.unresolved = false;
    parsed.warning = null;
    parsed.raw = stored.raw;
  }
  return applyBound(range, parsed, role, item.key, warnings);
}

function rawTextList(item: TomMemoryItem | undefined): { raw: string; provenance: CriteriaProvenance }[] {
  if (!item?.value || !knownValue(item)) return [];
  const parsed = tokensFromMemory(item);
  const values = parsed.values.length ? parsed.values : parsed.raw ? [parsed.raw] : [];
  return values.map((raw) => ({
    raw,
    provenance: provenance(item.key, raw, raw, "raw_passthrough", 1),
  }));
}

export function normalizeAcquisitionCriteria(
  input: NormalizeAcquisitionCriteriaInput,
): NormalizedAcquisitionCriteria {
  const warnings: string[] = [];
  const byKey = memoryMap(input.memories);
  const sourceMemoryKeys = [...byKey.keys()].sort();

  for (const item of input.memories) {
    if (SELLER_KEY_SET.has(item.key)) {
      warnings.push(`ignored_seller_memory:${item.key}`);
    }
  }

  const industryFromTarget = normalizeIndustryTokens(byKey.get("target_industries"), warnings);
  const businessFromTarget = normalizeIndustryTokens(byKey.get("target_businesses"), warnings);
  const techFromReq = normalizeIndustryTokens(byKey.get("technology_requirements"), warnings);
  const excludedIndustries = normalizeIndustryTokens(
    byKey.get("excluded_industries"),
    warnings,
  ).industries;

  const industries = dedupeTerms([
    ...industryFromTarget.industries,
    ...businessFromTarget.industries.filter((item) => item.canonical && item.canonical !== "BMS" && item.canonical !== "ESS"),
  ]);
  const businesses = dedupeTerms([
    ...industryFromTarget.businesses,
    ...businessFromTarget.businesses,
    ...businessFromTarget.industries.filter((item) => item.canonical === "BMS" || item.canonical === "ESS"),
  ]);
  const technologyRequirements = dedupeTerms([
    ...techFromReq.businesses,
    ...techFromReq.industries,
    ...industryFromTarget.businesses.filter((item) => item.canonical === "BMS"),
  ]);

  const geographies = normalizeGeoTokens(byKey.get("target_geographies"), warnings);
  const excludedGeographies = normalizeGeoTokens(byKey.get("excluded_geographies"), warnings);

  let revenueRange = emptyRange();
  revenueRange = moneyFromField(byKey.get("target_revenue_min"), "min", revenueRange, warnings);
  revenueRange = moneyFromField(byKey.get("target_revenue_max"), "max", revenueRange, warnings);

  let ebitdaRange = emptyRange();
  ebitdaRange = moneyFromField(byKey.get("target_ebitda_min"), "min", ebitdaRange, warnings);
  ebitdaRange = moneyFromField(byKey.get("target_ebitda_max"), "max", ebitdaRange, warnings);

  let investmentRange = emptyRange();
  investmentRange = moneyFromField(byKey.get("investment_size_min"), "min", investmentRange, warnings);
  investmentRange = moneyFromField(byKey.get("investment_size_max"), "max", investmentRange, warnings);

  const ownershipItem = byKey.get("ownership_preference");
  const ownershipPreferences: NormalizedOwnership[] = [];
  if (ownershipItem?.value && knownValue(ownershipItem)) {
    const matched = matchOwnership(ownershipItem.value);
    if (matched) {
      ownershipPreferences.push({
        canonical: matched.canonical,
        percent: matched.percent,
        raw: ownershipItem.value,
        constraint: matchConstraintStrength(ownershipItem.value),
        provenance: provenance(
          ownershipItem.key,
          ownershipItem.value,
          matched.canonical,
          matched.rule,
          1,
        ),
      });
    } else {
      warnings.push("ownership_preference:unresolved");
    }
  }

  const structureItem = byKey.get("structure_preference");
  const structurePreferences: NormalizedStructure[] = [];
  if (structureItem?.value && knownValue(structureItem)) {
    const matched = matchStructure(structureItem.value);
    if (matched) {
      structurePreferences.push({
        canonical: matched,
        raw: structureItem.value,
        constraint: matchConstraintStrength(structureItem.value),
        provenance: provenance(
          structureItem.key,
          structureItem.value,
          matched,
          `structure:${matched}`,
          1,
        ),
      });
    } else {
      warnings.push("structure_preference:unresolved");
    }
  }

  const listingItem = byKey.get("listing_preference");
  let listingPreference: NormalizedListing | null = null;
  if (listingItem?.value && knownValue(listingItem)) {
    const matched = matchListing(listingItem.value);
    if (matched) {
      const fromEnum = listingItem.value === matched;
      listingPreference = {
        canonical: matched,
        raw: listingItem.value,
        constraint:
          matched === "PRIVATE_ONLY" || matched === "PUBLIC_ONLY"
            ? "HARD"
            : matchConstraintStrength(listingItem.value),
        provenance: provenance(
          listingItem.key,
          listingItem.value,
          matched,
          fromEnum ? `listing_enum:${matched}` : `listing_text:${matched}`,
          1,
        ),
      };
    } else {
      warnings.push("listing_preference:unresolved");
    }
  }

  const timelineItem = byKey.get("acquisition_timeline");
  let acquisitionTimeline: NormalizedTimeline | null = null;
  if (timelineItem?.value && knownValue(timelineItem)) {
    const matched = matchTimeline(timelineItem.value);
    if (matched) {
      acquisitionTimeline = {
        category: matched.category,
        durationMonths: matched.durationMonths,
        raw: timelineItem.value,
        provenance: provenance(
          timelineItem.key,
          timelineItem.value,
          matched.durationMonths != null
            ? `durationMonths=${matched.durationMonths}`
            : matched.category,
          matched.rule,
          matched.category === "YEAR_END" ? 0.5 : 1,
        ),
      };
    } else {
      warnings.push("acquisition_timeline:unresolved");
    }
  }

  const objective = byKey.get("acquisition_objective");
  const retention = byKey.get("management_retention_preference");

  const missingRequired = REQUIRED_KEYS.filter((key) => !knownValue(byKey.get(key)));

  return {
    buyerCompanyId: input.buyerCompanyId,
    conversationId: input.conversationId,
    acquisitionObjective: objective && knownValue(objective) ? objective.value : null,
    industries,
    businesses,
    geographies,
    revenueRange,
    ebitdaRange,
    investmentRange,
    ownershipPreferences,
    structurePreferences,
    listingPreference,
    technologyRequirements,
    customerRequirements: rawTextList(byKey.get("customer_requirements")),
    excludedIndustries,
    excludedGeographies,
    excludedCompanies: rawTextList(byKey.get("excluded_companies")),
    dealBreakers: rawTextList(byKey.get("deal_breakers")),
    acquisitionTimeline,
    managementRetentionPreference: retention && knownValue(retention)
      ? {
          raw: retention.value ?? "",
          provenance: provenance(
            retention.key,
            retention.value ?? "",
            retention.value ?? "",
            "raw_passthrough",
            1,
          ),
        }
      : null,
    sourceMemoryKeys,
    normalizationWarnings: warnings,
    completeness: {
      requiredKnown: REQUIRED_KEYS.length - missingRequired.length,
      requiredTotal: REQUIRED_KEYS.length,
      missingRequired: [...missingRequired],
    },
  };
}

export function formatKrwEok(krw: number): string {
  const eok = krw / 100_000_000;
  const label = Number.isInteger(eok) ? String(eok) : String(eok);
  return `${label}억원`;
}

export function formatNormalizedCriteriaSummary(
  criteria: NormalizedAcquisitionCriteria,
): string {
  const geoLabels = criteria.geographies
    .filter((item) => item.countryCode)
    .map((item) => COUNTRY_LABEL[item.countryCode as string] ?? item.countryCode);
  const uniqueGeo = [...new Set(geoLabels)];
  const listing = criteria.listingPreference
    ? LISTING_LABEL[criteria.listingPreference.canonical]
    : null;
  const businessLabels = criteria.businesses.map((item) => item.canonical ?? item.raw);
  const industryLabels = criteria.industries.map((item) => item.canonical ?? item.raw);
  const uniqueBiz = [...new Set((businessLabels.length ? businessLabels : industryLabels).filter(Boolean))];
  const maxInvest = criteria.investmentRange.maxKrw;

  if (!uniqueGeo.length && !listing && !uniqueBiz.length && maxInvest == null) {
    return "아직 정규화된 인수조건이 충분하지 않습니다.";
  }

  const parts: string[] = [];
  if (uniqueGeo.length) parts.push(uniqueGeo.join("·"));
  if (listing) parts.push(listing);
  const subject = uniqueBiz.length ? `${uniqueBiz.join("·")} 관련 기업` : "기업";
  const location = parts.length ? `${parts.join(" ")} ${subject}` : subject;
  const budget =
    maxInvest != null ? `투자한도 ${formatKrwEok(maxInvest)}까지` : null;
  return budget
    ? `현재 인수조건을 정리하면 ${location}, ${budget}입니다.`
    : `현재 인수조건을 정리하면 ${location}입니다.`;
}
