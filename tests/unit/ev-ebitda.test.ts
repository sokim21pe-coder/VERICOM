import assert from "node:assert/strict";
import test from "node:test";
import { InformationState } from "@/types/enums";
import type { TomMemoryItem } from "@/types/tom";
import type { ValuationBenchmark } from "@/types/valuation";
import { encodeNumericCriterion } from "@/lib/tom/criteria-value";
import { normalizeFinancialInputs } from "@/lib/valuation/normalize-financial-inputs";
import {
  calculateEvEbitda,
  formatSellerLevel1Copy,
} from "@/lib/valuation/ev-ebitda";
import { MISSING_FINANCIAL_COPY } from "@/lib/valuation/seller-level0-presentation";
import { MISSING_EBITDA_BENCHMARK_COPY } from "@/lib/valuation/seller-level1-presentation";
import { sellerLevel1Presentation } from "@/lib/valuation/seller-level1-presentation";
import {
  computeProductionSellerLevel1,
  injectApprovedEvEbitdaBenchmark,
  injectApprovedEvSalesBenchmark,
  resetApprovedBenchmarkStoreForTests,
  resolveApprovedEvEbitdaBenchmark,
} from "@/lib/valuation/resolve-approved-benchmark";

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

function ebitdaBenchmark(
  overrides: Partial<ValuationBenchmark> = {},
): ValuationBenchmark {
  return {
    method: "EV_EBITDA",
    multiple: 8,
    multipleLow: 6,
    multipleBase: 8,
    multipleHigh: 10,
    source: "internal-review-fixture",
    sourceType: "INTERNAL_REVIEW",
    asOfDate: "2026-09-01",
    industry: "소프트웨어",
    confidence: "MEDIUM",
    approvalStatus: "APPROVED",
    provenance: {
      source: "internal-review-fixture",
      sourceType: "INTERNAL_REVIEW",
      asOfDate: "2026-09-01",
      recordedAt: "2026-09-01T00:00:00.000Z",
      notes: "unit-test-injection",
    },
    ...overrides,
  };
}

test.beforeEach(() => {
  resetApprovedBenchmarkStoreForTests();
});

test("LEVEL1 1: EBITDA 10억 × 8x = EV 80억", () => {
  const result = calculateEvEbitda({
    financials: financials([mem("ebitda", "1000000000")]),
    benchmark: ebitdaBenchmark(),
    mode: "unit_test",
  });
  assert.equal(result.method, "EV_EBITDA");
  assert.equal(result.status, "CALCULABLE");
  assert.equal(result.enterpriseValue, 80 * EOK);
  assert.equal(result.evLow, 60 * EOK);
  assert.equal(result.evHigh, 100 * EOK);
});

test("LEVEL1 2: no EBITDA → MISSING_INPUT", () => {
  const result = calculateEvEbitda({
    financials: financials([mem("revenue", "10000000000")]),
    benchmark: ebitdaBenchmark(),
    mode: "unit_test",
  });
  assert.equal(result.status, "MISSING_INPUT");
  assert.equal(result.enterpriseValue, null);
  assert.equal(formatSellerLevel1Copy(result, ebitdaBenchmark()), MISSING_FINANCIAL_COPY);
});

test("LEVEL1 3: unresolved EBITDA → MISSING_INPUT", () => {
  const result = calculateEvEbitda({
    financials: financials([
      mem("ebitda", encodeNumericCriterion({ krw: null, raw: "수십억" })),
    ]),
    benchmark: ebitdaBenchmark(),
    mode: "unit_test",
  });
  assert.equal(result.status, "MISSING_INPUT");
  assert.equal(result.enterpriseValue, null);
});

test("LEVEL1 4: EBITDA without EV/EBITDA benchmark → MISSING_BENCHMARK, EV null", () => {
  const result = calculateEvEbitda({
    financials: financials([mem("ebitda", "1000000000")]),
    benchmark: null,
    mode: "production",
  });
  assert.equal(result.status, "MISSING_BENCHMARK");
  assert.equal(result.enterpriseValue, null);
  assert.equal(formatSellerLevel1Copy(result, null), MISSING_EBITDA_BENCHMARK_COPY);
});

test("LEVEL1 5: EV/Sales benchmark is not used for EV/EBITDA", () => {
  const sales = ebitdaBenchmark({ method: "EV_SALES", multiple: 1.5, multipleBase: 1.5 });
  const result = calculateEvEbitda({
    financials: financials([mem("ebitda", "1000000000")]),
    benchmark: sales,
    mode: "production",
  });
  assert.equal(result.status, "NOT_ELIGIBLE");
  assert.equal(result.enterpriseValue, null);
  assert.ok(result.warnings.includes("method_not_ev_ebitda"));
});

test("LEVEL1 6: TEST_ONLY is forbidden in production UI copy", () => {
  const testOnly = ebitdaBenchmark({ approvalStatus: "TEST_ONLY", sourceType: "TEST_FIXTURE" });
  const production = calculateEvEbitda({
    financials: financials([mem("ebitda", "1000000000")]),
    benchmark: testOnly,
    mode: "production",
  });
  assert.equal(production.status, "NOT_ELIGIBLE");
  assert.equal(production.enterpriseValue, null);
  const presented = sellerLevel1Presentation({
    hasConversation: true,
    financials: financials([mem("ebitda", "1000000000")]),
    status: production.status,
    result: production,
    copy: formatSellerLevel1Copy(production, testOnly),
    benchmarkApproval: "TEST_ONLY",
  });
  assert.equal(presented.showEnterpriseValue, false);
});

test("LEVEL1 7: UNVERIFIED benchmark is rejected", () => {
  const result = calculateEvEbitda({
    financials: financials([mem("ebitda", "1000000000")]),
    benchmark: ebitdaBenchmark({ approvalStatus: "UNVERIFIED" }),
    mode: "production",
  });
  assert.equal(result.status, "NOT_ELIGIBLE");
  assert.equal(result.enterpriseValue, null);
});

test("LEVEL1 8: seller asking price is not used as EV", () => {
  const result = calculateEvEbitda({
    financials: financials([
      mem("ebitda", "1000000000"),
      mem("valuation_expectation", "50000000000"),
    ]),
    benchmark: ebitdaBenchmark(),
    mode: "unit_test",
  });
  assert.equal(result.enterpriseValue, 80 * EOK);
  assert.notEqual(result.enterpriseValue, 500 * EOK);
});

test("LEVEL1 9: production resolver does not use an EV/Sales record", () => {
  assert.equal(
    injectApprovedEvSalesBenchmark({
      sellerCompanyId: "co-s",
      conversationId: null,
      benchmark: ebitdaBenchmark({
        method: "EV_SALES",
        multiple: 1.5,
        multipleBase: 1.5,
        multipleLow: 1,
        multipleHigh: 2,
      }),
    }).ok,
    true,
  );
  const lookup = resolveApprovedEvEbitdaBenchmark({
    sellerCompanyId: "co-s",
    conversationId: null,
    industry: "소프트웨어",
  });
  assert.equal(lookup.benchmark, null);
  const production = computeProductionSellerLevel1({
    financials: financials([mem("ebitda", "1000000000")]),
    sellerCompanyId: "co-s",
    conversationId: "c1",
    industry: "소프트웨어",
    records: [],
  });
  assert.equal(production.result.status, "MISSING_BENCHMARK");
  assert.equal(production.result.enterpriseValue, null);
});

test("LEVEL1 10: injected APPROVED EV/EBITDA makes EV calculable for that company only", () => {
  assert.equal(
    injectApprovedEvEbitdaBenchmark({
      sellerCompanyId: "co-s",
      conversationId: null,
      benchmark: ebitdaBenchmark(),
    }).ok,
    true,
  );
  const production = computeProductionSellerLevel1({
    financials: financials([mem("ebitda", "1000000000")]),
    sellerCompanyId: "co-s",
    conversationId: "c1",
    industry: "소프트웨어",
  });
  assert.equal(production.result.status, "CALCULABLE");
  assert.equal(production.result.enterpriseValue, 80 * EOK);
  const other = computeProductionSellerLevel1({
    financials: financials([mem("ebitda", "1000000000")]),
    sellerCompanyId: "co-other",
    conversationId: "c1",
    industry: "소프트웨어",
  });
  assert.equal(other.result.enterpriseValue, null);
});

test("LEVEL1 11: zero EBITDA is not calculable", () => {
  const result = calculateEvEbitda({
    financials: financials([mem("ebitda", "0")]),
    benchmark: ebitdaBenchmark(),
    mode: "unit_test",
  });
  assert.equal(result.status, "NOT_ELIGIBLE");
  assert.equal(result.enterpriseValue, null);
});
