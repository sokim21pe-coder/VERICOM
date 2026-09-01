import assert from "node:assert/strict";
import test from "node:test";
import { InformationState } from "@/types/enums";
import type { TomMemoryItem } from "@/types/tom";
import { encodeNumericCriterion } from "@/lib/tom/criteria-value";
import { normalizeFinancialInputs } from "@/lib/valuation/normalize-financial-inputs";
import { calculateEvSales } from "@/lib/valuation/ev-sales";
import {
  CALCULATION_ERROR_COPY,
  MISSING_BENCHMARK_SELLER_COPY,
  MISSING_FINANCIAL_COPY,
  TOM_CALCULABLE_EV_ONLY_COPY,
  TOM_CALCULATION_ERROR_COPY,
  TOM_MISSING_BENCHMARK_COPY,
  TOM_MISSING_INPUT_COPY,
  sellerLevel0Presentation,
} from "@/lib/valuation/seller-level0-presentation";
import type { ValuationBenchmark } from "@/types/valuation";

function mem(key: string, value: string): TomMemoryItem {
  return {
    key,
    value,
    informationState: InformationState.CONFIRMED,
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

function approvedRange(): ValuationBenchmark {
  return {
    method: "EV_SALES",
    multiple: 1.5,
    multipleLow: 1.0,
    multipleBase: 1.5,
    multipleHigh: 2.0,
    source: "unit-test-fixture",
    sourceType: "TEST_FIXTURE",
    asOfDate: "2026-08-31",
    industry: "소프트웨어",
    confidence: "LOW",
    approvalStatus: "APPROVED",
  };
}

test("TEST 10 Seller UI: no financials → 재무정보 입력 필요, no amount", () => {
  const view = sellerLevel0Presentation({
    hasConversation: true,
    financials: financials([]),
    status: "MISSING_INPUT",
    result: null,
    copy: MISSING_FINANCIAL_COPY,
    benchmarkApproval: null,
  });
  assert.equal(view.statusLabel, "재무정보 입력 필요");
  assert.equal(view.showEnterpriseValue, false);
  assert.equal(view.evRangeLabel, null);
  assert.equal(view.copy, MISSING_FINANCIAL_COPY);
});

test("TEST 10 Seller UI: revenue + no benchmark → 비교배수 확인 필요", () => {
  const inputs = financials([mem("revenue", "10000000000")]);
  const result = calculateEvSales({
    financials: inputs,
    benchmark: null,
    mode: "production",
  });
  const view = sellerLevel0Presentation({
    hasConversation: true,
    financials: inputs,
    status: result.status,
    result,
    copy: MISSING_BENCHMARK_SELLER_COPY,
    benchmarkApproval: null,
  });
  assert.equal(view.statusLabel, "비교배수 확인 필요");
  assert.equal(view.showEnterpriseValue, false);
  assert.equal(view.evRangeLabel, null);
  assert.match(view.copy, /비교배수/);
  assert.doesNotMatch(view.copy, /150억|1\.5/);
  assert.equal(view.tomExplanation, TOM_MISSING_BENCHMARK_COPY);
});

test("TEST 10 Seller UI: APPROVED range shows Indicative EV only", () => {
  const inputs = financials([mem("revenue", "10000000000")]);
  const result = calculateEvSales({
    financials: inputs,
    benchmark: approvedRange(),
    mode: "production",
  });
  const view = sellerLevel0Presentation({
    hasConversation: true,
    financials: inputs,
    status: result.status,
    result,
    copy: null,
    benchmarkApproval: "APPROVED",
  });
  assert.equal(view.statusLabel, "Indicative EV 계산됨");
  assert.equal(view.showEnterpriseValue, true);
  assert.equal(view.methodLabel, "EV / Sales");
  assert.equal(view.sourceLabel, "승인된 비교배수");
  assert.equal(view.evRangeLabel, "100억 원 ~ 200억 원");
  assert.match(view.disclaimer, /정밀 가치평가 결과가 아닙니다/);
  assert.doesNotMatch(view.copy, /매각가격/);
});

test("TEST 10 Seller UI: TEST_ONLY calculable result is not shown as amount", () => {
  const inputs = financials([mem("revenue", "10000000000")]);
  const result = calculateEvSales({
    financials: inputs,
    benchmark: { ...approvedRange(), approvalStatus: "TEST_ONLY" },
    mode: "unit_test",
  });
  assert.equal(result.status, "CALCULABLE");
  const view = sellerLevel0Presentation({
    hasConversation: true,
    financials: inputs,
    status: result.status,
    result,
    copy: MISSING_BENCHMARK_SELLER_COPY,
    benchmarkApproval: "TEST_ONLY",
  });
  assert.equal(view.showEnterpriseValue, false);
  assert.equal(view.evRangeLabel, null);
  assert.equal(view.statusLabel, "비교배수 확인 필요");
});

test("TEST 10 Seller UI: zero revenue → 계산 불가", () => {
  const result = calculateEvSales({
    financials: { revenueKrw: 0, revenueUnresolved: false, industry: null },
    benchmark: approvedRange(),
    mode: "production",
  });
  const view = sellerLevel0Presentation({
    hasConversation: true,
    financials: financials([
      mem("revenue", encodeNumericCriterion({ krw: 0, raw: "0" })),
    ]),
    status: result.status,
    result,
    copy: CALCULATION_ERROR_COPY,
    benchmarkApproval: "APPROVED",
  });
  assert.equal(view.statusLabel, "계산 불가");
  assert.equal(view.showEnterpriseValue, false);
  assert.equal(view.copy, CALCULATION_ERROR_COPY);
  assert.equal(view.tomExplanation, TOM_CALCULATION_ERROR_COPY);
});

test("TOM explanation is deterministic and does not invent numbers", () => {
  const missing = sellerLevel0Presentation({
    hasConversation: true,
    financials: financials([]),
    status: "MISSING_INPUT",
    result: null,
    copy: MISSING_FINANCIAL_COPY,
    benchmarkApproval: null,
  });
  assert.equal(missing.tomExplanation, TOM_MISSING_INPUT_COPY);

  const noBenchmark = sellerLevel0Presentation({
    hasConversation: true,
    financials: financials([mem("revenue", "10000000000")]),
    status: "MISSING_BENCHMARK",
    result: calculateEvSales({
      financials: financials([mem("revenue", "10000000000")]),
      benchmark: null,
      mode: "production",
    }),
    copy: MISSING_BENCHMARK_SELLER_COPY,
    benchmarkApproval: null,
  });
  assert.equal(noBenchmark.tomExplanation, TOM_MISSING_BENCHMARK_COPY);
  assert.doesNotMatch(noBenchmark.tomExplanation, /150억|1\.5|대략/);

  const inputs = financials([mem("revenue", "10000000000")]);
  const result = calculateEvSales({
    financials: inputs,
    benchmark: approvedRange(),
    mode: "production",
  });
  const calculable = sellerLevel0Presentation({
    hasConversation: true,
    financials: inputs,
    status: result.status,
    result,
    copy: null,
    benchmarkApproval: "APPROVED",
  });
  assert.equal(calculable.tomExplanation, TOM_CALCULABLE_EV_ONLY_COPY);
  assert.match(calculable.tomExplanation, /EV \/ Sales/);
  assert.match(calculable.tomExplanation, /Enterprise Value/);
  assert.match(calculable.tomExplanation, /Equity Value/);
  assert.doesNotMatch(calculable.tomExplanation, /매각가격에 팔/);
});
