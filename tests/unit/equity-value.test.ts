import assert from "node:assert/strict";
import test from "node:test";
import { InformationState, PlatformRole } from "@/types/enums";
import type { TomMemoryItem } from "@/types/tom";
import type { ValuationBenchmark } from "@/types/valuation";
import { encodeNumericCriterion } from "@/lib/tom/criteria-value";
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
  MISSING_NET_DEBT_EQUITY_COPY,
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

function approvedRangeBenchmark(): ValuationBenchmark {
  return testBenchmark({
    approvalStatus: "APPROVED",
    multiple: 1.5,
    multipleLow: 1.0,
    multipleBase: 1.5,
    multipleHigh: 2.0,
  });
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

test("EQUITY 1: EV calculable + net debt present → Equity = EV - Net Debt (integer KRW)", () => {
  const result = calculateEvSales({
    financials: financials([
      mem("revenue", "10000000000"),
      mem("net_debt", "2000000000"),
    ]),
    benchmark: approvedRangeBenchmark(),
    mode: "unit_test",
  });
  assert.equal(result.status, "CALCULABLE");
  assert.equal(result.enterpriseValue, 150 * EOK);
  assert.deepEqual(result.equityValueRange, {
    low: 80 * EOK,
    base: 130 * EOK,
    high: 180 * EOK,
  });
  assert.equal(Number.isInteger(result.equityValueRange?.base), true);
  assert.equal(result.equityValueRange?.base, 150 * EOK - 20 * EOK);
});

test("EQUITY 1b: cash and debt compute Net Debt for Equity without inventing a split", () => {
  const result = calculateEvSales({
    financials: financials([
      mem("revenue", "10000000000"),
      mem("cash", "1000000000"),
      mem("debt", "3000000000"),
    ]),
    benchmark: approvedRangeBenchmark(),
    mode: "unit_test",
  });
  assert.equal(result.equityValueRange?.base, 150 * EOK - 20 * EOK);

  const cashOnly = calculateEvSales({
    financials: financials([
      mem("revenue", "10000000000"),
      mem("cash", "1000000000"),
    ]),
    benchmark: approvedRangeBenchmark(),
    mode: "unit_test",
  });
  assert.equal(cashOnly.equityValueRange, null);
  assert.ok(cashOnly.warnings.includes("net_debt_missing"));
});

test("EQUITY 2: EV calculable + net debt missing → equityValueRange = null", () => {
  const result = calculateEvSales({
    financials: financials([mem("revenue", "10000000000")]),
    benchmark: testBenchmark({ approvalStatus: "APPROVED" }),
    mode: "unit_test",
  });
  assert.equal(result.status, "CALCULABLE");
  assert.equal(result.enterpriseValue, 150 * EOK);
  assert.equal(result.equityValueRange, null);
  assert.ok(result.warnings.includes("net_debt_missing"));
  const copy = formatSellerLevel0Copy(
    result,
    testBenchmark({ approvalStatus: "APPROVED" }),
  );
  assert.match(copy, /150억/);
  assert.ok(copy.includes(MISSING_NET_DEBT_EQUITY_COPY));
  assert.doesNotMatch(copy, /지분가치\(Equity Value\)는 \d+원/);
});

test("EQUITY 3: EV MISSING_BENCHMARK → equity null even if net debt present", () => {
  const result = calculateEvSales({
    financials: financials([
      mem("revenue", "10000000000"),
      mem("net_debt", "2000000000"),
    ]),
    benchmark: null,
    mode: "production",
  });
  assert.equal(result.status, "MISSING_BENCHMARK");
  assert.equal(result.enterpriseValue, null);
  assert.equal(result.equityValueRange, null);
  const copy = formatSellerLevel0Copy(result, null);
  assert.equal(copy, MISSING_BENCHMARK_SELLER_COPY);
  assert.doesNotMatch(copy, /13000000000|지분가치\(Equity Value\)는 \d+/);
});

test("EQUITY 4: TEST_ONLY equity is not shown in production or Seller UI", () => {
  const inputs = financials([
    mem("revenue", "10000000000"),
    mem("net_debt", "2000000000"),
  ]);
  const benchmark = testBenchmark({ approvalStatus: "TEST_ONLY" });
  const unit = calculateEvSales({
    financials: inputs,
    benchmark,
    mode: "unit_test",
  });
  assert.equal(unit.status, "CALCULABLE");
  assert.deepEqual(unit.equityValueRange, {
    low: null,
    base: 130 * EOK,
    high: null,
  });

  const production = calculateEvSales({
    financials: inputs,
    benchmark,
    mode: "production",
  });
  assert.equal(production.status, "NOT_ELIGIBLE");
  assert.equal(production.enterpriseValue, null);
  assert.equal(production.equityValueRange, null);
  assert.ok(production.warnings.includes("test_only_forbidden_in_production"));

  const copy = formatSellerLevel0Copy(unit, benchmark);
  assert.equal(copy, MISSING_BENCHMARK_SELLER_COPY);
  assert.doesNotMatch(copy, /13000000000|15000000000|지분가치\(Equity Value\)는 \d+/);
});

test("EQUITY 5: UNVERIFIED benchmark still rejected, equity stays null", () => {
  const result = calculateEvSales({
    financials: financials([
      mem("revenue", "10000000000"),
      mem("net_debt", "2000000000"),
    ]),
    benchmark: testBenchmark({ approvalStatus: "UNVERIFIED" }),
    mode: "production",
  });
  assert.equal(result.status, "NOT_ELIGIBLE");
  assert.equal(result.enterpriseValue, null);
  assert.equal(result.equityValueRange, null);
  assert.ok(result.warnings.includes("unverified_benchmark_rejected"));
});

test("EQUITY 6: seller asking price is not used in Equity", () => {
  const inputs = financials([
    mem("revenue", "10000000000"),
    mem("net_debt", "2000000000"),
    mem("valuation_expectation", "20000000000"),
  ]);
  assert.equal(inputs.sellerExpectationRaw, "20000000000");
  const result = calculateEvSales({
    financials: inputs,
    benchmark: testBenchmark({ approvalStatus: "APPROVED" }),
    mode: "unit_test",
  });
  assert.equal(result.equityValueRange?.base, 130 * EOK);
  assert.notEqual(result.equityValueRange?.base, 200 * EOK);
  assert.notEqual(result.equityValueRange?.base, 180 * EOK);
});

test("EQUITY 7: buyer investment size is not used in Equity", () => {
  const inputs = financials([
    mem("revenue", "10000000000"),
    mem("net_debt", "2000000000"),
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
  assert.equal(result.equityValueRange?.base, 130 * EOK);
  assert.notEqual(result.equityValueRange?.base, 80 * EOK);
  assert.ok(
    inputs.normalizationWarnings.some((item) =>
      item.startsWith("ignored_buyer_criteria"),
    ),
  );
});

test("EQUITY 8: EV/Sales regression tests 1–13 still hold", () => {
  const ev = calculateEvSales({
    financials: financials([mem("revenue", "10000000000")]),
    benchmark: testBenchmark({ approvalStatus: "APPROVED" }),
    mode: "unit_test",
  });
  assert.equal(ev.status, "CALCULABLE");
  assert.equal(ev.enterpriseValue, 150 * EOK);
  assert.equal(ev.equityValueRange, null);

  const missing = calculateEvSales({
    financials: financials([mem("industry", "소프트웨어")]),
    benchmark: testBenchmark(),
    mode: "unit_test",
  });
  assert.equal(missing.status, "MISSING_INPUT");
  assert.equal(missing.enterpriseValue, null);
  assert.equal(missing.equityValueRange, null);

  const noBenchmark = calculateEvSales({
    financials: financials([mem("revenue", "10000000000")]),
    benchmark: null,
    mode: "production",
  });
  assert.equal(noBenchmark.status, "MISSING_BENCHMARK");
  assert.equal(noBenchmark.enterpriseValue, null);

  const range = calculateEvSales({
    financials: financials([mem("revenue", "10000000000")]),
    benchmark: approvedRangeBenchmark(),
    mode: "unit_test",
  });
  assert.equal(range.evLow, 100 * EOK);
  assert.equal(range.evBase, 150 * EOK);
  assert.equal(range.evHigh, 200 * EOK);
});

test("EQUITY 9: Seller Financial Normalization regression — no invented cash/debt", () => {
  const snapshot = normalizeFinancialInputs({
    conversationId: "c1",
    sellerCompanyId: "co-s",
    memories: [
      mem("industry", "소프트웨어"),
      mem("revenue", "10000000000"),
      mem("net_debt", "2000000000"),
      mem("valuation_expectation", "20000000000"),
    ],
  });
  assert.equal(snapshot.revenue.krw, 10_000_000_000);
  assert.equal(snapshot.netDebt.krw, 2_000_000_000);
  assert.equal(snapshot.cash.krw, null);
  assert.equal(snapshot.debt.krw, null);
  const summary = formatNormalizedFinancialSummary(snapshot);
  assert.match(summary, /순차입/);
  assert.doesNotMatch(summary, /예상 기업가치|지분가치/);
});

test("EQUITY 10: Buyer Criteria / Discovery regression", () => {
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
  assert.doesNotMatch(summary, /기업가치|지분가치/);

  const turn = runBuyerDiscoveryTurn({
    text: "인수하고 싶습니다",
    memories: [],
    context: buyerFacts(),
  });
  assert.ok(turn.reply.length > 0);
  assert.doesNotMatch(turn.reply, /예상 기업가치|Equity Value/);
});

test("unresolved net debt does not invent Equity", () => {
  const result = calculateEvSales({
    financials: financials([
      mem("revenue", "10000000000"),
      mem("net_debt", encodeNumericCriterion({ krw: null, raw: "수십억" })),
    ]),
    benchmark: testBenchmark({ approvalStatus: "APPROVED" }),
    mode: "unit_test",
  });
  assert.equal(result.status, "CALCULABLE");
  assert.equal(result.equityValueRange, null);
  assert.ok(result.warnings.includes("net_debt_unresolved"));
});

test("negative Equity is returned without a fabricated floor", () => {
  const result = calculateEvSales({
    financials: financials([
      mem("revenue", "10000000000"),
      mem("net_debt", "20000000000"),
    ]),
    benchmark: testBenchmark({ approvalStatus: "APPROVED" }),
    mode: "unit_test",
  });
  assert.equal(result.equityValueRange?.base, -50 * EOK);
  assert.ok(result.warnings.includes("negative_equity"));
});

test("TOM does not invent Equity numbers without a benchmark", () => {
  const turn = runSellerDiscoveryTurn({
    text: "우리 회사 지분가치가 얼마예요?",
    memories: [
      mem("industry", "소프트웨어"),
      mem("revenue", "10000000000"),
      mem("net_debt", "2000000000"),
    ],
    context: sellerFacts(),
  });
  assert.doesNotMatch(turn.reply, /13000000000|지분가치는/);
  assert.doesNotMatch(turn.reply, /Equity Value/);
});
