import assert from "node:assert/strict";
import test from "node:test";
import { InformationState, PlatformRole } from "@/types/enums";
import type { CurrentContext } from "@/types/context";
import type { TomConversation, TomMemoryItem } from "@/types/tom";
import type { ValuationBenchmark } from "@/types/valuation";
import { encodeNumericCriterion } from "@/lib/tom/criteria-value";
import {
  canReadNormalizedSellerFinancials,
  canReadSellerLevel0Valuation,
} from "@/lib/tom/access";
import { runBuyerDiscoveryTurn, runSellerDiscoveryTurn } from "@/lib/tom/seller-discovery";
import type { DiscoveryContextFacts } from "@/lib/tom/question-policy";
import {
  formatNormalizedFinancialSummary,
  normalizeFinancialInputs,
} from "@/lib/valuation/normalize-financial-inputs";
import {
  calculateEvSales,
  formatSellerLevel0Copy,
  MISSING_BENCHMARK_SELLER_COPY,
} from "@/lib/valuation/ev-sales";
import {
  formatNormalizedCriteriaSummary,
  normalizeAcquisitionCriteria,
} from "@/lib/tom/normalize-acquisition-criteria";

const EOK = 100_000_000;

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

function financials(memories: TomMemoryItem[]) {
  return normalizeFinancialInputs({
    conversationId: "c1",
    sellerCompanyId: "co-s",
    memories,
  });
}

function testBenchmark(
  overrides: Partial<ValuationBenchmark> = {},
): ValuationBenchmark {
  return {
    method: "EV_SALES",
    multiple: 1.5,
    multipleLow: null,
    multipleBase: 1.5,
    multipleHigh: null,
    source: "unit-test-fixture",
    sourceType: "TEST_FIXTURE",
    asOfDate: "2026-08-31",
    industry: "소프트웨어",
    confidence: "LOW",
    approvalStatus: "TEST_ONLY",
    ...overrides,
  };
}

function sellerFacts(): DiscoveryContextFacts {
  return {
    companyName: "TEST_DEV_SELLER_CO",
    industry: "소프트웨어",
    platformRole: PlatformRole.SELLER_USER,
    dealId: null,
    dealRole: null,
    dealStage: null,
    conversationIntent: "sell",
    profile: "SELLER",
  };
}

function buyerFacts(): DiscoveryContextFacts {
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

test("TEST 1: revenue 100억 × test 1.5x = EV 150억", () => {
  const result = calculateEvSales({
    financials: financials([mem("revenue", "10000000000")]),
    benchmark: testBenchmark({ approvalStatus: "APPROVED" }),
    mode: "unit_test",
  });
  assert.equal(result.status, "CALCULABLE");
  assert.equal(result.enterpriseValue, 150 * EOK);
  assert.equal(result.evBase, 150 * EOK);
  assert.equal(result.equityValueRange, null);
  assert.equal(Number.isInteger(result.enterpriseValue), true);
});

test("TEST 2: no revenue → MISSING_INPUT", () => {
  const result = calculateEvSales({
    financials: financials([mem("industry", "소프트웨어")]),
    benchmark: testBenchmark(),
    mode: "unit_test",
  });
  assert.equal(result.status, "MISSING_INPUT");
  assert.equal(result.enterpriseValue, null);
});

test("TEST 3: unresolved revenue → MISSING_INPUT", () => {
  const result = calculateEvSales({
    financials: financials([
      mem("revenue", encodeNumericCriterion({ krw: null, raw: "수십억" })),
    ]),
    benchmark: testBenchmark(),
    mode: "unit_test",
  });
  assert.equal(result.status, "MISSING_INPUT");
  assert.equal(result.enterpriseValue, null);
  assert.ok(result.warnings.includes("revenue_unresolved"));
});

test("TEST 4: revenue without benchmark → MISSING_BENCHMARK, EV null", () => {
  const result = calculateEvSales({
    financials: financials([mem("revenue", "10000000000")]),
    benchmark: null,
    mode: "production",
  });
  assert.equal(result.status, "MISSING_BENCHMARK");
  assert.equal(result.enterpriseValue, null);
  assert.equal(result.evLow, null);
  assert.equal(result.evHigh, null);
});

test("TEST 5: UNVERIFIED benchmark is rejected in production", () => {
  const result = calculateEvSales({
    financials: financials([mem("revenue", "10000000000")]),
    benchmark: testBenchmark({ approvalStatus: "UNVERIFIED" }),
    mode: "production",
  });
  assert.equal(result.status, "NOT_ELIGIBLE");
  assert.equal(result.enterpriseValue, null);
  assert.ok(result.warnings.includes("unverified_benchmark_rejected"));
});

test("TEST 6: TEST_ONLY calculates in unit tests and is forbidden in production/UI", () => {
  const inputs = financials([mem("revenue", "10000000000")]);
  const benchmark = testBenchmark({ approvalStatus: "TEST_ONLY" });
  const unit = calculateEvSales({
    financials: inputs,
    benchmark,
    mode: "unit_test",
  });
  assert.equal(unit.status, "CALCULABLE");
  assert.equal(unit.enterpriseValue, 150 * EOK);

  const production = calculateEvSales({
    financials: inputs,
    benchmark,
    mode: "production",
  });
  assert.equal(production.status, "NOT_ELIGIBLE");
  assert.equal(production.enterpriseValue, null);
  assert.ok(production.warnings.includes("test_only_forbidden_in_production"));

  const copy = formatSellerLevel0Copy(unit, benchmark);
  assert.equal(copy, MISSING_BENCHMARK_SELLER_COPY);
  assert.doesNotMatch(copy, /예상 기업가치/);
  assert.doesNotMatch(copy, /150/);
});

test("TEST 7: low/base/high 1.0/1.5/2.0 → 100/150/200억", () => {
  const result = calculateEvSales({
    financials: financials([mem("revenue", "10000000000")]),
    benchmark: testBenchmark({
      approvalStatus: "APPROVED",
      multiple: 1.5,
      multipleLow: 1.0,
      multipleBase: 1.5,
      multipleHigh: 2.0,
    }),
    mode: "unit_test",
  });
  assert.equal(result.evLow, 100 * EOK);
  assert.equal(result.evBase, 150 * EOK);
  assert.equal(result.evHigh, 200 * EOK);
  assert.equal(result.enterpriseValue, 150 * EOK);
});

test("TEST 8: zero or negative revenue is not calculable", () => {
  const zero = calculateEvSales({
    financials: { revenueKrw: 0, revenueUnresolved: false, industry: null },
    benchmark: testBenchmark({ approvalStatus: "APPROVED" }),
    mode: "unit_test",
  });
  assert.equal(zero.status, "NOT_ELIGIBLE");
  assert.equal(zero.enterpriseValue, null);

  const negative = calculateEvSales({
    financials: { revenueKrw: -1 * EOK, revenueUnresolved: false, industry: null },
    benchmark: testBenchmark({ approvalStatus: "APPROVED" }),
    mode: "unit_test",
  });
  assert.equal(negative.status, "NOT_ELIGIBLE");
  assert.equal(negative.enterpriseValue, null);
});

test("TEST 9: seller asking price is not used as EV", () => {
  const inputs = financials([
    mem("revenue", "10000000000"),
    mem("valuation_expectation", "20000000000"),
  ]);
  assert.equal(inputs.sellerExpectationRaw, "20000000000");
  const result = calculateEvSales({
    financials: inputs,
    benchmark: testBenchmark({ approvalStatus: "APPROVED" }),
    mode: "unit_test",
  });
  assert.equal(result.enterpriseValue, 150 * EOK);
  assert.notEqual(result.enterpriseValue, 200 * EOK);
});

test("TEST 10: buyer investment size is not used in seller valuation", () => {
  const inputs = financials([
    mem("revenue", "10000000000"),
    mem(
      "investment_size_max",
      encodeNumericCriterion({ krw: 80 * EOK, raw: "80억" }),
    ),
  ]);
  const result = calculateEvSales({
    financials: inputs,
    benchmark: testBenchmark({ approvalStatus: "APPROVED" }),
    mode: "unit_test",
  });
  assert.equal(result.enterpriseValue, 150 * EOK);
  assert.notEqual(result.enterpriseValue, 80 * EOK);
  assert.ok(
    inputs.normalizationWarnings.some((item) =>
      item.startsWith("ignored_buyer_criteria"),
    ),
  );
});

test("TEST 11: no LLM/TOM path invents a multiple", () => {
  const withoutBenchmark = calculateEvSales({
    financials: financials([mem("revenue", "10000000000")]),
    benchmark: null,
    mode: "production",
  });
  assert.equal(withoutBenchmark.enterpriseValue, null);
  assert.equal(withoutBenchmark.multipleUsed, null);

  const productionCopy = formatSellerLevel0Copy(withoutBenchmark, null);
  assert.equal(productionCopy, MISSING_BENCHMARK_SELLER_COPY);
  assert.doesNotMatch(productionCopy, /예상 기업가치/);
  assert.doesNotMatch(productionCopy, /0\.5|1\.5|2\.0/);

  const turn = runSellerDiscoveryTurn({
    text: "우리 회사 가치가 얼마예요?",
    memories: [mem("industry", "소프트웨어"), mem("revenue", "10000000000")],
    context: sellerFacts(),
  });
  assert.doesNotMatch(turn.reply, /예상 기업가치/);
  assert.doesNotMatch(turn.reply, /Enterprise Value/);
  assert.doesNotMatch(turn.reply, /배수/);
});

test("TEST 12: Seller Financial Normalization regression", () => {
  const snapshot = normalizeFinancialInputs({
    conversationId: "c1",
    sellerCompanyId: "co-s",
    memories: [
      mem("industry", "소프트웨어"),
      mem("revenue", "10000000000"),
      mem("valuation_expectation", "20000000000"),
      mem(
        "investment_size_max",
        encodeNumericCriterion({ krw: 80 * EOK, raw: "80억" }),
      ),
    ],
  });
  assert.equal(snapshot.revenue.krw, 10_000_000_000);
  assert.equal(snapshot.sellerExpectationRaw, "20000000000");
  assert.equal(snapshot.cash.krw, null);
  assert.equal(snapshot.debt.krw, null);
  const summary = formatNormalizedFinancialSummary(snapshot);
  assert.match(summary, /기업가치 숫자는 아직 계산하지 않습니다/);
  assert.doesNotMatch(summary, /예상 기업가치/);
});

test("TEST 13: Buyer Discovery / Criteria Normalization regression", () => {
  const memories = [
    mem("target_industry", "폐배터리"),
    mem(
      "investment_size_max",
      encodeNumericCriterion({ krw: 100 * EOK, raw: "100억" }),
    ),
  ];
  const criteria = normalizeAcquisitionCriteria({
    memories,
    conversationId: "c-b",
    buyerCompanyId: "co-b",
  });
  const summary = formatNormalizedCriteriaSummary(criteria);
  assert.match(summary, /폐배터리|100억/);
  assert.doesNotMatch(summary, /기업가치/);

  const turn = runBuyerDiscoveryTurn({
    text: "인수하고 싶습니다",
    memories: [],
    context: buyerFacts(),
  });
  assert.ok(turn.reply.length > 0);
  assert.doesNotMatch(turn.reply, /예상 기업가치/);
});

test("Seller valuation read uses server CurrentContext, not client role", () => {
  const conversation: TomConversation = {
    id: "conv-s",
    intent: "sell",
    companyId: "co-s",
    dealId: null,
  };
  assert.equal(
    canReadSellerLevel0Valuation(
      conversation,
      viewer("co-s", PlatformRole.BUYER_USER),
    ),
    false,
  );
  assert.equal(
    canReadSellerLevel0Valuation(
      conversation,
      viewer("co-s", PlatformRole.SELLER_USER),
    ),
    true,
  );
  assert.equal(
    canReadNormalizedSellerFinancials(
      conversation,
      viewer("co-s", PlatformRole.SELLER_USER),
    ),
    true,
  );
});
