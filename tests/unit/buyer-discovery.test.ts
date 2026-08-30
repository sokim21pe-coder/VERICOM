import assert from "node:assert/strict";
import test from "node:test";
import { InformationState, PlatformRole } from "@/types/enums";
import type { TomMemoryItem } from "@/types/tom";
import { extractDiscoveryFromMessage } from "@/lib/tom/extract-discovery";
import { runBuyerDiscoveryTurn, runSellerDiscoveryTurn } from "@/lib/tom/seller-discovery";
import {
  discoveryProfileFrom,
  getNextBestQuestion,
  shouldAskField,
  type DiscoveryContextFacts,
} from "@/lib/tom/question-policy";
import { canReadTomConversation } from "@/lib/tom/access";
import {
  krwFromStored,
  mergeStoredMultiValue,
  parseMultiCriterion,
  parseNumericCriterion,
} from "@/lib/tom/criteria-value";
import type { CurrentContext } from "@/types/context";
import type { TomConversation } from "@/types/tom";

const buyerContext: DiscoveryContextFacts = {
  companyName: "TEST_DEV_BUYER_A_CO",
  industry: "폐배터리 재활용",
  platformRole: PlatformRole.BUYER_USER,
  dealId: null,
  dealRole: null,
  dealStage: null,
  conversationIntent: "buy",
  profile: "BUYER",
};

const sellerContext: DiscoveryContextFacts = {
  companyName: "TEST_DEV_SELLER_CO",
  industry: "테스트업종",
  platformRole: PlatformRole.SELLER_USER,
  dealId: null,
  dealRole: null,
  dealStage: null,
  conversationIntent: "sell",
  profile: "SELLER",
};

function mem(
  key: string,
  value: string,
  state: InformationState = InformationState.CONFIRMED,
): TomMemoryItem {
  return { key, value, informationState: state, source: "user_message:USER_CLAIM", confidence: 1 };
}

test("TEST 1 buy intent asks acquisition_objective", () => {
  const turn = runBuyerDiscoveryTurn({
    text: "회사를 인수하고 싶어.",
    memories: [],
    context: buyerContext,
  });
  assert.equal(turn.nextQuestion?.field, "acquisition_objective");
  assert.match(turn.reply, /목적/);
  assert.equal(shouldAskField("target_industries", [], buyerContext), true);
  assert.equal(shouldAskField("industry", [], buyerContext), false);
});

test("buyer company industry does not skip target_industries", () => {
  const question = getNextBestQuestion({
    profile: "BUYER",
    memories: [mem("acquisition_objective", "technology_acquisition")],
    context: buyerContext,
  });
  assert.equal(question?.field, "target_industries");
});

test("TEST 2 BMS is stored and not asked again", () => {
  const turn = runBuyerDiscoveryTurn({
    text: "BMS 기술회사를 사고 싶어.",
    memories: [],
    context: buyerContext,
  });
  const stored = turn.captures.find((item) => item.field === "target_businesses");
  assert.ok(stored?.value.includes("BMS"));
  assert.notEqual(turn.nextQuestion?.field, "target_businesses");
  assert.doesNotMatch(turn.reply, /관심 있는 사업이나/);
});

test("TEST 3 investment_size_max stores 100억 as KRW", () => {
  const extracted = extractDiscoveryFromMessage({
    profile: "BUYER",
    text: "100억까지 생각하고 있어.",
    lastQuestion: "investment_size_max",
  });
  const row = extracted.captures.find((item) => item.field === "investment_size_max");
  assert.equal(krwFromStored(row?.value ?? null), 10_000_000_000);
  assert.match(row?.value ?? "", /100억/);
});

test("TEST 4 revenue min/max from range", () => {
  const extracted = extractDiscoveryFromMessage({
    profile: "BUYER",
    text: "매출 300억에서 1,000억 회사.",
    lastQuestion: null,
  });
  const min = extracted.captures.find((item) => item.field === "target_revenue_min");
  const max = extracted.captures.find((item) => item.field === "target_revenue_max");
  assert.equal(krwFromStored(min?.value ?? null), 30_000_000_000);
  assert.equal(krwFromStored(max?.value ?? null), 100_000_000_000);
});

test("TEST 5 listing preference PRIVATE_ONLY", () => {
  const extracted = extractDiscoveryFromMessage({
    profile: "BUYER",
    text: "상장사는 싫고 비상장만 보고 싶어.",
    lastQuestion: null,
  });
  assert.equal(
    extracted.captures.find((item) => item.field === "listing_preference")?.value,
    "PRIVATE_ONLY",
  );
});

test("TEST 6 geography multi-value", () => {
  const extracted = extractDiscoveryFromMessage({
    profile: "BUYER",
    text: "한국하고 일본.",
    lastQuestion: "target_geographies",
  });
  const geo = extracted.captures.find((item) => item.field === "target_geographies");
  const parsed = parseMultiCriterion(geo?.value ?? "");
  assert.deepEqual(parsed.values, ["한국", "일본"]);
  const merged = mergeStoredMultiValue(geo?.value ?? null, JSON.stringify({ values: ["미국"], raw: "미국" }));
  assert.deepEqual(parseMultiCriterion(merged).values, ["한국", "일본", "미국"]);
});

test("TEST 7 decline marks UNKNOWN and does not repeat", () => {
  const memories = [mem("discovery_last_question", "investment_size_max")];
  const turn = runBuyerDiscoveryTurn({
    text: "아직 모르겠어.",
    memories,
    context: buyerContext,
  });
  const skipped = turn.captures.find((item) => item.field === "investment_size_max");
  assert.equal(skipped?.skipped, true);
  assert.equal(skipped?.informationState, InformationState.UNKNOWN);
  assert.notEqual(turn.nextQuestion?.field, "investment_size_max");
});

test("TEST 8 override 100억 to 150억", () => {
  const first = extractDiscoveryFromMessage({
    profile: "BUYER",
    text: "100억까지 가능해.",
    lastQuestion: "investment_size_max",
  });
  const second = extractDiscoveryFromMessage({
    profile: "BUYER",
    text: "150억까지도 가능할 것 같아.",
    lastQuestion: "investment_size_max",
  });
  assert.equal(
    krwFromStored(first.captures.find((item) => item.field === "investment_size_max")?.value ?? null),
    10_000_000_000,
  );
  assert.equal(
    krwFromStored(second.captures.find((item) => item.field === "investment_size_max")?.value ?? null),
    15_000_000_000,
  );
});

test("vague tens-of-billions is raw USER_CLAIM without invented KRW", () => {
  const extracted = extractDiscoveryFromMessage({
    profile: "BUYER",
    text: "투자 여력은 수십억 정도야.",
    lastQuestion: "investment_size_max",
  });
  const row = extracted.captures.find((item) => item.field === "investment_size_max");
  const parsed = parseNumericCriterion(row?.value ?? null);
  assert.equal(parsed?.krw, null);
  assert.match(parsed?.raw ?? "", /수십억/);
});

test("one message can store BMS and investment max", () => {
  const extracted = extractDiscoveryFromMessage({
    profile: "BUYER",
    text: "BMS 기술회사를 찾고 있고 100억 정도까지 생각하고 있어.",
    lastQuestion: null,
  });
  const fields = extracted.captures.map((item) => item.field).sort();
  assert.ok(fields.includes("target_businesses"));
  assert.ok(fields.includes("investment_size_max"));
  assert.equal(
    krwFromStored(
      extracted.captures.find((item) => item.field === "investment_size_max")?.value ?? null,
    ),
    10_000_000_000,
  );
});

test("TEST 10 seller memory does not skip buyer questions", () => {
  const memories = [
    mem("reason_for_sale", "succession"),
    mem("sale_scope", "100_PERCENT"),
    mem("valuation_expectation", "unknown"),
  ];
  const question = getNextBestQuestion({
    profile: "BUYER",
    memories,
    context: buyerContext,
  });
  assert.equal(question?.field, "acquisition_objective");
});

test("TEST 10 seller profile still asks reason_for_sale", () => {
  const turn = runSellerDiscoveryTurn({
    text: "회사를 매각하고 싶어.",
    memories: [mem("acquisition_objective", "technology_acquisition")],
    context: sellerContext,
  });
  assert.equal(turn.nextQuestion?.field, "reason_for_sale");
  assert.notEqual(turn.nextQuestion?.field, "acquisition_objective");
});

test("role and intent mismatch does not run discovery", () => {
  assert.equal(discoveryProfileFrom(PlatformRole.SELLER_USER, "buy"), null);
  assert.equal(discoveryProfileFrom(PlatformRole.BUYER_USER, "sell"), null);
  assert.equal(discoveryProfileFrom(PlatformRole.BUYER_USER, "buy"), "BUYER");
  const question = getNextBestQuestion({
    memories: [],
    context: { ...buyerContext, platformRole: PlatformRole.SELLER_USER, conversationIntent: "buy", profile: null },
  });
  assert.equal(question, null);
});

test("reverse question about multiples does not invent a number", () => {
  const memories = [mem("discovery_last_question", "investment_size_max")];
  const turn = runBuyerDiscoveryTurn({
    text: "보통 이런 회사는 몇 배 정도에 거래돼?",
    memories,
    context: buyerContext,
  });
  assert.equal(turn.reverseQuestion, true);
  assert.match(turn.reply, /특정 배수나 가격을 제시하지 않습니다/);
  assert.match(turn.reply, /희망 투자금액/);
  assert.equal(turn.captures.length, 0);
});

test("TEST 11 other company cannot read buyer conversation", () => {
  const conversation: TomConversation = {
    id: "conv-buy",
    intent: "buy",
    companyId: "co-a",
    dealId: null,
  };
  const viewer: CurrentContext = {
    user: {
      id: "u-b",
      authUserId: "a-b",
      email: "b@test",
      displayName: "B",
    },
    company: {
      id: "co-b",
      name: "B",
      industry: null,
      verificationStatus: "unverified",
    },
    platformRole: PlatformRole.BUYER_USER,
    platformRoles: [PlatformRole.BUYER_USER],
    companyMembership: null,
    deal: null,
    dealRole: null,
    permissions: [],
  };
  assert.equal(canReadTomConversation(conversation, viewer), false);
  assert.equal(
    canReadTomConversation(conversation, { ...viewer, company: { ...viewer.company!, id: "co-a" } }),
    true,
  );
});

test("deal null still asks buyer discovery", () => {
  const turn = runBuyerDiscoveryTurn({
    text: "기업을 인수하고 싶습니다.",
    memories: [],
    context: { ...buyerContext, dealId: null, dealRole: null },
  });
  assert.equal(turn.nextQuestion?.field, "acquisition_objective");
});
