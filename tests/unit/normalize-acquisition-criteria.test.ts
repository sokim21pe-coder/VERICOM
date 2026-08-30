import assert from "node:assert/strict";
import test from "node:test";
import { InformationState, PlatformRole } from "@/types/enums";
import type { CurrentContext } from "@/types/context";
import type { TomConversation, TomMemoryItem } from "@/types/tom";
import {
  encodeMultiCriterion,
  encodeNumericCriterion,
  parseKrwExpression,
} from "@/lib/tom/criteria-value";
import { matchGeography, matchIndustryTerm } from "@/lib/tom/criteria-taxonomy";
import {
  canReadNormalizedBuyerCriteria,
  canReadTomConversation,
} from "@/lib/tom/access";
import {
  formatNormalizedCriteriaSummary,
  normalizeAcquisitionCriteria,
} from "@/lib/tom/normalize-acquisition-criteria";
import { extractDiscoveryFromMessage } from "@/lib/tom/extract-discovery";
import { runBuyerDiscoveryTurn, runSellerDiscoveryTurn } from "@/lib/tom/seller-discovery";
import type { DiscoveryContextFacts } from "@/lib/tom/question-policy";

function mem(
  key: string,
  value: string,
  state: InformationState = InformationState.CONFIRMED,
): TomMemoryItem {
  return {
    key,
    value,
    informationState: state,
    source: "user_message:USER_CLAIM",
    confidence: 1,
  };
}

function buyerContextFacts(): DiscoveryContextFacts {
  return {
    companyName: "TEST_DEV_BUYER_A_CO",
    industry: "폐배터리 재활용",
    platformRole: PlatformRole.BUYER_USER,
    dealId: null,
    dealRole: null,
    dealStage: null,
    conversationIntent: "buy",
    profile: "BUYER",
  };
}

function sellerContextFacts(): DiscoveryContextFacts {
  return {
    companyName: "TEST_DEV_SELLER_CO",
    industry: "테스트업종",
    platformRole: PlatformRole.SELLER_USER,
    dealId: null,
    dealRole: null,
    dealStage: null,
    conversationIntent: "sell",
    profile: "SELLER",
  };
}

function viewer(companyId: string, role: PlatformRole): CurrentContext {
  return {
    user: {
      id: `u-${companyId}`,
      authUserId: `a-${companyId}`,
      email: `${companyId}@test`,
      displayName: companyId,
    },
    company: {
      id: companyId,
      name: companyId,
      industry: null,
      verificationStatus: "unverified",
    },
    platformRole: role,
    platformRoles: [role],
    companyMembership: null,
    deal: null,
    dealRole: null,
    permissions: [],
  };
}

test("TEST 1 money 100억 is 10000000000 KRW", () => {
  const parsed = parseKrwExpression("100억");
  assert.equal(parsed.valueKrw, 10_000_000_000);
  assert.equal(parsed.currency, "KRW");
  assert.equal(parsed.unresolved, false);
  assert.equal(parsed.raw, "100억");
});

test("1.5억 is 150000000 KRW", () => {
  assert.equal(parseKrwExpression("1.5억").valueKrw, 150_000_000);
});

test("100억 이하 is max only", () => {
  const parsed = parseKrwExpression("100억 이하");
  assert.equal(parsed.maxKrw, 10_000_000_000);
  assert.equal(parsed.minKrw, null);
  assert.equal(parsed.valueKrw, null);
});

test("50억 이상 is min only", () => {
  const parsed = parseKrwExpression("50억 이상");
  assert.equal(parsed.minKrw, 5_000_000_000);
  assert.equal(parsed.maxKrw, null);
});

test("TEST 2 revenue 300억에서 1000억 min/max", () => {
  const parsed = parseKrwExpression("매출 300억에서 1000억");
  assert.equal(parsed.minKrw, 30_000_000_000);
  assert.equal(parsed.maxKrw, 100_000_000_000);
  const snapshot = normalizeAcquisitionCriteria({
    conversationId: "c1",
    buyerCompanyId: "co-a",
    memories: [
      mem(
        "target_revenue_min",
        encodeNumericCriterion({ krw: 30_000_000_000, raw: "매출 300억에서 1000억" }),
      ),
      mem(
        "target_revenue_max",
        encodeNumericCriterion({ krw: 100_000_000_000, raw: "매출 300억에서 1000억" }),
      ),
    ],
  });
  assert.equal(snapshot.revenueRange.minKrw, 30_000_000_000);
  assert.equal(snapshot.revenueRange.maxKrw, 100_000_000_000);
  assert.equal(snapshot.revenueRange.currency, "KRW");
  assert.match(snapshot.revenueRange.raw, /300억/);
});

test("TEST 9 vague tens-of-billions stays unresolved", () => {
  const parsed = parseKrwExpression("수십억");
  assert.equal(parsed.valueKrw, null);
  assert.equal(parsed.minKrw, null);
  assert.equal(parsed.maxKrw, null);
  assert.equal(parsed.unresolved, true);
  assert.equal(parseKrwExpression("적당한 가격").unresolved, true);
  assert.equal(parseKrwExpression("큰 회사").unresolved, true);
  const snapshot = normalizeAcquisitionCriteria({
    conversationId: "c1",
    buyerCompanyId: "co-a",
    memories: [
      mem("investment_size_max", encodeNumericCriterion({ krw: null, raw: "수십억" })),
    ],
  });
  assert.equal(snapshot.investmentRange.maxKrw, null);
  assert.equal(snapshot.investmentRange.unresolved, true);
  assert.ok(snapshot.normalizationWarnings.some((item) => item.includes("vague_amount")));
});

test("TEST 3 and TEST 4 geography KR JP and 대한민국", () => {
  assert.equal(matchGeography("대한민국")?.countryCode, "KR");
  assert.equal(matchGeography("한국")?.countryCode, "KR");
  const snapshot = normalizeAcquisitionCriteria({
    conversationId: "c1",
    buyerCompanyId: "co-a",
    memories: [
      mem(
        "target_geographies",
        encodeMultiCriterion({ values: ["한국", "일본"], raw: "한국하고 일본" }),
      ),
    ],
  });
  assert.deepEqual(
    snapshot.geographies.map((item) => item.countryCode).sort(),
    ["JP", "KR"],
  );
  assert.equal(matchGeography("수도권")?.type, "region");
  assert.equal(matchGeography("수도권")?.countryCode, null);
  assert.equal(matchGeography("아시아")?.region, "ASIA");
});

test("TEST 5 listing PRIVATE_ONLY", () => {
  const snapshot = normalizeAcquisitionCriteria({
    conversationId: "c1",
    buyerCompanyId: "co-a",
    memories: [mem("listing_preference", "PRIVATE_ONLY")],
  });
  assert.equal(snapshot.listingPreference?.canonical, "PRIVATE_ONLY");
  assert.equal(snapshot.listingPreference?.constraint, "HARD");
});

test("TEST 6 ownership 100% FULL_ACQUISITION", () => {
  const fromEnum = normalizeAcquisitionCriteria({
    conversationId: "c1",
    buyerCompanyId: "co-a",
    memories: [mem("ownership_preference", "100_PERCENT")],
  });
  assert.equal(fromEnum.ownershipPreferences[0]?.canonical, "FULL_ACQUISITION");
  assert.equal(fromEnum.ownershipPreferences[0]?.percent, 100);
  const fromText = normalizeAcquisitionCriteria({
    conversationId: "c1",
    buyerCompanyId: "co-a",
    memories: [mem("ownership_preference", "100% 인수")],
  });
  assert.equal(fromText.ownershipPreferences[0]?.canonical, "FULL_ACQUISITION");
});

test("TEST 7 ownership CONTROL", () => {
  const snapshot = normalizeAcquisitionCriteria({
    conversationId: "c1",
    buyerCompanyId: "co-a",
    memories: [mem("ownership_preference", "경영권 확보")],
  });
  assert.equal(snapshot.ownershipPreferences[0]?.canonical, "CONTROL");
});

test("TEST 8 timeline 6 months", () => {
  const snapshot = normalizeAcquisitionCriteria({
    conversationId: "c1",
    buyerCompanyId: "co-a",
    memories: [mem("acquisition_timeline", "6개월 안에")],
  });
  assert.equal(snapshot.acquisitionTimeline?.durationMonths, 6);
  assert.equal(snapshot.acquisitionTimeline?.category, "DURATION");
  const asap = normalizeAcquisitionCriteria({
    conversationId: "c1",
    buyerCompanyId: "co-a",
    memories: [mem("acquisition_timeline", "가능한 빨리")],
  });
  assert.equal(asap.acquisitionTimeline?.category, "ASAP");
  const unknown = normalizeAcquisitionCriteria({
    conversationId: "c1",
    buyerCompanyId: "co-a",
    memories: [mem("acquisition_timeline", "아직 미정")],
  });
  assert.equal(unknown.acquisitionTimeline?.category, "UNKNOWN");
  const year = normalizeAcquisitionCriteria({
    conversationId: "c1",
    buyerCompanyId: "co-a",
    memories: [mem("acquisition_timeline", "올해 안에")],
  });
  assert.equal(year.acquisitionTimeline?.category, "YEAR_END");
  assert.equal(year.acquisitionTimeline?.durationMonths, null);
});

test("TEST 10 multi-value alias dedupe", () => {
  const snapshot = normalizeAcquisitionCriteria({
    conversationId: "c1",
    buyerCompanyId: "co-a",
    memories: [
      mem(
        "target_industries",
        encodeMultiCriterion({
          values: ["이차전지", "2차전지", "이차전지"],
          raw: "이차전지, 2차전지",
        }),
      ),
    ],
  });
  assert.equal(snapshot.industries.length, 1);
  assert.equal(snapshot.industries[0]?.canonical, "SECONDARY_BATTERY");
});

test("industry alias battery is broader not secondary", () => {
  assert.equal(matchIndustryTerm("이차전지")?.canonical, "SECONDARY_BATTERY");
  assert.equal(matchIndustryTerm("2차전지")?.canonical, "SECONDARY_BATTERY");
  assert.equal(matchIndustryTerm("배터리")?.canonical, "BATTERY");
  assert.notEqual(matchIndustryTerm("배터리")?.canonical, "SECONDARY_BATTERY");
  const bms = matchIndustryTerm("BMS");
  assert.equal(bms?.canonical, "BMS");
  assert.equal(bms?.asBusiness, true);
  assert.equal(bms?.broader, "BATTERY");
});

test("BMS maps to business not industry-only", () => {
  const snapshot = normalizeAcquisitionCriteria({
    conversationId: "c1",
    buyerCompanyId: "co-a",
    memories: [
      mem("target_businesses", encodeMultiCriterion({ values: ["BMS"], raw: "BMS 관련" })),
    ],
  });
  assert.ok(snapshot.businesses.some((item) => item.canonical === "BMS"));
  assert.ok(snapshot.industries.some((item) => item.canonical === "BATTERY"));
  assert.equal(
    snapshot.industries.some((item) => item.canonical === "BMS"),
    false,
  );
});

test("TEST 11 include exclude split", () => {
  const snapshot = normalizeAcquisitionCriteria({
    conversationId: "c1",
    buyerCompanyId: "co-a",
    memories: [
      mem("target_industries", encodeMultiCriterion({ values: ["BMS 관련"], raw: "BMS 관련" })),
      mem("excluded_industries", encodeMultiCriterion({ values: ["소비재"], raw: "소비재 제외" })),
      mem("target_geographies", encodeMultiCriterion({ values: ["한국", "일본"], raw: "한국하고 일본" })),
      mem("excluded_geographies", encodeMultiCriterion({ values: ["중국"], raw: "중국 제외" })),
    ],
  });
  assert.ok(snapshot.geographies.some((item) => item.countryCode === "KR"));
  assert.ok(snapshot.geographies.some((item) => item.countryCode === "JP"));
  assert.ok(snapshot.excludedGeographies.some((item) => item.countryCode === "CN"));
  assert.equal(
    snapshot.geographies.some((item) => item.countryCode === "CN"),
    false,
  );
  assert.ok(snapshot.excludedIndustries.some((item) => item.canonical === "CONSUMER"));
  assert.equal(
    snapshot.industries.some((item) => item.canonical === "CONSUMER"),
    false,
  );
});

test("hard and soft only on clear markers otherwise unresolved", () => {
  const hard = normalizeAcquisitionCriteria({
    conversationId: "c1",
    buyerCompanyId: "co-a",
    memories: [
      mem(
        "target_revenue_min",
        encodeNumericCriterion({ krw: 30_000_000_000, raw: "매출은 300억 이상이어야 해" }),
      ),
      mem("listing_preference", "비상장만"),
    ],
  });
  assert.equal(hard.revenueRange.constraint, "HARD");
  assert.equal(hard.listingPreference?.constraint, "HARD");
  const soft = normalizeAcquisitionCriteria({
    conversationId: "c1",
    buyerCompanyId: "co-a",
    memories: [
      mem(
        "target_revenue_min",
        encodeNumericCriterion({ krw: 30_000_000_000, raw: "매출 300억 정도면 좋겠어" }),
      ),
      mem(
        "target_geographies",
        encodeMultiCriterion({ values: ["수도권"], raw: "가능하면 수도권" }),
      ),
    ],
  });
  assert.equal(soft.revenueRange.constraint, "SOFT");
  assert.equal(soft.geographies[0]?.constraint, "SOFT");
  const unclear = normalizeAcquisitionCriteria({
    conversationId: "c1",
    buyerCompanyId: "co-a",
    memories: [
      mem(
        "investment_size_max",
        encodeNumericCriterion({ krw: 10_000_000_000, raw: "100억" }),
      ),
    ],
  });
  assert.equal(unclear.investmentRange.constraint, "UNRESOLVED");
});

test("TEST 12 seller memory is not mixed into buyer criteria", () => {
  const snapshot = normalizeAcquisitionCriteria({
    conversationId: "c1",
    buyerCompanyId: "co-a",
    memories: [
      mem("reason_for_sale", "succession"),
      mem("sale_scope", "100_PERCENT"),
      mem("valuation_expectation", "unknown"),
      mem("acquisition_objective", "technology_acquisition"),
      mem("target_industries", encodeMultiCriterion({ values: ["BMS"], raw: "BMS" })),
    ],
  });
  assert.equal(snapshot.acquisitionObjective, "technology_acquisition");
  assert.equal(snapshot.sourceMemoryKeys.includes("reason_for_sale"), false);
  assert.equal(snapshot.sourceMemoryKeys.includes("sale_scope"), false);
  assert.ok(snapshot.normalizationWarnings.some((item) => item.startsWith("ignored_seller_memory")));
});

test("TEST 13 Buyer B cannot read Buyer A criteria", () => {
  const conversation: TomConversation = {
    id: "conv-a",
    intent: "buy",
    companyId: "co-a",
    dealId: null,
  };
  const buyerB = viewer("co-b", PlatformRole.BUYER_USER);
  const buyerA = viewer("co-a", PlatformRole.BUYER_USER);
  const seller = viewer("co-a", PlatformRole.SELLER_USER);
  assert.equal(canReadTomConversation(conversation, buyerB), false);
  assert.equal(canReadNormalizedBuyerCriteria(conversation, buyerB), false);
  assert.equal(canReadNormalizedBuyerCriteria(conversation, buyerA), true);
  assert.equal(canReadNormalizedBuyerCriteria(conversation, seller), false);
  assert.equal(
    canReadNormalizedBuyerCriteria({ ...conversation, intent: "sell" }, buyerA),
    false,
  );
});

test("provenance tracks source memory key and rule", () => {
  const snapshot = normalizeAcquisitionCriteria({
    conversationId: "c1",
    buyerCompanyId: "co-a",
    memories: [
      mem("target_geographies", encodeMultiCriterion({ values: ["대한민국"], raw: "대한민국" })),
    ],
  });
  const geo = snapshot.geographies[0];
  assert.equal(geo?.provenance.sourceMemoryKey, "target_geographies");
  assert.equal(geo?.provenance.rawValue, "대한민국");
  assert.equal(geo?.provenance.normalizedValue, "KR");
  assert.match(geo?.provenance.normalizationRule ?? "", /geo_country:KR/);
});

test("deterministic summary without LLM", () => {
  const snapshot = normalizeAcquisitionCriteria({
    conversationId: "c1",
    buyerCompanyId: "co-a",
    memories: [
      mem("target_businesses", encodeMultiCriterion({ values: ["BMS"], raw: "BMS 관련" })),
      mem("target_geographies", encodeMultiCriterion({ values: ["한국"], raw: "한국" })),
      mem("listing_preference", "PRIVATE_ONLY"),
      mem(
        "investment_size_max",
        encodeNumericCriterion({ krw: 10_000_000_000, raw: "100억" }),
      ),
    ],
  });
  const summary = formatNormalizedCriteriaSummary(snapshot);
  assert.match(summary, /한국/);
  assert.match(summary, /비상장/);
  assert.match(summary, /BMS/);
  assert.match(summary, /100억원/);
});

test("same input same output", () => {
  const memories = [
    mem("target_geographies", encodeMultiCriterion({ values: ["한국", "일본"], raw: "한국하고 일본" })),
    mem("listing_preference", "PRIVATE_ONLY"),
  ];
  const a = normalizeAcquisitionCriteria({ conversationId: "c1", buyerCompanyId: "co-a", memories });
  const b = normalizeAcquisitionCriteria({ conversationId: "c1", buyerCompanyId: "co-a", memories });
  assert.deepEqual(a, b);
});

test("TEST 14 buyer discovery regression still stores BMS and 100억", () => {
  const turn = runBuyerDiscoveryTurn({
    text: "BMS 기술회사를 사고 싶어.",
    memories: [],
    context: buyerContextFacts(),
  });
  assert.ok(turn.captures.some((item) => item.field === "target_businesses" && item.value.includes("BMS")));
  const money = extractDiscoveryFromMessage({
    profile: "BUYER",
    text: "100억까지 생각하고 있어.",
    lastQuestion: "investment_size_max",
  });
  const snapshot = normalizeAcquisitionCriteria({
    conversationId: "c1",
    buyerCompanyId: "co-a",
    memories: money.captures.map((item) => mem(item.field, item.value, item.informationState)),
  });
  assert.equal(snapshot.investmentRange.maxKrw, 10_000_000_000);
});

test("TEST 15 seller discovery regression still asks reason_for_sale", () => {
  const turn = runSellerDiscoveryTurn({
    text: "회사를 매각하고 싶어.",
    memories: [mem("acquisition_objective", "technology_acquisition")],
    context: sellerContextFacts(),
  });
  assert.equal(turn.nextQuestion?.field, "reason_for_sale");
});
